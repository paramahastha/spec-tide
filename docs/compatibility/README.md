# Compatibility evidence

Only observed, reproducible results may be labeled supported. Run `spectide doctor --json` for local discovery, then validate Spec Kit and candidate agent interfaces using safe, non-mutating boundary fixtures and an interruption/resume demonstration. Record tool version, boundary, sanitized evidence, limitations, and resume outcome in the matrix. The M0 gate requires one qualifying Spec Kit path and two interfaces; missing tools remain `needs_setup` or `unverified`.

## Fixture procedure

1. Record `spectide doctor --json` results and the exact Spec Kit/agent versions.
2. Use disposable local repositories and only documented, non-mutating commands.
3. Verify the selected Spec Kit boundary and each agent boundary with argument arrays and sanitized output.
4. Interrupt at a controlled checkpoint, resume, and record both outcomes.
5. Store capability, limitation, resume result, timestamps, and sanitized evidence. Do not mark an interface ready from installation/version output alone.

# Compatibility and recovery notes

Doctor stores bounded, redacted probe records for the selected Spec Kit artifacts and local agent
interfaces. Version output or artifact presence alone remains `unverified`. M0 requires persisted
records with observed versions, sanitized evidence from `observed_tool`, a completed safe boundary,
and a recorded successful interruption/resume for Spec Kit and two distinct agent interfaces.
Mock fixture evidence verifies storage and recovery behavior but can never qualify support. The
evaluator applies those criteria to persisted records; the local matrix currently fails them.

The 2026-10-26 follow-up used a disposable initialized project. The Spec Kit workflow paused at
its review gate after the Codex integration could not write under its read-only sandbox. A separate
OpenCode plan-agent request stopped before a response because the provider returned a quota error.
Both results remain unverified, and neither was counted as a successful boundary or resume.

The 2026-10-27 follow-up is recorded under `m0_followup_2026_10_27` in the local matrix. Codex
created a real specification with the workspace-write sandbox, and the same upstream workflow
recovered from a failed stage without changing that specification. The installed OpenCode 2.0.32
rejects `--command`, which the Spec Kit 1.2.2.dev0 OpenCode integration supplies. A separate
read-only OpenCode artifact inspection and session continuation succeeded but do not establish a
native Spec Kit handoff or process-interruption recovery. The gate remains blocked.
An additional pinned OpenCode 1.3.12 binary in the disposable fixture supports `--command`, but
failed during startup against the default OpenCode data store. A subsequent 2.0.32 marker request
succeeded. Further legacy tests require a separate authenticated data environment; do not copy
credentials or automatically fall back to a different version or profile.

Run `spectide projects recoveries --json` to inspect interrupted operations after startup
reconciliation. Worktree recovery completes only after project identity, owned path, and base SHA
are validated. Incomplete relinks remain visible for an explicit identity-validated relink.
