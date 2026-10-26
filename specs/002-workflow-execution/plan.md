# Implementation Plan: Workflow Execution — Blocked

**Branch**: `002-workflow-execution` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-workflow-execution/spec.md`

**Status**: **Blocked before Phase 0/Phase 1 design.** This is a pre-design gate record, not an implementation-ready plan.

## Summary

M2 would add one compatibility-validated Spec Kit workflow, a durable project-scoped stage coordinator, isolated run workspaces, scoped queues, approvals, checkpoints, and restart-safe recovery. The current repository cannot truthfully plan this implementation as supported because its retained M0 compatibility evidence does not qualify any real upstream workflow execution path.

## Technical Context

**Language/Version**: TypeScript 5.8 on Node.js 24.x

**Primary Dependencies**: Commander, Zod, YAML, and Node's built-in SQLite support

**Storage**: Local SQLite with WAL, foreign keys, integrity checks, and backup before migrations

**Testing**: Vitest unit, contract, integration, and end-to-end suites

**Target Platform**: Local developer machines supported by the foundation compatibility matrix

**Project Type**: Local-first CLI and workspace packages

**Performance Goals**: Allow two independent project runs concurrently by default while limiting a project to one mutating run; preserve complete, ordered run history across restart

**Constraints**: Local-only by default; immutable project/run/workspace ownership; no shell interpolation; restricted process environments; bounded execution; no automatic push, merge, deployment, reset, clean, stash, or deletion of user work

**Scale/Scope**: One supported sequential M2 feature workflow in a dedicated workspace, durable queue/checkpoint/event/approval state, and project-aware scheduling; provider profiles, requirement verification, repair loops, and dashboard work remain out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Result | Evidence and decision |
|------|--------|-----------------------|
| Local-first and project isolation | Conditional pass | The foundation provides trusted project identity, canonical path validation, project-owned workspaces, and local persistent storage. M2 design must retain these boundaries. |
| Evidence before claims | **Fail — blocking** | [docs/compatibility/matrix.local.json](../../docs/compatibility/matrix.local.json) records `m0_gate.passed: false`: no qualifying real-tool Spec Kit boundary or resume. The foundation release checklist also marks M0 compatibility blocked. |
| Safe, explicit autonomy | Conditional pass | The foundation supplies approved workspace previews and audited operations. M2 must add no execution capability until the upstream workflow path is validated and policy-constrained. |
| Upstream compatibility and contract discipline | **Fail — blocking** | The constitution requires compatibility work to precede dependent orchestration. M2's required upstream workflow bridge cannot be designed as supported while the only real attempts were blocked by a read-only Codex sandbox or provider quota. |
| Durable, bounded execution | Conditional pass | The foundation has transactional local storage, recovery behavior, and isolated workspaces. M2 still needs its own run, stage, event, lease, approval, and checkpoint design after the compatibility gate passes. |

### Gate Decision

**ERROR — implementation planning stops here.** The M2 feature specification requires one compatibility-validated upstream workflow path, while the current M0 record explicitly reports zero qualifying real-tool interfaces and no completed upstream boundary/resume proof. Proceeding to Phase 0 research, Phase 1 data design, or interface contracts would imply a supported invocation and resume contract that the project has not yet established.

The required prerequisite is to complete M0 with retained, sanitized evidence for a real supported workflow boundary and a safe resume on the exact supported tool versions. That record must satisfy the existing compatibility policy: observed version, `evidence_origin=observed_tool`, completed safe boundary, completed resume, and sanitized evidence. The workflow must also be reviewed for its concrete stage composition before M2 claims it can coordinate specification, planning, implementation, and convergence.

## Deferred Design Artifacts

`research.md`, `data-model.md`, `contracts/`, and `quickstart.md` are intentionally not generated. They depend on the M0-validated upstream interface, artifact behavior, stage mapping, resume behavior, and safe invocation policy. Creating them now would either invent unsupported command semantics or duplicate upstream behavior, contrary to Constitution IV.

## Re-entry Criteria

Re-run `$speckit-plan` after all of the following are true:

1. `docs/compatibility/matrix.local.json` records a passing M0 gate for a real Spec Kit workflow boundary and safe resume.
2. The selected upstream workflow's pinned version, reviewed source, supported stage mapping, artifact outputs, gate behavior, and state location are retained as compatibility evidence.
3. The selected local execution interface is explicitly authorized for the reviewed workflow invocation, bounded environment, cancellation, and output-redaction behavior.
4. The M0 evidence identifies a concrete safe workflow composition for the M2 stage sequence; no unsupported stage is silently simulated.
