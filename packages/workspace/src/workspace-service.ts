import crypto from 'node:crypto';
import { AppError, type Project } from '@spectide/contracts';
import {
  saveWorkspace,
  setWorkspaceState,
  transaction,
  type Store,
  OperationRepository,
} from '@spectide/storage';
import { addWorktree } from './git-worktree.js';
import { resolveBase } from './base-revision.js';
export async function prepare(
  db: Store,
  p: Project,
  revision: string,
  digest: string,
  worktree = addWorktree,
) {
  const preview = db
    .prepare('SELECT * FROM workspace_previews WHERE confirmation_digest=?')
    .get(digest) as
    | {
        confirmation_digest: string;
        project_id: string;
        workspace_id: string;
        target_realpath: string;
        base_commit: string;
        expires_at: string;
        consumed_at: string | null;
        source_root: string | null;
        operation_id: string | null;
      }
    | undefined;
  if (
    !preview ||
    preview.project_id !== p.project_id ||
    preview.source_root !== p.root_realpath ||
    preview.consumed_at ||
    Date.parse(preview.expires_at) < Date.now()
  )
    throw new AppError(
      'PREVIEW_STALE',
      'The preview has expired, was already used, or belongs to another project.',
      'Create a fresh preview and confirm its digest.',
    );
  const expectedDigest = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        project_id: preview.project_id,
        root: preview.source_root,
        base: preview.base_commit,
        target: preview.target_realpath,
        expires: preview.expires_at,
      }),
    )
    .digest('hex');
  if (expectedDigest !== digest)
    throw new AppError(
      'PREVIEW_STALE',
      'Preview details no longer match the confirmed request.',
      'Create a fresh preview and confirm its digest.',
    );
  const resolved = await resolveBase(p.root_realpath, revision);
  if (resolved !== preview.base_commit)
    throw new AppError(
      'PREVIEW_STALE',
      'The selected base revision changed after preview.',
      'Create a fresh preview and confirm its digest.',
    );
  const op = new OperationRepository(db),
    operationId = transaction(db, () => {
      const consumed = db
        .prepare(
          'UPDATE workspace_previews SET consumed_at=? WHERE confirmation_digest=? AND project_id=? AND workspace_id=? AND target_realpath=? AND base_commit=? AND source_root=? AND operation_id=? AND consumed_at IS NULL AND expires_at>?',
        )
        .run(
          new Date().toISOString(),
          digest,
          preview.project_id,
          preview.workspace_id,
          preview.target_realpath,
          preview.base_commit,
          preview.source_root,
          preview.operation_id,
          new Date().toISOString(),
        );
      if (consumed.changes !== 1)
        throw new AppError(
          'PREVIEW_STALE',
          'The preview was already consumed or expired.',
          'Create a fresh preview and confirm its digest.',
        );
      const id = preview.operation_id;
      if (!id)
        throw new AppError(
          'PREVIEW_STALE',
          'Preview has no pending operation.',
          'Create a fresh preview.',
        );
      const approved = db
        .prepare(
          "UPDATE operations SET state='applying',approval_decision='approved',approval_actor=?,approved_at=? WHERE operation_id=? AND state='pending' AND request_digest=?",
        )
        .run(
          process.env.USER || process.env.USERNAME || 'local-user',
          new Date().toISOString(),
          id,
          digest,
        );
      if (approved.changes !== 1)
        throw new AppError(
          'PREVIEW_STALE',
          'Preview operation is no longer pending.',
          'Create a fresh preview.',
        );
      saveWorkspace(db, {
        id: preview.workspace_id,
        projectId: p.project_id,
        operationId: id,
        root: preview.target_realpath,
        base: preview.base_commit,
        state: 'preparing',
      });
      return id;
    });
  try {
    const root = await worktree(p.root_realpath, preview.target_realpath, preview.base_commit);
    transaction(db, () => {
      setWorkspaceState(db, preview.workspace_id, 'ready', root);
      db.prepare("UPDATE operations SET state='completed', finished_at=? WHERE operation_id=?").run(
        new Date().toISOString(),
        operationId,
      );
    });
    return { operationId, workspaceId: preview.workspace_id, root, base: preview.base_commit };
  } catch (e) {
    transaction(db, () => {
      setWorkspaceState(db, preview.workspace_id, 'recoverable_incomplete');
      op.transition(operationId, 'recoverable_incomplete');
    });
    throw e;
  }
}
