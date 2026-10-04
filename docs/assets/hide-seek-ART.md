# Игра «Прятки» — сцены и предметы (S16)

**Дата:** 02.10.2026 · **SSOT UX:** `docs/games/S16-hide-seek-BRIEF.md` (викторина 5 туров).  
Старый черновик S14 (5 CSS-сцен, цветные фигуры) — в истории git; механика S14 — `S14-hide-seek-BRIEF.md`.

## Принцип

- **6 сцен** (4:3, как картинки пазла), на каждой **10 целей** (предметы и зверята по смыслу сцены). Цели рисуются **отдельно** на листах, в сцену их ставит код в случайные **укрытия**.
- Сцена — пёстрая (25–40 неигровых предметов, все не мельче подушечки пальца), с естественными укрытиями в середине кадра: кусты, высокая трава, корзины, бортики, подушки, ящики, края ковра, горшки.
- Целей **нет** на самой сцене (иначе «найди яблоко» при трёх нарисованных яблоках).
- Персонажей на сцене нет. Верхняя полоса (стена / небо) спокойнее — там шапка; низ слева и по центру — ведущий и полоска, укрытия там не размечаются.
- Генерирует **Cursor** (решение владельца, тур 5). Референсы — арт проекта: картинки пазла (`assets-master/games/puzzle/`) для сцен, листы игрушек «Куда положить?» (`assets-master/games/sort-colors/sort-toys-*.jpg`) для предметов.

## Файлы

| Что | Мастер | В игре |
|---|---|---|
| Сцена | `assets-master/games/hide-seek/hs-scene-<id>.jpg` (4:3) | `public/assets/games/hide-seek/scenes/<id>.webp` (2048×1536) |
| Превью для галереи | — | `public/assets/games/hide-seek/thumbs/<id>.webp` (640×480) |
| Лист предметов | `assets-master/games/hide-seek/hs-items-<id>.jpg` (16:9, 5×2 на белом) | `public/assets/games/hide-seek/items/<id>-<item>.png` (белый убран, до 384 px) |
| Карточка меню | `assets-master/menu/card-hide-seek.jpg` | `public/assets/menu/card-hide-seek.png` (уже в игре, стиль совпадает — не перегенерировали) |
| Иконка «Подсказка» (лупа) | `assets-master/games/hide-seek/icons/hint.jpg` | `public/assets/games/creative/icons/hint.png` (общий набор иконок шапки, 256 px) |
| Пропорции предметов | — | `src/games/hide-seek/item-aspect.ts` (генерирует скрипт, руками не править) |

Нарезка: `npm run assets:hide-seek` (`scripts/build-hide-seek-assets.mjs`).

## Цели по сценам (id → слово)

| Сцена | Цели |
|---|---|
| `room` Детская | duck уточка · car машинка · drum барабан · book книжка · sock носок · top юла · plane самолётик · rattle погремушка · slipper тапочек · umbrella зонтик |
| `kitchen` Кухня | spoon ложка · lemon лимон · apple яблоко · banana банан · carrot морковка · cheese сыр · mouse мышка · kettle чайник · pear груша · cookie печенье |
| `garden` Сад | snail улитка · ladybug божья коровка · butterfly бабочка · strawberry клубника · cucumber огурец · can лейка · pumpkin тыква · frog лягушка · bird птичка · spade лопатка |
| `beach` Пляж | shell ракушка · crab краб · pail ведёрко · star морская звезда · fish рыбка · turtle черепашка · boat кораблик · hat панамка · melon арбуз · gull чайка |
| `forest` Лес | hedgehog ёжик · mushroom грибок · cone шишка · squirrel белка · berry ягодка · hare зайчик · fox лисичка · nut орешек · beetle жучок · snail улитка |
| `playground` Площадка | pail ведёрко · scooter самокат · balloon шарик · scoop совочек · mold формочка · cap кепка · pigeon голубь · pinwheel вертушка · truck грузовичок · butterfly бабочка |

Слова и род — `src/games/hide-seek/scenes.ts`. Мячик, мишка, кубик, чашка, листик и щенок из первого черновика заменены: такие же предметы уже нарисованы на сценах (или читались плохо), а цель не должна повторяться на картинке. Генерация — 1024 px; при желании те же промпты дают 4K.

## Фраза стиля (дословно, `GENERATION-GUIDE.md` §2)

> warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app

## Промпт сцены (4:3)

Image A — `assets-master/games/puzzle/puzzle-garden.jpg` (стиль, линия, палитра), Image B — картинка пазла той же темы, если есть (`puzzle-bake.jpg` для кухни, `puzzle-beach.jpg` для пляжа, `puzzle-autumn.jpg` для леса).

