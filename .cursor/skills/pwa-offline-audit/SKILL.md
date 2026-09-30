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

1. `npm run build` — verifier обязан подтвердить:
   `Workbox entries = progress entries = app files dist`.
2. `npm run test:e2e:boot` — production preview, cold/warm/retry/error пути.
   Проверка только через `dev` недостаточна.
3. **Новые файлы:** `workbox.globPatterns` остаётся `['**/*']`; runtime-ассеты
   находятся в `public/` или импортируются из `src/`, не на внешнем CDN.
4. **Manifest:** `start_url`, `scope`, icons 192/512, `lang`, landscape.
5. **Base path:** `base: '/meow-planet/'` соответствует GitHub Pages.
6. **SW update:** текущая стратегия `registerType: 'autoUpdate'`; не менять её и
   lifecycle без ADR и отдельного update-path теста.
7. **Cache:** hashed assets инвалидируются, старые caches очищаются,
   `precache-manifest.json` создаётся из Workbox manifest; бюджеты 64 МиБ/файл и
   512 МиБ/сборка не превышены.
8. **Запрещено:** ручной список ассетов, runtime-парсинг `sw.js`,
   `navigator.webdriver` fast-path, 100% до SW readiness.
9. **Local reset:** удаление parent/settings данных работает после SW update.
10. **iPad:** отдельно проверить clean install, update существующего SW и airplane mode.

SSOT: `docs/quality/PWA-OFFLINE-GUARDRAILS.md` и ADR-0001.

## References (ideas only, clean-room)

- [Vite PWA](https://vite-pwa-org.netlify.app/)
- [Service Worker lifecycle](https://web.dev/articles/service-worker-lifecycle)

## Report

List pass/fail with command output. Browser MCP exploration does **not** replace committed Playwright e2e.
