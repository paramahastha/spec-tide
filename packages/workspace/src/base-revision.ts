import { runProcess } from '@spectide/core';
import { AppError } from '@spectide/contracts';
export async function resolveBase(root: string, revision: string) {
  const r = await runProcess({
    executable: 'git',
    args: ['rev-parse', '--verify', '--end-of-options', `${revision}^{commit}`],
    cwd: root,
    authorizedRoots: [root],
    timeoutMs: 5000,
  });
  if (r.code !== 0 || r.stderr.trim() || !/^[a-f0-9]{40,64}$/i.test(r.stdout.trim()))
    throw new AppError(
      'INVALID_BASE_REVISION',
      'The selected base revision is not a valid commit.',
      'Choose an existing commit SHA.',
    );
  return r.stdout.trim();
}
