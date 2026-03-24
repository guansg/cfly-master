/** Workflow CRUD against SQLite */

import { getDatabase } from '../../database/db';
import { Workflow } from '../../database/types';
import { randomUUID } from 'crypto';

export class WorkflowDAO {
  create(data: { name: string; description?: string; definition: string; tags?: string }): Workflow {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO workflows (id, name, description, definition, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.description || '', data.definition, data.tags || '[]', now, now);

    return this.getById(id)!;
  }

  getById(id: string): Workflow | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) as any;
    return row ? this.mapRow(row) : null;
  }

  getAll(): Workflow[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM workflows ORDER BY pinned DESC, updated_at DESC').all() as any[];
    return rows.map(row => this.mapRow(row));
  }

  update(id: string, updates: Partial<Pick<Workflow, 'name' | 'description' | 'definition' | 'status' | 'tags' | 'pinned'>>): boolean {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.definition !== undefined) { fields.push('definition = ?'); values.push(updates.definition); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(updates.tags); }
    if (updates.pinned !== undefined) { fields.push('pinned = ?'); values.push(updates.pinned); }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const result = db.prepare(`UPDATE workflows SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return result.changes > 0;
  }

  save(id: string, definition: string, changeNote?: string): boolean {
    const db = getDatabase();

    try {
      db.prepare('BEGIN').run();

      const now = new Date().toISOString();
      db.prepare('UPDATE workflows SET definition = ?, updated_at = ? WHERE id = ?').run(definition, now, id);

      const maxVersion = db.prepare(
        'SELECT MAX(version) as max_ver FROM workflow_versions WHERE workflow_id = ?'
      ).get(id) as any;
      const nextVersion = (maxVersion?.max_ver || 0) + 1;

      db.prepare(`
        INSERT INTO workflow_versions (id, workflow_id, version, definition, change_note, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), id, nextVersion, definition, changeNote || '', now);

      db.prepare('COMMIT').run();
      return true;
    } catch (error) {
      db.prepare('ROLLBACK').run();
      console.error('[WorkflowDAO] Save failed:', error);
      return false;
    }
  }

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM workflows WHERE id = ?').run(id);
    return result.changes > 0;
  }

  private mapRow(row: any): Workflow {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      definition: row.definition,
      status: row.status,
      tags: row.tags || '[]',
      pinned: row.pinned || 0,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
      frozenAt: row.frozen_at ? new Date(row.frozen_at).getTime() : undefined,
    };
  }
}

export const workflowDAO = new WorkflowDAO();
