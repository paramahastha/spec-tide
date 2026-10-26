import fs from 'node:fs';
import path from 'node:path';
import { runProcess, assertWithin, appDataRoot } from '@spectide/core';
import { AppError } from '@spectide/contracts';
export async function addWorktree(
  source: string,
  target: string,
  base: string,
  root = path.join(appDataRoot(), 'worktrees'),
) {
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const parent = fs.realpathSync(path.dirname(target));
  assertWithin(root, parent);
  if (fs.existsSync(target))
    throw new AppError(
      'WORKSPACE_BOUNDARY_VIOLATION',
      'Workspace target already exists.',
      'Create a fresh preview.',
    );
  const r = await runProcess({
    executable: 'git',
    args: ['worktree', 'add', '--detach', target, base],
    cwd: source,
    authorizedRoots: [source],
    timeoutMs: 60_000,
  });
  if (r.code !== 0)
    throw new AppError(
      'OPERATION_INCOMPLETE',
      'Git worktree preparation did not complete.',
      'Inspect the target and operation journal before retrying.',
      true,
    );
  const real = fs.realpathSync(target);
  assertWithin(root, real);
  const check = await runProcess({
    executable: 'git',
    args: ['rev-parse', 'HEAD'],
    cwd: real,
    authorizedRoots: [real],
    timeoutMs: 5000,
  });
  if (check.code !== 0 || check.stdout.trim() !== base)
    throw new AppError(
      'OPERATION_INCOMPLETE',
      'Created worktree failed postcondition validation.',
      'Reconcile the operation before retrying.',
      true,
    );
  return real;
}
