# Phase 0 Research: Foundation Workspace

## Local runtime and composition

**Decision**: Build a strict TypeScript modular monolith on a pinned Node.js LTS release
(Node 24 LTS at planning time) with pnpm workspaces. Use Commander for the CLI and Zod for
runtime validation/shared contract schemas. Defer Turborepo, the local HTTP service, and the
dashboard until the foundation needs their build or UI capabilities.

**Rationale**: The PRD calls for TypeScript, Node LTS, shared contracts, and a local-first
modular monolith. A CLI is sufficient for every M0/M1 user scenario while avoiding a dashboard
that the feature explicitly excludes. Shared schemas keep the future local service from
inventing a different meaning for project and workspace states.

**Alternatives considered**: Rust/Go and multiple repositories add adapter and contract
friction before the product boundary is proven. A browser-first application would expand this
feature into the explicitly deferred All Projects dashboard. Turborepo is unnecessary until
workspace build time proves a need.

## Durable private state

**Decision**: Store user-private registry, operations, diagnostics, compatibility evidence,
and workspace ownership in SQLite with WAL mode, foreign keys, unique canonical-root/workspace
constraints, versioned migrations, and transaction-scoped writes. Use an operation journal
with `pending`, `applying`, `completed`, `recoverable_incomplete`, and `failed` states. Back up
before destructive migrations and enter visible read-only recovery after a failed integrity
check.

**Rationale**: SQLite is local, transactional, and suitable for one-host foundation state.
WAL supports responsive reads while a mutation is recorded. An operation journal bridges the
unavoidable gap between a database transaction and native Git filesystem work: a crash cannot
silently create a second registration or an unowned workspace.

**Alternatives considered**: JSON files/nontransactional state cannot enforce uniqueness or
represent torn operations reliably. A hosted database violates local-first operation. Recording
only after `git worktree add` would leave orphan workspaces invisible after interruption.

## Repository identity and trust

**Decision**: Resolve every requested repository to a canonical Git root before reading or
writing state. Give each accepted registration an opaque immutable ID; separately persist the
canonical root, Git common-dir metadata, object format, stable root-commit evidence, and a
sanitized non-authoritative remote identity when available. Enforce canonical-root uniqueness.
On each relevant read/mutation, revalidate the path and fingerprint; a missing/replaced/moved
repository becomes unavailable or attention-required. Only an explicit, identity-validated
relink can change its current location.

**Rationale**: Realpaths collapse aliases and symlinks into one duplicate-prevention key,
while a fingerprint makes a replacement at the same location fail closed. Git lacks a universal
immutable repository UUID, so ambiguous identity evidence requires user reconciliation rather
than automatic trust transfer.

**Alternatives considered**: Raw input paths permit symlink duplicates. A display name, branch,
or remote URL alone is mutable, optional, and unsafe as a trust identity. Automatically trusting
a moved path risks binding historical state to a different repository.

## Safe diagnostics and compatibility evidence

**Decision**: Run diagnostics and each agent/Spec Kit probe via one controlled process runner:
fixed executable plus typed argument array, authorized canonical cwd, minimal environment
allowlist, timeout, and output limits. Probe authentication availability only through supported
non-secret capability/status behavior; never inspect, copy, display, or persist credentials.
Capture a dated compatibility record per tool/interface with observed version, attempted safe
boundary, result, sanitized evidence, limitation, resume observation, and next action. Pin a
supported matrix only after fixtures validate one Spec Kit path and two locally available agent
interfaces. A missing interface remains an honest diagnostic result, but it does not pass the M0
compatibility release gate or permit downstream orchestration.

**Rationale**: The constitution prohibits shell interpolation and credential exposure, and the
PRD says support must be observed rather than presumed. Keeping the matrix empirical lets a
machine honestly report `unsupported` without pretending provider-specific commands worked.

**Alternatives considered**: Shell command strings or raw logs make injection and secret leakage
likely. Static claims based on configured profiles fail the evidence requirement. Network-only
provider tests cannot prove the local command boundary, error handling, or resume behavior.

## Isolated workspace lifecycle

**Decision**: Prepare workspaces only for a trusted target project and explicitly selected,
resolved clean commit. Preview the project identity, canonical source path, selected SHA, and
app-owned target path before a separate confirmation. Persist an `applying` operation and a
`preparing` workspace record, invoke native `git worktree add --detach <canonical-target>
<resolved-commit>` through the runner, verify ownership and postconditions, then atomically mark
the operation complete. Store worktrees below `<user-data>/spectide/worktrees/<project-id>/` and
enforce realpath containment.

**Rationale**: Native Git worktrees preserve the source checkout and its uncommitted work while
binding the resulting checkout to a known revision. Pre-recording intent plus post-crash
reconciliation gives an honest recoverable state instead of an inferred success.

**Alternatives considered**: Working in the original checkout violates preservation guarantees.
Copying/cloning loses intended worktree semantics and provenance. Auto-cleaning after failure is
destructive. A worktree is not treated as an OS, network, or credential sandbox.

## Verification strategy

**Decision**: Use Vitest for unit and contract tests, real local Git fixtures for integration,
CLI subprocess tests for end-to-end behavior, and explicit fault-injection seams around each
persistence/worktree boundary. Fixtures cover symlink duplicates and escapes, moved/replaced
repositories, dirty source checkouts, injected process interruptions, shell-like user text, and
token-like diagnostic output.

**Rationale**: This combines deterministic evidence for policy/state logic with the actual Git
and filesystem behaviors where the safety risks occur. It directly proves the constitution's
required unit, contract, integration, end-to-end, adversarial, and crash/recovery gates.

**Alternatives considered**: Mock-only Git testing misses realpath/worktree behavior; manual
smoke testing cannot establish the interruption and duplicate-registration guarantees.

## Resolved planning questions

| Question | Resolution |
|---|---|
| Which product surface is in M0/M1? | CLI-first only; the dashboard and local API are deferred by the feature scope. |
| How is support declared for changing tools? | Runtime-observed, reproducible compatibility records; no preclaimed supported version or fallback. |
| How are database and filesystem changes made recoverable together? | Durable operation journal before external work, postcondition verification, then completion transaction; restart reconciliation otherwise. |
| Can a Git worktree be called a sandbox? | No. It isolates checkout changes/history only; documentation and diagnostics disclose the limitation. |
