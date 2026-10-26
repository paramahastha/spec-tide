import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { gitFixture } from '../../fixtures/src/git-fixture.js';
import { doctor } from '../../../packages/diagnostics/src/doctor-service.js';

describe('doctor read-only behavior', () => {
  it('does not alter repository artifacts', async () => {
    const f = gitFixture();
    try {
      fs.mkdirSync(`${f.root}/.specify`);
      fs.writeFileSync(`${f.root}/.specify/spec.md`, 'keep');
      const file = `${f.root}/.specify/spec.md`;
      const before = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
      await doctor(f.root);
      expect(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')).toBe(before);
    } finally {
      f.cleanup();
    }
  });

  it('reports canonical Git identity and content-free tracked working-tree state', async () => {
    const f = gitFixture();
    try {
      const clean = await doctor(f.root);
      expect(clean.repo.root).toBe(fs.realpathSync(f.root));
      expect(clean.repo.git.fingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect(clean.repo.git.workingTreeState).toBe('clean');
      fs.writeFileSync(`${f.root}/README.md`, 'modified without exposing this content');
      const modified = await doctor(f.root);
      expect(modified.repo.git.workingTreeState).toBe('modified');
      expect(JSON.stringify(modified.repo)).not.toContain('modified without exposing');
    } finally {
      f.cleanup();
    }
  });

  it('reports non-Git and unresolvable paths safely', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-non-git-'));
    try {
      await expect(doctor(directory)).rejects.toMatchObject({ code: 'PATH_NOT_GIT_REPOSITORY' });
      await expect(doctor(path.join(directory, 'missing'))).rejects.toMatchObject({
        code: 'PATH_UNRESOLVABLE',
      });
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
