import { createHash } from 'node:crypto';
import { z } from 'zod';
export const DiagnosticResult = z.enum(['ready', 'needs_setup', 'unsupported', 'unverified']);
export const DiagnosticSchema = z.object({
  subject: z.string().max(100),
  result: DiagnosticResult,
  observed_version: z.string().nullable(),
  message: z.string().max(500),
  next_action: z.string().max(500),
  capabilities: z.record(z.unknown()).optional(),
  evidence_redacted: z.string().max(1000).optional(),
});
export const RepositorySummarySchema = z.object({
  root_realpath: z.string(),
  git_identity_fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  working_tree_state: z.enum(['clean', 'modified']),
});
export const SuccessEnvelope = z
  .object({
    schema_version: z.literal('1.0'),
    operation: z.object({ id: z.string(), kind: z.string(), state: z.string() }).optional(),
    project: z.record(z.unknown()).optional(),
    workspace: z.record(z.unknown()).optional(),
    diagnostics: z.array(DiagnosticSchema).default([]),
    next_actions: z.array(z.string()).default([]),
    confirmation_digest: z.string().optional(),
    repository: RepositorySummarySchema.optional(),
    compatibility_gate: z.object({ passed: z.boolean(), reason: z.string() }).optional(),
  })
  .passthrough();
export const ErrorEnvelope = z.object({
  schema_version: z.literal('1.0'),
  error: z.object({
    code: z.string(),
    message: z.string(),
    next_action: z.string(),
    operation_id: z.string().nullable(),
    retryable: z.boolean(),
  }),
});
export const RequestSchema = z.object({
  kind: z.string(),
  project_id: z.string().nullable().optional(),
  payload: z.record(z.unknown()),
});
export type Diagnostic = z.infer<typeof DiagnosticSchema>;

export function requestDigest(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
