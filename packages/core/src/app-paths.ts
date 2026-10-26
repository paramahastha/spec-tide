import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
export function appDataRoot(): string {
  const home = os.homedir();
  const base =
    process.platform === 'win32'
      ? process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local')
      : process.platform === 'darwin'
        ? path.join(home, 'Library', 'Application Support')
        : process.env.XDG_DATA_HOME || path.join(home, '.local', 'share');
  const root = path.join(base, 'spectide');
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  if (process.platform !== 'win32') fs.chmodSync(root, 0o700);
  return fs.realpathSync(root);
}
export const databasePath = () => path.join(appDataRoot(), 'state.sqlite');
