import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gitFixture } from '../../fixtures/src/git-fixture.js';
import {
  discoverRepository,
  registerProject,
} from '../../../packages/project/src/repository-discovery.js';
import { openDatabase } from '../../../packages/storage/src/database.js';
import { ProjectRepository } from '../../../packages/storage/src/project-repository.js';
import { OperationRepository } from '../../../packages/storage/src/operation-repository.js';

describe('registration persistence recovery', () => {
  it('rolls back each injected boundary and retries to one durable registration', async () => {
    const fixture = gitFixture();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-register-'));
    const filename = path.join(dir, 'state.sqlite');
    let db = openDatabase(filename);
    try {
      const found = await discoverRepository(fixture.root);
      const projects = new ProjectRepository(db);
      const operations = new OperationRepository(db);
      for (const stage of ['operation', 'project', 'location'] as const) {
        await expect(
          registerProject(
            found,
            'Fixture',
            projects,
            { digest: 'digest', actor: 'local-user', at: new Date().toISOString() },
            operations,
            (current) => {
              if (current === stage) throw new Error('injected interruption');
            },
          ),
        ).rejects.toThrow();
        expect(db.prepare('SELECT count(*) AS n FROM projects').get()).toMatchObject({ n: 0 });
        expect(db.prepare('SELECT count(*) AS n FROM operations').get()).toMatchObject({ n: 0 });
      }
      const result = await registerProject(
        found,
        'Fixture',
        projects,
        { digest: 'digest', actor: 'local-user', at: new Date().toISOString() },
        operations,
      );
      db.close();
      db = openDatabase(filename);
      expect(db.prepare('SELECT count(*) AS n FROM projects').get()).toMatchObject({ n: 1 });
      expect(
        db
          .prepare("SELECT count(*) AS n FROM operations WHERE project_id=? AND state='completed'")
          .get(result.project.project_id),
      ).toMatchObject({ n: 1 });
      expect(
        db
          .prepare('SELECT count(*) AS n FROM project_locations WHERE project_id=?')
          .get(result.project.project_id),
      ).toMatchObject({ n: 1 });
    } finally {
      db.close();
      fixture.cleanup();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
