import type { Project } from '@spectide/contracts';
import { AppError } from '@spectide/contracts';
import type { ProjectRepository } from '@spectide/storage';

/** Apply a registry-only project transition; repository files and operation history remain intact. */
export function changeProject(
  repo: ProjectRepository,
  project: Project,
  action: string,
  value?: string,
): Project {
  const now = new Date().toISOString();
  if (action === 'rename') project.display_name = value || project.display_name;
  if (action === 'archive') project.registry_state = 'archived';
  if (action === 'restore') {
    if (project.availability_state !== 'available')
      throw new AppError(
        'PROJECT_UNAVAILABLE',
        'Project must be identity-validated before restore.',
        'Revalidate or relink the repository.',
      );
    project.registry_state = 'active';
  }
  if (action === 'unregister') project.registry_state = 'unregistered';
  project.updated_at = now;
  repo.update(project);
  return project;
}
