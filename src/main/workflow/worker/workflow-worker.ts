/**
 * Workflow worker thread entry: receives workerData, runs the engine, reports status via WorkerBridge.
 */

import { workerData } from 'worker_threads';
import { WorkerBridge } from './worker-bridge';
import { Workflow } from '../engine/core/workflow';
import { WorkflowExecute } from '../engine/core/workflow-execute';
import { createDefaultRegistry } from '../nodes';
import { StartPayload } from '../orchestrator/types';
import { repairMergeInboundConnectionIndices } from '@shared/workflow/repair-merge-connections';

const bridge = new WorkerBridge();

async function run() {
  const { workflowRow } = workerData as StartPayload;

  let definition: any;
  try {
    definition = JSON.parse(workflowRow.definition);
  } catch {
    bridge.sendError('Invalid workflow definition JSON');
    return;
  }

  repairMergeInboundConnectionIndices(definition);

  definition.id = workflowRow.id;
  definition.name = workflowRow.name;
  if (!definition.createdAt) definition.createdAt = new Date().toISOString();
  if (!definition.updatedAt) definition.updatedAt = new Date().toISOString();

  const workflow = new Workflow(definition);
  const registry = createDefaultRegistry();
  const startTime = Date.now();

  const executor = new WorkflowExecute({
    workflow,
    nodeRegistry: registry,
    createLogger: (node) => {
      const prefix = `[${node.name}]`;
      const forward =
        (level: 'info' | 'warn' | 'error' | 'debug') =>
        (msg: string, meta?: Record<string, any>) => {
          const itemIndex = meta?.itemIndex ?? 0;
          if (level === 'info') console.log(prefix, msg, meta || '');
          else if (level === 'warn') console.warn(prefix, msg, meta || '');
          else if (level === 'error') console.error(prefix, msg, meta || '');
          else console.debug(prefix, msg, meta || '');
          bridge.sendLog(node.id, level, String(msg), itemIndex);
        };
      return {
        info: forward('info'),
        warn: forward('warn'),
        error: forward('error'),
        debug: forward('debug'),
      };
    },
    hooks: {
      onBeforeNode: (node) => {
        bridge.sendNodeStart(node.id, node.name);
      },
      onAfterNode: (node, output, durationMs) => {
        bridge.sendNodeDone(node.id, node.name, durationMs, output?.[0]?.length || 0);
      },
      onNodeError: (node, error) => {
        bridge.sendNodeError(node.id, node.name, error.message);
      },
    },
  });

  try {
    const result = await executor.execute();
    const durationMs = Date.now() - startTime;

    const nodeResults = Object.fromEntries(
      Object.entries(result.data.resultData.runData).map(([nodeId, runs]) => [
        nodeId,
        runs.map((r: any) => ({
          status: r.executionStatus,
          executionTime: r.executionTime,
          outputItems: r.data?.main?.[0]?.length || 0,
          error: r.error?.message,
        })),
      ]),
    );

    bridge.sendDone(
      result.status,
      durationMs,
      result.data.resultData.lastNodeExecuted,
      result.data.resultData.error?.message,
      nodeResults,
    );
  } catch (error: any) {
    bridge.sendError(error.message);
  }
}

run().catch((err) => bridge.sendError(err.message));
