# SpecTide Foundation Workspace

SpecTide is a local-first CLI foundation for safely discovering, registering, and preparing isolated Git worktrees for projects.

## Development

Use Node.js 24 and pnpm. Run `pnpm install`, `pnpm build`, `pnpm test`, and `pnpm --filter @spectide/cli exec spectide --help`.

The CLI stores its private SQLite database under the operating system's user-data directory (`spectide/state.sqlite`). It does not write configuration into registered repositories.
