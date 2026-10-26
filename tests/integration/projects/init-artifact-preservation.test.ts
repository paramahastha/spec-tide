import { describe, it, expect } from 'vitest';
import { discoverArtifacts } from '../../../packages/project/src/artifact-discovery.js';
import { gitFixture } from '../../fixtures/src/git-fixture.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../../../packages/storage/src/database.js';
import { ProjectRepository } from '../../../packages/storage/src/project-repository.js';
import { persistDiscoverySnapshots } from '../../../packages/project/src/config-snapshot.js';
describe('init discovery', () => {
  it('only fingerprints upstream artifacts', () => {
    const f = gitFixture();
    try {
      fs.mkdirSync(`${f.root}/.specify`);
      fs.writeFileSync(`${f.root}/.specify/spec.md`, 'x');
      expect(discoverArtifacts(f.root).present).toBe(true);
    } finally {
      f.cleanup();
    }
  });
  it('persists bounded, project-owned discovery snapshots without importing values', () => {
    const f = gitFixture();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-snapshots-'));
    const db = openDatabase(path.join(dir, 'state.sqlite'));
    try {
      fs.mkdirSync(`${f.root}/.specify`);
      fs.writeFileSync(`${f.root}/.specify/spec.md`, 'upstream artifact');
      fs.mkdirSync(`${f.root}/.spectide`);
      fs.writeFileSync(`${f.root}/.spectide/config.yml`, 'version: 1\nworkspace: private-value\n');
      const now = new Date().toISOString();
      const project = new ProjectRepository(db);
      project.insert({
        project_id: 'proj_snapshot',
        display_name: 'Snapshot',
        root_realpath: f.root,
        git_identity_fingerprint: 'identity',
        git_location_fingerprint: 'location',
        git_common_dir_realpath: path.join(f.root, '.git'),
        trust_state: 'trusted',
        registry_state: 'active',
        availability_state: 'available',
        created_at: now,
        updated_at: now,
        last_validated_at: now,
      });
      persistDiscoverySnapshots(project, 'proj_snapshot', f.root);
      const rows = project.listConfigurationSnapshots('proj_snapshot') as {
        project_id: string;
        kind: string;
        safe_summary: string;
      }[];
      expect(rows.map((row) => row.kind).sort()).toEqual(['specify_artifacts', 'spectide_config']);
      expect(rows.every((row) => row.project_id === 'proj_snapshot')).toBe(true);
      expect(JSON.stringify(rows)).not.toContain('private-value');
      expect(rows.every((row) => row.safe_summary.length <= 500)).toBe(true);
    } finally {
      db.close();
      f.cleanup();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
