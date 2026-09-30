# Планета Мяу — полный снимок проекта

**Назначение файла:** самодостаточный бриф для внешнего консультанта без доступа к репозиторию.  
**Язык:** русский. **Стиль:** описательный, без рекомендаций и оценок качества.

---

## Мета (момент составления)

| Поле | Значение | Источник |
|------|----------|----------|
| Дата составления | **24 сентября 2026** (вечер, UTC+3); дополнено по запросу владельца | — |
| Версия приложения (npm) | **0.15.22** | `package.json` |
| Версия в UI родительского центра | **0.13.8** (расходится с npm) | `src/app/version.ts` → `settings-form.ts` через `shell.ts` |
| Спринт (docs) | **S16 в работе** (ассеты по MEGAFILE); S15 закрыт | `HANDOFF.md` |
| Git commit | **не определён** в среде агента (`main` без commits). У владельца с GitHub Desktop hash может отличаться — зафиксируйте локально `git log -1` перед передачей консультанту | `git log` |
| Typecheck | **pass** | `npm run typecheck`, 24.09.2026 |
| Build | **pass**; PWA precache **149 entries (~9885 KiB)** | `npm run build`, `vite.config.ts` / вывод Vite PWA |
| Unit-тесты | **44 файла, 148 тестов — all passed** | `npm run test`, Vitest 4.1.11 |
| E2E локально (chromium) | **34 passed, 4 failed** (~1.4 min) | `npm run test:e2e -- --project=chromium`, 24.09.2026 |
| E2E в CI | тот же набор после build; Node **22**, bundled Chromium | `.github/workflows/ci.yml` |

**Лицензия продукта:** проприетарная («Все права защищены») — `LICENSE`, `README.md`. Сторонний код — `THIRD_PARTY_NOTICES.md`.

---

## 1. Обзор продукта

### 1.1 Назначение и аудитория

- **Продукт:** PWA-хаб мини-игр «Планета Мяу», маскот — кот **Мяу**.  
  **Источник:** `README.md`, `Планета_Мяу_Идея_продукта.md` (**версия 1.0 Idea — ОДОБРЕНО**, 22.09.2026; ~900 строк, паспорт §1, механики §11, стек §В6).
- **Аудитория:** дети **2–3 года**; основной сценарий — **iPad landscape**, touch, без чтения для ребёнка.  
  **Источник:** `docs/product/PRODUCT_CONSTRAINTS.md` (статус ЗАФИКСИРОВАНО), совпадает с идеей продукта.
- **MVP:** **9 игровых модулей** + экраны welcome / меню / родительский центр; без backend, аккаунтов, аналитики, камеры, «проигрыша», очков, таймеров-штрафов.  
  **Источник:** `PRODUCT_CONSTRAINTS.md` + фактически клиент-only код (`src/main.ts`, нет API).

### 1.2 Ключевые продуктовые ограничения (кратко)

| Тема | Суть | Источник |
|------|------|----------|
| Soft-error | neutral → намёк → подсветка, без «неверно» | идея §7, `src/shared/soft-error-chain.ts`, `PRODUCT_CONSTRAINTS.md` |
| Имя ребёнка | только localStorage; в DOM — textContent/value, не innerHTML с вводом | `src/shared/storage.ts`, `src/app/parent/settings-form.ts` |
| Touch | крупные цели ~56–64px+ | constraints + CSS классы `touch-btn` в `src/styles/` |
| Игры | изолированы в `src/games/<id>/`, общее — `src/shared/` | `PRODUCT_CONSTRAINTS.md`, факт импортов |

### 1.3 Стек (точные версии)

Из **`package.json`** (проверено 24.09.2026):

| Категория | Пакет | Версия (range в package.json) |
|-----------|--------|-------------------------------|
| Runtime deps | `headbreaker` | ^3.0.0 |
| | `konva` | ^9.3.22 |
| | `interactjs` | ^1.10.28 |
| Dev | `vite` | ^8.3.0 |
| | `typescript` | ^7.0.2 |
| | `vitest` | ^4.1.11 |
| | `@vitest/coverage-v8` | ^4.1.11 (в scripts не подключён) |
| | `@playwright/test` | ^1.63.0 |
| | `vite-plugin-pwa` | ^1.3.0 |
| | `jsdom` | ^29.1.1 |
| | `@types/node` | ^26.6.2 |
| Node | engines | >=20 |

Сборка: `tsc -b && vite build` (`package.json`). `npm run lint` = **только** `tsc -b` (ESLint не используется — см. K-005 в `docs/08-KNOWN-ISSUES.md`).

### 1.4 Хостинг, деплой, CI/CD

| Утверждение | Документация | Код / CI |
|-------------|--------------|----------|
| Целевой хостинг | GitHub Pages, без своего сервера | `Планета_Мяу_Идея_продукта.md`, `docs/06-ROADMAP.md` (S17 — выпуск) |
| Base path | `./` для Pages | `vite.config.ts` `base: './'` |
| Hash-роутинг | надёжен на Pages | `src/app/router.ts` |
| **Workflow деплоя на Pages** | упоминается в roadmap/S17 | **в `.github/` только `ci.yml`** — отдельного deploy-workflow **нет** (проверено список `.github/workflows/`) |
| CI | push/PR на main/master | `.github/workflows/ci.yml`: `npm ci` → typecheck → test → build → playwright install chromium → `test:e2e --project=chromium` |

### 1.5 Приватность и хранение данных

| Хранилище | Ключ / имя | Структура | Источник |
|-----------|------------|-----------|----------|
| localStorage | `meow-planet.settings` | `AppSettings`: schemaVersion, childName, sound/music/quiet, hideEnglishAlphabet, countingLimit (3\|10), balloonTasksEnabled, customPuzzleIds[] | `src/shared/storage.ts` |
| localStorage | `meow-planet.puzzle-settings` | `pieceCount`: 4 \| 6 \| 9 | `src/games/puzzle/puzzle-settings.ts` |
| IndexedDB | DB `meow-planet-puzzles`, store `photos` | JPEG пользовательских фото для пазла (keyPath `id`) | `src/shared/puzzle-photos.ts` |

**Не найдено в коде:** учёт экранного времени, облачный sync, analytics, camera API для фото (пазл — выбор файла через input, см. puzzle modals).

**XSS:** единственный `innerHTML` в `src/` — речь Мяу в «Лопни шарик» после `escapeHtml` (`src/games/balloon-pop/speech.ts`, `src/games/balloon-pop/index.ts`). Имя ребёнка — `textContent` (`settings-form.ts`, `sort-colors/index.ts`, `balloon-pop/index.ts`).

### 1.6 Точка входа и внешние зависимости runtime

