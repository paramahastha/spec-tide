# Feature Specification: Workflow Execution

**Feature Branch**: `main`
**Created**: 2026-10-26
**Status**: Draft
**Input**: Product Requirements Document: `SpecTide_Full_PRD_v1.1_Multi_Project.md`, scoped to M2 — Workflow execution: one supported workflow, a durable stage coordinator, scoped queues, approvals, checkpoints, and a minimal end-to-end run.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start and Complete a Supported Workflow (Priority: P1)

A developer with a trusted project and a compatible workflow setup can explicitly select that project, describe a feature, review the planned isolated workspace and workflow, and start one supported end-to-end delivery workflow. They can see the current stage and its outcome, while existing project artifacts and the original checkout remain protected.

**Why this priority**: Delivering one controlled workflow is M2's core value and establishes the reliable execution path needed before provider routing, evidence assessment, or dashboard expansion.

**Independent Test**: In a prepared fixture project with a compatibility-validated workflow path, explicitly start an M2 run and verify that preflight, artifact-generation, implementation, and convergence stages complete in the isolated workspace with durable stage history and expected artifacts.

**Acceptance Scenarios**:

1. **Given** a trusted project, an explicit project target, and a workflow path validated by the M0 compatibility record, **When** the developer previews and starts a feature run, **Then** the product shows the project, base revision, workspace, requested work, selected workflow, applicable approvals, and initial stage plan before any mutating work begins.
2. **Given** an approved run with valid inputs, **When** each supported workflow stage completes with its required artifacts, **Then** the next eligible stage begins in the same project-owned workspace and the stage history records the outcome and source revision.
3. **Given** a stage process exits successfully but its required artifact is absent or invalid, **When** the coordinator evaluates the stage, **Then** the stage does not succeed and the run shows a specific blocker without starting dependent work.
4. **Given** the M2 workflow finishes its supported stages, **When** the developer inspects its result, **Then** it is clearly identified as workflow completion with requirement-level verification still pending; it is never represented as `COMPLETED_VERIFIED` in this feature.

---

### User Story 2 - Run Independent Projects Safely (Priority: P1)

A developer with several registered projects can start independent runs without one project selecting, reading, writing, or consuming the execution slot of another. When capacity is exhausted, the developer sees a queued run rather than an unsafe concurrent writer.

**Why this priority**: M2's project-aware scheduler turns the foundation's project isolation into safe, useful multi-project execution.

**Independent Test**: Start runs for three distinct fixture projects with global capacity set to two; verify that two run independently, the third is queued with its own project label, and a second mutating run in either active project remains queued.

**Acceptance Scenarios**:

1. **Given** two ready runs for distinct trusted projects and capacity for two, **When** both are started, **Then** both execute independently with their own workspace, history, checkpoints, and events.
2. **Given** global capacity is full, **When** the developer starts a ready run for a third project, **Then** it remains queued with an understandable reason and starts only after capacity becomes available.
3. **Given** a project already has a mutating run, **When** another mutating run is requested for that project, **Then** the later run queues and no two writers operate in that project's same workspace or checkout.
4. **Given** runs from different projects have events or approvals, **When** their histories are viewed or replayed, **Then** every item remains bound to its immutable project and run and cannot be applied to another project.

---

### User Story 3 - Pause, Resume, or Cancel Without Losing Work (Priority: P2)

A developer can safely interrupt an in-progress run, inspect what has been preserved, and resume from the last valid checkpoint after the product restarts or a provider interruption occurs. They can cancel a run without silently deleting its reviewable changes.

**Why this priority**: Long-running agent workflows are routinely interrupted; durable recovery is required for a developer to trust automation with real project work.

**Independent Test**: Interrupt a fixture run during implementation, restart the service, and resume it. Separately cancel an active run. In both cases, verify that prior successful stages are not duplicated, the workspace diff remains available, and no active child process is left untracked.

**Acceptance Scenarios**:

