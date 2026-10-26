import { describe, it, expect } from 'vitest';
import { changeProject } from '../../../packages/project/src/project-lifecycle-service.js';
describe('project lifecycle', () => {
  it('keeps lifecycle transitions metadata-only', () => {
    const p: any = {
      project_id: 'p',
      display_name: 'x',
      root_realpath: '/tmp/x',
      trust_state: 'trusted',
      registry_state: 'active',
      availability_state: 'available',
      updated_at: '',
      last_validated_at: '',
    };
    const repo: any = { update: (x: any) => x };
    changeProject(repo, p, 'archive');
    expect(p.registry_state).toBe('archived');
    expect(p.root_realpath).toBe('/tmp/x');
  });
});
