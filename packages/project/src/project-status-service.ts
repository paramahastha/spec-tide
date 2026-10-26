import { revalidateProject } from './project-service.js';
import type { Project } from '@spectide/contracts';
import type { ProjectRepository } from '@spectide/storage';
export async function projectStatus(project: Project, repo?: ProjectRepository) {
  const fresh = await revalidateProject(project, repo);
  return {
    id: fresh.project_id,
    name: fresh.display_name,
    root_realpath: fresh.root_realpath,
    trust_state: fresh.trust_state,
    registry_state: fresh.registry_state,
    availability_state: fresh.availability_state,
  };
}
