# ADR-0001: Единый manifest для Workbox readiness и boot progress

Date: 2026-09-27  
Status: accepted

## Context

Boot-loader раньше считал вручную сгенерированный `BOOT_ASSET_PATHS`, а Workbox
прекашировал отдельный glob-список. После изменений ассетов эти списки расходились.
Кроме того, обычный Playwright запускал `navigator.webdriver` fast-path и не проверял
production boot.

## Decision

- Workbox `manifestTransforms` во время production build создаёт
  `dist/precache-manifest.json` из того же manifest, который попадает в
  `precacheAndRoute`.
- Boot progress загружает этот JSON; старого ручного списка нет.
- Build завершается ошибкой, если два списка отличаются или содержат дубли.
- Финальные 100% публикуются только после полной проверки списка и штатного
  Service Worker readiness.
- Отдельный Playwright suite запускает `vite preview` и проверяет cold, warm,
  retry и controlled-error пути без `navigator.webdriver` ветки.

## Consequences

- Изменение любых ассетов автоматически отражается и в Workbox, и в счётчике.
- Production build создаёт дополнительный `precache-manifest.json`.
- Обычный dev/e2e server отдаёт короткий детерминированный manifest, а отдельный
  production boot suite проверяет полный artifact.

## Alternatives considered

- Парсить `sw.js` в runtime — отклонено как хрупкая зависимость от формата Workbox.
- Поддерживать `BOOT_ASSET_PATHS` вручную — отклонено из-за повторных расхождений.
- Сохранять `navigator.webdriver` fast-path — отклонено, потому что он скрывал
  production-регрессии перехода к welcome.
