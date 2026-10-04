# «Собери что угодно!» — рисунки (S16, shape-build)

**Дата:** 02.10.2026 · **Механика:** [S16-shape-build-BRIEF.md](../games/S16-shape-build-BRIEF.md) · **Голоса нет** (решение владельца: только звуки).

Промпты старой «Собери фигурку» (стол, доска-вкладыш, 16 предметов) больше не действуют. Они лежат в `archive/docs/shape-build-v1/`.

**Статус (код 0.16.15): весь арт в игре.** Владелец нарисовал 4 рисунка (два листа деталей, комната, шкаф) — подключены. Иконки кнопок игры («Бум!», «Замри!», «Гравитация», «Фото», «Как играть», «Повернуть», «Убрать», «Больше», «Меньше») перерисованы в общем стиле одним листом `sb-icons-sheet.jpg`. Промпты ниже — на случай перерисовки.

**Цвета деталей (ЗАФИКСИРОВАНО 02.10.2026, `docs/04-DECISION-REGISTER.md`):** 8 деревянных деталей и шарик рисуются **один раз в светлом некрашеном дереве**, игра сама красит их в 6 цветов палитры — так цвет детали всегда совпадает с иконкой «следующая деталь» в шкафу. Остальные предметы рисуются готовыми, в своих цветах. Подвижные части (колесо тележки, лопасти вентилятора) — отдельными рисунками: игра их крутит.

Иконки «Выбрать», «Магнит», «Луна» версии 1.0 не нужны — мастера в `archive/assets-master/games/shape-build-sandbox-0.16.12/icons/`. Корзинки с 2.0 нет.

## Что нужно нарисовать

| # | Файл мастера (кладёте вы) | Что на нём | Что делает Cursor |
|---|---|---|---|
| 1 | `sb-pieces-wood.jpg` | 9 деталей для перекраски: 8 деревянных + шарик, светлые, сетка 3×3 | режет, подгоняет под форму в физике, игра красит в 6 цветов |
| 2 | `sb-pieces-items.jpg` | 11 готовых рисунков предметов, сетка 4×3 | режет, подгоняет под форму в физике |
| 3 | `sb-room.jpg` | детская комната 4:3, вид сбоку | `room.webp` 2400×1800 на весь экран |
| 4 | `sb-cabinet.jpg` | высокий узкий открытый шкаф | вырезает белый фон → `cabinet.webp` |

Папка мастеров: `assets-master/games/shape-build/`. После файла напишите в чат «готово sb-room» (или другое имя). Cursor запустит `npm run assets:shape-build` и включит флаг в `src/games/shape-build/art.ts`. Порядок: сначала **лист 1** (по нему проверяем стиль), потом **лист 2** (тем же стилем, лист 1 — как образец), **комната**, **шкаф**.

**Image A** во всех промптах — `assets-master/reference/ref-style-board.jpg` (только краска и линия).
**Image B** для листа 1 — `public/assets/menu/card-counting.png` (объём кубиков: мягкий блик сверху слева, тень снизу справа).
**Image B** для листа 2 — готовый `sb-pieces-wood.jpg` (тот же стиль, толщина линии и объём).
**Image B** для комнаты — `public/assets/games/sort-colors/sort-playroom-bg.webp` («Куда положить?»): только настроение и палитра, раскладка другая.

## Фраза стиля (дословно в каждый промпт)

`warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app`

## Общие правила для обоих листов

- Детали видны **строго сбоку** (вид спереди, без перспективы, без верхней грани): форма рисунка = форма в физике.
- Пропорции ниже взяты из физики игры. Небольшую разницу Cursor подгонит, но силуэт должен быть тем же (куб — квадрат, горка — прямоугольный клин, и т.д.).
- Белый фон без пола и без тени на фоне, между деталями белое поле, ничего не касается краёв.

---

## 1. Лист для перекраски — `sb-pieces-wood.jpg`

Все 9 деталей светлые, почти белые: игра умножает рисунок на цвет, поэтому текстура и тени остаются, а цвет даёт игра. Если деталь нарисована цветной — она перекрасится грязно.

