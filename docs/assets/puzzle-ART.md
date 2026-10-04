# «Собери пазл» — картинки (S16, puzzle)

**Дата:** 01.10.2026 · **Механика:** [S16-puzzle-BRIEF.md](../games/S16-puzzle-BRIEF.md)

Старые 6 сцен S14 (рыжий кот, `puzzle-meadow.png`) больше не действуют. Демо-картинка удалена.

**Статус:** 02.10.2026 мастера владельца в игре — все 14 сцен и 3 дополнительные (таблица ниже, 15–17), 0.16.8.

## Что нужно нарисовать

14 цельных картинок. Главный герой везде — **сова**, Мяу — второй персонаж, рядом и меньше. Иногда в кадре другие зверята: зайчик, ёжик, медвежонок, утёнок, белочка, лягушонок, лисёнок (кто подходит сюжету).

Кусочки, миниатюры и иконки **рисовать не нужно**: скрипт сам делает картинку для игры и миниатюру для экрана выбора, кнопки «Галерея» и «Своё фото» берут готовые иконки из «Рисовалки».

| # | Файл мастера (кладёте вы) | Подпись в игре | Сюжет |
|---|---|---|---|
| 1 | `puzzle-bake.jpg` | Пирог | сова и Мяу пекут пирог |
| 2 | `puzzle-picnic.jpg` | Пикник | пикник на лугу с зайчиком |
| 3 | `puzzle-bath.jpg` | Купание | сова в ванне с пеной, Мяу пускает пузыри |
| 4 | `puzzle-beach.jpg` | Море | замок из песка, крабик |
| 5 | `puzzle-snowman.jpg` | Снеговик | лепят снеговика с лисёнком |
| 6 | `puzzle-garden.jpg` | Сад | сова поливает цветы, ёжик |
| 7 | `puzzle-bedtime.jpg` | Сказка на ночь | сова читает Мяу книжку |
| 8 | `puzzle-birthday.jpg` | День рождения | праздник медвежонка |
| 9 | `puzzle-train.jpg` | Паровозик | сова везёт друзей |
| 10 | `puzzle-autumn.jpg` | Осень | яблоки, белочка, ёжик |
| 11 | `puzzle-music.jpg` | Оркестр | дудочка, барабан, лягушонок |
| 12 | `puzzle-rain.jpg` | Дождик | зонтик, лужи, утята |
| 13 | `puzzle-farm.jpg` | Ферма | курочка, козлик, поросёнок |
| 14 | `puzzle-painting.jpg` | Рисуем | рисуют красками большую картину |
| 15 | `puzzle-car_repair_garage.jpg` (id `garage`) | Автосервис | сова и Мяу едут к автосервису (логотип BMW на капоте точечно стёрт 02.10.2026; оригинал — `originals/puzzle-car_repair_garage-with-logo.jpg`, скриптом не читается) |
| 16 | `puzzle-dentist.jpg` | Зубной врач | у зубного врача |
| 17 | `puzzle-newyear.jpg` | Новый год | ёлка и подарки |

15–17 владелец нарисовал сам сверх плана, подписи утверждены (ЗАФИКСИРОВАНО 02.10.2026). Если имя мастера не совпадает с id, алиас добавляется в `MASTER_NAMES` в `scripts/build-puzzle-assets.mjs`.

Папка мастеров: `assets-master/games/puzzle/`. После файла напишите в чат «готово puzzle-bake» (или другое имя). Cursor запустит `npm run assets:puzzle`. Порядок: сначала **Пирог** и **Пикник** — по ним проверяем стиль, яркость и как картинка режется на 4, 6 и 9 кусочков, потом остальные.

## Референсы (прикладывать ко всем 14)

| Роль | Файл |
|---|---|
| Image A — краска, линия, палитра | `assets-master/reference/ref-style-board.jpg` |
| Image B — точный вид совы | `assets-master/reference/ref-owl-sheet.jpg` |
| Image C — позы совы | `assets-master/reference/ref-owl-poses.jpg` |
| Image D — точный вид Мяу | `assets-master/reference/ref-meow-sheet.jpg` |

## Шаблон промпта

Один шаблон на все 14 картинок. Меняются только строки **Action**, **Location** и **Lighting** из таблицы ниже. Блоки про сову и Мяу не сокращать.

