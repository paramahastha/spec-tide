# SpecTide — Full Product Requirements Document

**Document version:** 1.1 (multi-project workspace update)  
**Status:** Proposed / ready for specification and implementation planning  
**Prepared:** October 25, 2026  
**Product:** SpecTide  
**Product category:** Local-first AI software-development orchestration and quality assurance  
**Initial platform:** macOS; Linux as supported target; Windows via WSL initially  
**Primary license direction:** Open source (final license to be selected before public release)  
**Target user:** Individual developer and small engineering team using AI coding CLIs with Spec-Driven Development (SDD)

> **Document purpose:** This PRD specifies what SpecTide must do, why it matters, how users interact with it, what must be verified, and which features belong in each release. It is the source of truth for generating downstream Spec Kit artifacts. CLI commands, schemas, endpoints, and UI examples labeled **proposed** are product requirements, **not claims that those commands already exist**.

**Contents**

- [1. Executive Summary](#1-executive-summary)
- [2. Problem and Opportunity](#2-problem-and-opportunity)
- [3. Vision, Goals, and Non-Goals](#3-vision-goals-and-non-goals)
- [4. Target Users and Jobs to Be Done](#4-target-users-and-jobs-to-be-done)
- [5. Product Principles](#5-product-principles)
- [6. Scope and Release Strategy](#6-scope-and-release-strategy)
- [7. User Experience: Three Modes](#7-user-experience-three-modes)
- [8. Core Workflow and SDD Semantics](#8-core-workflow-and-sdd-semantics)
- [9. Detailed Functional Requirements](#9-detailed-functional-requirements)
- [10. Non-Functional Requirements and Quality Attributes](#10-non-functional-requirements-and-quality-attributes)
- [11. System Architecture](#11-system-architecture)
- [12. Data Model and Persistence](#12-data-model-and-persistence)
- [13. Agent Adaptation, Routing and Context Handoffs](#13-agent-adaptation-routing-and-context-handoffs)
- [14. Local Dashboard, CLI and UX Specifications](#14-local-dashboard-cli-and-ux-specifications)
- [15. Configuration and Policy Design](#15-configuration-and-policy-design)
- [16. Security, Privacy and Threat Model](#16-security-privacy-and-threat-model)
- [17. Failure Handling, Repair, Resume and Parallelism](#17-failure-handling-repair-resume-and-parallelism)
- [18. API and Event Contract (Proposed)](#18-api-and-event-contract-proposed)
- [19. Validation Plan and Acceptance Scenarios](#19-validation-plan-and-acceptance-scenarios)
- [20. Metrics, Benchmarks and Success Criteria](#20-metrics-benchmarks-and-success-criteria)
- [21. Implementation Roadmap and Dependencies](#21-implementation-roadmap-and-dependencies)
- [22. Example Full Execution (Concrete Product Walkthrough)](#22-example-full-execution-concrete-product-walkthrough)
- [23. Product Risks, Trade-offs and Open Decisions](#23-product-risks-trade-offs-and-open-decisions)
- [24. Spec Kit Implementation Handoff](#24-spec-kit-implementation-handoff)
- [25. References and Integration Assumptions](#25-references-and-integration-assumptions)
- [26. Final Product Definition](#26-final-product-definition)

---

## 1. Executive Summary

SpecTide is a **local-first, agent-agnostic execution and verification layer for Spec-Driven Development**. A developer describes a feature or a bug. SpecTide discovers the project and available coding agents, selects a safe workflow, coordinates Spec Kit stages, delegates work to Claude Code, Codex, or OpenCode through supported local interfaces, and produces an auditable evidence report showing which requirements have been satisfied by which tests and implementation changes.

**One-line pitch:** *From requirements to verified code, across all your repositories, using the AI agents you already have.*

**Differentiator:** Existing tools already automate Spec Kit stages and display agent dashboards. SpecTide prioritizes (1) usable multi-profile execution, (2) continuity of context between different agent CLIs, (3) **requirement-to-implementation-to-test evidence**, and (4) bounded, risk-aware repair and resumption. It reuses upstream Spec Kit rather than reimplementing all SDD primitives.

**Workspace model:** One local SpecTide installation manages **multiple registered projects at once**. The landing page is an All Projects overview; each project retains independent SDD artifacts, policies, runs, agents selections, worktrees and verification evidence. Runs can execute concurrently across different projects subject to explicit safety and resource limits. This is part of MVP (P0), not deferred collaboration functionality.

**Default experience:**

```bash
cd ~/projects/my-app
spectide init
spectide run "Implement idempotent payment webhook handling"
spectide dashboard
```

These are **proposed SpecTide commands**. The desired experience is three actions: connect a project, describe work, and review results. For users who prefer a UI, the dashboard should allow the equivalent workflow from a single **New Run** form.

**Design constraint:** Never claim a feature is verified solely because an agent reports success, `tasks.md` is checked, or an LLM reviewer approves it. Show independently observable evidence and unresolved gaps.

## 2. Problem and Opportunity

### 2.1 Current pain points

AI-powered SDD developers commonly encounter:

1. Manual orchestration of `specify`, `clarify`, `plan`, `tasks`, `analyze`, `implement`, and `converge`.
2. Different models and subscription profiles are suitable for different tasks, but switching is tedious and error-prone.
3. Context is lost or bloated when passing from one agent/provider to another.
4. Long implementations hit context, usage, or time limits, creating difficult recovery paths.
5. Multiple agents can accidentally edit overlapping files or overwrite one another.
6. An AI agent can mark tasks complete without demonstrating the user-facing requirement actually works.
7. Repeated attempts can be expensive; true token/cost usage varies by provider and may be unavailable under subscription-based tools.
8. Developers lack one concise answer: **What was built, what was tested, what failed, and what should I do next?**

### 2.2 Product opportunity

Build **the intelligent control and evidence layer above existing SDD and agent systems**, not another general-purpose IDE or replacement implementation of Spec Kit. The initial wedge is the **EvidenceGraph**, connected to a straightforward local orchestration experience.

### 2.3 Why now

The current upstream Spec Kit workflow engine supports YAML workflows, conditions, loops, review gates, persistence, pause/resume, and fan-out/fan-in. A visual orchestration product such as SpecKit Assistant also demonstrates multi-agent dashboards and execution tracking. SpecTide therefore should reuse those capabilities where practical and invest in differentiated quality and routing behavior. See the *Sources and Integration Assumptions* section.

## 3. Vision, Goals, and Non-Goals

### 3.1 Vision

Make high-quality AI-assisted software delivery feel as predictable as a guided engineering workflow: **one feature request in, visible verified progress out**.

### 3.2 Product goals

| Goal ID | Goal | Success signal |
|---|---|---|
| G-01 | Reduce manual workflow coordination | Developer initiates an end-to-end SDD run with one command or one UI action |
| G-02 | Improve evidence-backed correctness | Each must-have requirement has linked validation evidence or is visibly marked unverified |
| G-03 | Allow true cross-agent delegation | Different stages can be assigned to Claude Code, Codex, and OpenCode, including distinct local profiles |
| G-04 | Recover from routine interruptions | Resume without rerunning successful stages or losing approval/evidence state |
| G-05 | Reduce wasted model usage | Collect comparable execution metrics and recommend routing based on actual outcomes after sufficient data exists |
| G-06 | Be safe and local-first | No unintended pushes, merges, deployments, or leakage of sensitive project content |
| G-07 | Remain easy to adopt | Work inside an existing Git repository without restructuring its application |

### 3.3 Non-goals for MVP

- Building a proprietary foundation model or a universal AI chat assistant.
- Replacing GitHub Spec Kit command semantics, artifact formats, or workflow engine.
- Replacing Claude Code, Codex, OpenCode, Cursor, VS Code, or Git.
- Native cloud hosting, multi-user SaaS, billing, and organization-level collaboration.
- Automatic production deployment, automatic merging to protected branches, or unrestricted shell access.
- Pretending tests or LLM reviews constitute a formal proof of security or correctness.
- Guaranteed token-cost accounting for providers that do not expose reliable usage data.
- Supporting every possible SDD framework in the first release.

## 4. Target Users and Jobs to Be Done

### Persona P1 — Experienced solo developer (primary)

Uses multiple AI coding agents, works on existing repositories, and wants good results with minimal babysitting. May have personal and work CLI profiles. Prioritizes speed, correctness, and autonomy without surprises.

**Job:** "When I want to implement a well-scoped feature, organize the SDD process and tell me when intervention is truly needed."

### Persona P2 — Technical lead / code reviewer

Wants proof that requirements were covered, architectural decisions followed, and regressions checked.

**Job:** "Before I approve a change, show exactly which requirements were verified, by which evidence, and which risks remain."

### Persona P3 — AI-tool power user

Uses different provider CLI profiles and API-backed OpenCode models. Wants explicit model/effort policies and performance comparisons without sacrificing security.

**Job:** "Route stages to my preferred models and accounts, then preserve the approved decisions as agents switch."

### Persona P4 — Open-source contributor (secondary)

Wants to add a new CLI adapter, framework adapter, or evidence parser with stable contracts and minimal codebase knowledge.

**Job:** "Extend SpecTide without modifying its core execution engine."

## 5. Product Principles

1. **Simple first:** One-command default; advanced controls available but hidden until needed.
2. **Evidence over claims:** AI output is opinion; executable checks and reproducible artifacts are stronger evidence.
3. **Leverage upstream:** Use official Spec Kit workflow/artifact semantics and adapters instead of forking the framework.
4. **Local by default:** Code, prompts, files, and history stay on the developer's machine unless the configured external agent provider receives them.
5. **Safe autonomy:** Automate routine reversible steps, request consent for sensitive or irreversible actions.
6. **Visible progress:** The dashboard must indicate the current task, provider/profile, checks, blockers, and next action.
7. **Resumability:** Interruptions must not erase completed work or corrupt project state.
8. **Project isolation:** A run never silently changes its project identity; no project may read, write, or inherit another project's source, prompts, or evidence without an explicitly authorized separate integration.
9. **Honest telemetry:** Label model usage as reported, estimated, or unavailable.
10. **Composable:** Prefer Git-based state, stable JSON contracts, and provider adapters.
11. **Useful without AI magic:** Simple deterministic workflow policies remain usable if adaptive routing is disabled.

## 6. Scope and Release Strategy

### 6.1 MVP / Version 0.1 — Reliable local execution with basic evidence

**Required (P0):**

- **Multi-project workspace:** register and navigate multiple repositories; All Projects overview, per-project configuration/runs/history, selected-project context and project-scoped access.
- **Concurrent multi-project monitoring:** independently run and monitor work across repositories with a configurable global concurrency limit and per-repository writer safeguards.
- Project discovery, repository validation, Spec Kit detection and setup guidance.
- CLI with `init`, `doctor`, `run`, `status`, `resume`, `cancel`, `dashboard`, `report`.
- Existing-project support; no required rewrite or app template.
- Basic workflow sequencing using supported Spec Kit commands/workflows.
- Claude Code, Codex, OpenCode adapters, with capabilities detection and gracefully degraded support.
- Multiple named local execution profiles; fixed per-stage routing; provider-supported model and effort options.
- Auto, Guided, and Custom execution modes.
- Persistent run, stage, task, event, and checkpoint history.
- Local dashboard with active run, stage list, streaming logs, stage ownership, approvals, and result summary.
- Git worktree isolation for implementation and safe project preflight.
- Deterministic test command configuration, captured outputs, and basic **EvidenceGraph v0**.
- Read-only artifact inspections and conventional Spec Kit `analyze` / `converge` support.
- Bounded retry, cancellation, pause and resume.
- Local-only access and explicit shell/secret safeguards.
- Markdown + JSON final run report.

**P0 quality bar:** A developer can register at least three different repositories, execute and monitor independent runs in at least two of them without context leakage, complete representative features in an existing Java or TypeScript repo, switch agents between at least two stages, survive an interrupted run, see linked requirement/test evidence, and make no unintended changes to the default branches.

### 6.2 Version 0.2 — High-confidence quality orchestration

**P1:**

- Stable requirement IDs and stronger requirement-to-file/test mapping.
- ContextPack with relevance-aware cross-provider handoffs.
- Independent requirement-compliance and code-quality reviewers.
- Stale artifact / specification drift detection.
- Targeted repair task creation with affected-check selection.
- Task DAG visualization and safe parallel worktree execution with conflict handling.
- Evidence confidence labels and configurable criticality-based release gate.
- Redacted trace export and optional Phoenix/OpenTelemetry integration.

### 6.3 Version 1.0 — Adaptive and extensible platform

**P2:**

- Historical outcome-based model recommendations; opt-in automatic selection.
- Model/provider quota, rate-limit, availability and policy-aware fallback.
- Side-by-side benchmark dashboard for different routing strategies.
- OpenSpec adapter through an explicit framework interface.
- Plugin hooks for more providers and evidence checkers.
- Optional team-oriented export/report sharing (without mandatory cloud accounts).

**Explicitly deferred:** Hosted collaboration, GitHub PR automation, organization policy server, one-click production deployment, browser automation, and **single coordinated features spanning multiple repositories with atomic cross-repository dependency management**. Registering many projects, switching between them, and running independent projects concurrently are **in scope for P0**.

## 7. User Experience: Three Modes

| Mode | Default target | What is automatic? | What requires the user? |
|---|---|---|---|
| **Auto (default)** | Busy solo developer | Routine stages, model policy selection, safe checks, bounded non-destructive repairs | Initial workspace trust, material requirement ambiguity, risky commands, failed release gate |
| **Guided** | Developer wanting control | Artifact generation, checks, logging, resumes | Review specification and plan; inspect substantial implementation changes |
| **Custom** | Advanced workflows | Only selected allowed actions | Explicit per-stage routing, effort, profile, budget, parallelism, approval policy |

**Important:** “Auto” does **not** mean no safety checkpoints. A user can finish an ordinary feature largely hands-free while sensitive changes pause for approval. The default shall never auto-push, auto-merge, or deploy.

### 7.1 First-run onboarding

**Target: successful setup in under five minutes on a compatible developer machine (goal, not a guarantee).**

1. Developer enters a Git repo and runs `spectide init`, or adds it from the dashboard.
2. SpecTide checks Git, installed `specify` CLI, project `.specify/`, available agent CLIs, and known test/package tools.
3. It presents a concise capability matrix: **Ready**, **Needs setup**, or **Unsupported** for each integration.
4. It asks the developer to confirm the trusted repository and choose a default agent profile.
5. It creates a small `.spectide/` project configuration and a user-local state directory; it does not overwrite an existing `.specify/` configuration.
6. It offers to initialize Spec Kit via upstream tooling only after consent, if missing.
7. `spectide doctor` explains the exact fix for each configuration issue.

### 7.2 Happy-path new feature

**Scenario:** "Add idempotent payment webhook handling."

1. Developer runs `spectide run "Add idempotent payment webhook handling"`.
2. Preflight checks branch status, repo trust, baseline test availability, and per-stage adapter readiness.
3. SpecTide starts an isolated run and presents the chosen workflow / stage routing.
4. Spec Kit generates/updates spec artifacts. An agent may request clarification if material ambiguity remains.
5. Planning, tasks, checklist, and `analyze` run in dependency order; unsolved major analysis findings block implementation or request user resolution.
6. Implementation executes in an isolated worktree on the selected adapter/profile.
7. Project-configured tests run; results, changes, and requirement associations are collected.
8. `converge` checks remaining specification gaps; bounded repair loops address eligible findings.
9. SpecTide produces a result: **Verified**, **Partially verified**, **Failed**, or **Needs review**, together with exactly why.
10. User inspects diffs and chooses to keep the branch, export a patch/report, or perform an explicit Git action separately.

### 7.3 Cross-profile handoff

Developer configures Claude profile `claude-work` for specify/plan, Codex profile `codex-default` for implementation, and `claude-personal` for review. SpecTide gives each stage the approved artifacts and a compact ContextPack, starts the respective installed CLI using its supported configuration mechanism, and records which profile and model were used without storing credentials.

### 7.4 Interrupted run

When the process crashes, the user closes the laptop, or the provider hits a limit: run state remains durable. After restart, `spectide resume <run-id>` offers the last valid checkpoint and a brief explanation. Completed stages are not rerun unless upstream inputs changed and invalidated them.

### 7.5 Existing project / brownfield case

When `.specify/` and existing feature specs already exist, SpecTide indexes without overwriting. It may attach a run to an existing feature or start a new one. All changes stay within a run branch/worktree. It must preserve existing tests, architecture conventions, and project scripts.

### 7.6 Multi-project workspace (P0)

**Scenario:** The developer has three separate local repositories (for example, a rental marketplace, family budgeting app, and engineering tool) and wants to develop them without losing context.

1. User registers each repository once via `spectide projects add /absolute/path` or the **Add Project** dashboard action. Git root, canonical path, trust, supported tooling and default branch are recorded.
2. The dashboard opens on **All Projects**, showing each project name, ready/attention state, active runs, most recent result and a shortcut to start a new run.
3. Selecting a project changes the visible project scope across Runs, Tasks and Evidence, while an **All Projects** toggle enables the global view.
4. **New Run** always displays the target project name, canonical path and branch before execution. When invoked within a registered repository, CLI resolves that repository; outside one, it requires an explicit `--project` or deliberate selection when more than one exists. It never guesses based on recency.
5. Runs for distinct projects may proceed concurrently, subject to configured capacity and provider limits. Each run gets an independent worktree, persistent state, log stream, approval scope and requirement namespace.
6. A pending approval in project A appears in the global inbox but cannot authorize anything in project B. Resume/cancel operations always show and enforce the run's immutable project ID.
7. A user can archive a project from the dashboard without deleting its Git repository. Archive hides it from the default selector and blocks new runs, but preserves its historical reports. Unregister is a separately confirmed, nondestructive action.

**Default behavior:** At most one mutating implementation run per project at a time; other same-project runs queue by default. Independent projects may run concurrently up to a conservative global limit (initial suggested default: **two**). These values are configurable and must respect machine/provider capabilities. The dashboard can show queued, paused and active work even when no agents are free.

**Explicitly not MVP:** A single feature transaction that edits two repositories simultaneously, automatically changes shared packages across repositories, or attempts atomic multi-repository merges.

## 8. Core Workflow and SDD Semantics

### 8.1 Stage lifecycle

**Default full feature workflow:**

```text
Request / preflight
    -> constitution check (create only if absent/approved)
    -> specify
    -> clarify (when meaningful ambiguity exists)
    -> plan
    -> checklist (when appropriate)
    -> tasks
    -> analyze (read-only consistency review)
    -> implement
    -> project tests + verification
    -> converge
    -> [bounded implement / verify / converge repair loop]
    -> EvidenceGraph final assessment
    -> review + report
```

**Critical compatibility rule:** Actual agentic command invocation syntax is provider dependent; slash command names are conceptual. SpecTide must use the installed Spec Kit version's supported workflow/agent interfaces. It must not assume one slash-command syntax works across every CLI. The official Spec Kit YAML workflow engine shall be preferred for workflows it can express safely. SpecTide may coordinate at stage boundaries for cross-provider routing, evidence collection, and UI state where upstream workflow capabilities are insufficient. No parallel, competing implementation of the full SDD language.

### 8.2 Workflow templates

- **Feature — Full SDD:** all stages, validations, evidence, final report.
- **Feature — Fast:** smaller bounded change; reduced optional review, never skips required tests or safety.
- **Bug fix — Scoped:** assessment/reproduction, minimal patch, regression verification, report; supports official bug-fix extension if installed, with clear fallback.
- **Review only:** inspect an existing branch/spec and produce evidence/gaps without modifying implementation.
- **Continue existing feature:** pick an existing spec feature and resume from valid artifacts and checkpoints.

### 8.3 Stage status

`PENDING`, `READY`, `RUNNING`, `WAITING_APPROVAL`, `WAITING_INPUT`, `BLOCKED`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `SKIPPED`, `STALE`.

A stage reaches `SUCCEEDED` only after its command and configured postconditions succeed; a successful CLI exit alone does not suffice if required artifacts are missing.

### 8.4 Execution status

`CREATED`, `PREFLIGHT`, `RUNNING`, `PAUSED`, `WAITING_APPROVAL`, `REPAIRING`, `VERIFYING`, `COMPLETED_VERIFIED`, `COMPLETED_PARTIAL`, `FAILED`, `CANCELLED`.

Distinguish **execution success** (process ran) from **requirement verification** (claims backed by evidence).

## 9. Detailed Functional Requirements

All requirement IDs are stable within this PRD. Each must be carried into downstream specifications, tasks, tests, and release checks.

### Epic A — Project setup and discovery

**FR-001 (P0):** Discover project root and Git status, validate absolute/canonical paths, reject untrusted or missing repositories with actionable errors.  
**Accept:** Running from a nested folder identifies correct root; symlink/path traversal cannot escape authorized workspace.

**FR-002 (P0):** Detect `.specify/`, version of available Spec Kit tools, workflow compatibility, and existing feature artifact directories without destructive rewrites.  
**Accept:** Existing project with multiple specs opens unchanged and lists all recognized features.

**FR-003 (P0):** `doctor` checks every configured adapter, executable path, version, authentication *availability* (without reading secrets), and test command.  
**Accept:** Missing prerequisite produces exact actionable correction; unsupported flags are not passed blindly.

**FR-004 (P0):** Maintain project config independently of user-local run database and credentials.  
**Accept:** Project config can be committed without embedding machine-specific secrets; local DB/logs are Git-ignored.

### Epic B — Unified execution and modes

**FR-005 (P0):** One-command new run and one-click equivalent from dashboard; choose project, request, workflow template and mode.  
**Accept:** A developer can initiate a valid run without editing YAML.

**FR-006 (P0):** Persist every stage transition, invocation outcome, checkpoint, version/commit fingerprint, and approval event.  
**Accept:** Kill and relaunch the app, then safely resume from the previous checkpoint.

**FR-007 (P0):** Auto/Guided/Custom modes apply documented defaults; users can preview and override available policies before execution.  
**Accept:** Dashboard visibly shows who/what will execute each stage and which approvals are enforced.

**FR-008 (P0):** Implement pause, resume, cancel, and cancel-confirmation for active runs, including child-process cleanup and cancellation propagation.  
**Accept:** Cancel does not leave untracked active agent processes or automatically delete user changes.

**FR-009 (P0):** Per-run logs and structured events stream to dashboard via localhost; reconnect can replay missing events from durable storage.  
**Accept:** Reloading browser restores current state and prior event history without duplication.

**FR-010 (P0):** On stale input artifacts, refuse blind reuse and display which downstream stages require re-execution.  
**Accept:** Editing spec after plan invalidates plan/tasks/analysis deterministically.

### Epic C — Agent and model profiles

**FR-011 (P0):** Provide adapters for Claude Code, Codex, and OpenCode using each tool's supported noninteractive/programmatic interface.  
**Accept:** Capability tests confirm process launch, structured output parsing, exit handling, timeouts, cancellation, working directory, and error classification for each supported version.

**FR-012 (P0):** Support multiple named profiles, including two profiles of the same CLI, with configurable provider-specific startup methods; never impersonate or bypass provider authentication.  
**Accept:** `claude-work` and `claude-personal` can use distinct supported profiles without overwriting one another's configuration.

**FR-013 (P0):** Map stage to profile, model, and effort where the provider supports it; unavailable settings degrade explicitly or block with explanation per policy.  
**Accept:** A requested unsupported effort is never silently claimed as applied.

**FR-014 (P0):** Track usage metrics as `reported`, `estimated`, or `unavailable`; distinguish subscription CLI runs from billed API calls.  
**Accept:** UI does not show invented spend; dollar estimates must include their source and assumptions.

**FR-015 (P1):** Capability-aware and policy-aware fallback if a provider is rate-limited, unavailable, or context constrained.  
**Accept:** Fallback requires a compatible configured profile, preserves approved context, and records the exact reason for routing change.

### Epic D — Context preservation

**FR-016 (P0):** Create a small deterministic handoff manifest listing current requirement/task IDs, approved decisions, referenced artifact paths, repo commit hash, and risk flags.  
**Accept:** A new provider receives the same agreed feature scope and relevant decisions without requiring previous chat transcripts.

**FR-017 (P1):** Create versioned **ContextPack** with relevance-ranked code references, summaries, assumptions, dependency map, decisions, and explicit token budget.  
**Accept:** Switching provider produces a well-formed pack with provenance; packs are re-generated when source fingerprints change.

**FR-018 (P1):** Optional read-only Archon/repository intelligence adapter through an explicit interface; never a hard dependency.  
**Accept:** SpecTide functions fully when Archon is absent.

### Epic E — EvidenceGraph and verification

**FR-019 (P0):** Extract requirement IDs and acceptance scenarios from supported Spec Kit spec artifacts; maintain stable internal IDs where absent.  
**Accept:** Every testable requirement appears in evidence report, including uncovered ones.

**FR-020 (P0):** Capture changed file/commit references and configured test executions (command, exit status, timestamp, sanitized stdout/stderr, artifact paths, execution hash).  
**Accept:** Evidence can be traced to a specific run/worktree revision and is not recycled from unrelated revisions.

**FR-021 (P0):** Link requirements to tasks, changed files, test cases, and evidence with explicit source labels: `explicit`, `inferred`, or `unlinked`.  
**Accept:** AI-proposed mappings are presented as inferred until supported or approved; users can correct links.

**FR-022 (P0):** Compute requirement status as `VERIFIED`, `PARTIAL`, `UNVERIFIED`, `FAILED`, or `NOT_APPLICABLE`, separate from implementation task status.  
**Accept:** Missing tests do not become `VERIFIED` because a reviewer says "done".

**FR-023 (P0):** Produce a final Markdown and machine-readable JSON report with requirement matrix, executed checks, unresolved gaps, changed files, stage history, agents, and usage transparency.  
**Accept:** Report clearly flags high-risk unverified scenarios; links resolve within project or exported bundle.

**FR-024 (P1):** Detect likely specification drift between changed code, spec, design and tasks; invalidate affected evidence if tests are stale.  
**Accept:** Material edits after a passing test trigger a new validation requirement before `VERIFIED` status is restored.

**FR-025 (P1):** Independent requirement-compliance and code-quality reviews; distinguish their subjective findings from executable evidence.  
**Accept:** Reviews include severity, reasoning, source locations, and acknowledged false-positive handling.

**FR-026 (P1):** Support risk-tiered verification policies, e.g. money movement demands concurrency/idempotency tests.  
**Accept:** A specified critical required check missing or failing blocks automatic verified completion.

### Epic F — Recovery and concurrency

**FR-027 (P0):** Bounded retries with error categories (`rate_limit`, `timeout`, `auth`, `invalid_artifact`, `test_failure`, `tool_failure`, `conflict`, `permission`).  
**Accept:** Never repeat the same failed action indefinitely; human-readable blocker is shown.

**FR-028 (P0):** Checkpoint against clean Git references; preserve modifications in dedicated worktree/branch, not destructive rollback.  
**Accept:** A failed run leaves reviewable code and an explicit clean-up choice.

**FR-029 (P1):** Generate repair plans scoped to failed requirements/tests; rerun relevant checks plus impacted regressions.  
**Accept:** Repair plan lists exact failures, affected files, approved scope, and exit criteria before execution.

**FR-030 (P1):** Execute independent tasks in separate worktrees only after dependency and file overlap analysis; merge/rebase conflicts stop for review.  
**Accept:** No two simultaneous writers modify the same worktree; conflict resolution is never silently accepted.

### Epic G — Reporting, navigation and extensibility

**FR-031 (P0):** Dashboard shows project list, run timeline, current stage, associated agent profile/model, logs, approvals, checks, evidence matrix and final summary.  
**Accept:** User can determine current stage, blocker, and next action without opening terminal logs.

**FR-032 (P0):** Expose human-readable report and JSON export; avoid mandatory login or remote account.  
**Accept:** Export works offline and redacts configured secrets.

**FR-033 (P1):** Provide stable adapter hooks for providers, evidence extractors, and workflow templates.  
**Accept:** A sample third-party adapter can be added without editing core run-state logic.

**FR-034 (P2):** Recommend routing policies based on measured comparable outcomes with confidence and sample size, opt-in only.  
**Accept:** Low sample size produces "insufficient data" rather than fabricated superiority.

**FR-035 (P2):** Add OpenSpec adapter preserving OpenSpec change/spec/delta semantics; no lossy forced conversion to Spec Kit.  
**Accept:** OpenSpec change can be inspected and verified without rewriting original source artifacts.

---
### Epic H — Multi-project workspace and isolation (P0)

**FR-036 (P0):** Register, rename (display name only), archive, restore, and unregister any number of independent local Git repositories, enforcing canonical-path identity and explicit trust.  
**Accept:** Three repos appear independently in the project registry; a second path/alias to the same canonical Git root cannot create an accidental duplicate.

**FR-037 (P0):** Provide **All Projects** as the default dashboard landing page, with search/filter, status, last run, active/queued run count, verification summary, and **Add Project** / **New Run** actions.  
**Accept:** With three projects present, the global view displays all three accurately and selecting one scopes the detail pages without a full app reconfiguration.

**FR-038 (P0):** Keep all runs, tasks, events, checkpoints, reports, requirements, review decisions and EvidenceGraph links scoped by immutable `project_id` and `run_id`.  
**Accept:** API queries, exports and UI routes cannot return another project's private contents through a mismatched or forged `project_id` / `run_id` pair.

**FR-039 (P0):** Support project-specific configuration and test commands with global defaults and optional explicit run overrides; apply least-permissive allowed provider and safety policies.  
**Accept:** A strict project's cloud-provider restrictions cannot be bypassed by switching from a permissive project or reusing a global profile.

**FR-040 (P0):** Support independent simultaneous runs across distinct projects, with a bounded global scheduler and per-project write policy.  
**Accept:** While project A's run is active, a separate project B can execute within capacity; an excess run queues, and two same-project writers do not collide by default.

**FR-041 (P0):** Resolve target repository explicitly on every mutating CLI and API operation. Require `--project <id|path|unique-alias>` or an unambiguous current directory context; show target in approval and destructive-action confirmation.  
**Accept:** When launched from outside a registered repository with multiple projects, `spectide run` does not silently select the most recently used project.

**FR-042 (P0):** Provide global activity and approvals inbox with reliable project labels and deep links to isolated run detail; never reuse approval tokens across project contexts.  
**Accept:** An approval for a shell command in project A cannot be replayed or reinterpreted against B.

**FR-043 (P0):** Handle repo movement/removal safely: mark path missing, offer explicit relink after canonical path and Git identity validation, and keep historical reports accessible.  
**Accept:** Moving project A does not silently change it to a different repository occupying A's old path.

**FR-044 (P0):** Preserve project identities, active runs and histories across service restarts and schema migrations, including multiple simultaneous run event streams.  
**Accept:** Restart with projects A/B running maintains correct ownership and resumes each only from its own valid checkpoint.

**FR-045 (P0):** Offer per-project aggregate metrics plus a global rollup computed from scoped results (not guessed from model claims); show failures and incomplete evidence separately.  
**Accept:** Project summaries and global totals reconcile with their contributing runs; no cross-project requirement ID collisions.

## 10. Non-Functional Requirements and Quality Attributes

| ID | Priority | Requirement | Acceptance measurement |
|---|---|---|---|
| NFR-001 | P0 | **Local-first operation.** Core CLI, dashboard, history, reporting and deterministic verification work without a SpecTide account or hosted backend. | Disable outbound networking other than already-configured model provider access; local capabilities remain functional. |
| NFR-002 | P0 | **Startup responsiveness.** `spectide status` and dashboard navigation must stay responsive even during a large agent run. | For reference projects up to 100,000 files, target CLI status <2 seconds after database warm-up and dashboard first meaningful view <3 seconds on a modern laptop; record deviations. |
| NFR-003 | P0 | **Reliable persistence.** Stage transitions, approvals and evidence are transactional and survive process interruption. | Fault injection after every persistence boundary produces no duplicate completed stage, missing approval, or fabricated verification. |
| NFR-004 | P0 | **Data minimization.** SpecTide stores metadata and bounded sanitized logs by default, not complete agent conversations or unredacted shell environment. | Default settings retain no API keys, tokens, full `.env` files or browser session data; sensitive fixtures are excluded from exports. |
| NFR-005 | P0 | **Accessible UI.** Keyboard navigable; labels, focus states, and non-color-only statuses. | Core flows tested to WCAG 2.2 AA-oriented criteria; no essential action requires pointer-only use. |
| NFR-006 | P0 | **Cross-platform.** macOS is the launch platform; Linux follows; Windows supported via WSL initially. | CI smoke tests for macOS and Linux; WSL installation documented and tested before advertised support. |
| NFR-007 | P0 | **Process containment.** All spawned child processes are associated with a run and managed on cancel/crash. | Cancellation terminates known process groups with graceful deadline and forced termination fallback; orphan detector reports exceptions. |
| NFR-008 | P0 | **Bounded storage.** Local artifacts and logs have configurable retention and size limits, but do not discard required evidence silently. | Storage quota warning, export option, retention preview and explicit user-consented purge; no silent deletion of user code. |
| NFR-009 | P0 | **Compatibility transparency.** Adapters declare supported CLI versions and capabilities; compatibility is verified at runtime. | Unsupported model/effort/JSON option produces an actionable failure or labeled downgrade per policy. |
| NFR-010 | P0 | **Deterministic safety decisions.** Network/command/write policies do not depend exclusively on an LLM. | Policy test suite covers dangerous commands, symlink escape, shell injection patterns, workspace allowlists and escalation paths. |
| NFR-011 | P1 | **Extensibility.** Providers, workflow packs and evidence readers use versioned contracts. | Third-party sample plugin runs without forking the core orchestrator. |
| NFR-012 | P1 | **Observability.** Every run and event has correlated IDs; optional trace export never leaks data by default. | Operator can trace any blocked run to an exact stage, invocation, and sanitized failure category. |
| NFR-013 | P1 | **Evidence freshness.** Verification is valid only for its captured inputs and code revision. | Any material code or required test config change marks associated evidence stale until revalidated. |
| NFR-014 | P2 | **Performance optimization.** Smart routing recommendations must not reduce required verification quality. | Controlled benchmarks measure equal policy gates, repeated runs and confidence intervals. |

| NFR-015 | P0 | **Cross-project isolation and scheduling.** All mutating actions use project-scoped authorization and bounded resources. | Run adversarial project-ID mismatch, duplicate repo, concurrent process restart and approval replay tests across three repositories; no cross-project reads/writes, state collision, or unlimited simultaneous workers. |

**Performance targets are engineering targets, not guaranteed product claims.** The MVP shall instrument actual measurements and publish benchmark conditions.

---

## 11. System Architecture

### 11.1 Architectural approach

Use a **modular monolith** with a persistent local service, one executable CLI and a browser dashboard. Avoid distributed services or cloud dependencies in the first version. The local service is the source of truth for SpecTide run metadata; Spec Kit remains authoritative for its own specs and workflow execution state.

```text
                         User
                     CLI / Browser
                           |
              +------------v-------------+
              | SpecTide Local Service   |
              | REST + SSE / localhost   |
              +------------+-------------+
                           |
        +------------------+------------------+
        |                  |                  |
  Project/Policy      Run Coordinator    Evidence Engine
        |                  |                  |
  Git/Worktrees    Spec Kit Bridge      Test/Check Parsers
        |                  |                  |
        |        +---------+---------+        |
        |        |         |         |        |
        |    Claude     Codex     OpenCode   |
        |    Adapter    Adapter   Adapter    |
        +------------------+------------------+
                           |
                  SQLite + artifact store
                           |
              Optional Archon / Phoenix
```

### 11.2 Modules and responsibilities

| Module | Responsibility | Explicitly does not own |
|---|---|---|
| `cli` | Argument parsing, human-readable status, startup/discovery, single command UX | Agent business logic |
| `desktop-web` | Local UI, routing setup, approval, logs, requirements and reports | Direct privileged process launches from browser |
| `local-api` | Authenticated localhost APIs, SSE, process lifecycle and input validation | External SaaS account system |
| `project-manager` | Repo trust, `.specify/` detection, feature selection, worktree lifecycle, change manifest | Git remote changes without user request |
| `workflow-bridge` | Official Spec Kit invocation, workflow status, checkpoints, feature binding and output interpretation | Reimplementing Spec Kit YAML evaluation |
| `run-coordinator` | Cross-agent stage boundaries, mode policies, state transitions, retries, approvals and repair orchestration | Acting as a generic LLM agent |
| `agent-adapters` | Provider-specific CLI launch, options, authentication-mode detection, streaming normalization, cancellation | Credential theft, account switching through unsupported mechanisms |
| `context-service` | Handoff manifest, later ContextPack and optional code retrieval | Persistent duplicate repository index for MVP |
| `verification-service` | Safe test execution, deterministic evidence parsing, evidence freshness and status derivation | Treating LLM reviewer opinion as proof |
| `storage` | SQLite transactions, artifact store, retention and migrations | Committing run databases into project Git |
| `telemetry` | Local usage reporting, optional redacted export | Mandatory telemetry collection |

### 11.3 Workflow-engine ownership and integration strategy

1. **Use upstream native workflows** through `specify workflow run`, `status`, and `resume` when the target Spec Kit version provides necessary execution and introspection capabilities.
2. **Prefer YAML overlays and slots** to inject project-specific checks; retain provenance and validate installed step packages before use.
3. **Per-step agent routing** is allowed only when validated against installed upstream integration support, including its `model`, `integration`, `integration_args`, and `integration_options` semantics.
4. **Cross-profile boundary:** if an upstream adapter cannot safely select a separate same-provider profile per step, SpecTide must split orchestration at an approved checkpoint using independent invocations. It must not pretend an unsupported profile transition occurred.
5. **Single authority per execution step:** each step is owned by either the native engine or the SpecTide boundary coordinator, never both. Persist the upstream workflow/run ID and step ID alongside SpecTide IDs.
6. SpecTide must not modify upstream `state.json` to force transitions. Use supported CLI resume operations; if insufficient, mark capability unsupported.
7. **Feature selection:** Spec Kit identifies the active feature through `.specify/feature.json` or supported environment configuration rather than Git branch alone. SpecTide must explicitly bind feature context per run/worktree and validate before invoking a command.
8. Upstream shell steps and custom step packages run local code with user privileges. They are **not sandboxed by default**. SpecTide must review/block untrusted workflows and prevent uncontrolled interpolation of prompts/agent output into shell command strings.
9. Upstream captured output may be persisted unredacted under `.specify/workflows/runs/`. For the MVP, disable captured-output features for sensitive commands, restrict local run directory access, warn users about upstream retention and never promise automatic redaction of upstream-owned files.

**Implementation decision:** Start with a compatibility matrix and a small proof of concept against pinned versions of the official workflow engine. Do not build the rest of the product around undocumented internals.

### 11.4 Suggested stack

- **Language:** TypeScript, Node.js LTS; shared types between CLI, local service and UI.
- **Monorepo:** `pnpm` workspaces, optionally Turborepo for build/test caching.
- **CLI:** Commander or equivalent, with structured JSON output mode.
- **Local backend:** Fastify or Hono; REST for commands, SSE for replayable execution events.
- **Dashboard:** React + Next.js or Vite React. Prefer Vite if simpler local installation; this is an implementation choice, not a product requirement.
- **Persistent store:** SQLite with WAL, transactions and explicit schema migrations.
- **Runtime schemas:** Zod or JSON Schema.
- **Execution:** Node child process APIs with argument arrays, not shell string interpolation.
- **Repo isolation:** Git worktrees; auto-generated run branch names.
- **Event transport:** SSE with `Last-Event-ID` resume and database-backed event IDs.
- **Visualization:** React Flow in the later dependency DAG view; a simple step list is sufficient for MVP.
- **Telemetry:** Local metrics; optional OpenTelemetry/Arize Phoenix in P1.
- **Release:** npm package CLI; browser UI served on loopback; possible packaged binary after product fit.

### 11.5 Suggested monorepo layout

```text
spectide/
  apps/
    cli/
    local-api/
    dashboard/
  packages/
    contracts/                # JSON Schema, events, shared types
    core/                     # run coordinator, policy and state machine
    project/                  # Git, worktrees, feature discovery
    speckit-bridge/           # upstream CLI integration
    agents/
      common/
      claude/
      codex/
      opencode/
    context/                  # deterministic manifest and ContextPack
    evidence/                 # test adapters, relationships, gate evaluation
    storage/                  # SQLite adapters/migrations
    workflows/                # official-compatible templates and overlays
  tests/
    fixtures/java-spring/
    fixtures/ts-node/
    fixtures/broken-repo/
    fixtures/unsafe-workflow/
    e2e/
  docs/
    architecture/
    contributing/
    compatibility/
```

### 11.6 Runtime isolation

- Each run receives a generated ID, a new branch (`spectide/<slug>-<short-id>`) and a dedicated worktree under a user-approved directory.
- By default, only one active mutating run per feature/worktree is allowed; multiple read-only runs may be allowed.
- Preserve user-uncommitted changes in the original checkout; do not `git stash`, reset, or clean without consent.
- A dirty original checkout defaults to **separate worktree from an explicitly selected base commit**, with a preview of excluded uncommitted changes. If the task depends on dirty changes, require the user to commit or explicitly import them into the isolated run.
- Changes made by agents must remain inside authorized workspace paths. Review dependent tools' sandbox settings, but do not treat a worktree as a security sandbox by itself.
- Run termination and clean-up must not remove branches, worktrees or files before explicit review/confirmation.

---

## 12. Data Model and Persistence

### 12.1 Logical entities

| Entity | Required fields | Purpose |
|---|---|---|
| `Project` | `project_id`, `root_realpath`, `git_identity_fingerprint`, `display_name`, `unique_alias`, `trust_state`, `registry_state`, `config_version`, `created_at` | A registered repository; identity is stable even if path is temporarily unavailable |
| `ProjectPreference` | `project_id`, `default_profile_id?`, `default_mode`, `concurrency_limit`, `last_selected_at` | Scoped UI/user defaults that must not loosen security policies |
| `Feature` | `feature_id`, `project_id`, `framework`, `feature_path`, `spec_fingerprint` | Stable connection to source SDD artifacts |
| `Run` | `run_id`, `project_id`, `feature_id`, `template`, `mode`, `status`, `base_commit`, `worktree_path`, `started_at`, `ended_at` | One attempted delivery process |
| `StageExecution` | `stage_execution_id`, `run_id`, `stage_key`, `attempt`, `status`, `upstream_run_id`, `upstream_step_id`, `input_hash`, `output_hash` | Immutable attempt history of one stage |
| `AgentProfile` | `profile_id`, `provider`, `display_name`, `execution_method`, `capabilities`, `settings_ref` | User-local routing configuration, no secret material |
| `Invocation` | `invocation_id`, `stage_execution_id`, `profile_id`, `model_requested`, `model_actual`, `effort_requested`, `effort_actual`, `exit_code`, `session_id` | Real invocation facts |
| `Decision` | `decision_id`, `run_id`, `scope`, `summary`, `approved_by`, `approved_at`, `source_hash` | Approved material architecture/requirements decisions |
| `Approval` | `approval_id`, `run_id`, `type`, `risk`, `requested_action_digest`, `status`, `decided_at` | Explicit authorization record |
| `Requirement` | `requirement_id`, `feature_id`, `text`, `source_path`, `source_span`, `risk_tier`, `artifact_hash` | Specific testable product requirement |
| `Task` | `task_id`, `feature_id`, `source_path`, `status`, `dependencies`, `artifact_hash` | SDD execution task |
| `Evidence` | `evidence_id`, `run_id`, `kind`, `source`, `artifact_path`, `result`, `code_revision`, `input_fingerprint`, `observed_at` | Audit record of a verification assertion |
| `EvidenceLink` | `requirement_id`, `task_id?`, `evidence_id?`, `file_path?`, `link_type`, `confidence`, `provenance` | Typed graph edge; explicit versus inferred |
| `RunEvent` | `event_id`, `run_id`, `occurred_at`, `kind`, `payload_redacted` | Ordered event replay |
| `Checkpoint` | `checkpoint_id`, `run_id`, `stage_execution_id`, `spec_hash`, `plan_hash`, `tasks_hash`, `git_commit`, `upstream_state_ref` | Resume and invalidation boundary |
| `UsageSample` | `invocation_id`, `metric`, `value`, `unit`, `quality`, `source` | Accurate token/time/cost statistics |

**Multi-project keys and invariants:** `project_id` is an immutable opaque UUID/ULID created on initial registration, **not** derived from the repository name, branch, remote URL or directory basename. Uniqueness is enforced for the current canonical Git root and any configured unique alias. Paths may change only through an explicit verified relink operation; a replaced repository at the same path is treated as untrusted. `Run.project_id` is immutable, all project-owned entities must resolve to it through foreign keys and authorization checks, and requirement identifiers are stored as `(project_id, feature_id, requirement_id)` or equivalent globally unique compound keys. `project_id` is present in all run events and exports. A database transaction ensures registry operations and run ownership updates cannot partially commit. App-level project filters are not a substitute for storage/service-level scoping.

Where source artifacts lack stable IDs, SpecTide generates namespaced surrogate IDs in its own index and keeps a source fingerprint and span. It must **not rewrite user specs solely to create internal identifiers** without opt-in.

### 12.2 EvidenceGraph semantics

**Nodes:** `Requirement`, `AcceptanceScenario`, `Task`, `CodeArtifact`, `TestCase`, `CheckExecution`, `ReviewerFinding`, `Decision`, `Risk`.

**Edges:** `decomposed_into`, `implemented_by`, `covered_by`, `executed_in`, `validated_by`, `depends_on`, `contradicts`, `invalidated_by`.

Each edge carries:

```json
{
  "edge_id": "edge_001",
  "source_id": "REQ-004",
  "target_id": "check_982",
  "relationship": "validated_by",
  "provenance": "explicit",
  "confidence": null,
  "source_location": "specs/001-payments/spec.md#L42",
  "freshness": "current"
}
```

`provenance` is one of `explicit`, `inferred`, or `manual`; an inferred LLM edge may carry a model-generated confidence estimate, which is **not a calibrated probability**. The UI must visibly differentiate those types.

### 12.3 Verification decision rules

- **VERIFIED:** all configured mandatory checks for a requirement passed against the current code/test/config fingerprint; required links are explicit or human-confirmed; there is no open critical contradiction. Where the required check set is absent, status cannot be VERIFIED.
- **PARTIAL:** at least one relevant check passed but some required checks or coverage are missing.
- **UNVERIFIED:** no relevant accepted runtime or review evidence; implementation claims alone do not count.
- **FAILED:** at least one mandatory current check failed or a confirmed critical requirement violation exists.
- **NOT_APPLICABLE:** an approved exclusion with rationale and approver; never assigned automatically by a model.
- **STALE evidence:** a property of an evidence item after relevant input revision, not a substitute for requirement status. A requirement relying solely on stale evidence becomes UNVERIFIED/PARTIAL.

A requirement may legitimately need manual verification (e.g. user experience). Manual review evidence is supported but labeled `manual` with a named reviewer and rationale. Security correctness is not inferred from general test success.

### 12.4 Local file placement and ownership

```text
<repo>/.spectide/config.yml             # Safe, versionable project policy
<repo>/.specify/...                     # Owned by upstream Spec Kit
<user-data>/spectide/state.sqlite       # Multi-project registry and user-private run state
<user-data>/spectide/runs/<project-id>/<run-id>/ # Reports and sanitized logs, partitioned by owner
<user-data>/spectide/worktrees/<project-id>/<run-id>/ # Isolated checkout (configurable)
```

`<user-data>` resolves to a platform-appropriate private app-data path; precise values are documented per OS. When a user chooses to retain worktrees inside the repository parent, their location should not automatically pollute Git status. Never commit local run databases, account names, or provider transcripts by default.

### 12.5 Migration, corruption and retention

- Schema migrations are versioned and reversible where feasible; before destructive migrations make a local backup with user-visible path.
- Database startup includes integrity checks and a safe read-only recovery state if corruption is detected.
- Default retention: keep reports and approval records indefinitely until user cleanup; prune verbose sanitized logs after 30 days or storage budget limit **only with explicit configurable policy**; preserve evidence referenced by a retained report.
- Exports use an explicit data inventory showing whether source paths, prompts, command text, model metadata and developer identity are included.
- No automatic cloud sync.

---

## 13. Agent Adaptation, Routing and Context Handoffs

### 13.1 Normalized adapter contract (proposed)

```typescript
interface AgentCapabilities {
  provider: 'claude' | 'codex' | 'opencode' | string;
  cliVersion: string;
  supportsStreaming: boolean;
  supportsSessionResume: boolean;
  supportsModelSelection: boolean;
  supportsEffortSelection: boolean;
  supportsSafeProfileIsolation: boolean;
  supportedAuthModes: string[];
}

interface AgentAdapter {
  detect(): Promise<AgentCapabilities>;
  prepare(request: AgentRequest): Promise<ValidatedInvocation>;
  execute(invocation: ValidatedInvocation, sink: EventSink): Promise<AgentResult>;
  cancel(invocationId: string): Promise<void>;
  resume?(request: ResumeRequest, sink: EventSink): Promise<AgentResult>;
}
```

`ValidatedInvocation` must use an executable path plus **argument array**, a restricted environment allowlist, an authorized `cwd` and per-command timeout. It must not concatenate arbitrary user prompts into a shell executable string.

### 13.2 Initial provider integration guidance

| Provider | First supported integration surface | Important constraints |
|---|---|---|
| Claude Code | Noninteractive `claude -p` with version-verified JSON/stream JSON support | Respect supported permissions, model flags and session behavior; effort/profile methods must be capability-probed; no bypass-permissions defaults |
| Codex | Stable `codex exec` and JSON event mode; app-server optional/experimental | Sandboxing and approval flags must be validated; app-server protocol not a hard MVP requirement |
| OpenCode | `opencode run` with supported model/variant and JSON events | Model IDs depend on configured provider; token usage/cost may be missing; never silently auto-approve |

CLI interfaces and availability change. **Pin and test a known compatible matrix** while allowing graceful degradation when a newer version changes an option. Do not bake presumed future model aliases into the PRD.

### 13.3 Profile handling

A profile is a local **execution policy reference**, not an authentication secret. It may name a supported CLI configuration directory, safe environment variable allowlist, executable/channel, model and default effort. Profiles may reuse the same provider independently only if the provider's documented configuration/session isolation is sufficient; otherwise warn, decline conflicting execution, or request user-driven profile selection.

Example: `claude-work` can be used for specification while `claude-personal` is used for implementation or review **only when both are explicitly configured through supported isolation**. The product cannot guarantee distinct subscription balances, authenticate two accounts on behalf of the user, or work around provider terms or limits.

### 13.4 Routing precedence

1. Global safety and workspace restrictions (cannot be overridden by routing).
2. Explicit per-run user selection.
3. Project-pinned profile policy.
4. Local user's default routing policy.
5. Auto router with documented compatible fallback.

Never silently increase spending, downgrade required capabilities, use an unapproved external provider for proprietary code, or switch between personal/work accounts.

**MVP routing modes:** `fixed`, `first-compatible`, and `manual-on-failure`. Historical automatic routing is P2, not a promised MVP capability.

### 13.5 Handoff manifest (P0)

A deterministic manifest is created at every provider boundary:

```json
{
  "schema_version": "1.0",
  "run_id": "run_20261025_abcd",
  "feature_id": "feature_payments_001",
  "source_commit": "<git-sha>",
  "stage": "implement",
  "approved_decisions": ["DEC-001", "DEC-003"],
  "requirements": ["REQ-001", "REQ-004"],
  "pending_tasks": ["T-003", "T-004"],
  "artifact_paths": ["specs/001-payments/spec.md", "specs/001-payments/plan.md"],
  "risk_flags": ["financial-transaction", "concurrency"],
  "content_sha256": "<computed-hash>"
}
```

The consumer receives an explicit task, approved artifacts and a small index of relevant files. Include **file references, not a dump of all repository source**. If important inputs exceed the provider context limit, checkpoint and request scope reduction, or use a relevance-ranked ContextPack in P1.

### 13.6 ContextPack (P1)

P1 extends handoff with bounded source excerpts, repository map, related tests, architectural constraints, known failures, decisions and provenance. The router records a maximum input budget and an inclusion reason for each item. Inputs must be regenerated when source hashes change. Optional Archon integration may supply relevance search, but all functionality must work without it.

### 13.7 Usage, quotas and fallback

- Record elapsed duration, turn counts (if exposed), input/output tokens (if exposed), provider-reported usage and known monetary cost only when sourced.
- Present separate dimensions for **provider usage**, **API billing estimates**, and **subscription eligibility/limits**. An aggregate monetary figure is omitted if a reliable basis is unavailable.
- On rate limit, stop or select another already approved compatible profile according to policy; show reason and preserve the ContextPack.
- On context exhaustion, avoid endless summarization loops: run an explicit compaction checkpoint once, then pause for manual scope action if still blocked.
- On auth/configuration errors, **do not retry automatically** with another personal/work account.

---
## 14. Local Dashboard, CLI and UX Specifications

### 14.1 Design objective

**A developer must be able to answer, within five seconds of opening a run:**

1. What is SpecTide doing right now?
2. Which agent/profile is doing it?
3. Is my input required?
4. Which requirements are already verified, and what remains unverified?
5. How can I safely stop, resume or inspect the changes?

Avoid an intimidating enterprise dashboard. The default navigation should have four items: **All Projects**, **Runs**, **Evidence**, **Settings**. The current project filter lives in a visible persistent header selector (`All Projects` or a registered project); creating a run always shows the selected repository. Advanced graphs, token analysis and per-step policy editing live behind progressive disclosure.

### 14.2 Project landing page

```text
+---------------------------------------------------------------------+
| SpecTide                                      [New Run] [Settings]   |
+---------------------------------------------------------------------+
| NusaRide / main                         Project: Ready  | Doctor OK |
| Current feature: Payment webhook idempotency                         |
|                                                                     |
| Recent runs                                                         |
|  run-104  VERIFIED (8/8 requirements)  11:42  [View]               |
|  run-103  NEEDS REVIEW (5/7)         Yesterday [View]               |
|                                                                     |
| Agent profiles: Claude / Codex / OpenCode  [Configure]               |
| Verification: Test commands configured    [Edit]                    |
+---------------------------------------------------------------------+
```

This is an illustrative UI, not a live screenshot. The application should prominently indicate which fields are inferred rather than verified.

### 14.3 New Run flow

The **New Run** sheet presents a single multiline requirement field, a workflow selector (`Feature`, `Bug fix`, `Review`), and a mode selector (`Auto`, `Guided`, `Custom`). A collapsed **Advanced** section offers provider/profile routing, model effort, time and retry budgets, test commands, verification risk level and workspace options. A preview shows branch/worktree, agent selection and approvals before starting.

**Default example:**

```text
What would you like to build?
[ Make the payment callback idempotent. Handle duplicate and concurrent
  callbacks and keep the existing transaction semantics.             ]

Workflow: Feature — Full SDD      Mode: Auto
Project:  ~/projects/nusaride    Isolation: New worktree
Agents:   Use saved project policy
Checks:   npm test / configured project checks

                             [Review run plan] [Start]
```

Behavior: if no functional test command is detected, SpecTide marks project **Verification setup required**, presents detected candidates, and requires an explicit validation strategy before any final result can be `COMPLETED_VERIFIED`. It may still generate specs/implementation with an appropriate warning.

### 14.4 Live run page

```text
+---------------------------------------------------------------------+
| Payment callback idempotency        RUNNING       [Pause] [Cancel]   |
| Branch: spectide/payment-webhook-104   Worktree: isolated           |
+---------------------------+-----------------------------------------+
| Workflow                  | Current action                          |
| [x] Preflight             | Agent: Codex / default                  |
| [x] Specify               | Stage: Implement                        |
| [x] Clarify               | Task: T-008 - concurrency guard         |
| [x] Plan                  |                                         |
| [x] Tasks                 | Live events                              |
| [x] Analyze               | 12:42 writing PaymentCallbackService    |
| [>] Implement             | 12:43 running unit tests                |
| [ ] Verify                |                                         |
| [ ] Converge              | [Open log] [See diff]                   |
| [ ] Report                |                                         |
+---------------------------+-----------------------------------------+
| Requirement Evidence: 3 verified / 4 partial / 1 unverified          |
| Blockers: none        Next: verification and converge                |
+---------------------------------------------------------------------+
```

Statuses, counts and times above are **illustrative**. The actual UI derives every value from event state; the agent cannot set verification counts directly.

### 14.5 Evidence report page

Every requirement row shows **ID, short description, risk tier, state, implementation reference, test/evidence reference, freshness, and reason**. Selecting a row opens a right-hand detail view. The row state is not color-only. The default sorting order is: failed critical, unverified critical, stale, partial, verified.

Top of page includes:

- **Outcome:** Verified / Partially verified / Failed / Needs review.
- **Coverage:** `verified mandatory requirements / all applicable mandatory requirements`, never a misleading aggregate quality score.
- **Changes:** files modified, generated commits (if any), diff view.
- **Checks:** tests executed, exit status, code revision, available JUnit/coverage artifacts.
- **Gaps:** failing or unexecuted scenarios, reviewer notes and approval decisions.
- **Next action:** contextual button such as `Repair failed tests`, `Review diff`, `Rerun validation`, or `Export report`.

A link to a source file or test must work offline within the local workspace. If its revision is stale, warn explicitly.

### 14.6 Approval interaction

A prompt for approval must show:

1. A plain-language explanation of **what would happen**.
2. Which paths/commands/providers would be involved.
3. Why the requested action needs elevated approval and potential side effects.
4. Three clear actions as appropriate: **Approve once**, **Reject**, **Edit policy / Inspect**.
5. A no-action timeout resulting in a paused workflow, **never implicit approval**.

Approvals are bound to the digest of the exact planned action and expire when material arguments or paths change. The UI must not allow a harmless-looking approval prompt to authorize a different command after mutation.

### 14.7 Error messages and recovery UX

A useful error contains: **what failed**, **what has been preserved**, **what is safe to do next**, and **how to see details**. Example: “Codex hit a usage limit during T-012. The worktree and previous passing checks are preserved. Resume with the same profile later, or select another already-authorized profile. [View checkpoint]”.

Do not show generic “Something went wrong” without a correlation/run ID. Do not automatically repeat non-idempotent external actions.

### 14.8 Proposed CLI surface

| Command | Purpose | Typical output |
|---|---|---|
| `spectide init` | Trust and register current repo, write minimal config | Summary and next action |
| `spectide projects add <path>` | Register another local Git repository | New project ID, diagnostics |
| `spectide projects list` | List all projects and statuses | Canonical names, aliases and path |
| `spectide projects show <id|alias>` | Inspect project's detail and default routing | Scoped status, settings, runs |
| `spectide projects archive <id|alias>` | Archive registry entry without deleting source | Confirmation and retained history |
| `spectide projects relink <id|alias> <path>` | Reconnect moved repository after identity verification | Verified relink or refusal |
| `spectide doctor` | Validate Spec Kit, agents, tests, isolation and compatibility | Ready/needs setup report |
| `spectide run "<request>"` | Start a run in unambiguous current project | Run ID, worktree, local dashboard URL |
| `spectide run --project <id|alias> "<request>"` | Start run for another registered project, from any directory | Explicit project + resolved worktree |
| `spectide run --mode guided --workflow bugfix "<request>"` | Override workflow and mode | Run preview and start |
| `spectide status [run-id]` | Show state/current stage/blockers | Compact stage summary |
| `spectide runs` | List prior local runs; `--project <id|alias>` filters scope | Table of projects, IDs, outcomes and times |
| `spectide pause <run-id>` | Pause safely at supported boundary | Checkpoint and drain state |
| `spectide resume <run-id>` | Validate and continue | Last checkpoint, invalidated stages |
| `spectide cancel <run-id>` | Stop run while preserving changes | Confirmation and preservation details |
| `spectide dashboard` | Open or print localhost UI URL | Loopback address |
| `spectide report <run-id>` | Open or export evidence/report | Markdown path and summary |
| `spectide config show` | Show merged config without secrets | Resolved, labeled source of settings |
| `spectide profiles` | List provider profiles/capabilities | Name, provider, availability |

**Error semantics:** exit code `0` for successful command operation, distinct nonzero codes for invalid input/configuration, execution failure, action denied and unavailable integration. `run` creating a run successfully does **not** imply the feature completed successfully.

Every machine-readable command supports `--json` with versioned schemas in the MVP or through a documented minimum subset. Commands above remain proposals until implementation.

### 14.9 Daily use / zero-config philosophy

- Require **one-time setup** per repository and agent installation; do not ask users to configure twenty stages before their first run.
- Provide a working default stage policy that can use a single installed agent; multiple agents are a benefit, not a prerequisite.
- Persist the developer's defaults in a safe file; when changing tools, show a small preview of differences.
- Allow manual edits to generated specs and implementation at pause points; detect changed fingerprints and invalidate affected stages automatically.
- Offer keyboard shortcuts for View Log, View Diff, Pause and Review Evidence (documented and user-remappable later).

---

### 14.10 Multi-project dashboard and interaction design (P0)

**Global workspace / All Projects** is the default page (unless a user directly opens a project/run URL). The left sidebar stays minimal and a visible project scope selector remains in the header. The dashboard must not overload the main screen with one card per task; show a project grid/table and one global activity section. Example (illustrative values only):

```text
+------------------------------------------------------------------------------------------+
| SpecTide   Scope: [All Projects v]         Search projects...       [+ Add Project]      |
+-----------------+------------------------------------------------------------------------+
| All Projects    | Your Workspace                                         [+ New Run]     |
| Runs            | Projects: 3    Running: 2    Queued: 1    Needs Review: 1                |
| Evidence        |                                                                        |
| Settings        | Project       Status        Current Activity         Latest Quality     |
|                 | NusaRide      Running       Implementing webhook    7 / 8 verified     |
|                 | FamilyFlow    Running       Verifying OCR imports   12 / 12 verified   |
|                 | Archon        Queued        Waiting for slot       4 / 5 verified     |
|                 |                                                                        |
|                 | Global activity and approvals                                             |
|                 | [NusaRide]    Codex implementing TASK-012              [View Run]        |
|                 | [FamilyFlow]  Tests complete                         [View Evidence]    |
|                 | [Archon]      Queued due to global limit             [View Queue]       |
+-----------------+------------------------------------------------------------------------+
```

**Project detail** preserves the existing landing page design in §14.2 and adds tabs `Overview`, `Runs`, `Specs`, `Tasks`, `Evidence`, `Settings`. The project header displays project name, trusted canonical directory, branch, doctor status and its active run count. Global navigation must never silently change where a run will execute. The **New Run** modal shows an explicit project selector if opened globally, and a preselected but editable project if opened within a project; before Start it prominently displays target path, branch, agent/provider and worktree.

**Use case A — Add existing projects:** User selects **Add Project**, chooses/enters repository path, sees Git/Spec Kit/agent health, confirms trust, and returns to All Projects. Existing `.specify/` data is preserved.

**Use case B — Work on multiple apps:** User starts a feature run in project A and an independent bug-fix run in project B. Each has its own stage timeline, evidence and terminal stream. The global overview can show both and one queued third run if capacity is full.

**Use case C — Switch projects without losing place:** User opens project A's evidence report, switches to B, then returns to A; routes and state restore their respective run IDs and filters, without carrying B's selected file or agent permission into A.

**Use case D — Review all approvals:** User opens global **Needs Attention**, which lists per-project approvals with unmistakable repo name/path and action digest. Clicking opens the correct project/run. Approval can only bind to that exact scoped action.

**Use case E — Move/archive project:** User archives a completed project or relinks a moved Git repo after identity verification. Historical runs stay readable. Archiving affects only new scheduling, not existing source files; if a run is active, require an explicit pause/cancel decision before archiving.

**Concurrency UX:** A global `2 / 2 slots` capacity indicator is optional but helpful; do not confuse queued runs with blocked failures. Configure default global capacity in Settings → Execution, and stricter project limits in Project → Settings. Show queue position and reason but avoid fictitious time-to-completion estimates.

**Usability goals:** Register a second repo in 3 interactions after path selection, switch project in 2 or fewer interactions, and always know the target project before starting a mutating run. UI tests verify these flows with keyboard navigation and accessible status text.

## 15. Configuration and Policy Design

### 15.1 Example project config (`.spectide/config.yml`, **proposed**)

```yaml
schema_version: "1"
project:
  framework: speckit
  default_workflow: feature-full
  default_mode: auto
  worktree_strategy: isolated

routing:
  strategy: fixed
  stages:
    specify: { profile: claude-work }
    clarify: { profile: claude-work }
    plan: { profile: claude-work }
    checklist: { profile: claude-work }
    tasks: { profile: claude-work }
    analyze: { profile: codex-default }
    implement: { profile: codex-default }
    converge: { profile: codex-default }
    review: { profile: claude-personal }

verification:
  risk_profile: standard
  commands:
    - id: unit-tests
      argv: ["npm", "test", "--", "--runInBand"]
      timeout_seconds: 300
  require_current_revision: true
  require_evidence_for_verification: true

execution:
  max_repair_attempts: 2
  max_stage_retries: 1
  max_parallel_writers: 1
  approval_mode: risk-based
  on_quota_limit: pause

privacy:
  outbound_provider_allowlist: ["claude", "codex", "opencode"]
  export_raw_prompts: false
  export_raw_transcripts: false
```

*The project example is illustrative and assumes profile names exist in the user-local registry. `review` is a P1 stage. The actual `npm test` syntax must be project-specific; never execute example commands blindly. This file contains no credentials.*

### 15.1a Global workspace and scheduler configuration (proposed)

The local project registry resides in SQLite, not in a central checked-in manifest. The following **nonsecret** user-local settings are illustrative; project configuration continues to live in its own repository.

```yaml
workspace:
  landing_page: all-projects
  project_scope: explicit-on-mutation
  show_archived: false
scheduler:
  max_concurrent_runs_global: 2
  max_mutating_runs_per_project: 1
  on_capacity_exhausted: queue
  fairness: round_robin_projects
```

**Policy precedence:** Global safety deny rules cannot be loosened by a project. Project configuration can tighten provider allowlists and verification policies; a run override may tighten security or change benign defaults only within the permitted envelope. Global profile names are reusable for convenience, but authentication selection, prompts, source paths and provider restrictions are revalidated for each project invocation. Fair scheduling avoids one project monopolizing worker slots; limit-by-provider is evaluated separately if adapter capabilities expose it. Explicitly prevent two runs from treating the same realpath/worktree as independent projects.

### 15.2 User-local profiles (example only)

```yaml
profiles:
  - name: claude-work
    provider: claude
    model: default
    effort: provider-default
    settings_ref: work-profile
  - name: claude-personal
    provider: claude
    model: default
    effort: provider-default
    settings_ref: personal-profile
  - name: codex-default
    provider: codex
    model: default
    effort: provider-default
    settings_ref: codex-local
  - name: opencode-budget
    provider: opencode
    model: provider-configured-model
    effort: provider-default
    settings_ref: opencode-local
```

`settings_ref` is a local opaque reference whose implementation **must be validated for each provider**; it is not an instruction to create undocumented environment variables or to copy account credentials. Model selection and effort are supported only when corresponding adapter capabilities are detected.

### 15.3 Policy hierarchy

| Policy | Default | Can ordinary run override? |
|---|---|---|
| Workspace allowlist | Trusted current repository/worktree | No, requires new explicit trust approval |
| Git remote push / merge | Deny | Only through separate explicit user action; deferred from MVP |
| Production/network-sensitive commands | Ask / deny by default | Only with exact-action approval |
| Secret-file reads and export | Deny by default | Specific user-granted scope only |
| Untrusted workflow installs | Deny | Require review and explicit trust |
| Max automatic repair attempts | 2 | Yes, within safe global ceiling |
| Test commands and risk tier | Project-configured | Yes, with visible impact on verification classification |
| Agent/model profile | Saved local selection | Yes, if provider and data-policy compatible |
| Data telemetry | Local only | Optional redacted export later |

The default behavior for unmanaged CLI permissions must be the *safest supported noninteractive setting*; if the provider cannot operate safely without a permissive switch, report an unsupported combination rather than enable unrestricted permissions.

### 15.4 Risk tiers

| Tier | Examples | Minimum gate |
|---|---|---|
| `low` | Docs, formatting, isolated noncritical UI text | Basic checks, implementation diff |
| `standard` | Endpoint behavior, state transformations | Unit/integration checks + traced requirements |
| `high` | Authentication, permissions, financial transactions, concurrency | Explicit critical scenarios, independent review when available, human signoff for unmet checks |
| `restricted` | Production configuration, deployment/infra changes, secret handling | No autonomous execution by default; explicit scoped authorization; some actions permanently disallowed in MVP |

Risk classification is conservative. Users may escalate freely; downgrading below configured project policy requires a recorded override and cannot bypass global deny rules.

---

## 16. Security, Privacy and Threat Model

### 16.1 Assets to protect

Source code and intellectual property; CLI provider credentials; tokens and `.env` files; Git worktrees and history; CI secrets; local filesystem; third-party customer/test data; upstream Spec Kit run history; command and approval audit trails.

### 16.2 Main threats and mitigations

| Threat | Mitigation | P0 required test |
|---|---|---|
| Prompt injection through repository files/specs/test output | Treat all external text as untrusted data; separate policy and task instructions; deterministic command allowlists | Malicious README cannot authorize network egress or arbitrary shell writes |
| Shell injection from feature description or agent output | Use argument arrays; never interpolate untrusted text into shell command strings or upstream `shell.run` | Feature string containing shell metacharacters remains data |
| Credential leakage in logs/exports | Token pattern redaction, environment allowlist, no automatic raw transcripts, warning on uncertain leakage | Known fixture tokens absent from exports and sanitized event store |
| Unauthorized source access | Realpath/canonicalization, trusted path checks, symlink guard, provider-specific sandbox settings | Out-of-scope symlink rejected |
| Cross-project confusion and data leakage | Immutable project/run ownership, per-project route validation, scoped exports/approvals, trust revalidation on relink | Forged cross-project run ID, artifact link or approval cannot access/modify another repository |
| Destructive Git actions | Never auto-reset/clean/push/merge; preserve original checkout | Malicious stage cannot cause product-owned automatic push |
| Unsafe workflow package | Inspect provenance, render execution plan, require opt-in install, disable unreviewed custom steps | Unsigned/unreviewed package cannot be silently installed |
| Native Spec Kit captured output | Avoid sensitive captures and record upstream plaintext persistence limitation; protect filesystem permissions | Sensitive capture configuration triggers warning/block policy |
| Localhost API hijack / CSRF | Bind loopback only, random session token, strict origin checks, CSRF protection, rate limits on mutating endpoints | Untrusted external origin cannot start runs or read logs |
| Agent runaway / repeated commands | Max wall time, retries, resource budgets, cancel, approval on elevated actions | Bound limits halt repeat loop |
| Provider data exfiltration or unapproved fallback | Explicit provider allowlist and no silent cross-provider routing for restricted projects | Restricted project never routes to disallowed provider |
| Untrusted test scripts | Explain user-provided test execution, optional OS sandbox/container for stronger isolation later | No claim of full sandboxing for regular local test execution |

### 16.3 Honest isolation boundary

**Git worktrees isolate file changes and history, not OS permissions, network access, credentials or shell side effects.** For truly untrusted repositories or commands, SpecTide must recommend stronger operating-system sandboxing/containerization and may decline automated execution. Even a configured coding-agent sandbox can have limitations. The UI must not label worktree-only mode “secure sandbox.”

### 16.4 Outbound requests and external providers

When a user selects a cloud-backed agent, the underlying agent may transmit portions of local source and prompts to its provider as part of ordinary operation. SpecTide should show the configured provider before dispatch. Its own telemetry remains disabled by default; no claim is made that agent providers process data entirely locally. For work repositories, allow project-level provider policies.

### 16.5 Approval and action audit

Record action digest, requesting stage, risk classification, decision, approver (local user), timestamp, and whether execution matched the approved digest. An approval is not transferable to a materially different command or destination. Audit logs themselves are not immutable security logs; they are a useful local history, not a tamper-proof compliance product.

---

## 17. Failure Handling, Repair, Resume and Parallelism

### 17.1 Failure taxonomy and default handling

| Failure | Default behavior | Resume eligibility |
|---|---|---|
| Agent transient timeout | Retry once if operation is safe/idempotent; otherwise pause | Yes, from checkpoint |
| Authentication error | Stop, show setup fix; no other-account fallback | Yes, after user resolves auth |
| Provider usage limit | Pause, preserve work; eligible profile swap requires prior consent | Yes |
| Unrecognized CLI output/flag | Stop and show compatibility diagnostic | Yes, after adapter fix |
| Missing required spec artifact | Fail the stage; no implementation start | After regeneration or user correction |
| Analyze reports major contradictions | Block implementation, request correction/re-analysis | Yes |
| Test failure | Collect evidence; eligible bounded scoped repair | Yes |
| Converge adds missing tasks | Schedule bounded new implementation iteration, only after validity check | Yes |
| Worktree conflict | Pause for user review; preserve all branches | Yes, after resolution |
| Low disk space / local DB failure | Stop write operations, preserve files; show recovery instructions | After health check |
| User cancel | Terminate children safely and preserve diff | New run or explicit resumption policy |

### 17.2 Repair loop contract

1. Record failing requirement IDs, check IDs, code revision and test error artifacts.
2. Classify whether the failure is eligible for autonomous repair under risk policy.
3. Construct a **bounded repair ticket**: expected behavior, observed failure, permitted scope, test exit criteria and prior attempts.
4. Let the configured agent implement a scoped correction within the same isolated worktree, creating a new attempt/checkpoint.
5. Re-run affected tests **and required project baseline/regression checks**. Selected checks alone are never enough for a `VERIFIED` release if broader mandatory checks are configured.
6. Stop after a successful current-revision verification, otherwise pause after `max_repair_attempts` (default 2) or on any elevated risk.

**Never:** rerun an external payment, deploy to a real environment, delete databases, modify Git remotes or bypass approvals to make a test pass.

### 17.3 Convergence versus verification

A `speckit-converge` stage assesses implementation completeness relative to spec/plan/tasks and may append tasks. It is **not** the same as a passing test suite. SpecTide's final `COMPLETED_VERIFIED` requires the relevant deterministic/manual evidence conditions separately. Convergence loops and repair loops share one bounded aggregate policy to avoid oscillation.

### 17.4 Resume algorithm

```text
load run state + upstream state reference
  -> validate workspace path and branch/worktree
  -> check upstream workflow compatibility
  -> compare fingerprints of spec, plan, tasks and configured checks
  -> mark dependent stages/evidence stale if inputs changed
  -> verify no previous active worker owns the run
  -> preview resume point and any lost/stale work
  -> continue through supported upstream resume or controlled boundary step
```

If the last invocation may have performed a non-idempotent side effect before crashing, the run must pause for manual reconciliation. No blind replay.

### 17.5 Parallelism policy

MVP: stage execution sequential, at most one mutating process per worktree. P1: fan-out only after explicit DAG dependency and expected file overlap analysis. Each parallel writer gets a different worktree/branch; integration into a common branch is a separate visible step with conflict checking. Parallel reads may be permitted independently. Do not assume “tasks marked parallel” guarantees safe merges.

---

## 18. API and Event Contract (Proposed)

### 18.1 Local service endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/health` | Readiness/version/capabilities summary |
| `GET` | `/api/v1/projects` | List registered trusted projects |
| `POST` | `/api/v1/projects` | Register repository after trust/preflight |
| `GET` | `/api/v1/projects/:projectId` | Project details and discovered features |
| `PATCH` | `/api/v1/projects/:projectId` | Change only allowed metadata/settings, such as display name |
| `POST` | `/api/v1/projects/:projectId/archive` | Archive registration without deleting repository |
| `POST` | `/api/v1/projects/:projectId/restore` | Restore registration after trust check |
| `POST` | `/api/v1/projects/:projectId/relink` | Validate and relink moved repository by verified identity |
| `DELETE` | `/api/v1/projects/:projectId` | Confirmed unregister; no Git/source deletion |
| `GET` | `/api/v1/workspace/overview` | Aggregated project status, active/queued runs and needs-attention counts |
| `GET` | `/api/v1/workspace/activity` | Scoped-safe multi-project event summary and replay |
| `POST` | `/api/v1/runs/preview` | Resolve safe execution plan without starting |
| `POST` | `/api/v1/runs` | Create/start approved run |
| `GET` | `/api/v1/runs` | List runs with explicit `project_id` or all-project filter; owner labels included |
| `GET` | `/api/v1/runs/:runId` | Current state/stages/blockers |
| `POST` | `/api/v1/runs/:runId/pause` | Request safe pause |
| `POST` | `/api/v1/runs/:runId/resume` | Resume from validated checkpoint |
| `POST` | `/api/v1/runs/:runId/cancel` | Cancel while preserving work |
| `GET` | `/api/v1/runs/:runId/events` | SSE with replay cursor |
| `GET` | `/api/v1/runs/:runId/evidence` | Requirement/evidence graph + statuses |
| `GET` | `/api/v1/runs/:runId/report` | Sanitized report metadata/download |
| `GET` | `/api/v1/profiles` | User-local profile names/capabilities |
| `POST` | `/api/v1/approvals/:approvalId/decision` | Decision tied to exact action digest |

Routes are illustrative, but versioning, authentication, replay and error shape are requirements.

### 18.2 Event envelope

```json
{
  "schema_version": "1.0",
  "event_id": 1052,
  "run_id": "run_20261025_abcd",
  "occurred_at": "2026-10-25T13:51:12Z",
  "type": "stage.status.changed",
  "stage_execution_id": "stage_impl_02",
  "payload": {
    "from": "READY",
    "to": "RUNNING",
    "provider": "codex",
    "profile": "codex-default"
  }
}
```

Other event types include `run.created`, `run.status.changed`, `invocation.started`, `invocation.finished`, `invocation.output.redacted`, `approval.requested`, `approval.decided`, `artifact.fingerprint.changed`, `check.finished`, `evidence.status.changed`, `run.completed`.

SSE cursors use monotonically increasing stored `event_id` values; on reconnect, replay events strictly after the last acknowledged cursor. Idempotency keys protect mutating API calls against duplicate browser submissions. Event payload sizes and retention must be bounded.

### 18.3 Error contract

```json
{
  "error": {
    "code": "AGENT_CAPABILITY_UNAVAILABLE",
    "message": "The selected Codex installation cannot apply the requested option.",
    "retryable": false,
    "run_id": "run_20261025_abcd",
    "details": { "requested_capability": "effort_selection" }
  }
}
```

Do not include raw command output, auth tokens, environment values or unredacted source snippets in error responses.

### 18.4 Internal ownership of stage events

When Spec Kit owns a step, its status is translated into SpecTide's `StageExecution` state using a version-specific compatibility mapper. When SpecTide owns a boundary action (e.g. requirement evidence import), it writes its own stage events. A replayed upstream event must be deduplicated by the tuple `(upstream_run_id, upstream_step_id, upstream_occurrence_id, transition)` to prevent multiple completions.

---
## 19. Validation Plan and Acceptance Scenarios

### 19.1 Test pyramid

- **Unit:** policy decisions, status transitions, event serialization, stage invalidation, fingerprinting, requirement status, argument-array construction, redaction, profile capability negotiation.
- **Contract:** adapter fixture streams and fake CLIs simulating every supported provider; Spec Kit workflow status mappings; JSON Schema checks and SQLite migration compatibility.
- **Integration:** real Git worktrees, real SQLite, test executables, dry-run configured provider CLIs, provider version and permission mode detection, native workflow integration.
- **End-to-end:** representative small Java/Spring and TypeScript repos, beginning from onboarding and ending with reviewable code + evidence report.
- **Adversarial/security:** injection prompts, symlinks, malicious fixture CLI outputs, secret leakage attempts, duplicate event submissions, invalid approvals and interrupted processes.

Network-dependent live-provider smoke tests may run separately from deterministic CI; they shall not be the sole verification of core orchestration.

### 19.2 MVP acceptance matrix

| ID | Scenario | Expected result |
|---|---|---|
| AT-001 | `init` in an existing Spec Kit repository | Existing specs preserved; no destructive overwrite |
| AT-002 | `init` in valid Git repository without Spec Kit | Setup instructions or user-approved upstream initialization; no guessed install |
| AT-003 | Run a simple TypeScript feature with one configured provider | Visible stage history, isolated diff, current tests and complete evidence report |
| AT-004 | Run Java/Spring feature with different profiles for specify and implement | Supported adapter switches at boundary; manifests and approval state persist |
| AT-005 | Two local profiles on same provider configured using documented isolation | Correct configured profile is used and audited; no credentials copied |
| AT-006 | Provider does not support requested effort/model flag | Explicit capability error or visible, approved downgrade |
| AT-007 | Kill local service during implementation | Resume from correct checkpoint, no duplicate completed stage, no discarded changes |
| AT-008 | Fail a mandatory unit test | Requirement marked FAILED or PARTIAL as appropriate; final status not verified |
| AT-009 | Mark all `tasks.md` boxes complete while skipping a required test | Evidence requirement remains UNVERIFIED/PARTIAL |
| AT-010 | Change source code after checks pass | Evidence invalidates; re-run required before VERIFIED restored |
| AT-011 | Inject malicious shell expression in feature text | It is treated as inert data, not shell command text |
| AT-012 | Link workspace path through symlink outside trust boundary | Operation rejected |
| AT-013 | Attempt to execute untrusted upstream workflow step package | Install/execution blocked pending review and explicit trust |
| AT-014 | User reloads dashboard mid-run | Status rehydrated; SSE events replay once in order |
| AT-015 | Cancel while agent writes files | Child process terminated; worktree and diff preserved; no auto-reset |
| AT-016 | CLI quota/rate-limit error | Safe pause; no unauthorized profile/account fallback |
| AT-017 | Critical concurrent payment callback scenario has no test evidence | Release status cannot be VERIFIED under high-risk policy |
| AT-018 | User chooses Review Only | No mutating agent commands; report describes code/spec gaps |
| AT-019 | Clean offline launch with no configured cloud platform account | CLI, UI, history, Git, deterministic checks function; agent-specific execution reports setup needed |
| AT-020 | Attempt cross-origin POST to local API | Rejected without a valid local session, allowed origin and CSRF protection |
| AT-021 | Sensitive token printed in fake test output | Sanitized app logs/export exclude token; upstream plaintext risks are clearly handled/warned |
| AT-022 | A non-idempotent step crashes after uncertain side effect | Pauses for reconciliation, never automatically reruns side effect |

### 19.2a Multi-project MVP acceptance extension

| ID | Scenario | Expected result |
|---|---|---|
| AT-023 | Register three distinct existing repositories | Each appears with correct Git identity, config and independent run history |
| AT-024 | Attempt duplicate project registration using a symlink or alternate path | Registry detects same canonical root and explains the existing project |
| AT-025 | Start a new run from outside any repo with three projects registered | CLI requires explicit target; dashboard modal shows unambiguous project selection |
| AT-026 | Run A and B concurrently while global maximum is 2 | Both stream independently; third run queues with reason and position |
| AT-027 | Attempt two mutating runs in the same repo with per-project limit 1 | Second run queues; no shared checkout writes |
| AT-028 | Filter Projects, Runs and Evidence from A to B and back | No stale project-specific data persists in wrong scope; URLs/filters remain correct |
| AT-029 | Forge B's `run_id` against A-scoped endpoint | Request fails with proper scope enforcement; no B paths, events or reports returned |
| AT-030 | Reuse an approval digest from A for B | Rejected by immutable owner/context check |
| AT-031 | Move repository A, leave a different repository at its old path | A shows missing/untrusted until explicitly verified relink; no silent replacement |
| AT-032 | Archive or unregister C | Does not delete C's Git repository/worktrees or silently discard retained reports |
| AT-033 | Restart daemon with active A/B and queued C | Each run retains owning project and exact checkpoint; queue state remains consistent |
| AT-034 | Assign different provider policies and test commands to A/B | Invocation enforces policy and test command of its own project, never the previous selection |
| AT-035 | Compare global quality counts with individual projects | Aggregates reconcile with scoped run status; duplicate requirement IDs do not collide |

### 19.3 EvidenceGraph exemplar acceptance suite

For a sample financial webhook feature with the requirements:

- REQ-001: a valid new callback updates a transaction once.
- REQ-002: repeated identical callback causes no second update.
- REQ-003: concurrently arriving duplicates cause one logical update.
- REQ-004: bad signatures cannot mutate state.
- REQ-005: retries after transient errors preserve eventual consistency without double charge.

The suite creates positive, negative, concurrency and malicious-input fixtures. If only sequential duplicate tests pass, the report may mark REQ-002 verified but **must not** mark REQ-003 verified. If a test passes at Git revision A but relevant implementation changes to revision B, that evidence becomes stale. A manual user approval may acknowledge deployment risk but must not rewrite a known failing check into a passing one.

### 19.4 Definition of Done: individual stage

- Required inputs exist and match expected source fingerprints.
- Native or adapter command completed with tracked exit condition.
- Expected artifacts are found and validated.
- No unhandled permission violation or unresolved risky side effect.
- Stage state and upstream checkpoint linkage are durably saved.
- Events and high-level activity are accessible in CLI/dashboard.

### 19.5 Definition of Done: MVP release

MVP is eligible to ship only when **all** are true:

1. Every P0 functional requirement (FR-001–014, FR-016, FR-019–023, FR-027–028, FR-031–032, **FR-036–045**) is implemented or documented as a release-blocking exception. A partially implemented P0 item is not silently reclassified as completed.
2. All applicable P0 nonfunctional and security controls pass their acceptance tests.
3. AT-001 through AT-035 pass in the stated environments, with provider-dependent tests run against the supported compatibility matrix.
4. End-to-end feature runs complete in one Java and one TypeScript fixture repository with correct stage and evidence semantics.
5. Crash and resume tests produce neither duplicate completed invocations nor lost user code.
6. No known critical security defects remain open.
7. Docs cover installation, quickstart, concepts, **multi-project workspace and concurrency**, troubleshooting, privacy, and limitations.
8. A clean reinstall or update preserves the user database and run history through tested migrations.

---

## 20. Metrics, Benchmarks and Success Criteria

### 20.1 North-star metric

**Evidence-backed feature completions per developer-hour**, measured as the number of feature runs that satisfy their configured mandatory requirements and verification policy, divided by active developer time (manual intervention and review time). Track elapsed wall-clock time separately to avoid optimizing for unattended waiting.

### 20.2 Product metrics

| Metric | Definition | Initial target / interpretation |
|---|---|---|
| Onboarding success | % of eligible installs completing a test `doctor` and first run preview | Target >=80% in internal beta; segment prerequisite failures |
| Time to first run | From first `init` to run creation | Median <5 minutes on preinstalled compatible machine |
| Manual stage switches | Count of user interventions solely to select/invoke next normal stage | Target ~0 in Auto mode |
| Evidence completeness | Applicable mandatory requirements with current accepted evidence / total applicable mandatory requirements | Target 100% for a `COMPLETED_VERIFIED` outcome by definition |
| First-pass verification | Runs verified without repair / runs attempted with required tests | Observe baseline; prioritize improvement over marketing targets |
| Resume reliability | Successful validated resumptions / eligible interruption resumptions | Target >95% in fault-injection integration tests |
| Repair efficiency | Current-revision verified fixes / eligible autonomous repair attempts | Compare against baseline; stop unproductive loops |
| Cost and time | Reported provider usage, API spend when reliable, total duration | Show raw distributions; do not collapse missing prices into $0 |
| False verification | Audit cases wrongly labeled VERIFIED | Zero tolerated in critical benchmark fixtures |
| User control | Unauthorized production, push, secret export or unapproved profile switch | Zero tolerated |

### 20.3 Controlled comparison methodology

Compare **plain Spec Kit**, **Spec Kit with manual multi-agent switching**, and **SpecTide** using the same repository tasks, objective test suite, available provider/model budgets, risk policy and repeated runs. Evaluate feature implementation, scoped bug fixes, cross-provider handoffs, interruption recovery and high-risk concurrency scenarios. Track seed/context differences where supported, environment state, number of retries and independent audit of requirement coverage.

Do not claim “X% better than Claude/Codex” from one benchmark, because SpecTide coordinates those tools rather than replacing their models. Document missing usage reports and provider licensing constraints.

### 20.4 Telemetry privacy

All product metrics can be collected locally. Any remote opt-in diagnostic export must preview fields, redact sensitive values and permit removal; no upload by default. No fingerprinting of developer accounts or unrequested repository scanning.

---

## 21. Implementation Roadmap and Dependencies

**The following milestones are ordered engineering scopes, not promised delivery dates.** Parallel execution inside a coding agent is optional; every milestone has a verification gate. The developer should not attempt a single opaque implementation pass without checking results.

| Milestone | Priority | Deliverables | Exit gate |
|---|---|---|---|
| M0 — Compatibility spike | P0 | Probe supported Spec Kit CLI/workflows, current provider CLIs, multi-profile mechanisms, event capture, sandbox limits; pin versions | Reproducible proof of two-agent stage handoff and safe workflow resume |
| M1 — Foundation | P0 | Monorepo, config schemas, CLI shell, **multi-project registry and canonical identity**, SQLite migrations, Git project trust and worktrees | `init`, `projects add/list`, three-project registration, state and Git isolation tests pass |
| M2 — Workflow execution | P0 | Upstream Spec Kit bridge, stage coordinator, event stream, **project-aware scheduler and scoped queues**, approval and checkpoint persistence | Two projects can run independently, a third queues, and one fixture feature completes end-to-end |
| M3 — Provider integration | P0 | Claude/Codex/OpenCode adapters, fixed policy routing, capability detection, named profiles | Cross-agent stage changes verified without credential leakage |
| M4 — Verification wedge | P0 | Requirement index, basic EvidenceGraph, test execution and parsers, report engine | False-verification scenarios blocked and stale evidence handled |
| M5 — Developer UX | P0 | **All Projects home and selector**, project detail, global activity/approvals, New Run form, logs, result review and exports | All-project + scoped workflows and AT security/e2e suite pass |
| M6 — Beta hardening | P0 | Failure injection, migration, compatibility matrix, sample projects, docs, installer | P0 Definition of Done satisfied |
| M7 — Intelligence | P1 | ContextPack, independent review, scoped repairs, DAG view, controlled parallelism | Relevant P1 contract and recovery tests pass |
| M8 — Optimization | P2 | Model recommendations, historical evaluation, OpenSpec adapter, plugin samples | No unsupported quality claim; benchmark methodology published |

### 21.1 Implementation sequence by vertical slice

To make work easier for Spec Kit agents, organize tasks into **testable end-to-end slices**, not only infrastructure modules:

1. **Slice A:** `spectide doctor` inspects a repo and installed CLIs; multi-project register/list and identity checks; unit + integration checks.
2. **Slice B:** `spectide run` creates safe worktree and persisted **project-owned** run; global queue and per-project writer/process ownership tests.
3. **Slice C:** one supported Spec Kit workflow completes using a single real agent; artifact validity tests.
4. **Slice D:** a second agent executes a later stage with deterministic handoff; adapter contract tests.
5. **Slice E:** configured tests generate accepted and rejected EvidenceGraph links; false-success tests.
6. **Slice F:** **All Projects** dashboard streams multiple runs, scoped approvals and evidence; UI e2e tests.
7. **Slice G:** failed process recovers from safe checkpoint with preserved branch; chaos tests.

At each slice, write test fixtures and update documentation before moving on. Avoid building a sophisticated dashboard before actual workflow and evidence data exist.

### 21.2 P0 task sequencing and constraints

- Upstream compatibility spike must precede final orchestration design; native workflow command options and event behavior are version-sensitive.
- Git/worktree trust must precede mutating provider execution.
- State and event persistence must precede dashboard and retry.
- Provider capability detection must precede multi-profile routing.
- Requirement parsing and code fingerprints must precede verified-state calculation.
- Test evidence must precede repair loops; no autonomous repair until failing checks can be reliably classified.
- Security controls are not post-launch polish: local API auth, shell argument safety, untrusted workflow review and secret redaction are P0.

### 21.3 Migration from manual usage

A developer can keep using Spec Kit manually alongside SpecTide. `init` indexes existing `.specify/` artifacts and does not rewrite their content. SpecTide-generated runs create their own state and worktrees. To stop using the product, a developer may remove `.spectide/` settings and user-local run data after exporting reports; existing Spec Kit artifacts and ordinary Git branches remain usable.

---

## 22. Example Full Execution (Concrete Product Walkthrough)

**Goal:** Implement safe payment-webhook idempotency in an existing marketplace backend. The scenario below illustrates intended behavior; it does not claim that SpecTide currently exists.

**Step 1 — Initialize once.**

```bash
cd ~/projects/nusaride
spectide init
spectide doctor
```

The CLI detects Git/Spec Kit/installed agent tools and checks for test commands. The user chooses a default policy such as Claude for spec/plan and Codex for implement, with OpenCode available as a user-approved alternative. A localhost dashboard is made available without a hosted account.

**Step 2 — Request a feature.**

```bash
spectide run "Implement idempotent payment webhook handling with duplicate and concurrent callback protection"
```

Preflight previews an isolated branch, stage assignments and configured checks. No manual YAML editing is required.

**Step 3 — Spec Kit establishes what is required.**

The selected agent produces a requirement specification, clarifications if needed, planning artifacts, tasks and an analysis result. If a material design decision is uncertain (for example, database locking versus idempotency key uniqueness), Guided mode asks for review; Auto mode chooses only within declared architecture policy and records the decision.

**Step 4 — Different agent implements it.**

The implementation stage receives a deterministic handoff manifest plus approved source artifacts, not an unrestricted chat transcript. Codex or another selected installed provider works in a dedicated Git worktree. The live dashboard indicates stage, task, provider and relevant logs.

**Step 5 — Evidence is checked.**

The configured verification commands run. A passing sequential duplicate test links to its explicit requirement; a missing concurrency test remains unverified. Code diffs, requirement IDs, test results and revision fingerprints are shown together. An AI reviewer may offer additional findings, but cannot override mandatory failing tests.

**Step 6 — Scoped repair or review.**

If a required concurrency test fails, SpecTide optionally executes at most two safe scoped repair attempts, then reruns affected and mandated regression checks. If the check still fails, it pauses and states why rather than declare success.

**Step 7 — Deliver an inspectable result.**

The output includes a worktree/branch path, requirement evidence table, test summary, approval trail, unresolved risks, and a Markdown/JSON report. There is no automatic merge or deploy. The user controls the final Git/PR action outside MVP.

**The primary value:** a developer can ask for a feature once, delegate the mechanics, and receive a trustworthy answer to “Is it actually implemented and adequately verified?”

---

## 23. Product Risks, Trade-offs and Open Decisions

### 23.1 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Spec Kit changes workflow/integration internals | Adapter breakage | Pin compatible versions, contract tests, prefer stable CLI, compatibility table |
| Subscription-backed CLIs differ in automation policies/quotas | Failed runs or account issues | Supported execution modes, no credential workarounds, clear eligibility warnings |
| Requirement extraction misses nuanced acceptance behavior | False confidence | Never auto-verify without accepted evidence; visible unverified requirements and manual corrections |
| AI reviewer makes incorrect claims | Incorrect blocking or false approval | Keep inferred links separate and require independent executable evidence |
| Local agents can run risky commands | Data or system damage | Permission allowlists, user approval, no bypass defaults, consider stronger sandbox |
| Handoffs lose nuance | Defective implementation | Approved decision manifest, fingerprints, model-boundary tests |
| Too many settings overwhelm users | Low adoption | Auto/Guided/Custom with progressive disclosure |
| Parallel coding creates conflicting edits | Rework/data loss | One writer/worktree MVP, separate worktrees and conflict gates later |
| Too ambitious v1 scope | Project stalls | EvidenceGraph + safe end-to-end workflow before optimization features |

### 23.2 Decisions recommended now

1. **Use Spec Kit first; OpenSpec later.** OpenSpec support is an adapter after the primary engine and EvidenceGraph are stable.
2. **Ship local-only first.** Skip cloud accounts/team hosting entirely for MVP.
3. **Single worktree writer in MVP.** Safe parallel worktrees are P1.
4. **Profiles are supported only through documented CLI interfaces.** Unavailable capability means clear limitation, not silent imitation.
5. **Verification takes precedence over automatic completion.** Unverified is an acceptable, honest result.
6. **Do not build a replacement IDE.** Link to existing editors; focus on execution and evidence.
7. **Do not make Archon mandatory.** Later reuse its repository intelligence through an optional adapter.
8. **Prefer a lightweight browser dashboard over a native macOS app for the first release.** A native app can follow if needed.

### 23.3 Decisions to resolve during M0, not block PRD now

- Which pinned CLI versions and integration modes can truly support per-step **same-provider, different-profile** execution?
- Does the selected Spec Kit version expose sufficient stage-level status/event hooks, or do some stage boundaries require controlled separate workflow runs?
- Which installed providers expose trustworthy usage fields versus estimates?
- Which project test parsers should ship first beyond JUnit XML, generic exit code and JavaScript test runners?
- Which OS sandbox options are practical to offer without undermining first-run simplicity?
- Which license and contributor governance model should be chosen before GitHub public release (MIT/Apache-2.0 are candidates, not selected)?

These are implementation compatibility decisions; they do **not** change the user-facing promise or justify skipping safety guarantees.

---

## 24. Spec Kit Implementation Handoff

This PRD is deliberately written as a **source document for implementation**, not a substitute for `spec.md`, `plan.md`, `tasks.md`, design or tested code. When beginning work, follow this process:

1. Create a dedicated repository for SpecTide and place this PRD in `docs/prd.md`.
2. Start with M0, collecting a real CLI compatibility report and minimal proof of two-agent staged execution. If an assumption fails, update the design before writing the whole orchestration layer.
3. Establish a project constitution emphasizing local-first operation, evidence over agent claims, deterministic permission gates, no direct production actions, bounded retries, and explicit compatibility testing.
4. Use the **full Spec Kit SDD workflow** for the foundational vertical slice. Keep PRD requirement IDs traceable to specs and tests.
5. Review generated specs for coverage of all P0 functional and nonfunctional requirements. Keep P1/P2 as separate subsequent features rather than having the first run attempt everything.
6. Generate architecture decisions, an explicit data model and API/event schemas during plan.
7. Generate tasks **by vertical slice and dependency**; ensure each can be validated before relying on it downstream.
8. Run read-only `analyze` before implementation and resolve material contradictions.
9. Implement a verified slice, run actual tests, then converge. Do not treat the agent's “complete” message as a release gate.
10. Run the complete acceptance matrix and security suite; export a final EvidenceGraph-style report for SpecTide's own development.

### 24.1 Suggested first development request

> Build the first vertical slice of SpecTide according to `docs/prd.md` (M0 and M1 only). Validate current supported Spec Kit and coding-agent CLIs, establish the TypeScript monorepo, implement safe **multi-project registration, canonical repository identity**, project discovery, `spectide init`, `spectide projects add/list`, `spectide doctor`, project-scoped isolated run workspace management and durable SQLite state. Implement the corresponding deterministic tests and user documentation. Do not proceed to later milestones before this slice passes its acceptance criteria. Preserve the P0 security invariants from the PRD.

### 24.2 Suggested full-project orchestration strategy

A one-shot user request can create the **entire plan** in advance, but code execution should proceed through observable checkpoints: M0 compatibility → foundation → working SDD run → provider handoffs → evidence → UI → hardening. This keeps a single high-level product intent while preventing a long-running agent from concealing failed tests or invalid assumptions. The developer may use separate model profiles per milestone.

### 24.3 Artifacts to generate from this PRD

```text
constitution.md
spec.md / specs/<feature>/spec.md
plan.md
research.md
contracts/
  local-api.openapi.yaml
  events.schema.json
  agent-adapter.schema.json
  evidence.schema.json
data-model.md
security-threat-model.md
tasks.md
test-matrix.md
compatibility-matrix.md
README.md
```

Only generate artifacts supported by the installed Spec Kit version; the names above are desired design outputs, not a claim that Spec Kit creates all of them automatically.

---

## 25. References and Integration Assumptions

**Reference date: October 25, 2026.** Documentation and provider CLI behavior can change; revalidate at implementation time. The links below support integration capability assumptions, not a guarantee of a specific installed version.

1. **GitHub Spec Kit — official project and process overview:** https://github.github.com/spec-kit/
2. **Spec Kit — SDD quickstart and recommended command sequence:** https://github.github.com/spec-kit/quickstart.html
3. **Spec Kit — official YAML workflow engine, step types, overlays, persistence, gates and security warnings:** https://github.github.com/spec-kit/reference/workflows.html
4. **Spec Kit — workflow README and run/resume commands:** https://github.com/github/spec-kit/blob/main/workflows/README.md
5. **Spec Kit — evolving specs in existing projects:** https://github.github.io/spec-kit/guides/evolving-specs.html
6. **Codex CLI — noninteractive `codex exec`:** https://learn.chatgpt.com/docs/non-interactive-mode
7. **Codex CLI — command reference, JSON events and app-server maturity:** https://learn.chatgpt.com/docs/cli/reference
8. **Codex — app-server documentation:** https://learn.chatgpt.com/docs/app-server
9. **Claude Code — CLI reference:** https://docs.anthropic.com/en/docs/claude-code/cli-usage
10. **OpenCode — CLI, `opencode run`, model/variant selection and structured events:** https://docs.opencode.ai/docs/cli/
11. **OpenSpec — design/reference repository for deferred adapter:** https://github.com/Fission-AI/OpenSpec
12. **Superpowers — test-first/review methodology inspiration:** https://github.com/obra/superpowers
13. **SpecKit Assistant — existing visual SDD orchestration reference:** https://github.com/dmux/speckit-assistant
14. **Phoenix — optional open-source traces/evaluation reference:** https://github.com/Arize-ai/phoenix

### Explicit assumptions and caveats

- Spec Kit can automate normal SDD phases, but native `shell` workflow steps **execute unsandboxed local commands**. Workflow inputs and untrusted agent output must not be interpolated into shell strings.
- Upstream Spec Kit captured text may be persisted **unredacted** in its own run state. SpecTide cannot honestly claim those upstream files are sanitized merely because its dashboard is.
- Spec Kit active feature context is separate from Git branch selection; worktree isolation must account for the relevant feature selector.
- Claimed provider authentication profiles must be tested for real supported isolation; a second named profile by itself does not create a second login.
- Agent output, `speckit-converge`, and task checkmarks are useful process signals but do not independently prove a feature meets its acceptance criteria.
- Exact model names, effort levels, prices and subscription usage limits are intentionally **not fixed** in this PRD: these are provider-specific, plan-specific and time-sensitive.

---

## 26. Final Product Definition

> **SpecTide is a local-first SDD orchestration and evidence platform. It lets a developer describe work once, route stages to already-authorized AI coding agents, observe execution live, survive interruptions, and receive a requirement-level verification report.**
>
> **MVP promise:** **Many projects, one workspace. One request → one controlled workflow → reviewable code → honest evidence.**
>
> **Differentiation:** Not a new LLM, IDE or another step runner. The product's value is *trustworthy, low-friction delivery* across existing agent tools.

**Document status:** Complete PRD v1.1, including first-class multi-project workspace support. Ready for an M0 compatibility spike and generation of downstream Spec Kit specifications. This document is not a guarantee of implementation feasibility for undocumented third-party CLI features; those must be validated during M0.