```
Subject: a reference sheet of nine toddler toy pieces, all in one consistent style, all painted in the same very pale unpainted natural wood color (almost white, warm ivory), laid out in a neat grid of 3 columns and 3 rows. Row 1: 1) a wooden toy cube, a perfect square from the front with slightly rounded corners; 2) a wooden brick exactly twice as wide as tall; 3) a long thin wooden plank about eleven times longer than thick. Row 2: 4) a wooden triangle block seen from the front as an isosceles triangle, base slightly wider than its height (5 to 4); 5) a wooden half-circle dome block with a flat bottom, twice as wide as tall; 6) a wooden arch block twice as wide as tall with a half-round opening cut out of the bottom middle, the opening about half the block's width. Row 3: 7) a wooden column block exactly twice as tall as wide; 8) a long wooden ramp wedge, a right triangle three times longer than tall, the tall vertical end on the left and the straight slope going down to the right; 9) a round party balloon without a string and without a knot tail, a perfect circle, same pale ivory color.
Action: every piece stands still, upright, in its natural resting position.
Location: solid flat pure white #FFFFFF background, no floor, no cast shadow on the background.
Composition: square 1:1 sheet, equal invisible cells, each piece centered in its cell and filling about 70% of the cell width, clear white gaps between pieces, nothing touching the edges. Every piece is drawn in a straight front view (orthographic side view, no perspective, no top face visible), so its outline is exactly its silhouette. All nine pieces share one pale ivory base color with a barely visible wood grain; only soft light-grey-warm shading shows the volume. No colored paint on any piece.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app. Light painted volume only: a soft lighter highlight on the upper-left of each piece and a gentle warm-grey shade on the lower-right, matte gouache, not glossy plastic, not a 3D render. Outlines are a soft medium warm grey, the same on every piece.
Lighting: soft even daylight from the upper left.
References: Image A = brush texture and outline only. Image B = how much volume, not the viewing angle and not the colors.
The image contains no letters, no numbers, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 4K.
```

**Проверка:** все 9 деталей светлые, одного цвета, без цветной краски; строго сбоку; у куба и кирпича углы чуть скруглены; горка высоким концом влево; у шарика нет ниточки и хвостика (ниточку рисует игра); контур серо-тёплый, не чёрный.

---

## 2. Лист предметов — `sb-pieces-items.jpg`

Предметы в своих цветах. Колесо тележки и лопасти вентилятора — отдельными рисунками: игра крутит их поверх корпуса.

```
Subject: a reference sheet of eleven toddler toy objects, all in one consistent style, laid out in a neat grid of 4 columns and 3 rows (the last cell empty). Row 1: 1) a soft rubber toddler ball, a perfect circle, coral-red with one curved cream stripe; 2) a smooth grey river stone, irregular and rounded, about 4 wide to 3 tall, lying flat; 3) the body of a small honey-colored wooden toy cart WITHOUT wheels: a low flat deck with one short upright post at each end, about twice as wide as tall, open on top; 4) one single round wooden cart wheel seen straight from the side, with a darker rim, a small hub and four simple spokes. Row 2: 5) a small plush toy of a white Devon Rex kitten sitting, curly cream-white fur, large rounded ears, big round dark eyes, tiny pink nose, its silhouette slightly taller than wide and widest at the bottom; 6) a small plush toy of a brown owl sitting, big round eyes, slightly taller than wide; 7) a small toy trampoline seen exactly from the side: a flat sky-blue springy top over short legs, about four times wider than tall; 8) a heavy round dark grey-violet toy wrecking ball, matte, a perfect circle with a small metal loop on top and no rope. Row 3: 9) a small toy basketball hoop seen exactly from the side: a narrow tall cream backboard standing on the right, about ten times taller than wide; an orange rim attached to the board at about two thirds of the board's height from the top, the rim seen edge-on as a thin flat oval sticking out to the left about seven board-widths; a soft white net hanging under the rim and narrowing downwards; 10) the body of a small friendly toy fan WITHOUT blades: a light-blue rounded rectangle, slightly taller than wide (4 to 5), with a big round empty grille opening in its upper part showing a pale inner disc, and a tiny base; 11) a separate three-blade toy propeller seen from the front: three rounded coral blades around a small round hub.
Action: every object stands still in its natural resting position.
Location: solid flat pure white #FFFFFF background, no floor, no cast shadow on the background.
Composition: 4:3 landscape sheet, equal invisible cells, each object centered in its cell and filling about 70% of the cell width, clear white gaps between objects, nothing touching the edges. Every object is drawn in a straight front view (orthographic side view, no perspective), so its outline is exactly its silhouette.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app. Light painted volume only: a soft lighter highlight on the upper-left and a gentle warm shade on the lower-right, matte gouache, not glossy plastic, not a 3D render.
Lighting: soft even daylight from the upper left.
References: Image A = brush texture and outline only. Image B = the exact same style, outline thickness and amount of volume as these toy pieces; do not copy their colors.
The image contains no letters, no numbers, no logo, and no watermark.
Aspect ratio: 4:3. Resolution: 4K.
```

