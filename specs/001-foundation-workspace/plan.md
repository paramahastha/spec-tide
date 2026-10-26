# Implementation Plan: Foundation Workspace

**Branch**: `main` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-foundation-workspace/spec.md`

## Source PRD Traceability

This plan preserves the applicable source PRD identifiers recorded in the specification. Every
implementation, test, and release-evidence artifact created from `tasks.md` must retain the
applicable source identifier below alongside its internal FR/SC reference.

| Source PRD trace | Internal requirement coverage | Planned implementation and evidence |
|---|---|---|
| FR-001, FR-036, FR-043, NFR-015 | FR-002, FR-006–FR-010, FR-015 | Canonical discovery, immutable identity, registration/relink, duplicate and boundary tests |
| FR-002, FR-003, FR-004, FR-039, NFR-009 | FR-003–FR-005, FR-011 | Read-only artifact/configuration discovery and diagnostic evidence |
| FR-037, FR-038 | FR-008, FR-015 | Scoped project state/listing and isolation tests |
| FR-044, NFR-003 | FR-012 | SQLite migration, operation journal, and interruption-recovery tests |
| FR-041, FR-028, M1 | FR-013–FR-016 | Preview/confirmation, worktree ownership, preservation, and approval-audit evidence |
| M0 | FR-017–FR-018, SC-006 | Spec Kit plus two-interface reproducible compatibility gate |
| NFR-004, NFR-010 | FR-019 | Process-boundary, redaction, and adversarial safety tests |

## Summary

Deliver the local, CLI-first M0/M1 foundation for safely discovering Git repositories,
recording verified compatibility, registering explicitly trusted projects, and creating a
project-owned isolated Git worktree from a selected clean revision. Build a TypeScript
modular monolith with durable SQLite state and a single safe process boundary. Every
repository, workspace, operation, diagnostic, and compatibility result is explicitly
project-scoped and persisted without credentials or destructive Git actions.

The implementation deliberately does **not** provide the All Projects dashboard, full
Spec Kit delivery execution, provider routing, hosted services, or automatic test execution.
It supplies the trustworthy registration, diagnostics, compatibility, and workspace
primitives those later features require.

## Technical Context

**Language/Version**: TypeScript 5.x in strict mode on Node.js 24 LTS; pin Node 24 in
`engines` and `.nvmrc` for development and CI, then reconfirm that release pin after the
compatibility fixture passes.

**Primary Dependencies**: pnpm workspaces; Commander for the CLI; Zod for runtime input
validation and shared schemas; a synchronous SQLite driver such as `better-sqlite3` behind
a storage interface; native `node:child_process` through a single controlled runner.

**Storage**: A private, platform-appropriate user-data SQLite database in WAL mode, with
foreign keys, explicit versioned migrations, a visible pre-destructive-migration backup,
and bounded sanitized artifact/report files. Repository-scoped `.spectide/config.yml` is
nonsecret policy/configuration only; credentials and user-private state stay outside repos.

**Testing**: Vitest unit and contract tests; real local-Git-fixture integration tests;
CLI subprocess end-to-end tests; fault-injection recovery tests. Provider/network tests
cannot be the sole proof of a local behavior.

**Target Platform**: macOS first; Linux supported; Windows through WSL initially. All file
boundary and Git behavior is tested on each supported platform before declaring support.

**Project Type**: Local-first pnpm monorepo and CLI. The local HTTP API and dashboard are
deferred; the CLI JSON contract is the public interface for this feature.

**Performance Goals**: For a reference repository containing exactly 100,000 tracked regular
files, run one warm-up followed by 20 sequential invocations of `spectide doctor --project <id>
--json`. Its nearest-rank p95 wall-clock duration must be under two seconds. Record every elapsed
time, file count, OS, CPU, Node.js version, Git version, and pass/fail result (SC-005).

**Constraints**: Offline core operation; argument-array process execution only; canonical
path and symlink-escape checks; no credential reads/persistence; no shell interpolation;
no automatic push, merge, deploy, reset, clean, stash, remote change, or deletion; all
mutating CLI actions require explicit target/confirmation where specified.

**Scale/Scope**: Any number of independent local project registrations; one process-local
SQLite writer; one isolated workspace per preparation operation. The delivered feature
covers FR-001–FR-019 only and stops before run orchestration.

## Constitution Check

### Pre-design gate — PASS

| Constitution obligation | Planned enforcement and evidence |
|---|---|
| I. Local-first and project isolation | CLI and SQLite work without a hosted account; opaque immutable project IDs, canonical-root uniqueness, foreign-key ownership, and per-project file partitions prevent cross-project scope reuse. |
| II. Evidence before claims | Diagnostics and compatibility records preserve observed version/capability, sanitized evidence, limitation, timestamp, and next action. No tool is marked ready from configuration alone. |
| III. Safe, explicit autonomy | Trust confirmation, workspace preview/confirmation, explicit project selection, and an allowlisted runner prevent unapproved/destructive behavior. Every required approval is durably bound to its action digest and operation, with risk, decision, local actor, and timestamp. |
| IV. Upstream compatibility | Spec Kit and agent interfaces are capability-probed against pinned versions; the product records unsupported outcomes and does not alter upstream state. |
| V. Durable, bounded execution | Operation journal (including approval decisions), SQLite transactions, unique constraints, recovery reconciliation, worktree ownership, and timeouts make interruptions visible and recoverable. |
| Non-negotiable constraints | The runner accepts executable plus argument array, authorized canonical cwd, environment allowlist, timeout, and bounded/redacted output. No credentials, raw environment, or unredacted transcripts enter normal state or exports. |

No constitution exception is needed. The worktree design is documented as Git change
isolation, not an OS, network, or credential sandbox.

## Research and Design Decisions

Phase 0 decisions are recorded in [research.md](./research.md). Phase 1 entities and
invariants are recorded in [data-model.md](./data-model.md); the stable user-facing
interface is [contracts/foundation-cli.md](./contracts/foundation-cli.md). The validation
guide is [quickstart.md](./quickstart.md).

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation-workspace/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── foundation-cli.md
└── tasks.md                         # Created later by $speckit-tasks
```

