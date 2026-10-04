# «В гости» — арт S16 (дом, улица, кот и сова)

**Дата:** 03.10.2026 · **SSOT UX:** `docs/games/S16-meow-home-BRIEF.md` (викторина 11 туров).
Старый список S14 (3 фона по времени суток, MH-BED, MH-CARE) снят: схема «сцена по часам» заменена домом с прихожей.

Генерирует **Cursor** по этим промптам (решение владельца 03.10.2026: «генерируй всё сам,
сразу подключай, я потом точечно поправлю»). Мастера — `assets-master/games/meow-home/`,
нарезка и подключение — Cursor.
Формула промпта и фраза стиля — `GENERATION-GUIDE.md` §1–2. Модель — Nano Banana Pro.

## Статус (0.21.0, 03.10.2026) — весь арт сгенерирован Cursor и в игре

Все пакеты сделаны одним заходом (владелец: «генерируй всё сам параллельно, сразу подключай»).
Владелец смотрит и точечно правит: перегенерировать один мастер → `npm run assets:meow-home`
(или `node scripts/build-meow-home-assets.mjs --only=bg|frames|outdoor|items`).

| Что | Мастера в `assets-master/games/meow-home/` | В игре `public/assets/games/meow-home/` |
|---|---|---|
| Фоны 4:3 | `mh-{hall,bath,kitchen,bedroom}-{day,night}.jpg`, `mh-yard-{summer,autumn,winter,spring}-{day,night}.jpg`, `mh-kitchen-fridge-open.jpg` | `bg/*.webp` 2048×1536 + `bg/yard-<сезон>-thumb.webp` (плитка «Сезон») — 21 файл |
| Кадры дома | `mh-<who>-f-<action>.jpg` — **по 2 кадра** на картинке (левая/правая половина на голубом), 28 действий × кот и сова | `<who>/f-<action>-{1,2}.webp` (вся клетка, общий масштаб и линия ступней) |
| Улица: основа | `mh-<who>-stand.jpg` + мордочки `mh-<who>-face-{cold,hot,wet,joy,sleepy}.jpg` (правки основы) | `<who>/stand.webp`, `<who>/face-<mood>.webp` |
| Одежда | `mh-<who>-wear-<вещь>.jpg` — правка «надень …» основы; 9 вещей (шапка, шарф, варежки, куртка, дождевик, сапоги, валенки, панамка, очки) | `<who>/wear-<вещь>.webp` (слой на холсте основы) + `items/wear-<who>-<вещь>.webp` (иконка вешалки/корзинки). Зонтик — общий предмет `items/umbrella.webp` |
| Предметы, природа, зверята, эффекты | `mh-items-{bath,kitchen,bedroom,hall,sky,yard1,yard2,yard3}.jpg`, `mh-animals.jpg`, `mh-fx.jpg` (сетки на белом) | `items/<name>.webp` — 119 файлов; пропорции → `src/games/meow-home/art-aspect.ts` (генерирует скрипт) |
| Кровать | `mh-bed-empty.jpg` | `items/bed.webp`; голубая тень с низа кровати и кадров сна стирается (`dropBlueShadow`) |

Итого в игре ~280 файлов, 7,3 МиБ. Проверочные склейки скрипта — `assets-master/games/meow-home/_review/` (в игру не идут).

**Отличия от плана ниже:** кадры дома — по 2 кадра на действие (смена кадров + движение кодом), а не листы 4×3;
на улице — одна основа стоя + 5 мордочек + слои одежды (поза сидя и уличные кадры не понадобились);
дождь, снег, ветер, листопад, светлячки, свет фонаря — код на спрайтах капли, снежинки и листиков.

## Звук

Пока **синтез** (`src/games/meow-home/sfx.ts`): короткие мелодии-шаблоны на действие (дверь, чавк, глоток,
щётка, плеск, пузыри, хихиканье, мурлыканье, зевок, колыбельная, мячик, кубики, страница, одежда, погода,
птички, лягушка, санки, звёздочки, «брр») + общие «взял / положил» и праздничная мелодия (`src/shared/hub-sounds.ts`).
Фразы — текстом в облачке; список для записи — `meow-home-VOICE-SCRIPT.md`. Настоящие сэмплы
(вода, дождь, ветер, хруст снега) и тихая музыка дома — следующим шагом по слову владельца.

## План генерации (история, по нему делалось)

