# Feature Specification: Foundation Workspace

**Feature Branch**: `main`  
**Created**: 2026-10-25  
**Status**: Draft  
**Input**: Product Requirements Document: `SpecTide_Full_PRD_v1.1_Multi_Project.md`, scoped to the recommended M0 compatibility spike and M1 foundation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Assess Local Compatibility (Priority: P1)

An experienced developer can inspect an existing local Git repository and their available development-tool setup before trusting SpecTide to coordinate work. They receive a clear capability result, including setup guidance for anything unavailable, without the product reading credentials, modifying the repository, or guessing that an unsupported capability will work.

**Why this priority**: Safe compatibility evidence is the prerequisite for every later orchestration action and prevents false claims about supported workflows or local tools.

**Independent Test**: In a valid Git repository with a mixture of available, missing, and unsupported prerequisites, run the diagnostic action and verify that it reports each condition, offers a concrete correction where appropriate, and leaves repository files unchanged.

**Acceptance Scenarios**:

1. **Given** a valid repository with supported local prerequisites, **When** the developer runs diagnostics, **Then** they see the repository identity, discovered project artifacts, and a capability result for each checked prerequisite.
2. **Given** a repository where a prerequisite is missing or an option is unsupported, **When** diagnostics run, **Then** the developer sees an actionable explanation and no unsupported behavior is represented as ready.
3. **Given** a repository containing existing Spec Kit artifacts, **When** the developer initializes or diagnoses it, **Then** the artifacts remain unchanged and the developer is shown the detected state.

---

### User Story 2 - Register Trusted Projects (Priority: P1)

A developer who works in multiple local repositories can register each repository independently, confirm its trust, and list the registered projects. Each project keeps its own stable identity even when its display name changes or another path points to the same repository.

**Why this priority**: Reliable project identity and isolation are the foundation for safely working across repositories without context or policy leakage.

**Independent Test**: Register three distinct local Git repositories, list them, and attempt to register one again through an alternate path. The list shows three independently identifiable projects and rejects the duplicate with an explanation.

**Acceptance Scenarios**:

1. **Given** an unregistered, valid local Git repository, **When** the developer initializes it or explicitly adds it and confirms trust, **Then** it is registered with a stable project identity, canonical location, Git identity, and discovered project state.
2. **Given** three registered repositories, **When** the developer lists projects, **Then** all three are shown independently with their display name, location, trust state, and availability state.
3. **Given** a repository already registered under its canonical location, **When** the developer attempts registration through a symlink or alternate path, **Then** registration is refused and the existing project is identified without creating a duplicate.
4. **Given** a registered project, **When** the developer changes its display name, archives it, restores it, or confirms unregistration, **Then** only the registration state changes; source repositories and retained historical records are not deleted.

---

### User Story 3 - Prepare an Isolated Project Workspace (Priority: P2)

A developer can prepare a project-owned isolated workspace for future delivery work while preserving the original checkout and uncommitted changes. The preparation records the owning project and the source revision so later execution can be traced to the correct repository.

**Why this priority**: Isolation and durable ownership must be proven before future automated work can safely mutate project code.

**Independent Test**: For a registered repository with uncommitted local changes, prepare an isolated workspace and verify that it is associated with that one project and base revision while the original checkout and its changes remain intact.

**Acceptance Scenarios**:

1. **Given** a trusted registered project, **When** the developer prepares an isolated workspace, **Then** the product displays the target project and source revision before preparation and records the resulting workspace as owned by that project.
2. **Given** an original checkout with uncommitted changes, **When** an isolated workspace is prepared from an explicitly selected clean base revision, **Then** the original checkout and its uncommitted changes are preserved and no automatic stash, reset, clean, push, merge, or deployment occurs.
3. **Given** a path that resolves outside the approved project boundary or a repository whose identity no longer matches its registration, **When** workspace preparation is requested, **Then** the request is rejected with an explanation and no workspace is prepared.

### Edge Cases

