# «Изучаем звуки» — промпты карточек (S16)

**ЗАФИКСИРОВАНО** владельцем 26.09.2026.  
**Стиль:** [GENERATION-GUIDE.md](GENERATION-GUIDE.md) §2 + [BRANDBOOK.md](BRANDBOOK.md).  
**Image A** на каждый файл: `assets-master/reference/ref-style-board.jpg` (только кисть и палитра, не копировать раскладку).

Владелец генерирует JPEG в Nano Banana Pro. Cursor потом вырезает белый и раскладывает PNG.  
Когда все картинки готовы — напишите в чат «готово звуки».

## Что рисуем

| Набор | Сколько файлов | Формат | Фон файла | Текст на картинке |
|---|---|---|---|---|
| Животные | **18** (по одному) | **1:1**, 2K | белый `#FFFFFF` | нет |
| Транспорт | **6** | **1:1**, 2K | белый `#FFFFFF` | нет |
| Иконки инструментов (карточки сетки) | **5** | **1:1**, 2K | белый `#FFFFFF` | **название RU** |
| Инструменты для игры (вырезка) | **5** | **4:3**, 2K | белый `#FFFFFF` | нет |
| Лист букв RU | **1** | **4:3**, 2K | белый `#FFFFFF` | все буквы А–Я |
| Лист букв EN | **1** | **4:3**, 2K | белый `#FFFFFF` | все буквы A–Z |

**Итого 36 картинок** (34 одиночных + 2 листа). Бубен **не** рисуем — его убрали из игры 26.09.2026.

Куда класть JPEG: `assets-master/games/sound-world/`  
имена как в таблицах ниже (`cat.jpg`, `drum-play.jpg`, `letters-ru-sheet.jpg`…).

---

## Общее правило карточки (животные и транспорт)

Это **образовательная карточка для малыша 2–3 лет**, не пустой значок в вакууме.

- Животное / машина — **главный герой**, крупно, силуэт читается с метра.
- Рядом **маленький уютный кусочек мира** (травка, подушка, волна) — чтобы карточка была живой.
- Весь рисунок сидит на **ровном белом `#FFFFFF`**. Белый Cursor вырежет и вставит вырезку на карточку в игре.
- **Не** рисовать рамку карточки, кнопки, тень-подложку на весь квадрат, бумажный лист.
- Хищники: рот закрыт, **зубов и когтей не видно**, взгляд добрый.
- Хвост без текста: `The image contains no letters, no logo, and no watermark.`

Стиль (вставлять **дословно** в каждый промпт):

`warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app`

После первой удачной карточки (например кошка) приложите её как **Image B** — «тот же вес линии и та же гуашь».

---

## А. Общий префикс — животные и транспорт

Скопируйте этот блок, затем подставьте блок `[SUBJECT]` из нужного номера.

```
Image A = ref-style-board.jpg — use ONLY for gouache texture, line weight, and warm pastel palette. Do not copy its layout, color circles, or pattern.

Subject: one toddler educational flashcard illustration.
[SUBJECT]
Action: still, calm, friendly. The animal or vehicle is not running at the camera.
Location: the entire square is solid flat pure white #FFFFFF, the same white in every corner, edge to edge. No paper sheet, no card frame, no drop shadow under the whole picture. A few small storybook props sit close to the subject so the card feels cozy, not empty — keep the props small so the main silhouette stays obvious.
Composition: 1:1. The main subject is centered and fills about 70% of the frame. All important parts stay inside the middle 85%. Readable from one meter.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even daylight on matte paint. No glossy plastic, no photoreal fur.
Text: The image contains no letters, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 2K.
```

### Животные (18) — по одному промпту

| # | id | Файл | Подпись в игре |
|---|---|---|---|
| 1 | cat | `cat.jpg` | Кошка |
| 2 | dog | `dog.jpg` | Собака |
| 3 | cow | `cow.jpg` | Корова |
| 4 | horse | `horse.jpg` | Лошадь |
| 5 | pig | `pig.jpg` | Свинья |
| 6 | hen | `hen.jpg` | Курица |
| 7 | rooster | `rooster.jpg` | Петух |
| 8 | duck | `duck.jpg` | Утка |
| 9 | goose | `goose.jpg` | Гусь |
| 10 | sheep | `sheep.jpg` | Овца |
| 11 | bear | `bear.jpg` | Медведь |
| 12 | wolf | `wolf.jpg` | Волк |
| 13 | lion | `lion.jpg` | Лев |
| 14 | elephant | `elephant.jpg` | Слон |
| 15 | monkey | `monkey.jpg` | Обезьяна |
| 16 | owl | `owl.jpg` | Сова |
| 17 | whale | `whale.jpg` | Кит |
| 18 | seal | `seal.jpg` | Тюлень |

