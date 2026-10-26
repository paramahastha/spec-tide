import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { gitFixture } from '../../fixtures/src/git-fixture.js';
import { discoverRepository } from '../../../packages/project/src/repository-discovery.js';
import { revalidateProject } from '../../../packages/project/src/project-service.js';
import { relink } from '../../../packages/project/src/relink-service.js';
import type { Project } from '../../../packages/contracts/src/domain.js';
import { openDatabase } from '../../../packages/storage/src/database.js';
import { ProjectRepository } from '../../../packages/storage/src/project-repository.js';

describe('project revalidation and relink', () => {
  it('marks a moved project unavailable and relinks only the same Git identity', async () => {
    const fixture = gitFixture();
    const moved = `${fixture.root}-moved`;
    try {
      const found = await discoverRepository(fixture.root);
      const now = new Date().toISOString();
      const project: Project = {
        project_id: 'proj_relink',
        display_name: 'Relink',
        root_realpath: found.root,
        git_identity_fingerprint: found.git.fingerprint,
        git_location_fingerprint: found.git.locationFingerprint,
        git_common_dir_realpath: found.git.commonDir,
        trust_state: 'trusted',
        registry_state: 'active',
        availability_state: 'available',
        created_at: now,
        updated_at: now,
        last_validated_at: now,
      };
      fs.renameSync(fixture.root, moved);
      expect((await revalidateProject(project)).availability_state).toBe('missing');
      const result = await relink(project, moved);
      expect(result.root_realpath).toBe(fs.realpathSync(moved));
      expect(result.git_identity_fingerprint).toBe(found.git.fingerprint);
      expect(result.availability_state).toBe('available');
      fs.rmSync(moved, { recursive: true, force: true });
    } finally {
      fixture.cleanup();
    }
  });

  it('flags a replaced repository as an identity mismatch', async () => {
    const original = gitFixture();
    const replacement = gitFixture('different root content\n');
    try {
      const found = await discoverRepository(original.root);
      const now = new Date().toISOString();
      const project: Project = {
        project_id: 'proj_replaced',
        display_name: 'Replaced',
        root_realpath: found.root,
        git_identity_fingerprint: found.git.fingerprint,
        git_location_fingerprint: found.git.locationFingerprint,
        git_common_dir_realpath: found.git.commonDir,
        trust_state: 'trusted',
        registry_state: 'active',
        availability_state: 'available',
        created_at: now,
        updated_at: now,
        last_validated_at: now,
      };
      fs.rmSync(original.root, { recursive: true, force: true });
      fs.cpSync(replacement.root, original.root, { recursive: true });
      expect((await revalidateProject(project)).availability_state).toBe('identity_mismatch');
    } finally {
      original.cleanup();
      replacement.cleanup();
    }
  });

  it('persists canonical availability outcomes for later listing and restoration checks', async () => {
    const fixture = gitFixture();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-revalidate-'));
    const db = openDatabase(path.join(home, 'state.sqlite'));
    try {
      const found = await discoverRepository(fixture.root);
      const now = new Date().toISOString();
      const project: Project = {
        project_id: 'proj_persisted_state',
        display_name: 'Persisted state',
        root_realpath: found.root,
        git_identity_fingerprint: found.git.fingerprint,
        git_location_fingerprint: found.git.locationFingerprint,
        git_common_dir_realpath: found.git.commonDir,
        trust_state: 'trusted',
        registry_state: 'active',
        availability_state: 'available',
        created_at: now,
        updated_at: now,
        last_validated_at: now,
      };
      const projects = new ProjectRepository(db);
      projects.insert(project);
      fs.renameSync(fixture.root, `${fixture.root}-moved`);
      const refreshed = await revalidateProject(project, projects);
      expect(refreshed.availability_state).toBe('missing');
      expect(projects.get(project.project_id)?.availability_state).toBe('missing');
      fs.renameSync(`${fixture.root}-moved`, fixture.root);
    } finally {
      db.close();
      fixture.cleanup();
      fs.rmSync(home, { recursive: true, force: true });
    }
  });
});
