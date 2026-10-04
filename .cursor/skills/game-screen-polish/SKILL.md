---
name: game-screen-polish
description: >-
  Двухэтапный polish экрана игры Планета Мяу: живой аудит в браузере, UX/UI/звук для 2–3 лет,
  рыночные референсы, план и AskQuestion, затем код и тесты. Триггеры: «улучши игру»,
  «улучшение игра и экран», «сделай конфетку из игры», «аудит UX UI игры», «полиши экран»,
  «доведи игру до идеала», «проведи ревью текущей игры», `/game-polish`, `/game-polish <game-id>`.
---

# Game screen polish (Планета Мяу)

Обобщённый цикл после успешного прохода **sound-world** (S14). Дополняет, не заменяет: **`s14-game-review`** (бриф, викторина состава, продуктовые туры S14) и **`ux-ui-kids-hub`**.

## Как владельцу запустить

1. Откройте файлы игры (`src/games/<game-id>/`) или игру в браузере, либо напишите **`/game-polish`** или **`/game-polish balloon-pop`**.
2. Агент сам определит `game-id` (открытые файлы, `git diff`/`status`, аргумент команды).
3. Дождитесь **Этапа 1** (отчёт + AskQuestion) → подтвердите объём → **Этап 2** (код).

## Старт (обязательно)

1. `HANDOFF.md` → `AGENTS.md` → `docs/05-CURRENT-STATE.md`
2. `docs/product/PRODUCT_CONSTRAINTS.md`, `docs/architecture/ARCHITECTURE.md`
3. Игра: `src/games/<game-id>/`, бриф `docs/games/S14-<game-id>-BRIEF.md` (если есть), `docs/11-MVP-GAMES-MECHANICS.md`
4. Skills: `ux-ui-kids-hub`, `testing-and-verification`, `docs-sync`, `git-workflow-github-desktop`
5. Subagents по необходимости: `toddler-ux-auditor`, `test-reviewer`

## Определение game-id

| Сигнал | Действие |
|--------|----------|
| Аргумент `/game-polish foo` | `foo` |
| Путь `src/games/<id>/` в фокусе или diff | `<id>` |
| E2E `tests/e2e/<id>.spec.ts` | `<id>` |
| Неясно | **AskQuestion**: какая игра |

---

## ЭТАП 1 — только аудит и план (без правок файлов)

### 1a. Живая проверка

- `npm run dev`, открыть игру в браузере / Playwright (landscape iPad, телефон, reload, offline по возможности).
- Пройти все вкладки/экраны механики; консоль без ошибок; скриншоты «до».
- **Не** считать код без просмотра UI достаточным.

### 1b. Рыночный контекст (до финального плана)

- Поиск: похожие мини-игры 2–4 лет (веб, app store описания), open-source механики (**лицензия** перед заимствованием кода).
- Kids educational UI / книжная иллюстрация — не взрослые dashboard-паттерны.
- В отчёте явно: **из референса** vs **наше решение**.

### 1c. Аудит (адаптировать под механику игры)

Оценить только то, что реально слабо; **не** предлагать менять уже соответствующее стандарту.

| Направление | На что смотреть |
|-------------|-----------------|
| Композиция / иерархия | Пустота экрана, центрирование, scroll vs «всё на одном экране» |
| Touch 2–3 лет | ~56–64 CSS px, зазоры, буквы/мелкие плитки |
| Визуал | Плейсхолдеры, повторы, контраст, бренд |
| Звук | Длина, громкость, наложение, эмоциональная безопасность; sfx gating |
| Мяу / chrome | Маскот, подсказки родителю — продуктовые решения. Шапка по `game-chrome-universal.mdc`: назад + звук слева, инструменты с подписью справа, шестерёнка крайняя (только если владелец сказал), «Галерея» / «Своё фото» — общие названия и иконки |
| A11y / техника | SW, offline, HEAD/false 200 HTML для ассетов, PWA glob |
| Soft-error | Без наказаний, wiggle/тишина где задумано |

**Звук (если игра со sfx):** `inventory.json`, `sfx-url.ts` (Content-Type), `sfx-playback.ts`, `stopSfx`, `THIRD_PARTY_NOTICES.md`, `docs/assets/sound-world-*` как образец для sound-world; для других игр — свой каталог.

### 1d. План для владельца

Структура отчёта:

1. Проблемы UX/UI (почему плохо для 2–3 лет)
2. Как будет после правок
3. Приоритеты **P0–P3**
4. Звуки/ассеты: найдено / на выбор владельца / MISSING doc
5. Файлы create/change/delete
6. Тесты (unit/e2e)

**AskQuestion** (`.cursor/rules/interactive-quizzes.mdc`): объём, спорные UX, звуки, маскот — в каждом вопросе **«Свой вариант (напишу в чат)»**.

**Стоп.** Без явного подтверждения — **не** Этап 2.

---

## ЭТАП 2 — после подтверждения

1. Только согласованный объём; TDD → `testing-and-verification`
2. Живые проверки снова; скриншоты «после»
3. **Не** копировать shared: паттерн в `src/shared` + дизайн-токены, если устойчивый
4. Docs: `docs-sync`, `04-DECISION-REGISTER.md`, бриф игры, CHANGELOG при заметных изменениях
5. Quality gate: typecheck, test, build, e2e для игры
6. Владельцу: простой язык + текст коммита для GitHub Desktop (**не** git commit в терминале)

### Звук (если в scope)

- Лицензии → `THIRD_PARTY_NOTICES.md`
- Длинные клипы → `sfx-playback.ts` + `stopSfx()` без наложения
- Resolve URL → не доверять HEAD `text/html` (см. `src/games/sound-world/sfx-url.ts`)

---

## Связь с другими skills

| Skill | Когда |
|-------|--------|
| `s14-game-review` | S14: состав карточек, бриф, викторины продукта |
| `ux-ui-kids-hub` | Любой UI экрана |
| `pwa-offline-audit` | SW, precache, base path |
| `security-hardening-pwa` | storage, deps |

## Эталон в репо

Полный проход: **sound-world** — pill RU/ABC, `placeholder-layout.ts`, `sfx-url.ts`, `sfx-playback.ts`, `audio.stopSfx`, e2e `tests/e2e/sound-world.spec.ts`.