1. **Given** a run stopped after a durable checkpoint, **When** the developer requests resume, **Then** the product revalidates workspace identity, source and artifact freshness, workflow compatibility, and active ownership before previewing the safe resume point.
2. **Given** a completed stage's inputs changed after interruption, **When** the developer resumes, **Then** the product marks dependent stages stale and identifies the stages that must be repeated rather than blindly reusing them.
3. **Given** cancellation is requested for an active stage, **When** cancellation completes, **Then** tracked child work is stopped safely, the run becomes cancelled, and the isolated workspace and reviewable diff are preserved without automatic reset, cleanup, push, merge, or deployment.
4. **Given** the last invocation may have completed a non-idempotent side effect before interruption, **When** resume is requested, **Then** the run pauses for developer reconciliation and does not replay that action automatically.

---

### User Story 4 - Review and Resolve an Execution Approval (Priority: P2)

A developer receives a clear, project-scoped approval request whenever the applicable safety policy requires one, can approve or reject the exact proposed action, and can understand why a run is waiting.

**Why this priority**: Approval and checkpoint persistence are M2 deliverables; safety decisions must remain trustworthy across queues, restarts, and projects.

**Independent Test**: Configure a fixture run to require approval, restart while it is waiting, then approve, reject, and attempt to reuse the approval for another run. Verify that only the original matching action can proceed.

**Acceptance Scenarios**:

1. **Given** a planned action requires approval, **When** the run reaches that action, **Then** it waits and shows the target project, purpose, affected workspace or paths, risk, and available decision.
2. **Given** a developer approves the exact pending action, **When** the run continues, **Then** the recorded approval is bound to that project, run, action digest, actor, and time and cannot authorize a materially changed action.
3. **Given** a developer rejects or does not act on an approval, **When** the request remains unresolved, **Then** the run remains paused or blocked without implicit approval or an unapproved fallback.

### Edge Cases

