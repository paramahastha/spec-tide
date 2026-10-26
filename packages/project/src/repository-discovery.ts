import { inspectGit } from './git-identity.js';
import { AppError, type Project } from '@spectide/contracts';
import { ProjectRepository, OperationRepository } from '@spectide/storage';
import { canonical } from '@spectide/core';
import crypto from 'node:crypto';
export async function discoverRepository(input: string) {
  try {
    const root = canonical(input),
      git = await inspectGit(root);
    return { root, git };
  } catch (e) {
    if ((e as { code?: string }).code === 'PATH_NOT_GIT_REPOSITORY')
      throw new AppError(
        'PATH_NOT_GIT_REPOSITORY',
        'The selected path is not inside a valid Git working repository.',
        'Choose a Git repository root.',
      );
    throw e;
  }
}
export async function registerProject(
  repo: ReturnType<typeof discoverRepository> extends Promise<infer T> ? T : never,
  displayName: string,
  repoStore: ProjectRepository,
  approval: { digest: string; actor: string; at: string },
  operations: OperationRepository,
  inject?: (stage: 'operation' | 'project' | 'location') => void,
) {
  const existing = repoStore.byRoot(repo.root);
  if (existing)
    throw new AppError(
      'DUPLICATE_PROJECT',
      `This canonical repository is already registered as ${existing.project_id}.`,
      'Select the existing project.',
    );
  const now = new Date().toISOString();
  const project: Project = {
    project_id: `proj_${crypto.randomUUID()}`,
    display_name: displayName || repo.root.split('/').pop() || 'Project',
    root_realpath: repo.root,
    git_identity_fingerprint: repo.git.fingerprint,
    git_location_fingerprint: repo.git.locationFingerprint,
    git_common_dir_realpath: repo.git.commonDir,
    trust_state: 'trusted',
    registry_state: 'active',
    availability_state: 'available',
    created_at: now,
    updated_at: now,
    last_validated_at: now,
  };
  const operationId = repoStore.atomic(() => {
    const id = operations.create({
      project_id: null,
      kind: 'register',
      idempotency_key: crypto.randomUUID(),
      state: 'applying',
      request_digest: approval.digest,
      risk_classification: 'sensitive',
      approval_decision: 'approved',
      approval_actor: approval.actor,
      approved_at: approval.at,
    });
    inject?.('operation');
    repoStore.insert(project);
    inject?.('project');
    operations.bindProject(id, project.project_id);
    repoStore.addLocation({
      location_id: `loc_${crypto.randomUUID()}`,
      project_id: project.project_id,
      root_realpath: project.root_realpath,
      status: 'current',
      validated_fingerprint: repo.git.locationFingerprint,
      validation_operation_id: id,
    });
    inject?.('location');
    operations.transition(id, 'completed');
    return id;
  });
  return { project, operationId };
}
