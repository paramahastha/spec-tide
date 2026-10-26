export function compatibilityGate(
  records: {
    subject: string;
    result: string;
    resume?: string | null;
    version?: string | null;
    capabilities?: Record<string, unknown>;
    evidence?: string;
  }[],
) {
  const qualifies = (r: (typeof records)[number]) =>
    r.result === 'ready' &&
    Boolean(r.version) &&
    r.capabilities?.evidence_origin === 'observed_tool' &&
    r.capabilities?.safe_boundary_completed === true &&
    r.resume === 'resumed' &&
    r.capabilities?.resume_completed === true &&
    Boolean(r.evidence?.trim());
  const spec = records.some((r) => r.subject === 'spec-kit' && qualifies(r));
  const interfaces = records.filter((r) => r.subject !== 'spec-kit' && qualifies(r));
  return {
    passed: spec && new Set(interfaces.map((r) => r.subject)).size >= 2,
    reason:
      spec && new Set(interfaces.map((r) => r.subject)).size >= 2
        ? 'required boundaries reproduced'
        : 'requires one Spec Kit boundary and two interfaces with resume evidence',
  };
}

export function compatibilityGateFromRecords(
  rows: {
    subject_kind: string;
    subject_name: string;
    observed_version: string | null;
    capabilities: string | Record<string, unknown>;
    result: string;
    evidence_redacted: string;
    resume_result: string | null;
  }[],
) {
  return compatibilityGate(
    rows.map((row) => ({
      subject:
        row.subject_kind === 'spec_kit'
          ? 'spec-kit'
          : row.subject_kind === 'agent_interface'
            ? row.subject_name
            : row.subject_kind,
      version: row.observed_version,
      capabilities:
        typeof row.capabilities === 'string'
          ? (JSON.parse(row.capabilities) as Record<string, unknown>)
          : row.capabilities,
      result: row.result,
      evidence: row.evidence_redacted,
      resume: row.resume_result,
    })),
  );
}
/** Evaluate machine-local compatibility only from persisted sanitized records. */
export function storedCompatibilityGate(
  db: {
    prepare(sql: string): { all(...values: unknown[]): unknown[] };
  },
  projectId: string | null,
) {
  const scopedQuery = projectId
    ? 'SELECT subject_kind,subject_name,observed_version,capabilities,result,evidence_redacted,resume_result FROM compatibility_records WHERE project_id IS NULL OR project_id=? ORDER BY observed_at'
    : 'SELECT subject_kind,subject_name,observed_version,capabilities,result,evidence_redacted,resume_result FROM compatibility_records WHERE project_id IS NULL ORDER BY observed_at';
  const rows = db.prepare(scopedQuery).all(...(projectId ? [projectId] : [])) as {
    subject_kind: string;
    subject_name: string;
    observed_version: string | null;
    capabilities: string | Record<string, unknown>;
    result: string;
    evidence_redacted: string;
    resume_result: string | null;
  }[];
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) latest.set(`${row.subject_kind}:${row.subject_name}`, row);
  return compatibilityGateFromRecords([...latest.values()]);
}
