import { describe, it, expect } from 'vitest';
import { resolveBase } from '../../../packages/workspace/src/base-revision.js';
import { gitFixture } from '../../fixtures/src/git-fixture.js';
describe('workspace base', () => {
  it('resolves a full commit SHA', async () => {
    const f = gitFixture();
    try {
      expect(await resolveBase(f.root, 'HEAD')).toMatch(/^[a-f0-9]{40}$/);
    } finally {
      f.cleanup();
    }
  });
});
