---
description: "Actionable, dependency-ordered task list for Foundation Workspace"
---

# Tasks: Foundation Workspace

**Input**: Design documents from specs/001-foundation-workspace/

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/foundation-cli.md, and quickstart.md

**Tests**: Required. The specification and constitution require unit, contract, integration,
end-to-end, adversarial, compatibility, and interruption-recovery evidence.

**Organization**: Tasks are grouped by user story so each increment can be built and verified
independently after shared foundations are complete.

## Path Conventions

- CLI entry point: apps/cli/src/
- Shared schemas/contracts: packages/contracts/src/
- Shared policy and process boundary: packages/core/src/
- Repository/trust domain: packages/project/src/
- Diagnostics/compatibility domain: packages/diagnostics/src/
- SQLite state and migrations: packages/storage/src/
- Isolated-workspace domain: packages/workspace/src/
- Tests: tests/{unit,contract,integration,e2e,fixtures}/
- Reproducible compatibility records: docs/compatibility/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the Node/TypeScript pnpm monorepo, executable CLI package, quality gates,
and disposable fixture tooling.

- [X] T001 Create pnpm workspace root, Node 24 engine pin, and root scripts in package.json, pnpm-workspace.yaml, and .nvmrc
- [X] T002 Create package manifests and strict TypeScript project references in apps/cli/package.json, packages/contracts/package.json, packages/core/package.json, packages/diagnostics/package.json, packages/project/package.json, packages/storage/package.json, packages/workspace/package.json, and tsconfig.json
- [X] T003 [P] Configure strict compiler, ESLint, Prettier, and editor settings in tsconfig.base.json, eslint.config.js, .prettierrc.json, and .editorconfig
- [X] T004 [P] Configure Vitest unit/contract/integration projects and coverage thresholds in vitest.config.ts
- [X] T005 [P] Create disposable Git-repository, symlink, fake-tool, token-like-output, and repository-controlled config/artifact-content factories in tests/fixtures/src/git-fixture.ts, tests/fixtures/src/tool-fixture.ts, and tests/fixtures/src/secret-fixture.ts
- [X] T006 [P] Add package build, lint, typecheck, and test workflows with a macOS, Linux, and WSL platform matrix; retain Git/file-boundary result evidence in .github/workflows/ci.yml and docs/compatibility/platform-validation.md
- [X] T007 Create CLI executable bootstrap and a no-side-effect --help command in apps/cli/src/main.ts and apps/cli/src/program.ts
- [X] T008 Add repository setup and local-data-location guidance in README.md and docs/development.md

**Checkpoint**: The workspace installs, typechecks, lints, runs an empty test suite, and exposes the
CLI without writing to a repository.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the safety, durability, schema, and test foundations required by every story.

**CRITICAL**: Complete this phase before user-story work. No command may launch a shell or write
project/workspace state outside these foundations.

