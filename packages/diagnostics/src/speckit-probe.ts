import { discoverArtifacts } from '@spectide/project';
export function probeSpecKit(root: string) {
  const artifacts = discoverArtifacts(root);
  return {
    subject: 'spec-kit-artifacts',
    result: artifacts.present ? 'unverified' : 'needs_setup',
    observed_version: null,
    message: artifacts.present
      ? 'Spec Kit artifacts were observed; workflow compatibility is unverified.'
      : 'No Spec Kit artifacts were found.',
    next_action: artifacts.present
      ? 'Run the safe workflow compatibility fixture before claiming support.'
      : 'Initialize Spec Kit separately if desired.',
    evidence: artifacts.fingerprint,
  };
}