| Компонент | Факт | Источник |
|-----------|------|----------|
| HTML shell | `#app`, lang=ru, theme-color `#7eb8da`, Fredoka с **Google Fonts** (online при первом заходе) | `index.html` |
| Шрифт UI | `--font-ui` / `--font-display` → Fredoka + fallbacks | `src/styles/global.css`, `index.html` |
| Offline fonts | **не** self-hosted в `public/` — без сети возможен FOUT/fallback | проверка `public/` + `index.html` |

---

## 2. Структура репозитория

### 2.1 Дерево ключевых каталогов

```
meow-planet/
├── src/
│   ├── main.ts              # boot loader → PWA boot → renderShell
│   ├── app/                 # shell, router, экраны, родители, PWA boot
│   ├── content/             # catalog.ts — GameId, зоны (исторические мета)
│   ├── games/               # 9 игр + registry.ts
│   ├── mascot/              # CSS-заглушка Мяу
│   ├── shared/              # cross-game utilities (17 файлов)
│   ├── styles/              # global, shell, placeholders, game-common, parent
│   └── types/               # headbreaker.d.ts
├── public/                  # favicon, ui/icons SVG, sound-world sfx inventory
├── tests/
│   ├── unit/                # Vitest
│   └── e2e/                 # Playwright
├── docs/                    # SSOT, брифы, ассеты, quality
├── archive/                 # история (не SSOT по HANDOFF)
├── .cursor/                 # rules, skills, agents, commands
├── .github/workflows/       # ci.yml, dependabot
├── scripts/                 # bootstrap SFX для sound-world
└── [корень] HANDOFF, AGENTS, CHANGELOG, идея продукта, README, …
```

### 2.2 Игры (`src/games/*`)

Реестр **`src/games/registry.ts`** — ровно **9** модулей (порядок в массиве):

1. `balloon-pop` — Лопни шарик  
2. `sound-world` — Изучаем звуки с Мяу  
3. `sort-colors` — Куда положить?  
4. `puzzle` — Собери пазл  
5. `shape-build` — Собери фигурку  
6. `hide-seek` — Прятки  
7. `seasons` — Времена года  
8. `meow-home` — В гостях у Мяу  
9. `counting` — Считаем с Мяу  

**Меню:** 8 плиток (`MENU_TILE_IDS` в `src/app/screens/menu.ts`); **`meow-home`** — отдельная CTA «В гости» у Мяу справа, не плитка.

### 2.3 `src/shared/` — файлы и фактическое использование

| Файл | Назначение | Кто импортирует (prod) |
|------|------------|-------------------------|
| `game-module.ts` | контракт `GameModule`, `GameMountContext`, stub factory | все игры, `app/screens/game.ts` |
| `storage.ts` | settings localStorage | shell, parent, puzzle, settings-form |
| `audio.ts` | Web Audio, playUrl, quiet mode | shell, игры, parent |
| `soft-error-chain.ts` | цепочка мягких ошибок | balloon, sort-colors, puzzle, shape-build, hide-seek, counting |
| `soft-error.ts` | `softOk` / `softError` | placement, sort-colors logic |
| `placement.ts` | magnet/match drop | puzzle, shape-build, sort-colors |
| `pointer.ts` | interact drag/drop | sort-colors |
| `placeholders.ts` | CSS-классы фигур/цветов | большинство игр |
| `random.ts` | shuffle, pickOne, RNG | игры, praise |
| `puzzle-photos.ts`, `puzzle-crop-math.ts` | IDB фото, crop 4:3 | puzzle modals |
| `math-captcha.ts` | капча родителей / пазл ⚙ | parent, puzzle-adult-modal |
| `game-task-visual.ts` | иконка задания в chrome | shell, hide-seek |
| `ui-icon.ts` | SVG chrome icons | shell, welcome, menu |
| `balloon-notes.ts` | частоты тонов по цвету | balloon-pop |
| `haptics.ts` | `softPopHaptic` | balloon-pop |
| **`object-bank.ts`** | банк объектов (данные) | **нет импортов в `src/`** — только `tests/unit/object-bank.test.ts` |

### 2.4 `src/content/` (данные без DOM)

| Файл | Назначение | Потребители |
|------|------------|-------------|
| `catalog.ts` | `GAME_IDS`, `ZONES`, `MVP_ZONE_GAMES`, мета игр | router, menu, registry meta, тесты |
| `parent-game-blurbs.ts` | тексты «Развивает / Вместе» для 9 игр | `app/parent/about-games.ts` |

### 2.5 `public/` — фактическое содержимое (24.09.2026)

| Путь | Назначение |
|------|------------|
| `favicon.svg` | favicon + единственная иконка PWA manifest (K-002) |
| `assets/ui/icons/*.svg` | back, home, sound on/off, settings (P15-04) |
| `assets/ui/LICENSE-kenney-game-icons.txt` | лицензия иконок |
| `assets/games/sound-world/sfx/inventory.json` | список id с bootstrapped MP3 (см. §4 sound-world) |
| `assets/_candidates/ui-sounds/LICENSE-kenney-interface-sounds.txt` | кандидаты, не обязательно в UI |
| `assets/_dev-placeholders/bank/LICENSE-kenney-animal-pack-redux.txt` | dev placeholder license |

**Отсутствуют в repo, но referenced в коде:** `public/assets/games/puzzle/scenes/puzzle-*.png`, большинство game art из ASSET-MANIFEST / MEGAFILE (S16).

---

## 3. Архитектура и общие системы

### 3.1 Роутинг и навигация

- **Механизм:** hash `#/…`, парсинг `parseHash` / `routeToHash` (`src/app/router.ts`).
- **Маршруты:** `#/welcome`, `#/` (меню), `#/game/:gameId`, `#/parent`, `#/not-found`.
- **Legacy:** `#/map`, `#/zone/:id`, `#/loading` → welcome или menu (без UI зон).
- **Контроллер:** `src/app/router-controller.ts` (listen hashchange, navigate).
- **GameId:** фиксированный union в `src/content/catalog.ts` — совпадает с registry (9 id).

### 3.2 App shell (`src/app/shell.ts`)

- **Роли:** chrome (back/home/title/scene label/game actions), row mascot+hint+task cue, main для экранов.
- **Скрытие chrome:** welcome, menu, **balloon-pop** (своя полоска в игре) — `chrome.hidden`.
- **Скрытие mascot row:** welcome, menu, balloon, sound-world, sort-colors, puzzle, shape-build, hide-seek — **не скрыт** для seasons, meow-home, counting (код `mascotRow.hidden`, строки ~247–255).
- **Классы корня:** `app-shell--<game-id>` для стилей игр; `app-shell--quiet` при quietMode.
- **Puzzle-only:** `chrome__game-actions` для кнопок +/⚙; капча на смену числа кусочков (`puzzle-adult-modal.ts`).
- **Контекст игры:** `GameMountContext` — settings snapshot, `onSoftHint`, `onTaskVisual`, `onChromeSceneLabel`, `hubNavigation`, `chromeGameActions` (`src/shared/game-module.ts`).

### 3.3 Маскот Мяу

