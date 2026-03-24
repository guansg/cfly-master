/**
 * SQLite connection singleton (userData/data.db).
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { initializeSchema, migrateDatabase } from './schema';

let db: Database.Database | null = null;

/** Open or return the shared DB handle */
export function getDatabase(): Database.Database {
  if (!db) {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, 'data.db');
    console.log('[Database] Opening database at:', dbPath);

    try {
      db = new Database(dbPath);

      // WAL for better read/write concurrency
      db.pragma('journal_mode = WAL');

      db.pragma('foreign_keys = ON');

      db.pragma('synchronous = NORMAL');
      // ~64MB page cache (negative = KB)
      db.pragma('cache_size = -65536');
      db.pragma('busy_timeout = 5000');
      db.pragma('temp_store = MEMORY');

      initializeSchema(db);

      migrateDatabase(db);

      console.log('[Database] Database initialized successfully');
    } catch (error) {
      console.error('[Database] Failed to initialize database:', error);
      throw error;
    }
  }

  return db;
}

export function closeDatabase(): void {
  if (db) {
    try {
      db.close();
      db = null;
      console.log('[Database] Database closed');
    } catch (error) {
      console.error('[Database] Failed to close database:', error);
    }
  }
}

export function backupDatabase(backupPath: string): void {
  const db = getDatabase();
  try {
    db.backup(backupPath);
    console.log('[Database] Backup created at:', backupPath);
  } catch (error) {
    console.error('[Database] Failed to create backup:', error);
    throw error;
  }
}

export function getDatabaseStats(): {
  workflowsCount: number;
  workflowExecutionsCount: number;
  dbSize: number;
} {
  const db = getDatabase();
  
  try {
    const workflowsCount = db.prepare('SELECT COUNT(*) as count FROM workflows').get() as { count: number };
    const workflowExecutionsCount = db.prepare('SELECT COUNT(*) as count FROM workflow_executions').get() as {
      count: number;
    };
    
    const dbPath = path.join(app.getPath('userData'), 'data.db');
    const dbSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;

    return {
      workflowsCount: workflowsCount.count,
      workflowExecutionsCount: workflowExecutionsCount.count,
      dbSize,
    };
  } catch (error) {
    console.error('[Database] Failed to get stats:', error);
    return {
      workflowsCount: 0,
      workflowExecutionsCount: 0,
      dbSize: 0,
    };
  }
}