| Пакет | Что | Статус |
|---|---|---|
| 1. Якоря | Мяу стоя, сова стоя, прихожая днём | ✅ |
| 2. Фоны | ванная, кухня, спальня, двор в 4 сезонах, 8 ночных, открытый холодильник | ✅ (шторы, ночник, вода в ванне — кодом и кадрами) |
| 3. Кадры дома | действия кота и совы | ✅ по 2 кадра |
| 4. Улица: силуэт и одежда | основа, мордочки, 9 вещей под каждого | ✅ |
| 5. Предметы и природа | уход, еда, спальня, прихожая, погода, игры, зверята, эффекты | ✅ |

## Общие правила

1. **Фраза стиля дословно в каждом промпте** (`GENERATION-GUIDE.md` §2). Image A — всегда `assets-master/reference/ref-style-board.jpg`: из него только краска и линия.
2. **Мяу** — блок Subject из `GENERATION-GUIDE.md` §4 целиком + референсы `ref-meow-sheet.jpg`, `ref-meow-poses.jpg`. **Сова** — канон из «Пакета друзей» (кривой силуэт, крупные пятна, левый глаз выше, плоский клюв) + `ref-owl-sheet.jpg`, `ref-owl-poses.jpg`. Не выпрямлять сову, не делать кота оранжевым.
3. **Оба стоят на задних лапках, как плюшевые игрушки** — передние лапки (у совы крылья) свободны. Так на них садится одежда и они держат предметы.
4. **Фон вырезки персонажей:** ровный светло-голубой `#D6EEF8`. Предметы — ровный белый `#FFFFFF`. Фоны сцен не вырезаются, доходят до всех краёв.
5. **Листы кадров:** сетка **4 колонки × 3 ряда**, 4:3, 4K. Один ряд = одно действие из 4 кадров слева направо. В каждой клетке один персонаж **одного масштаба**, ступни на **одной нижней линии** (~88 % высоты клетки), тело по центру клетки, между клетками пусто, без рамок и линий.
6. **Точность через правку, а не «нарисуй похоже».** Уличные кадры, одежда, ночные фоны, сезоны двора и состояния фона (открытый холодильник, задёрнутые шторы) делаются **правкой** готового файла: приложить его и написать «та же картинка, измени только …». Cursor вырезает изменённое и совмещает до пикселя.
7. **Без текста:** `The image contains no letters, no logo, and no watermark.`
8. Чувства персонажей: покой, интерес, радость, сонливость, «брр», «ух, жарко». Не рисовать грусть, слёзы, злость, испуг, боль.

## Пакет 1 — якоря (генерировать сейчас)

### 1.1 Мяу стоя — `assets-master/games/meow-home/mh-meow-stand.jpg`

Эталон для всех кадров кота и для одежды. Image A = `ref-style-board.jpg`, Image B = `ref-meow-sheet.jpg`, Image C = `ref-meow-poses.jpg`. 1:1, 2K.

```
Use Image A only for gouache texture, line weight, and the warm palette. Use Image B and Image C only for the exact design of the kitten. Take ONE kitten only, never copy their layout or extra poses.

Subject: a small white Devon Rex kitten named Meow, short curly wavy cream-white fur, large rounded friendly ears, big round dark eyes, tiny pink nose, soft chubby picture-book body, no visible claws, no visible teeth.
Action: Meow stands upright on both hind paws like a plush toy, facing the viewer, body straight and symmetrical, front paws relaxed down along the sides slightly away from the body, tail curving softly to the screen-right behind one leg. Calm friendly smile, eyes open.
Location: solid flat light-blue background #D6EEF8, edge to edge, the same color in every corner. No floor, no scenery, no gradient. Only a tiny soft contact shadow under the feet.
Composition: exactly one kitten, full body, centered horizontally. The soles of the feet sit on a line at 90% of the image height, the tips of the ears at about 12% of the image height. Generous empty space on both sides. Square 1:1.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even studio light from the upper left.
Text: the image contains no letters, no logo, and no watermark.
Avoid: a second kitten, a pose sheet, sitting on four paws, clothes, accessories, orange fur, long fur, visible claws or teeth.
Aspect ratio: 1:1. Resolution: 2K.
```

### 1.2 Сова стоя — `assets-master/games/meow-home/mh-olli-stand.jpg`

