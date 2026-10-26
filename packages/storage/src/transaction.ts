import type { Store } from './database.js';
export function transaction<T>(db: Store, fn: () => T): T {
  return db.transaction(fn)();
}
