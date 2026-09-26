# Гайд промптов — Nano Banana Pro

Как рисовать файлы «Планеты Мяу». Стиль персонажа — [BRANDBOOK.md](BRANDBOOK.md). Что делать сейчас — верх [ASSET-PRODUCTION-PLAYBOOK.md](ASSET-PRODUCTION-PLAYBOOK.md). Имена файлов — [ASSET-MANIFEST.md](ASSET-MANIFEST.md).

**Дата:** 25 сентября 2026. Старый текст из архива с **оранжевым** котом больше не использовать.

Источники формулы (не выдумка): [7 tips, Google](https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/), [DeepMind prompt guide](https://deepmind.google/models/gemini-image/prompt-guide/), [Google Cloud prompting guide](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana). Модель: **Nano Banana Pro** = Gemini 3 Pro Image. Разрешения **1K / 2K / 4K**. Референсов на вход — до 14, на практике 1–3 с явной ролью каждого.

## 1. Формула одного промпта

Пишите короткий бриф арт-директора, не список ключевых слов. Блоки по Google:

1. **Subject** — кто или что, конкретно.
2. **Action** — поза или действие.
3. **Location** — где и какой фон.
4. **Composition** — кадр, сетка, доля кадра.
5. **Style** — фраза из брендбука, дословно, в каждом запросе.
6. **Lighting** — конкретный свет, не слово «красиво».
7. **Text** — только если буквы нужны: точная строка в кавычках `"…"`, шрифт и место. Иначе кадр без надписей.
8. **References** — если файлы приложены: `Image A` = роль, `Image B` = роль.

Google советует описывать желаемое прямо («пустая улица»), а не длинным списком запретов. Короткий хвост всё же оставляем: модель часто дорисовывает буквы и водяные знаки.

Хвост для кадра **без текста**:

`The image contains no letters, no logo, and no watermark.`

Прилагательные вроде shiny / amazing не рисуются. Заменяйте на материал, форму и свет.

Полный экран планшета — **4:3** горизонтально (у обычного iPad так и есть: ширина к высоте четыре к трём). 16:9 шире экрана, поэтому края зря обрезались. В Nano Banana для сцены: **4:3** и **4K**. Картинка доходит до всех четырёх краёв: без листа бумаги, без скруглённой рамки и без полей. Лишнее при подключении обрезает Cursor.

Плитки меню — **1:1**. К каждому новому рисунку владелец прикладывает `ref-style-board.jpg` как Image A: только краска и линия. Луг, кружки и узор с этого листа в новую картинку не копировать.

## 2. Фраза стиля — в каждый промпт дословно

Книжная иллюстрация, зафиксировано 21.09.2026 (`docs/09-VISUAL-DESIGN-RESEARCH.md`, направление A: тёплая детская книга, гуашь/акварель, крупные читаемые силуэты, как StoryToys / спокойная линия Sago Mini — **не копировать** их картинки).

> warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app

Один стиль на все файлы. Не смешивать с 3D-пластилином и «мультфильмом другой студии».

## 3. Прозрачность

У Nano Banana **нет** переключателя «прозрачный фон». В промпт **не** писать transparent / alpha.

1. Просите **сплошной ровный фон одного цвета**.
2. Этот цвет вы вырезаете в редакторе и сохраняете PNG.
3. Целые сцены (небо, луг, пазл, прятки) фон **не** вырезают.

**Белый кот на белом фоне пропадёт.** Для Мяу фон вырезки — ровный светлый голубой `#D6EEF8` (в шерсти его нет). Для яблока, шарика, иконки, кнопки, надписи — ровный белый `#FFFFFF`.

Лист персонажа в игру не идёт: там фон тёплый светло-серый `#E4E0DA`, чтобы белые кудри было видно. Его не вырезают.

## 4. Мяу — канон внешности

Белый котёнок породы **девон-рекс**, не оранжевый и не длинношёрстный.

В каждый промпт с котом вставляйте этот блок **Subject** целиком:

> a small white Devon Rex kitten named Meow, short curly wavy cream-white fur, large rounded friendly ears, big round dark eyes, tiny pink nose, soft chubby picture-book body, no visible claws, no visible teeth

Чувства: покой, интерес, радость, сонливость. Не рисовать грусть, слёзы, злость, испуг.

## 5. Якоря (в игру не идут)

Порядок. Следующий файл — только после вашего «да» на предыдущем.

| Порядок | ID | Файл | Зачем |
|---|---|---|---|
| 1 готов | REF-STYLE | `ref-style-board.jpg` | Утверждён. Стиль + палитра + узор |
| 2 | REF-01 | `ref-meow-sheet.png` | Тот же кот в нескольких позах |
| 3 | REF-POSE | `ref-meow-poses.png` | Лапа, радость, сон |
| 4 | REF-02 | `ref-meadow.png` | Луг и небо |
| 5 | REF-03 | `ref-objects.png` | Предметы |
| 6 | REF-04 | `ref-ui-icons.png` | Дом, назад, звук, настройки |

Промпт **только текущего** шага лежит вверху playbook. Остальные — ниже, чтобы не генерировать пачкой.

### REF-STYLE — утверждён

Файл `assets-master/reference/ref-style-board.jpg`. Повтор не нужен. Ниже промпт, которым он получен.

```
Subject: a brand style board for a toddler picture book, painted by hand in matte gouache on warm cream paper. Three zones: one finished storybook vignette, eight flat paint swatches, and one pattern square painted in the same gouache.
Action: still reference, nothing moves.
Location: the sheet is a scanned page of textured watercolor paper.
Composition: landscape 16:9. Left half is one picture-book scene: soft rolling green hills, a pale blue sky, two plump hand-painted clouds, and three simple flowers. Each flower is a round blossom of soft painted petals with a small warm center, like a storybook flower, clearly not a button and with no holes. Right side is eight large flat circles of matte paint in two rows: sky blue, meadow green, warm cream, coral, sunflower yellow, leaf green, soft violet, kitten-fur cream. They look like gouache puddles on paper, flat and matte, with no shine and no bevel. Under them, one square of the same painted pattern: tiny soft clouds and dots, thick outlines, same paint texture as the meadow.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app. Visible dry-brush paper grain. Printed storybook page, not a vector icon set and not a clay toy.
Lighting: soft even daylight on matte paint. No glossy highlights, no plastic, no 3D buttons.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 16:9. Resolution: 2K.
```

### REF-01 — после «да» на стиль

Приложить **REF-STYLE** как Image A. Фон серый, не вырезать. 4:3, 2K.

```
Use Image A only for the illustration style, line weight, and color palette. Do not copy its layout.

Subject: a character model sheet of one small white Devon Rex kitten named Meow, short curly wavy cream-white fur, large rounded friendly ears, big round dark eyes, tiny pink nose, soft chubby picture-book body, no visible claws, no visible teeth. The same kitten appears six times: front standing, three-quarter walking, side sitting, back view, happy face close-up, calm face close-up.
Action: each pose is still and friendly.
Location: flat warm light-gray studio background #E4E0DA, no scenery.
Composition: 4:3 character-sheet grid, even gaps, each pose fully visible, even studio light.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even light so the white curls stay visible against the gray.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 4:3. Resolution: 2K.
```

### REF-POSE — после «кот узнаваемый»

Image A = REF-01. Серый фон. 1:1, 2K.

```
Use Image A as the only character design. Same kitten, same curly white fur, same ears, same face.

Subject: the same small white Devon Rex kitten in four poses: standing calm, one paw pointing to the right, happy with eyes gently closed, sleepy.
Location: flat warm light-gray background #E4E0DA, no scenery.
Composition: 2x2 grid, 1:1, each pose fully in frame.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even studio light.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 2K.
```

### REF-02 — луг

Image A = REF-STYLE (палитра). Персонажа нет. 16:9, 2K. Фон не вырезать.

```
Use Image A for palette and line only.

Subject: a gentle meadow with soft rolling green hills, a few round flowers, a clear blue sky, and two or three soft clouds.
Action: still landscape.
Location: open meadow, warm afternoon.
Composition: wide 16:9 eye-level shot, open middle ground.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even daylight.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 16:9. Resolution: 2K.
```

### REF-03 — предметы

Image A = REF-STYLE. Белый фон, потом можно вырезать. 4:3, 2K.

```
Use Image A for illustration style and palette.

Subject: six simple objects, one per cell: a red apple, a small toy drum, a blue toy car, a cup, an orange fruit, a round ball.
Action: each object rests still, facing the viewer.
Location: each cell has a solid flat pure white background #FFFFFF.
Composition: 2x3 grid, 4:3, straight-on, even gaps, no cast shadow on the white.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even light.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 4:3. Resolution: 2K.
```

### REF-04 — иконки

Image A = REF-03, чтобы линия совпала. Белый фон. 1:1, 1K.

```
Use Image A for line weight and color of the objects only. Do not copy the black grid lines.

Subject: four simple rounded signs: a house, a left-pointing arrow, a speaker, a settings gear.
Action: each sign is still and centered in its own area.
Location: one solid flat pure white background #FFFFFF across the whole sheet.
Composition: 2x2 arrangement, 1:1, thick shapes that stay readable when small, wide white gaps, no black rules, no cell borders.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: flat and even.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 1K.
```

## 6. Welcome — по одному файлу

Якоря закрыты 25.09.2026. Фон входа подключён. Сейчас кот.

На welcome отдельные картинки, не живой текст кода:

| ID | Файл | Фон в промпте |
|---|---|---|
| WELCOME-bg | фон неба и поляны | сцена целиком, не вырезать |
| WELCOME-meow | кот, лапа в сторону кнопки | голубой `#D6EEF8`, вырезать |
| WELCOME-title | надпись «Планета Мяу» | белый, вырезать; текст в кавычках |
| WELCOME-play | круглая кнопка и слово «Играть» | белый вокруг круга, вырезать |

### WELCOME-bg — переделать

Первый файл был 16:9 и с бумажной рамкой. Его на экране можно заменить. Image A = `ref-meadow.jpg`. **4:3**, **4K**. JPEG поверх `assets-master/shell/welcome-bg.jpg`.

```
Use Image A as the exact meadow, sky, flowers, and paint style. This is the same place.

Subject: a full-bleed picture-book meadow for a toddler app title screen. Soft green hills, a pale blue sky, two or three plump clouds, and a few simple round flowers near the lower edge.
Action: still landscape.
Location: open meadow, warm afternoon, the same world as Image A.
Composition: 4:3 landscape. The painting reaches all four edges of the image. No paper margin, no rounded card, no frame, no border. Keep the upper middle of the sky calm and empty for a title that will be placed later. Keep the lower middle fairly open for a kitten and a round button that will be placed later. Do not draw the kitten, the title, or any button.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even daylight, matte gouache.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 4:3. Resolution: 4K.
```

### WELCOME-meow — сейчас

Image A = `ref-meow-poses.jpg`, Image B = `ref-meow-sheet.jpg`. Фон голубой, вырезку делает Cursor. 1:1, 2K. JPEG в `assets-master/shell/welcome-meow.jpg`.

```
Use Image A and Image B as the only character design. Same white Devon Rex kitten, same curly fur, same ears, same face.

Subject: one small white Devon Rex kitten named Meow, short curly wavy cream-white fur, large rounded friendly ears, big round dark eyes, tiny pink nose, soft chubby picture-book body, no visible claws, no visible teeth.
Action: standing and pointing with one paw to the right, looking toward the child, friendly and calm.
Location: solid flat light-blue background #D6EEF8, no scenery, no ground, no shadow on the background.
Composition: one kitten only, full body visible, centered, with space around the silhouette. Square 1:1.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even studio light so the white curls stay separate from the blue.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 2K.
```

### WELCOME-title — сейчас

Буквы по цвету утверждаем, фон листа — нет. Повтор **без приложенной картинки**: модель копирует луг с референса. Белый фон, вырезку делает Cursor. **16:9**, **2K**. JPEG в `assets-master/shell/welcome-title.jpg`.

```
The picture is only the wordmark. There is no reference image. Do not invent a meadow, flowers, clouds, color circles, or a pattern.

Subject: one title wordmark for a toddler picture-book app, the Cyrillic words "Планета Мяу".
Action: the words sit still in a single horizontal line.
Location: the entire background is one solid flat color, pure white #FFFFFF, the same #FFFFFF in every corner, edge to edge. No paper texture, no border, no scenery.
Composition: 16:9. The line is centered and large, filling most of the width, with even white space above and below. One word space between "Планета" and "Мяу". Every letter is fully visible, not cut off, not overlapping the next letter.
Style: warm children's book illustration style, soft gouache, thick soft dark-plum outline, gentle rounded letterforms, calm and friendly, made for a toddler app. Each letter is a plump painted shape with a little soft volume: a lighter highlight along the upper left of the letter and a slightly deeper shade along the lower right, like thick gouache, not plastic, not glossy, not a 3D toy. Letter colors in order, then repeat: coral, sunflower yellow, sky blue, meadow green, soft violet.
Text: render exactly "Планета Мяу" and no other writing. No logo. No watermark.
Aspect ratio: 16:9. Resolution: 2K.
```

Кириллицу проверяете глазами: Google прямо пишет, что орфография может ошибаться.

## Иконки меню — один стиль (серия 25.09)

**ЗАФИКСИРОВАНО 25.09.2026:** все плитки меню **одна серия**. **Image B** — любая **уже утверждённая** иконка новой серии, например **`card-sound-world.jpg`** (форма кнопки, градиент внутри, буквы). **Не** использовать старый `card-balloon-pop.jpg` как Image B — его **перегенерировать** под серию. Палитра — **`ref-style-board.jpg`** (Image A). **1:1**, **2K**, снаружи — белый `#FFFFFF`.

**Фон внутри кнопки:** чаще мягкий **cream → pale sky-blue** (как у звуков/сезонов). **Луг (холм)** — только если нужен сюжету (шарик — маленький холм снизу, не огромная поляна).

**Текст:** всегда **две строки** названия, стиль букв как Image B.

### Общий префикс (вставлять в начало КАЖДОГО промпта иконки)

```
Image A = ref-style-board.jpg — ONLY palette and gouache line weight. Do not copy its layout (no circles, no pattern sheet).

Image B = card-sound-world.jpg (or another approved icon from the same menu series) — MATCH this icon’s family exactly: same pillowy rounded-square die-cut button, same soft embossed rim (light, NOT a heavy dark outer frame), same inner gouache softness, same multicolor plump Cyrillic lettering with thick soft dark-plum outline per letter, same subtle drop shadow on pure white #FFFFFF outside the button.

Change ONLY the main subject and the two title lines. 1:1, 2K.

[STYLE — LOCKED]
Warm toddler gouache/watercolor, gentle rounded shapes, pastel-warm palette from Image A, calm friendly mood, matte daylight, soft highlight upper-left on main object.

[BACKGROUND INSIDE BUTTON — OPTIONAL]
NOT required for every icon. Pick one:
(A) Simple pale sky + one soft green hill + tiny clouds — like Image B (good for outdoor games).
(B) Soft pastel wash inside the button (cream, sky-blue, or cream-to-blue) — good for abstract/UI subjects.
(C) Simple floor/surface color (cream rug, light wood) — good for indoor objects.
Keep inside uncluttered; main subject reads in one second.

[COMPOSITION]
Square 1:1, symmetric. Main subject upper-center, moderate size. Two centered Cyrillic lines in lower third (same text size and style as Image B).

[AVOID — STYLE DRIFT]
No thick dark purple/maroon border framing the whole icon (sticker frame). No flat vector sticker, no glossy plastic 3D, no different font style, no paper sheet, no watermark, no extra text, no busy scenes, no color swatches.
```

Шаблон тела промпта: после префикса — блок `[SUBJECT]` с предметом игры и `[TEXT_IN_IMAGE]` с двумя строками названия.

**ЗАФИКСИРОВАНО (викторина):** смысл иконок. Файлы: `assets-master/menu/card-<game-id>.jpg`.

### 1. Лопни шарик — `card-balloon-pop.jpg` (перегенерация v2)

```
[Paste общий префикс — Image B = card-sound-world.jpg или другая новая иконка]

[SUBJECT]
One plump coral-red party balloon with small knot and short curly string, large and centered in the upper half (same visual weight as the speaker on Image B).

[BACKGROUND INSIDE BUTTON]
Same cream-to-pale-sky-blue soft gradient as Image B — NOT a full meadow panorama. Optional: one small soft green hill curve at the very bottom edge only, low and subtle, mostly gradient.

[TEXT_IN_IMAGE]
Exact Cyrillic two lines like Image B: "Лопни" / "шарик" — NOT one single line.

[AVOID]
Old balloon card layout, huge sky+hills filling the icon, different button shape, one-line title.
```

### 2. Изучаем звуки — `card-sound-world.jpg`

```
[Paste общий префикс блок выше]

[SUBJECT] One friendly rounded speaker horn (cream and sky-blue), three gentle curved sound-wave arcs (coral, yellow, violet) rising from the horn, centered in the upper half. NO meadow hill required — use soft pastel wash background inside button (cream to pale sky-blue).

[TEXT_IN_IMAGE] Exact Cyrillic, two centered lines like Image B: "Изучаем" / "звуки". Same letter style as Image B.

[AVOID] No green hill unless barely suggested; no music-note clutter; no animals.
```

### 3. Куда положить? — `card-sort-colors.jpg`

```
[Paste общий префикс]

[SUBJECT] Three shallow pastel trays (red, blue, yellow) in a row, four chunky rounded blocks (red, blue, yellow, green) — one block slightly lifted toward its tray. Background inside button: soft cream pastel wash (no outdoor hill).

[TEXT_IN_IMAGE] "Куда" / "положить?"
```

### 4. Собери пазл — `card-puzzle.jpg`

```
[Paste общий префикс]

[SUBJECT] Four chunky interlocking puzzle pieces upper-center; colors sky-blue, green, yellow, coral — one piece slightly separated. Optional tiny flower on a piece; background inside button: soft sky-blue wash (hill optional, not required).

[TEXT_IN_IMAGE] "Собери" / "пазл"
```

### 5. Собери фигурку — `card-shape-build.jpg`

```
[Paste общий префикс]

[SUBJECT] Simple house from basic shapes: green square body, coral triangle roof, sky-blue circle window, cream door — chunky, upper-center. Background: soft cream-to-green pastel wash (outdoor hill optional).

[TEXT_IN_IMAGE] "Собери" / "фигурку"
```

### 6. Прятки — `card-hide-seek.jpg`

```
[Paste общий префикс]

[SUBJECT] Large friendly magnifying glass (cream handle, sky-blue lens) over a small soft green bush; inside lens, hint of hidden round shape or tiny ears. Background: pale sky wash + small hill under bush only (minimal, not full meadow scene).

[TEXT_IN_IMAGE] "Прятки" / "с Мяу"
```

### 7. Времена года — `card-seasons.jpg` (v2 — без пустого центра)

```
[Paste общий префикс]

[SUBJECT]
One friendly chunky tree centered in the upper two-thirds — fills the space. Four seasons readable ON the tree (not tiny corner circles with empty middle):
• spring — pink blossoms on branches;
• summer — small yellow sun peeking behind the crown;
• autumn — a few orange leaves;
• winter — soft white snow cap on top branches.
Symbols are large enough for a 2–3 year old to see at a glance.

[BACKGROUND INSIDE BUTTON]
Same cream-to-sky-blue gradient as Image B. NO empty void in the center. NO four separate corner medallions only.

[TEXT_IN_IMAGE] "Времена" / "года"

[AVOID]
Four small icons in corners with huge blank middle, calendar, numbers, extra text.
```

### 8. Считаем с Мяу — `card-counting.jpg`

```
[Paste общий префикс]

[SUBJECT] Three chunky blocks in a row with digits "1", "2", "3" (coral, yellow, sky-blue). Background inside button: soft cream pastel wash (no hill).

[TEXT_IN_IMAGE] "Считаем" / "с Мяу"
```

### «В гости к Мяу» — лежанка + когтеточка (без кота) — `menu-visit-bed.jpg`

**Не** card-icon. **Вертикальная** сцена — **вся кликабельная** кнопка «В гости к Мяу». **Кота на платформе не рисовать:** белый девон-рекс Мяу — **отдельный слой в UI** (позже спрайт + анимация). Белый `#FFFFFF` → knockout → `menu-visit-bed.png`.

**Референс:** Image A = `ref-style-board.jpg` только палитра и линия.

```
Image A = ref-style-board.jpg — ONLY palette and soft gouache line weight.

warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft dark-plum outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm friendly toddler mood.

Aspect ratio: 3:4 portrait. Resolution: 2K.

[SUBJECT — bottom to top, NO cat anywhere]
1) Bottom: cozy round woven cat bed/basket with cream pillow and small coral-violet blanket — centered, wide, anchored to bottom.
2) From the right side of the bed: kid-safe vertical scratching post, natural sisal rope texture, friendly rounded shapes.
3) On top of the post: flat empty wooden platform — clearly visible flat top surface, NO character, NO silhouette, NO paw prints on platform (reserved for UI overlay).
4) Below the platform, hanging on two short ropes: wooden arrow sign pointing RIGHT; exact Cyrillic "В гости" in bold plump multicolor letters, thick soft dark-plum outline (like menu icon titles).

[COMPOSITION]
Portrait 3:4, bottom-centered. Empty platform in upper area must read as a clear “stage” for a cat later. Sign points right.

[BACKGROUND]
Pure flat white #FFFFFF edge to edge for knockout.

[AVOID]
Any cat, kitten, animal, orange circle, mascot, shadow of cat on platform, square app-icon frame, watermark, extra text.
```

Кот в меню: слой `.menu-visit-bed__platform` в коде. После JPEG → `npm run assets:menu-cards`, bump `MENU_CARD_ASSET_VERSION`.

### MENU-meow — танец на площадке (4 кадра)

Лежанку **не** перерисовывать. Кот — отдельные картинки, по одной позе. В игре они сменяются по кругу: 1 → 2 → 3 → 4 → 3 → 2. Так получается мягкий танец без прыжка всего тела.

**Сначала только кадр 1.** Кадры 2–4 — после «да» на кадр 1. Иначе кот будет разного размера и «запляшет» по площадке.

Референсы кадра 1: Image A = `ref-meow-poses.jpg`, Image B = `ref-meow-sheet.jpg`. Кадры 2–4: те же A и B, плюс Image C = утверждённый кадр 1.

Общее для всех четырёх:

- Фон ровный голубой `#D6EEF8`. Не белый. Не серый лист.
- Один кот, в анфас, стоит. Не сидит, не лежит, не спиной.
- Лапы стоят на одной и той же нижней линии кадра. Тело не подпрыгивает целиком.
- Квадрат 1:1, 2K. JPEG в `assets-master/mascot/`.
- Не рисовать лежанку, табличку, тень на фоне, когти, зубы.

#### Кадр 1 — `menu-meow-dance-1.jpg`

```
Use Image A and Image B as the only character design. Same white Devon Rex kitten, same curly fur, same ears, same face.

Subject: one small white Devon Rex kitten named Meow, short curly wavy cream-white fur, large rounded friendly ears, big round dark eyes, tiny pink nose, soft chubby picture-book body, no visible claws, no visible teeth.
Action: standing front view, both hind feet planted, a small friendly smile, one front paw lifted a little to the side, tail curled softly to the other side. Calm happy beat, not a jump.
Location: solid flat light-blue background #D6EEF8, no scenery, no floor, no shadow.
Composition: one kitten only, full body, centered. Feet near the lower third, the same amount of blue space above the ears. Square 1:1.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even light so the white curls stay visible on the blue.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 2K.
```

#### Кадр 2 — `menu-meow-dance-2.jpg`

Image C = кадр 1.

```
Use Image A and Image B for the character. Use Image C as the exact same kitten size, framing, and feet position. Do not redraw a new kitten. Change only the pose.

Subject: the same small white Devon Rex kitten, same curly fur, same ears, same face.
Action: still standing on the same feet line. Body sways a little to his left. His left front paw is lifted higher, the other front paw stays down. Tail swings gently to his right. Eyes open, happy.
Location: solid flat light-blue background #D6EEF8, no scenery, no floor, no shadow.
Composition: full body, same scale as Image C, feet on the same ground line as Image C, same blue space above the ears. Square 1:1.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even light, same as Image C.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 2K.
```

#### Кадр 3 — `menu-meow-dance-3.jpg`

```
Use Image A and Image B for the character. Use Image C as the exact same kitten size, framing, and feet position. Do not redraw a new kitten. Change only the pose.

Subject: the same small white Devon Rex kitten, same curly fur, same ears, same face.
Action: still standing on the same feet line, body not jumping. Both front paws lifted a little in a happy clap. Eyes gently closed in a smile. Tail lifted softly. Hind feet stay planted.
Location: solid flat light-blue background #D6EEF8, no scenery, no floor, no shadow.
Composition: full body, same scale as Image C, feet on the same ground line as Image C, same blue space above the ears. Square 1:1.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even light, same as Image C.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 2K.
```

#### Кадр 4 — `menu-meow-dance-4.jpg`

Зеркало кадра 2.

```
Use Image A and Image B for the character. Use Image C as the exact same kitten size, framing, and feet position. Do not redraw a new kitten. Change only the pose.

Subject: the same small white Devon Rex kitten, same curly fur, same ears, same face.
Action: still standing on the same feet line. Body sways a little to his right. His right front paw is lifted higher, the other front paw stays down. Tail swings gently to his left. Eyes open, happy.
Location: solid flat light-blue background #D6EEF8, no scenery, no floor, no shadow.
Composition: full body, same scale as Image C, feet on the same ground line as Image C, same blue space above the ears. Square 1:1.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Lighting: soft even light, same as Image C.
Text: the image contains no letters, no logo, and no watermark.
Aspect ratio: 1:1. Resolution: 2K.
```

Положить JPEG в `assets-master/mascot/` и написать в чат «готово». Вырезку голубого и сборку танца делает Cursor.

## 7. Игры и звук

Голос и sfx — `balloon-pop-VOICE-SCRIPT.md`, `MUSIC-BGM-MANIFEST.md`. Старые `*-ART.md` в архиве — не SSOT. **Канон — этот гайд + BRANDBOOK.**

### 7.2 «Изучаем звуки» — промпты карточек (26.09.2026)

Полные копируемые промпты: **[sound-world-CARD-ART.md](sound-world-CARD-ART.md)** (18 животных, 6 транспорт, 5 иконок инструментов с названием, 5 инструментов 4:3 на вырезку, без бубна, 2 листа алфавита).

Image A = `ref-style-board.jpg`. Карточки **1:1** на белом `#FFFFFF` + маленький сюжет рядом с героем. Инструменты для игры — **4:3** белый. Буквы — два листа, режет Cursor.

### 7.1 «Лопни шарик» — первая игра S16 (26.09.2026)

**Очередь файлов:** (1) небо → (2) лист шариков → (3) Мяу-ведущий → озвучка параллельно по списку фраз.

**Image A** на все три промпта: `assets-master/reference/ref-style-board.jpg` (гуашь, палитра).  
**Image B** для Мяу: `assets-master/reference/ref-meow-sheet.jpg` или `ref-meow-poses.jpg`.

Стиль (дословно в каждый промпт):

`warm children's book illustration style, soft gouache/watercolor textures, clean readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color palette, no harsh shadows, calm and friendly mood, made for a toddler app`

---

#### A. Небо игрового поля — `balloon-pop-sky.jpg`

**Куда:** `assets-master/games/balloon-pop/balloon-pop-sky.jpg` → Cursor: WebP `public/assets/games/balloon-pop/balloon-sky-bg.webp`, **4:3**, **4K**.

**Subject:** open toddler-friendly sky for floating balloons — soft blue gradient, not flat single color.

**Location:** high airy clouds only — small, fluffy, scattered in upper third and corners; **lower 55% of frame mostly clear sky** so balloons stay readable. No ground, no hills, no sun disk, no birds.

**Composition:** full-bleed landscape 4:3; no paper border, no rounded card frame.

**Style + lighting:** same gouache as Image A; gentle midday light, no harsh lens flare.

**References:** Image A = palette and brush texture only.

**Text:** The image contains no letters, no logo, and no watermark.

**Aspect ratio:** 4:3. **Resolution:** 4K.

---

#### B. Лист шариков (5 цветов) — `balloon-pop-balloons-sheet.jpg`

**Куда:** `assets-master/games/balloon-pop/balloon-pop-balloons-sheet.jpg` → Cursor вырезает **5 PNG** в `public/assets/games/balloon-pop/`: `balloon-red.png`, `balloon-orange.png`, `balloon-yellow.png`, `balloon-green.png`, `balloon-violet.png`.

**Subject:** five separate round party balloons in a **3×2 grid** (one cell empty or tiny knot only): **coral-red, warm orange, sunny yellow, grass green, soft violet**. Each balloon: plump oval, small knot, short curly string hanging down.

**Location:** **solid flat white `#FFFFFF` background only** — no sky, no shadow on floor (Cursor adds soft shadow in CSS).

**Composition:** each balloon centered in its cell, same visual size across cells (~70% cell height), strings do not cross between cells.

**Style:** Image A gouache; thick soft outline; readable silhouette for toddlers.

**Text:** no letters, no faces on balloons.

**Aspect ratio:** 4:3 or 1:1. **Resolution:** 2K minimum.

**Note:** синий/indigo шарик **не рисуем** — небо уже синее.

---

#### C. Мяу-ведущий (голова/бust + облачко речи) — `balloon-pop-meow-presenter-sheet.jpg`

**Куда:** `assets-master/games/balloon-pop/balloon-pop-meow-presenter-sheet.jpg` → Cursor: 3 PNG + опционально 2 кадра idle для «дыхания».

**Subject:** white **Devon Rex** kitten (short curly cream-white fur, big rounded ears, round dark eyes, pink nose) — **head and upper chest only**, as if sitting behind a soft UI panel at bottom of screen. **Three poses in one row:**

1. **Idle / говорит** — calm friendly face, mouth slightly open mid-word, eyes toward child.
2. **Happy** — same cat, gentle smile, eyes bright (praise after pop).
3. **Gentle miss** — same cat, **soft puzzled pout**, eyebrows slightly raised — **no tears, no anger, no red X** (soft-error tap).

**Location:** **solid `#D6EEF8` sky-blue backdrop** per cell (Cursor chroma-keys like menu cat). No speech bubble drawn in art — текст речи рисует CSS (`balloon-pop__speech`).

**Composition:** 3 equal columns, same head scale, centered; leave ~10% padding top for ears.

**References:** Image B = exact Meow identity; Image A = brush style.

**Text:** The image contains no letters, no logo, and no watermark.

**Aspect ratio:** 16:9 (3 panels). **Resolution:** 2K.

**Анимация idle (после статики):** опционально второй лист `balloon-pop-meow-idle-2.jpg` — idle кадр 2 с чуть приподнятой грудью (дыхание); код чередует 2–3 с как welcome `meow-idle`.

---

После каждого JPEG: положите в чат «готово balloon-pop-sky» (или balloons / meow) — Cursor обработает и покажет экран `#/game/balloon-pop`.

Nano Banana не делает звук. Музыка — Suno, голос — ElevenLabs, как в архивной редакции этого гайда от 22.09.2026 (разделы звука не менялись по смыслу). Звук не блокирует якоря и welcome.
