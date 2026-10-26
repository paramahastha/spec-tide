import type { Store } from './database.js';
export function reconcilePending(db: Store) {
  return db
    .prepare(
      "UPDATE operations SET state='recoverable_incomplete', finished_at=datetime('now'), error_code='OPERATION_INCOMPLETE', error_redacted='Interrupted operation requires review', next_action='Validate the intended state and retry explicitly.' WHERE state='applying'",
    )
    .run().changes;
}
