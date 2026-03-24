/** Tracks in-flight runs (for a future task UI) */

import { RunningInstanceInfo } from './types';

export class InstanceTracker {
  private instances = new Map<string, RunningInstanceInfo>();

  add(info: RunningInstanceInfo): void {
    this.instances.set(info.executionId, info);
  }

  update(executionId: string, partial: Partial<RunningInstanceInfo>): void {
    const existing = this.instances.get(executionId);
    if (existing) {
      Object.assign(existing, partial);
    }
  }

  updateNodeStatus(executionId: string, nodeId: string, status: RunningInstanceInfo['nodeStatuses'][string]): void {
    const instance = this.instances.get(executionId);
    if (instance) {
      instance.nodeStatuses[nodeId] = status;
    }
  }

  remove(executionId: string): void {
    this.instances.delete(executionId);
  }

  get(executionId: string): RunningInstanceInfo | undefined {
    return this.instances.get(executionId);
  }

  getAll(): RunningInstanceInfo[] {
    return Array.from(this.instances.values());
  }

  getRunningCount(): number {
    return Array.from(this.instances.values()).filter(i => i.status === 'running').length;
  }
}
