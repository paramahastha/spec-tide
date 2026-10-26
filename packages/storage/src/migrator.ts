import type { Store } from './database.js';
export function integrityCheck(db: Store): boolean {
  return db.pragma('integrity_check', { simple: true }) === 'ok';
}
export function migrationBackupPath(db: Store): string {
  return `${db.name}.pre-migration.bak`;
}

/** Apply the additive workspace preview migration. */
export function migrateWorkspacePreviews(db: Store): void {
  const exists = db.prepare('SELECT version FROM schema_migrations WHERE version=2').get();
  if (exists) return;
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`ALTER TABLE workspace_previews ADD COLUMN source_root TEXT;
ALTER TABLE workspace_previews ADD COLUMN operation_id TEXT REFERENCES operations(operation_id);
INSERT INTO schema_migrations(version,applied_at) VALUES(2,datetime('now'));`);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
