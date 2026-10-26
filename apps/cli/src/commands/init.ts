import { add } from './projects.js';
import { discoverRepository, discoverArtifacts, discoverConfig } from '@spectide/project';
import type { OperationRepository, ProjectRepository } from '@spectide/storage';
export async function initProject(
  pathname: string,
  confirmed: boolean,
  name: string | undefined,
  projects: ProjectRepository,
  ops: OperationRepository,
) {
  const result = await add(pathname, confirmed, name, projects, ops);
  const repo = await discoverRepository(pathname);
  return {
    ...result,
    discovered_state: {
      specify_artifacts: discoverArtifacts(repo.root),
      spectide_config: discoverConfig(repo.root),
    },
  };
}
