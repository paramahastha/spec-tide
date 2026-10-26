import type { Store } from './database.js';
export function saveCompatibility(
  db: Store,
  r: {
    id: string;
    projectId: string | null;
    kind: string;
    name: string;
    version: string | null;
    capabilities: unknown;
    result: string;
    evidence: string;
    limitations: string;
    nextAction: string;
    resume: string | null;
  },
) {
  db.prepare('INSERT INTO compatibility_records VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(
    r.id,
    r.projectId,
    r.kind,
    r.name,
    r.version,
    JSON.stringify(r.capabilities ?? {}),
    r.result,
    r.evidence ?? '',
    r.limitations,
    r.nextAction,
    r.resume,
    new Date().toISOString(),
  );
}
