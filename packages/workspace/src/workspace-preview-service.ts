import crypto from 'node:crypto';
import path from 'node:path';
import { appDataRoot } from '@spectide/core';
import type { Project } from '@spectide/contracts';
import type { Store } from '@spectide/storage';
import { resolveBase } from './base-revision.js';
import { OperationRepository, transaction } from '@spectide/storage';
export async function createPreview(project: Project, revision: string, db: Store) {
  const base = await resolveBase(project.root_realpath, revision);
  const id = `ws_${crypto.randomUUID()}`;
  const target = path.join(appDataRoot(), 'worktrees', project.project_id, id);
  const expires = new Date(Date.now() + 10 * 60_000).toISOString();
  const payload = {
    project_id: project.project_id,
    root: project.root_realpath,
    base,
    target,
    expires,
  };
  const digest = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const operationId = transaction(db, () => {
    const op = new OperationRepository(db);
    const operationId = op.create({
      project_id: project.project_id,
      kind: 'prepare_workspace',
      idempotency_key: crypto.randomUUID(),
      state: 'pending',
      request_digest: digest,
      risk_classification: 'sensitive',
      approval_decision: 'not_required',
      approval_actor: null,
      approved_at: null,
    });
    db.prepare(
      'INSERT INTO workspace_previews(confirmation_digest,project_id,workspace_id,target_realpath,base_commit,expires_at,consumed_at,source_root,operation_id) VALUES(?,?,?,?,?,?,NULL,?,?)',
    ).run(
      digest,
      project.project_id,
      id,
      target,
      base,
      expires,
      project.root_realpath,
      operationId,
    );
    return operationId;
  });
  return {
    id,
    operation: { id: operationId, kind: 'prepare_workspace', state: 'pending' },
    target,
    base,
    digest,
    risk_classification: 'sensitive',
    expires,
    warning:
      'A Git worktree isolates checkout changes only; it is not an OS, network, or credential sandbox.',
  };
}
