---
name: pwa-offline-audit
description: >-
  Audit PWA offline, Service Worker updates, vite-plugin-pwa, and GitHub Pages base path
  for meow-planet. Use before release, after SW/manifest/build changes, or when owner
  reports stale/offline issues.
---

# PWA & offline audit (meow-planet)

## Scope

Client-only PWA (`vite.config.ts` → `vite-plugin-pwa`). **No** push, Background Sync, CRDT, server reconciliation.

## Checklist (production build)

1. `npm run build` then `npm run preview` (or CI artifact) — not only `dev`.
2. **Manifest:** `start_url`, `scope`, icons (192/512 PNG when ready — K-002), `lang`, landscape-friendly.
3. **Base path:** `base: './'` matches GitHub Pages subpath if used.
4. **SW update:** `registerType: 'prompt'` — no unconditional `skipWaiting` mid-game; old tab behavior on deploy.
5. **Cache:** hashed assets invalidate; old caches cleaned; offline loads shell + assets.
6. **Not enough:** `navigator.onLine` alone — verify real offline after SW active.
7. **Local reset:** parent/settings delete data still works after SW update.

## References (ideas only, clean-room)

- [Vite PWA](https://vite-pwa-org.netlify.app/)
- [Service Worker lifecycle](https://web.dev/articles/service-worker-lifecycle)

## Report

List pass/fail with command output. Browser MCP exploration does **not** replace committed Playwright e2e.
