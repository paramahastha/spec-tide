# Foundation CLI Contract

This is the public command and JSON-output contract for Foundation Workspace. The contract
describes intended stable behavior, not commands already available in this repository. The CLI
is local-first; it never needs a hosted SpecTide account for these operations.

## Global rules

- Commands write human-readable output by default. \`--json\` emits exactly one validated JSON
  document to standard output; progress/diagnostic text goes to standard error.
- Paths supplied by a user are data, not shell fragments. The product resolves them to canonical
  paths before use and never constructs shell command strings from them.
- Mutating commands expose an operation ID. Errors are sanitized; they never include secrets,
  raw environment values, full command strings, or unredacted tool output.
- \`--project <project-id|unique-alias>\` must resolve to exactly one registered project. Workspace
  preparation may infer a target only when the current canonical Git root maps to exactly one
  active trusted project; otherwise it refuses and asks for \`--project\`.
- Confirmation flags acknowledge the validated request digest. The durable operation records the
  action's risk classification, approval decision, local actor, and timestamp; a materially changed
  path, base revision, or project requires another preview/confirmation and operation record.

## Commands

| Command | Required behavior |
|---|---|
| \`spectide doctor [path] [--project <id-or-alias>] [--json]\` | Read-only discovery and capability result for Git, Spec Kit artifacts/workflow path, agent interfaces, authentication availability without credential reads, and test-command readiness. |
| \`spectide init [path] --confirm-trust [--display-name <name>] [--json]\` | Resolve the repository and register it after explicit trust confirmation; detect existing artifacts without rewriting them. |
| \`spectide projects add <path> --confirm-trust [--display-name <name>] [--json]\` | Register a distinct local Git root or refuse an existing canonical root with its current project identity. |
| \`spectide projects list [--include-archived] [--json]\` | List project ID, display name, canonical location, trust, registry, and availability state only. |
| \`spectide projects rename <id-or-alias> <display-name> [--json]\` | Change only presentation metadata. |
| \`spectide projects archive <id-or-alias> --confirm [--json]\` | Archive the registration without touching source, worktrees, records, or reports. |
| \`spectide projects restore <id-or-alias> --confirm [--json]\` | Restore an archived registration after current trust/identity validation. |
| \`spectide projects unregister <id-or-alias> --confirm [--json]\` | Mark the registration unregistered and preserve historical records; never delete source or user work. |
| \`spectide projects relink <id-or-alias> <path> --confirm-trust [--json]\` | Validate the candidate canonical root against the recorded Git identity, then update location only on a match. |
| \`spectide workspace prepare --project <id-or-alias> --base <commit-ish> --preview [--json]\` | Resolve but do not mutate. Return target project, canonical source path, fully resolved commit SHA, intended app-owned workspace root, isolation warning, and confirmation digest. |
| \`spectide workspace prepare --project <id-or-alias> --base <commit-ish> --confirm <digest> [--json]\` | Create one project-owned native Git worktree only when the preview remains valid. It never stashes, resets, cleans, pushes, merges, deploys, changes remotes, or deletes user work. |

\`init\` may be implemented as \`projects add\` plus repository-local safe configuration discovery;
it must not install or initialize upstream Spec Kit without a separately approved action.

## JSON success envelope

All fields shown are stable unless explicitly optional. Fields with secret-bearing or raw tool
output are intentionally absent.

\`\`\`json
{
  "schema_version": "1.0",
  "operation": {
    "id": "op_01J...",
    "kind": "prepare_workspace",
    "state": "completed"
  },
  "project": {
    "id": "proj_01J...",
    "display_name": "Example",
    "root_realpath": "/canonical/approved/repository",
    "trust_state": "trusted",
    "registry_state": "active",
    "availability_state": "available"
  },
  "workspace": {
    "id": "ws_01J...",
    "root_realpath": "/private/app-data/spectide/worktrees/proj_01J/ws_01J",
    "base_commit": "full-resolved-commit-sha",
    "state": "ready"
  },
  "diagnostics": [],
  "next_actions": []
}
\`\`\`

The \`project\` field is omitted only when identity failed before a project could safely be
determined. \`workspace\` is present for workspace preview/preparation only. A preview returns an
operation in \`pending\` state and a \`confirmation_digest\`; it creates no Git worktree.

Diagnostic entries use this shape:

\`\`\`json
{
  "subject": "codex-interface",
  "result": "needs_setup",
  "observed_version": null,
  "message": "A supported local interface was not observed.",
  "next_action": "Install or select a documented supported interface, then rerun doctor."
}
\`\`\`

Allowed \`result\` values are \`ready\`, \`needs_setup\`, \`unsupported\`, and \`unverified\`. \`ready\`
requires an observed compatibility record; it is never inferred from configuration alone.

## JSON error envelope

Commands use a nonzero exit status for refusal/failure and emit this JSON shape with \`--json\`:

\`\`\`json
{
  "schema_version": "1.0",
  "error": {
    "code": "WORKSPACE_BOUNDARY_VIOLATION",
    "message": "The requested workspace resolves outside the approved project-owned location.",
    "next_action": "Choose a project-owned workspace root and create a new preview.",
    "operation_id": "op_01J...",
    "retryable": false
  }
}
\`\`\`

| Code | Meaning |
|---|---|
| \`PATH_UNRESOLVABLE\` | Path cannot be canonicalized or read safely. |
| \`PATH_NOT_GIT_REPOSITORY\` | Canonical path is not inside a valid Git working repository. |
| \`TRUST_CONFIRMATION_REQUIRED\` | Registration or relink has not received explicit trust confirmation. |
| \`DUPLICATE_PROJECT\` | Canonical root already belongs to the returned existing project. |
| \`PROJECT_NOT_FOUND\` / \`PROJECT_AMBIGUOUS\` | Project selector has zero or multiple matches. |
| \`PROJECT_UNAVAILABLE\` | Registered source is missing, moved, archived, or otherwise unavailable for the requested operation. |
| \`GIT_IDENTITY_MISMATCH\` | Candidate path does not validate as the recorded repository. |
| \`INVALID_BASE_REVISION\` | Selected base does not resolve to a permitted clean commit. |
| \`PREVIEW_REQUIRED\` / \`PREVIEW_STALE\` | Workspace request was not confirmed from the current validated preview. |
| \`WORKSPACE_BOUNDARY_VIOLATION\` | Target escapes the app-owned canonical workspace root. |
| \`OPERATION_INCOMPLETE\` | A prior operation needs visible reconciliation; no duplicate action was taken. |
| \`COMPATIBILITY_UNVERIFIED\` | Requested workflow/interface lacks reproducible compatibility evidence. |
| \`POLICY_DENIED\` | A global or project safety policy forbids the requested action. |

## Safety postconditions

- \`doctor\` and discovery leave the repository and existing \`.specify/\` artifacts unchanged.
- Registration mutations affect only private registry/configuration records after explicit trust;
  they do not alter repository remotes, branches, source, or credentials.
- Workspace preparation creates a distinct Git worktree from the displayed commit. The original
  checkout and uncommitted changes remain intact.
- A crash or storage failure returns a durable completed outcome or \`OPERATION_INCOMPLETE\`; it
  never causes a duplicate registration or silently reassigned worktree.

