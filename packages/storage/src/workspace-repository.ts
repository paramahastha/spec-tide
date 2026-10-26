import type { Store } from './database.js';
export function saveWorkspace(
  db: Store,
  w: {
    id: string;
    projectId: string;
    operationId: string;
    root: string;
    base: string;
    state: string;
  },
) {
  db.prepare('INSERT INTO workspaces VALUES(?,?,?,?,?,?,?,?)').run(
    w.id,
    w.projectId,
    w.operationId,
    w.root,
    w.base,
    w.state,
    new Date().toISOString(),
    null,
  );
}
export function setWorkspaceState(db: Store, id: string, state: string, root?: string) {
  db.prepare(
    'UPDATE workspaces SET state=?,root_realpath=COALESCE(?,root_realpath),validated_at=? WHERE workspace_id=?',
  ).run(state, root ?? null, state === 'ready' ? new Date().toISOString() : null, id);
}
