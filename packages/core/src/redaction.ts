const patterns = [
  /(\b(?:sk|pk|rk|ghp|gho|github_pat|glpat|xox[baprs])-)[A-Za-z0-9_\-]{8,}/gi,
  /(\b(?:api[_-]?key|token|secret|password|authorization)\s*[:=]\s*)([^\s,;]+)/gi,
  /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi,
];
export function redact(value: string, max = 4000): string {
  let text = value;
  for (const p of patterns)
    text = text.replace(p, (_m, prefix) =>
      typeof prefix === 'string' ? `${prefix}[REDACTED]` : '[REDACTED]',
    );
  if (text.length > max) text = `${text.slice(0, max)}…[truncated]`;
  return text;
}