- [X] T009 Define stable CLI JSON envelopes, diagnostic result values, error codes, request digests, and Zod validators in packages/contracts/src/cli.ts, packages/contracts/src/errors.ts, and packages/contracts/src/index.ts
- [X] T010 [P] Define immutable IDs, entity/state enums, and state-transition guards for Project, ProjectLocation, CompatibilityRecord, FoundationOperation, IsolatedWorkspace, and ProjectConfigurationSnapshot, including FoundationOperation risk classification, approval decision, actor, timestamp, and digest binding in packages/contracts/src/domain.ts and packages/core/src/state-machine.ts
- [X] T011 Implement centralized secret-pattern redaction, bounded-output truncation, and safe-error construction in packages/core/src/redaction.ts and packages/core/src/safe-error.ts
- [X] T012 Implement the only process-launch API with executable-plus-argument-array validation, canonical authorized cwd, environment allowlist, timeout, cancellation, and no shell option in packages/core/src/process-runner.ts
- [X] T013 Write unit tests proving redaction excludes token-like values and the runner rejects shell strings, unapproved cwd, disallowed environment, and missing timeout in tests/unit/core/redaction.test.ts and tests/unit/core/process-runner.test.ts
- [X] T014 Implement platform user-data path resolution and realpath containment/escape checks in packages/core/src/app-paths.ts and packages/core/src/path-boundary.ts
- [X] T015 Write unit tests for canonicalization, symlink escape refusal, and app-owned worktree containment in tests/unit/core/path-boundary.test.ts
- [X] T016 Create SQLite connection setup with WAL, foreign keys, busy timeout, integrity check, read-only recovery mode, and migration backup hook in packages/storage/src/database.ts and packages/storage/src/migrator.ts
- [X] T017 Create the initial versioned SQLite schema, indexes, and foreign keys in packages/storage/src/migrations/001-foundation.ts with canonical-root/workspace uniqueness, immutable project/workspace ownership, and durable approval risk/decision/actor/timestamp fields bound to the operation digest
- [X] T018 Implement generic transaction, idempotency-key, operation-journal, approval audit persistence, and restart-reconciliation repositories in packages/storage/src/transaction.ts, packages/storage/src/operation-repository.ts, and packages/storage/src/recovery.ts
- [X] T019 Write storage integration tests for WAL/foreign-key setup, duplicate idempotency refusal, migration backup, integrity recovery, approval audit/digest binding, and pending-to-terminal operation transitions in tests/integration/storage/foundation-storage.test.ts
- [X] T020 Implement nonsecret .spectide/config.yml discovery/validation and project-artifact fingerprinting without writes in packages/project/src/config-snapshot.ts and packages/project/src/artifact-discovery.ts
- [X] T021 Implement shared CLI JSON/human rendering, error-to-exit-code mapping, and correlation-ID display in apps/cli/src/output.ts and apps/cli/src/error-handler.ts
- [X] T022 Write contract tests for the success/error envelope and error-code stability in tests/contract/cli/envelope.test.ts and tests/contract/cli/error-codes.test.ts

**Checkpoint**: Safe process execution, canonical paths, durable storage/recovery, contract envelopes, and
nonsecret configuration discovery are available to every user story.

---

## Phase 3: User Story 1 - Assess Local Compatibility (Priority: P1) MVP

**Goal**: A developer can diagnose a local Git repository and tool setup without source mutation,
credential inspection, or unsupported capability claims.

**Independent Test**: In a valid fixture repository with available, missing, and unsupported
prerequisites, run spectide doctor --json; verify repository/artifact discovery, actionable
per-capability results, redacted output, and unchanged files.

### Tests for User Story 1

- [X] T023 [P] [US1] Write CLI contract tests for spectide doctor with JSON output and ready, needs_setup, unsupported, and unverified results in tests/contract/cli/doctor.contract.test.ts
- [X] T024 [P] [US1] Write integration tests that hash existing .specify artifacts before/after diagnosis and cover missing, non-Git, and unresolvable paths in tests/integration/diagnostics/doctor-nondestructive.test.ts
- [X] T025 [P] [US1] Write adversarial tests proving shell-like path/user text, token-like tool output, and repository-controlled config/artifact content remain data, cannot alter executable/arguments/cwd/environment, and are absent from stored/displayed diagnostics in tests/integration/diagnostics/doctor-safety.test.ts
- [X] T026 [P] [US1] Write compatibility-fixture tests for one Spec Kit boundary, Codex and OpenCode safe boundaries, and controlled interruption/resume behavior in tests/integration/diagnostics/compatibility-matrix.test.ts

### Implementation for User Story 1

