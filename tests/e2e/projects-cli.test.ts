import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { gitFixture, symlinkFixture } from '../fixtures/src/git-fixture.js';

describe('projects CLI acceptance', () => {
  it('registers three projects and rejects a symlink duplicate', () => {
    const fixtures = [gitFixture(), gitFixture(), gitFixture()];
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
      const ids = fixtures.map((fixture) => {
        const result = run(['projects', 'add', fixture.root, '--confirm-trust', '--json']);
        expect(result.status, result.stdout + result.stderr).toBe(0);
        return JSON.parse(result.stdout).project.project_id as string;
      });
      const listing = run(['projects', 'list', '--json']);
      expect(
        JSON.parse(listing.stdout)
          .projects.map((p: { project_id: string }) => p.project_id)
          .sort(),
      ).toEqual([...ids].sort());
      const diagnostics = run(['doctor', '--project', ids[0]!, '--json']);
      expect(diagnostics.status).toBe(0);
      const diagnosticPayload = JSON.parse(diagnostics.stdout);
      expect(diagnosticPayload.diagnostics.length).toBeGreaterThan(0);
      expect(diagnosticPayload.repository.git_identity_fingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect(diagnosticPayload.repository.working_tree_state).toBe('clean');
      expect(diagnosticPayload.compatibility_gate.passed).toBe(false);
      const duplicate = run([
        'projects',
        'add',
        symlinkFixture(fixtures[0]!.root),
        '--confirm-trust',
        '--json',
      ]);
      expect(duplicate.status).not.toBe(0);
      expect(JSON.parse(duplicate.stdout).error.code).toBe('DUPLICATE_PROJECT');
      const firstId = ids[0]!;
      const before = fs.readFileSync(path.join(fixtures[0]!.root, 'README.md'), 'utf8');
      expect(run(['projects', 'rename', firstId, 'Renamed', '--json']).status).toBe(0);
      expect(run(['projects', 'archive', firstId, '--confirm', '--json']).status).toBe(0);
      expect(JSON.parse(run(['projects', 'list', '--json']).stdout).projects).toHaveLength(2);
      expect(run(['projects', 'restore', firstId, '--confirm', '--json']).status).toBe(0);
      expect(run(['projects', 'unregister', firstId, '--confirm', '--json']).status).toBe(0);
      expect(
        JSON.parse(run(['projects', 'list', '--include-archived', '--json']).stdout).projects,
      ).toHaveLength(2);
      expect(fs.readFileSync(path.join(fixtures[0]!.root, 'README.md'), 'utf8')).toBe(before);
    } finally {
      fixtures.forEach((fixture) => fixture.cleanup());
      fs.rmSync(home, { recursive: true, force: true });
    }
  }, 15000);

  it('initializes without rewriting Spec Kit artifacts and records the trust decision', () => {
    const fixture = gitFixture();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-init-home-'));
    const cli = path.resolve('apps/cli/src/main.ts');
    const env = {
      ...process.env,
      HOME: home,
      LOCALAPPDATA: path.join(home, 'AppData', 'Local'),
      XDG_DATA_HOME: path.join(home, '.local', 'share'),
    };
    try {
      fs.mkdirSync(path.join(fixture.root, '.specify'));
      const artifact = path.join(fixture.root, '.specify', 'spec.md');
      fs.writeFileSync(artifact, 'upstream artifact');
      const before = fs.readFileSync(artifact);
      const result = spawnSync(
        process.execPath,
        ['--import', 'tsx', cli, 'init', fixture.root, '--confirm-trust', '--json'],
        { encoding: 'utf8', env },
      );
      expect(result.status, result.stdout + result.stderr).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.discovered_state.specify_artifacts.present).toBe(true);
      expect(fs.readFileSync(artifact)).toEqual(before);
      const stateRoot =
        process.platform === 'darwin'
          ? path.join(home, 'Library', 'Application Support', 'spectide')
          : process.platform === 'win32'
            ? path.join(home, 'AppData', 'Local', 'spectide')
            : path.join(home, '.local', 'share', 'spectide');
      const db = new DatabaseSync(path.join(stateRoot, 'state.sqlite'), { readOnly: true });
      const audit = db
        .prepare(
          'SELECT risk_classification,approval_decision,approval_actor,approved_at,request_digest FROM operations WHERE operation_id=?',
        )
        .get(payload.operation.id) as Record<string, string>;
      expect(audit).toMatchObject({
        risk_classification: 'sensitive',
        approval_decision: 'approved',
      });
      expect(audit.approval_actor).toBeTruthy();
      expect(audit.approved_at).toBeTruthy();
      expect(audit.request_digest).toHaveLength(64);
      db.close();
    } finally {
      fixture.cleanup();
      fs.rmSync(home, { recursive: true, force: true });
    }
  });

  it('relinks a moved repository only after explicit identity validation', () => {
    const fixture = gitFixture();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-relink-home-'));
    const moved = `${fixture.root}-moved`;
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
      const added = run(['projects', 'add', fixture.root, '--confirm-trust', '--json']);
      expect(added.status).toBe(0);
      const id = JSON.parse(added.stdout).project.project_id as string;
      fs.renameSync(fixture.root, moved);
      const linked = run(['projects', 'relink', id, moved, '--confirm-trust', '--json']);
      expect(linked.status, linked.stdout + linked.stderr).toBe(0);
      expect(JSON.parse(linked.stdout).project.root_realpath).toBe(fs.realpathSync(moved));
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
      fs.rmSync(moved, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    }
  });
});
