import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
export function gitFixture(initialContent = 'fixture\n') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-fixture-'));
  const run = (...args: string[]) => {
    const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(r.stderr);
    return r.stdout.trim();
  };
  run('init', '-q');
  run('config', 'user.email', 'fixture@example.invalid');
  run('config', 'user.name', 'Fixture');
  fs.writeFileSync(path.join(root, 'README.md'), initialContent);
  run('add', '.');
  run('commit', '-m', 'fixture');
  return { root, run, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
export function symlinkFixture(source: string) {
  const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-link-')), 'alias');
  fs.symlinkSync(source, p, 'dir');
  return p;
}
