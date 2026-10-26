import crypto from 'node:crypto';
import path from 'node:path';
import { runProcess } from '@spectide/core';
export type GitIdentity = {
  root: string;
  commonDir: string;
  fingerprint: string;
  locationFingerprint: string;
  objectFormat: string;
  rootCommits: string[];
  remoteIdentity: string | null;
};
export async function inspectGit(input: string): Promise<GitIdentity> {
  const cwd = path.resolve(input),
    roots = [cwd];
  const call = (args: string[]) =>
    runProcess({ executable: 'git', args, cwd, authorizedRoots: roots, timeoutMs: 5000 });
  const root = await call(['rev-parse', '--show-toplevel']);
  if (root.code !== 0)
    throw Object.assign(new Error('Path is not a Git working repository.'), {
      code: 'PATH_NOT_GIT_REPOSITORY',
    });
  const realRoot = path.resolve(root.stdout.trim());
  const fromRoot = (args: string[]) =>
    runProcess({
      executable: 'git',
      args,
      cwd: realRoot,
      authorizedRoots: [realRoot],
      timeoutMs: 5000,
    });
  const [common, obj, head, remote] = await Promise.all([
    fromRoot(['rev-parse', '--git-common-dir']),
    fromRoot(['rev-parse', '--show-object-format']),
    fromRoot(['rev-list', '--max-parents=0', '--all']),
    fromRoot(['remote', 'get-url', 'origin']),
  ]);
  const commonDir = path.resolve(realRoot, common.stdout.trim());
  const rootCommits = head.stdout.trim().split(/\s+/).filter(Boolean).sort();
  const remoteIdentity =
    remote.code === 0
      ? remote.stdout.trim().replace(/(\b[a-z][a-z0-9+.-]*:\/\/)[^/@\s]+@/i, '$1[REDACTED]@')
      : null;
  const identity = { objectFormat: obj.stdout.trim(), rootCommits, remoteIdentity };
  const location = { root: realRoot, commonDir, ...identity };
  return {
    root: realRoot,
    commonDir,
    objectFormat: identity.objectFormat,
    rootCommits,
    remoteIdentity,
    fingerprint: crypto.createHash('sha256').update(JSON.stringify(identity)).digest('hex'),
    locationFingerprint: crypto.createHash('sha256').update(JSON.stringify(location)).digest('hex'),
  };
}

export async function inspectWorkingTreeState(root: string): Promise<'clean' | 'modified'> {
  const status = await runProcess({
    executable: 'git',
    args: ['status', '--porcelain'],
    cwd: root,
    authorizedRoots: [root],
    timeoutMs: 5000,
  });
  return status.code === 0 && status.stdout.length === 0 ? 'clean' : 'modified';
}
