/** Runtime execution state (n8n IRunExecutionData–style) */

import { INodeExecutionData } from './data.types';
import { INode } from './workflow.types';

export type ExecutionStatus = 'new' | 'running' | 'success' | 'error' | 'canceled' | 'waiting';

export interface IRunExecutionData {
  version: 1;
  executionData: {
    nodeExecutionStack: IExecuteData[];
    waitingExecution: IWaitingExecution;
    waitingExecutionSource: IWaitingExecutionSource;
    runtimeVariables?: Record<string, any>;
    contextData?: Record<string, any>;
  };
  resultData: {
    runData: IRunData;
    lastNodeExecuted?: string;
    error?: ExecutionError;
    pinData?: Record<string, INodeExecutionData[]>;
  };
  startData?: {
    destinationNode?: IDestinationNode;
    runNodeFilter?: string[];
  };
  parentExecution?: {
    executionId: string;
    workflowId: string;
  };
  waitTill?: Date;
}

export interface IDestinationNode {
  nodeName: string;
  mode: 'inclusive' | 'exclusive';
}

export interface IWaitingExecution {
  [nodeId: string]: {
    [runIndex: number]: {
      main: Array<INodeExecutionData[] | null>;
    };
  };
}

export interface IWaitingExecutionSource {
  [nodeId: string]: {
    [runIndex: number]: {
      main: Array<ISourceData | null>;
    };
  };
}

export interface IExecuteData {
  node: INode;
  data: {
    main: Array<INodeExecutionData[] | null>;
  };
  source?: {
    main: Array<ISourceData | null>;
  };
  runIndex?: number;
}

export interface IRunData {
  [nodeId: string]: INodeExecutionResult[];
}

export interface INodeExecutionResult {
  startTime: number;
  executionTime: number;
  executionStatus?: 'running' | 'success' | 'error' | 'canceled';
  data?: {
    main: INodeExecutionData[][];
  };
  error?: Error;
  source?: ISourceData[];
}

export interface ISourceData {
  previousNode: string;
  previousNodeOutput?: number;
  previousNodeRun?: number;
}

export interface IRunResult {
  data: IRunExecutionData;
  status: ExecutionStatus;
  startedAt: Date;
  stoppedAt: Date;
}

export interface ExecutionError extends Error {
  node?: INode;
  timestamp?: Date;
}

export interface WorkflowExecuteOptions {
  workflow: import('../core/workflow').Workflow;
  nodeRegistry: NodeRegistry;
  hooks?: import('./context.types').ExecutionHooks;
  startNode?: INode;
}

export interface NodeRegistry {
  get(type: string): import('./node.types').INodeType | undefined;
  register(nodeType: import('./node.types').INodeType): void;
  getAll(): import('./node.types').INodeType[];
}