- **Реализация:** CSS placeholder `mascot-ph`, позы `idle|happy|pointing|sleepy|dance` (`src/mascot/index.ts`) — **не PNG**.
- **Где виден:** welcome/menu (свой layout), chrome на части игр (см. выше), внутри игр — локальные элементы (seasons, meow-home, balloon speech и т.д.).
- **counting:** в игровом поле **нет** отдельного mascot DOM (P15-10); подсказки через `mission` + `onSoftHint` (`src/games/counting/index.ts`).

### 3.4 Design tokens / CSS

- **Глобальные переменные:** `--bg`, `--text`, `--accent`, `--font-ui`, `--font-display` (`src/styles/global.css`).
- **Soft-error анимация:** `.soft-wiggle` keyframes в `global.css`.
- **Placeholders:** `src/styles/placeholders.css` + `shared/placeholders.ts` — основной визуал до S16.
- **Per-game CSS:** `src/games/*/*.css` + `shell.css`, `parent.css`, `game-common.css`.

### 3.5 Soft-error

- **Цепочка:** `wrongCount` 1→repeat, 2→nudge, 3+→highlight + wiggle (`src/shared/soft-error-chain.ts`).
- **Игры с chain:** balloon (задания ★), sort-colors, puzzle (постановка кусочка), shape-build, hide-seek (промах), counting (режим order).
- **Без chain:** seasons, meow-home, sound-world (тап = звук/экран), часть balloon free-sky.

### 3.6 Похвала и звук

- **Паттерн:** локальные `praise.ts` + `pickOne` из `shared/random`; SFX через `createAudioManager` — часто **синтетические тоны** (`audio.ts`), файлы — sound-world (`public/assets/games/sound-world/sfx/inventory.json` + bootstrap script).
- **Quiet mode:** музыка off + `allowBrightMotion()` false; SFX/voice остаются (`audio.ts` комментарий В2.1).

### 3.7 PWA / Service Worker

- **Конфиг:** `vite.config.ts` — `registerType: 'autoUpdate'`,
  **`injectRegister: false`**, PNG icons 192/512 + apple-touch-icon/favicon.
- **Workbox glob:** `**/*` — любой файл production-сборки независимо от расширения.
- **Boot:** `src/main.ts` → `boot-loader.ts` → `pwa-boot.ts`; progress получает
  build-generated `precache-manifest.json` из того же Workbox manifest.
- **Build-gate:** `scripts/verify-precache-manifest.mjs` проверяет равенство
  Workbox/progress и полное покрытие app-файлов `dist`.
- **Тесты:** unit + отдельный `npm run test:e2e:boot` через production preview;
  suite обязателен в CI.

### 3.8 Родительский центр

- **Поток:** `#/parent` → мат. капча **каждый вход** (`src/app/parent/captcha.ts`, `parent.ts`) → вкладки **Настройки | Об играх** (P15-12).
- **Настройки:** имя, звук, музыка, тихий режим, скрыть EN алфавит, задания balloon ★, лимит counting 1–3 / 1–10, сброс, тест звука (`settings-form.ts`).
- **Об играх:** `about-games.ts`, тексты `parent-game-blurbs.ts` — 9 игр, черновые описания для родителей.
- **Нет в коде:** лимиты screen time, блокировки по времени, экспорт данных.

### 3.9 Безопасность и лицензии

- **`THIRD_PARTY_NOTICES.md`:** dev deps (Vite, TS, Vitest, Playwright, PWA plugin, jsdom); runtime headbreaker, konva, interactjs — с указанием ISC/MIT.
- **Kenney assets:** LICENSE-файлы в `public/assets/` (ui icons, candidates) — не весь арт подключён в UI.

### 3.10 Последовательность boot

1. `index.html` → `src/main.ts`
2. `mountBootLoader` — splash с % (`boot-loader.ts`, P15-05)
3. `runBootSequence` параллельно регистрирует SW и проверяет каждый URL единого
   `precache-manifest.json`; response body дочитывается полностью.
4. Bounded timeout применяется только к финализации SW после загрузки; 100% не
   публикуются раньше полного списка и readiness.
5. `{ ok: true }` → `loader.unmount()` → `renderShell` (router + chrome + экраны).

### 3.11 Welcome и меню (код)

| Экран | Поведение | Файл |
|-------|-----------|------|
| Welcome | «Добро пожаловать», CTA «Играть», звук и ⚙ снизу по центру; без emoji-маскота на экране | `screens/welcome.ts` |
| Menu | 8 плиток 2×N scroll; Мяу справа + «В гости к Мяu»; ⚙ родители **верхний правый**; назад — **свайп** с левого края 88px | `screens/menu.ts` |
| Первый заход | shell может показать welcome до menu (флаг `bootedWelcome` в `shell.ts`) | `shell.ts` |

### 3.12 Orientation gate

Портрет → оверлей «Поверни планшет»; landscape-only product rule (`orientation-gate.ts`, `isLandscape()` с matchMedia + fallback width/height).

### 3.13 Монтирование игры

`renderGameScreen` (`screens/game.ts`): создаёт host, `loadSettings()`, передаёт срез settings в `game.mount` (без `customPuzzleIds` в context — puzzle читает storage сам). Callbacks связывают chrome hint / task cue / scene label.

### 3.14 Dependabot

`.github/dependabot.yml` — weekly npm + github-actions, prefix `chore(deps)` / `chore(ci)`.

---

## 4. Игры — подробно

Шаблон: процесс → механики → файлы → shared/deps → тесты → долги → docs → ассеты.

---

### Лопни шарик (`balloon-pop`)

**Процесс (код):** небо с шариками; tap лопает (тон по цвету через `balloon-notes.ts`, haptic). Режим **заданий** (если `balloonTasksEnabled`) — 5 шаров, типы задач в `BalloonTask` (`logic.ts`: color, all_color, color_size, one_size, two_big). Свободное небо — 8 шаров (`FREE_FIELD_COUNT`). Собственный chrome в игре; речь Мяу в `.balloon-pop__speech` с HTML только после escape.

**Победа/ошибки:** неверный pop в task mode → soft-error chain; нет game over.

**Файлы:** `index.ts`, `logic.ts`, `layout.ts`, `speech.ts`, `balloon-pop.css`.

**Shared/deps:** audio, placeholders, soft-error-chain, balloon-notes, haptics, random.

**Тесты:** unit `balloon-pop.test.ts`, `balloon-speech.test.ts`, `balloon-layout.test.ts`, `balloon-notes.test.ts`; e2e `balloon-pop.spec.ts`.

**Долги:** финальный voice/art — S16; задания завязаны на род. настройку.

**Docs:** `docs/games/S14-GAMES-INDEX.md` (без отдельного `S14-balloon-pop-BRIEF.md`), `docs/assets/balloon-pop-VOICE-SCRIPT.md`, история — `archive/docs/balloon-pop-s14-superseded.md`.

