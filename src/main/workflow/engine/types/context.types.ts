/**
 * Execution context and hook types.
 */

import { INodeExecutionData } from './data.types';
import { INode } from './workflow.types';
import { IRunResult } from './execution.types';

export interface IExecuteContext {
  /** Multi-input nodes: read by port index; default 0 matches legacy single-input behavior. */
  getInputData(inputIndex?: number): INodeExecutionData[];
  getNodeParameter<T = any>(name: string, itemIndex?: number, fallbackValue?: T): T;
  getVariable(key: string): any;
  setVariable(key: string, value: any): void;
  getNode(): INode;
  getWorkflow(): { id: string; name: string; variables: Record<string, any> };
  getExecutionId(): string;
  getIdempotencyKey(itemIndex: number): string;
  evaluateExpression(expression: string, itemIndex: number): any;
  registerCleanup(fn: () => Promise<void>): void;
  checkAborted(): void;
  logger: ExecutionLogger;
}

export interface ExecutionLogger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

export interface ExecutionHooks {
  onBeforeExecute?(workflow: any): void;
  onAfterExecute?(result: IRunResult): void | Promise<void>;
  onBeforeNode?(node: INode, input: INodeExecutionData[]): void;
  onAfterNode?(node: INode, output: INodeExecutionData[][], durationMs: number): void;
  onNodeError?(node: INode, error: Error): void;
  onCheckpoint?(data: any): void | Promise<void>;
}
