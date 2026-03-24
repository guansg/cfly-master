/**
 * Core workflow runner (n8n WorkflowExecute–style).
 */

import crypto from 'crypto';
import { Workflow } from './workflow';
import { ExpressionEngine } from './expression';
import { ExecutionContext } from './execution-context';
import { INodeExecutionData } from '../types/data.types';
import { INode } from '../types/workflow.types';
import {
  IRunExecutionData,
  IExecuteData,
  IRunResult,
  ExecutionStatus,
  NodeRegistry,
  ISourceData,
} from '../types/execution.types';
import { ExecutionHooks, ExecutionLogger } from '../types/context.types';
import { ApplicationError, InfiniteLoopError } from '../types/errors';
import { BaseNode } from '../../nodes/base-node';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class WorkflowExecute {
  private runExecutionData: IRunExecutionData;
  private workflow: Workflow;
  private nodeRegistry: NodeRegistry;
  private hooks: ExecutionHooks;
  private expressionEngine = new ExpressionEngine();
  private abortController = new AbortController();
  private status: ExecutionStatus = 'new';
  private executionId = crypto.randomUUID();
  private startedAt = new Date();
  private cleanupFunctions: Array<() => Promise<void>> = [];
  private runtimeVariables: Record<string, any> = {};
  private createLoggerFn?: (node: INode) => ExecutionLogger;

  private get nodeExecutionStack() { return this.runExecutionData.executionData.nodeExecutionStack; }
  private get waitingExecution() { return this.runExecutionData.executionData.waitingExecution; }
  private get runData() { return this.runExecutionData.resultData.runData; }

  getStatus(): ExecutionStatus {
    return this.status;
  }

  constructor(options: {
    workflow: Workflow;
    nodeRegistry: NodeRegistry;
    hooks?: ExecutionHooks;
    startNode?: INode;
    /** Optional factory (e.g. in worker) to forward logs to the main process / UI */
    createLogger?: (node: INode) => ExecutionLogger;
  }) {
    this.workflow = options.workflow;
    this.nodeRegistry = options.nodeRegistry;
    this.hooks = options.hooks || {};
    this.createLoggerFn = options.createLogger;
    this.runExecutionData = this.createRunExecutionData(options.startNode);
  }

  private createRunExecutionData(startNode?: INode): IRunExecutionData {
    const stack: IExecuteData[] = [];

    if (startNode) {
      stack.push({ node: startNode, data: { main: [[{ json: {} }]] } });
    } else {
      const triggers = this.workflow.getTriggerNodes().filter(n => !n.disabled);
      for (const trigger of triggers) {
        stack.push({ node: trigger, data: { main: [[{ json: {} }]] } });
      }
    }

    return {
      version: 1,
      executionData: {
        nodeExecutionStack: stack,
        waitingExecution: {},
        waitingExecutionSource: {},
      },
      resultData: { runData: {} },
    };
  }

  async execute(): Promise<IRunResult> {
    try {
      const result = await this.executeLoop();
      await this.runCleanupFunctions();
      return result;
    } catch (error) {
      await this.runCleanupFunctions();
      this.runExecutionData.resultData.error = error as any;
      return this.buildResult('error');
    }
  }

  cancel(): void {
    this.status = 'canceled';
    for (const nodeId in this.runData) {
      for (const task of this.runData[nodeId]) {
        if (task.executionStatus === 'running') task.executionStatus = 'canceled';
      }
    }
    this.abortController.abort();
  }

  private async runCleanupFunctions(): Promise<void> {
    for (const fn of this.cleanupFunctions) {
      try { await fn(); } catch (e) { console.error('[WorkflowExecute] Cleanup error:', e); }
    }
    this.cleanupFunctions = [];
  }

  private async executeLoop(): Promise<IRunResult> {
    this.status = 'running';

    if (this.nodeExecutionStack.length === 0) {
      throw new ApplicationError('No node to start the workflow from could be found');
    }

    this.hooks.onBeforeExecute?.(this.workflow);

    const globalTimeout = this.workflow.settings?.timeout || 30 * 60 * 1000;
    const timeoutId = setTimeout(() => this.abortController.abort(), globalTimeout);

    let lastExecutionTry = '';
    let executionStepCount = 0;
    const maxSteps = this.workflow.settings?.maxExecutionSteps || 10000;

    const enqueueFn: 'unshift' | 'push' =
      this.workflow.settings?.executionOrder === 'v1' ? 'unshift' : 'push';

    try {
      while (this.nodeExecutionStack.length !== 0) {
        if (this.abortController.signal.aborted) {
          const result = this.buildResult('canceled');
          await this.hooks.onAfterExecute?.(result);
          return result;
        }

        executionStepCount++;
        if (executionStepCount > maxSteps) {
          throw new InfiniteLoopError(
            `Workflow exceeded maximum steps (${maxSteps}). Possible infinite loop.`
          );
        }

        const executeData = this.nodeExecutionStack.shift()!;
        const node = executeData.node;
        const runIndex = executeData.runIndex ?? (this.runData[node.id]?.length || 0);

        const executionTry = `${node.id}:${runIndex}`;
        if (executionTry === lastExecutionTry) {
          throw new InfiniteLoopError(`Node "${node.name}" executed consecutively without progress`);
        }
        lastExecutionTry = executionTry;

        const rawMain = executeData.data.main || [];
        const inputPorts: INodeExecutionData[][] = rawMain.map((p) => (p == null ? [] : p));
        const inputItems = inputPorts[0]?.length ? inputPorts[0] : [{ json: {} }];

        if (node.disabled) {
          this.forwardToAllOutputs(node, inputPorts[0] || [], enqueueFn);
          continue;
        }

        this.hooks.onBeforeNode?.(node, inputItems);

        const nodeType = this.nodeRegistry.get(node.type);
        if (!nodeType) {
          throw new ApplicationError(`Unknown node type: ${node.type}`, {
            extra: { nodeId: node.id, nodeType: node.type },
          });
        }

        const startTime = Date.now();
        this.runData[node.id] = this.runData[node.id] || [];
        this.runData[node.id].push({ startTime, executionTime: 0, executionStatus: 'running' });

        try {
          const output = await this.executeNodeWithRetry(nodeType, node, inputPorts, runIndex);
          const executionTime = Date.now() - startTime;

          this.runData[node.id][runIndex] = {
            startTime,
            executionTime,
            executionStatus: 'success',
            data: output ? { main: output } : undefined,
          };

          this.hooks.onAfterNode?.(node, output || [], executionTime);
          this.runExecutionData.resultData.lastNodeExecuted = node.id;

          if (output) {
            this.addChildNodesToStack(node, output, runIndex, enqueueFn);
          }
        } catch (error: any) {
          const executionTime = Date.now() - startTime;
          this.runData[node.id][runIndex] = {
            startTime, executionTime, executionStatus: 'error', error,
          };
          this.hooks.onNodeError?.(node, error);

          const resolved = this.applyErrorStrategy(node, error, enqueueFn);
          if (!resolved) {
            this.runExecutionData.resultData.error = error;
            const result = this.buildResult('error');
            await this.hooks.onAfterExecute?.(result);
            return result;
          }
        }
      }

      const result = this.buildResult('success');
      await this.hooks.onAfterExecute?.(result);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async executeNodeWithRetry(
    nodeType: any,
    node: INode,
    inputPorts: INodeExecutionData[][],
    runIndex: number,
  ): Promise<INodeExecutionData[][]> {
    const maxTries = node.retryOnFail
      ? Math.min(5, Math.max(2, node.maxTries || 3))
      : 1;
    const waitBetween = node.waitBetweenTries || 1000;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxTries; attempt++) {
      if (attempt > 0) {
        await sleep(waitBetween);
        if (this.abortController.signal.aborted) throw lastError!;
      }

      try {
        const context = this.createContext(node, inputPorts, runIndex);

        if (nodeType instanceof BaseNode) {
          return await nodeType.run(context);
        }
        return await nodeType.execute(context);
      } catch (error: any) {
        lastError = error;
        if (!node.retryOnFail || attempt === maxTries - 1) throw error;
      }
    }

    throw lastError!;
  }

  /** Error strategy: return true if handled (continue), false to abort. */
  private applyErrorStrategy(node: INode, error: Error, enqueueFn: 'unshift' | 'push'): boolean {
    const strategy = node.errorStrategy || 'stop';

    if (strategy === 'useDefault') {
      const defaultData: INodeExecutionData = {
        json: {
          ...(node.defaultOutput || {}),
          isFallback: true,
          errorMessage: error.message,
        },
      };
      this.forwardToAllOutputs(node, [defaultData], enqueueFn);
      return true;
    }

    if (strategy === 'failBranch') {
      const connections = this.workflow.connectionsBySource[node.id];
      if (!connections) return false;

      const outputs = connections.main || [];
      const lastPortIndex = outputs.length - 1;
      if (lastPortIndex < 1) {
        console.warn(`[WorkflowExecute] failBranch on node "${node.name}" but only ${outputs.length} output port(s)`);
        return false;
      }

      const errorData: INodeExecutionData = {
        json: { error: error.message, errorStack: error.stack },
      };

      const portConnections = outputs[lastPortIndex];
      if (portConnections) {
        for (const conn of portConnections) {
          const targetNode = this.workflow.getNode(conn.node);
          if (targetNode) {
            this.nodeExecutionStack[enqueueFn]({
              node: targetNode,
              data: { main: [[errorData]] },
              source: { main: [{ previousNode: node.id, previousNodeOutput: lastPortIndex }] },
            });
          }
        }
      }
      return true;
    }

    return false;
  }

  private createContext(node: INode, inputPorts: INodeExecutionData[][], runIndex: number): ExecutionContext {
    return new ExecutionContext({
      inputPorts,
      node,
      executionId: this.executionId,
      variables: this.workflow.variables,
      runtimeVariables: this.runtimeVariables,
      expressionEngine: this.expressionEngine,
      logger: this.createLogger(node),
      abortSignal: this.abortController.signal,
      cleanupFns: this.cleanupFunctions,
      workflowMeta: { id: this.workflow.id, name: this.workflow.name },
      runIndex,
    });
  }

  private addChildNodesToStack(
    node: INode,
    output: INodeExecutionData[][],
    _runIndex: number,
    enqueueFn: 'unshift' | 'push',
  ): void {
    const connections = this.workflow.connectionsBySource[node.id];
    if (!connections) return;

    const outputPorts = connections.main || [];

    for (let outputIndex = 0; outputIndex < outputPorts.length; outputIndex++) {
      const portConnections = outputPorts[outputIndex];
      if (!portConnections) continue;

      const outputData = output[outputIndex];
      if (!outputData || outputData.length === 0) continue;

      for (const connection of portConnections) {
        const targetNode = this.workflow.getNode(connection.node);
        if (!targetNode) continue;

        const parentNodes = this.workflow.getParentNodes(targetNode.id);
        if (parentNodes.length <= 1) {
          this.nodeExecutionStack[enqueueFn]({
            node: targetNode,
            data: { main: [outputData] },
            source: { main: [{ previousNode: node.id, previousNodeOutput: outputIndex }] },
          });
        } else {
          this.addToWaitingExecution(targetNode, connection.index, outputData, {
            previousNode: node.id,
            previousNodeOutput: outputIndex,
          }, enqueueFn);
        }
      }
    }
  }

  private addToWaitingExecution(
    node: INode,
    inputIndex: number,
    data: INodeExecutionData[],
    _source: ISourceData,
    enqueueFn: 'unshift' | 'push',
  ): void {
    const nodeId = node.id;
    const runIndex = this.runData[nodeId]?.length || 0;

    if (!this.waitingExecution[nodeId]) {
      this.waitingExecution[nodeId] = {};
    }
    if (!this.waitingExecution[nodeId][runIndex]) {
      this.waitingExecution[nodeId][runIndex] = { main: [] };
    }

    const waiting = this.waitingExecution[nodeId][runIndex];
    while (waiting.main.length <= inputIndex) {
      waiting.main.push(null);
    }
    waiting.main[inputIndex] = data;

    const parentCount = this.workflow.getParentNodes(nodeId).length;
    const receivedCount = waiting.main.filter(d => d !== null).length;

    if (receivedCount >= parentCount) {
      this.nodeExecutionStack[enqueueFn]({
        node,
        data: { main: waiting.main },
        runIndex,
      });
      delete this.waitingExecution[nodeId][runIndex];
    }
  }

  private forwardToAllOutputs(
    node: INode,
    data: INodeExecutionData[],
    enqueueFn: 'unshift' | 'push',
  ): void {
    const connections = this.workflow.connectionsBySource[node.id];
    if (!connections) return;

    for (const portConnections of connections.main) {
      if (!portConnections) continue;
      for (const conn of portConnections) {
        const target = this.workflow.getNode(conn.node);
        if (target) {
          this.nodeExecutionStack[enqueueFn]({
            node: target,
            data: { main: [data] },
          });
        }
      }
    }
  }

  private createLogger(node: INode): ExecutionLogger {
    if (this.createLoggerFn) {
      return this.createLoggerFn(node);
    }
    const prefix = `[${node.name}]`;
    return {
      info: (msg, meta) => console.log(prefix, msg, meta || ''),
      warn: (msg, meta) => console.warn(prefix, msg, meta || ''),
      error: (msg, meta) => console.error(prefix, msg, meta || ''),
      debug: (msg, meta) => console.debug(prefix, msg, meta || ''),
    };
  }

  private buildResult(status: ExecutionStatus): IRunResult {
    this.status = status;
    return {
      data: this.runExecutionData,
      status,
      startedAt: this.startedAt,
      stoppedAt: new Date(),
    };
  }
}
