/**
 * Typed postMessage bridge between the workflow worker and the main process.
 */

import { parentPort } from 'worker_threads';
import { WorkerToMain } from '../orchestrator/types';

export class WorkerBridge {
  send(msg: WorkerToMain): void {
    parentPort?.postMessage(msg);
  }

  sendNodeStart(nodeId: string, nodeName: string): void {
    this.send({ type: 'node-start', nodeId, nodeName });
  }

  sendNodeDone(nodeId: string, nodeName: string, durationMs: number, outputItemCount: number): void {
    this.send({ type: 'node-done', nodeId, nodeName, durationMs, outputItemCount });
  }

  sendNodeError(nodeId: string, nodeName: string, error: string): void {
    this.send({ type: 'node-error', nodeId, nodeName, error });
  }

  sendLog(nodeId: string, level: string, message: string, itemIndex: number): void {
    this.send({ type: 'log', nodeId, level, message, itemIndex });
  }

  sendDone(status: any, durationMs: number, lastNodeExecuted?: string, error?: string, nodeResults?: any): void {
    this.send({ type: 'done', status, durationMs, lastNodeExecuted, error, nodeResults: nodeResults || {} });
  }

  sendError(error: string): void {
    this.send({ type: 'error', error });
  }
}
