---
name: git-workflow-github-desktop
description: Explains how the agent must handle version control in meow-planet — the owner commits and pushes exclusively via GitHub Desktop, never the terminal. Use before or after any file change, when asked to commit/push/sync/merge, or whenever git state is relevant.
---

# Git workflow — GitHub Desktop only

## Hard rule

**Never run `git commit`, `git push`, `git merge`, `git rebase`, or any command that
changes git history or remote state** — not even if it seems faster or the owner seems
to imply it. The owner reviews and commits everything themselves in **GitHub Desktop**.

Read-only inspection commands are fine when needed for diagnosis: `git status`,
`git log`, `git diff`, `git remote -v`.

## After finishing file edits

1. Summarize in plain language what changed and why (owner is not a programmer —
   see `AGENTS.md` "Общение с владельцем").
2. Suggest a ready-to-copy commit message in Conventional Commits style
   (see `CONTRIBUTING.md`), e.g. `feat: добавить игру "Лопни шарик"`.
3. Remind them: open **GitHub Desktop** → review the diff → paste the message →
   Commit to main → Push origin. Don't imply the agent already did this.

## Repo facts (don't re-derive, don't guess)

- Remote: `https://github.com/bogdanuz/meow-planet.git` (public repository).
- Default branch: `main`.
- The agent cannot change GitHub repository settings (visibility, security features,
  branch protection) — those are browser/Settings actions for the owner. Describe the
  steps; don't assume they're already configured.

## Automated PRs (Dependabot)

Dependabot may open its own PRs against the repo (see `.github/dependabot.yml`). These
are not "external contributions" — the owner can review/merge them via the GitHub
website or GitHub Desktop like any other PR. The agent may explain what a Dependabot PR
changes, but does not merge it.
