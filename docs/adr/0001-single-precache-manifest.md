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
- Workbox использует `globPatterns: ['**/*']`: новый тип runtime-файла не требует
  ручного добавления расширения.
- Boot progress загружает этот JSON как ожидаемый набор; выполненное `N` считает
  по реальным записям `workbox-precache` в Cache Storage. Старого ручного списка
  и параллельного page-fetch тех же файлов нет.
- Build завершается ошибкой, если списки отличаются, содержат дубли или любой
  app-файл `dist` (кроме SW runtime scripts) отсутствует в precache.
- Build отклоняет случайный runtime-файл больше 64 МиБ и общий app-набор больше
  512 МиБ; изменение бюджета требует осознанного пересмотра этого решения.
- Финальные 100% публикуются только после полной проверки списка и штатного
  Service Worker readiness.
- Отдельный Playwright suite запускает `vite preview` и проверяет cold, warm,
  retry, controlled-error и reduced-motion пути без `navigator.webdriver` ветки.

## Consequences

- Изменение любых ассетов автоматически отражается и в Workbox, и в счётчике.
- Production build создаёт дополнительный `precache-manifest.json`.
- Любой файл в `public/` попадает в production output и offline precache независимо
  от расширения; обязательные runtime-ресурсы с внешних URL запрещены.
- Обычный dev/e2e server отдаёт короткий детерминированный manifest, а отдельный
  production boot suite проверяет полный artifact.

## Alternatives considered

- Парсить `sw.js` в runtime — отклонено как хрупкая зависимость от формата Workbox.
- Поддерживать `BOOT_ASSET_PATHS` вручную — отклонено из-за повторных расхождений.
- Сохранять `navigator.webdriver` fast-path — отклонено, потому что он скрывал
  production-регрессии перехода к welcome.
