# S14 game-polish — «Собери пазл» (puzzle)

**Дата:** 24.09.2026 · **Статус:** **S14 ЗАВЕРШЕНО** (код **0.15.8**)

Полный бриф и механика: **`S14-puzzle-BRIEF.md`**. Арт и промпты: **`docs/assets/puzzle-ART.md`**.

## Эволюция (кратко)

| Версия | Суть |
|---|---|
| 0.15.6 | headbreaker+konva, peek, превью-галерея (часть отменена позже) |
| 0.15.7 | **Рама toddler** 2×2+, magnet rect, tap-tap, resize без remount |
| 0.15.8 | 4:3, фото **+** в игре, 4/6/9, швы, sfx, vertical gallery, float drag, **без peek** |
| 0.15.8+ | target-hint на слот, scale кусочка select/drag |

## Механика (актуально)

| Элемент | Решение |
|---|---|
| Кусочки | Прямоугольная сетка **4 / 6 / 9**; не interlock |
| Подсказки | Силуэт в слоте + **подсветка целевого слота** при выборе/драге |
| Ввод | Drag (float) + **тап→тап** |
| Soft-error | Кусочек остаётся, звук «мягкий промах», цепочка подсказок |
| Финал | Швы сходятся, glow; arpeggio complete |
| Chrome | Без Мяu; **+** фото, **⚙** настройки (капча) |
| Сцены | 6 id + custom IDB; PNG — S16 |

## Педагогика / UX

- Крупная доска на iPad landscape, лоток снизу, галерея **слева** (без чтения длинных подписей).
- Ребёнок видит **куда** положить (hint), не «угадывает вслепую».
- Короткая сессия: 4–9 шагов; 6/9 — для старших 3 лет с взрослым.

## Код (якорные файлы)

`src/games/puzzle/` — `index.ts`, `puzzle.css`, `grid.ts`, `slot-magnet.ts`, `seams.ts`, `scene-art.ts`, `puzzle-sfx.ts`, `praise.ts`, `puzzle-crop-modal.ts`, `puzzle-adult-modal.ts`

## Ассеты S16

`public/assets/games/puzzle/scenes/puzzle-*.png` — см. **`puzzle-ART.md`**.
