# «Куда положить?» — рисунки (S16, sort-colors)

**Дата:** 01.10.2026 · **Механика:** [S16-sort-colors-BRIEF.md](../games/S16-sort-colors-BRIEF.md) · **Озвучка:** [sort-colors-VOICE-SCRIPT.md](sort-colors-VOICE-SCRIPT.md)

Старые промпты S14 (5 корзинок форма = цвет) больше не действуют.

**Статус:** все 10 мастеров получены и в игре с 01.10.2026. Ящик пришёл прямоугольным (вид спереди-сверху, справа боковая стенка), не круглой кадкой. Под него в `src/games/sort-colors/art.ts` (`ART_BIN`) заданы линия переднего края, проём для горки и место наклейки. Если ящик перерисуется, эти доли нужно снять заново по скриншоту.

## Что нужно нарисовать

| # | Файл мастера (кладёте вы) | Что на нём | Что делает Cursor |
|---|---|---|---|
| 1–7 | `sort-toys-<вид>.jpg` (7 штук) | один предмет в 4 цветах в ряд | режет на 28 PNG |
| 8 | `sort-bin.jpg` | один пустой ящик | вырезает фон, PNG |
| 9 | `sort-stickers.jpg` | 7 наклеек в ряд | режет на 7 PNG |
| 10 | `sort-playroom.jpg` | фон «детская» 4:3 | WebP на весь экран |

Папка мастеров: `assets-master/games/sort-colors/`. После каждого файла напишите в чат «готово sort-toys-ball» (или другое имя). Cursor запустит `npm run assets:sort-colors`. Порядок: сначала **мячик** и **ящик** — по ним проверяем стиль и масштаб, потом остальные.

`<вид>`: `ball` мячик · `cube` кубик · `star` звёздочка · `pyramid` пирамидка · `heart` сердечко · `duck` уточка · `ring` колечко.

**Image A** во всех промптах — `assets-master/reference/ref-style-board.jpg` (только краска и линия).  
**Image B** для предметов — `public/assets/menu/card-counting.png` (как выглядит объём кубиков: вид 3/4, блик сверху слева, тень снизу справа).

## Цвета (одинаковые на всех 7 листах, слева направо)

| Место | Цвет | Hex-ориентир |
|---|---|---|
| 1 | красный (tomato red) | `#E8503F` |
| 2 | жёлтый (sunflower yellow) | `#F4C23A` |
| 3 | синий (cornflower blue) | `#4A8BD6` |
| 4 | зелёный (grass green) | `#55AE5C` |

## Фраза стиля (дословно в каждый промпт)

`warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app`

---

## 1–7. Листы предметов — `sort-toys-<вид>.jpg`

Один и тот же шаблон, меняется только строка **Subject** из таблицы ниже.

```
Subject: four copies of the same chunky toddler toy standing in one horizontal row, identical shape and size, only the color differs: 1) tomato red #E8503F, 2) sunflower yellow #F4C23A, 3) cornflower blue #4A8BD6, 4) grass green #55AE5C. The toy: {SUBJECT}.
Action: each toy rests calmly, seen from a slight three-quarter view from above so its volume reads clearly.
Location: solid flat pure white #FFFFFF background, no floor, no cast shadow on the background, no table.
Composition: 4:1 wide row, four equal invisible cells, each toy centered in its cell and filling about 75% of the cell height, clear white gap of at least one toy-width/4 between toys, nothing touching the image edges.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app. Painted soft volume like the toy blocks in Image B: lighter highlight on the upper-left, deeper warm shade on the lower-right, matte gouache, not glossy plastic, not a 3D render.
Lighting: soft even daylight from the upper left.
References: Image A = brush texture and outline only. Image B = how much volume and which viewing angle, not the objects or colors.
The image contains no letters, no numbers, no logo, and no watermark. No faces on the toys except the duck.
Aspect ratio: 21:9 (or the widest available). Resolution: 4K.
```

| Вид | `{SUBJECT}` |
|---|---|
| ball | a round soft rubber toddler ball, one simple curved stripe band around it in a slightly lighter tint of the same color |
| cube | a rounded wooden toy block cube with softly bevelled edges, three faces visible, plain faces without letters or numbers |
| star | a plump five-point star toy block with thick depth and rounded tips, front face and side thickness visible |
| pyramid | a chunky triangular toy building block (a triangular prism like a construction-set roof piece), thick depth, rounded corners, front triangle face and side visible |
| heart | a plump rounded heart-shaped toy block with thick depth, front face and side thickness visible |
| duck | a classic rubber bath duck toy facing left, small orange beak, two simple dot eyes, rounded body; the body is the cell color, the beak stays orange on all four |
| ring | a single thick stacking ring from a toddler ring-stacker toy, a fat rounded donut shape with a clear hole in the middle, seen from slightly above so the hole is visible |

**Проверка:** четыре одинаковые формы, разные только цветом; между ними белое поле; у уточки клюв везде оранжевый, а у синей уточки тело синее.

---

## 8. Ящик — `sort-bin.jpg`

```
Subject: one empty open plastic toddler toy storage tub, creamy off-white plastic #F7EEDC with a soft warm shade, rounded rectangular shape, slightly wider at the top, thick rounded rim. The front wall is smooth and completely plain (a picture label will be added later, so leave the front wall empty).
Action: static, viewed from the front and above at about 45 degrees so the inside floor and the inner back wall are clearly visible.
Location: solid flat light sky-blue #D6EEF8 background, no floor, no cast shadow on the background.
Composition: single tub centered, filling about 80% of the width, symmetric left and right, the whole rim fully visible, nothing touching the edges.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app. Soft painted volume, matte, not glossy plastic, not a 3D render.
Lighting: soft even daylight from the upper left.
References: Image A = brush texture and outline only. Image B = public/assets/menu/card-sort-colors.png, only the idea of an open plastic tub seen from above.
The image contains no letters, no logo, no label, no handles with holes, and no watermark.
Aspect ratio: 4:3. Resolution: 2K.
```