- [X] T027 [US1] Implement canonical Git-root discovery, repository status, Git common-dir inspection, and actionable safe failures in packages/project/src/repository-discovery.ts
- [X] T028 [P] [US1] Implement read-only Spec Kit artifact/workflow detection with fingerprints and setup guidance in packages/diagnostics/src/speckit-probe.ts
- [X] T029 [P] [US1] Implement test-command candidate discovery/readiness classification without executing arbitrary project scripts in packages/diagnostics/src/test-command-probe.ts
- [X] T030 [P] [US1] Implement authentication-availability probing that never reads, copies, displays, or persists credentials in packages/diagnostics/src/auth-availability-probe.ts
- [X] T031 [P] [US1] Implement versioned Codex and OpenCode capability probes using only the central process runner and sanitized evidence in packages/diagnostics/src/interfaces/codex.ts and packages/diagnostics/src/interfaces/opencode.ts
- [X] T032 [US1] Implement CompatibilityRecord persistence with the data-model rule "Only a reproducible ready record can populate the supported matrix" in packages/diagnostics/src/compatibility-service.ts and packages/storage/src/compatibility-repository.ts
- [X] T033 [US1] Implement doctor aggregation with specific next actions, output bounds, and no unsupported-as-ready downgrade in packages/diagnostics/src/doctor-service.ts
- [X] T034 [US1] Expose spectide doctor through validated CLI options and JSON/human rendering in apps/cli/src/commands/doctor.ts and apps/cli/src/program.ts
- [X] T035 [US1] Create reproducible compatibility fixture instructions and sanitized observed-matrix template in docs/compatibility/README.md and docs/compatibility/matrix.template.json
- [X] T036 [US1] Run the US1 contract, diagnostic integration, adversarial, and compatibility suites; record observed outcomes and an explicit M0-gate result in docs/compatibility/matrix.local.json, passing only when one Spec Kit path and two agent interfaces complete the required reproducible safe-boundary and interruption/resume evidence

**Checkpoint**: Doctor is independently useful and safe. It reports only what is observed, leaves source
artifacts unchanged, and records evidence for the selected Spec Kit path plus two agent interfaces.
If fewer than two interfaces qualify, it accurately records the reason but leaves the M0 compatibility
release gate unmet and cannot enable downstream orchestration.

---

## Phase 4: User Story 2 - Register Trusted Projects (Priority: P1)

**Goal**: A developer can explicitly trust/register independent repositories, list them, reject
alias duplicates, manage registry metadata, and recover safely from moved/replaced locations.

**Independent Test**: Register three disposable repositories; list their independent immutable IDs;
attempt registration through a symlink; verify refusal identifies the original and does not create
a fourth record. Then verify rename/archive/restore/unregister preserve source and history.

### Tests for User Story 2

- [X] T037 [P] [US2] Write contract tests for init and all projects subcommands, including confirmations/selectors and approval-audit fields, plus an init integration test that hashes existing .specify artifacts before/after, returns detected state, and proves no upstream setup/rewrite in tests/contract/cli/projects.contract.test.ts and tests/integration/projects/init-artifact-preservation.test.ts
- [X] T038 [P] [US2] Write integration tests for three registrations, canonical-root uniqueness, symlink duplicate refusal, and scoped list output in tests/integration/projects/registration-and-duplicates.test.ts
- [X] T039 [P] [US2] Write integration tests for rename/archive/restore/unregister that prove source, remotes, user code, and retained operation history are untouched in tests/integration/projects/lifecycle-preservation.test.ts
- [X] T040 [P] [US2] Write integration tests for moved, missing, and replaced repositories plus explicit identity-validated relink in tests/integration/projects/revalidation-and-relink.test.ts
- [X] T041 [P] [US2] Write fault-injection tests at registration persistence boundaries proving one completed or recoverable outcome and zero duplicate rows after restart in tests/integration/projects/registration-recovery.test.ts

### Implementation for User Story 2

