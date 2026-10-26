import { describe, it, expect } from 'vitest';
import { SuccessEnvelope, ErrorEnvelope } from '../../../packages/contracts/src/cli.js';
describe('CLI envelopes', () => {
  it('validates success and error schema versions', () => {
    expect(SuccessEnvelope.parse({ schema_version: '1.0' }).schema_version).toBe('1.0');
    expect(
      ErrorEnvelope.parse({
        schema_version: '1.0',
        error: {
          code: 'POLICY_DENIED',
          message: 'no',
          next_action: 'retry',
          operation_id: null,
          retryable: false,
        },
      }).error.code,
    ).toBe('POLICY_DENIED');
  });
});
