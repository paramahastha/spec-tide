export type Project = {
  project_id: string;
  display_name: string;
  root_realpath: string;
  git_identity_fingerprint: string;
  git_location_fingerprint: string;
  git_common_dir_realpath: string;
  trust_state:
    'pending_confirmation' | 'trusted' | 'untrusted' | 'unavailable' | 'attention_required';
  registry_state: 'active' | 'archived' | 'unregistered';
  availability_state: 'available' | 'missing' | 'identity_mismatch' | 'unverified_location';
  created_at: string;
  updated_at: string;
  last_validated_at: string;
};
export type OperationState =
  'pending' | 'applying' | 'completed' | 'recoverable_incomplete' | 'failed';
export type FoundationOperation = {
  operation_id: string;
  project_id: string | null;
  kind: string;
  idempotency_key: string;
  state: OperationState;
  request_digest: string;
  risk_classification: string;
  approval_decision: string;
  approval_actor: string | null;
  approved_at: string | null;
  started_at: string;
  finished_at: string | null;
  error_code: string | null;
  error_redacted: string | null;
  next_action: string | null;
};
export type IsolatedWorkspace = {
  workspace_id: string;
  project_id: string;
  operation_id: string;
  root_realpath: string;
  base_commit: string;
  state: string;
  created_at: string;
  validated_at: string | null;
};
export const canTransitionOperation = (from: OperationState, to: OperationState) =>
  (
    ({
      pending: ['applying', 'failed'],
      applying: ['completed', 'recoverable_incomplete', 'failed'],
      recoverable_incomplete: ['completed', 'failed'],
      completed: [],
      failed: [],
    })[from] as string[]
  ).includes(to);

export type ProjectLocation = {
  location_id: string;
  project_id: string;
  root_realpath: string;
  status: 'current' | 'superseded' | 'missing' | 'rejected';
  validated_fingerprint: string;
  validation_operation_id: string;
};
export type CompatibilityRecord = {
  compatibility_id: string;
  project_id: string | null;
  subject_kind: 'spec_kit' | 'agent_interface' | 'authentication_availability' | 'test_command';
  subject_name: string;
  observed_version: string | null;
  capabilities: Record<string, unknown>;
  result: 'ready' | 'needs_setup' | 'unsupported' | 'unverified';
  evidence_redacted: string;
  limitations: string;
  next_action: string;
  resume_result: string | null;
  observed_at: string;
};
export type WorkspaceState =
  'previewed' | 'preparing' | 'ready' | 'recoverable_incomplete' | 'blocked';
export type ProjectConfigurationSnapshot = {
  snapshot_id: string;
  project_id: string;
  source_path: string;
  fingerprint: string;
  kind: string;
  schema_version: string | null;
  discovery_status: string;
  safe_summary: string;
};
export const canTransitionWorkspace = (from: WorkspaceState, to: WorkspaceState) =>
  (
    ({
      previewed: ['preparing', 'blocked'],
      preparing: ['ready', 'recoverable_incomplete', 'blocked'],
      recoverable_incomplete: ['ready', 'blocked'],
      ready: [],
      blocked: [],
    })[from] as string[]
  ).includes(to);
export const canTransitionRegistry = (
  from: Project['registry_state'],
  to: Project['registry_state'],
) =>
  (
    ({
      active: ['archived', 'unregistered'],
      archived: ['active', 'unregistered'],
      unregistered: [],
    })[from] as string[]
  ).includes(to);