```
Use Image A only for gouache texture, line weight, and the warm palette; never copy its meadow, circles, or pattern. Use Image B and Image C only for the exact design of the owl, and take ONE single owl from them, never their layout or extra poses. Use Image D only for the exact design of the kitten. Do not straighten the owl.

Subject: a bright, cheerful full-scene picture-book illustration for a toddler jigsaw puzzle.
Main hero: ONE single small vintage stuffed plush owlet with ONE head, ONE body, and ONE pair of eyes. Short crooked pear-shaped body, wide cream belly, rust bouclé fur #B5551F to #C26A2E covered in LARGE chunky black and deep-brown blotches, fingertip-sized or bigger, not small dots. Two cream face patches meet on a clear zigzag seam. The screen-left eye sits clearly higher than the screen-right eye, by a third to half of an eye's diameter, permanently. Both eyes fully visible, open, glossy amber with black pupils and tiny highlights. Flat golden-tan appliqué beak, not a 3D cone. Two flat golden-tan three-toed feet. Narrow spotted wings. Two small pointed ear tufts with dark tips. Small props or a little hat are fine, but they never cover the face, the eyes, or the large blotches.
Second character: a small white Devon Rex kitten named Meow, short curly wavy cream-white fur, large rounded friendly ears, big round dark eyes, tiny pink nose, soft chubby picture-book body, no visible claws, no visible teeth. Meow is clearly smaller than the owl, about two thirds of its height.
Any other animals are drawn the same plush picture-book way: round soft bodies, big friendly eyes, no claws, no teeth.
Action: {ACTION}
Location: {LOCATION}
Composition: full-bleed 4:3 landscape; the picture reaches all four edges, no paper border, no rounded frame, no vignette. The owl is the biggest figure, about 40-50% of the frame height, whole body visible, placed a little left or right of the exact center. Imagine the frame cut into a 3x3 grid: every one of the nine cells holds at least one clear, colorful, recognizable thing (a face, a toy, a flower, a sun, a cup...), so every puzzle piece looks different. No large empty areas of plain sky, plain wall, or plain ground. Big simple shapes, few tiny details. Nothing important is cut by the frame edge.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app. Brighter, more saturated accents than usual: tomato red, sunflower yellow, cornflower blue, grass green, warm orange, so neighbouring areas of the picture clearly differ in color.
Lighting: {LIGHTING}
The image contains no letters, no numbers, no logo, and no watermark.
Avoid: a second owl, extra heads or faces, ghosted duplicate characters, leveled or symmetrical owl eyes, small speckled dots instead of large blotches, a 3D beak, an orange or long-haired cat, sad, crying, angry, or scared faces, anything dark or scary, a blurry background, a paper texture border.
Aspect ratio: 4:3. Resolution: 4K.
```

## Сюжеты

