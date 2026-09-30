---
name: testing-and-verification
description: Defines how the agent must verify its own work in meow-planet with Vitest unit tests and Playwright e2e tests before calling any task finished. Use when writing or changing code in src/, fixing a bug, adding a feature, or before reporting a task as done.
---

# Testing & Verification (meow-planet)

## TDD (strict — owner 2026-09-22)

**No new production behavior without a failing test first.**

1. **RED:** Write minimal test; run it; confirm it **fails** for the expected reason (missing behavior, not typo).
2. **GREEN:** Smallest code change to pass.
3. **REFACTOR:** Only with all tests green.

Bugfix: test must fail before fix and pass after. If code was written before the test, delete the code and restart from the test (no «keep as reference»).

Regression: every fix gets a regression test.

No defensive branch/fallback without a test that proves the risk.

## Where tests live

- Unit/integration: `src/**/*.{test,spec}.ts` and `tests/unit/**` (see `vitest.config.ts`).
- E2E: `tests/e2e/**/*.spec.ts` (see `playwright.config.ts`). Never mix the two —
  Vitest must not try to run Playwright spec files.

## E2E expectations (UI / games)

When touching child-facing flows, e2e should cover where feasible:

- Coarse pointer / touch targets
- Soft-error chain (not negative punishment)
- Reduced motion does not break meaning
- Reload / offline / SW update for shell paths (see `pwa-offline-audit` skill)

Browser MCP exploration **does not** replace committed Playwright tests.

## Verification checklist before saying "done"

Run for real and report output:

1. `npm run typecheck`
2. `npm run test`
3. `npm run build`
4. UI/interaction changes: `npm run test:e2e -- --project=chromium`
5. Любой runtime-файл, ассет, игра, Vite/PWA/build:
   `npm run test:e2e:boot` (production preview, не dev shortcut)

Forbidden without owner ask: `test.only`, unexplained `test.skip`, arbitrary `waitForTimeout`, weakening assertions to green CI.

If `npx playwright install` never ran here, say so (K-004) — do not claim e2e passed.

## Known gaps

- `@vitest/coverage-v8` not wired — ask owner before adding thresholds.
- `npm run lint` = `tsc` only (K-005) — say **typecheck**, not ESLint.

## Reviews

Before «готово» on non-trivial `src/` changes, invoke subagent **`test-reviewer`** (and **`toddler-ux-auditor`** for game UI).

## No dead code

Per `AGENTS.md`: no unused deps/scaffolds. Report gaps; don't silently add unused tooling.