Эталон совы. Image A = `ref-style-board.jpg`, Image B = `ref-owl-sheet.jpg`, Image C = `ref-owl-poses.jpg`. 1:1, 2K. **Того же роста**, что Мяу в 1.1: ступни на 90 %, макушка с ушками на ~12 %.

```
Use Image A only for gouache texture, line weight, and the warm palette. Use Image B and Image C only for the exact design of the owl, and take ONE single owl only: never copy their layout, extra poses, extra heads or faces. Do not straighten the owl.

Subject: ONE single small vintage stuffed plush owlet with ONE head, ONE body, and ONE pair of eyes. Short crooked pear-shaped body, wide cream belly, rust bouclé fur #B5551F to #C26A2E covered in LARGE chunky black and deep-brown blotches, fingertip-sized or bigger, not small dots. Two cream face patches meet on a clear zigzag seam. The screen-left eye sits clearly higher than the screen-right eye, by a third to half of an eye's diameter, permanently. Both eyes fully visible, open, glossy amber with black pupils and tiny highlights. Flat golden-tan appliqué beak, not a 3D cone. Two flat golden-tan three-toed feet. Narrow spotted wings. Two small pointed ear tufts with dark tips.
Action: the owl stands upright facing the viewer, both wings relaxed down along the sides slightly away from the body, calm friendly look.
Location: solid flat light-blue background #D6EEF8, edge to edge, the same color in every corner. No scenery, no ground line, no gradient. Only a tiny soft contact shadow under the feet.
Composition: exactly one owl, full body, centered horizontally. The feet sit on a line at 90% of the image height, the tips of the ear tufts at about 12% of the image height. Generous empty space on both sides. Square 1:1.
Style: warm children's book illustration style, soft gouache texture over a clear bouclé plush surface, thick soft dark-plum outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even studio light from the upper left.
Text: the image contains no letters, no logo, and no watermark.
Avoid: a second owl, a pose sheet, leveled or symmetrical eyes, small speckled dots, a 3D beak, a straightened body, clothes, accessories.
Aspect ratio: 1:1. Resolution: 2K.
```

### 1.3 Прихожая днём — `assets-master/games/meow-home/mh-hall-day.jpg`

Якорь стиля всех комнат. Image A = `ref-style-board.jpg`, Image B = `assets-master/games/hide-seek/hs-scene-kitchen.jpg` (только уровень деталей и уют интерьера — не копировать кухню). 4:3, 4K.

```
Use Image A only for gouache texture, line weight, and the warm palette. Use Image B only as a reference for the cozy interior detail level and perspective; do not copy its kitchen, furniture, or layout.

Subject: the cozy entrance hall of a small family home for a toddler picture-book app, seen from the front at a child's eye height, slightly from above.
Location and layout (screen positions matter):
- Back wall: two closed, wide, rounded-top wooden interior doors with soft pastel paint — one at about 35% of the width (mint), one at about 62% (peach). Each door has a large plain round wooden plaque at child eye height, empty, no picture on it.
- Left wall, near the left edge: a third closed interior door (soft blue) seen at a slight angle, also with an empty round plaque.
- Right side: the front door to the street (warm wooden, with a small round window), occupying roughly 78–95% of the width. Next to it on the wall, a small square window with light curtains showing a bright daytime garden.
- Between the front door and the center: a low wooden coat rack with 6 empty round pegs and a low shelf below for shoes — completely empty, no clothes, no shoes.
- A small soft doormat in front of the front door.
- Floor: warm light wooden planks. The central floor area from about 35% to 65% of the width and from 45% to 95% of the height stays open and calm — a character will stand there.
- Walls: warm cream with a very soft pattern; a couple of small framed pictures with simple flowers; a potted plant.
Composition: 4:3 landscape, the picture reaches all four edges, no paper sheet, no frame, no rounded border. Calm, uncluttered, big readable shapes.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft warm daylight from the windows.
Text: the image contains no letters, no logo, and no watermark.
Avoid: people, animals, characters, clothes on the rack, shoes, toys on the floor, clutter, text or symbols on the plaques.
Aspect ratio: 4:3. Resolution: 4K.
```

Таблички на дверях пустые специально: картинки комнат (ванна, тарелка, кроватка, солнышко) Cursor ставит отдельными спрайтами — их подсвечивает желание персонажа.

## Пакет 2 — фоны (после «да» на пакет 1)