**Проверка:** 11 рисунков, последняя клетка пустая; у тележки нет колёс, колесо отдельно; у вентилятора нет лопастей, лопасти отдельно; котёнок белый (не рыжий); у шара-тарана нет верёвки (её рисует игра); щит кольца справа, обод смотрит влево и виден ребром; всё строго сбоку.

---

## 3. Комната — `sb-room.jpg`

Комната шире и спокойнее, чем в «Куда положить?»: детали падают на ковёр, поэтому пол — длинная полоса через весь кадр. Пол по линии ~90% высоты: на этой линии стоят детали. Кольцо из шкафа появляется в центре стены, шар-таран висит с потолка, при «Замри!» комната чуть голубеет, при «Гравитации» — вечерний свет: всё это делает игра поверх рисунка, поэтому стена ровная и спокойная.

```
Subject: an empty cozy toddler playroom seen straight from the side like a theatre stage: a warm cream wall with a very soft pattern, a light honey wooden floor, and a long soft rug in a calm warm pastel color lying along the whole floor.
Action: calm still scene, no characters, no toys, no furniture in the middle.
Location: the wall fills the upper 88% of the frame. The floor is a low strip along the bottom 12%: the line where the rug meets the wall (where toys will stand) runs perfectly horizontal at about 90% of the image height, from the left edge to the right edge. Only at the far left edge, partly cut by the frame: a window with light curtains high on the left wall. The top strip of the wall right under the ceiling stays plain (a wrecking ball rope hangs from there), the center of the wall stays plain (a toy basketball hoop appears there) and the right fifth of the image stays plain (a cabinet slides in there).
Composition: full-bleed 4:3 landscape, straight side view with no perspective lines on the floor, no paper border, no rounded frame. The center and the whole lower half of the wall are open and quiet: children will build towers there, so nothing busy behind them.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft warm daylight from the window side.
References: Image A = palette and brush texture only. Image B = mood and colors of the playroom only; do not copy its layout or its oval rug.
The image contains no letters, no logo, and no watermark.
Aspect ratio: 4:3. Resolution: 4K.
```

**Проверка:** линия пола ровная, горизонтальная, примерно на 9/10 высоты; середина и верх стены пустые; правая пятая часть спокойная (там шкаф).

---

## 4. Шкаф — `sb-cabinet.jpg`

Шкаф выезжает справа. Полки-плитки с деталями (2 колонки, 9 рядов) игра рисует сама, поэтому внутри шкаф пустой.

```
Subject: one tall narrow open wooden toy cabinet without doors, warm light wood with softly rounded corners, a plain smooth back panel inside and a sturdy frame; the inside is completely empty with no shelves, no toys and no objects.
Action: static, straight front view, no perspective.
Location: solid flat pure white #FFFFFF background, no floor, no cast shadow on the background.
Composition: the cabinet is tall and narrow, about one unit wide to three and a half units tall, centered, filling about 90% of the image height, symmetric, nothing touching the edges. The frame is thin enough that a wide empty inner area remains.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app. Soft painted volume, matte, not a 3D render.
Lighting: soft even daylight from the upper left.
References: Image A = brush texture and outline only.
The image contains no letters, no logo, no handles with holes, and no watermark.
Aspect ratio: 9:16 (or the tallest available). Resolution: 2K.
```

**Проверка:** внутри пусто и ровно; рамка тонкая; шкаф строго спереди.

