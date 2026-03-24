/**
 * Row shapes for workflow-related tables (TypeScript layer).
 */

export interface LocalSetting {
  key: string;
  value: string;
  updatedAt: number;
}

export type WorkflowStatus = 'draft' | 'ready' | 'archived';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  definition: string;
  status: WorkflowStatus;
  tags: string;
  pinned: number;
  createdAt: number;
  updatedAt: number;
  frozenAt?: number;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  definition: string;
  changeNote: string;
  createdAt: number;
}

export type ExecutionMode = 'manual' | 'schedule' | 'trigger';
export type ExecutionStatus = 'running' | 'success' | 'failed' | 'cancelled' | 'paused' | 'waiting';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  mode: ExecutionMode;
  status: ExecutionStatus;
  startNode?: string;
  runData: string;
  executionData: string;
  waitingExecution: string;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  errorMessage?: string;
  errorNode?: string;
}

export type NodeExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface WorkflowNodeExecution {
  id: string;
  executionId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  runIndex: number;
  status: NodeExecutionStatus;
  inputData?: string;
  outputData?: string;
  startedAt?: number;
  finishedAt?: number;
  durationMs?: number;
  retryCount: number;
  errorMessage?: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface WorkflowLog {
  id: number;
  executionId: string;
  nodeName?: string;
  level: LogLevel;
  message: string;
  details?: string;
  timestamp: number;
}

export type ScheduleTriggerType = 'cron' | 'interval' | 'once';

export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  triggerType: ScheduleTriggerType;
  cronExpression?: string;
  intervalMs?: number;
  isActive: number;
  lastTriggeredAt?: number;
  nextTriggerAt?: number;
  createdAt: number;
}

export interface WorkflowVariable {
  id: string;
  workflowId: string;
  key: string;
  value?: string;
  createdAt: number;
  updatedAt: number;
}

