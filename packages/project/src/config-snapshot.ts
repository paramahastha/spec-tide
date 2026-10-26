import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import crypto from 'node:crypto';
import type { ProjectRepository } from '@spectide/storage';
import { discoverArtifacts } from './artifact-discovery.js';
const SAFE_KEYS = new Set(['version', 'workspace', 'diagnostics', 'compatibility']);
export function discoverConfig(root: string) {
  const file = path.join(root, '.spectide', 'config.yml');
  if (!fs.existsSync(file))
    return {
      exists: false,
      valid: null,
      fingerprint: null,
      summary: 'No SpecTide configuration found.',
    };
  const text = fs.readFileSync(file, 'utf8');
  let valid = false;
  try {
    const doc = YAML.parse(text);
    valid =
      doc &&
      typeof doc === 'object' &&
      !Array.isArray(doc) &&
      Object.keys(doc).every((k) => SAFE_KEYS.has(k));
  } catch {}
  return {
    exists: true,
    valid,
    fingerprint: crypto.createHash('sha256').update(text).digest('hex'),
    summary: valid
      ? 'Configuration is valid; values were not imported.'
      : 'Configuration is invalid or contains unsupported fields.',
  };
}

export function persistDiscoverySnapshots(
  projects: ProjectRepository,
  projectId: string,
  root: string,
) {
  const config = discoverConfig(root);
  const artifacts = discoverArtifacts(root);
  projects.atomic(() => {
    if (config.fingerprint) {
      projects.saveConfigurationSnapshot({
        snapshot_id: `snap_${crypto.randomUUID()}`,
        project_id: projectId,
        source_path: path.join(root, '.spectide', 'config.yml'),
        fingerprint: config.fingerprint,
        kind: 'spectide_config',
        schema_version: null,
        discovery_status: config.valid ? 'valid' : 'invalid',
        safe_summary: config.summary,
      });
    }
    if (artifacts.present && artifacts.fingerprint) {
      projects.saveConfigurationSnapshot({
        snapshot_id: `snap_${crypto.randomUUID()}`,
        project_id: projectId,
        source_path: path.join(root, '.specify'),
        fingerprint: artifacts.fingerprint,
        kind: 'specify_artifacts',
        schema_version: null,
        discovery_status: 'discovered',
        safe_summary: `${artifacts.files.length} artifact file(s) discovered; contents remain upstream.`,
      });
    }
  });
}
