import { ProjectRepository } from '@spectide/storage';
import { selectProject } from '@spectide/project';
import { revalidateProject } from '@spectide/project';
import { AppError } from '@spectide/contracts';
export async function resolveTarget(repo: ProjectRepository, selector: string) {
  const p = selectProject(repo, selector);
  await revalidateProject(p, repo);
  if (
    p.registry_state !== 'active' ||
    p.trust_state !== 'trusted' ||
    p.availability_state !== 'available'
  )
    throw new AppError(
      'PROJECT_UNAVAILABLE',
      'Project is not currently trusted and available.',
      'Revalidate or relink the project.',
    );
  return p;
}
