# AGENTS.md — карта проекта для Cursor

**Планета Мяу** — PWA-хаб мини-игр, iPad landscape, дети 2–3 лет.

## Старт

1. `HANDOFF.md` → этот файл → `docs/05-CURRENT-STATE.md`
2. Продукт: `Планета_Мяу_Идея_продукта.md`
3. Ограничения MVP: `docs/product/PRODUCT_CONSTRAINTS.md`
4. Архитектура: `docs/architecture/ARCHITECTURE.md`

**Спринт / версия** — только в `HANDOFF.md` и `docs/05-CURRENT-STATE.md` (сейчас: **S16** — welcome/menu ✅, balloon-pop ✅, sound-world ✅, sort-colors ✅ (арт + голос), **puzzle** ✅ (арт владельца, 17 картинок), **shape-build** ✅ («Собери что угодно!» 2.1 — песочница с физикой planck.js и онбордингом, арт владельца, переработанные механизмы, большая комната, 35 готовых машин, тап/удержание, живые Мяу и Олли, ракетный рюкзак и парашют; ждём проверку на iPad), **hide-seek** ✅ («Прятки» — 6 сцен, случайные укрытия, уровни видимости, озвучка владельца; ждём проверку на iPad), **counting** ✅ («Учимся считать» — ящик, коврик с игрушками «Куда положить?», цифры, «Свободно» / «Задание»; озвучка владельца, ждём проверку на iPad), **meow-home** ⏸ («В гости» — код и арт 0.21.0 есть, но в меню снова заглушка до доработки, см. `BACKLOG.md`); код **0.22.2**). В хабе есть post-MVP «Рисовалка» (раскраска — один из её фонов). «Времена года» — двор внутри «В гости» (`src/games/meow-home/yard.ts`). Экран игр: `docs/games/S16-GAME-SCREEN-PATTERN.md`.

Ассеты: **`docs/assets/ASSET-PRODUCTION-PLAYBOOK.md`**, промпты **`GENERATION-GUIDE.md`**, реестр **`ASSET-MANIFEST.md`**, стиль **`BRANDBOOK.md`**. Старый мегафайл — в `archive/docs/assets-pre-consolidation/`, не SSOT.  
Offline/precache: **`docs/quality/PWA-OFFLINE-GUARDRAILS.md`** + ADR-0001.
`archive/` — историзм, не источник истины.

## Rules (`.cursor/rules/`)

| Rule | Назначение |
|---|---|
| `planet-meow-core.mdc` | Короткое always-on ядро + ссылки |
| `source-of-truth.mdc` | Порядок чтения SSOT |
| `interactive-quizzes.mdc` | AskQuestion для выборов владельца |
| `game-module-boundaries.mdc` | `src/games` / `shared` |
| `toddler-interaction.mdc` | Soft-error, touch, без наказаний |
| `privacy-and-local-data.mdc` | localStorage, XSS, privacy |
| `pwa-precache-integrity.mdc` | Всегда: любой runtime-файл → полный precache + production boot QA |
| `game-chrome-universal.mdc` | Всегда: одинаковые кнопки игр (назад, звук, шестерёнка справа, «Галерея», «Своё фото»), настройки по разделам |
| `targeted-testing.mdc` | Всегда: тестировать только изменённое и пересекающееся; полный прогон — только по слову владельца («проверь всё», «все игры») |

## Skills (`.cursor/skills/`)

| Skill | Когда |
|---|---|
| `ux-ui-kids-hub` | Любой экран / UI |
| `planning-and-task-breakdown` | План до кода |
| `s14-game-review` | Разбор игры, викторина, бриф → код (индекс: `docs/games/S14-GAMES-INDEX.md`) |
| `game-screen-polish` | `/game-polish` — аудит экрана игры → план → AskQuestion → polish (см. `.cursor/commands/game-polish.md`) |
| `testing-and-verification` | TDD strict + quality gate |
| `debugging-and-error-recovery` | Падения тестов/сборки |
| `security-hardening-pwa` | Ввод, storage, deps |
| `pwa-offline-audit` | SW, offline, Pages |
| `evidence-based-kids-content` | Тексты для родителей / польза |
| `docs-sync` | Какие docs обновлять |
| `git-workflow-github-desktop` | Коммиты только у владельца |

Upstream: `docs/quality/AGENT-CONFIG-SOURCES.md`

## Subagents (`.cursor/agents/`)

`architecture-reviewer`, `toddler-ux-auditor`, `test-reviewer`, `evidence-reviewer` — по описанию в файлах.

## Викторины

AskQuestion + «Свой вариант (напишу в чат)» → см. `interactive-quizzes.mdc`. K-001 если кнопок нет.

## Команды

**Cursor:** `/game-polish` или `/game-polish <game-id>` → `.cursor/commands/game-polish.md` + skill `game-screen-polish`.

```bash
npm install
npm run dev
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run test:e2e:boot
```

## После задачи

Тесты по skill `testing-and-verification` — **точечно** (только сделанное и то, что
с ним пересекается, `targeted-testing.mdc`); полный `npm run test` / `npm run test:e2e` —
только когда владелец просит проверить всё; любой runtime-файл/ассет обязан пройти
`npm run build` и `npm run test:e2e:boot`; docs по `docs-sync`; владельцу —
простым языком + сообщение для GitHub Desktop.

Локальный просмотр: агент поднимает `npm run dev` и даёт ссылку (см. `docs/06-ROADMAP.md`).
