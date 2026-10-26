import { describe, it, expect } from 'vitest';
import { DiagnosticSchema, RepositorySummarySchema } from '../../../packages/contracts/src/cli.js';
describe('doctor contract', () => {
  it('supports all diagnostic result categories', () => {
    for (const result of ['ready', 'needs_setup', 'unsupported', 'unverified'])
      expect(
        DiagnosticSchema.parse({
          subject: 'fixture',
          result,
          observed_version: null,
          message: 'safe',
          next_action: 'next',
        }).result,
      ).toBe(result);
  });
  it('validates a redacted repository identity and status summary', () => {
    expect(
      RepositorySummarySchema.parse({
        root_realpath: '/canonical/repository',
        git_identity_fingerprint: 'a'.repeat(64),
        working_tree_state: 'modified',
      }).working_tree_state,
    ).toBe('modified');
  });
});
