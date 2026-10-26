# Workspace isolation validation

Local Darwin tests passed for digest-bound preview and confirmation, dirty source preservation, detached worktree postconditions, workspace-root symlink escape refusal, persisted approval audit fields, and interruption recovery. The recovery fixture injects failures before intent persistence, after intent but before Git, and after Git worktree creation; it confirms no partial database ownership and completes the post-Git operation only after validating source identity, target containment, and base commit.

Workspace preparation uses native detached Git worktrees under the application-owned data directory. This isolates checkout changes only; it is not an operating-system, network, or credential sandbox. Cross-platform outcomes remain pending CI execution.
