<!--
Sync Impact Report
- Version change: scaffold → 1.0.0
- Modified principles: scaffold placeholders → I. Local-First and Project Isolation;
  II. Evidence Before Claims; III. Safe, Explicit Autonomy; IV. Upstream Compatibility
  and Contract Discipline; V. Durable, Bounded Execution
- Added sections: Non-Negotiable Engineering Constraints; Delivery and Quality Gates
- Removed sections: none
- Follow-up TODOs: none
-->

# SpecTide Constitution

## Core Principles

### I. Local-First and Project Isolation
SpecTide MUST operate locally by default: its core CLI, dashboard, history, reports, and
deterministic verification must not require a hosted SpecTide service or account. Every registered
repository MUST have an immutable project identity, explicit trust state, canonical-path and Git
identity validation, and project-scoped storage, APIs, exports, approvals, requirements, events,
and worktrees. A run MUST bind to exactly one project and feature context; no operation may infer
or reuse another project's scope, data, approval, or policy. External agent providers receive
source or prompts only when the user has selected an allowed provider for that project.

Rationale: SpecTide's value depends on developers being able to work across many repositories
without a hosted control plane, context leakage, or ambiguous ownership.

### II. Evidence Before Claims
An agent report, completed task checkbox, workflow exit code, or LLM review MUST NOT alone mark a
requirement or run as verified. A `VERIFIED` result requires current, configured mandatory checks
against the relevant code and configuration fingerprints, explicit or human-confirmed evidence
links, and no unresolved critical contradiction. Evidence, requirement links, provenance, status,
and freshness MUST be persisted and exposed in reports. Inferred or manual evidence MUST remain
visibly distinct from executable evidence; stale evidence MUST invalidate the affected conclusion.

Rationale: requirement-level, reproducible evidence is the product's primary trust boundary and
is more reliable than an unexamined model assertion.

### III. Safe, Explicit Autonomy
SpecTide MUST automate only reversible, policy-permitted work. It MUST require explicit approval
for sensitive, irreversible, or elevated-risk actions, and record an action digest, risk,
decision, actor, and timestamp. The product MUST NOT auto-push, auto-merge, deploy, reset, clean,
stash, delete user work, modify Git remotes, bypass provider approvals, or execute an unapproved
provider/profile fallback. Approvals MUST be bound to their exact project, run, and action digest
and cannot transfer to materially different actions.

Rationale: useful autonomy protects a developer's code, credentials, infrastructure, and control
over the final Git or production action.

### IV. Upstream Compatibility and Contract Discipline
SpecTide MUST reuse supported Spec Kit workflows, artifacts, and resume interfaces rather than
reimplementing their semantics or mutating upstream state to force transitions. Provider adapters
MUST capability-probe and validate supported CLI versions, flags, model/effort settings,
authentication isolation, streaming, and cancellation behavior before use. Each workflow step
MUST have exactly one execution authority: the upstream engine or SpecTide's boundary coordinator.
Unsupported behavior MUST fail safely or present a labeled, approved downgrade; it must never be
simulated or claimed as successful.

Rationale: third-party CLI and workflow behavior changes frequently; explicit contracts and
compatibility evidence prevent silent breakage and false orchestration claims.

### V. Durable, Bounded Execution
Every stage transition, invocation, checkpoint, approval, and evidence decision MUST be durable,
ordered, and attributable to a run. Execution MUST use isolated Git worktrees, preserve the
original checkout and user changes, and contain child processes within their owning run. Retries,
repairs, concurrency, time, and storage MUST be bounded by explicit policy. Resume MUST validate
workspace identity, inputs, upstream compatibility, active ownership, and non-idempotent side
effects before continuing; uncertainty MUST pause for user reconciliation.

Rationale: interruptions, provider limits, and concurrent work are normal operating conditions,
not reasons to duplicate work, corrupt state, or conceal uncertainty.

## Non-Negotiable Engineering Constraints

- All command execution MUST use an executable plus argument array, an authorized working
  directory, a restricted environment allowlist, and a timeout. User text, agent output, and
  artifact content MUST NOT be interpolated into shell command strings.
- Repository and filesystem access MUST use realpath/canonicalization checks and enforce approved
  workspace boundaries, including symlink-escape protection. Git worktrees isolate changes, not
  OS permissions, network access, credentials, or shell side effects; UI and documentation MUST
  state that boundary accurately.
- Credentials, API keys, full environment files, browser sessions, and unredacted conversations
  MUST NOT enter project configuration, normal logs, reports, telemetry, or exports. Telemetry and
  remote diagnostic export MUST be opt-in, previewed, and redacted; product metrics remain local
  by default.
- The localhost service MUST bind only to loopback and protect mutating endpoints with session,
  origin, CSRF, and scope validation. Storage migrations and cleanup MUST preserve user code and
  retained evidence, provide a visible backup or recovery path before destructive change, and
  never silently discard required evidence.
- Project-level safety and provider restrictions are upper bounds. Global preferences, profiles,
  and per-run choices MUST NOT relax a project's stricter policy.

## Delivery and Quality Gates

- Work MUST proceed through traceable Spec Kit artifacts and preserve applicable PRD requirement
  IDs through specification, plans, tasks, implementation, tests, and release checks. Existing
  project artifacts MUST NOT be rewritten solely for internal indexing without opt-in.
- Compatibility work MUST precede dependent orchestration work. A provider, workflow, profile
  transition, or adapter capability enters supported use only after reproducible compatibility and
  contract tests validate it.
- Each implementation slice MUST include automated tests appropriate to its risk: unit tests for
  policy and state logic; contract tests for adapters and schemas; integration tests for Git,
  storage, and process lifecycle; and end-to-end plus adversarial tests for user-visible and
  security-critical paths. Network-dependent provider tests cannot be the sole proof of a core
  behavior.
- A stage may succeed only when its required inputs, command outcome, expected artifacts,
  permission checks, durable state, and event history satisfy its declared postconditions. Failed
  mandatory checks, stale inputs, material analysis contradictions, or unresolved risky side
  effects MUST block completion or request user action.
- Autonomous repair MUST use a bounded ticket with permitted scope, current failing evidence, and
  explicit exit criteria; it MUST rerun affected and required regression checks. It MUST stop on
  policy limits, elevated risk, or exhausted attempts and report an honest partial, failed, or
  needs-review result.
- Before release, the project MUST pass applicable P0 requirement, security, isolation,
  persistence, crash/resume, and multi-project acceptance tests. Documentation MUST disclose
  verified compatibility, limitations, data-retention behavior, and any release-blocking
  exceptions.

## Governance

This constitution supersedes conflicting project practices for design, implementation, review,
and release decisions. The PRD and downstream artifacts define product scope; they cannot weaken
these governance constraints without an explicit amendment.

Amendments MUST document the motivating change, affected principles and gates, migration or
compatibility impact, and verification updates. Maintainers MUST review every implementation plan,
pull request, and release candidate for constitution compliance, recording justified exceptions
as time-bounded and risk-owned rather than silently waiving a rule.

Constitution versions use semantic versioning: MAJOR for backward-incompatible governance changes
or principle removals/redefinitions, MINOR for new principles or materially expanded obligations,
and PATCH for clarifications that preserve existing obligations. Each amendment MUST update the
version and Last Amended date; Ratified remains the initial adoption date. Operational guidance,
templates, and automated checks MUST be reviewed after every amendment for consistency with this
constitution.

**Version**: 1.0.0 | **Ratified**: 2026-10-25 | **Last Amended**: 2026-10-25
