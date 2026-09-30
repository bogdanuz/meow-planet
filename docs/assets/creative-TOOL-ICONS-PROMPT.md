# Иконки инструментов раскраски и рисовалки

Дата: **30.09.2026**. Один лист, один промпт. Стиль только как у `assets-master/reference/ref-ui-icons.jpg`: мягкая гуашь, толстый мягкий контур, округлые формы.

Назад, звук и шестерёнка уже есть в игре. Их на этом листе нет.

## Куда положить файл

Мастер листа: `assets-master/games/creative/tool-icons.jpg`.

Нарезанные картинки уже лежат в `public/assets/games/creative/icons/`. Если лист заменят, повторить `node scripts/slice-tool-icons.mjs`.

## Как убрать белый

Модель прозрачность не делает. Фон листа — чистый белый `#FFFFFF`. Внутри предметов белого нет: бумага кремовая, отверстия бежевые.

Убери только белый фон листа. Предметы не разъезжай и не меняй порядок. Если белое останется между ними, я уберу его при нарезке.

## Порядок на листе

Слева направо, сверху вниз. Четыре ряда по четыре предмета. Пустых клеток нет.

| | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| Ряд 1 | Отмена | Новый лист | Палитра | Картинки |
| Ряд 2 | Кисть | Фломастер | Мелок | Акварель |
| Ряд 3 | Заливка | Ластик | Тонкая | Толстая |
| Ряд 4 | Фон | Темы | Галерея | Ещё |

Если модель переставит предметы, добавит лишний или домик со стрелкой — лист перегенерировать. Резать перепутанный лист нельзя.

## Промпт

Image A = `assets-master/reference/ref-ui-icons.jpg`.

```
Use Image A as the exact icon style. Match its soft gouache texture, thick soft outline, rounded toy-like shapes, pastel warm colors, and even flat light. Do not copy the house, the straight arrow, the speaker, or the gear.

Subject: sixteen separate tool icons for a toddler drawing app, each one a single chubby object. Same visual weight, same outline thickness as Image A.

Row 1, left to right:
1. Undo: one thick curved arrow sweeping back toward the left, the same blue as the arrow in Image A, with a rounded tail. Not a straight arrow.
2. New sheet: one blank cream page with a folded top-right corner. No writing.
3. Palette: one rounded artist palette in warm cream, with exactly four large paint dots: red, yellow, blue, green.
4. Pictures: one cream card with one big simple red ball painted on it.

Row 2, left to right:
5. Brush: one long paintbrush, orange handle, flat brown bristles.
6. Marker: one chubby purple felt marker with a broad chisel tip.
7. Crayon: one yellow wax crayon with a paper wrapper and a rounded tip.
8. Watercolor: one short round brush with a plump blue tip. It must not look like the long flat brush.

Row 3, left to right:
9. Fill bucket: one light-blue paint pail with a rounded handle and one paint drip. Not a trash bin.
10. Eraser: one pink rubber eraser, slightly tilted.
11. Thin stroke: one short horizontal painted stroke, skinny, dark plum, centered in its area.
12. Thick stroke: one short horizontal painted stroke, very fat and rounded, the same dark plum and the same length as the thin stroke, centered in its area.

Row 4, left to right:
13. Background: one small rounded landscape card, pale blue sky, one yellow sun, one green hill.
14. Themes: three small overlapping rounded cards, yellow, blue, and green, with nothing drawn on them.
15. Gallery: three overlapping picture cards. The front card shows one simple yellow sun. The cards behind are peach and blue.
16. More: exactly three large chubby dots in a row, red, yellow, and blue, grouped as one icon.

Action: every object is still.
Location: the entire sheet background is one solid flat pure white #FFFFFF. No pure white inside any object. Paper and card faces are warm cream. Holes and folds are warm beige. No scenery behind the icons.
Composition: square 1:1. A strict 4 by 4 grid. Wide even white gaps, at least as wide as half an icon. Every icon is centered in its own cell and a similar size. No black rules, no cell borders, no frames, no shadows, no extra objects, no empty cells.
Style: the same warm children's book gouache as Image A. Clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm colors, calm and friendly, made for a toddler app.
Lighting: flat and even.
Text: the image contains no letters, no numbers, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 2K.
```
