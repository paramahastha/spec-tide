import { discoverRepository } from './repository-discovery.js';
import type { Project } from '@spectide/contracts';
import { AppError } from '@spectide/contracts';
export async function relink(project: Project, candidate: string) {
  const found = await discoverRepository(candidate);
  if (found.git.fingerprint !== project.git_identity_fingerprint)
    throw new AppError(
      'GIT_IDENTITY_MISMATCH',
      'Candidate repository identity does not match the registered project.',
      'Choose the original repository or restore its identity.',
    );
  return {
    ...project,
    root_realpath: found.root,
    git_common_dir_realpath: found.git.commonDir,
    git_location_fingerprint: found.git.locationFingerprint,
    availability_state: 'available' as const,
    trust_state: 'trusted' as const,
    last_validated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
