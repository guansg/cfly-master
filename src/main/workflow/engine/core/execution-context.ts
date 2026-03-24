/**
 * Per-node execution context (parameters, inputs, expressions).
 */

import { INodeExecutionData } from '../types/data.types';
import { INode } from '../types/workflow.types';
import { IExecuteContext, ExecutionLogger } from '../types/context.types';
import { ExpressionEngine } from './expression';

export class ExecutionContext implements IExecuteContext {
  /** Items per input port; single-input nodes use [[...items]] */
  private inputPorts: INodeExecutionData[][];
  private node: INode;
  private executionId: string;
  private variables: Record<string, any>;
  private runtimeVariables: Record<string, any>;
  private expressionEngine: ExpressionEngine;
  private abortSignal: AbortSignal;
  private cleanupFns: Array<() => Promise<void>>;
  private workflowMeta: { id: string; name: string };
  private runIndex: number;
  logger: ExecutionLogger;

  constructor(params: {
    inputPorts: INodeExecutionData[][];
    node: INode;
    executionId: string;
    variables: Record<string, any>;
    runtimeVariables: Record<string, any>;
    expressionEngine: ExpressionEngine;
    logger: ExecutionLogger;
    abortSignal: AbortSignal;
    cleanupFns: Array<() => Promise<void>>;
    workflowMeta: { id: string; name: string };
    runIndex?: number;
  }) {
    this.inputPorts = params.inputPorts.length > 0 ? params.inputPorts : [[]];
    this.node = params.node;
    this.executionId = params.executionId;
    this.variables = params.variables;
    this.runtimeVariables = params.runtimeVariables;
    this.expressionEngine = params.expressionEngine;
    this.logger = params.logger;
    this.abortSignal = params.abortSignal;
    this.cleanupFns = params.cleanupFns;
    this.workflowMeta = params.workflowMeta;
    this.runIndex = params.runIndex ?? 0;
  }

  getInputData(inputIndex = 0): INodeExecutionData[] {
    return this.inputPorts[inputIndex] ?? [];
  }

  /** Primary stream for expressions / parameters: first input port */
  private primaryInput(): INodeExecutionData[] {
    return this.inputPorts[0] ?? [];
  }

  getNodeParameter<T = any>(name: string, itemIndex: number = 0, fallbackValue?: T): T {
    const raw = this.node.parameters[name];
    if (raw === undefined) return fallbackValue as T;
    if (typeof raw === 'string' && raw.includes('{{')) {
      return this.expressionEngine.evaluate(raw, this.primaryInput(), itemIndex, this.variables, {
        runIndex: this.runIndex,
        executionId: this.executionId,
        workflowId: this.workflowMeta.id,
        workflowName: this.workflowMeta.name,
      }) as T;
    }
    return raw as T;
  }

  getVariable(key: string): any {
    return this.runtimeVariables[key] ?? this.variables[key];
  }

  setVariable(key: string, value: any): void {
    this.runtimeVariables[key] = value;
  }

  getNode(): INode {
    return this.node;
  }

  getWorkflow(): { id: string; name: string; variables: Record<string, any> } {
    return { ...this.workflowMeta, variables: this.variables };
  }

  getExecutionId(): string {
    return this.executionId;
  }

  getIdempotencyKey(itemIndex: number): string {
    return `${this.executionId}:${this.node.id}:${itemIndex}`;
  }

  evaluateExpression(expression: string, itemIndex: number): any {
    return this.expressionEngine.evaluate(expression, this.primaryInput(), itemIndex, this.variables, {
      runIndex: this.runIndex,
      executionId: this.executionId,
      workflowId: this.workflowMeta.id,
      workflowName: this.workflowMeta.name,
    });
  }

  registerCleanup(fn: () => Promise<void>): void {
    this.cleanupFns.push(fn);
  }

  checkAborted(): void {
    if (this.abortSignal.aborted) {
      throw new Error('Execution was cancelled');
    }
  }
}
