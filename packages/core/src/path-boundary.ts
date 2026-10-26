import fs from 'node:fs';
import path from 'node:path';
import { AppError } from '@spectide/contracts';
export function canonical(pathname: string): string {
  try {
    return fs.realpathSync.native(path.resolve(pathname));
  } catch {
    throw new AppError(
      'PATH_UNRESOLVABLE',
      'The requested path cannot be resolved safely.',
      'Choose an existing readable path.',
    );
  }
}
export function isWithin(root: string, candidate: string): boolean {
  const rel = path.relative(canonical(root), canonical(candidate));
  return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel));
}
export function assertWithin(root: string, candidate: string): string {
  const c = canonical(candidate);
  if (!isWithin(root, c))
    throw new AppError(
      'WORKSPACE_BOUNDARY_VIOLATION',
      'The requested path resolves outside the approved application directory.',
      'Choose an app-owned workspace path.',
    );
  return c;
}
