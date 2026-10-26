import { describe, it, expect } from 'vitest';
import { runProcess } from '../../../packages/core/src/process-runner.js';
describe('process runner', () => {
  it('rejects non-positive timeout', async () => {
    await expect(
      runProcess({
        executable: 'git',
        args: ['safe'],
        cwd: process.cwd(),
        authorizedRoots: [process.cwd()],
        timeoutMs: 0,
      }),
    ).rejects.toMatchObject({ code: 'POLICY_DENIED' });
  });
  it('rejects an unapproved working directory', async () => {
    const other = await import('node:os').then((m) => m.tmpdir());
    await expect(
      runProcess({
        executable: 'git',
        args: [],
        cwd: other,
        authorizedRoots: [process.cwd()],
        timeoutMs: 1000,
      }),
    ).rejects.toMatchObject({ code: 'POLICY_DENIED' });
  });
  it('rejects disallowed environment keys', async () => {
    await expect(
      runProcess({
        executable: 'git',
        args: [],
        cwd: process.cwd(),
        authorizedRoots: [process.cwd()],
        timeoutMs: 1000,
        env: { API_TOKEN: 'x' },
      }),
    ).rejects.toMatchObject({ code: 'POLICY_DENIED' });
  });
  it('rejects binaries and path-qualified attempts to bypass the explicit allowlist', async () => {
    for (const executable of ['sh', '/tmp/git']) {
      await expect(
        runProcess({
          executable,
          args: [],
          cwd: process.cwd(),
          authorizedRoots: [process.cwd()],
          timeoutMs: 1000,
        }),
      ).rejects.toMatchObject({ code: 'POLICY_DENIED' });
    }
  });
  it('rejects unapproved Git operations even when git itself is allowlisted', async () => {
    for (const args of [
      ['reset', '--hard'],
      ['push', 'origin', 'main'],
      ['clean', '-fd'],
      ['config', '--list'],
    ]) {
      await expect(
        runProcess({
          executable: 'git',
          args,
          cwd: process.cwd(),
          authorizedRoots: [process.cwd()],
          timeoutMs: 1000,
        }),
      ).rejects.toMatchObject({ code: 'POLICY_DENIED' });
    }
  });
});