**Ассеты:** визуал placeholders; PNG шаров в `public/` **не найдены** (glob `public/` — только favicon, ui icons, sfx inventory).

---

### Изучаем звуки с Мяу (`sound-world`)

**Процесс:** вкладки (животные, транспорт, инструменты, буквы RU/EN); карточки с placeholder; tap → SFX если есть в inventory. **Инструменты:** tap открывает `instrument-view.ts` (барабан 4 зоны, пiano 7, guitar 6, maracas×2, tambourine/bell, xylophone 5) + «← К инструментам». EN скрывается `hideEnglishAlphabet`. **Каталог:** 34× `item({…})` в `catalog.ts`; **фильтр UI:** `enabled-ids.ts`. **SFX:** `inventory.json` (~90 id); bootstrap `scripts/bootstrap-sound-world-sfx.ps1`.

**Ошибки:** нет soft-error chain; отсутствующий файл sfx — graceful (inventory + url map).

**Файлы:** `index.ts`, `logic.ts`, `catalog.ts`, `instrument-view.ts`, `letter-grid-layout.ts`, `pagination.ts`, `sfx*.ts`, `placeholder-layout.ts`, `sound-world.css`.

**Shared/deps:** audio, placeholders; без interact.

**Тесты:** unit sound-world*, pagination, letter-grid; e2e `sound-world.spec.ts`.

**Docs:** `S14-sound-world-BRIEF.md`, UX audit, CARD-QUIZ, `docs/assets/sound-world-*`.

**Ассеты:** `public/assets/games/sound-world/sfx/inventory.json`; скрипт `scripts/bootstrap-sound-world-sfx.ps1`. Большинство карточек — CSS placeholders.

---

### Куда положить? (`sort-colors`)

**Процесс:** 5 корзин (цвет = форма иконки `BASKET_ICON_SHAPE`); бусины с фиксированной парой shape→color; drag в корзину (`shared/pointer.ts` + interact). Приветствие по имени textContent. Soft-error chain на неверный drop.

**Правила:** match по shape/цвет (`logic.ts`, `resolveMatchDrop`).

**Файлы:** `index.ts`, `logic.ts`, `praise.ts`, `sort-colors.css`.

**Тесты:** unit `sort-colors.test.ts`; e2e `sort-colors.spec.ts`; также в `games-s09-s12.spec.ts`.

**Docs:** `S14-sort-colors-GAME-POLISH.md`, `sort-colors-ART.md`.

**Ассеты:** placeholders; PNG beads — не в `public/`.

---

### Собери пазл (`puzzle`)

**Процесс:** галерея сцен слева (6 preset + custom photo); доска **frame puzzle** — сетка 4/6/9 (`grid.ts`, настройка ⚙ с капчей); drag (interact) + tap→tap; magnet `resolveMagnetDrop`; celebration, praise/sfx. Фото: crop modal → IndexedDB; ids в `customPuzzleIds` settings.

**Headbreaker:** импорт `Canvas` для `probeHeadbreaker()`; **`mountHeadbreakerPuzzle` не вызывается** из `index.ts` (только `puzzle-headbreaker.ts`). Режим DOM frame — `dataset.mode = 'frame'`.

**Расхождение docs/code:** комментарий в `logic.ts` про «2×2» устарел относительно `puzzle-settings.ts` (4/6/9).

**Файлы:** `index.ts`, `logic.ts`, `grid.ts`, `scene-art.ts`, `seams.ts`, `slot-magnet.ts`, modals, `puzzle-settings.ts`, `puzzle-headbreaker.ts`, `praise.ts`, `puzzle-sfx.ts`, `puzzle.css`.

**Shared/deps:** interact, placement, soft-error-chain, puzzle-photos, storage, math-captcha, audio.

**Тесты:** unit puzzle* (6 файлов), puzzle-photos; e2e `puzzle.spec.ts`.

**Docs:** `S14-puzzle-BRIEF.md`, GAME-POLISH, `puzzle-ART.md`.

**Ассеты:** код ссылается на `public/assets/games/puzzle/scenes/puzzle-*.png` (`scene-art.ts`) — **файлов PNG в repo нет** (fallback gradient + tint).

---

### Собери фигурку (`shape-build`)

**Процесс:** picker 10 шаблонов (`TEMPLATES` в `logic.ts`); слоты с shape+color; drag interact + tap→tap; rect magnet (`slot-magnet.ts`); soft-error chain; chrome без Мяу (shell class).

**Файлы:** `index.ts`, `logic.ts`, `slot-magnet.ts`, `praise.ts`, `shape-build-sfx.ts`, `shape-build.css`.

**Тесты:** unit shape-build*, slot-magnet; e2e `shape-build.spec.ts`.

**Docs:** `S14-shape-build-BRIEF.md`, `shape-build-ART.md`.

**Ассеты:** CSS tint previews `TEMPLATE_PICKER_TINT`; PNG S16.

---

### Прятки (`hide-seek`)

**Процесс:** 5 локаций × 5 целей (`hide-seek/logic.ts`); picker слева; tap по сцене — find/miss; miss → soft-error + **visual cue** (`game-task-visual`); idle hint 6s; shuffle positions после раунда; **подпись локации** в chrome справа (`onChromeSceneLabel`).

**Файлы:** `index.ts`, `logic.ts`, `praise.ts`, `hide-seek-sfx.ts`, `hide-seek.css`.

**Тесты:** unit hide-seek; e2e `hide-seek.spec.ts`.

**Docs:** `S14-hide-seek-BRIEF.md`, `hide-seek-ART.md`.

**Ассеты:** CSS patterns per scene.

---

### Времена года (`seasons`)

**Процесс (P15-09+):** двор-площадка (дом, качели, песочница в DOM); переключатели **сезон** и **погода** (матрица `WEATHER_BY_SEASON`); Мяу на площадке — tap куртка (`displayOutfit`, `coatOn`); радуга только после дождь→солнце (`sunWeatherAfterRain`); снеговик зимой; fx дождь/снег/листья; praise/sfx на смену погоды. **Без режима «задание».**

**Расхождение:** user story в `S14-seasons-BRIEF.md` всё ещё упоминает «дерево и цветок / только песочница» — **код** — полноценная playground-сцена (`seasons/index.ts`, `seasons.css`).

**Файлы:** `index.ts`, `logic.ts`, `praise.ts`, `seasons-sfx.ts`, `seasons.css`.

**Soft-error:** не используется.

**Тесты:** unit `seasons.test.ts`, `seasons-p15.test.ts`; e2e `seasons.spec.ts`.

---

### В гостях у Мяу (`meow-home`)

**Процесс:** периоды суток от системных часов (`periodFromHour`); сцены bathroom / room / night; уход утро/вечер (`careActionsFor`); день — props tap; ночь — звёзды, одеяло; статус-баннер; **без Tamagotchi** (нет hunger/death). Praise/sfx локальные.

