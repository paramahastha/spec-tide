# Platform validation

The CI workflow runs build, typecheck, lint, formatting, and automated tests on macOS and Linux, and runs the same suite in Debian 13 under WSL2 on a Windows Server 2022 runner. The WSL job installs Node.js 24.22.1 and pnpm 10.17.1 inside WSL and prints Node, pnpm, and Git versions with its result.

Darwin 24.1.0 arm64 passed format check, build/typecheck, lint, CLI help, e2e quickstart scenarios, and all 39 tests under Node.js 24.22.1. A local Debian 12 Linux arm64 container using Node.js 24.22.1 and Git 2.39.5 passed install, build, typecheck, lint, format check, and all 43 tests on 2026-10-26; Git/file-boundary tests are included. This local container result does not replace the hosted Ubuntu x64 job. Windows/WSL2 evidence remains pending until the configured WSL job runs; the Ubuntu x64 hosted job has also not yet run.

Additional local validation on 2026-10-26 ran on Darwin 24.1.0 arm64 with Node.js 26.12.0, pnpm 10.17.1, and Git 2.39.5. Formatting, build, typecheck, lint, CLI help, and all 43 automated tests passed, including the end-to-end quickstart acceptance scenarios. pnpm reported that Node.js 26.12.0 is outside the repository's pinned `>=24 <25` engine range, so this run is supplementary and does not qualify as pinned-runtime platform evidence. The required hosted Ubuntu x64 and WSL2 Git/file-boundary jobs remain pending.