- [X] T042 [US2] Implement nonsecret Git identity evidence/fingerprint creation and comparison from canonical root, common-dir metadata, object format, root commits, and sanitized remote identity in packages/project/src/git-identity.ts
- [X] T043 [US2] Implement Project and ProjectLocation persistence with immutable IDs, canonical-root uniqueness, history, and the constraints "project_id is immutable" and "a unique index on canonical root prevents alternate-path registration" in packages/storage/src/project-repository.ts
- [X] T044 [US2] Implement trust confirmation, registration, duplicate response, scoped list, availability revalidation, and discovered-state capture, persisting the confirmation decision with its digest, risk, local actor, and timestamp in packages/project/src/project-service.ts
- [X] T045 [US2] Implement rename/archive/restore/confirmed-unregister transitions while retaining reports/operations, persisting each required approval audit, and never deleting repository content in packages/project/src/project-lifecycle-service.ts
- [X] T046 [US2] Implement explicit candidate-path relink that validates the recorded fingerprint before changing current location and persists the required trust-confirmation audit in packages/project/src/relink-service.ts
- [X] T047 [US2] Implement spectide init and spectide projects add, list, rename, archive, restore, unregister, and relink with contract-required confirmations/selectors; init must use safe artifact discovery, return detected state, and never install, initialize, or rewrite upstream Spec Kit artifacts in apps/cli/src/commands/init.ts, apps/cli/src/commands/projects.ts, and apps/cli/src/program.ts
- [X] T048 [US2] Implement a project-state revalidation read path that distinguishes trusted, unavailable, archived, and attention-required states without exposing another project’s private details in packages/project/src/project-status-service.ts
- [X] T049 [US2] Run the US2 contract, registration, lifecycle, relink, and recovery suites; preserve the three-repository acceptance report in tests/e2e/projects-cli.test.ts and docs/compatibility/project-registry-validation.md

**Checkpoint**: Trusted registrations are stable and isolated; lifecycle operations are non-destructive,
duplicates fail safely, and identity changes require explicit validated relink.

---

## Phase 5: User Story 3 - Prepare an Isolated Project Workspace (Priority: P2)

**Goal**: A developer can preview then prepare exactly one project-owned worktree from a selected
clean commit, without altering the source checkout or crossing an approved boundary.

**Independent Test**: With a dirty trusted source checkout, preview and confirm an explicit base
commit; verify one ready workspace has the project/commit ownership and the source status is
unchanged. Verify symlink escape and identity mismatch create no workspace.

### Tests for User Story 3

- [X] T050 [P] [US3] Write contract tests for workspace prepare preview and digest-bound confirmation, including target/SHA display, refusal codes, and persisted approval risk/decision/local-actor/timestamp fields in tests/contract/cli/workspace-prepare.contract.test.ts
- [X] T051 [P] [US3] Write integration tests for dirty source preservation, selected clean commit, detached worktree postconditions, and exact project/base ownership in tests/integration/workspace/prepare-preservation.test.ts
- [X] T052 [P] [US3] Write adversarial integration tests for workspace-root symlink escape, untrusted/archived target, identity mismatch, and shared-checkout refusal in tests/integration/workspace/boundary-and-identity.test.ts
- [X] T053 [P] [US3] Write fault-injection/restart tests before intent persistence, after intent, and after git worktree add to prove recoverable/no-duplicate ownership outcomes in tests/integration/workspace/prepare-recovery.test.ts

### Implementation for User Story 3

- [X] T054 [US3] Implement explicit project selection/current-directory resolution and a full commit-SHA base resolver that rejects ambiguous, invalid, and non-clean base revisions in packages/workspace/src/target-resolution.ts and packages/workspace/src/base-revision.ts
- [X] T055 [US3] Implement preview construction with project ID/name/root, source SHA, app-owned canonical target, isolation warning, expiry, risk classification, and digest validation in packages/workspace/src/workspace-preview-service.ts
- [X] T056 [US3] Implement IsolatedWorkspace persistence with the constraint "No workspace may reference more than one project or change its base_commit/owner" in packages/storage/src/workspace-repository.ts
- [X] T057 [US3] Implement native git worktree add with detached canonical target and resolved commit through the central runner, postcondition verification, and no destructive Git operation in packages/workspace/src/git-worktree.ts
- [X] T058 [US3] Implement prepare-operation orchestration: persist approval decision/actor/timestamp and applying/preparing before external Git work, enforce app-owned realpath containment, atomically complete after verification, and surface recoverable incomplete state in packages/workspace/src/workspace-service.ts
- [X] T059 [US3] Implement restart reconciliation of incomplete worktree operations against recorded project identity, target, Git metadata, and base commit in packages/workspace/src/workspace-recovery-service.ts
- [X] T060 [US3] Expose spectide workspace prepare preview/confirm flows and safe JSON/human output in apps/cli/src/commands/workspace.ts and apps/cli/src/program.ts
- [X] T061 [US3] Run the US3 contract, preservation, adversarial-boundary, and recovery suites; record worktree-only isolation limitations in docs/compatibility/workspace-isolation-validation.md