**1. Кошка — `cat.jpg`**

```
[SUBJECT]
A plump friendly house cat, short orange-cream fur with white chest, sitting. Closed gentle mouth, no teeth, no claws. Next to it: one round yarn ball and a tiny house plant in a cream pot.
```

**2. Собака — `dog.jpg`**

```
[SUBJECT]
A plump friendly puppy, warm honey-brown fur, floppy ears, sitting. Closed gentle mouth, no teeth, no claws. Next to it: one smooth bone toy and two small grass tufts.
```

**3. Корова — `cow.jpg`**

```
[SUBJECT]
A plump friendly cow, cream body with a few soft brown patches, standing three-quarter view. Calm face, no horns that look sharp. Next to it: two clover flowers and a tiny wooden fence post.
```

**4. Лошадь — `horse.jpg`**

```
[SUBJECT]
A plump friendly horse, warm chestnut coat, standing three-quarter view, soft mane. Calm closed mouth. Next to it: one red apple and a small arc of green grass.
```

**5. Свинья — `pig.jpg`**

```
[SUBJECT]
A plump friendly piglet, soft pink, sitting. Tiny rounded snout, closed mouth. Next to it: a tiny shallow mud puddle and one small flower.
```

**6. Курица — `hen.jpg`**

```
[SUBJECT]
A plump friendly hen, warm rust-red feathers, standing. Soft comb, no sharp beak threat. Next to it: a little straw nest with one cream egg.
```

**7. Петух — `rooster.jpg`**

```
[SUBJECT]
A plump friendly rooster, coral-red comb, warm orange and gold feathers, standing proud but calm. Closed beak. Next to it: a few grain seeds and a short barn-wood plank.
```

**8. Утка — `duck.jpg`**

```
[SUBJECT]
A plump friendly yellow-cream duck, standing at a tiny water edge. Soft orange beak, closed. Next to it: a small water ripple and one green reed.
```

**9. Гусь — `goose.jpg`**

```
[SUBJECT]
A plump friendly white goose with a soft orange beak, standing. Calm, not hissing. Next to it: a pond-edge curve and two reeds.
```

**10. Овца — `sheep.jpg`**

```
[SUBJECT]
A plump friendly sheep, thick creamy wool, standing. Soft black-gray face, closed mouth. Next to it: two grass tufts and one tiny flower.
```

**11. Медведь — `bear.jpg`**

```
[SUBJECT]
A plump friendly brown bear cub, sitting. Soft rounded paws, closed mouth, no teeth, no claws. Next to it: a small tree stump and three berries.
```

**12. Волк — `wolf.jpg`**

```
[SUBJECT]
A plump friendly wolf, soft gray fur, sitting like a calm dog. Closed mouth, no fangs, no claws, kind eyes. Next to it: a pine cone and a patch of moss.
```

**13. Лев — `lion.jpg`**

```
[SUBJECT]
A plump friendly lion, soft golden mane, sitting. Closed mouth, no fangs, no claws, kind eyes. Next to it: two savanna grass tufts and one small sun-colored flower.
```

**14. Слон — `elephant.jpg`**

```
[SUBJECT]
A plump friendly elephant, warm gray, standing three-quarter, trunk relaxed down. No tusks, or only tiny rounded nubs. Next to it: one big green leaf and a tiny water splash.
```

**15. Обезьяна — `monkey.jpg`**

```
[SUBJECT]
A plump friendly monkey, warm brown fur, sitting. Closed mouth, no teeth, soft hands. Next to it: one banana and a short vine curl.
```

**16. Сова — `owl.jpg`**

```
[SUBJECT]
A plump friendly owl, warm brown and cream feathers, perched. Big kind eyes, closed beak. Next to it: a short tree branch and two leaves.
```

**17. Кит — `whale.jpg`**

```
[SUBJECT]
A plump friendly whale, soft blue-gray, seen from the side, smiling closed mouth. Next to it: two round bubbles and a small wave curve.
```

**18. Тюлень — `seal.jpg`**

```
[SUBJECT]
A plump friendly seal, warm gray, lying on a tiny pebble or ice floe. Closed mouth, kind eyes. Next to it: a small splash and two smooth pebbles.
```

### Транспорт (6)

**19. Машина — `car.jpg`**

```
[SUBJECT]
    A plump friendly toy car, coral-red body, rounded, two visible wheels. Next to it: a short road stripe and one tiny cloud.
```

**20. Поезд — `train.jpg`**

```
[SUBJECT]
A plump friendly toy train engine, sunflower yellow and sky-blue, rounded chimney. Next to it: two short rails and a soft puff of steam.
```

**21. Скорая — `ambulance.jpg`**

```
[SUBJECT]
A plump friendly toy ambulance, cream-white body with a simple red plus on the side, rounded. Calm, no flashing lights drawn as glare. Next to it: a short road stripe.
```

