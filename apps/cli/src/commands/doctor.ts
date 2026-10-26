import { doctor, storedCompatibilityGate } from '@spectide/diagnostics';
import { selectProject, projectStatus } from '@spectide/project';
import { saveCompatibility, type ProjectRepository, type Store } from '@spectide/storage';
import { randomUUID } from 'node:crypto';
export async function runDoctor(
  pathname: string | undefined,
  projectSelector: string | undefined,
  repo: ProjectRepository,
  db: Store,
) {
  let target = pathname || process.cwd(),
    projectId: string | null = null;
  if (projectSelector) {
    const p = selectProject(repo, projectSelector);
    const status = await projectStatus(p, repo);
    target = status.root_realpath;
    projectId = p.project_id;
  }
  const result = await doctor(target);
  for (const d of result.diagnostics) {
    if (d.subject === 'git') continue;
    const kind =
      d.subject === 'spec-kit-artifacts'
        ? 'spec_kit'
        : d.subject.endsWith('-interface')
          ? 'agent_interface'
          : d.subject === 'test-command'
            ? 'test_command'
            : 'authentication_availability';
    saveCompatibility(db, {
      id: `compat_${randomUUID()}`,
      projectId,
      kind,
      name: d.subject,
      version: d.observed_version,
      capabilities: 'capabilities' in d ? d.capabilities : { result: d.result },
      result: d.result,
      evidence: 'evidence_redacted' in d ? d.evidence_redacted : d.message,
      limitations:
        d.result === 'ready'
          ? 'None observed.'
          : 'Compatibility not established by availability probing.',
      nextAction: d.next_action,
      resume: null,
    });
  }
  return { ...result, compatibility_gate: storedCompatibilityGate(db, projectId) };
}
