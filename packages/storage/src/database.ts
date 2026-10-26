import { DatabaseSync, type StatementSync, type DatabaseSyncOptions } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { databasePath } from '@spectide/core';
import { applyFoundationMigration } from './migrations/001-foundation.js';
import { migrateWorkspacePreviews } from './migrator.js';
type Prepared = {
  run: (...values: unknown[]) => { changes: number | bigint; lastInsertRowid: number | bigint };
  get: (...values: unknown[]) => unknown;
  all: (...values: unknown[]) => unknown[];
};
export class Store {
  private readonly native: DatabaseSync;
  constructor(
    readonly name: string,
    options?: DatabaseSyncOptions,
  ) {
    this.native = new DatabaseSync(name, options ?? {});
  }
  exec(sql: string) {
    this.native.exec(sql);
  }
  pragma(sql: string, options?: { simple?: boolean }) {
    const s = this.native.prepare(`PRAGMA ${sql}`);
    const rows = s.all() as Record<string, unknown>[];
    if (options?.simple) {
      const first = rows[0];
      return first ? Object.values(first)[0] : undefined;
    }
    return rows;
  }
  prepare(sql: string): Prepared {
    const s: StatementSync = this.native.prepare(sql);
    return {
      run: (...values) => s.run(...(values as never[])),
      get: (...values) => s.get(...(values as never[])),
      all: (...values) => s.all(...(values as never[])),
    };
  }
  transaction<T>(fn: () => T) {
    return () => {
      this.exec('BEGIN IMMEDIATE');
      try {
        const v = fn();
        this.exec('COMMIT');
        return v;
      } catch (e) {
        this.exec('ROLLBACK');
        throw e;
      }
    };
  }
  close() {
    this.native.close();
  }
}
export function openDatabase(filename = databasePath()): Store {
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const db = new Store(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  const check = db.pragma('integrity_check', { simple: true });
  if (check !== 'ok') {
    db.pragma('query_only = ON');
    throw new Error('Database integrity check failed; recovery is required.');
  }
  migrate(db);
  return db;
}
function migrate(db: Store) {
  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);`,
  );
  const has = db.prepare('SELECT version FROM schema_migrations WHERE version=1').get();
  if (!has) {
    const backup = `${db.name}.pre-migration.bak`;
    if (fs.existsSync(db.name) && fs.statSync(db.name).size > 0) fs.copyFileSync(db.name, backup);
    db.exec('BEGIN IMMEDIATE');
    try {
      applyFoundationMigration(db);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  migrateWorkspacePreviews(db);
}

export function openRecoveryDatabase(filename: string): Store {
  if (!fs.existsSync(filename)) throw new Error('No database exists for recovery.');
  const db = new Store(filename, { readOnly: true });
  db.pragma('query_only = ON');
  const check = db.pragma('integrity_check', { simple: true });
  if (check !== 'ok')
    throw new Error('Database integrity check failed in read-only recovery mode.');
  return db;
}
