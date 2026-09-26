---
name: debugging-and-error-recovery
description: Step-by-step approach for diagnosing and fixing bugs, failing tests, or broken builds in meow-planet. Use when a test fails, the build breaks, typecheck errors appear, or the owner reports something not working.
---

# Debugging & Error Recovery

## Root cause before fix

1. Run the failing command and read **full** output:
   - `npm run typecheck` → `npm run test` → `npm run build` → `npm run test:e2e -- --project=chromium`
2. Read **current** file contents — don't trust chat memory (`source-of-truth.mdc`).
3. Reproduce consistently; note recent changes.

## Fix pattern (TDD)

- Minimal failing test **before** fix (`testing-and-verification`).
- Smallest change to green; re-run full checklist.
- After 2 failed guess cycles: explain to owner in plain language what failed and proposed next step.

## Environment

Machine/network issues (e.g. Playwright CDN K-004) → update `docs/08-KNOWN-ISSUES.md`, don't patch product code blindly.

## Three+ failed fixes

Stop and question architecture with owner — may need ADR, not another symptom patch.