### Source Code (repository root)

```text
apps/
└── cli/
    └── src/                         # command parsing, presentation, JSON envelope

packages/
├── contracts/
│   └── src/                         # public CLI schemas, error codes, shared types
├── core/
│   └── src/                         # policy, operation state machine, safe runner
├── diagnostics/
│   └── src/                         # Git/Spec Kit/agent/test readiness probes
├── project/
│   └── src/                         # discovery, realpath, identity, trust, registry service
├── storage/
│   └── src/                         # SQLite schema, migrations, transaction/recovery repository
└── workspace/
    └── src/                         # preview, Git worktree preparation, postcondition checks

tests/
├── unit/                            # policy, schemas, identity, state transitions, redaction
├── contract/                        # CLI JSON and error-envelope stability
├── integration/                     # real Git, SQLite, worktree and recovery fixtures
├── e2e/                             # CLI subprocess scenarios
└── fixtures/                        # tiny Git repos, symlinks, fake tools, token-like output

docs/
└── compatibility/                   # reproducible supported-matrix evidence and limitations
```

**Structure Decision**: Use a pnpm modular monolith. `apps/cli` is the sole privileged
entry point; domain packages have no direct shell access except through `core`'s controlled
runner. Future local API/dashboard work consumes `packages/contracts` rather than bypassing
project, policy, storage, or workspace services.

## Implementation Sequence

1. Establish the workspace, strict TypeScript build, shared contract schemas, test fixtures,
   central runner, SQLite migration/recovery framework, and redaction policy.
2. Implement read-only canonical discovery and diagnostics, including safe availability-only
   checks for Spec Kit, test commands, and locally installed agent interfaces.
3. Implement compatibility-record capture and reproducible fixtures for one Spec Kit path,
   two agent interfaces, and a safe interruption/resume boundary. Publish only observed
   support, versions, limits, and evidence. Do not pass the M0 compatibility release gate or
   enable downstream orchestration unless two interfaces qualify.
4. Implement transactional project registration, duplicate refusal, listing, rename,
   archive/restore, explicit unregistration, availability revalidation, and verified relink.
5. Implement workspace preview and explicit confirmation, then native Git worktree creation
   within an app-owned canonical root. Reconcile interrupted operations conservatively.
6. Complete the adversarial, recovery, contract, integration, and CLI end-to-end suites;
   measure the status latency target and document any deviation.

## Constitution Check

### Post-design gate — PASS

The design retains all pre-design controls. In particular, canonicalization happens before
both duplicate checks and every mutating operation; durable operation states span filesystem
and SQLite boundaries; project ownership is enforced by storage keys rather than UI context;
and the CLI contract exposes only redacted diagnostics. Compatibility is deliberately an
observed matrix, so an unavailable tool produces `needs_setup` or `unsupported` rather than
a simulated success. No new violation or exception was introduced.

## Complexity Tracking

No constitution violations require justification.
