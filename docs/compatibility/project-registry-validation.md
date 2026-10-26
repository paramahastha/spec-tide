# Project registry validation

Local Darwin fixture acceptance (Node 26.12.0, Git 2.39.5) passed:

- Registered three independent repositories and listed their immutable IDs.
- Refused a symlink alias with `DUPLICATE_PROJECT` and kept the registry at three projects.
- Ran project-scoped doctor output, then rename, archive, restore, and unregister without changing source files.
- Ran `init` against an existing `.specify/spec.md`, returned the discovered state, and preserved its bytes.
- Moved a registered repository and relinked it only after explicit confirmation and matching repository identity; a replacement with different root commits is marked `identity_mismatch`.
- Injected failures across operation, project, and location persistence boundaries; transactions left no partial rows, and retry produced one completed registration.

The full local suite passed. Platform-specific Git/file-boundary results for Linux and WSL remain pending CI execution.