**22. Полиция — `police-car.jpg`**

```
[SUBJECT]
A plump friendly toy police car, sky-blue and cream, rounded. A small light bar on the roof, painted still, not a siren flash. Next to it: a short road stripe.
```

**23. Корабль — `ship.jpg`**

```
[SUBJECT]
A plump friendly toy ship, cream hull, one simple sail or cabin, rounded. Next to it: two soft wave curves.
```

**24. Вертолёт — `helicopter.jpg`**

```
[SUBJECT]
A plump friendly toy helicopter, meadow-green and cream, rounded cabin, simple rotors still. Next to it: one tiny cloud.
```

---

## Б. Иконки инструментов (карточки сетки)

Те же инструменты, что в игре, но это **карточка с названием**.  
**1:1**, белый фон, инструмент крупно, **подпись русским** как у плиток меню: пухлые гуашевые буквы, тёмно-сливовый контур.

Префикс:

```
Image A = ref-style-board.jpg — use ONLY for gouache texture, line weight, and warm pastel palette. Do not copy its layout.

Subject: one toddler flashcard of a musical instrument with its name painted on the picture.
[SUBJECT]
Action: still, iconic, no musician and no hands.
Location: the entire square is solid flat pure white #FFFFFF, edge to edge. No card frame, no paper border.
Composition: 1:1. The instrument sits in the upper 65% of the frame, centered. The name sits in the lower third, one centered line, fully visible, not touching the instrument.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app. Letters are plump painted shapes with a thick soft dark-plum outline, same family as the app menu titles.
Lighting: soft even daylight on matte paint.
Text: render exactly the quoted Russian word and no other writing. No logo. No watermark.
Aspect ratio: 1:1. Resolution: 2K.
```

| id | Файл | Текст на картинке |
|---|---|---|
| drum | `drum-card.jpg` | `"Барабан"` |
| maracas | `maracas-card.jpg` | `"Маракасы"` |
| bell | `bell-card.jpg` | `"Колокольчик"` |
| piano | `piano-card.jpg` | `"Пианино"` |
| guitar | `guitar-card.jpg` | `"Гитара"` |

**25. Барабан — `drum-card.jpg`**

```
[SUBJECT]
A toddler drum kit of exactly three drums: a large bass drum (kick / бочка) in front, one tom, and one snare. Warm wood and cream skins, rounded. No cymbals.
Text: render exactly "Барабан"
```

**26. Маракасы — `maracas-card.jpg`**

```
[SUBJECT]
Exactly two maracas, coral and sunflower yellow, crossing gently or standing as a pair. Rounded gourds, short handles.
Text: render exactly "Маракасы"
```

**27. Колокольчик — `bell-card.jpg`**

```
[SUBJECT]
One hand bell, sunflower-gold, rounded dome, a small handle on top. Friendly, not a church tower.
Text: render exactly "Колокольчик"
```

**28. Пианино — `piano-card.jpg`**

```
[SUBJECT]
A chunky toy piano, cream and warm wood. Exactly seven white keys visible in a row, like a toddler keyboard. Optional two tiny black keys, still simple.
Text: render exactly "Пианино"
```

**29. Гитара — `guitar-card.jpg`**

```
[SUBJECT]
An acoustic guitar, warm wood. Top-down close view of the sound hole and six strings; a little of the neck is visible but the headstock is cropped out of frame.
Text: render exactly "Гитара"
```

---

## В. Инструменты для игры (вырезка, не карточки)

Это **сами инструменты** на белом, чтобы Cursor вырезал и положил в режим «играем на инструменте».  
**4:3**, белый `#FFFFFF`, **без букв**.

Префикс:

```
Image A = ref-style-board.jpg — use ONLY for gouache texture, line weight, and warm pastel palette. Do not copy its layout.

Subject: one musical instrument for a toddler to tap, isolated for cut-out.
[SUBJECT]
Action: still. No musician, no hands, no room.
Location: the entire frame is solid flat pure white #FFFFFF, the same white in every corner, edge to edge. No floor shadow under the whole picture, no card frame.
Composition: 4:3 landscape. The instrument fills about 75% of the frame, centered, fully visible except where the brief says to crop.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even daylight on matte paint. No photoreal wood grain photo.
Text: The image contains no letters, no logo, and no watermark.
Aspect ratio: 4:3. Resolution: 2K.
```

| id | Файл | Что на картинке |
|---|---|---|
| drum | `drum-play.jpg` | три барабана: бочка, том, снейр |
| maracas | `maracas-play.jpg` | два маракаса |
| bell | `bell-play.jpg` | один колокольчик |
| piano | `piano-play.jpg` | пианино с 7 клавишами |
| guitar | `guitar-play.jpg` | дека сверху, 6 струн, гриф обрезан |