- A request is made outside a registered repository while multiple projects exist: the product requires an explicit project selection and never falls back to the most recently used project.
- A project is archived, missing, untrusted, moved, or no longer matches its registered Git identity: new execution is refused before a workspace or worker is created; historical run records remain readable.
- A queued run's project policy, workflow artifacts, base revision, or approval-relevant inputs change before it begins: the product refreshes the preflight and requires a new preview or approval where the planned action materially changed.
- The compatible upstream workflow version or required artifacts are unavailable: the affected stage fails with an actionable compatibility or artifact error; the product does not simulate a successful stage.
- Event delivery is interrupted or a client reconnects: previously stored events can be replayed in order without duplicating a transition or making an old event affect another run.
- A timeout, permission problem, provider limit, conflict, invalid artifact, or tool failure occurs: the run records the classified failure and safe next step; it does not retry indefinitely or switch provider/account without an already authorized policy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST create a run only for an explicit trusted project target or an unambiguous registered repository context, and MUST display the selected project and canonical location before execution. It MUST refuse ambiguous, archived, missing, untrusted, or identity-mismatched targets. *(PRD trace: FR-005, FR-041, FR-043)*
- **FR-002**: Before starting a mutating run, the product MUST provide a reviewable preflight plan containing the request, selected supported workflow, execution mode, base revision, isolated workspace, stage sequence, applicable policy, and required approvals. The developer MUST explicitly start the reviewed plan. *(PRD trace: FR-005, FR-007, FR-028, FR-041)*
- **FR-003**: The product MUST support one M2 feature workflow through a compatibility-validated upstream Spec Kit workflow path. It MUST use upstream workflow and artifact semantics where supported and coordinate only required boundaries; it MUST NOT claim to replace or independently reimplement the full upstream workflow language. *(PRD trace: M2, §8.1, §8.2; Constitution trace: IV)*
- **FR-004**: The M2 workflow MUST coordinate the following supported sequence in a project-owned isolated workspace: preflight; specification; clarification when required; plan; tasks; read-only analysis; implementation; and convergence. A stage that is not applicable according to the supported workflow may be recorded as skipped with its reason. *(PRD trace: §8.1, §8.2, M2)*
- **FR-005**: The product MUST model stage state using `PENDING`, `READY`, `RUNNING`, `WAITING_APPROVAL`, `WAITING_INPUT`, `BLOCKED`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `SKIPPED`, and `STALE`, and MUST enforce valid transitions. A stage MUST succeed only when its invocation and configured postconditions, including required artifacts, succeed. *(PRD trace: §8.3, FR-006)*
- **FR-006**: The product MUST persist, under the immutable project and run owner, every run and stage transition, invocation outcome, required artifact reference, source revision or input fingerprint, checkpoint, approval event, and failure classification before it reports the corresponding action as complete. *(PRD trace: FR-006, FR-038, FR-044; Constitution trace: II, V)*
- **FR-007**: The product MUST expose durable, ordered, replayable execution events for each run. A reconnecting consumer MUST receive events after its last acknowledged position without duplicate state transitions, and events MUST remain project-scoped. *(PRD trace: FR-009, FR-038, FR-044)*
- **FR-008**: The product MUST schedule ready runs with a configurable global concurrent-run limit and a default limit of two, while allowing at most one mutating run per project by default. Runs exceeding either limit MUST queue without creating an additional writer. *(PRD trace: M2, FR-040, §7.6)*
- **FR-009**: The scheduler MUST select queued eligible work fairly across projects so that a continuously ready project cannot indefinitely prevent another eligible project's queued run from starting. A queued item MUST retain its project, request, policy, and order information across restart. *(PRD trace: M2, §15.1a, FR-040, FR-044)*
- **FR-010**: Every mutating execution MUST use the dedicated workspace prepared for its project and selected base revision. The product MUST prevent a run from writing through a shared original checkout, another project's workspace, or a path that resolves outside the approved boundary. *(PRD trace: FR-028, FR-038, FR-040; Constitution trace: I, V)*
- **FR-011**: The product MUST provide pause, resume, cancel, and cancellation confirmation for active and queued runs. Pause and cancellation MUST safely propagate to tracked child work, preserve the isolated workspace and changes, and never automatically push, merge, deploy, reset, clean, stash, or delete user work. *(PRD trace: FR-008, FR-028; Constitution trace: III)*
- **FR-012**: On resume, the product MUST validate the run's project identity, workspace and branch, compatibility record, active worker ownership, upstream state reference, and fingerprints of workflow inputs and configured checks. It MUST mark invalid dependent work stale and preview the resume point before continuing. *(PRD trace: FR-006, FR-010, FR-044, §17.4)*
- **FR-013**: If an interrupted action may have produced a non-idempotent or otherwise uncertain side effect, the product MUST require manual reconciliation before it resumes that action. It MUST NOT blindly replay the action. *(PRD trace: §17.4, AT-022; Constitution trace: III, V)*
- **FR-014**: The product MUST classify recoverable execution failures as `rate_limit`, `timeout`, `auth`, `invalid_artifact`, `test_failure`, `tool_failure`, `conflict`, or `permission`; it MUST present a human-readable blocker and apply only the configured bounded retry policy. *(PRD trace: FR-027)*
- **FR-015**: When policy requires approval, the product MUST place the run in `WAITING_APPROVAL` and present a plain-language action summary, involved project and workspace or paths, risk, and possible decisions. Approval records MUST contain the exact action digest, project, run, decision, actor, and timestamp. *(PRD trace: M2, FR-042, §14.6; Constitution trace: III)*
- **FR-016**: The product MUST reject an approval used outside its original project, run, or exact action digest, and MUST invalidate it when a material planned action changes. Rejection, expiration, or inaction MUST never implicitly approve or silently reroute the action. *(PRD trace: FR-042, AT-030; Constitution trace: III)*
- **FR-017**: The product MUST invoke workflow and agent processes only through authorized working directories, executable-plus-argument inputs, an approved environment, and bounded time. User requests, artifact text, and process output MUST remain data and MUST NOT form executable shell instructions. *(PRD trace: NFR-004, NFR-010, AT-011; Constitution trace: Non-Negotiable Engineering Constraints)*
- **FR-018**: The product MUST preserve existing Spec Kit artifacts and show an actionable error when required artifacts are absent, stale, or incompatible. It MUST not start implementation after a missing required artifact or an analysis result that blocks implementation. *(PRD trace: FR-002, FR-010, §17.1)*
- **FR-019**: The product MUST distinguish workflow execution completion from requirement-level verification. In M2, it MUST report a completed workflow as partial or verification-pending until the later evidence-verification feature establishes current requirement evidence; it MUST never derive verification from an agent claim, process exit code, or completed task checkboxes. *(PRD trace: §8.4, FR-022; Constitution trace: II)*

### Scope Boundaries

This feature delivers M2: a project-aware, durable coordinator that runs one compatibility-validated Spec Kit feature workflow in an isolated workspace; persists stages, events, approvals, and checkpoints; supports controlled interruption recovery; and schedules independent project runs safely.

