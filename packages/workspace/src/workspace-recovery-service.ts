import fs from 'node:fs';
import { appDataRoot, assertWithin, runProcess } from '@spectide/core';
import { discoverRepository } from '@spectide/project';
import type { Store } from '@spectide/storage';
import { setWorkspaceState, transaction } from '@spectide/storage';
export async function recoverWorkspaces(db: Store) {
  const rows = db
    .prepare(
      `SELECT w.workspace_id,w.project_id,w.operation_id,w.root_realpath,w.base_commit,p.root_realpath AS source_root,p.git_identity_fingerprint,p.git_location_fingerprint FROM workspaces w JOIN projects p ON p.project_id=w.project_id JOIN operations o ON o.operation_id=w.operation_id WHERE w.state IN ('preparing','recoverable_incomplete') AND o.state IN ('applying','recoverable_incomplete')`,
    )
    .all() as {
    workspace_id: string;
    project_id: string;
    operation_id: string;
    root_realpath: string;
    base_commit: string;
    source_root: string;
    git_identity_fingerprint: string;
    git_location_fingerprint: string;
  }[];
  const outcomes = [];
  for (const row of rows) {
    try {
      const source = await discoverRepository(row.source_root);
      if (
        source.git.fingerprint !== row.git_identity_fingerprint ||
        source.git.locationFingerprint !== row.git_location_fingerprint
      ) {
        outcomes.push({ operation_id: row.operation_id, state: 'recoverable_incomplete' });
        continue;
      }
      if (!fs.existsSync(row.root_realpath)) {
        transaction(db, () => {
          setWorkspaceState(db, row.workspace_id, 'blocked');
          db.prepare(
            "UPDATE operations SET state='failed',finished_at=?,error_code='OPERATION_INCOMPLETE',error_redacted='No worktree was created before interruption',next_action='Create a new preview before trying again.' WHERE operation_id=?",
          ).run(new Date().toISOString(), row.operation_id);
        });
        outcomes.push({ operation_id: row.operation_id, state: 'failed' });
        continue;
      }
      assertWithin(`${appDataRoot()}/worktrees`, row.root_realpath);
      const head = await runProcess({
        executable: 'git',
        args: ['rev-parse', 'HEAD'],
        cwd: row.root_realpath,
        authorizedRoots: [row.root_realpath],
        timeoutMs: 5000,
      });
      if (head.code !== 0 || head.stdout.trim() !== row.base_commit) {
        outcomes.push({ operation_id: row.operation_id, state: 'recoverable_incomplete' });
        continue;
      }
      transaction(db, () => {
        setWorkspaceState(db, row.workspace_id, 'ready', row.root_realpath);
        db.prepare(
          "UPDATE operations SET state='completed',finished_at=? WHERE operation_id=?",
        ).run(new Date().toISOString(), row.operation_id);
      });
      outcomes.push({ operation_id: row.operation_id, state: 'completed' });
    } catch {
      outcomes.push({ operation_id: row.operation_id, state: 'recoverable_incomplete' });
    }
  }
  return outcomes;
}
