/**
 * Main-process orchestrator: worker lifecycle, concurrency, IPC bridge.
 */

import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';
import { BrowserWindow } from 'electron';
import {
  MainToWorker,
  WorkerToMain,
  OrchestratorSettings,
  DEFAULT_ORCHESTRATOR_SETTINGS,
  RunningInstanceInfo,
} from './types';
import { InstanceTracker } from './instance-tracker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ExecuteOptions {
  workflowId: string;
  workflowName: string;
  definition: string;
  mainWindow?: BrowserWindow | null;
}

export interface ExecuteResult {
  success: boolean;
  executionId?: string;
  status?: string;
  durationMs?: number;
  lastNodeExecuted?: string;
  error?: string;
  nodeResults?: any;
}

export class WorkflowOrchestrator {
  private settings: OrchestratorSettings;
  private tracker = new InstanceTracker();
  private workers = new Map<string, Worker>();

  constructor(settings: Partial<OrchestratorSettings> = {}) {
    this.settings = { ...DEFAULT_ORCHESTRATOR_SETTINGS, ...settings };
  }

  async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    const { workflowId, workflowName, definition, mainWindow } = options;

    if (!this.canStartNew()) {
      return {
        success: false,
        error: `Concurrency limit reached (max ${this.settings.maxConcurrentExecutions})`,
      };
    }

    const executionId = crypto.randomUUID();
    const startedAt = new Date();

    const instanceInfo: RunningInstanceInfo = {
      executionId,
      workflowId,
      workflowName,
      startedAt,
      status: 'running',
      nodeStatuses: {},
    };
    this.tracker.add(instanceInfo);

    return new Promise<ExecuteResult>((resolve) => {
      const workerPath = this.resolveWorkerPath();
      let worker: Worker;

      try {
        worker = new Worker(workerPath, {
          workerData: {
            executionId,
            workflowRow: { id: workflowId, name: workflowName, definition },
          },
        });
      } catch (err: any) {
        this.tracker.remove(executionId);
        resolve({ success: false, error: `Failed to start worker: ${err.message}` });
        return;
      }

      this.workers.set(executionId, worker);
      const startTime = Date.now();

      worker.on('message', (msg: WorkerToMain) => {
        switch (msg.type) {
          case 'node-start':
            this.tracker.updateNodeStatus(executionId, msg.nodeId, 'running');
            mainWindow?.webContents.send('workflow:node-start', {
              workflowId, executionId, nodeId: msg.nodeId,
            });
            break;

          case 'node-done':
            this.tracker.updateNodeStatus(executionId, msg.nodeId, 'success');
            mainWindow?.webContents.send('workflow:node-done', {
              workflowId, executionId, nodeId: msg.nodeId,
              durationMs: msg.durationMs, outputItemCount: msg.outputItemCount,
            });
            break;

          case 'node-error':
            this.tracker.updateNodeStatus(executionId, msg.nodeId, 'error');
            mainWindow?.webContents.send('workflow:node-error', {
              workflowId, executionId, nodeId: msg.nodeId, error: msg.error,
            });
            break;

          case 'log':
            mainWindow?.webContents.send('workflow:log', {
              workflowId, executionId, nodeId: msg.nodeId,
              level: msg.level, message: msg.message, itemIndex: msg.itemIndex,
            });
            break;

          case 'done':
            this.tracker.update(executionId, { status: msg.status as any });
            this.cleanup(executionId);
            resolve({
              success: true,
              executionId,
              status: msg.status,
              durationMs: msg.durationMs,
              lastNodeExecuted: msg.lastNodeExecuted,
              error: msg.error,
              nodeResults: msg.nodeResults,
            });
            break;

          case 'error':
            this.tracker.update(executionId, { status: 'error' });
            this.cleanup(executionId);
            resolve({ success: false, error: msg.error });
            break;
        }
      });

      worker.on('error', (err) => {
        this.tracker.update(executionId, { status: 'error' });
        this.cleanup(executionId);
        resolve({ success: false, error: err.message });
      });

      worker.on('exit', (code) => {
        if (this.workers.has(executionId)) {
          this.tracker.update(executionId, { status: code === 0 ? 'success' : 'error' });
          this.cleanup(executionId);
          resolve({
            success: code === 0,
            executionId,
            durationMs: Date.now() - startTime,
            error: code !== 0 ? `Worker exited with code ${code}` : undefined,
          });
        }
      });

      const startMsg: MainToWorker = {
        type: 'start',
        payload: { executionId, workflowRow: { id: workflowId, name: workflowName, definition } },
      };
      worker.postMessage(startMsg);
    });
  }

  cancel(executionId: string): void {
    const worker = this.workers.get(executionId);
    if (worker) {
      const msg: MainToWorker = { type: 'cancel' };
      worker.postMessage(msg);
      setTimeout(() => worker.terminate(), 3000);
    }
  }

  cancelAll(): void {
    for (const executionId of this.workers.keys()) {
      this.cancel(executionId);
    }
  }

  getRunningInstances(): RunningInstanceInfo[] {
    return this.tracker.getAll();
  }

  getRunningCount(): number {
    return this.tracker.getRunningCount();
  }

  private canStartNew(): boolean {
    const runningCount = this.tracker.getRunningCount();
    if (runningCount >= this.settings.maxConcurrentExecutions) return false;

    const memUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memUsageMB > this.settings.memoryThresholdMB) return false;

    return true;
  }

  private cleanup(executionId: string): void {
    const worker = this.workers.get(executionId);
    if (worker) {
      worker.terminate().catch(() => {});
      this.workers.delete(executionId);
    }
    setTimeout(() => this.tracker.remove(executionId), 30000);
  }

  private resolveWorkerPath(): string {
    return path.join(__dirname, 'workflow-worker.js');
  }
}

export const workflowOrchestrator = new WorkflowOrchestrator();