```
Wide landscape children's book illustration for a toddler seek-and-find game: {SCENE}.
The picture is packed with friendly details, like a gentle wimmelbook page: about 30 medium-size objects
({DECOR}), but every object is big and clearly readable on a tablet, no tiny clutter.
Many natural hiding places across the middle of the picture where a small object could peek out:
{HIDING}.
No characters: no people, no kitten, no owl, no animals. Do not draw {TARGETS} anywhere — they are added later.
Composition: frontal eye-level view, the scene fills the whole frame edge to edge, no border, no paper sheet.
The top band is calmer ({TOP}); the bottom-left corner and the bottom center are calm floor or ground.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes,
thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly
mood, made for a toddler app. Match Image A exactly: the same thick soft brown outlines, gouache texture and palette.
Lighting: soft warm daylight from the upper left.
The image contains no letters, no logo, and no watermark.
```

| id | SCENE | DECOR | HIDING | TOP |
|---|---|---|---|---|
| room | a cozy toddler playroom | toy shelves, a low sofa with cushions, a toy box, a play tent, a rocking horse, a rug, plants, a small table with chairs, a basket of blocks, picture frames without text, a window with curtains | behind sofa cushions, under the edge of the rug, inside the open toy box, behind the tent flap, between shelf toys, behind a plant pot, in the basket | wall with a window and a shelf |
| kitchen | a sunny family kitchen | cupboards, a stove with pots, a table with a checked tablecloth, chairs, a fruit bowl with grapes and oranges, jars, a bread basket, plates on a rack, pot plants, a towel on a hook, a rolling pin | behind jars, inside the bread basket, behind pots on the stove, under the tablecloth edge, behind a chair, between plates, behind the fruit bowl | upper cupboards and a window |
| garden | a vegetable garden with a flower meadow | beds of cabbages and lettuces, sunflowers, tulips, a wooden fence, a wheelbarrow, flower pots, a small shed, a bench, tall grass, a watering trough, bean poles | behind cabbages, in tall grass, behind flower pots, in the wheelbarrow, behind fence posts, between lettuce leaves, under sunflower leaves | sky with soft clouds and the fence |
| beach | a calm sunny beach | sand castles, a striped umbrella, a beach towel, deck chairs, a lifebuoy, rocks, seaweed, a sandy dune with grass, a small pier, shallow waves, palm-like bushes | behind sand castles, behind rocks, under the towel edge, in the dune grass, behind the deck chair, in the seaweed, behind the lifebuoy | sky and calm sea |
| forest | a friendly forest glade | big trees with roots, bushes, ferns, a fallen log, stumps, moss stones, flowers, a little stream with stones, autumn and green leaves, a wooden bridge | behind bushes, in ferns, behind the log, among roots, behind stumps, in leaf piles, behind stones | tree crowns and sky |
| playground | a toddler playground in a park | a slide, swings, a sandbox with a wooden rim, a little playhouse, a seesaw, benches, bushes, a tree, a fence, a spring rocker, a ball pit | behind the sandbox rim, in the sand, behind bushes, behind the playhouse window, under the slide, behind a bench, in the ball pit | sky and tree tops |

TARGETS для каждой сцены — слова из таблицы целей (по-английски).

## Промпт листа предметов (16:9, 5×2)

Image A — `assets-master/games/sort-colors/sort-toys-duck.jpg` (как нарисован предмет на белом), Image B — `assets-master/games/puzzle/puzzle-garden.jpg` (линия и палитра мира).

```
A sheet of 10 separate objects for a toddler game, arranged in a neat grid of 5 columns and 2 rows
on a pure flat white background (#FFFFFF). Generous white space around every object; objects never touch,
never overlap and are never cropped. All objects at a similar size, each fills most of its cell.
Objects, left to right, top row then bottom row: {ITEMS}.
Each object: friendly, simple, instantly recognizable for a 2-year-old, 3/4 front view, its own clear thick soft
outline, one main color. Animals are cute picture-book animals with a calm friendly face.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes,
thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly
mood, made for a toddler app. Draw objects exactly like Image A (gouache volume, highlight top-left, soft outline);
outline color and palette from Image B.
No ground shadow under the objects. The image contains no letters, no logo, and no watermark.
```

## Порядок

1. Сцена + лист для каждой из 6 тем → проверка (нет целей на сцене, нет букв, стиль как у пазла).
2. `npm run assets:hide-seek` — сцены в webp, превью, предметы с прозрачным фоном.
3. Разметка укрытий (`src/games/hide-seek/scenes.ts`): точка, размер, сторона укрытия, форма края — по сетке-помощнику и скриншотам. ✅ 02.10.2026: 11–13 укрытий на сцену, в каждой 1–2 «ку-ку».
4. Проверка разметки в dev: `?hs-debug=0#/game/hide-seek` (или `=1`) — первые/следующие 10 укрытий сразу заняты предметами (только `npm run dev`).