**Checkpoint**: Workspace preparation is independently safe and traceable. It preserves dirty source
work, refuses boundary/identity failures, and survives interruption without silent duplication.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete feature-wide quality gates, performance evidence, documentation, and release
readiness without introducing later-orchestration scope.

- [X] T062 [P] Add end-to-end quickstart acceptance scenarios for diagnostics, three-project registration, dirty-worktree preparation, and safety refusals in tests/e2e/foundation-workspace.test.ts
- [X] T063 [P] Add the SC-005 benchmark for `spectide doctor --project <id> --json`: create an exactly-100,000-tracked-file fixture, run one warm-up plus 20 sequential measured invocations, calculate nearest-rank p95, and record per-run duration, file count, OS, CPU, Node.js, Git, and pass/fail result in tests/performance/project-status.bench.ts and docs/compatibility/performance-results.md
- [X] T064 [P] Add adversarial regression coverage for no auto-push, merge, deploy, reset, clean, stash, remote changes, credential disclosure, unowned-path execution, or repository-controlled content influencing command construction in tests/integration/security/foundation-safety.test.ts
- [X] T065 Update CLI safety, local-data retention, migration recovery, worktree limitation, and supported-matrix documentation in README.md, docs/security.md, and docs/compatibility/README.md
- [ ] T066 Publish the SC-003 study protocol before recruitment, then conduct the internal-beta validation with at least 20 eligible participants using the documented compatible reference repository and preinstalled M0 tools; permit only pre-start, independently verified hardware/repository-provisioning failures or pre-start withdrawals as exclusions, retain every started attempt, and record each participant's start/end time, outcome, sanitized environment version metadata, configuration-edit occurrence, and permitted exclusion evidence before calculating and retaining the completion rate in docs/compatibility/internal-beta-validation.md
- [ ] T067 Run formatting, lint, typecheck, all automated suites, quickstart scenarios, the completed T066 beta-validation review, and release-gate evidence review; retain passing macOS, Linux, and WSL Git/file-boundary results before declaring support, link each result to its applicable source PRD ID and FR/SC references, and block the M0 compatibility release gate unless T036 records two qualifying agent interfaces in docs/compatibility/foundation-release-checklist.md

**Checkpoint**: The feature has reproducible contract, persistence, compatibility, isolation,
performance, and adversarial evidence suitable for the constitution’s delivery gate.

---

## Requirement Traceability

Each implementation and test artifact MUST preserve its applicable source PRD trace alongside its
internal FR/SC reference. T067 verifies that the release checklist carries these links forward.

| Source PRD trace | Requirements | Primary tasks |
|---|---|---|
| FR-001, FR-036, FR-043, NFR-015 | FR-001, FR-002, FR-006–FR-010, FR-015 | T020, T027, T037–T049, T052, T062, T067 |
| FR-002, FR-003, FR-004, FR-039, NFR-009 | FR-003–FR-005, FR-011 | T020, T023–T034, T037, T047, T067 |
| FR-037, FR-038 | FR-008, FR-015 | T038, T048, T052, T062, T067 |
| FR-044, NFR-003 | FR-012, SC-004 | T016–T019, T041, T053, T058–T059, T067 |
| FR-041, FR-028, M1 | FR-013–FR-016, SC-001–SC-002, SC-007 | T010, T017–T019, T037, T044, T050–T061, T064, T067 |
| M0 | FR-017–FR-018, SC-006 | T023–T036, T067 |
| NFR-004, NFR-010 | FR-019, SC-007 | T011–T015, T025, T052, T064, T067 |
| Internal-beta usability | SC-003 | T066, T067 |
| Performance requirement | SC-005 | T063, T067 |

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 Setup starts immediately.
- Phase 2 Foundation depends on T001 through T008 and blocks every user story.
- Phase 3 US1 depends on Phase 2. It is the compatibility MVP and may be delivered first.
- Phase 4 US2 depends on Phase 2; T042 and T043 require T017 and T018. It can proceed alongside
  US1 after T009 through T022. The M0 compatibility release gate remains blocked until T036 proves
  two qualifying interfaces; no downstream orchestration may rely on a smaller matrix.
