# S14 — «Прятки» (hide-seek) — бриф

**Дата:** 24.09.2026 · **Статус:** **ЗАФИКСИРОВАНО — S14 закрыта · код 0.15.11**

SSOT арта (черновик): **`docs/assets/hide-seek-ART.md`**  
Устаревшее (до polish): **`archive/docs/S14-hide-seek-superseded-pre-polish.md`**

## User story

Ребёнок 2–3 лет выбирает **картинку локации**, видит **одну строку** «Найди …!» и короткий статус, тапает **полупрячущийся** предмет на **большой** сцене 4:3; успех — похвала и звук; промах — мягко, с **картинкой-подсказкой**; после паузы — покачивание цели.

## Путь ребёнка (код 0.15.11)

1. «Прятки» из «Уголки планеты».
2. Слева — **5 превью** локаций (комната, поляна, пляж, лес, площадка), по вертикали **по центру**.
3. Над сценой — **mission bar:** иконка цели · **«Найди …!»** · статус («Ищи дальше!», похвала…).
4. Сцена — паттерн-фон CSS (до PNG S16), **5** целей; найденные полупрозрачные.
5. Успех → praise/sfx → новая цель; все 5 на локации → **celebration** → **новые случайные места** предметов, новый круг.
6. Промах → soft-error + picture-hint; **6 с** idle → `is-hinting` + pulse mission.

## Сейчас в коде

- `src/games/hide-seek/` — `HIDE_SCENES` 5×5, `shuffleTargetPositions`, `pickTarget`, `evaluateTap`.
- Shell: `app-shell--hide-seek` — компактный chrome, **без** Мяу / task-cue / дублирующего hint.
- `praise.ts`, `hide-seek-sfx.ts`; e2e `tests/e2e/hide-seek.spec.ts`.

## Решения викторины (24.09.2026)

| ID | Решение |
|---|---|
| hs_scope | layout, chrome, hide_vis **B1**, find_fx, praise_sfx, round_celebrate |
| hs_scenes | **5** локаций, **5** предметов, **паттерн-фоны** |
| hs_meow_copy | «Найди …!»; промах — **картинка + текст** (overlay) |
| hs_idle | **6 сек** |
| hs_task_cue | Иконка в **mission bar** (не chrome task-cue) |
| hs_mission_ux (24.09) | Задание + статус **в одной строке**; галерея локаций **по центру** по вертикали |
| hs_layout_shuffle (24.09) | После раунда / смены сцены — **новые `%`** через `shuffleTargetPositions` |

## Осталось на S16

PNG фоны HIDE-01…05, опциональные спрайты объектов, голос «Найди …» — `hide-seek-ART.md`, GENERATION-GUIDE §16.

## Ассеты

`hide-seek-ART.md`, `ASSET-MANIFEST` § Прятки.