- A requested location is not a Git repository, is unavailable, or cannot be canonicalized: registration and workspace preparation fail with a specific correction; no partial project record is left behind.
- A registered repository is moved, removed, or replaced at the old path: it is marked unavailable or untrusted until the developer explicitly verifies and relinks the original Git identity; historical records remain readable.
- Existing Spec Kit artifacts are absent: initialization provides setup guidance or offers a separately approved upstream setup action; it never assumes installation or overwrites local configuration.
- A compatibility check emits sensitive-looking output: the user-facing diagnostic result omits secrets and records only the minimum safe detail needed to act.
- A storage upgrade or process interruption occurs while registering a project or preparing a workspace: after restart, the operation is either fully represented with its correct owner or clearly incomplete; it is never duplicated or silently reassigned.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST run locally for project discovery, initialization, diagnostics, project registration, project listing, and isolated-workspace preparation; these capabilities MUST NOT require a hosted SpecTide account or service.
- **FR-002**: The product MUST identify the effective root of a requested repository, resolve its canonical location, validate its Git identity and status, and reject missing, untrusted, or out-of-boundary repositories with actionable guidance. *(PRD trace: FR-001, FR-036, FR-043)*
- **FR-003**: The product MUST detect existing Spec Kit artifacts and relevant local project state without destructively rewriting those artifacts. *(PRD trace: FR-002)*
- **FR-004**: The product MUST provide a diagnostic result for the repository, supported local workflow tooling, configured local agent tooling, authentication availability without reading credentials, and project test-command readiness. Each unavailable or incompatible item MUST include a specific next action. *(PRD trace: FR-003)*
- **FR-005**: The product MUST record only capabilities that have been observed or verified; it MUST label an unsupported or unverified setting as unavailable rather than representing it as active. *(PRD trace: FR-003, NFR-009)*
- **FR-006**: The product MUST let a developer explicitly register a valid local repository after trust confirmation, assign it an immutable project identity, and retain a separate editable display name. *(PRD trace: FR-004, FR-036)*
- **FR-007**: The product MUST prevent duplicate registration of the same canonical Git repository, including registration through a symlink, alternate path, or alias, and MUST identify the existing registration in its response. *(PRD trace: FR-001, FR-036, NFR-015)*
- **FR-008**: The product MUST let a developer list registered projects and distinguish their trusted, unavailable, archived, and attention-required states without exposing another project's private details. *(PRD trace: FR-036, FR-037, FR-038)*
- **FR-009**: The product MUST support display-name changes, archive, restore, and explicitly confirmed unregistration. These actions MUST NOT delete the registered repository, its user code, or retained reports. *(PRD trace: FR-036, FR-043)*
- **FR-010**: The product MUST detect when a registered repository has moved, disappeared, or no longer matches its recorded Git identity; it MUST require an explicit identity-validated relink before treating a new location as the registered project. *(PRD trace: FR-043)*
- **FR-011**: The product MUST maintain project configuration separately from user-private state and credentials. Project configuration MUST contain no credentials or account secrets. *(PRD trace: FR-004, FR-039)*
- **FR-012**: The product MUST preserve the ownership and identity of every registered project and prepared workspace across restart and safe storage upgrade. An incomplete operation MUST be recoverable or visibly incomplete, not silently duplicated. *(PRD trace: FR-044, NFR-003)*
- **FR-013**: The product MUST require an explicit project target or an unambiguous trusted repository context before preparing a workspace for a mutating delivery action. It MUST display the target project and source revision before proceeding. *(PRD trace: FR-041)*
- **FR-014**: The product MUST prepare a dedicated isolated workspace associated with exactly one trusted project and one selected base revision. It MUST preserve the original checkout and its uncommitted changes. *(PRD trace: FR-028 and M1)*
- **FR-015**: The product MUST refuse workspace preparation that would escape an approved repository boundary, reuse a mismatched project identity, or risk writing into an unowned shared checkout. *(PRD trace: FR-001, FR-038, NFR-010, NFR-015)*
- **FR-016**: The product MUST not automatically push, merge, deploy, reset, clean, stash, delete user work, change repository remotes, or bypass a required approval as part of this feature. Every required approval MUST be bound to its validated action digest and durable operation record, and record the risk classification, decision, local actor, and timestamp. *(Constitution trace: III, V)*
- **FR-017**: The product MUST capture a compatibility record for the selected Spec Kit workflow path and each configured candidate coding-agent interface, including supported interaction boundaries and safe resume behavior. A capability may enter the supported set only after a reproducible compatibility check. The M0 compatibility release gate MUST require at least two locally available supported coding-agent interfaces. *(PRD trace: M0; Constitution trace: IV)*
- **FR-018**: The product MUST provide a reproducible compatibility demonstration in which two supported coding-agent interfaces complete separate safe workflow boundaries and the workflow can resume safely after an interruption. If fewer than two interfaces qualify, the product MUST report each unsupported combination honestly and MUST NOT mark the M0 compatibility release gate as passed or enable downstream agent orchestration. *(PRD trace: M0)*
- **FR-019**: The product MUST keep command input, user text, tool output, and repository content from being interpreted as executable command construction; sensitive values MUST be excluded from normal diagnostic records and exports. *(Constitution trace: Non-Negotiable Engineering Constraints; PRD trace: NFR-004, NFR-010)*

### Scope Boundaries

This feature establishes M0 and M1 only. It includes compatibility evidence, project discovery and trust, multi-project registration and identity, durable local foundation state, and safe preparation of a project-owned isolated workspace.