**Файлы:** `index.ts`, `logic.ts`, `praise.ts`, `meow-home-sfx.ts`, `meow-home.css`.

**Тесты:** unit meow-home*, meow-home-logic; e2e `meow-home.spec.ts`.

**Docs:** `S14-meow-home-BRIEF.md`, `docs/assets/meow-home-ART.md`.

---

### Считаем с Мяу (`counting`)

**Процесс:** режимы **order** (`🔢`) и **give** (`🎁`, кнопка **`Дай сколько`** — `index.ts` ~125, **не** «Дай Мяу»); counter kinds 🍎/⭐/🐟 → `COUNTER_LABEL` (`counter-kind.ts`); лимит N из settings (3 или 10); mission «Нажми один…» / «Выбери N…» (P15-10); **без mascot на экране игры**; soft-error в order mode; give mission: `Выбери N <counter label>`.

**Файлы:** `index.ts`, `logic.ts`, `counter-kind.ts`, `praise.ts`, `counting-sfx.ts`, `counting.css`.

**Тесты:** unit counting; e2e `counting.spec.ts`.

**Docs:** `S14-counting-BRIEF.md`.

**Расхождение CHANGELOG 0.15.14:** «mascot + mission» — **код 0.15.20+** убрал mascot с экрана (см. CHANGELOG 0.15.20).

---

## 5. Документация проекта

### 5.1 SSOT и порядок чтения (по правилам репо)

1. `HANDOFF.md` → `AGENTS.md` → `docs/05-CURRENT-STATE.md`  
2. Идея: `Планета_Мяу_Идея_продукта.md`  
3. MVP механики: **`docs/games/MVP-GAMES-DETAILED.md`** (HANDOFF); краткая версия — `docs/11-MVP-GAMES-MECHANICS.md`  
4. Ограничения: `docs/product/PRODUCT_CONSTRAINTS.md`  
5. Ассеты: **`docs/assets/MEGAFILE.md`** (утверждён 24.09.2026), `BRANDBOOK.md`, `ASSET-MANIFEST.md`  
6. `archive/` — не SSOT  

**ADR:** `docs/adr/README.md` (каркас). **CHANGELOG:** `CHANGELOG.md` ведётся по версиям 0.15.x.

### 5.2 Таблица markdown-файлов (сводная)

**Легенда актуальности:**  
- **К↔D** — сверено с кодом при составлении этого документа.  
- **D** — только документ, код не сверялся построчно.  
- **A** — архив / superseded.

| Файл | Назначение | Дата/версия в доке | Актуальность |
|------|------------|-------------------|--------------|
| `HANDOFF.md` | старт чата, спринт S16 | 24.09.2026 | К↔D (версия 0.15.22; git commit не проверен) |
| `AGENTS.md` | карта для Cursor | — | D |
| `README.md` | быстрый старт | MEGAFILE «черновик S15» | **Расхождение:** HANDOFF/MEGAFILE утверждён |
| `CHANGELOG.md` | история версий | до 0.15.22 | К↔D (отдельные строки устарели vs код, см. §8) |
| `CONTRIBUTING.md` | процесс | — | D |
| `SECURITY.md` | reporting | — | D |
| `THIRD_PARTY_NOTICES.md` | лицензии npm | 22.09.2026 | К↔D (interact также в puzzle/shape-build) |
| `Планета_Мяу_Идея_продукта.md` | идея 1.0 | — | D (продукт); частично К↔D (9 игр, Pages) |
| `docs/00-PROJECT-OVERVIEW.md` | обзор | — | D |
| `docs/04-DECISION-REGISTER.md` | реестр решений | — | D |
| `docs/05-CURRENT-STATE.md` | текущее состояние | — | D |
| `docs/06-ROADMAP.md` | roadmap | 24.09.2026 | К↔D (нет deploy workflow) |
| `docs/07-SPRINTS.md` | спринты | — | D |
| `docs/08-KNOWN-ISSUES.md` | K-001…K-005 | — | К↔D |
| `docs/09-VISUAL-DESIGN-RESEARCH.md` | исследование UI | — | D |
| `docs/10-GAME-NAMES-RESEARCH.md` | названия | — | D |
| `docs/11-MVP-GAMES-MECHANICS.md` | краткие механики | — | D (дубль с MVP-GAMES-DETAILED) |
| `docs/architecture/ARCHITECTURE.md` | модули | — | К↔D (base, games/shared) |
| `docs/product/PRODUCT_CONSTRAINTS.md` | bans/requirements | ЗАФИКСИРОВАНО | К↔D |
| `docs/planning/P15-SKELETON-POLISH-ROADMAP.md` | P15 план | — | К↔D (P15 закрыт в CHANGELOG) |
| `docs/games/MVP-GAMES-DETAILED.md` | детальные механики | — | D (частично vs P15 правки) |
| `docs/games/S14-GAMES-INDEX.md` | индекс брифов | — | D |
| `docs/games/S14-*-BRIEF.md` (9 игр) | брифы S14 | 24.09.2026 typ. | К↔D (seasons user story vs P15 код) |
| `docs/games/S14-puzzle-GAME-POLISH.md` | polish пазла | — | D |
| `docs/games/S14-sort-colors-GAME-POLISH.md` | polish sort | — | D |
| `docs/games/S14-sound-world-UX-AUDIT.md` | audit | — | D |
| `docs/games/S14-sound-world-CARD-QUIZ.md` | викторина карточек | — | D |
| `docs/assets/MEGAFILE.md` | SSOT ассетов | утверждён 24.09.2026 | D (контент не сверялся с каждым PNG) |
| `docs/assets/BRANDBOOK.md` | бренд | S15 | D |
| `docs/assets/ASSET-MANIFEST.md` | манифест | — | D |
| `docs/assets/*-ART.md`, manifests | арт-спеки | — | D |
| `docs/quality/*` | audit, playbook, agent sources | — | D |
| `docs/evidence/README.md` | evidence | — | D |
| `docs/research/GCOMPRIS-REUSE-ANALYSIS.md` | research | — | D |
| `docs/adr/README.md` | ADR | — | D |
| `archive/**` | superseded | — | A |
| `.cursor/rules/*.mdc` (7) | правила Cursor | — | D |
| `.cursor/skills/**/SKILL.md` (12) | skills | — | D |
| `.cursor/agents/*.md` (4) | subagents | — | D |
| `.cursor/commands/game-polish.md` | /game-polish | — | D |
| `.github/ISSUE_TEMPLATE/*.md` | issues | — | D |

### 5.3 Полный реестр markdown (87 файлов проекта, без `node_modules`)

