import type { Store } from './database.js';
import crypto from 'node:crypto';
import type { Project } from '@spectide/contracts';
export class ProjectRepository {
  constructor(private db: Store) {}
  atomic<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }
  insert(p: Project) {
    this.db
      .prepare(
        'INSERT INTO projects VALUES(@project_id,@display_name,@root_realpath,@git_identity_fingerprint,@git_location_fingerprint,@git_common_dir_realpath,@trust_state,@registry_state,@availability_state,@created_at,@updated_at,@last_validated_at)',
      )
      .run(p);
  }
  get(id: string) {
    return this.db.prepare('SELECT * FROM projects WHERE project_id=?').get(id) as
      Project | undefined;
  }
  byRoot(root: string) {
    return this.db
      .prepare("SELECT * FROM projects WHERE root_realpath=? AND registry_state != 'unregistered'")
      .get(root) as Project | undefined;
  }
  list(includeArchived = false) {
    return this.db
      .prepare(
        `SELECT * FROM projects WHERE registry_state != 'unregistered' ${includeArchived ? '' : "AND registry_state='active'"} ORDER BY display_name`,
      )
      .all() as Project[];
  }
  recordRelink(input: {
    projectId: string;
    oldRoot: string;
    newRoot: string;
    fingerprint: string;
    operationId: string;
  }) {
    this.db
      .prepare(
        "UPDATE project_locations SET status='superseded' WHERE project_id=? AND status='current'",
      )
      .run(input.projectId);
    this.addLocation({
      location_id: `loc_${crypto.randomUUID()}`,
      project_id: input.projectId,
      root_realpath: input.newRoot,
      status: 'current',
      validated_fingerprint: input.fingerprint,
      validation_operation_id: input.operationId,
    });
  }
  addLocation(input: {
    location_id: string;
    project_id: string;
    root_realpath: string;
    status: string;
    validated_fingerprint: string;
    validation_operation_id: string;
  }) {
    this.db
      .prepare(
        'INSERT INTO project_locations VALUES(@location_id,@project_id,@root_realpath,@status,@validated_fingerprint,@validation_operation_id)',
      )
      .run(input);
  }
  update(p: Project) {
    this.db
      .prepare(
        'UPDATE projects SET display_name=?,root_realpath=?,git_identity_fingerprint=?,git_location_fingerprint=?,git_common_dir_realpath=?,trust_state=?,registry_state=?,availability_state=?,updated_at=?,last_validated_at=? WHERE project_id=?',
      )
      .run(
        p.display_name,
        p.root_realpath,
        p.git_identity_fingerprint,
        p.git_location_fingerprint,
        p.git_common_dir_realpath,
        p.trust_state,
        p.registry_state,
        p.availability_state,
        p.updated_at,
        p.last_validated_at,
        p.project_id,
      );
  }
  saveConfigurationSnapshot(input: {
    snapshot_id: string;
    project_id: string;
    source_path: string;
    fingerprint: string;
    kind: string;
    schema_version: string | null;
    discovery_status: string;
    safe_summary: string;
  }) {
    this.db
      .prepare(
        'INSERT INTO config_snapshots(snapshot_id,project_id,source_path,fingerprint,kind,schema_version,discovery_status,safe_summary) VALUES(@snapshot_id,@project_id,@source_path,@fingerprint,@kind,@schema_version,@discovery_status,@safe_summary)',
      )
      .run({ ...input, safe_summary: input.safe_summary.slice(0, 500) });
  }
  listConfigurationSnapshots(projectId: string) {
    return this.db
      .prepare('SELECT * FROM config_snapshots WHERE project_id=? ORDER BY rowid')
      .all(projectId);
  }
}
