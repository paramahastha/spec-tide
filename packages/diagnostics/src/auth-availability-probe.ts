import { runProcess } from '@spectide/core';

type AuthTool = 'codex' | 'opencode';

/** Ask tools for documented status output, then discard it without persistence or display. */
export async function probeAuthentication(root: string) {
  const outcomes = await Promise.all(
    (['codex', 'opencode'] as const).map(async (tool: AuthTool) => {
      const args = tool === 'codex' ? ['login', 'status'] : ['auth', 'list', '--format', 'json'];
      try {
        const response = await runProcess({
          executable: tool,
          args,
          cwd: root,
          authorizedRoots: [root],
          timeoutMs: 1000,
          maxOutputBytes: 2048,
        });
        if (response.code !== 0) return { tool, available: null };
        if (tool === 'codex') {
          const output = `${response.stdout}\n${response.stderr}`;
          if (/not logged in/i.test(output)) return { tool, available: false };
          if (/logged in/i.test(output)) return { tool, available: true };
          return { tool, available: null };
        }
        try {
          const records: unknown = JSON.parse(response.stdout);
          if (Array.isArray(records)) return { tool, available: records.length > 0 };
          return { tool, available: null };
        } catch {
          return { tool, available: null };
        }
      } catch {
        return { tool, available: null };
      }
    }),
  );
  const count = outcomes.filter((item) => item.available === true).length;
  const known = outcomes.filter((item) => item.available !== null).length;
  return {
    subject: 'authentication-availability',
    result: count ? ('ready' as const) : known ? ('needs_setup' as const) : ('unverified' as const),
    observed_version: null,
    message: count
      ? `Authentication status was available from ${count} supported local tool(s).`
      : known
        ? 'No supported local tool reported configured authentication.'
        : 'Authentication availability could not be verified by the installed tools.',
    next_action: count
      ? 'Authentication output is not retained; verify access only when starting an approved workflow.'
      : known
        ? 'Authenticate a supported local tool, then rerun diagnostics.'
        : 'Check authentication status with the selected tool using its documented local command.',
    capabilities: {
      checked_tools: outcomes.length,
      credentials_read: false,
      output_retained: false,
    },
  };
}