- Phase 5 US3 depends on Phase 2 and the trusted-project services from T042 through T048.
- Phase 6 Polish depends on all desired story phases; T067 is the final release gate and depends on T066's completed beta-validation evidence.

### User Story Dependency Graph

~~~text
Setup → Foundation
Foundation → US1 diagnostics and compatibility → polish
Foundation → US2 trusted registration → US3 isolated workspace → polish
~~~

- US1 P1 is independently testable after Foundation.
- US2 P1 is independently testable after Foundation.
- US3 P2 requires US2 trusted registration/revalidation and is independently testable thereafter.
- FR-017 and FR-018 belong to US1 compatibility fixtures and must complete before a later
  orchestration feature consumes an agent/provider capability.

### Parallel Opportunities

- After T001 and T002, T003 through T006 can proceed in parallel.
- In Foundation, T010 and T014 may start after T009; T013, T015, T019, and T022 are parallel once
  their respective implementation prerequisites exist.
- US1 test tasks T023 through T026 can run in parallel; T028 through T031 are separate probe files after T027.
- US2 test tasks T037 through T041 can run in parallel; T045 and T046 can proceed after T043 and T044.
- US3 test tasks T050 through T053 can run in parallel; T054 through T056 can proceed after US2 is complete.
- Cross-cutting T062 through T064 can run in parallel after US3; T065 and T066 can start before T067.

## Parallel Execution Examples

### User Story 1

~~~text
T023 tests/contract/cli/doctor.contract.test.ts
T024 tests/integration/diagnostics/doctor-nondestructive.test.ts
T025 tests/integration/diagnostics/doctor-safety.test.ts
T026 tests/integration/diagnostics/compatibility-matrix.test.ts
~~~

After T027, implement these independent probe files together:

~~~text
T028 packages/diagnostics/src/speckit-probe.ts
T029 packages/diagnostics/src/test-command-probe.ts
T030 packages/diagnostics/src/auth-availability-probe.ts
T031 packages/diagnostics/src/interfaces/codex.ts and packages/diagnostics/src/interfaces/opencode.ts
~~~

### User Story 2

~~~text
T037 tests/contract/cli/projects.contract.test.ts
T038 tests/integration/projects/registration-and-duplicates.test.ts
T039 tests/integration/projects/lifecycle-preservation.test.ts
T040 tests/integration/projects/revalidation-and-relink.test.ts
T041 tests/integration/projects/registration-recovery.test.ts
~~~

### User Story 3

~~~text
T050 tests/contract/cli/workspace-prepare.contract.test.ts
T051 tests/integration/workspace/prepare-preservation.test.ts
T052 tests/integration/workspace/boundary-and-identity.test.ts
T053 tests/integration/workspace/prepare-recovery.test.ts
~~~

## Implementation Strategy

### MVP First — Compatibility Diagnostic

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 through T036.
3. Run the independent diagnostic, redaction, and compatibility fixture evidence.
4. Stop if supported interfaces cannot be observed; report needs_setup or unsupported rather than
   beginning orchestration work or claiming support.

### Incremental Delivery

1. Deliver US1: safe compatibility diagnostic and observed matrix.
2. Deliver US2: trusted, duplicate-safe project registry and non-destructive lifecycle.
3. Deliver US3: previewed, project-owned isolated worktree with recovery.
4. Complete Phase 6 only after all required evidence is current.

### Parallel Team Strategy

1. One team completes Setup and Foundation, retaining single ownership of shared schema/migrations.
2. After Foundation, one developer can implement US1 while another begins US2 tests/identity layer;
   coordinate changes to packages/contracts/src and apps/cli/src/program.ts.
3. Begin US3 only after the US2 trust/revalidation interfaces are stable.
4. Reserve the release gate for a clean environment with reproducible local compatibility evidence.