Все комнаты: Image A = `ref-style-board.jpg`, Image B = `mh-hall-day.jpg` (тот же дом, тот же пол, та же краска). 4:3, 4K. В каждой комнате **дверь назад в прихожую — у левого края** (тот же вид, что левая дверь прихожей), **окно** есть всегда (тап по окну — день/ночь), **центр пола 35–65 % × 45–95 % свободен** под персонажа. Двигающиеся предметы на фоне **не рисовать** — они спрайты пакета 5.

| ID | Файл | Что на картинке (кроме общего) |
|---|---|---|
| MH-BG-BATH | `mh-bath-day.jpg` | раковина с зеркалом и полочкой (без щётки и стакана) слева-по центру; большая белая ванна справа — **пустая, без воды**; место под горшок у ванны пустое; кафель пастельный, коврик |
| MH-BG-KITCHEN | `mh-kitchen-day.jpg` | холодильник слева у стены (дверца **закрыта**); низкий столик справа с **пустой** скатертью (на нём будут тарелки-спрайты); плита и полки для уюта; окно над столиком |
| MH-BG-BEDROOM | `mh-bedroom-day.jpg` | окно с **раздвинутыми** шторами; книжная полка; ящик для игрушек (пустой); тумбочка с **выключенным** ночником; **кровать не рисовать** — место под неё справа пустое (кровать — спрайт) |
| MH-BG-YARD-SUMMER | `mh-yard-summer-day.jpg` | двор у дома: слева фасад дома с дверью и окном; дерево по центру сзади; верёвка для белья между деревом и столбиком (пустая); качели справа — **только стойка без сиденья**; песочница спереди справа; клумба спереди слева; холм справа сзади (зимой станет горкой); дорожка; небо **ясное, без солнца и облаков** (их ставит код); центр свободен |

**Сезоны двора — правкой** `mh-yard-summer-day.jpg` («the same image, change only the season…»): `mh-yard-winter-day.jpg` (снег на земле, крыше, ветках; дерево голое; холм — снежная горка), `mh-yard-spring-day.jpg` (свежая зелень, почки, ручеёк вдоль дорожки), `mh-yard-autumn-day.jpg` (жёлто-оранжевое дерево, листья на траве). Всё остальное на тех же местах.

**Ночь — правкой** каждого дневного фона (8 файлов `*-night.jpg`): тёмно-синее небо в окнах, мягкий тёплый свет в комнате, краски приглушены, предметы на тех же местах. Во дворе — тёмное небо **без луны и звёзд** (их ставит код), свет в окне дома.

**Состояния фона — правкой** (Cursor вырезает изменённый кусок): холодильник открыт с полками (`mh-kitchen-fridge-open.jpg`); шторы спальни задёрнуты (`mh-bedroom-curtains.jpg`); ночник включён (`mh-bedroom-lamp-on.jpg`); вода с пеной в ванне (`mh-bath-water.jpg`).

## Пакет 3 — кадры дома (по 4 кадра, листы 4×3)

Каждый лист — **отдельно для кота и для совы** с одинаковыми рядами (имена `mh-meow-home-N.jpg` / `mh-olli-home-N.jpg`). Image A = стиль, Image B = `mh-meow-stand.jpg` (или `mh-olli-stand.jpg`) — тот же персонаж, тот же масштаб, ступни на той же линии. У совы вместо «лапок» — крылья, вместо «зубок» — клювик.

| Лист | Ряд 1 | Ряд 2 | Ряд 3 |
|---|---|---|---|
| home-1 | стоит, дышит, моргает | машет «Привет!» | радуется, подпрыгивает |
| home-2 | хихикает (щекотка) | мурлычет / ухает, глаза закрыты (погладили) | хочет кушать: гладит животик |
| home-3 | зевает, трёт глаза | пританцовывает (хочет на горшок) | хочет играть: держит мячик, подпрыгивает |
| home-4 | дрожит «брр» (пришёл с холода) | смотрит на грязные лапки (грязь нарисована) | мордочка в каше, облизывается |
| home-5 | жуёт (лапки у рта) | пьёт из чашки (чашка в лапках) | улыбается широко с открытым ротиком — чистим зубки, пены всё больше |
| home-6 | полощет и сияет чистыми зубками | моет лапки под краном: пена на лапках | вытирается полотенцем, довольный |
| home-7 | сидит в ванне по грудь: плещется, пузыри на голове | сидит на горшке, потом радуется | жмурится — мордочку вытирают салфеткой |
| home-8 | **в пижаме:** стоит, дышит | **в пижаме:** зевает | **в пижаме:** машет сонно (вход ночью) |
| home-9 | **в пижаме:** слушает книжку, удивляется картинке | лежит, спит под одеялом (только голова, дышит) | **в пижаме:** потягивается, просыпается |
| home-10 | играет с мячиком | строит из кубиков | (пусто) |

