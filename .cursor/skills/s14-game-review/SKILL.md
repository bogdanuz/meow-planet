---
name: s14-game-review
description: >-
  S14 owner walkthrough for each of 9 games: SSOT vs code gap analysis, market patterns,
  user story/journey in plain language, AskQuestion quizzes (multi-select OK), then docs
  and code. Use when starting or continuing S14 game polish after balloon-pop playbook.
---

# S14 — проход по игре с владельцем

**Playbook (SSOT процесса):** `docs/quality/S14-GAME-REVIEW-PLAYBOOK.md`

## Старт сессии по игре

1. Read `HANDOFF.md` → which game is next.
2. Follow playbook steps 1–6 **before** large code changes.
3. Create or open `docs/games/S14-<game-id>-BRIEF.md`.
4. Present owner: user story, journey, gap table, market patterns (simple Russian).
5. **AskQuestion** only — every question includes «Свой вариант (напишу в чат)»; use `allow_multiple: true` when several improvements can combine.
6. After answers: `04-DECISION-REGISTER.md`, product idea section, brief → ЗАФИКСИРОВАНО; then code/tests.

## UX

Apply `ux-ui-kids-hub` for layout/touch/copy on screen.

## Done for one game

Brief marked ЗАФИКСИРОВАНО; decisions registered; tests green; `docs-sync`; owner commit message for GitHub Desktop.
