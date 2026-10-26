import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gitFixture } from '../../fixtures/src/git-fixture.js';
import { discoverRepository } from '../../../packages/project/src/repository-discovery.js';
import type { Project } from '../../../packages/contracts/src/domain.js';
import { openDatabase } from '../../../packages/storage/src/database.js';
import { ProjectRepository } from '../../../packages/storage/src/project-repository.js';
import { prepare } from '../../../packages/workspace/src/workspace-service.js';
import { createPreview } from '../../../packages/workspace/src/workspace-preview-service.js';
import { recoverWorkspaces } from '../../../packages/workspace/src/workspace-recovery-service.js';
import { addWorktree } from '../../../packages/workspace/src/git-worktree.js';

describe('workspace interruption recovery', () => {
  it('persists no intent for stale preview, marks pre-worktree interruption, and completes verified worktrees on recovery', async () => {
    const fixture = gitFixture();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-recovery-home-'));
    const previousHome = process.env.HOME;
    process.env.HOME = home;
    const db = openDatabase(path.join(home, 'state.sqlite'));
    try {
      const repo = await discoverRepository(fixture.root);
      const now = new Date().toISOString();
      const project: Project = {
        project_id: 'proj_recovery',
        display_name: 'Recovery',
        root_realpath: repo.root,
        git_identity_fingerprint: repo.git.fingerprint,
        git_location_fingerprint: repo.git.locationFingerprint,
        git_common_dir_realpath: repo.git.commonDir,
        trust_state: 'trusted',
        registry_state: 'active',
        availability_state: 'available',
        created_at: now,
        updated_at: now,
        last_validated_at: now,
      };
      new ProjectRepository(db).insert(project);
      await expect(prepare(db, project, 'HEAD', 'wrong')).rejects.toMatchObject({
        code: 'PREVIEW_STALE',
      });
      expect(db.prepare('SELECT count(*) AS n FROM operations').get()).toMatchObject({ n: 0 });
      const preview = await createPreview(project, 'HEAD', db);
      await expect(
        prepare(db, project, 'HEAD', preview.digest, async () => {
          throw new Error('interrupted before Git');
        }),
      ).rejects.toThrow();
      expect(
        db.prepare('SELECT state FROM workspaces WHERE workspace_id=?').get(preview.id),
      ).toMatchObject({ state: 'recoverable_incomplete' });
      const outcome = await recoverWorkspaces(db);
      expect(outcome[0]?.state).toBe('failed');
      const next = await createPreview(project, 'HEAD', db);
      await expect(
        prepare(db, project, 'HEAD', next.digest, async (source, target, base) => {
          await addWorktree(source, target, base);
          throw new Error('interrupted after Git');
        }),
      ).rejects.toThrow();
      const recovered = await recoverWorkspaces(db);
      expect(recovered.at(-1)?.state).toBe('completed');
      expect(
        db.prepare('SELECT state FROM workspaces WHERE workspace_id=?').get(next.id),
      ).toMatchObject({ state: 'ready' });
      const beforeIntent = await createPreview(project, 'HEAD', db);
      db.exec(
        "CREATE TRIGGER fail_prepare_intent BEFORE UPDATE OF state ON operations WHEN NEW.kind='prepare_workspace' AND NEW.state='applying' BEGIN SELECT RAISE(ABORT,'injected persistence failure'); END",
      );
      let launched = false;
      await expect(
        prepare(db, project, 'HEAD', beforeIntent.digest, async () => {
          launched = true;
          return '';
        }),
      ).rejects.toThrow();
      expect(launched).toBe(false);
      expect(
        db
          .prepare('SELECT count(*) AS n FROM operations WHERE request_digest=?')
          .get(beforeIntent.digest),
      ).toMatchObject({ n: 1 });
      expect(
        db
          .prepare('SELECT count(*) AS n FROM workspaces WHERE workspace_id=?')
          .get(beforeIntent.id),
      ).toMatchObject({ n: 0 });
    } finally {
      db.close();
      fixture.cleanup();
      fs.rmSync(home, { recursive: true, force: true });
      if (previousHome === undefined) delete process.env.HOME;
      else process.env.HOME = previousHome;
    }
  });
});
