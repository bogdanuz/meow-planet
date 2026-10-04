# S14 — индекс игр (SSOT после прохода)

**Спринт S14:** **ГОТОВО** 24.09.2026 · **package.json:** **0.15.22** (версии в таблице — polish каждой игры, не номер пакета)

Механики MVP: `docs/games/MVP-GAMES-DETAILED.md`. Ограничения: `docs/product/PRODUCT_CONSTRAINTS.md`.

| # | Игра | id | Код | Бриф / polish doc | Арт (S16) |
|---:|---|---|---|---|---|
| 1 | Лопни шарик | balloon-pop | 0.15.31 | `S16-GAME-CONTENT-WORKFLOW.md`, `balloon-pop-VOICE-SCRIPT.md`, GENERATION-GUIDE §7.1 | **S16 ГОТОВО** (арт + 39 фраз, 26.09.2026) |
| 2 | Изучаем звуки с Мяу | sound-world | 0.15.32 | `S14-sound-world-BRIEF.md`, `S16-GAME-SCREEN-PATTERN.md` | `sound-world-CARD-ART.md` — **промпты готовы**, ждём JPEG |
| 3 | Куда положить? | sort-colors | 0.16.5 | **`S16-sort-colors-BRIEF.md`** (новая механика; `S14-sort-colors-GAME-POLISH.md` — история) | `sort-colors-ART.md` + `sort-colors-VOICE-SCRIPT.md` — **S16 ГОТОВО** (арт + 158 фраз, 01.10.2026) |
| 4 | Собери пазл | puzzle | 0.16.9 | **`S16-puzzle-BRIEF.md`** (экран S16; `S14-puzzle-BRIEF.md` — история механики) | `puzzle-ART.md` — **арт владельца в игре, 17 картинок** |
| 5 | Собери что угодно! | shape-build | 0.17.0 | **`S16-shape-build-BRIEF.md`** (песочница 2.1 с физикой и онбордингом; «Собери фигурку» и S14 — `archive/docs/shape-build-v1/`) | `shape-build-ART.md` — **весь арт в игре**: карточка, иконки (перерисованы в общем стиле), 2 листа деталей, комната, шкаф; голоса нет |
| 6 | Прятки | hide-seek | 0.15.11 | `S14-hide-seek-BRIEF.md` | `hide-seek-ART.md` |
| 7 | Времена года → двор в «В гости» (01.10.2026) | seasons → `meow-home/yard.ts` | 0.21.0 | `S16-meow-home-BRIEF.md` (`S14-seasons-BRIEF.md` — история) | арт двора в `meow-home-ART.md` |
| 8 | В гости | meow-home | 0.21.0 | **`S16-meow-home-BRIEF.md`** (прихожая, комнаты, желания, двор с погодой и одеждой; `S14-meow-home-BRIEF.md` — история) | `meow-home-ART.md` — **весь арт (Cursor) в игре**; фразы текстом (`meow-home-VOICE-SCRIPT.md`), голос — после просмотра |
| 9 | Учимся считать | counting | 0.20.1 | **`S16-counting-BRIEF.md`** (ящик, коврик, цифры, «Свободно» / «Задание»; `S14-counting-BRIEF.md` — история) | `counting-ART.md` — **фон и цифры (Cursor) в игре**, игрушки из «Куда положить?»; голос владельца — все 232 фразы (`counting-VOICE-SCRIPT.md`) |

## Архив (не читать для текущей работы)

| Файл | Зачем |
|---|---|
| `archive/docs/S14-puzzle-superseded-0.15.6.md` | peek / headbreaker MVP |
| `archive/docs/S14-hide-seek-superseded-pre-polish.md` | прятки до 5×5 |
| `archive/docs/S14-AUDIT-BACKLOG-superseded-2026-09-24.md` | старый audit backlog |
| `archive/docs/balloon-pop-s14-superseded.md` | ранние решения шариков |

## Вспомогательные (sound-world)

`S14-sound-world-CARD-QUIZ.md`, `S14-sound-world-UX-AUDIT.md` — история викторин; SSOT поведения — **бриф + код 0.15.0**.

## После S14

- **S15:** утверждение `docs/assets/MEGAFILE.md`
- **Правки от владельца:** продолжаются; обновлять бриф + CHANGELOG, не откатывать статус S14 без решения
