import { discoverRepository, inspectWorkingTreeState } from '@spectide/project';
import { probeSpecKit } from './speckit-probe.js';
import { probeTestCommand } from './test-command-probe.js';
import { probeAuthentication } from './auth-availability-probe.js';
import { probeCodex } from './interfaces/codex.js';
import { probeOpenCode } from './interfaces/opencode.js';
export async function doctor(input: string) {
  const repo = await discoverRepository(input);
  const workingTreeState = await inspectWorkingTreeState(repo.root);
  const [codex, open, authentication] = await Promise.all([
    probeCodex(repo.root),
    probeOpenCode(repo.root),
    probeAuthentication(repo.root),
  ]);
  return {
    repo: { ...repo, git: { ...repo.git, workingTreeState } },
    diagnostics: [
      {
        subject: 'git',
        result: 'ready',
        observed_version: null,
        message: 'Git repository identity was inspected.',
        next_action: 'No action required.',
      },
      probeSpecKit(repo.root),
      probeTestCommand(repo.root),
      authentication,
      codex,
      open,
    ],
  };
}
