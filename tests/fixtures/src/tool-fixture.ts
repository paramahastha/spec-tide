import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export function fakeTool(script: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-tool-'));
  const file = path.join(root, 'fake-tool');
  fs.writeFileSync(file, `#!/bin/sh\n${script}\n`, { mode: 0o700 });
  return { root, file, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