**31. Барабаны — `drum-play.jpg`**

```
[SUBJECT]
A toddler drum kit of exactly three drums and nothing else: (1) a large bass drum / kick (бочка) facing us, (2) one tom, (3) one snare. Warm wood shells, cream skins. No cymbals, no stool, no sticks in the air.
```

**30. Маракасы — `maracas-play.jpg`**

```
[SUBJECT]
Exactly two maracas as a pair, coral and sunflower yellow, short handles, rounded gourds. Both fully visible.
```

**31. Колокольчик — `bell-play.jpg`**

```
[SUBJECT]
One hand bell only, sunflower-gold rounded dome, small handle on top. Large in frame.
```

**32. Пианино — `piano-play.jpg`**

```
[SUBJECT]
A chunky toddler piano, cream and warm wood. Exactly seven white keys in one row, large enough to tap. Optional two tiny black keys. No music stand text.
```

**33. Гитара — `guitar-play.jpg`**

```
[SUBJECT]
Acoustic guitar seen from directly above, close-up of the soundboard: the round sound hole in the center, six strings crossing it. Warm wood. A little of the neck enters one side of the frame but the fretboard is cropped — the headstock is out of frame. No hands.
```

---

## Г. Два листа алфавита

Один файл = **все буквы**. Cursor потом разрежет клетки и разложит по карточкам.

Белый фон, пухлые гуашевые буквы как название «Планета Мяу» (коралл, жёлтый, голубой, зелёный, фиолетовый по кругу). Без слов-примеров.

Префикс:

```
Image A = ref-style-board.jpg — use ONLY for gouache texture, line weight, and warm pastel palette. Do not copy its layout.

Subject: a letter sheet for a toddler alphabet game.
[SUBJECT]
Action: still reference sheet. Each letter is a separate plump painted glyph in its own cell.
Location: the entire frame is solid flat pure white #FFFFFF, edge to edge. Thin even gaps of the same white between cells. No paper border, no card frames around letters.
Composition: even grid, every letter the same visual size, fully visible, not overlapping, not cut by the edge. About 70% of each cell is the letter.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app. Each letter is a plump painted shape with a thick soft dark-plum outline and a little matte volume (lighter upper-left, deeper lower-right). Letter colors rotate: coral, sunflower yellow, sky blue, meadow green, soft violet.
Lighting: soft even daylight on matte paint.
Text: render exactly the letters listed, each once, and no other writing. No logo. No watermark. No example words.
Aspect ratio: 4:3. Resolution: 2K.
```

**34. Русский алфавит — `letters-ru-sheet.jpg`**

33 буквы. Сетка **6 колонок × 6 рядов**, последние 3 клетки пустые (только белый).

```
[SUBJECT]
A 6 by 6 grid of Cyrillic capital letters in this exact order, left to right, top to bottom:
"А" "Б" "В" "Г" "Д" "Е"
"Ё" "Ж" "З" "И" "Й" "К"
"Л" "М" "Н" "О" "П" "Р"
"С" "Т" "У" "Ф" "Х" "Ц"
"Ч" "Ш" "Щ" "Ъ" "Ы" "Ь"
"Э" "Ю" "Я"
The last three cells of the bottom row stay empty white.
```

**35. Английский алфавит — `letters-en-sheet.jpg`**

26 букв. Сетка **7 колонок × 4 ряда**, последние 2 клетки пустые.

```
[SUBJECT]
A 7 by 4 grid of English capital letters in this exact order, left to right, top to bottom:
"A" "B" "C" "D" "E" "F" "G"
"H" "I" "J" "K" "L" "M" "N"
"O" "P" "Q" "R" "S" "T" "U"
"V" "W" "X" "Y" "Z"
The last two cells of the bottom row stay empty white.
```

Кириллицу проверьте глазами: модель иногда путает буквы.

---

## Порядок генерации (удобно)

1. Одна кошка — смотрите стиль. Если ок — она Image B для остальных животных.
2. Остальные 17 животных.
3. Шесть транспортов (тот же префикс А).
4. Пять иконок инструментов с названиями (без бубна).
5. Пять инструментов 4:3 для вырезки (без бубна).
6. Два листа букв.

В чат можно кидать пачками: «готово животные», «готово транспорт», «готово инструменты», «готовы буквы».

## Что сделает Cursor после файлов

1. Вырежет белый → PNG. **Сделано 26.09.2026** (`npm run assets:sound-world`).
2. Разрежет два листа букв на отдельные файлы. **Сделано** (RU-лист имел дубли — взяты 33 уникальные).
3. Подключит к сетке `#/game/sound-world`. **Сделано** в 0.15.34.
4. Обновит `ASSET-MANIFEST.md`. **Сделано**. Дальше — правки владельца.