This feature does not add the provider adapter catalog, multiple named profiles, cross-provider handoffs, or model/effort routing (M3); requirement indexing, test-evidence assessment, verified outcomes, repair loops, or final evidence reports (M4); or the All Projects dashboard, rich live logs, approval inbox, and report UI (M5). It also excludes parallel implementation writers, automatic merges or deployments, and any cross-repository transaction.

### Requirement Acceptance Mapping

- FR-001 through FR-005 and FR-018 through FR-019 are accepted through User Story 1 and its artifact, completion, and blocking scenarios.
- FR-006, FR-007, FR-011 through FR-014 are accepted through User Story 3, restart/fingerprint scenarios, and fault-injection checks.
- FR-008 through FR-010 are accepted through User Story 2 using three independent project fixtures and scheduler-capacity tests.
- FR-015 through FR-016 are accepted through User Story 4, including restart and cross-project replay-rejection tests.
- FR-017 is accepted through adversarial tests using shell-like request text, workflow/artifact content, and untrusted output, all of which must remain inert data.

### Key Entities *(include if feature involves data)*

- **Run**: One immutable, project-owned execution request, including its selected workflow, mode, input request, current outcome, policy snapshot, and source revision.
- **Stage Execution**: One ordered attempt to perform a workflow stage for a run, with lifecycle state, invocation result, input and artifact references, owner, timing, and blocker when applicable.
- **Checkpoint**: A durable, validated resume boundary linking a run and stage to workspace identity, source revision, artifact fingerprints, upstream state reference, and recovery eligibility.
- **Queued Run**: A ready but not yet executing run that retains its project, queue order, policy snapshot, and capacity reason without obtaining a second writer.
- **Execution Event**: An ordered project- and run-scoped record of a material lifecycle, invocation, checkpoint, approval, or recovery occurrence that can be replayed safely.
- **Approval Request**: A pending, project- and run-scoped decision for one digest of a planned action, with risk explanation, decision state, actor, and expiration or invalidation state.
- **Workflow Compatibility Record**: The current evidence that a particular upstream workflow path and supported execution boundary may be used safely for this project context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a fixture project with a current compatible workflow record, 100% of 20 consecutive M2 feature runs complete the supported preflight-to-convergence sequence with a durable stage history and all required artifacts, or stop at the first documented blocker; none are labeled requirement-verified by M2 alone.
- **SC-002**: With three independent fixture projects and a global capacity of two, two eligible runs execute concurrently while the third remains correctly queued; in 20 repeated trials, no run reads, writes, emits an approval for, or replays an event into another project's scope.
- **SC-003**: Across fault-injection tests at every persisted stage boundary, at least 95% of eligible interrupted runs resume from the validated checkpoint on the first attempt, and 100% preserve prior successful stages and the isolated workspace without a duplicate completed invocation.
- **SC-004**: In 20 cancellation tests during active execution, 100% leave no untracked active child process after cancellation completes and retain a reviewable workspace diff without an automatic destructive Git action.
- **SC-005**: In a usability study of at least 12 eligible developers using a prepared compatible fixture project, at least 80% can select the correct project, understand the run preview, start a workflow, and identify its current stage or blocker without editing configuration files or using terminal logs as the sole source of status.
- **SC-006**: In all approval-replay and material-action-change tests, 100% of mismatched, expired, rejected, or unanswered approvals fail to authorize execution; the user is shown the affected project, run, and next safe action.

## Assumptions

- M0 has produced and retained a current compatibility record for at least one upstream Spec Kit workflow path and one local execution interface; M2 uses only that validated path.
- The foundation feature supplies trusted project registration, canonical identity validation, project-scoped durable storage, and isolated workspace preparation; M2 builds on those safeguards rather than redefining them.
- M2 supports one feature workflow and sequential stage execution within one isolated workspace. Provider selection, profiles, and multi-provider handoff are intentionally deferred to M3.
- A developer explicitly starts a reviewed preflight plan. Policy may add approvals for elevated actions, while rejection or missing approval keeps the run paused.
- M2 may report whether its workflow executed or was blocked, but current requirement-level verification and final evidence reporting require the separate M4 feature.
- The initial scheduler defaults to two concurrent runs globally and one mutating run per project; deployment may lower these limits when the local machine or policy cannot safely support them.
