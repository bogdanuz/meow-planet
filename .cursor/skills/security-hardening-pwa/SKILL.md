---
name: security-hardening-pwa
description: Client-only PWA security checklist for meow-planet, a no-backend kids' app (localStorage, XSS, dependencies, service worker). Use when handling user input like the child's name, touching localStorage, adding a dependency, or before finishing any security-relevant change.
---

# Security hardening — client-only PWA

## Scope reality check

This project has **no backend, no API, no database, no auth** (product ban, see
`AGENTS.md`). Skip SQL-injection, CORS, rate-limiting, session-security advice — it does
not apply here. Don't invent server-side security steps for a project with no server.

## What actually matters here

- **Child's name input**: insert as text (`textContent` / safe DOM APIs), **never**
  `innerHTML` with unsanitized input — this is a hard product rule, not optional.
- **localStorage**: the only persistence layer. Never log its full contents. Validate
  shape on read (a corrupted/tampered value should fail safely, not throw or `eval`).
  Never store anything sensitive — there's nothing sensitive to store per product rules
  (no accounts, no analytics).
- **Dependencies**: Dependabot is enabled (`.github/dependabot.yml`). Before adding a
  new npm package, prefer one with no runtime dependencies of its own when possible;
  run `npm audit` after installing.
- **Forbidden by product rules**: analytics, ads, camera, microphone, geolocation,
  accounts, cloud sync. If a library you're about to add requests any of these
  permissions, don't add it — flag it to the owner instead.
- **Service worker / PWA cache**: keep `vite-plugin-pwa`'s `workbox.globPatterns`
  (see `vite.config.ts`) scoped to the app's own built assets — don't widen it to cache
  arbitrary third-party origins.
- **PWA lifecycle / offline / deploy:** use skill `pwa-offline-audit` before release or SW changes.

## Reporting

Point anyone reporting a real vulnerability to `SECURITY.md` (GitHub private
vulnerability reporting) — never suggest emailing the owner.