| # | Файл | Назначение (кратко) | Актуальность |
|---|------|---------------------|--------------|
| 1 | `HANDOFF.md` | handoff спринта | К↔D |
| 2 | `AGENTS.md` | карта Cursor | D |
| 3 | `README.md` | старт, ссылки | К↔D (MEGAFILE строка) |
| 4 | `CHANGELOG.md` | версии | К↔D |
| 5 | `CONTRIBUTING.md` | контриб | D |
| 6 | `SECURITY.md` | уязвимости | D |
| 7 | `THIRD_PARTY_NOTICES.md` | лицензии npm | К↔D |
| 8 | `Планета_Мяу_Идея_продукта.md` | идея продукта | D |
| 9 | `docs/PROJECT-FULL-SUMMARY.md` | этот документ | — |
| 10 | `docs/00-PROJECT-OVERVIEW.md` | обзор | D |
| 11 | `docs/04-DECISION-REGISTER.md` | решения | D |
| 12 | `docs/05-CURRENT-STATE.md` | состояние | D |
| 13 | `docs/06-ROADMAP.md` | roadmap | К↔D |
| 14 | `docs/07-SPRINTS.md` | спринты | D |
| 15 | `docs/08-KNOWN-ISSUES.md` | K-issues | К↔D |
| 16 | `docs/09-VISUAL-DESIGN-RESEARCH.md` | UI research | D |
| 17 | `docs/10-GAME-NAMES-RESEARCH.md` | названия | D |
| 18 | `docs/11-MVP-GAMES-MECHANICS.md` | MVP кратко | D |
| 19 | `docs/adr/README.md` | ADR | D |
| 20 | `docs/architecture/ARCHITECTURE.md` | архитектура | К↔D |
| 21 | `docs/product/PRODUCT_CONSTRAINTS.md` | ограничения MVP | К↔D |
| 22 | `docs/planning/P15-SKELETON-POLISH-ROADMAP.md` | P15 | К↔D |
| 23 | `docs/evidence/README.md` | evidence | D |
| 24 | `docs/research/GCOMPRIS-REUSE-ANALYSIS.md` | GCompris | D |
| 25 | `docs/games/MVP-GAMES-DETAILED.md` | механики детально | D |
| 26 | `docs/games/S14-GAMES-INDEX.md` | индекс S14 | D |
| 27 | `docs/games/S14-counting-BRIEF.md` | counting | D |
| 28 | `docs/games/S14-hide-seek-BRIEF.md` | hide-seek | К↔D |
| 30 | `docs/games/S14-meow-home-BRIEF.md` | meow-home | D |
| 31 | `docs/games/S14-puzzle-BRIEF.md` | puzzle | D |
| 32 | `docs/games/S14-puzzle-GAME-POLISH.md` | puzzle polish | D |
| 33 | `docs/games/S14-seasons-BRIEF.md` | seasons | К↔D |
| 34 | `docs/games/S14-shape-build-BRIEF.md` | shape-build | D |
| 35 | `docs/games/S14-sort-colors-GAME-POLISH.md` | sort-colors | D |
| 36 | `docs/games/S14-sound-world-BRIEF.md` | sound-world | D |
| 37 | `docs/games/S14-sound-world-CARD-QUIZ.md` | викторина | D |
| 38 | `docs/games/S14-sound-world-UX-AUDIT.md` | UX audit | D |
| 39 | `docs/quality/AGENT-CONFIG-SOURCES.md` | agent config | D |
| 40 | `docs/quality/AUDIT_REPORT.md` | audit | D |
| 41 | `docs/quality/S14-AUDIT-BACKLOG.md` | backlog | D |
| 42 | `docs/quality/S14-GAME-REVIEW-PLAYBOOK.md` | playbook | D |
| 43 | `docs/assets/ARCHIVE-POLICY.md` | archive | D |
| 44 | `docs/assets/ASSET-MANIFEST.md` | манифест | D |
| 45 | `docs/assets/MEGAFILE.md` | мегафайл SSOT | D |
| 46 | `docs/assets/BRANDBOOK.md` | брендбук | D |
| 47 | `docs/assets/GENERATION-GUIDE.md` | генерация | D |
| 48 | `docs/assets/FREE-RESOURCES-RESEARCH.md` | free assets | D |
| 49 | `docs/assets/MUSIC-BGM-MANIFEST.md` | музыка | D |
| 50 | `docs/assets/PWA-APP-ICON.md` | иконка PWA | К↔D (K-002) |
| 51 | `docs/assets/UI-ICONS-OWNER-BATCH.md` | UI icons | К↔D |
| 52 | `docs/assets/balloon-pop-VOICE-SCRIPT.md` | голос balloon | D |
| 53 | `docs/assets/hide-seek-ART.md` | art hide-seek | D |
| 54 | `docs/assets/meow-home-ART.md` | art meow-home | D |
| 55 | `docs/assets/puzzle-ART.md` | art puzzle | D |
| 56 | `docs/assets/shape-build-ART.md` | art shape | D |
| 57 | `docs/assets/sort-colors-ART.md` | art sort | D |
| 58 | `docs/assets/sound-world-AUDIO-SOURCES.md` | audio sources | D |
| 59 | `docs/assets/sound-world-CARD-ART.md` | card art | D |
| 60 | `docs/assets/sound-world-MISSING-SFX.md` | missing sfx | D |
| 61 | `archive/README.md` | archive | A |
| 62 | `archive/docs/MEGAFILE-CONCEPT.md` | old mega | A |
| 63 | `archive/docs/balloon-pop-s14-superseded.md` | old balloon | A |
| 64 | `archive/docs/S14-AUDIT-BACKLOG-superseded-2026-09-24.md` | old backlog | A |
| 65 | `archive/docs/S14-hide-seek-superseded-pre-polish.md` | old hide-seek | A |
| 66 | `archive/docs/S14-puzzle-superseded-0.15.6.md` | old puzzle | A |
| 67 | `archive/docs/zones-asset-obsolete.md` | zones | A |
| 68 | `.cursor/agents/architecture-reviewer.md` | subagent | D |
| 69 | `.cursor/agents/evidence-reviewer.md` | subagent | D |
| 70 | `.cursor/agents/test-reviewer.md` | subagent | D |
| 71 | `.cursor/agents/toddler-ux-auditor.md` | subagent | D |
| 72 | `.cursor/commands/game-polish.md` | slash-команда | D |
| 73 | `.cursor/skills/debugging-and-error-recovery/SKILL.md` | skill | D |
| 74 | `.cursor/skills/docs-sync/SKILL.md` | skill | D |
| 75 | `.cursor/skills/evidence-based-kids-content/SKILL.md` | skill | D |
| 76 | `.cursor/skills/evidence-based-kids-content/references/sources.md` | evidence refs | D |
| 77 | `.cursor/skills/game-screen-polish/SKILL.md` | skill | D |
| 78 | `.cursor/skills/git-workflow-github-desktop/SKILL.md` | skill | D |
| 79 | `.cursor/skills/planning-and-task-breakdown/SKILL.md` | skill | D |
| 80 | `.cursor/skills/pwa-offline-audit/SKILL.md` | skill | D |
| 81 | `.cursor/skills/s14-game-review/SKILL.md` | skill | D |
| 82 | `.cursor/skills/security-hardening-pwa/SKILL.md` | skill | D |
| 83 | `.cursor/skills/testing-and-verification/SKILL.md` | skill | D |
| 84 | `.cursor/skills/ux-ui-kids-hub/SKILL.md` | skill | D |
| 85 | `.cursor/skills/ux-ui-kids-hub/reference.md` | UX reference | D |
| 86 | `.github/ISSUE_TEMPLATE/bug_report.md` | GitHub template | D |
| 87 | `.github/ISSUE_TEMPLATE/idea_suggestion.md` | GitHub template | D |

