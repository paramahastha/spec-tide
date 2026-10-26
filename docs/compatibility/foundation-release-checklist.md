# Foundation release evidence checklist

Status reviewed 2026-10-26. This is a release gate record for the Foundation Workspace feature.
Claims are limited to retained evidence; a local result does not stand in for a hosted platform
run or a real-tool compatibility result.

On 2026-10-27, a new disposable-repository probe demonstrated a Codex-produced specification and
Spec Kit recovery after a failed OpenCode stage. The installed OpenCode interface rejected the
`--command` argument supplied by Spec Kit. The retained follow-up in `matrix.local.json` also
records direct agent session continuation and its limits; it does not satisfy the M0 gate.

| Gate                                          | Source PRD trace                       | Spec reference                                | Evidence/status                                                                                                             |
| --------------------------------------------- | -------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Local safety and project/workspace acceptance | FR-001, FR-037, FR-038, FR-041, FR-044 | FR-001–FR-016, SC-001, SC-002, SC-004, SC-007 | Automated suite and local platform evidence retained; release review still pending                                          |
| Compatibility qualification                   | M0, FR-002, FR-003                     | FR-017, FR-018, SC-006                        | **Blocked.** `matrix.local.json` records no qualifying real-tool safe boundary plus resume; qualifying interface count is 0 |
| Internal beta usability                       | Internal-beta usability                | SC-003                                        | **Pending.** Protocol published in `internal-beta-validation.md`; no participant sessions or completion rate recorded       |
| Performance                                   | Performance requirement                | SC-005                                        | 100,000-file benchmark evidence retained in `performance-results.md`; pass recorded                                         |
| macOS                                         | NFR-004, NFR-010                       | SC-007                                        | Local Darwin 24.1.0 arm64 validation retained in `platform-validation.md`                                                   |
| Hosted Ubuntu x64                             | NFR-004, NFR-010                       | SC-007                                        | **Pending.** Configured GitHub Actions job has not produced a retained run result                                           |
| WSL2                                          | NFR-004, NFR-010                       | SC-007                                        | **Pending.** Configured GitHub Actions WSL2 job has not produced a retained run result                                      |

## Decision

**M0 compatibility release: BLOCKED.** Do not declare M0 compatibility or platform support until
the required real-tool evidence qualifies, SC-003 is reviewed against its 20-person protocol, and
hosted Ubuntu x64 and WSL2 Git/file-boundary results are retained. The automated fixture and local
Linux container results are useful regression evidence but do not satisfy those missing gates.
