import { describe, it, expect } from 'vitest';
import { ERROR_CODES } from '../../../packages/contracts/src/errors.js';
describe('projects contract', () => {
  it('defines trust and duplicate refusals', () => {
    expect(ERROR_CODES).toContain('TRUST_CONFIRMATION_REQUIRED');
    expect(ERROR_CODES).toContain('DUPLICATE_PROJECT');
  });
});
