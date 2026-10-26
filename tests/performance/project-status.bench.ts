import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
export async function benchmarkDoctor() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-100k-'));
  try {
    for (let i = 0; i < 100000; i++) {
      const p = path.join(root, `f-${i}`);
      fs.writeFileSync(p, 'x');
    }
    spawnSync('git', ['init', '-q'], { cwd: root });
    spawnSync('git', ['config', 'user.email', 'benchmark@example.invalid'], { cwd: root });
    spawnSync('git', ['config', 'user.name', 'Benchmark'], { cwd: root });
    spawnSync('git', ['add', '.'], { cwd: root });
    const commit = spawnSync('git', ['commit', '-qm', 'benchmark fixture'], { cwd: root });
    if (commit.status !== 0) throw new Error('fixture commit failed');
    const tracked = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
      .stdout.trim()
      .split('\n').length;
    if (tracked !== 100000) throw new Error(`expected 100000 tracked files, found ${tracked}`);
    const cli = path.resolve('apps/cli/src/main.ts');
    const times: number[] = [];
    const home = path.join(root, '.benchmark-home');
    fs.mkdirSync(home, { recursive: true });
    const env = { ...process.env, HOME: home, XDG_DATA_HOME: path.join(home, '.local', 'share') };
    const register = spawnSync(
      process.execPath,
      ['--import', 'tsx', cli, 'projects', 'add', root, '--confirm-trust', '--json'],
      { encoding: 'utf8', env, timeout: 10000 },
    );
    if (register.status !== 0) throw new Error('project registration failed');
    const projectId = JSON.parse(register.stdout).project.project_id;
    for (let i = 0; i < 21; i++) {
      const t = performance.now();
      const r = spawnSync(
        process.execPath,
        ['--import', 'tsx', cli, 'doctor', '--project', projectId, '--json'],
        {
          encoding: 'utf8',
          timeout: 10000,
          env,
        },
      );
      times.push(performance.now() - t);
      if (r.status !== 0) throw new Error('doctor failed');
    }
    const measured = times.slice(1).sort((a, b) => a - b);
    const gitVersion = spawnSync('git', ['--version'], { encoding: 'utf8' }).stdout.trim();
    const p95 = measured[Math.ceil(0.95 * measured.length) - 1]!;
    const passed = p95 < 2000;
    return {
      file_count: 100000,
      durations_ms: times,
      runs: times.map((duration_ms, index) => ({
        index,
        kind: index === 0 ? 'warmup' : 'measured',
        duration_ms,
        file_count: tracked,
        os: `${os.type()} ${os.release()}`,
        cpu: os.cpus()[0]?.model,
        node: process.version,
        git: gitVersion,
        passed: index === 0 ? null : duration_ms < 2000,
      })),
      nearest_rank_p95_ms: p95,
      os: `${os.type()} ${os.release()}`,
      cpu: os.cpus()[0]?.model,
      node: process.version,
      git: gitVersion,
      passed,
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(path.join(root, '.benchmark-home'), { recursive: true, force: true });
  }
}
