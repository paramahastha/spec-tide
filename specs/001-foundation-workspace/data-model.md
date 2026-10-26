# Data Model: Foundation Workspace

All user-private tables live in the local SQLite store. IDs are opaque ULIDs or UUIDs; none is
derived from a path, repository name, branch, or remote. Timestamps are UTC ISO-8601 values.
Project-owned rows use foreign keys and service-level project filters; UI context alone is never
an authorization boundary.

## Entities

### Project

| Field | Rules |
|---|---|
| \`project_id\` | Immutable primary key created once at registration. |
| \`display_name\` | Editable, nonempty presentation value; never used as identity. |
| \`root_realpath\` | Current canonical Git-root path; unique while the registration is active or archived. |
| \`git_identity_fingerprint\` | Versioned hash of nonsecret Git identity evidence; required for trust/relink validation. |
| \`git_common_dir_realpath\` | Canonical Git common directory observed at validation time. |
| \`trust_state\` | \`pending_confirmation\`, \`trusted\`, \`untrusted\`, \`attention_required\`, or \`unavailable\`. |
| \`registry_state\` | \`active\`, \`archived\`, or \`unregistered\`. |
| \`availability_state\` | \`available\`, \`missing\`, \`identity_mismatch\`, or \`unverified_location\`. |
| \`created_at\`, \`updated_at\`, \`last_validated_at\` | Audit and revalidation times. |

Constraints: \`project_id\` is immutable. A unique index on canonical root prevents alternate-path
registration. A project is eligible for workspace preparation only when \`trust_state=trusted\`,
\`registry_state=active\`, and \`availability_state=available\`.

### ProjectLocation

Historical and current locations for a project.

| Field | Rules |
|---|---|
| \`location_id\` | Immutable primary key. |
| \`project_id\` | Required foreign key to \`Project\`. |
| \`root_realpath\` | Canonical path seen during registration/relink. |
| \`status\` | \`current\`, \`superseded\`, \`missing\`, or \`rejected\`. |
| \`validated_fingerprint\` | Fingerprint seen for this location. |
| \`validation_operation_id\` | Required provenance link to the operation. |

A relink inserts/updates a candidate location only after it matches the recorded project identity;
it never overwrites historical evidence.

### CompatibilityRecord

An observed local result for Spec Kit, an agent interface, authentication availability, or a test
command readiness probe.

| Field | Rules |
|---|---|
| \`compatibility_id\` | Immutable primary key. |
| \`project_id\` | Nullable only for machine-level tool probes; otherwise required owner. |
| \`subject_kind\` | \`spec_kit\`, \`agent_interface\`, \`authentication_availability\`, or \`test_command\`. |
| \`subject_name\`, \`observed_version\` | Sanitized tool identity and observed version, when available. |
| \`capabilities\` | Validated structured map of checked capabilities and safe boundaries. |
| \`result\` | \`ready\`, \`needs_setup\`, \`unsupported\`, or \`unverified\`. |
| \`evidence_redacted\`, \`limitations\`, \`next_action\` | Bounded sanitized text only; no raw credentials or environment. |
| \`resume_result\`, \`observed_at\` | Reproducibility context. |

Only a reproducible \`ready\` record can populate the supported matrix. Missing or ambiguous
evidence is \`unverified\`, not ready.

### FoundationOperation

The durable journal for every state-changing action.

| Field | Rules |
|---|---|
| \`operation_id\` | Immutable primary key and user-visible correlation ID. |
| \`project_id\` | Required after project identity is known; nullable only for failed pre-registration attempts. |
| \`kind\` | \`register\`, \`relink\`, \`rename\`, \`archive\`, \`restore\`, \`unregister\`, or \`prepare_workspace\`. |
| \`idempotency_key\` | Unique per operation scope to reject duplicate submissions. |
| \`state\` | \`pending\`, \`applying\`, \`completed\`, \`recoverable_incomplete\`, or \`failed\`. |
| \`request_digest\` | Hash of the validated nonsecret request; approval/confirmation is bound to this digest. |
| \`risk_classification\` | Required classification for the requested action, such as \`routine\`, \`sensitive\`, or \`elevated\`; immutable once the operation is created. |
| \`approval_decision\` | \`not_required\`, \`approved\`, or \`declined\`; required before a confirmation-gated action may enter \`applying\`. |
| \`approval_actor\`, \`approved_at\` | The local actor who made an approval decision and its UTC timestamp; both are required when \`approval_decision=approved\` or \`declined\`. |
| \`error_code\`, \`error_redacted\`, \`next_action\` | Safe failure/recovery explanation. |
| \`started_at\`, \`finished_at\` | Lifecycle times. |

The intent row is committed before external Git filesystem work. Any confirmation is bound to the
same operation, project (once identified), and request digest; a changed target or request requires
a new operation and approval. Completion is committed only after realpath, ownership, and Git
postconditions succeed. On restart, unfinished rows are reconciled and become exactly one
\`completed\`, \`recoverable_incomplete\`, or \`failed\` outcome.

### IsolatedWorkspace

| Field | Rules |
|---|---|
| \`workspace_id\` | Immutable primary key. |
| \`project_id\` | Required immutable foreign key; exactly one owning project. |
| \`operation_id\` | Required unique preparation-operation link. |
| \`root_realpath\` | Unique app-owned canonical target path. |
| \`base_commit\` | Fully resolved immutable commit SHA selected before creation. |
| \`git_worktree_metadata\` | Sanitized branch/detached-head and common-dir facts. |
| \`state\` | \`previewed\`, \`preparing\`, \`ready\`, \`recoverable_incomplete\`, or \`blocked\`. |
| \`created_at\`, \`validated_at\` | Lifecycle times. |

No workspace may reference more than one project or change its \`base_commit\`/owner. The original
checkout is not a workspace record and is never subject to automatic cleanup.

### ProjectConfigurationSnapshot

Read-only discovery record for relevant project files such as \`.spectide/config.yml\` and
\`.specify/\` artifacts.

| Field | Rules |
|---|---|
| \`snapshot_id\`, \`project_id\` | Immutable ID and required owner. |
| \`source_path\`, \`fingerprint\` | Canonical approved path and content fingerprint. |
| \`kind\`, \`schema_version\`, \`discovery_status\` | What was detected and whether it is valid/unchanged/unsupported. |
| \`safe_summary\` | Nonsecret summary only. |

The snapshot never rewrites upstream Spec Kit files. User profiles, credentials, private
preferences, and full environment data do not belong in project configuration.

## Relationships and invariants

\`\`\`text
Project 1 ── * ProjectLocation
Project 1 ── * CompatibilityRecord
Project 1 ── * FoundationOperation
Project 1 ── * IsolatedWorkspace
Project 1 ── * ProjectConfigurationSnapshot
FoundationOperation 1 ── 0..1 IsolatedWorkspace
\`\`\`

- Registration and workspace creation use SQLite transactions for their owned records and
  unique constraints for canonical root/path safety.
- Each request is canonicalized before lookup; unresolved paths, non-Git roots, and path escapes
  create no partial \`Project\` or \`IsolatedWorkspace\` record.
- A path/identity mismatch never transfers trust or ownership. It marks the current project
  unavailable/attention-required and requires explicit verified relink.
- Archive, restore, rename, and unregister change registry metadata only. Unregistration retains
  operations, reports, and historical project evidence and never removes source repositories.
- Stored output is redacted and size-bounded before persistence. Project configuration contains
  no credentials or account secrets.

## State transitions

\`\`\`text
Trust:     pending_confirmation → trusted
           trusted → unavailable | attention_required
           unavailable | attention_required → trusted (explicit identity-validated relink only)

Registry:  active ↔ archived
           active | archived → unregistered (explicit confirmation; historical rows retained)

Operation: pending → applying → completed
                            └→ recoverable_incomplete | failed

Workspace: previewed → preparing → ready
                        └→ recoverable_incomplete | blocked
\`\`\`

An unexpected process/database interruption never infers a terminal success. A recovery action
must validate the recorded project identity, intended canonical target, and Git postconditions
before completing an operation.

