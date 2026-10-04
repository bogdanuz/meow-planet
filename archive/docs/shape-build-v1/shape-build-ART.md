# «Собери фигурку» — рисунки (S16, shape-build)

**Дата:** 02.10.2026 · **Механика:** [S16-shape-build-BRIEF.md](../games/S16-shape-build-BRIEF.md) · **Озвучка:** [shape-build-VOICE-SCRIPT.md](shape-build-VOICE-SCRIPT.md)

Старый план S14 (нарезка частей в Photoshop, рыжий кот, 10 шаблонов) больше не действует. Детали-фигуры рисует код, их рисовать не нужно.

**Статус:** игра в меню (0.16.11), **ждём мастеров владельца**. 16 схем Image C уже лежат в `assets-master/games/shape-build/layout/`. Пока мастеров нет, игра работает на заглушках кодом: стол «Рисовалки», доска кодом, в галерее и в финале — сами собранные фигуры.

## Что нужно нарисовать

| # | Файл мастера (кладёте вы) | Что на нём | Что делает Cursor |
|---|---|---|---|
| 1 | `sb-table.jpg` | фон: светлый деревянный стол сверху, 4:3 | WebP на весь экран |
| 2 | `sb-board.jpg` | пустая деревянная доска-вкладыш, 1:1 | вырезает фон, PNG |
| 3–18 | `sb-obj-<id>.jpg` (16 штук) | нарисованный предмет по схеме из фигур, 1:1 | вырезает фон → картинка для финала и карточка галереи |
| 19 | `sb-magic.mp3` | волшебный звук превращения | кладёт в игру |

Папка мастеров: `assets-master/games/shape-build/`. После каждого файла напишите в чат «готово sb-obj-house» (или другое имя). Cursor запустит `npm run assets:shape-build`.

**Порядок:** сначала **стол**, **доска** и **домик** — по ним проверяем стиль и масштаб, потом остальные 15 предметов.

`<id>` и порядок в галерее (от простых к сложным): `icecream` мороженое · `mushroom` грибок · `fish` рыбка · `house` домик · `snowman` снеговик · `boat` кораблик · `apple` яблочко · `car` машинка · `rocket` ракета · `tree` ёлочка · `train` паровозик · `meow` котик Мяу · `sun` солнышко · `butterfly` бабочка · `owl` сова Олли · `flower` цветочек.

## Референсы

- **Image A** во всех промптах — `assets-master/reference/ref-style-board.jpg` (только краска и линия).
- **Image B** — только для Мяу (`ref-meow-sheet.jpg`) и совы (`ref-owl-sheet.jpg`).
- **Image C** для предметов — **схема из фигур** `assets-master/games/shape-build/layout/<id>.png`. Её делает Cursor из кода игры (`npm run assets:shape-build -- --layouts`). На схеме ровно те фигуры, их места и цвета, которые ребёнок собирает на доске. Предмет рисуем **поверх той же раскладки**: тогда в финале фигуры точно превращаются в картинку, без скачка.

## Фраза стиля (дословно в каждый промпт)

`warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app`

## Как устроен экран (для понимания фона)

Фон — только место. Доска и детали — отдельные предметы, их ставит код поверх фона, поэтому они не съедут ни на iPad 4:3, ни на широком экране.

- сверху ~12% высоты — кнопки (слева «Назад», «Звук»; справа «Галерея», шестерёнка);
- слева внизу ~17% ширины — сова;
- доска-вкладыш — квадрат от совы до ~64% ширины, почти на всю высоту;
- справа ~32% ширины — детали лежат прямо на столе вразброс.

---

## 1. Фон — `sb-table.jpg`

```
Subject: an empty light honey-colored wooden table top seen from directly above, soft natural wood grain running horizontally, it fills the entire frame.
Action: calm still scene, no characters, no toys in the middle.
Location: only at the very edges, partly cut off by the frame, a few soft hints of a cozy craft table: two wax crayons lying along the top edge right of center, a small wooden toy block at the bottom-right corner. The top-left corner and the bottom-left corner stay plain wood.
Composition: full-bleed 4:3 landscape, no paper border, no rounded frame, no table edge visible. The central 80% of the frame is plain calm wood with no objects: a game board will lie on the left and loose shape pieces on the right. A very gentle soft vignette toward the corners.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft warm daylight from the upper left.
References: Image A = palette and brush texture only.
The image contains no letters, no logo, and no watermark.
Aspect ratio: 4:3. Resolution: 4K.
```

**Проверка:** в центре только дерево; намёки маленькие и срезаны краем кадра; левые углы пустые.

---

## 2. Доска-вкладыш — `sb-board.jpg`

```
Subject: one empty wooden toddler shape-insert board, like a Montessori wooden puzzle board, seen from directly above: a square board of light birch plywood with softly rounded corners and a thick raised wooden frame; the inner area is a smooth flat slightly recessed panel in pale warm cream #F7EFE0, completely empty — no shapes, no holes, no pictures, no knobs (the shapes will be added later).
Action: static, flat, perfectly top-down.
Location: solid flat light sky-blue #D6EEF8 background, no floor, no cast shadow on the background.
Composition: 1:1, the board centered, filling about 90% of the frame, perfectly square and straight, the frame is the same width on all four sides (about 7% of the board side), nothing touching the image edges.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app. Soft painted wood, matte, not a 3D render.
Lighting: soft even daylight from the upper left.
References: Image A = brush texture and outline only.
The image contains no letters, no numbers, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 2K.
```

**Проверка:** доска ровно квадратная и не повёрнута; рамка одинаковой ширины; внутри пусто и светло.

