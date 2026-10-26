import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runProcess } from '../../../packages/core/src/process-runner.js';
import { redact } from '../../../packages/core/src/redaction.js';
import { runProcess } from '../../../packages/core/src/process-runner.js';
import { tokenLikeOutput } from '../../fixtures/src/secret-fixture.js';

describe('foundation safety', () => {
  it('rejects shell command strings as executable', async () => {
    await expect(
      runProcess({
        executable: 'git status',
        args: [],
        cwd: process.cwd(),
        authorizedRoots: [process.cwd()],
        timeoutMs: 1000,
      }),
    ).rejects.toMatchObject({ code: 'POLICY_DENIED' });
  });

  it('rejects execution from an unowned working directory', async () => {
    await expect(
      runProcess({
        executable: 'git',
        args: ['status'],
        cwd: os.tmpdir(),
        authorizedRoots: [process.cwd()],
        timeoutMs: 1000,
      }),
    ).rejects.toMatchObject({ code: 'POLICY_DENIED' });
  });

  it('keeps source workspace commands non-destructive', () => {
    const source = fs.readFileSync(path.resolve('packages/workspace/src/git-worktree.ts'), 'utf8');
    for (const forbidden of ['reset', 'clean', 'stash', 'push', 'merge', 'deploy', 'remote']) {
      expect(source).not.toMatch(new RegExp(`['\" ]${forbidden}['\" ]`));
    }
    expect(source).toContain("'worktree', 'add', '--detach'");
  });

  it('redacts token-like process output before it can be persisted', () => {
    expect(redact(tokenLikeOutput)).not.toContain('sk-1234567890');
  });
});
