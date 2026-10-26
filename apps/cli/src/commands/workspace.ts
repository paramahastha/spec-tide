import { createPreview, resolveTarget, prepare } from '@spectide/workspace';
import type { ProjectRepository, Store } from '@spectide/storage';
import { AppError } from '@spectide/contracts';
export async function preview(
  db: Store,
  projects: ProjectRepository,
  selector: string,
  base: string,
) {
  const p = await resolveTarget(projects, selector);
  const workspacePreview = await createPreview(p, base, db);
  return {
    project: { id: p.project_id, display_name: p.display_name, root_realpath: p.root_realpath },
    operation: workspacePreview.operation,
    workspace: {
      id: workspacePreview.id,
      target: workspacePreview.target,
      base: workspacePreview.base,
      risk_classification: workspacePreview.risk_classification,
      expires: workspacePreview.expires,
      warning: workspacePreview.warning,
    },
    confirmation_digest: workspacePreview.digest,
  };
}
export async function confirm(
  db: Store,
  projects: ProjectRepository,
  selector: string,
  base: string,
  digest: string | undefined,
) {
  if (!digest)
    throw new AppError(
      'PREVIEW_REQUIRED',
      'A preview digest is required for workspace preparation.',
      'Run workspace prepare with --preview first.',
    );
  const p = await resolveTarget(projects, selector);
  const result = await prepare(db, p, base, digest);
  return {
    operation: { id: result.operationId, kind: 'prepare_workspace', state: 'completed' },
    workspace: {
      id: result.workspaceId,
      root_realpath: result.root,
      base_commit: result.base,
      state: 'ready',
    },
  };
}
