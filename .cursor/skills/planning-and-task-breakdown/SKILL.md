---
name: planning-and-task-breakdown
description: How the agent breaks down meow-planet roadmap items and sprints into small, confirmable steps for a non-programmer product owner. Use when planning sprints, roadmap items, or any multi-step feature before writing code.
---

# Planning & Task Breakdown

## Owner context

Owner is **not a programmer** (`AGENTS.md`). Plain language, ready commands, AskQuestion for choices.

## Before code

Document for the task (in chat or `docs/` when large):

- **Goal**, **scope**, **non-goals**, constraints (`docs/product/PRODUCT_CONSTRAINTS.md`)
- Child + parent flow in one screen each where relevant
- Files/modules touched; no cross-game imports
- Alternatives / trade-offs (brief)
- **Acceptance criteria** and which tests (unit vs e2e) prove them
- Product choice → **AskQuestion** (`.cursor/rules/interactive-quizzes.mdc`)

No speculative extension points. Wait for owner «да» on architecture/product/mechanics changes.

## Sprint state

Read `docs/05-CURRENT-STATE.md` and `HANDOFF.md` — don't execute a new sprint while owner has open questions without confirmation.

## Steps

- Small steps, each independently verifiable (TDD + checklist in `testing-and-verification`).
- Docs: skill `docs-sync` — only files whose truth changed.

## Definition of Done

1. Tests + typecheck + build (+ e2e if UI) — real output reported.
2. Docs per `docs-sync`.
3. Owner summary + suggested commit message; commit via **GitHub Desktop** (`git-workflow-github-desktop`).

Roadmap status line in `docs/06-ROADMAP.md` — only after owner confirms sprint start.
