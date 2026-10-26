import { describe, it, expect } from 'vitest';
import { addWorktree } from '../../../packages/workspace/src/git-worktree.js';
import { gitFixture } from '../../fixtures/src/git-fixture.js';
import { resolveTarget } from '../../../packages/workspace/src/target-resolution.js';
import { discoverRepository } from '../../../packages/project/src/repository-discovery.js';
import type { Project } from '../../../packages/contracts/src/domain.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('workspace boundaries', () => {
  it('rejects a project workspace directory redirected outside the app-owned root', async () => {
    const fixture = gitFixture();
    const owned = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-owned-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-outside-'));
    try {
      const root = path.join(owned, 'worktrees');
      fs.mkdirSync(root);
      fs.symlinkSync(outside, path.join(root, 'proj'), 'dir');
      const target = path.join(root, 'proj', 'ws');
      const sha = fixture.run('rev-parse', 'HEAD');
      await expect(addWorktree(fixture.root, target, sha, root)).rejects.toMatchObject({
        code: 'WORKSPACE_BOUNDARY_VIOLATION',
      });
      expect(fs.readdirSync(outside)).toHaveLength(0);
    } finally {
      fixture.cleanup();
      fs.rmSync(owned, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it('refuses untrusted, archived, and shared-checkout targets', async () => {
    const fixture = gitFixture();
    try {
      const git = await discoverRepository(fixture.root);
      const now = new Date().toISOString();
      const base: Project = {
        project_id: 'proj_policy',
        display_name: 'Policy',
        root_realpath: git.root,
        git_identity_fingerprint: git.git.fingerprint,
        git_location_fingerprint: git.git.locationFingerprint,
        git_common_dir_realpath: git.git.commonDir,
        trust_state: 'untrusted',
        registry_state: 'active',
        availability_state: 'available',
        created_at: now,
        updated_at: now,
        last_validated_at: now,
      };
      const repo = { list: () => [base] } as never;
      await expect(resolveTarget(repo, 'proj_policy')).rejects.toMatchObject({
        code: 'PROJECT_UNAVAILABLE',
      });
      base.trust_state = 'trusted';
      base.registry_state = 'archived';
      await expect(resolveTarget(repo, 'proj_policy')).rejects.toMatchObject({
        code: 'PROJECT_UNAVAILABLE',
      });
      const sha = fixture.run('rev-parse', 'HEAD');
      const owned = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-shared-checkout-'));
      try {
        await expect(
          addWorktree(fixture.root, fixture.root, sha, path.join(owned, 'worktrees')),
        ).rejects.toMatchObject({ code: 'WORKSPACE_BOUNDARY_VIOLATION' });
      } finally {
        fs.rmSync(owned, { recursive: true, force: true });
      }
    } finally {
      fixture.cleanup();
    }
  });
});
