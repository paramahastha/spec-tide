export const ERROR_CODES = [
  'PATH_UNRESOLVABLE',
  'PATH_NOT_GIT_REPOSITORY',
  'TRUST_CONFIRMATION_REQUIRED',
  'DUPLICATE_PROJECT',
  'PROJECT_NOT_FOUND',
  'PROJECT_AMBIGUOUS',
  'PROJECT_UNAVAILABLE',
  'GIT_IDENTITY_MISMATCH',
  'INVALID_BASE_REVISION',
  'PREVIEW_REQUIRED',
  'PREVIEW_STALE',
  'WORKSPACE_BOUNDARY_VIOLATION',
  'OPERATION_INCOMPLETE',
  'COMPATIBILITY_UNVERIFIED',
  'POLICY_DENIED',
  'INTERNAL_ERROR',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly nextAction = 'Review the request and try again.',
    public readonly retryable = false,
    public readonly operationId: string | null = null,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
