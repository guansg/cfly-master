/**
 * Schema bootstrap for local settings + open-source workflow tables.
 */

import Database from 'better-sqlite3';

/** CREATE TABLE IF NOT EXISTS … */
export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS local_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      description   TEXT DEFAULT '',
      definition    TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'ready', 'archived')),
      tags          TEXT DEFAULT '[]',
      pinned        INTEGER DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      frozen_at     DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
    CREATE INDEX IF NOT EXISTS idx_workflows_updated ON workflows(updated_at DESC);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_versions (
      id            TEXT PRIMARY KEY,
      workflow_id   TEXT NOT NULL,
      version       INTEGER NOT NULL,
      definition    TEXT NOT NULL,
      change_note   TEXT DEFAULT '',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
      UNIQUE (workflow_id, version)
    );

    CREATE INDEX IF NOT EXISTS idx_wf_versions_workflow ON workflow_versions(workflow_id, version DESC);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id                  TEXT PRIMARY KEY,
      workflow_id         TEXT NOT NULL,
      mode                TEXT NOT NULL DEFAULT 'manual' CHECK(mode IN ('manual', 'schedule', 'trigger')),
      status              TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'success', 'failed', 'cancelled', 'paused', 'waiting')),
      start_node          TEXT,
      run_data            TEXT DEFAULT '{}',
      execution_data      TEXT DEFAULT '{}',
      waiting_execution   TEXT DEFAULT '{}',
      started_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at         DATETIME,
      duration_ms         INTEGER,
      error_message       TEXT,
      error_node          TEXT,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_wf_exec_workflow ON workflow_executions(workflow_id, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_wf_exec_status ON workflow_executions(status);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_node_executions (
      id              TEXT PRIMARY KEY,
      execution_id    TEXT NOT NULL,
      node_id         TEXT NOT NULL,
      node_name       TEXT NOT NULL,
      node_type       TEXT NOT NULL,
      run_index       INTEGER DEFAULT 0,
      status          TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'success', 'failed', 'skipped')),
      input_data      TEXT,
      output_data     TEXT,
      started_at      DATETIME,
      finished_at     DATETIME,
      duration_ms     INTEGER,
      retry_count     INTEGER DEFAULT 0,
      error_message   TEXT,
      FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_node_exec_execution ON workflow_node_executions(execution_id);
    CREATE INDEX IF NOT EXISTS idx_node_exec_node ON workflow_node_executions(execution_id, node_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_logs (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      execution_id    TEXT NOT NULL,
      node_name       TEXT,
      level           TEXT DEFAULT 'info' CHECK(level IN ('debug', 'info', 'warn', 'error')),
      message         TEXT NOT NULL,
      details         TEXT,
      timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_wf_logs_execution ON workflow_logs(execution_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_wf_logs_level ON workflow_logs(level);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_schedules (
      id                TEXT PRIMARY KEY,
      workflow_id       TEXT NOT NULL,
      trigger_type      TEXT NOT NULL DEFAULT 'cron' CHECK(trigger_type IN ('cron', 'interval', 'once')),
      cron_expression   TEXT,
      interval_ms       INTEGER,
      is_active         INTEGER DEFAULT 1,
      last_triggered_at DATETIME,
      next_trigger_at   DATETIME,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_wf_schedule_active ON workflow_schedules(is_active, next_trigger_at);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_variables (
      id            TEXT PRIMARY KEY,
      workflow_id   TEXT NOT NULL,
      key           TEXT NOT NULL,
      value         TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
      UNIQUE (workflow_id, key)
    );

    CREATE INDEX IF NOT EXISTS idx_wf_vars_workflow ON workflow_variables(workflow_id);
  `);
}

export function getDatabaseVersion(db: Database.Database): number {
  try {
    const result = db.prepare('PRAGMA user_version').get() as { user_version: number };
    return result.user_version;
  } catch (error) {
    console.error('[Database] Failed to get version:', error);
    return 0;
  }
}

export function setDatabaseVersion(db: Database.Database, version: number): void {
  try {
    db.prepare(`PRAGMA user_version = ${version}`).run();
    console.log(`[Database] Version set to ${version}`);
  } catch (error) {
    console.error('[Database] Failed to set version:', error);
  }
}

/** Bump PRAGMA user_version when schema expectations change */
export function migrateDatabase(db: Database.Database): void {
  const currentVersion = getDatabaseVersion(db);

  // Tables are created with IF NOT EXISTS above; migrations only adjust user_version.
  if (currentVersion < 1) {
    console.log(`[Database] Migrating user_version: ${currentVersion} -> 1 ...`);
    setDatabaseVersion(db, 1);
  }
}

