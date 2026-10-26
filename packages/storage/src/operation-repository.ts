import { randomUUID } from 'node:crypto';
import type { Store } from './database.js';
import { transaction } from './transaction.js';
import type { FoundationOperation } from '@spectide/contracts';
export class OperationRepository {
  constructor(private db: Store) {}
  create(
    input: Omit<
      FoundationOperation,
      | 'operation_id'
      | 'started_at'
      | 'finished_at'
      | 'error_code'
      | 'error_redacted'
      | 'next_action'
    >,
  ) {
    const id = `op_${randomUUID()}`,
      now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO operations(operation_id,project_id,kind,idempotency_key,state,request_digest,risk_classification,approval_decision,approval_actor,approved_at,started_at,finished_at,error_code,error_redacted,next_action) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        id,
        input.project_id,
        input.kind,
        input.idempotency_key,
        input.state,
        input.request_digest,
        input.risk_classification,
        input.approval_decision,
        input.approval_actor,
        input.approved_at,
        now,
        null,
        null,
        null,
        null,
      );
    return id;
  }
  bindProject(id: string, projectId: string) {
    this.db.prepare('UPDATE operations SET project_id=? WHERE operation_id=?').run(projectId, id);
  }
  transition(id: string, state: string) {
    const done = ['completed', 'failed', 'recoverable_incomplete'].includes(state);
    this.db
      .prepare('UPDATE operations SET state=?,finished_at=? WHERE operation_id=?')
      .run(state, done ? new Date().toISOString() : null, id);
  }
  get(id: string) {
    return this.db.prepare('SELECT * FROM operations WHERE operation_id=?').get(id) as
      FoundationOperation | undefined;
  }
  listPending() {
    return this.db
      .prepare(
        "SELECT * FROM operations WHERE state IN ('pending','applying','recoverable_incomplete')",
      )
      .all() as FoundationOperation[];
  }
  listRecoverable() {
    return this.db
      .prepare(
        "SELECT operation_id,project_id,kind,state,error_code,error_redacted,next_action,started_at,finished_at FROM operations WHERE state='recoverable_incomplete' ORDER BY started_at",
      )
      .all();
  }
}
