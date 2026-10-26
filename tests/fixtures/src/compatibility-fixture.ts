import fs from 'node:fs';
import path from 'node:path';

/** Disposable mock interfaces for validating evidence storage and checkpoint recovery only. */
export function installCompatibilityFixture(bin: string) {
  fs.mkdirSync(bin, { recursive: true });
  for (const name of ['codex', 'opencode']) {
    const script = path.join(bin, name);
    fs.writeFileSync(
      script,
      `#!/bin/sh
case "$1" in
  --version) printf '%s\\n' '${name}-fixture 0.1' ;;
  --safe-boundary) [ -n "$2" ] || exit 64; printf '%s\\n' 'fixture-safe-boundary-completed' ;;
  --resume) [ -n "$2" ] || exit 64; printf '%s\\n' 'fixture-resume-completed' ;;
  *) exit 64 ;;
esac
`,
      { mode: 0o700 },
    );
  }
}
