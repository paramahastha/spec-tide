import { runProcess } from '@spectide/core';
export async function probeOpenCode(root: string) {
  let r: Awaited<ReturnType<typeof runProcess>>;
  try {
    r = await runProcess({
      executable: 'opencode',
      args: ['--version'],
      cwd: root,
      authorizedRoots: [root],
      timeoutMs: 3000,
      maxOutputBytes: 1000,
    });
  } catch {
    return {
      subject: 'opencode-interface',
      result: 'needs_setup' as const,
      observed_version: null,
      message: 'OpenCode CLI was not observed.',
      next_action: 'Install OpenCode CLI or select another supported local interface.',
      capabilities: {
        version_command_observed: false,
        non_mutating_version_boundary: true,
        workflow_execution: 'unverified',
        interruption_resume: 'unverified',
      },
      evidence_redacted: 'No version output was observed.',
    };
  }
  const observed = r.code === 0 ? r.stdout.trim() : null;
  return {
    subject: 'opencode-interface',
    result: r.code === 0 ? ('unverified' as const) : ('needs_setup' as const),
    observed_version: observed,
    message:
      r.code === 0
        ? 'OpenCode CLI is installed; workflow compatibility is not established.'
        : 'OpenCode CLI was not observed.',
    next_action: 'Run the safe workflow and interruption/resume fixture before claiming support.',
    capabilities: {
      version_command_observed: r.code === 0,
      non_mutating_version_boundary: true,
      workflow_execution: 'unverified',
      interruption_resume: 'unverified',
    },
    evidence_redacted:
      r.code === 0
        ? `Observed sanitized version output: ${observed}`
        : 'No version output was observed.',
  };
}