---

## 3–18. Предметы — `sb-obj-<id>.jpg`

Один шаблон, меняются `{SUBJECT}`, `{BG}` и Image C (`layout/<id>.png`).

```
Subject: {SUBJECT}. It is the finished "real" version of the simple shape figure in Image C: keep exactly the same overall silhouette, the same proportions, the same position and size of every part and the same main colors as in Image C, but paint it as a charming finished object with soft details. All details are painted inside the shapes; nothing sticks out beyond the silhouette of Image C.
Action: static, calm, front view exactly as in Image C.
Location: solid flat {BG} background, no floor, no cast shadow, no scenery.
Composition: square 1:1, the object takes exactly the same place in the frame as the figure in Image C (same margins), nothing touching the image edges.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app. Soft painted volume, matte, not a 3D render.
Lighting: soft even daylight from the upper left.
References: Image A = brush texture and outline only. Image C = layout, silhouette, part sizes and colors to follow exactly. {IMAGE_B}
The image contains no letters, no numbers, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 2K.
```

`{BG}` = `pure white #FFFFFF`, кроме снеговика и Мяу: у них `light sky-blue #D6EEF8` (иначе белое исчезнет при вырезке).  
`{IMAGE_B}` пусто, кроме Мяу и совы (см. таблицу).

| id | `{SUBJECT}` |
|---|---|
| icecream | a waffle ice cream cone with one round scoop of pink strawberry ice cream on top; a soft waffle grid on the cone |
| mushroom | a cute forest mushroom: a wide red half-round cap with a few white dots, a light beige stem |
| fish | a friendly little fish: an oval blue body with soft scale strokes and one dot eye with a gentle smile, an orange triangle tail fin |
| house | a small cozy house: square yellow walls with a little door and a round window, a red triangle roof, a brown chimney |
| snowman | a snowman of three snowballs, big at the bottom to small on top, coal dot eyes, a small carrot nose and a tiny smile on the top ball, three coal buttons; no arms, no hat |
| boat | a small sailboat: a blue half-round hull, a yellow triangle sail, a small red triangle flag on top |
| apple | a red apple with a soft highlight, a brown stem and a green leaf |
| car | a cute toy car seen from the side: a red body, a yellow cabin with a window, two dark wheels with light hubcaps, a small round headlight |
| rocket | a toy rocket: a blue body with a round window, a red nose cone, two red fins |
| tree | a fir tree of three green tiers, a brown trunk, a yellow star on top, a few tiny round ornaments painted inside the tiers |
| train | a toy steam locomotive seen from the side: a red boiler, a blue cabin with a window, a dark chimney, two dark wheels |
| meow | Meow the white Devon Rex kitten from Image B, sitting, front view, built exactly like Image C: round head with a calm happy face, two big ears, body, tail. `{IMAGE_B}` = `Image B = the character Meow: face, curly cream-white fur, ears; not the pose.` |
| sun | a smiling sun: a round yellow face with a soft smile and rosy cheeks, four orange triangle rays |
| butterfly | a butterfly seen from above: a slim dark brown body, two big violet upper wings and two smaller pink lower wings with simple round spots |
| owl | Olli the plush owl from Image B, front view, built exactly like Image C: oval rust-colored body with a cream belly, two ear tufts, two wings; Olli's face with uneven eyes and a flat golden beak. `{IMAGE_B}` = `Image B = the character Olli: plush texture, spots, face; not the pose.` |
| flower | a simple flower: a yellow round center, four round pink petals, a green stem |

**Проверка каждого предмета:** положите рядом со схемой Image C — все части на тех же местах и того же размера; ничего не торчит за силуэт; фон ровный.

---

## 19. Волшебный звук — `sb-magic.mp3`

ElevenLabs Sound Effects, длительность 1,6 с, prompt influence ~0.5:

```
A short gentle magical sparkle shimmer with soft rising bell chimes, like a toy coming to life, warm and friendly, quiet, no voices, no music beat, no harsh high frequencies.
```

Положите в `assets-master/games/shape-build/sb-magic.mp3` и напишите «готово sb-magic».

---

## Файлы в игре (делает Cursor)

`public/assets/games/shape-build/`

| ID | Файл | Откуда |
|---|---|---|
| SB-BG | `table-bg.webp` | мастер 1, 2400×1800 |
| SB-BOARD | `board.png` | мастер 2, 1400×1400, фон вырезан |
| SB-OBJ-`<id>` | `objects/<id>.webp` (16) | мастера 3–18, 1024×1024, фон вырезан |
| SB-THUMB-`<id>` | `thumbs/<id>.webp` (16) | те же, 384×384 |
| SB-MAGIC | `sfx/magic.mp3` | мастер 19 |
| SB-VOICE | `voice/*.mp3` (63) | трек озвучки |

Схемы Image C: `assets-master/games/shape-build/layout/<id>.png` — только для генерации, в игру не идут.

Пока файлов нет, скрипт отмечает готовое в `src/games/shape-build/art-ready.ts`, и игра берёт рисунок, как только он появился.

## Звуки (не голос)

| Файл | Когда | Источник |
|---|---|---|
| общий `assets/audio/pickup.mp3` | взял деталь | тот же, что в пазле и «Куда положить?» |
| общий `assets/audio/drop.mp3` | деталь встала на место | тот же |
| общий `assets/audio/soft-miss.mp3` | не то место | тот же |
| `sfx/magic.mp3` | превращение | мастер 19; пока его нет — короткий звонкий перелив тонами (`shape-build-sfx.ts`) |
