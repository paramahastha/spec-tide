import { ProjectRepository } from '@spectide/storage';
import { AppError } from '@spectide/contracts';
import { canonical } from '@spectide/core';
import { discoverRepository } from './repository-discovery.js';
export { changeProject } from './project-lifecycle-service.js';
export function selectProject(repo: ProjectRepository, selector: string) {
  const rows = repo.list(true);
  const hits = rows.filter((p) => p.project_id === selector || p.display_name === selector);
  if (!hits.length)
    throw new AppError(
      'PROJECT_NOT_FOUND',
      'No registered project matches that selector.',
      'Use a project ID from projects list.',
    );
  if (hits.length > 1)
    throw new AppError(
      'PROJECT_AMBIGUOUS',
      'More than one project matches that display name.',
      'Use the immutable project ID.',
    );
  return hits[0]!;
}
export async function revalidateProject(
  project: ReturnType<typeof selectProject>,
  repo?: ProjectRepository,
) {
  try {
    const found = await discoverRepository(project.root_realpath);
    if (
      found.git.fingerprint !== project.git_identity_fingerprint ||
      found.git.locationFingerprint !== project.git_location_fingerprint
    ) {
      project.availability_state = 'identity_mismatch';
      project.trust_state = 'attention_required';
    } else {
      project.availability_state = 'available';
      if (project.trust_state === 'trusted') project.trust_state = 'trusted';
      project.git_location_fingerprint = found.git.locationFingerprint;
      project.last_validated_at = new Date().toISOString();
    }
  } catch {
    project.availability_state = 'missing';
    project.trust_state = 'unavailable';
  }
  if (repo && typeof (repo as ProjectRepository).update === 'function') {
    project.updated_at = new Date().toISOString();
    repo.update(project);
  }
  return project;
}
export { canonical };
