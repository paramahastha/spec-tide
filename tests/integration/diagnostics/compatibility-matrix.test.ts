import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gitFixture } from '../../fixtures/src/git-fixture.js';
import { probeSpecKit } from '../../../packages/diagnostics/src/speckit-probe.js';
import { probeCodex } from '../../../packages/diagnostics/src/interfaces/codex.js';
import { probeOpenCode } from '../../../packages/diagnostics/src/interfaces/opencode.js';
import {
  compatibilityGate,
  compatibilityGateFromRecords,
  storedCompatibilityGate,
} from '../../../packages/diagnostics/src/compatibility-service.js';
import { canTransitionOperation } from '../../../packages/contracts/src/domain.js';
import { Store } from '../../../packages/storage/src/database.js';
import { saveCompatibility } from '../../../packages/storage/src/compatibility-repository.js';
import { runProcess } from '../../../packages/core/src/process-runner.js';
import { installCompatibilityFixture } from '../../fixtures/src/compatibility-fixture.js';

describe('compatibility matrix', () => {
  it('runs only safe version boundaries and does not promote availability to support', async () => {
    const fixture = gitFixture();
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spectide-tools-'));
    const oldPath = process.env.PATH;
    const bin = path.join(root, 'bin');
    try {
      fs.mkdirSync(path.join(fixture.root, '.specify'));
      installCompatibilityFixture(bin);
      process.env.PATH = `${bin}${path.delimiter}${oldPath || ''}`;
      const kit = probeSpecKit(fixture.root),
        codex = await probeCodex(fixture.root),
        opencode = await probeOpenCode(fixture.root);
      expect(kit.result).toBe('unverified');
      expect(codex.observed_version).toBe('codex-fixture 0.1');
      expect(opencode.observed_version).toBe('opencode-fixture 0.1');
      expect(codex.result).toBe('unverified');
      expect(opencode.result).toBe('unverified');
      expect(codex.capabilities.non_mutating_version_boundary).toBe(true);
      expect(opencode.capabilities.workflow_execution).toBe('unverified');
      const fixtureEvidence = new Map<string, { safe: boolean; resumed: boolean; text: string }>();
      for (const tool of ['codex', 'opencode']) {
        const boundary = await runProcess({
          executable: tool,
          args: ['--safe-boundary', 'disposable-fixture'],
          cwd: fixture.root,
          authorizedRoots: [fixture.root],
          timeoutMs: 3000,
          maxOutputBytes: 1000,
        });
        expect(boundary.code).toBe(0);
        const checkpointPath = path.join(root, `${tool}-checkpoint.json`);
        fs.writeFileSync(checkpointPath, JSON.stringify({ boundary: boundary.stdout.trim() }));
        // A new read after the checkpoint models the harness restarting after interruption.
        const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8')) as {
          boundary: string;
        };
        const resumed = await runProcess({
          executable: tool,
          args: ['--resume', 'disposable-fixture'],
          cwd: fixture.root,
          authorizedRoots: [fixture.root],
          timeoutMs: 3000,
          maxOutputBytes: 1000,
        });
        expect(resumed.code).toBe(0);
        fixtureEvidence.set(tool, {
          safe: checkpoint.boundary === 'fixture-safe-boundary-completed',
          resumed: resumed.stdout.trim() === 'fixture-resume-completed',
          text: `${checkpoint.boundary}; ${resumed.stdout.trim()}`,
        });
      }
      expect(
        compatibilityGate([
          { subject: 'spec-kit', result: kit.result },
          { subject: 'codex', result: codex.result, resume: null },
          { subject: 'opencode', result: opencode.result, resume: null },
        ]).passed,
      ).toBe(false);
      const db = new Store(':memory:');
      db.exec(
        `CREATE TABLE compatibility_records(compatibility_id TEXT,project_id TEXT,subject_kind TEXT,subject_name TEXT,observed_version TEXT,capabilities TEXT,result TEXT,evidence_redacted TEXT,limitations TEXT,next_action TEXT,resume_result TEXT,observed_at TEXT)`,
      );
      for (const [id, kind, name, version, result, capabilities, evidence, resume] of [
        ['spec', 'spec_kit', 'spec-kit', null, kit.result, kit.capabilities, kit.evidence, null],
        [
          'codex',
          'agent_interface',
          'codex',
          codex.observed_version,
          codex.result,
          {
            ...codex.capabilities,
            evidence_origin: 'mock_fixture',
            safe_boundary_completed: fixtureEvidence.get('codex')?.safe,
            resume_completed: fixtureEvidence.get('codex')?.resumed,
          },
          fixtureEvidence.get('codex')?.text,
          'resumed',
        ],
        [
          'opencode',
          'agent_interface',
          'opencode',
          opencode.observed_version,
          opencode.result,
          {
            ...opencode.capabilities,
            evidence_origin: 'mock_fixture',
            safe_boundary_completed: fixtureEvidence.get('opencode')?.safe,
            resume_completed: fixtureEvidence.get('opencode')?.resumed,
          },
          fixtureEvidence.get('opencode')?.text,
          'resumed',
        ],
      ] as const) {
        saveCompatibility(db, {
          id,
          projectId: null,
          kind,
          name,
          version,
          capabilities,
          result,
          evidence,
          limitations: 'Safe boundary only; no workflow claimed.',
          nextAction: 'Reproduce the documented fixture boundary.',
          resume,
        });
      }
      const rows = db
        .prepare(
          'SELECT subject_kind,subject_name,observed_version,capabilities,result,evidence_redacted,resume_result FROM compatibility_records',
        )
        .all() as {
        subject_kind: string;
        subject_name: string;
        observed_version: string | null;
        capabilities: string;
        result: string;
        evidence_redacted: string;
        resume_result: string | null;
      }[];
      expect(compatibilityGateFromRecords(rows).passed).toBe(false);
      expect(storedCompatibilityGate(db, null).passed).toBe(false);
      expect(
        compatibilityGate([
          {
            subject: 'spec-kit',
            version: '1',
            result: 'ready',
            resume: 'resumed',
            capabilities: {
              evidence_origin: 'observed_tool',
              safe_boundary_completed: true,
              resume_completed: true,
            },
            evidence: 'sanitized fixture evidence',
          },
          {
            subject: 'codex',
            version: '1',
            result: 'ready',
            resume: 'resumed',
            capabilities: {
              evidence_origin: 'observed_tool',
              safe_boundary_completed: true,
              resume_completed: true,
            },
            evidence: 'sanitized fixture evidence',
          },
          {
            subject: 'opencode',
            version: '1',
            result: 'ready',
            resume: 'resumed',
            capabilities: {
              evidence_origin: 'observed_tool',
              safe_boundary_completed: true,
              resume_completed: true,
            },
            evidence: 'sanitized fixture evidence',
          },
        ]).passed,
      ).toBe(true);
      db.close();
      expect(canTransitionOperation('applying', 'recoverable_incomplete')).toBe(true);
      expect(canTransitionOperation('recoverable_incomplete', 'completed')).toBe(true);
    } finally {
      process.env.PATH = oldPath;
      fixture.cleanup();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
