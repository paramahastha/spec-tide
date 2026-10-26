import { SuccessEnvelope } from '@spectide/contracts';
export function output(value: unknown, json = false) {
  if (json) {
    const parsed = SuccessEnvelope.parse({
      schema_version: '1.0',
      diagnostics: [],
      next_actions: [],
      ...(value as object),
    });
    process.stdout.write(`${JSON.stringify(parsed)}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
