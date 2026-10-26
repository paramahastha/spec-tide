import { spawn } from 'node:child_process';
import path from 'node:path';
import { canonical } from './path-boundary.js';
import { redact } from './redaction.js';
import { appDataRoot } from './app-paths.js';
import { AppError } from '@spectide/contracts';
export type RunOptions = {
  executable: string;
  args: string[];
  cwd: string;
  authorizedRoots: string[];
  env?: Record<string, string>;
  timeoutMs: number;
  signal?: AbortSignal;
  maxOutputBytes?: number;
};
const ENV_ALLOW = new Set([
  'PATH',
  'HOME',
  'USERPROFILE',
  'TMPDIR',
  'TEMP',
  'SystemRoot',
  'WINDIR',
  'LANG',
  'LC_ALL',
]);
// Add tools only after their arguments are reviewed as fixed, non-mutating probes.
const EXECUTABLE_ALLOW = new Set(['git', 'codex', 'opencode']);
function approvedArguments(executable: string, args: string[]): boolean {
  if (executable === 'codex')
    return (
      (args.length === 1 && args[0] === '--version') ||
      (args.length === 2 && args[0] === 'login' && args[1] === 'status') ||
      (args.length === 2 && args[0] === '--safe-boundary' && args[1] === 'disposable-fixture') ||
      (args.length === 2 && args[0] === '--resume' && args[1] === 'disposable-fixture')
    );
  if (executable === 'opencode')
    return (
      (args.length === 1 && args[0] === '--version') ||
      (args.length === 4 &&
        args[0] === 'auth' &&
        args[1] === 'list' &&
        args[2] === '--format' &&
        args[3] === 'json') ||
      (args.length === 2 && args[0] === '--safe-boundary' && args[1] === 'disposable-fixture') ||
      (args.length === 2 && args[0] === '--resume' && args[1] === 'disposable-fixture')
    );
  if (executable !== 'git') return false;
  const joined = args.join('\0');
  if (
    joined === 'rev-parse\0--show-toplevel' ||
    joined === 'rev-parse\0--git-common-dir' ||
    joined === 'rev-parse\0--show-object-format' ||
    joined === 'rev-parse\0HEAD' ||
    joined === 'rev-list\0--max-parents=0\0--all' ||
    joined === 'remote\0get-url\0origin' ||
    joined === 'status\0--porcelain'
  )
    return true;
  if (
    args.length === 4 &&
    args[0] === 'rev-parse' &&
    args[1] === '--verify' &&
    args[2] === '--end-of-options' &&
    typeof args[3] === 'string' &&
    args[3].endsWith('^{commit}')
  )
    return true;
  if (
    args.length === 5 &&
    args[0] === 'worktree' &&
    args[1] === 'add' &&
    args[2] === '--detach' &&
    path.isAbsolute(args[3]!) &&
    /^[a-f0-9]{40,64}$/i.test(args[4]!)
  ) {
    const worktreeRoot = path.join(appDataRoot(), 'worktrees');
    const rel = path.relative(worktreeRoot, path.resolve(args[3]!));
    return rel !== '' && rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
  }
  return false;
}
export async function runProcess(
  o: RunOptions,
): Promise<{ code: number; stdout: string; stderr: string }> {
  if (
    !o.executable ||
    /[\s\0]/.test(o.executable) ||
    !Array.isArray(o.args) ||
    o.args.some((x) => typeof x !== 'string') ||
    !Number.isFinite(o.timeoutMs) ||
    o.timeoutMs <= 0
  )
    throw new AppError(
      'POLICY_DENIED',
      'Process request is invalid.',
      'Provide an executable, argument list, authorized working directory, and timeout.',
    );
  if (!EXECUTABLE_ALLOW.has(o.executable))
    throw new AppError(
      'POLICY_DENIED',
      'Requested executable is not approved.',
      'Use a supported local tool through an approved diagnostic or Git operation.',
    );
  if (!approvedArguments(o.executable, o.args))
    throw new AppError(
      'POLICY_DENIED',
      'Requested command arguments are not approved.',
      'Use a documented read-only probe or approved workspace operation.',
    );
  const cwd = canonical(o.cwd);
  if (
    !o.authorizedRoots.some((r) => {
      const rel = requireRelative(canonical(r), cwd);
      return rel !== null;
    })
  )
    throw new AppError(
      'POLICY_DENIED',
      'Process working directory is not authorized.',
      'Select an approved project directory.',
    );
  const env: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(o.env ?? {})) {
    if (!ENV_ALLOW.has(k))
      throw new AppError(
        'POLICY_DENIED',
        'Process environment contains a disallowed variable.',
        'Use only approved environment variables.',
      );
    env[k] = v;
  }
  let stdout = '',
    stderr = '';
  return await new Promise((resolve, reject) => {
    const child = spawn(o.executable, o.args, {
      cwd,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        USERPROFILE: process.env.USERPROFILE,
        TMPDIR: process.env.TMPDIR,
        TEMP: process.env.TEMP,
        SystemRoot: process.env.SystemRoot,
        WINDIR: process.env.WINDIR,
        LANG: 'C',
        ...env,
      },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const limit = o.maxOutputBytes ?? 65536;
    const timer = setTimeout(() => child.kill('SIGKILL'), o.timeoutMs);
    const abort = () => child.kill('SIGTERM');
    o.signal?.addEventListener('abort', abort, { once: true });
    child.stdout.on('data', (b: Buffer) => {
      const remaining = Math.max(0, limit - Buffer.byteLength(stdout));
      if (remaining) stdout += b.subarray(0, remaining).toString();
    });
    child.stderr.on('data', (b: Buffer) => {
      const remaining = Math.max(0, limit - Buffer.byteLength(stderr));
      if (remaining) stderr += b.subarray(0, remaining).toString();
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(
        new AppError(
          'POLICY_DENIED',
          redact(e.message, 300),
          'Check that the requested local tool is installed.',
        ),
      );
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      o.signal?.removeEventListener('abort', abort);
      resolve({ code: code ?? 1, stdout: redact(stdout), stderr: redact(stderr) });
    });
  });
}
function requireRelative(root: string, target: string): string | null {
  const rel = path.relative(root, target);
  return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel))
    ? rel
    : null;
}
