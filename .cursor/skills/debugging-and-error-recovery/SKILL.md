---
name: debugging-and-error-recovery
description: Step-by-step approach for diagnosing and fixing bugs, failing tests, or broken builds in meow-planet. Use when a test fails, the build breaks, typecheck errors appear, or the owner reports something not working.
---

# Debugging & Error Recovery

## Root cause before fix

1. Run the failing command and read **full** output:
   - only the failing command/spec first (scope — `.cursor/rules/targeted-testing.mdc`);
     a full-suite single random failure that passes alone twice = load flake, not a regression
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
