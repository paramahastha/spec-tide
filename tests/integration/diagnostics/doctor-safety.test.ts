import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gitFixture } from '../../fixtures/src/git-fixture.js';
import { doctor } from '../../../packages/diagnostics/src/doctor-service.js';
import { probeAuthentication } from '../../../packages/diagnostics/src/auth-availability-probe.js';

describe('diagnostic safety', () => {
  it('treats hostile paths and repository-controlled content as data', async () => {
    const fixture = gitFixture();
    const hostile = path.join(path.dirname(fixture.root), 'repo $(touch spectide-injected) ;');
    try {
      fs.renameSync(fixture.root, hostile);
      fs.mkdirSync(path.join(hostile, '.specify'));
      fs.writeFileSync(
        path.join(hostile, '.specify', 'spec.md'),
        'workflow: $(touch spectide-injected)',
      );
      fs.mkdirSync(path.join(hostile, '.spectide'));
      fs.writeFileSync(
        path.join(hostile, '.spectide', 'config.yml'),
        'command: "$(touch spectide-injected)"\ntoken: sk-1234567890abcdefghijklmnop',
      );
      const result = await doctor(hostile);
      expect(result.repo.root).toBe(fs.realpathSync(hostile));
      expect(JSON.stringify(result)).not.toContain('1234567890');
      expect(fs.existsSync(path.join(process.cwd(), 'spectide-injected'))).toBe(false);
    } finally {
      fs.rmSync(hostile, { recursive: true, force: true });
      fixture.cleanup();
    }
  });

  it('retains only authentication availability and never returns tool output', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-auth-probe-'));
    const bin = path.join(root, 'bin');
    const oldPath = process.env.PATH;
    fs.mkdirSync(bin);
    for (const name of ['codex', 'opencode']) {
      const file = path.join(bin, name);
      const body =
        name === 'codex'
          ? 'if [ "$1" = "login" ]; then printf "%s\\n" "Logged in with sk-super-secret-value"; else exit 64; fi'
          : 'if [ "$1" = "auth" ]; then printf "%s\\n" \'[{"provider":"fixture","key":"sk-super-secret-value"}]\'; else exit 64; fi';
      fs.writeFileSync(file, `#!/bin/sh\n${body}\n`, { mode: 0o700 });
    }
    process.env.PATH = `${bin}${path.delimiter}${oldPath || ''}`;
    try {
      const result = await probeAuthentication(process.cwd());
      expect(result.result).toBe('ready');
      expect(result.capabilities).toMatchObject({
        credentials_read: false,
        output_retained: false,
      });
      expect(JSON.stringify(result)).not.toContain('super-secret');
    } finally {
      process.env.PATH = oldPath;
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
