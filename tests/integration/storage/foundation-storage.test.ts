import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase, openRecoveryDatabase } from '../../../packages/storage/src/database.js';
import { integrityCheck, migrationBackupPath } from '../../../packages/storage/src/migrator.js';
import { reconcilePending } from '../../../packages/storage/src/recovery.js';
import { ProjectRepository } from '../../../packages/storage/src/project-repository.js';
import { OperationRepository } from '../../../packages/storage/src/operation-repository.js';

describe('storage foundation', () => {
  it('configures SQLite, preserves a migration backup, enforces audit binding, and opens read-only recovery', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-db-'));
    const filename = path.join(dir, 'state.sqlite');
    const legacy = new DatabaseSync(filename, {});
    legacy.exec("CREATE TABLE legacy(value TEXT); INSERT INTO legacy VALUES ('keep');");
    legacy.close();
    const db = openDatabase(filename);
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(db.pragma('journal_mode', { simple: true })).toBe('wal');
    expect(integrityCheck(db)).toBe(true);
    expect(fs.existsSync(migrationBackupPath(db))).toBe(true);
    expect(db.prepare('SELECT version FROM schema_migrations ORDER BY version').all()).toEqual([
      { version: 1 },
      { version: 2 },
    ]);
    expect(
      db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name").all(),
    ).toEqual([
      { name: 'operation_approval_required' },
      { name: 'operation_approval_required_update' },
      { name: 'operation_digest_risk_immutable' },
      { name: 'projects_id_immutable' },
      { name: 'workspace_owner_immutable' },
    ]);

    const now = new Date().toISOString();
    new ProjectRepository(db).insert({
      project_id: 'proj_test',
      display_name: 'Test',
      root_realpath: path.join(dir, 'repo'),
      git_identity_fingerprint: 'fingerprint',
      git_location_fingerprint: 'location',
      git_common_dir_realpath: path.join(dir, 'repo', '.git'),
      trust_state: 'trusted',
      registry_state: 'active',
      availability_state: 'available',
      created_at: now,
      updated_at: now,
      last_validated_at: now,
    });
    const operations = new OperationRepository(db);
    const input = {
      project_id: 'proj_test',
      kind: 'rename',
      idempotency_key: 'once',
      state: 'pending' as const,
      request_digest: 'digest',
      risk_classification: 'routine',
      approval_decision: 'not_required',
      approval_actor: null,
      approved_at: null,
    };
    const id = operations.create(input);
    expect(() => operations.create(input)).toThrow();
    expect(() =>
      db.prepare('UPDATE operations SET request_digest=? WHERE operation_id=?').run('changed', id),
    ).toThrow();
    operations.transition(id, 'applying');
    operations.transition(id, 'completed');
    expect(operations.get(id)?.state).toBe('completed');
    expect(reconcilePending(db)).toBe(0);
    db.close();

    const recovery = openRecoveryDatabase(filename);
    expect(recovery.pragma('query_only', { simple: true })).toBe(1);
    expect(() => recovery.prepare('DELETE FROM projects').run()).toThrow();
    recovery.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