---

## Файлы в игре (делает Cursor)

`public/assets/games/shape-build/` и общий набор иконок `public/assets/games/creative/icons/`.

| ID | Файл | Откуда | Статус |
|---|---|---|---|
| SB-CARD | `public/assets/menu/card-shape-build.png` | `assets-master/menu/card-shape-build.jpg` | готово (сгенерировал Cursor) |
| SB-ICONS | `creative/icons/{boom,wand,gravity,photo,howto,rotate,remove,bigger,smaller}.png` | лист `sb-icons-sheet.jpg` (3×3) → `assets-master/games/shape-build/icons/*.jpg` | готово (0.16.15 перерисовал Cursor в общем стиле; старые — `archive/assets-master/games/shape-build-sandbox-0.16.14/icons/`). 0.16.16: «Бум!» — отдельный мастер `icons/boom.jpg`, мультяшный взрыв (звезда + дым + искорки), старый — `…-0.16.15/icons/` |
| SB-ICONS-2 | `creative/icons/{start,power,fire,shorter,longer,machines}.png` («Пуск!», «Включить», «Пли!», «Короче», «Длиннее», «Механизмы») | лист `sb-icons-sheet-2.jpg` + отдельно `sb-icon-longer.jpg` → `icons/*.jpg` | готово (сгенерировал Cursor, 0.16.17, в стиле SB-ICONS) |
| SB-HAND | `hand.png` (рука-подсказка, белая перчатка) | `assets-master/games/shape-build/hand.jpg` | готово (сгенерировал Cursor) |
| SB-WOOD | `pieces/{cube,brick,plank,triangle,dome,arch,column,ramp}.png` (светлые, игра красит) | скрипт `scripts/build-shape-build-wood.mjs` (точная геометрия, вид строго сбоку, лёгкий объём) | готово (0.16.17, решение владельца t7 — вместо 3/4-рисунков с листа) |
| SB-BALLOON | `pieces/balloon.png` | клетка 9 листа `sb-pieces-wood.jpg` | готово (владелец, 0.16.15) |
| SB-MACHINES | `pieces/{cannon,seesaw-stand,seesaw-board,conveyor,mill-stand,mill-rotor,lift-stand,lift-platform,button-base,button-cap,lamp,pin,pusher-base,pusher-glove,pulley-beam,bucket,gate-post,rocket}.png` — пушка, качели, лента, мельница, лифт, кнопка, лампочка, кактус, толкатель, ведёрки, столбик дверцы, ракета | листы `sb-machines-sheet.jpg` (4×3), `sb-links-sheet.jpg`, `sb-machines-long.jpg` (1×3), `sb-machines-tall.jpg` → нарезка `npm run assets:shape-build`. Подвижные части отдельно (доска качелей, колесо мельницы, площадка лифта, шляпка кнопки, перчатка, ведро); люк дверцы — картинка `plank`; огонь ракеты и свет лампочки рисует код | готово (сгенерировал Cursor, 0.16.18, решение владельца t8 — в стиле предметов, с объёмом). 0.16.17 рисовались кодом — этот рисунок остался запасным, пока картинки грузятся |
| SB-MEOW-POSES, SB-OLLI-POSES | `pieces/{meow,olli}.png` (мягкая игрушка в анфас) и `pieces/{meow,olli}-{walk1,walk2,joy,hang,ride,fly,float,sleep,wave,blink}.png` | листы `sb-meow-poses.jpg`, `sb-olli-poses.jpg` (4×3, последняя ячейка пустая) → `npm run assets:shape-build`, длинная сторона 400 px | готово (сгенерировал Cursor, 0.18.0, по референсам хаба: Мяу — `public/assets/mascot/menu-dance/frame_01.png`, Олли — `public/assets/mascot/presenter/olli-idle.png`). Движение (дыхание, шаги, сплющивание на батуте, покачивание, Zzz) — кодом в `render.ts`. Мяу и Олли из `sb-pieces-items.jpg` больше не нарезаются |
| SB-JETPACK, SB-PARACHUTE | `pieces/{meow,olli}-jetpack.png` (герой с ракетой за спиной как рюкзак, поза полёта) и `pieces/parachute.png` (купол) | по листу 1×1: `sb-meow-jetpack.jpg`, `sb-olli-jetpack.jpg`, `sb-parachute.jpg` → `node scripts/build-shape-build-assets.mjs --only=sb-meow-jetpack.jpg,sb-olli-jetpack.jpg,sb-parachute.jpg` | готово (сгенерировал Cursor, 0.22.0, по листам поз и ракете). Огонь из сопла (`JETPACK_NOZZLE` в `render.ts`) и стропы парашюта рисует код; купол раскрывается за 0,3 с |
| SB-MACHINES-3 | `pieces/{gate-box,scissors,pipe,lift-base,launcher-base,launcher-plate}.png` — коробка рольставни, ножницы, труба-телепорт, основание подъёмника-домкрата, пружина-катапульта (основание и площадка) | листы `sb-machines-sheet-3.jpg` (2×2) и `sb-machines-long-2.jpg` (1×3) → `npm run assets:shape-build` | готово (сгенерировал Cursor, 0.17.0, в стиле SB-MACHINES). Штору ворот, ножницы домкрата, полку, жёлоб и полку с люком рисует код (дерево — как SB-WOOD); столбик дверцы и лесенка лифта больше не нужны |
| SB-ICONS-3 | `creative/icons/{rocket,nail,glue,unglue,cut,kick,wire,room,lift}.png` («Полетели!», «Прибить», «Склеить», «Расклеить», «Резать!», «Подбросить!», «Провод», «Вся комната», «Вверх / Вниз») | лист `sb-icons-sheet-3.jpg` → `icons/*.jpg` (ракета — отдельно `icons/rocket.jpg`) | готово (сгенерировал Cursor, 0.17.0, в стиле SB-ICONS) |
| SB-ROOM-2 | `room-wall.webp`, `room-floor.webp` — бесшовные обои и пол для большой комнаты | `sb-room-wall.jpg`, `sb-room-floor.jpg` | готово (сгенерировал Cursor, 0.17.0). Заменили `room.webp`: картинка с окном не тянется на большую комнату. Мастер владельца `sb-room.jpg` — образец стиля. `lift-stand.png` и `gate-post.png` из SB-MACHINES в игре больше нет |
| SB-ITEMS | `pieces/{ball,stone,cart,cart-wheel,meow,olli,spring,wrecking,hoop,fan,fan-blades}.png` | `sb-pieces-items.jpg` | готово (владелец, 0.16.15) |
| SB-ROOM | `room.webp` 2400×1800 | `sb-room.jpg` | готово (владелец, 0.16.15) |
| SB-CABINET | `cabinet.webp` (рамка 9 частей, `border-image`) | `sb-cabinet.jpg` | готово (владелец, 0.16.15) |

