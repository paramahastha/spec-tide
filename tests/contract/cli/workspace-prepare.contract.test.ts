import { describe, it, expect } from 'vitest';
import { ERROR_CODES } from '../../../packages/contracts/src/errors.js';
import { SuccessEnvelope } from '../../../packages/contracts/src/cli.js';
describe('workspace prepare contract', () => {
  it('has digest and boundary refusal codes', () => {
    expect(ERROR_CODES).toContain('PREVIEW_STALE');
    expect(ERROR_CODES).toContain('WORKSPACE_BOUNDARY_VIOLATION');
  });
  it('requires a pending operation and top-level digest in the preview response', () => {
    const response = SuccessEnvelope.parse({
      schema_version: '1.0',
      operation: { id: 'op_preview', kind: 'prepare_workspace', state: 'pending' },
      confirmation_digest: 'a'.repeat(64),
      project: { id: 'proj_1' },
      workspace: { target: '/owned/worktree', base: 'a'.repeat(40) },
      diagnostics: [],
      next_actions: [],
    });
    expect(response.operation?.state).toBe('pending');
    expect(response.confirmation_digest).toHaveLength(64);
  });
});
