/** Message types for main ↔ workflow worker */

import { ExecutionStatus } from '../engine/types/execution.types';

// Main → worker
export type MainToWorker =
  | { type: 'start'; payload: StartPayload }
  | { type: 'cancel' };

export interface StartPayload {
  executionId: string;
  workflowRow: {
    id: string;
    name: string;
    definition: string;
  };
}

// Worker → main
export type WorkerToMain =
  | { type: 'node-start'; nodeId: string; nodeName: string }
  | { type: 'node-done'; nodeId: string; nodeName: string; durationMs: number; outputItemCount: number }
  | { type: 'node-error'; nodeId: string; nodeName: string; error: string }
  | { type: 'log'; nodeId: string; level: string; message: string; itemIndex: number }
  | { type: 'done'; status: ExecutionStatus; durationMs: number; lastNodeExecuted?: string; error?: string; nodeResults: any }
  | { type: 'error'; error: string };

export interface RunningInstanceInfo {
  executionId: string;
  workflowId: string;
  workflowName: string;
  startedAt: Date;
  status: ExecutionStatus;
  nodeStatuses: Record<string, 'pending' | 'running' | 'success' | 'error'>;
}

export interface OrchestratorSettings {
  maxConcurrentExecutions: number;
  memoryThresholdMB: number;
}

export const DEFAULT_ORCHESTRATOR_SETTINGS: OrchestratorSettings = {
  maxConcurrentExecutions: 10,
  memoryThresholdMB: 512,
};
