import { describe, it, expect } from 'vitest';
import { ERROR_CODES } from '../../../packages/contracts/src/errors.js';
describe('stable errors', () => {
  it('includes foundational refusal codes', () => {
    expect(ERROR_CODES).toContain('DUPLICATE_PROJECT');
    expect(ERROR_CODES).toContain('WORKSPACE_BOUNDARY_VIOLATION');
  });
});
