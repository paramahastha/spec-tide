import { describe, it, expect } from 'vitest';
import { redact } from '../../../packages/core/src/redaction.js';
import { tokenLikeOutput } from '../../fixtures/src/secret-fixture.js';
describe('redaction', () => {
  it('removes token-like values and bounds text', () => {
    expect(redact(tokenLikeOutput)).not.toContain('sk-1234567890');
    expect(redact('a'.repeat(100), 20).length).toBeLessThan(40);
  });
});
