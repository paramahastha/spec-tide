# Safety and data handling

SpecTide executes local tools through one argument-array process runner with an authorized working directory, restricted environment, timeout, output bound, and redaction. Repository artifact discovery is read-only. Credentials are never loaded from project configuration or included in normal diagnostics. Project registration and workspace creation require explicit confirmation; the SQLite operation journal retains approval decisions.

A Git worktree isolates checkout changes and commit history. It does not isolate operating-system permissions, network access, credentials, or child-process side effects. Registry data lives in the current user's application data directory. Database migrations create a pre-migration backup before schema changes.

Authentication availability checks call documented local status/list commands for supported tools. SpecTide retains only the summarized availability result and discards their output; it does not open or persist credential stores, account names, tokens, or provider details.
