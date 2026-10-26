import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { gitFixture } from '../fixtures/src/git-fixture.js';
import { DatabaseSync } from 'node:sqlite';

describe('foundation CLI', () => {
  it('shows help without creating local state', () => {
    const cli = path.resolve('apps/cli/src/main.ts');
    const r = spawnSync(process.execPath, ['--import', 'tsx', cli, '--help'], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('doctor');
  });

  it('previews and prepares a detached worktree while preserving source edits', () => {
    const fixture = gitFixture();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-home-'));
    const cli = path.resolve('apps/cli/src/main.ts');
    const env = {
      ...process.env,
      HOME: home,
      LOCALAPPDATA: path.join(home, 'AppData', 'Local'),
      XDG_DATA_HOME: path.join(home, '.local', 'share'),
    };
    const run = (args: string[]) =>
      spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], { encoding: 'utf8', env });
    try {
      const add = run(['projects', 'add', fixture.root, '--confirm-trust', '--json']);
      expect(add.status, add.stdout + add.stderr).toBe(0);
      const projectId = JSON.parse(add.stdout).project.project_id as string;
      fs.writeFileSync(path.join(fixture.root, 'local-change.txt'), 'preserve');
      const preview = run([
        'workspace',
        'prepare',
        '--project',
        projectId,
        '--base',
        'HEAD',
        '--preview',
        '--json',
      ]);
      expect(preview.status).toBe(0);
      const previewResult = JSON.parse(preview.stdout);
      expect(previewResult.operation.state).toBe('pending');
      const digest = previewResult.confirmation_digest as string;
      const prepared = run([
        'workspace',
        'prepare',
        '--project',
        projectId,
        '--base',
        'HEAD',
        '--confirm',
        digest,
        '--json',
      ]);
      expect(prepared.status).toBe(0);
      expect(fs.readFileSync(path.join(fixture.root, 'local-change.txt'), 'utf8')).toBe('preserve');
      const result = JSON.parse(prepared.stdout);
      expect(result.workspace.state).toBe('ready');
      const appData =
        process.platform === 'darwin'
          ? path.join(home, 'Library', 'Application Support', 'spectide')
          : process.platform === 'win32'
            ? path.join(home, 'AppData', 'Local', 'spectide')
            : path.join(home, '.local', 'share', 'spectide');
      const state = new DatabaseSync(path.join(appData, 'state.sqlite'), { readOnly: true });
      const audit = state
        .prepare(
          'SELECT risk_classification,approval_decision,approval_actor,approved_at,request_digest FROM operations WHERE operation_id=?',
        )
        .get(result.operation.id) as Record<string, string>;
      expect(audit).toMatchObject({
        risk_classification: 'sensitive',
        approval_decision: 'approved',
        request_digest: digest,
      });
      expect(audit.approval_actor).toBeTruthy();
      expect(audit.approved_at).toBeTruthy();
      state.close();
    } finally {
      fixture.cleanup();
      fs.rmSync(home, { recursive: true, force: true });
    }
  });
});
