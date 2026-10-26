import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export function discoverArtifacts(root: string) {
  const base = path.join(root, '.specify');
  if (!fs.existsSync(base)) return { present: false, files: [], fingerprint: null };
  const files: string[] = [];
  const walk = (p: string) => {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const f = path.join(p, e.name);
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) walk(f);
      else if (e.isFile()) files.push(f);
    }
  };
  walk(base);
  files.sort();
  const h = crypto.createHash('sha256');
  for (const f of files) {
    h.update(path.relative(root, f));
    h.update(fs.readFileSync(f));
  }
  return {
    present: true,
    files: files.map((f) => path.relative(root, f)),
    fingerprint: h.digest('hex'),
  };
}