**Проверка:** внутри видно дно и заднюю стенку; передняя стенка гладкая, пустая; ящик ровно по центру.

---

## 9. Наклейки — `sort-stickers.jpg`

Порядок слева направо: мячик, кубик, звёздочка, пирамидка, сердечко, уточка, колечко.

```
Subject: seven square picture-label stickers in one horizontal row, each a soft rounded square of pale cream paper #FFF7E8 with a thin darker cream edge. On each sticker one simple toy drawing in dark navy line #26365E with a very light pale-blue fill #E3ECF7, no other colors, in this order: 1) a round ball with one curved stripe, 2) a toy block cube in three-quarter view, 3) a plump five-point star, 4) a triangular toy block, 5) a plump heart, 6) a rubber bath duck facing left, 7) a fat stacking ring with a hole.
Action: flat, front facing.
Location: solid flat light sky-blue #D6EEF8 background.
Composition: seven equal stickers in one row with clear gaps between them, the drawing fills about 70% of each sticker, same line thickness on all seven.
Style: warm children's book illustration style, soft gouache line, thick soft outline, gentle rounded shapes, calm and friendly, made for a toddler app. Simple and very readable at small size.
References: Image A = line quality only.
The image contains no letters, no numbers, no logo, and no watermark.
Aspect ratio: 21:9 (or the widest available). Resolution: 4K.
```

**Проверка:** на наклейках нет цвета, кроме тёмно-синей линии и бледно-голубой заливки; все 7 одинаковой толщины линии.

---

## 10. Фон — `sort-playroom.jpg`

```
Subject: an empty cozy toddler playroom, warm cream wall with a very soft pattern in the upper part, a light honey wooden floor, a large soft oval rug in a calm warm pastel color lying on the floor in the lower third, centered.
Action: calm still scene, no characters, no toys.
Location: the wall takes the upper 45%, the floor the lower 55%. Only at the far left and right edges a few soft hints of a room: a window with light curtains on one side, a low empty shelf on the other, both partly cut by the frame edge.
Composition: full-bleed 4:3 landscape, no paper border, no rounded frame. The center of the frame is open and quiet: game boxes will stand in the middle and a pile of toys will lie on the rug, so nothing busy behind them. The rug spans about 70% of the width and is fully visible.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft warm daylight from the window side.
References: Image A = palette and brush texture only.
The image contains no letters, no logo, and no watermark.
Aspect ratio: 4:3. Resolution: 4K.
```

**Проверка:** в центре пусто и спокойно; коврик целиком в нижней трети; по краям только намёки на окно и полку.

---

## Файлы в игре (делает Cursor)

`public/assets/games/sort-colors/`

| ID | Файл | Откуда |
|---|---|---|
| SORT-TOY-`<вид>`-`<цвет>` | `toys/<вид>-<цвет>.png` (28) | листы 1–7, `<цвет>` = `red` `yellow` `blue` `green` |
| SORT-BIN | `bin.png` | лист 8 |
| SORT-STICKER-`<вид>` | `stickers/<вид>.png` (7) | лист 9 |
| SORT-BG | `sort-playroom-bg.webp` | лист 10, 2400×1792 |
| SORT-VOICE | `voice/*.mp3` (158) | трек озвучки |
| SORT-SFX | `sfx/*.mp3` (3) | см. ниже |

Пока файлов нет, игра рисует временные объёмные фигуры и ящик из кода. Как только файлы появились, скрипт отмечает их в `src/games/sort-colors/art-ready.ts`, и игра сама берёт PNG.

## Звуки (не голос)

| Файл | Когда | Источник |
|---|---|---|
| общий `assets/audio/pickup.mp3` | взял игрушку | Kenney Interface Sounds `pluck_001` (CC0); тот же звук в «Собери пазл» |
| общий `assets/audio/drop.mp3` | игрушка упала в нужный ящик | Kenney Interface Sounds `select_001` (CC0); тот же звук в «Собери пазл» |
| `sfx/pile.mp3` | новая куча падает сверху | ElevenLabs Sound Effects, промпт ниже |
| промах | не тот ящик | общий `assets/audio/soft-miss.mp3` (уже есть) |

**Промпт ElevenLabs Sound Effects — `sort-pile.mp3`** (длительность 1,2 с, prompt influence ~0.5):

```
A small pile of soft wooden and rubber toddler toys gently tumbling onto a soft rug, a few muffled light thuds and one tiny rubber squeak, cozy and quiet, no voices, no music, no harsh impacts.
```

Готовый файл положите в `assets-master/games/sort-colors/sort-pile.mp3` и напишите «готово sort-pile». «Взял» и «положил» общие для нескольких игр: замена — сразу файлом `public/assets/audio/pickup.mp3` / `drop.mp3`, поменяется везде.

**Запасные промпты** (если CC0 не понравятся):

- `sort-pickup.mp3`, 0,4 с: `a soft gentle cartoon "pup" pop of picking up a small toy, light and friendly, no music`
- `sort-drop.mp3`, 0,5 с: `a soft muffled toy dropping into a plastic tub, one gentle hollow plop, friendly, no music`