«Отменить», «Галерея», «Ещё», «Заново» берут готовые иконки общего набора (`undo`, `gallery`, `more`, `sheet`) — их не перерисовывать (решение владельца 02.10.2026). Кнопка «Вкл / Выкл» у вентилятора — рисунок вентилятора (бледный, когда выключен).

**Как подключено (0.16.15).** `npm run assets:shape-build` режет листы по сетке: в каждой клетке остаётся только главный рисунок (краешки соседей убираются), у колеса и кольца белые просветы делаются прозрачными, у тележки срезаны нарисованные маленькие колёса (колёса крутит игра). `src/games/shape-build/sprites.ts` знает, куда ложится каждая картинка (`spriteBox`): дерево с 0.16.17 рисует скрипт `scripts/build-shape-build-wood.mjs` строго сбоку, контур = физика, поэтому картинка дерева = прямоугольник детали (растяжение под 3/4 `BLOCK_OVERFLOW` убрано; деревянные клетки листа `sb-pieces-wood.jpg` больше не режутся, из листа берётся только шарик), доска тянется только серединой, круг шарика и шара-тарана совпадает с физикой (узелок и петля выходят наружу), Мяу и Олли стоят без растяжения, кольцо — по ободу. Если перерисовать лист с другими пропорциями — обновить `ASPECT` и точки обода/оси в `sprites.ts`. Флаги `SANDBOX_ART_READY` в `art.ts` включены; выключать только вместе с удалением файла из `public/`.