**Примечание:** отдельного `S14-balloon-pop-BRIEF.md` **нет**. Файлы `.cursor/rules/*.mdc` (7 шт.) — не `.md`, в таблицу не входят; перечислены в §6.1. Итого **87** путей `.md` в проекте (без `node_modules`), включая этот summary.

---

## 6. Cursor-конфигурация

### 6.1 Rules (`.cursor/rules/*.mdc`)

| Файл | alwaysApply | globs | Назначение |
|------|-------------|-------|------------|
| `planet-meow-core.mdc` | **true** | — | ядро: HANDOFF, constraints, skills |
| `source-of-truth.mdc` | **true** | — | порядок SSOT |
| `interactive-quizzes.mdc` | **true** | — | AskQuestion для выборов владельца |
| `commands-dispatch.mdc` | **true** | — | `/game-polish` |
| `privacy-and-local-data.mdc` | false | storage, app, content | privacy/XSS |
| `toddler-interaction.mdc` | false | games, shared | soft-error, touch |
| `game-module-boundaries.mdc` | false | games, shared | границы модулей |

### 6.2 Skills (`.cursor/skills/*/SKILL.md`)

| Skill | Назначение (из frontmatter SKILL.md) |
|-------|--------------------------------------|
| `ux-ui-kids-hub` | UX/UI для 2–3 лет, iPad landscape PWA; + `reference.md` |
| `planning-and-task-breakdown` | декомпозиция roadmap/спринтов для владельца |
| `s14-game-review` | проход по 9 играм: gap SSOT↔код, AskQuestion, бриф |
| `game-screen-polish` | двухэтапный polish экрана игры (`/game-polish`) |
| `testing-and-verification` | Vitest + Playwright gate перед «готово» |
| `debugging-and-error-recovery` | падения test/build/typecheck |
| `security-hardening-pwa` | localStorage, XSS, deps, SW |
| `pwa-offline-audit` | offline, vite-plugin-pwa, base path Pages |
| `evidence-based-kids-content` | claims для родителей; `references/sources.md` |
| `docs-sync` | какие docs обновлять после изменений |
| `git-workflow-github-desktop` | коммиты **только** у владельца через GitHub Desktop |

### 6.3 Subagents (`.cursor/agents/`)

| Agent | Назначение (description в YAML) |
|-------|----------------------------------|
| `architecture-reviewer.md` | ревью архитектуры модулей |
| `toddler-ux-auditor.md` | soft-error, touch, без наказаний |
| `test-reviewer.md` | ревью тестов |
| `evidence-reviewer.md` | ревью evidence-claims |

### 6.4 Commands

`.cursor/commands/game-polish.md` → skill `game-screen-polish`.

### 6.5 MCP

**`.cursor/mcp.json` не найден** в репозитории.

---

## 7. Тестирование и качество

### 7.1 Инфраструктура

| Tool | Config | Scope |
|------|--------|-------|
| Vitest 4.1.11 | `vitest.config.ts`, jsdom, alias PWA stub | `src/**/*.test.ts`, `tests/unit/**` |
| Playwright 1.63.0 | `playwright.config.ts`, webServer vite 5173 | `tests/e2e/**`, projects chromium + ipad-chromium |

**Scripts:** `test`, `test:watch`, `test:e2e`, `test:e2e:ui`, `typecheck`, `build`.

### 7.2 Покрытие (обзор)

| Область | Unit | E2E |
|---------|------|-----|
| Все 9 игр | да (logic/layout/sfx) | отдельные spec на каждую + smoke, map-catalog, games-s09-s12 |
| Shell/router/storage/audio | да | smoke, parent-settings |
| PWA boot | да | косвенно smoke |
| object-bank | unit only | — |
| Mascot PNG | — | нет (placeholder) |

**Unit failing/skipped:** **0** (148/148), 24.09.2026.

### 7.3 E2E — файлы и локальный прогон (chromium)

| Spec | Что проверяет |
|------|----------------|
| `smoke.spec.ts` | базовая навигация хаба |
| `map-catalog.spec.ts` | каталог / legacy map |
| `parent-settings.spec.ts` | капча, настройки, вкладки |
| `balloon-pop.spec.ts` | шарики, speech |
| `sound-world.spec.ts` | вкладки, карточки |
| `sort-colors.spec.ts` | drag в корзины |
| `puzzle.spec.ts` | галерея, кусочки |
| `shape-build.spec.ts` | шаблоны, magnet |
| `hide-seek.spec.ts` | локации, find |
| `seasons.spec.ts` | сезон/погода |
| `meow-home.spec.ts` | периоды, уход |
| `counting.spec.ts` | порядок, режим give |
| `games-s09-s12.spec.ts` | smoke puzzle/counting/seasons/meow-home |

**Playwright projects:** `chromium` (CI + локально; локально `channel: 'chrome'` если не CI — K-004); **`ipad-chromium`** — viewport iPad Pro 11 landscape (`playwright.config.ts`), в CI workflow **не** вызывается.

**Локальный прогон 24.09.2026:** **34 passed, 4 failed** (`npm run test:e2e -- --project=chromium`):

| Тест | Вероятная причина (код ↔ тест) |
|------|--------------------------------|
| `counting.spec.ts` — «Дай Мяу» | **Код:** кнопка **`Дай сколько`** (`counting/index.ts`); e2e ищет «Дай Мяу» |
| `games-s09-s12` — счёт «Дай Мяу» | то же рассинхроние label |
| `games-s09-s12` — домик «Умыть» + `chrome__hint` | `onSoftHint` → `chrome__hint` (`shell.ts`); падение может быть из-за текста praise vs matcher `/сияет|Мяu/i` (`meow-home/praise.ts`) |
| `shape-build.spec.ts` — клик «Дом» | Playwright: `#app.app-shell--shape-build` intercepts pointer events |

→ **Расхождение тест↔код** по counting зафиксировано в §8.3. CI на чистой Ubuntu может вести себя иначе по shape-build.

### 7.4 CI

См. §1.4 — `ci.yml`: Node 22, только `--project=chromium`.

### 7.5 Список unit-файлов (`tests/unit/` + co-located)

