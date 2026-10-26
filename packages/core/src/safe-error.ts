import { AppError } from '@spectide/contracts';
import { redact } from './redaction.js';
export function safeError(error: unknown): AppError {
  if (error instanceof AppError)
    return new AppError(
      error.code,
      redact(error.message, 500),
      redact(error.nextAction, 500),
      error.retryable,
      error.operationId,
    );
  return new AppError(
    'INTERNAL_ERROR',
    'The operation could not be completed.',
    'Inspect local logs for a sanitized correlation ID.',
    true,
  );
}