| Файл | `{ACTION}` | `{LOCATION}` | `{LIGHTING}` |
|---|---|---|---|
| bake | the owl, in a small striped apron, proudly holds a round golden cherry pie with both wings; Meow sits on a stool beside it, stirring a big blue mixing bowl with a wooden spoon, a soft puff of flour in the air | a cozy bright kitchen: a low cream oven, a window with a red flower pot, a red-and-white checked towel, a rolling pin, a bowl of red cherries, yellow cups on a shelf | warm morning sunlight from the window |
| picnic | the owl pours tea from a round blue teapot into small cups; Meow holds a big sandwich with both paws; a small bunny nibbles a carrot next to them | a sunny green meadow with a red-and-white checked blanket, a wicker basket with red apples, a big round tree on one side, yellow and pink flowers, two butterflies, a smiling sun, soft clouds | bright midday sunshine |
| bath | the owl sits happily in a round white bathtub piled with fluffy foam; Meow stands on a little stool by the tub, blowing big shiny soap bubbles; two yellow rubber ducks float in the foam | a bright bathroom with light-blue tiles, a fluffy orange towel on a hook, a green plant, a small window, floating rainbow soap bubbles everywhere | soft clean daylight |
| beach | the owl pats down a big sandcastle with a blue shovel, a red bucket beside it; Meow kneels nearby and waves to a small red crab | a sunny sandy beach: turquoise sea with gentle waves, a small sailboat with a red sail, a striped yellow-and-red umbrella, orange starfish and shells in the sand, a smiling sun | bright summer sunlight |
| snowman | the owl, in a red knitted hat, places a carrot nose on a round friendly snowman; Meow in a blue scarf rolls a big snowball; a small fox cub in mittens brings a twig arm | a snowy hill with round fir trees, big soft falling snowflakes, a wooden sled with a red rope, a small cottage with a warm window in the distance | soft bright winter daylight |
| garden | the owl waters tall flowers with a green watering can, a little arc of water drops; Meow sniffs a huge sunflower; a hedgehog carries a red apple on its back | a flower garden: sunflowers, red tulips, blue bells, a low wooden fence, two butterflies, a ladybug on a leaf, a small snail, a smiling sun | warm sunny afternoon light |
| bedtime | the owl, in a soft striped nightcap, sits in an armchair reading a big colorful picture book aloud; Meow lies cozy in a small bed under a patchwork quilt, listening with a sleepy smile | a warm bedroom: a window with a deep-blue night sky, a yellow crescent moon and stars, a glowing round night lamp, a teddy bear on a shelf, colorful patchwork quilt | warm golden lamp light inside, cool blue night outside |
| birthday | a small bear cub in a party hat smiles in front of a big round birthday cake with three candles; the owl gives it a gift box with a red ribbon; Meow holds a bunch of colorful balloons | a festive room with colorful flag garlands, confetti, a table with cups and cupcakes, a big window | bright cheerful daylight |
| train | the owl, in a little blue engineer cap, drives a red toy steam train; Meow waves from the first open wagon; a bunny, a duckling, and a frog ride in the next wagons; puffs of white steam | toy rails winding across green rolling hills, a small bridge, round trees, flowers, a smiling sun, soft clouds | bright sunny day |
| autumn | the owl holds a wicker basket of red apples under an apple tree; Meow reaches up to catch a falling orange leaf; a squirrel holds a nut on a branch; a hedgehog carries a mushroom | an autumn forest edge with orange, red, and yellow trees, a carpet of colorful leaves, a pumpkin, a wooden bench | warm golden autumn light |
| music | the owl plays a small wooden flute; Meow beats a red toy drum; a frog shakes two maracas; colorful music notes float in the air | a little outdoor stage on a flowery meadow with bunting flags, a blue sky, a big round tree, flowers | bright happy daylight |
| rain | the owl walks under a big yellow umbrella in green rain boots; Meow in red rain boots jumps into a puddle with a big splash; three ducklings waddle behind in a row | a rainy park path with sparkling puddles, a rainbow over the hills, round trees, flowers, soft rain drops, one cloud with a bit of blue sky | soft bright light after rain |
| farm | the owl scatters grain to a hen and three yellow chicks; Meow offers a tuft of grass to a small white goat kid; a pink piglet watches from behind the fence | a cheerful farmyard: a red barn, a wooden fence, a haystack, sunflowers, a green hill, a smiling sun | warm sunny morning |
| painting | the owl paints a big rainbow and a sun on a canvas on a wooden easel, holding a brush with one wing; Meow, with paint on its paws, leaves colorful paw prints on a sheet of paper on the floor | a bright art corner: colorful paint pots, brushes in a jar, a big window, children's drawings pinned on the wall without any letters | soft bright daylight from the window |

**Проверка каждого мастера:**

- сова самая крупная, Мяу рядом и меньше;
- у совы крупные пятна и глаза на разной высоте;
- в каждой из 9 частей есть что-то узнаваемое;
- нет больших пустых кусков неба или стены;
- нет букв и цифр.

## Файлы в игре (делает Cursor)

`public/assets/games/puzzle/`

| ID | Файл | Откуда |
|---|---|---|
| PUZZLE-`<id>` | `scenes/<id>.webp`, 2048×1536 | мастер `puzzle-<id>.jpg` |
| PUZZLE-THUMB-`<id>` | `thumbs/<id>.webp`, 480×360 | тот же мастер |

`<id>`: bake, picnic, bath, beach, snowman, garden, bedtime, birthday, train, autumn, music, rain, farm, painting, garage, dentist, newyear.

Пока мастера нет, игра показывает цветную картинку-заглушку, нарисованную кодом.

## Звуки

Отдельно не записываем. «Взял» и «положил» — те же Kenney-файлы, что в «Куда положить?» (CC0), ошибка — общий мягкий звук `soft-miss.mp3`, финал — короткая мелодия кодом. Голоса и ведущего в пазле нет (решение 01.10.2026).
