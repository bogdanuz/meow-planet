# PWA offline: инварианты и проверки

Обновлено: **30 сентября 2026**.  
Статус: **SSOT для precache/boot-проверок**.

## Что показал коммит `0d8d99e` (`v 1.0.7`)

Повторные зависания после 100% были не одной случайной ошибкой, а сочетанием
архитектурных и тестовых разрывов:

- ручной `BOOT_ASSET_PATHS` расходился с Workbox precache;
- `navigator.webdriver` отправлял старые e2e по пути, которого нет на iPad;
- UI показывал 100% до завершения Service Worker readiness;
- общий 8-секундный таймер стартовал одновременно с загрузкой десятков мегабайт;
- `fetch()` считался завершённым после заголовков, хотя Safari ещё держал body/соединение;
- update/cold/retry/error пути не проверялись production-preview тестом.

В `v 1.0.7` ручной список удалён, manifest унифицирован, body дочитывается, финальные
100% отложены до readiness, а отдельный Playwright suite проверяет реальную сборку.

## Единственный источник списка

1. `vite-plugin-pwa` / Workbox формирует production manifest.
2. `manifestTransforms` создаёт из него `dist/precache-manifest.json`.
3. Boot-loader берёт из JSON ожидаемый набор, а прогресс считает по фактическим
   записям `workbox-precache` в Cache Storage (на экране — только проценты, `N из M`
   лежит в `data-done` / `data-total` полоски для тестов). Отдельно скачивать те же URL
   страницей запрещено.
4. `scripts/verify-precache-manifest.mjs` сравнивает:
   - Workbox entries;
   - runtime progress entries;
   - все app-файлы внутри `dist`.

Исключения — только `sw.js` и `workbox-*.js`: браузер устанавливает их как Service
Worker scripts, а не как записи app precache.

**Звук и видео кусками (Range).** Safari на iPad запрашивает `<audio>` / `<video>`
с заголовком `Range` и играет только ответ 206. Workbox precache сам отдаёт целый файл
(200) — без интернета музыка молчала бы. Поэтому `public/sw-range.js` подключён через
`workbox.importScripts` раньше Workbox: Range-запрос к медиафайлу получает нужный
кусок из того же precache-кэша. Своего списка файлов в нём нет и быть не должно.
Проверка — тест «офлайн-кэш отдаёт звук кусками (206)» в `boot-transition.spec.ts`.

## Правило для любых новых файлов

- Runtime-ассет кладётся в `public/` или импортируется из `src/`.
- Обязательные для игры файлы не должны зависеть от внешнего CDN/URL.
- `workbox.globPatterns` остаётся `['**/*']`, поэтому новый формат файла попадает в
  precache без добавления расширения в конфиг.
- Редактировать отдельный список boot-файлов запрещено — такого списка больше нет.
- Если новый файл не оказался в precache, `npm run build` обязан завершиться ошибкой.

Размер и число записей не являются константой: они закономерно меняются с ассетами.
Инвариант — равенство `Workbox entries = progress entries = app files dist`.

Build также защищает iPad cold-start от случайных тяжёлых мастеров:

- максимум одного runtime-файла — **64 МиБ**;
- общий бюджет app-файлов — **512 МиБ**;
- превышение требует осознанного пересмотра конфигурации и ADR, а не обхода verifier.

## Обязательный цикл после ассетов, игр или PWA

```bash
npm run typecheck
npx vitest run tests/unit/<затронутые>
npm run build
npm run test:e2e:boot
npx playwright test tests/e2e/<затронутые>.spec.ts
```

Unit и e2e — только затронутые и пересекающиеся файлы; полный `npm run test` и
`npm run test:e2e` — по явной просьбе владельца (`.cursor/rules/targeted-testing.mdc`).

`npm run test:e2e:boot` запускает `vite preview`, а не dev-server, и проверяет:

- cold install: полный список → 100% → финал совы (`loader.finish()`, под ним строится
  welcome) → `loader.unmount()`;
- Range-запрос к музыке под SW и офлайн → 206;
- warm start с активным controller;
- один тихий retry после нулевого сетевого сбоя;
- два сбоя, контролируемую ошибку, кнопку «Повторить» и восстановление.
- `prefers-reduced-motion`: статичные сова и листья без переходов.

GitHub Actions запускает этот же suite после production build.

## Что запрещено возвращать

- `navigator.webdriver`/CI fast-path внутри production boot;
- runtime-парсинг текста `sw.js`;
- localStorage-marker как доказательство готовности текущей сборки;
- второй ручной manifest;
- параллельный page-fetch всех precache URL ради декоративного прогресса;
- 100% до подтверждения полного списка и SW readiness;
- проверку только через `npm run dev`.

## Ручная проверка iPad перед релизом

1. Удалить ярлык PWA и данные `bogdanuz.github.io` в Safari.
2. Установить заново по Wi‑Fi и дождаться 100%, прохода совы и welcome.
3. Закрыть и открыть PWA повторно — warm start не должен блокироваться.
4. Включить авиарежим и проверить welcome, меню и все выпущенные игры.
5. Для update-path сначала оставить установленную предыдущую версию, затем открыть
   новую публикацию и повторно запустить приложение.

Связанное архитектурное решение:
`docs/adr/0001-single-precache-manifest.md`.
