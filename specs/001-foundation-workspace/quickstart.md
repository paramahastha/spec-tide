# Validation Quickstart: Foundation Workspace

Use this guide after implementation to validate the feature end to end. It refers to the
invariants in [data-model.md](./data-model.md) and the expected command/output shapes in
[contracts/foundation-cli.md](./contracts/foundation-cli.md).

## Prerequisites

- Node.js version pinned by the repository and pnpm installed.
- Git available on \`PATH\`; configure a disposable author only for temporary fixture commits.
- A clean temporary directory outside the SpecTide source repository.
- Three disposable local Git repositories. Create a symlink to one of them for duplicate/escape
  tests; do not use a production repository.
- At least two locally installed candidate coding-agent interfaces plus the selected Spec Kit
  executable for the compatibility fixture. If an interface is unavailable, the expected result
  is an honest \`needs_setup\`/\`unsupported\` record; the M0 compatibility release gate does not pass
  until two interfaces qualify.

## Build and baseline tests

From the repository root:

\`\`\`text
pnpm install
pnpm build
pnpm test
pnpm exec tsx apps/cli/src/main.ts --help
\`\`\`

Expected: build and automated tests pass; help lists only the implemented foundation commands.
Use the package script defined by the implementation if the workspace exposes a different
documented CLI invocation.

## Scenario 1 — Non-destructive diagnostic

1. Record hashes/listing of a fixture repository's \`.specify/\` files (if present).
2. Run \`spectide doctor <fixture-a> --json\`.
3. Compare the before/after repository status and artifact hashes.

Expected: JSON reports canonical root, discovered state, and a per-capability result with a next
action for every unavailable/unsupported item. Existing artifacts and repository contents are
unchanged. Token-like fixture output is absent from durable/public diagnostic text.

## Scenario 2 — Register three projects and reject an alias duplicate

1. Run \`spectide projects add <fixture-a> --confirm-trust --json\`, then do the same for
   \`<fixture-b>\` and \`<fixture-c>\`.
2. Run \`spectide projects list --json\`; retain the three immutable IDs.
3. Run \`spectide projects add <symlink-to-fixture-a> --confirm-trust --json\`.

Expected: listing contains exactly three independent project records. The alias request exits
nonzero with \`DUPLICATE_PROJECT\`, names the existing project safely, and creates no fourth row.

## Scenario 3 — Metadata lifecycle preserves source and history

1. Rename one registered project, archive it, restore it, then unregister it using each required
   confirmation flag.
2. After each command, inspect its fixture repository, Git status, and retained operation history.

Expected: only registry/display state changes. No source file, Git remote, branch, worktree, or
retained historical operation is deleted. An archived project cannot prepare new workspaces.

## Scenario 4 — Prepare an isolated workspace from a dirty source checkout

1. In a trusted active fixture, make an uncommitted local edit and record \`git status --short\`.
2. Choose an explicit committed SHA that excludes the uncommitted edit.
3. Run \`spectide workspace prepare --project <id> --base <sha> --preview --json\` and inspect the
   returned project ID, canonical source root, SHA, target root, isolation limitation, and digest.
4. Confirm exactly that digest with the non-preview prepare command.
5. Compare the original checkout status with the recorded value and inspect the prepared path.

Expected: the source edit survives unchanged; no stash/reset/clean/push/merge/deploy occurs; a
separate ready workspace belongs to only the selected project and resolved SHA. The output does
not describe the worktree as a security sandbox.

## Scenario 5 — Boundary, replacement, and recovery refusal

1. Request a workspace target that resolves through a symlink outside the app-owned workspace
   root (using the test seam/configuration available in fixtures).
2. Replace or move a registered fixture at its old path, then request diagnostics/preparation.
3. Restart after injecting a failure respectively before/after the database intent record and
   after native worktree creation but before completion persistence.

Expected: the escape is rejected with \`WORKSPACE_BOUNDARY_VIOLATION\`; the replaced/moved project
is unavailable or attention-required until explicit verified relink; every interrupted operation
restarts as one completed operation or one visible \`OPERATION_INCOMPLETE\`/recoverable record,
never a duplicate or reassigned workspace.

## Scenario 6 — Compatibility matrix and safe resume demonstration

1. Run the reproducible compatibility fixture for the selected Spec Kit workflow boundary and
   two local coding-agent interfaces.
2. Interrupt each safe boundary using the fixture's controlled interruption point, then resume.
3. Inspect compatibility records and sanitized evidence.

Expected: records contain observed versions, supported/unsupported capabilities, safe interaction
boundary, limitation, and resume outcome. The M0 compatibility release gate passes only when two
interfaces complete distinct safe boundaries and resume demonstrably; unavailable combinations remain
labeled unavailable and keep the gate unmet.

## Required automated evidence

The completed suite must include unit tests for identity, state transitions, redaction, and
argument construction; contract tests for the CLI envelopes/error codes; integration tests for
real Git, SQLite, and worktrees; end-to-end CLI tests; and adversarial/fault-injection tests for
the scenarios above. For SC-005, use an exactly-100,000-tracked-file fixture, run one warm-up plus
20 sequential \`spectide doctor --project <id> --json\` measurements, and record nearest-rank p95,
each duration, file count, OS, CPU, Node.js version, Git version, and pass/fail status so a miss is
visible for follow-up rather than silently ignored.

