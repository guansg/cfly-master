/**
 * Local settings DAO — persist and read app preferences in SQLite.
 */

import { getDatabase } from '../db';

/** Single row in local_settings */
export interface LocalSetting {
  key: string;
  value: string | null;
  updated_at: number;
}

class SettingsDAO {
  /**
   * Read a setting.
   * @param key Setting key
   * @param defaultValue Used when the row is missing
   */
  get(key: string, defaultValue: string | null = null): string | null {
    const db = getDatabase();
    try {
      const result = db.prepare(
        'SELECT value FROM local_settings WHERE key = ?'
      ).get(key) as { value: string | null } | undefined;
      
      return result?.value ?? defaultValue;
    } catch (error) {
      console.error(`[SettingsDAO] Failed to get setting '${key}':`, error);
      return defaultValue;
    }
  }

  /**
   * Upsert a setting.
   * @param key Setting key
   * @param value New value (null clears)
   */
  set(key: string, value: string | null): boolean {
    const db = getDatabase();
    try {
      const now = Date.now();
      db.prepare(`
        INSERT INTO local_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
      `).run(key, value, now, value, now);
      
      console.log(`[SettingsDAO] Setting '${key}' updated`);
      return true;
    } catch (error) {
      console.error(`[SettingsDAO] Failed to set setting '${key}':`, error);
      return false;
    }
  }

  /** Delete one setting by key. */
  delete(key: string): boolean {
    const db = getDatabase();
    try {
      db.prepare('DELETE FROM local_settings WHERE key = ?').run(key);
      console.log(`[SettingsDAO] Setting '${key}' deleted`);
      return true;
    } catch (error) {
      console.error(`[SettingsDAO] Failed to delete setting '${key}':`, error);
      return false;
    }
  }

  /** Return all rows in local_settings */
  getAll(): LocalSetting[] {
    const db = getDatabase();
    try {
      return db.prepare('SELECT * FROM local_settings').all() as LocalSetting[];
    } catch (error) {
      console.error('[SettingsDAO] Failed to get all settings:', error);
      return [];
    }
  }

  /**
   * Batch read by keys (missing keys map to null).
   * @param keys Keys to load
   */
  getMany(keys: string[]): Record<string, string | null> {
    const db = getDatabase();
    const result: Record<string, string | null> = {};
    
    try {
      const placeholders = keys.map(() => '?').join(', ');
      const rows = db.prepare(
        `SELECT key, value FROM local_settings WHERE key IN (${placeholders})`
      ).all(...keys) as { key: string; value: string | null }[];
      
      for (const key of keys) {
        result[key] = null;
      }
      
      for (const row of rows) {
        result[row.key] = row.value;
      }
      
      return result;
    } catch (error) {
      console.error('[SettingsDAO] Failed to get many settings:', error);
      return result;
    }
  }

  /** Batch upsert multiple settings */
  setMany(settings: Record<string, string | null>): boolean {
    const db = getDatabase();
    try {
      const now = Date.now();
      const stmt = db.prepare(`
        INSERT INTO local_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
      `);
      
      const transaction = db.transaction(() => {
        for (const [key, value] of Object.entries(settings)) {
          stmt.run(key, value, now, value, now);
        }
      });
      
      transaction();
      console.log(`[SettingsDAO] ${Object.keys(settings).length} settings updated`);
      return true;
    } catch (error) {
      console.error('[SettingsDAO] Failed to set many settings:', error);
      return false;
    }
  }
}

export const settingsDAO = new SettingsDAO();

/** Well-known local_settings keys */
export const SETTINGS_KEYS = {
  /** Custom kernel directory */
  KERNEL_CUSTOM_DIR: 'kernel_custom_dir',
  /** Data directory */
  DATA_DIR: 'data_dir',
  /** Cache directory */
  CACHE_DIR: 'cache_dir',
  /** Close action: 'minimize_to_tray' | 'exit' | null (ask user) */
  CLOSE_BEHAVIOR: 'close_behavior',
  /** UI language (fixed zh-CN in app) */
  LANGUAGE: 'language',
  /** Window size mode: 'remember' | 'default' | 'maximized' */
  WINDOW_SIZE_MODE: 'window_size_mode',
  /** Window bounds JSON: { x, y, width, height } */
  WINDOW_BOUNDS: 'window_bounds',
} as const;