42 файла в `tests/unit/` + `src/games/sound-world/letter-grid-layout.test.ts`, `pagination.test.ts` → **44** test files total. Ключевые группы: router/shell/storage/audio, captcha/parent-about, по 1–6 файлов на игру, puzzle-photos, object-bank (без prod consumer).

---

## 8. Текущий статус и известные проблемы

### 8.1 Версия и фаза

- **Код:** 0.15.22 (`package.json`); HANDOFF отмечает docs S15 при логике ~0.15.21.
- **S14:** 9/9 игр polish — **ГОТОВО** (docs).
- **P15:** skeleton/polish hub — **ГОТОВО** (CHANGELOG 0.15.15–0.15.21).
- **S15:** MEGAFILE + BRANDBOOK — **ГОТОВО**, мегафайл **утверждён** владельцем.
- **S16:** генерация и подключение ассетов — **в работе**.
- **S17:** выпуск MVP (Pages, offline smoke) — запланировано.

### 8.2 TODO/FIXME в `src/`

**Не найдено** (`grep TODO|FIXME` по `src/`).

### 8.3 Расхождения документация ↔ код (зафиксированы при аудите)

| Тема | Документация | Код |
|------|--------------|-----|
| MEGAFILE статус | README: черновик S15 | HANDOFF, CHANGELOG 0.15.22: **утверждён**, S16 |
| Версия в UI | — | `package.json` 0.15.22 vs `APP_VERSION` **0.13.8** |
| Counting mascot | CHANGELOG 0.15.14 | 0.15.20 / `counting/index.ts` — **нет mascot в игре** |
| Seasons сцена | BRIEF user story: дерево/цветок, песочница | P15: **двор-площадка** DOM |
| Puzzle сетка | `logic.ts` коммент «2×2» | `grid.ts` + settings **4/6/9** |
| Headbreaker | THIRD_PARTY: генерация пазла | **`mountHeadbreakerPuzzle` не вызывается**; frame DOM + interact |
| Puzzle PNG | ASSET paths, scene-art | **`public/assets/games/puzzle/scenes/` отсутствует** |
| object-bank | ASSET-MANIFEST / тесты | **не используется** в production `src/` |
| GitHub Pages deploy | roadmap S17, идея | **нет workflow deploy** в `.github/` |
| interactjs | THIRD_PARTY: sort + shape-build | также **puzzle**, **shape-build** прямой import |
| E2E counting | specs: «Дай Мяу» | UI: **«Дай сколько»** (P15-10) |
| E2E vs CI | 4 failed локально chromium | CI может отличаться; ipad project не в CI |

### 8.4 Known issues (docs)

`docs/08-KNOWN-ISSUES.md`: K-001 AskQuestion; **K-002** PWA icons SVG only; K-005 typescript-eslint vs TS 7.

### 8.5 Относительная «сырость» по коду (факт, не оценка)

- Визуал большинства игр — **CSS placeholders** (`placeholders.css`), не финальный art (ожидается S16).
- **BGM/music** в runtime — в основном задел (`audio.ts`); манифесты в `docs/assets/MUSIC-BGM-MANIFEST.md`.
- **`public/`** минимален (10 файлов на момент glob) — большая часть ассетов ещё не подключена.

---

## 9. Глоссарий

| Термин | Значение |
|--------|----------|
| **Мяу / mascot-ph** | CSS-заглушка маскота, позы data-pose |
| **App shell / chrome** | header back/home/title, hint, task cue |
| **GameModule** | mount/unmount + meta; реестр `registry.ts` |
| **Soft-error chain** | repeat → nudge → highlight после серии промахов |
| **Placeholder** | цветная фигура CSS до PNG S16 |
| **Path A** | логика на заглушках до мегафайла |
| **MEGAFILE** | SSOT промптов/ассетов (утверждён) |
| **P15** | polish скелета хаба и UX без финального art |
| **S14** | owner walkthrough polish 9 игр |
| **Quiet mode** | без музыки и ярких motion-реакций |
| **Frame puzzle** | пазл со слотами по id кусочка, не jigsaw headbreaker UI |
| **ZoneId** | историческая группировка игр; UI зон снят S13 |
| **Hub navigation** | goMenu/goWelcome для игр без chrome (balloon) |

---

## 10. Неопределённости и ограничения документа

1. **Git history:** commit hash в среде агента **не был**; у владельца укажите актуальный hash перед передачей.
2. **E2E:** прогон chromium зафиксирован (34 pass / 4 fail); **ipad-chromium** и CI-окружение Ubuntu **не** прогонялись в этой сессии.
3. **MEGAFILE / BRANDBOOK / ASSET-MANIFEST:** содержимое не верифицировалось построчно против каждого файла в `public/` и каждого CSS-класса.
4. **87 markdown-файлов** (+ 7 `.mdc` rules): для большинства актуальность **D**; явные расхождения — §8.3.
5. **GitHub Pages production URL, SW cache на проде, реальный deploy** — не наблюдались; только конфиг Vite/PWA и docs.
6. **Поведение на реальном iPad** (жесты, Audio unlock, viewport) — по коду и e2e config, не полевые тесты.
7. **Полное описание** `sound-world/catalog.ts` (сотни карточек) и `balloon-pop/logic.ts` (генерация задач) **сокращено** до структур типов и констант; детали — в указанных файлах.
8. **Внутреннее состояние** каждой игры (все edge cases mount/unmount) — описаны основные потоки по `index.ts` + logic; не формальная спецификация.

---

## 11. Карта рассинхрона (файлы, которые расходятся друг с другом или с кодом)

| ID | Тема | Где A | Где B / код |
|----|------|-------|-------------|
| R-01 | Версия UI | `package.json` **0.15.22** | `src/app/version.ts` **0.13.8** |
| R-02 | MEGAFILE | `README.md` «черновик S15» | `HANDOFF.md`, `CHANGELOG` 0.15.22 — утверждён |
| R-03 | Counting UI | e2e: «Дай Мяу» | `counting/index.ts`: «Дай сколько» |
| R-04 | Counting UX | `CHANGELOG` 0.15.14 mascot on screen | `CHANGELOG` 0.15.20 + код — без mascot |
| R-05 | Seasons copy | `S14-seasons-BRIEF` user story (дерево/песочница) | P15 код — двор-площадка |
| R-06 | Puzzle docs | `logic.ts` header «2×2» | `grid.ts` 4/6/9 |
| R-07 | Puzzle engine | `THIRD_PARTY_NOTICES`, `puzzle-headbreaker.ts` | runtime UI — frame + interact only |
| R-08 | object-bank | tests + manifest mentions | нет import в `src/` |
| R-09 | Deploy | roadmap / идея Pages | нет `deploy` workflow |
| R-10 | PWA icons | K-002, `PWA-APP-ICON.md` | manifest: только `favicon.svg` |

---

*Конец документа `docs/PROJECT-FULL-SUMMARY.md` (версия снимка: npm **0.15.22**, дополнено 24.09.2026).*
