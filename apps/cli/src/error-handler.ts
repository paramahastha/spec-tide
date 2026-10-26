import { ErrorEnvelope, AppError } from '@spectide/contracts';
import { safeError } from '@spectide/core';
export function fail(error: unknown, json = false): never {
  const e = safeError(error);
  if (json) {
    const body = ErrorEnvelope.parse({
      schema_version: '1.0',
      error: {
        code: e.code,
        message: e.message,
        next_action: e.nextAction,
        operation_id: e.operationId,
        retryable: e.retryable,
      },
    });
    process.stdout.write(`${JSON.stringify(body)}\n`);
  } else process.stderr.write(`${e.code}: ${e.message}\nNext: ${e.nextAction}\n`);
  process.exitCode = 1;
  throw e;
}
export function appError(
  code: ConstructorParameters<typeof AppError>[0],
  message: string,
  nextAction?: string,
) {
  return new AppError(code, message, nextAction);
}
