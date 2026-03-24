/** Execution rows DAO (stub for future phases) */

import { getDatabase } from '../../database/db';
import { randomUUID } from 'crypto';

export class ExecutionDAO {
  create(data: {
    workflowId: string;
    mode: string;
    status: string;
    startedAt: string;
  }): string {
    const db = getDatabase();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO workflow_executions (id, workflow_id, mode, status, started_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.workflowId, data.mode, data.status, data.startedAt);
    return id;
  }

  updateStatus(id: string, status: string, finishedAt?: string): void {
    const db = getDatabase();
    if (finishedAt) {
      db.prepare('UPDATE workflow_executions SET status = ?, finished_at = ? WHERE id = ?').run(status, finishedAt, id);
    } else {
      db.prepare('UPDATE workflow_executions SET status = ? WHERE id = ?').run(status, id);
    }
  }

  updateRunData(id: string, runData: string): void {
    const db = getDatabase();
    db.prepare('UPDATE workflow_executions SET run_data = ? WHERE id = ?').run(runData, id);
  }
}

export const executionDAO = new ExecutionDAO();
