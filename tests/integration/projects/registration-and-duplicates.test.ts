import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { gitFixture } from '../../fixtures/src/git-fixture.js';
import { discoverRepository } from '../../../packages/project/src/repository-discovery.js';
describe('project identity', () => {
  it('canonicalizes a Git root', async () => {
    const f = gitFixture();
    try {
      const r = await discoverRepository(f.root);
      expect(r.root).toBe(fs.realpathSync(f.root));
      expect(r.git.fingerprint).toHaveLength(64);
    } finally {
      f.cleanup();
    }
  });
});
