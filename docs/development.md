# Development

Install Node.js 24 and pnpm, then run `pnpm install`, `pnpm build`, and `pnpm test`. Run the source CLI with `pnpm exec tsx apps/cli/src/main.ts --help`.

Local state uses the platform application data directory: macOS `~/Library/Application Support/spectide`, Linux `$XDG_DATA_HOME/spectide` (or `~/.local/share/spectide`), and Windows `%LOCALAPPDATA%/spectide`. State is private to the current user; never place credentials in project configuration.