Грязь на лапках и каша на мордочке — только в своих рядах. Ванна, кровать, одеяло, мячик, кубики, полотенце, чашка — так, как держит персонаж; сами предметы в комнате — спрайты пакета 5.

## Пакет 4 — улица: один силуэт и одежда

1. **Силуэт стоя:** правкой `mh-meow-stand.jpg` (и совы) — каждый кадр «the same kitten, keep the head, body, legs and feet exactly in place, change only the face, front paws and tail». Действия по 4 кадра: стоит; радуется; дрожит «брр» (холодно / ветер); «ух, жарко», обмахивается лапкой; мокнет — капли на шёрстке, ёжится; зевает «пойдём спать»; держит предмет в поднятой лапке (зонтик, мороженое, лейка, ниточка змея — предмет отдельно).
2. **Силуэт сидя** (качели, санки): `mh-meow-sit.jpg` / `mh-olli-sit.jpg` + 4 кадра «сидит, радуется» на том же силуэте.
3. **Одежда — правкой силуэтов** (стоя и сидя, для кота и совы): «the same image, put on only a warm knitted hat» и т. д. Cursor вырезает вещь как слой. Вещи (тур 7, одна расцветка): тёплая шапка, шарф, варежки (сове — на крылышки), тёплая куртка, резиновые сапоги, валенки, дождевик, зонтик (в лапке/крыле), панамка, солнечные очки. Пижама — нарисована в кадрах дома, здесь не нужна.
4. **Вещи на вешалке и в корзинке** — отдельный лист предметов на белом (пакет 5).

## Пакет 5 — предметы, природа, зверята (на белом `#FFFFFF`)

| Лист | Содержимое |
|---|---|
| mh-items-bath | зубная щётка, тюбик пасты, стаканчик, мыло, губка, резиновая уточка, полотенце, горшок, мыльная пена (3 комка), пузырь |
| mh-items-kitchen | тарелка с кашкой и ложкой, чашка молока, чашка воды, яблоко, печенье, рыбка (коту), ягодки (сове), кружка какао с паром, салфетка, пустая тарелка |
| mh-items-bedroom | кровать (пустая, вид как в комнате), одеяло открытое, одеяло укрывает, книжка закрытая и открытая, мячик, 3 кубика |
| mh-items-hall | 10 вещей «висят на крючке» / «лежат» (иконки для вешалки и корзинки), корзинка, таблички комнат: ванна, тарелка, кроватка, солнышко с деревом (улица) |
| mh-items-sky | солнце, облако светлое, туча, радуга, луна, звезда (2 вида), капля, снежинка |
| mh-items-yard-1 | лужа, лужа-лёд, гриб (2 вида), цветок открытый / закрытый, сосулька, листик (3 цвета), куча листьев |
| mh-items-yard-2 | снеговик по шагам: 1 ком, 2 кома, 3 кома с лицом, морковка; тающий снеговик, лужа с морковкой |
| mh-items-yard-3 | санки, кораблик, ведёрко и совок, лейка, мороженое (целое, тает, капает), сиденье качелей с верёвками, вертушка, бельё на верёвке, воздушный змей, фонарь (выкл / вкл) |
| mh-animals | по 2–4 кадра: птичка, бабочка, улитка, белка с орешком, снегирь |
| mh-fx | облачко-мысль (пустое), блеск, пар, Zzz, брызги, грязь на лапках (для кота и совы) |

Дождь, снег, ветер, светлячки, свет ночника и фонаря рисует код на основе спрайтов капли, снежинки и листиков.

## Куда в игре

`public/assets/games/meow-home/` — `bg/`, `meow/`, `olli/` (кадры и одежда с одинаковыми именами), `items/` (эффекты тоже здесь). Нарезка — `npm run assets:meow-home` (`scripts/build-meow-home-assets.mjs`). Всё из `public/` автоматически попадает в offline precache (`pwa-precache-integrity.mdc`).