This feature does not execute a full Spec Kit delivery workflow, route model stages, run project tests for requirement verification, provide the All Projects dashboard, schedule concurrent delivery runs, stream workflow events, generate evidence reports, or implement adaptive routing, ContextPack, repair loops, or OpenSpec support. Those remain later PRD milestones.

### Requirement Acceptance Mapping

- FR-001 through FR-005 are accepted through User Story 1 scenarios.
- FR-006 through FR-012 are accepted through User Story 2 scenarios and the interruption/move edge cases.
- FR-013 through FR-016 are accepted through User Story 3 scenarios; FR-016 additionally requires the approval-audit contract and storage evidence.
- FR-017 and FR-018 are accepted by a recorded compatibility demonstration showing two supported agent boundaries and a safe interruption/resume outcome.
- FR-019 is accepted by adversarial checks that supply shell-like user text, symlink escapes, and sensitive-looking diagnostic output and verify that no unsafe command construction, boundary escape, or secret exposure occurs.

### Key Entities *(include if feature involves data)*

- **Project**: A trusted registration for one local Git repository, with an immutable project identity, canonical location, Git identity fingerprint, display name, trust state, registry state, and creation record.
- **Project Configuration**: Nonsecret, repository-scoped preferences and allowed policies that may be versioned with the project but cannot relax global safety constraints.
- **Compatibility Record**: A dated, reproducible result describing which local workflow and agent capabilities were checked, their observed versions or states, evidence, and any limitations.
- **Isolated Workspace**: A reviewable, project-owned checkout prepared from one selected base revision; it is distinct from the developer's original checkout.
- **Foundation Operation**: A durable record of a registration, relink, archive, restoration, unregistration, or workspace-preparation action, including owner, outcome, recovery state, and—when approval is required—the bound action digest, risk classification, decision, local actor, and timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a test with three distinct existing repositories, a developer can register and list all three with correct independent identities, and a fourth registration attempt using an alternate path to one of them is rejected without adding a duplicate.
- **SC-002**: In all defined invalid-location, symlink-escape, replaced-repository, and project-identity mismatch tests, the product prepares no workspace and exposes no data from a different registered project.
- **SC-003**: In a documented cohort of at least 20 eligible internal-beta participants, each using the same compatible reference repository with the required M0 tools installed before the timed start, at least 80% can, without editing a configuration file, register/trust the project, receive an actionable diagnostic result, and prepare a ready first workspace within five minutes. An eligible participant is an internal developer with routine terminal and Git experience who has not previously completed this study and starts with fresh user-private SpecTide state. Timing starts when the participant invokes the first SpecTide command and ends when the workspace is reported ready. The study protocol MUST be published before recruitment and may exclude a participant only before that command when an independently verified test-hardware or reference-repository provisioning failure prevents the study, or when the participant withdraws before starting; every started attempt remains in the result. The validation record MUST retain each participant's outcome, elapsed time, sanitized environment version metadata, configuration-edit occurrence, and any permitted exclusion with its verification evidence.
- **SC-004**: In fault-injection tests at each foundation persistence boundary, 100% of interrupted operations restart as either one correctly owned completed operation or one clearly recoverable incomplete operation, with zero duplicate project registrations.
- **SC-005**: On a reference repository containing exactly 100,000 tracked regular files, after one warm-up run, `spectide doctor --project <id> --json` completes in under two seconds at nearest-rank p95 across 20 sequential measured runs. The result record includes the file count, elapsed time for every run, OS, CPU, Node.js version, Git version, and pass/fail status; deviations are recorded for investigation.
- **SC-006**: The compatibility report includes reproducible evidence for at least one supported Spec Kit workflow path, two supported local coding-agent interfaces at safe workflow boundaries, and one interruption/resume demonstration before the M0 compatibility release gate passes or downstream orchestration work begins.
- **SC-007**: Across the feature's adversarial safety suite, there are zero cases of automatic push, merge, deployment, destructive checkout cleanup, credential disclosure, or execution outside the approved project boundary.

## Assumptions

- The initial users are individual developers or small engineering teams working in existing local Git repositories on a compatible local machine.
- The project is being built from the PRD's recommended first vertical slice; later P0 functionality will be specified as separate features rather than folded into this foundation scope.
- A project is trusted only after explicit developer confirmation; the product treats a moved or replaced path as untrusted until identity validation succeeds.
- The compatibility spike may discover that an assumed external tool capability is unavailable. Such a result remains visible as `needs_setup` or `unsupported` and does not weaken safety or evidence requirements; if fewer than two interfaces qualify, the M0 compatibility release gate remains unmet and downstream orchestration cannot be enabled.
- Source repositories, original checkouts, and user modifications are user-owned. The product may prepare an isolated workspace only after showing the target and selected base revision, and it preserves original user work.
- Local diagnostics may identify the availability of authentication configuration but never read, copy, display, or persist credentials.
