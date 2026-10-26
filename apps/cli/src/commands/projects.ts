import crypto from 'node:crypto';
import {
  discoverRepository,
  registerProject,
  selectProject,
  changeProject,
  relink,
} from '@spectide/project';
import type { ProjectRepository, OperationRepository } from '@spectide/storage';
import { AppError } from '@spectide/contracts';
import { persistDiscoverySnapshots, revalidateProject } from '@spectide/project';
export async function add(
  pathname: string,
  confirmed: boolean,
  name: string | undefined,
  projects: ProjectRepository,
  ops: OperationRepository,
) {
  if (!confirmed)
    throw new AppError(
      'TRUST_CONFIRMATION_REQUIRED',
      'Project registration requires --confirm-trust.',
      'Review the canonical path and repeat with --confirm-trust.',
    );
  const repo = await discoverRepository(pathname);
  const digest = crypto
    .createHash('sha256')
    .update(`${repo.root}\0${name || ''}`)
    .digest('hex');
  const registered = await registerProject(
    repo,
    name || '',
    projects,
    {
      digest,
      actor: process.env.USER || 'local-user',
      at: new Date().toISOString(),
    },
    ops,
  );
  persistDiscoverySnapshots(projects, registered.project.project_id, repo.root);
  return {
    operation: { id: registered.operationId, kind: 'register', state: 'completed' },
    project: registered.project,
  };
}

export async function lifecycle(
  action: string,
  selector: string,
  value: string | undefined,
  confirmed: boolean,
  projects: ProjectRepository,
  ops: OperationRepository,
) {
  if (['archive', 'restore', 'unregister'].includes(action) && !confirmed)
    throw new AppError(
      'TRUST_CONFIRMATION_REQUIRED',
      `Project ${action} requires --confirm.`,
      'Review the requested project and repeat with --confirm.',
    );
  const p = selectProject(projects, selector);
  await revalidateProject(p, projects);
  const digest = crypto
    .createHash('sha256')
    .update(`${action}:${p.project_id}:${value || ''}`)
    .digest('hex');
  const result = projects.atomic(() => {
    const id = ops.create({
      project_id: p.project_id,
      kind: action,
      idempotency_key: crypto.randomUUID(),
      state: 'applying',
      request_digest: digest,
      risk_classification: action === 'unregister' ? 'elevated' : 'routine',
      approval_decision: confirmed ? 'approved' : 'not_required',
      approval_actor: confirmed ? process.env.USER || 'local-user' : null,
      approved_at: confirmed ? new Date().toISOString() : null,
    });
    const updated = changeProject(projects, p, action, value);
    ops.transition(id, 'completed');
    return { id, updated };
  });
  return {
    operation: { id: result.id, kind: action, state: 'completed' },
    project: result.updated,
  };
}
export async function runRelink(
  selector: string,
  path: string,
  confirmed: boolean,
  projects: ProjectRepository,
  ops: OperationRepository,
) {
  if (!confirmed)
    throw new AppError(
      'TRUST_CONFIRMATION_REQUIRED',
      'Relinking requires --confirm-trust.',
      'Review the candidate path and repeat with --confirm-trust.',
    );
  const project = selectProject(projects, selector);
  const oldRoot = project.root_realpath;
  const digest = crypto
    .createHash('sha256')
    .update(`relink:${project.project_id}:${path}`)
    .digest('hex');
  const operationId = ops.create({
    project_id: project.project_id,
    kind: 'relink',
    idempotency_key: crypto.randomUUID(),
    state: 'applying',
    request_digest: digest,
    risk_classification: 'sensitive',
    approval_decision: 'approved',
    approval_actor: process.env.USER || 'local-user',
    approved_at: new Date().toISOString(),
  });
  const updated = await relink(project, path);
  projects.atomic(() => {
    projects.update(updated);
    projects.recordRelink({
      projectId: project.project_id,
      oldRoot,
      newRoot: updated.root_realpath,
      fingerprint: updated.git_location_fingerprint,
      operationId,
    });
    ops.transition(operationId, 'completed');
  });
  return { operation: { id: operationId, kind: 'relink', state: 'completed' }, project: updated };
}