## Format Validation

All 87 tasks use the required checklist form: checkbox, sequential T### ID, [P] only where the task
can use different files without incomplete-task dependencies, [US#] on every user-story task, and
one or more exact repository file paths in every task description.

## Phase 7: Convergence

- [X] T068 CRITICAL: Wire startup reconciliation and user-visible recovery for every unfinished operation, including failed relinks and interrupted worktree preparation, with identity/postcondition validation and regression coverage in apps/cli/src/program.ts, apps/cli/src/commands/projects.ts, packages/storage/src/recovery.ts, packages/workspace/src/workspace-recovery-service.ts, and tests/integration/ (Constitution V; FR-012; contradicts)
- [X] T069 Enforce an explicit executable allowlist at the central process boundary and add refusal coverage for unapproved binaries in packages/core/src/process-runner.ts and tests/unit/core/process-runner.test.ts (plan: allowlisted runner; FR-019; partial)
- [X] T070 Persist canonical repository revalidation outcomes and make project listing and lifecycle restoration use current trusted/availability state, with moved/replaced-repository CLI coverage in packages/project/src/project-service.ts, packages/project/src/project-status-service.ts, apps/cli/src/commands/projects.ts, and tests/integration/projects/ (FR-008, FR-010; partial)
- [X] T071 Implement a reproducible safe-boundary and interruption/resume compatibility fixture that persists sanitized Spec Kit and two-agent evidence, evaluates the M0 gate from records, and keeps it failed until qualification in packages/diagnostics/src/compatibility-service.ts, packages/diagnostics/src/interfaces/, tests/integration/diagnostics/compatibility-matrix.test.ts, and docs/compatibility/matrix.local.json (FR-017, FR-018; missing)
- [X] T072 Return the contract-required pending operation and top-level confirmation digest from workspace preview, validate that exact preview request on confirmation, and extend CLI contract coverage in apps/cli/src/commands/workspace.ts, packages/workspace/src/workspace-preview-service.ts, apps/cli/src/output.ts, and tests/contract/cli/workspace-prepare.contract.test.ts (US3/AC1; FR-013; contradicts)
- [X] T073 Persist bounded nonsecret project configuration and artifact discovery snapshots with project ownership and add storage/integration coverage in packages/project/src/config-snapshot.ts, packages/project/src/artifact-discovery.ts, packages/storage/src/project-repository.ts, and tests/integration/projects/init-artifact-preservation.test.ts (FR-011; partial)

## Phase 8: Convergence

- [X] T074 Expose sanitized repository Git identity and status in `spectide doctor` output, while retaining canonical-root and redaction safeguards, and add CLI contract/integration coverage in apps/cli/src/commands/doctor.ts, apps/cli/src/program.ts, packages/diagnostics/src/doctor-service.ts, tests/contract/cli/doctor.contract.test.ts, and tests/integration/diagnostics/doctor-nondestructive.test.ts (US1/AC1; FR-002; partial)
- [X] T075 Implement an availability-only authentication diagnostic that uses documented nonsecret status boundaries, reports ready/needs_setup/unsupported/unverified honestly with a concrete next action, and proves credentials are never read, persisted, or rendered in packages/diagnostics/src/auth-availability-probe.ts, packages/diagnostics/src/doctor-service.ts, packages/core/src/process-runner.ts, and tests/integration/diagnostics/doctor-safety.test.ts (FR-004; partial)
- [ ] T076 Implement and execute a reproducible real-tool safe-boundary plus interruption/resume compatibility harness for one Spec Kit path and two distinct coding-agent interfaces; persist only sanitized observed evidence, derive the M0 gate from those records, and retain the resulting evidence in packages/diagnostics/src/compatibility-service.ts, packages/diagnostics/src/interfaces/, tests/integration/diagnostics/compatibility-matrix.test.ts, and docs/compatibility/matrix.local.json (FR-017, FR-018, SC-006; partial)
- [X] T077 Restrict the central process runner to approved executable-and-argument profiles so arbitrary destructive Git subcommands cannot be launched, while preserving the reviewed discovery and worktree operations, and add refusal regression coverage in packages/core/src/process-runner.ts, packages/project/src/git-identity.ts, packages/workspace/src/, and tests/unit/core/process-runner.test.ts (Constitution III; FR-016; partial)
- [ ] T078 Conduct the published SC-003 internal-beta study with at least 20 eligible participants, retain every started attempt and permitted exclusion evidence, calculate the completion rate, and preserve the final sanitized validation record in docs/compatibility/internal-beta-validation.md (SC-003; missing)
- [ ] T079 Run and retain the missing hosted Ubuntu and WSL Git/file-boundary validation plus the final release-gate review, update platform and release evidence with applicable PRD/FR/SC links, and keep M0/platform support blocked until the required compatibility and beta evidence qualifies in .github/workflows/ci.yml, docs/compatibility/platform-validation.md, and docs/compatibility/foundation-release-checklist.md (T067; missing)

## Phase 9: Convergence

- [ ] T080 Execute the real-tool safe-boundary plus interruption/resume compatibility harness for one Spec Kit workflow path and two distinct coding-agent interfaces, persist only sanitized observed evidence, derive the M0 gate from those records, and retain the qualifying or honestly blocked evidence in packages/diagnostics/src/compatibility-service.ts, packages/diagnostics/src/interfaces/, tests/integration/diagnostics/compatibility-matrix.test.ts, and docs/compatibility/matrix.local.json (FR-017, FR-018, SC-006; partial)
- [ ] T081 Conduct the published internal-beta study with at least 20 eligible participants, retain every started attempt and permitted exclusion evidence, calculate the completion rate, and preserve the final sanitized validation record in docs/compatibility/internal-beta-validation.md (SC-003; missing)
- [ ] T082 Run and retain hosted Ubuntu and WSL Git/file-boundary validation, complete the final release-gate review with applicable PRD/FR/SC links, and keep M0/platform support blocked until the required compatibility and beta evidence qualifies in .github/workflows/ci.yml, docs/compatibility/platform-validation.md, and docs/compatibility/foundation-release-checklist.md (T067, SC-007; missing)

## Phase 10: Convergence

- [ ] T083 Execute the real-tool safe-boundary plus interruption/resume compatibility harness for one Spec Kit workflow path and two distinct coding-agent interfaces; persist only sanitized observed evidence, derive the M0 gate from those records, and retain the qualifying or honestly blocked evidence in packages/diagnostics/src/compatibility-service.ts, packages/diagnostics/src/interfaces/, tests/integration/diagnostics/compatibility-matrix.test.ts, and docs/compatibility/matrix.local.json (FR-017, FR-018, SC-006; partial)
- [ ] T084 Conduct the published internal-beta study with at least 20 eligible participants, retain every started attempt and permitted exclusion evidence, calculate the completion rate, and preserve the final sanitized validation record in docs/compatibility/internal-beta-validation.md (SC-003; missing)
- [ ] T085 Run and retain hosted Ubuntu and WSL Git/file-boundary validation, complete the final release-gate review with applicable PRD/FR/SC links, and keep M0/platform support blocked until the required compatibility and beta evidence qualifies in .github/workflows/ci.yml, docs/compatibility/platform-validation.md, and docs/compatibility/foundation-release-checklist.md (T067, SC-007; missing)
- [X] T086 Extract the initial versioned SQLite schema, indexes, foreign keys, and immutability/audit triggers into the planned migration module, retain migration-backup behavior, and add regression coverage in packages/storage/src/migrations/001-foundation.ts, packages/storage/src/database.ts, packages/storage/src/migrator.ts, and tests/integration/storage/foundation-storage.test.ts (T017; plan: versioned migrations; partial)
- [X] T087 Extract rename/archive/restore/confirmed-unregister lifecycle behavior into the planned project lifecycle service while preserving approval audits and source/history retention, with regression coverage in packages/project/src/project-lifecycle-service.ts, packages/project/src/project-service.ts, apps/cli/src/commands/projects.ts, and tests/integration/projects/lifecycle-preservation.test.ts (T045; plan: project service boundary; partial)


