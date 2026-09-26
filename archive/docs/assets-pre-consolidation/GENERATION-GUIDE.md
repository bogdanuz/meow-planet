# Гайд по генерации ассетов — Nano Banana Pro

**Дата:** 22 сентября 2026 · Для кого: владелец, генерирует ассеты самостоятельно
(промпты готовит агент, генерацию запускает и оценивает результат — владелец).

## 0. Что это за модель (факты, не выдумано)

**Nano Banana Pro** — маркетинговое имя модели **Gemini 3 Pro Image**
(`gemini-3-pro-image`) от Google. Это модель для профессиональной генерации ассетов
с «размышлением» (Thinking) перед рисованием, поддерживает разрешения **1K / 2K / 4K**
и точный контроль соотношения сторон. Есть более быстрая версия **Nano Banana 2**
(Gemini 3.1 Flash Image) — для черновиков быстрее, но менее точная в деталях/тексте.
Источники: официальный блог Google (blog.google/…/prompting-tips-nano-banana-pro),
Google AI for Developers (ai.google.dev/gemini-api/docs/image-generation),
Google DeepMind (deepmind.google/models/gemini-image/pro).

**Важно (проверено в документации):** модель генерирует **только изображения**.
Для звука/музыки/голоса нужен другой инструмент — см. открытый вопрос в
`ASSET-MANIFEST.md`.

## 1. Универсальная формула промпта (из официального гайда Google)

Хороший промпт — это не набор ключевых слов, а короткий «арт-директорский» бриф из
этих блоков (используйте столько, сколько нужно для конкретного ассета):

1. **Subject (кто/что)** — конкретно, не абстрактно.
2. **Action (что делает)** — поза/действие.
3. **Setting/Location (где, какой свет)** — сцена, время дня, освещение.
4. **Style (стиль)** — единый на весь проект, см. §2.
5. **Composition/Camera (кадр)** — ракурс, крупность плана.
6. **Lighting & color (свет и цвет)** — конкретные слова, не «красиво», а «мягкий
   рассеянный свет», «тёплая пастельная палитра».
7. **Text (текст на картинке)** — в кавычках, если нужен текст (для «Планеты Мяу»
   почти никогда — минимум текста на экране для 2–3 лет).
8. **Constraints (что НЕ должно быть в кадре)** — прямыми словами, например
   «no sharp edges, no scary expressions, no clutter in background».

Прилагательные типа «shiny», «amazing» модель не «рисует» — их нужно заменять на
конкретику (материал, свет, форма).

## 2. Единый стиль проекта (уже выбран — не менять между ассетами)

Зафиксировано (`docs/09-VISUAL-DESIGN-RESEARCH.md`, §17 идеи): направление **А —
книжная иллюстрация**. Формула стиля для ВСЕХ промптов ниже (используйте буквально
эту фразу в каждом промпте, слово в слово, для единообразия):

> `warm children's book illustration style, soft gouache/watercolor textures, clean
> readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm
> color palette, no harsh shadows, calm and friendly mood, made for a toddler app`

## 3. Порядок генерации: сначала референсы-«якоря»

**Не генерируйте все 106+ объектов с нуля независимо** — стиль расползётся. Сначала
создайте 3–4 референса, они потом передаются как **входные изображения** в каждый
следующий запрос («Use Image A for style, Image B for character» — Gemini поддерживает
до 5 референсов персонажа и 14 референсов объектов одновременно для согласованности).
Референсы **не идут в игру** — это только инструмент для стабильной генерации.

### REF-01 — Мяу, лист персонажа (генерировать первым)

```
Create a character reference sheet of a small fluffy orange cat character named "Meow"
for a children's app. Show 4 poses in one image: front view standing, 3/4 view walking,
side view sitting, and a close-up happy face. Big friendly round eyes, soft rounded
body, no claws visible, no scary features.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean
readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color
palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Composition: character reference sheet layout, plain flat light-gray background, even
studio lighting, no background scenery.
Constraints: no text, no watermark, no scary expression, no sharp claws or teeth.
Aspect ratio: 1:1. Resolution: 2K.
```

### REF-02 — референс окружения/палитры

```
Create a wide illustration of a gentle meadow with soft rolling green hills, a few
colorful round flowers, a clear blue sky with 2-3 soft clouds, warm afternoon sunlight.
No characters, no objects, just the environment — this defines the color palette and
lighting mood for a whole children's game world.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean
readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color
palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Composition: wide landscape shot, eye-level, soft even daylight.
Constraints: no text, no watermark, no clutter, no scary elements.
Aspect ratio: 16:9. Resolution: 2K.
```

### REF-03 — референс стиля объектов (для банка 106 предметов)

```
Create a flat-lay reference grid of 6 simple everyday objects for a toddler learning
app: a red apple, a small drum, a blue car, a cup, an orange, a ball. Each object
clearly separated, centered in its own cell, on a plain white background.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean
readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color
palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Composition: 2x3 grid layout, straight-on flat view for each object, even soft lighting,
no shadows on the background.
Constraints: no text, no watermark, no background scenery, no clutter.
Aspect ratio: 4:3. Resolution: 2K.
```

### REF-04 — референс стиля UI-иконок

```
Create a reference sheet of 4 simple rounded UI icons for a toddler app: a house
(home button), a left arrow (back button), a padlock (parental gate), a speaker
(sound toggle). Simple, bold, friendly shapes, thick outlines matching a children's
book illustration style.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean
readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color
palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Composition: 2x2 grid, each icon centered, plain white background.
Constraints: no text, no watermark, no complex details, no small thin lines.
Aspect ratio: 1:1. Resolution: 1K.
```

**После генерации 4 референсов** — покажите их владельцу (себе) перед продолжением:
если стиль/цвет/Мяу выглядят не так, как хотелось — перегенерируйте референс ещё раз
(не переходите к 106 объектам на нестабильном референсе).

## 4. Как использовать референсы для остальных ассетов

В интерфейсе, где вы генерируете (AI Studio / Gemini app), прикрепите нужные референсы
как входные изображения и добавьте в промпт явную инструкцию, например:

```
Use the attached Image A (Meow character sheet) for the character's exact appearance,
and Image C (object style sheet) for the art style of the new object.

Generate: a single [ОБЪЕКТ] icon, centered, on a plain white background, matching
the exact same illustration style, line weight, and color saturation as Image C.
Constraints: no text, no watermark, no shadow on background, no extra objects.
Aspect ratio: 1:1. Resolution: 1K.
```

Замените `[ОБЪЕКТ]` на нужный предмет из `ASSET-MANIFEST.md` (например «a red apple»,
«a small brown drum», «a blue toy car»).

## 5. Шаблоны промптов по категориям (по одному примеру на категорию из манифеста)

Ниже — **готовые к копированию** примеры. Для остальных объектов той же категории —
замените только Subject (название объекта), всё остальное оставьте как есть, чтобы
стиль был одинаковым для всех ~106 объектов.

### Животные / птицы (категории 13.1–13.6) — пример: PET-01 «Мяу» уже сделан в REF-01;
пример для FARM-01 «корова»:

```
Use the attached Image A (Meow character sheet) and Image C (object style sheet) for
art direction — same illustration style, line weight, and palette.

Generate: a single friendly cartoon cow icon, standing, facing forward, simple and
recognizable silhouette, centered on a plain white background.
Constraints: no text, no watermark, no shadow on background, no extra objects, no
scary expression.
Aspect ratio: 1:1. Resolution: 1K.
```

*Для тихих животных (черепаха, рыбка, заяц, ёж...) — тот же шаблон, просто без слова
"friendly" не убирать, стиль тон сохраняется одинаковым независимо от звука.*

### Еда/фрукты/овощи (13.7–13.10) — пример FRUIT-01 «яблоко»:

```
Use the attached Image C (object style sheet) for art direction — same illustration
style, line weight, and palette.

Generate: a single red apple icon with a small green leaf, simple rounded shape,
centered on a plain white background.
Constraints: no text, no watermark, no shadow on background, no extra objects.
Aspect ratio: 1:1. Resolution: 1K.
```

### Транспорт (13.11) — пример VEH-01 «машина»:

```
Use the attached Image C (object style sheet) for art direction — same illustration
style, line weight, and palette.

Generate: a single small friendly cartoon car, side view, bright red color, simple
rounded shape with big round wheels, centered on a plain white background.
Constraints: no text, no watermark, no shadow on background, no extra objects, no
realistic proportions — keep it toy-like and simple.
Aspect ratio: 1:1. Resolution: 1K.
```

### Предметы дома / инструменты / одежда (13.12–13.14) — пример INSTR-01 «барабан»:

```
Use the attached Image C (object style sheet) for art direction — same illustration
style, line weight, and palette.

Generate: a single small round toy drum with two drumsticks crossed on top, warm brown
and red colors, centered on a plain white background.
Constraints: no text, no watermark, no shadow on background, no extra objects.
Aspect ratio: 1:1. Resolution: 1K.
```

### Полноэкранные сцены (пазл, welcome/menu bg, сцена прятки)

Пример **MENU-bg** (фон меню плиток) — зоны на карте **устарели**, не генерировать ZONE-*:

```
Use the attached Image B (environment/palette reference) and Image A (Meow character)
for style and mood consistency.

Generate: a wide, calm children's book illustration suitable as a full-screen menu
background. Soft planet / meadow / sky mood, gentle colors, open space on the left for
game tiles and open space on the right for a standing kitten mascot. No UI chrome drawn
in the image.
Constraints: no text, no watermark, no scary elements, readable shapes, not cluttered.
Aspect ratio: 3:2 (or 4:3). Resolution: 2K.
```

Пример **BALLOON-SKY-01** (фон «Лопни шарик», небо):

```
Use the attached Image B (palette / book-illustration reference).

Generate: a calm full-screen SKY background for toddlers — soft blue gradient, a few fluffy
white clouds, gentle daylight, no ground/meadow in foreground (balloons float in sky).
Leave lower-left area slightly calmer for a kitten mascot overlay (do not draw the cat).
Constraints: no text, no watermark, no scary weather, not cluttered.
Aspect ratio: 4:3 landscape (iPad). Resolution: 2K. Export 2048×1536.
```

Пример **BALLOON-01** (воздушный шар, один цвет — шаблон для всех 7):

```
Use the attached Image B (objects style reference).

Generate: ONE classic children's party balloon, [COLOR: red], glossy but soft book-illustration
style, simple oval balloon with a small knot/tie at the bottom and a short string curl.
Centered on plain white background for knockout.
Constraints: no text, no watermark, no face on balloon, same style for all colors in set.
Aspect ratio: ~4:5 portrait single object. Resolution: 1K. Export PNG → remove white bg.
```

Пример **MEOW-BALLOON-01** (Мяу слева, full body guide):

```
Use the attached Image A (Meow character sheet) — same character, do not redesign.

Generate: Meow the kitten standing, friendly, one paw slightly raised as if pointing at
balloons in the sky, looking upward-right, full body, plain white background.
Constraints: no text, no watermark, no balloons drawn (UI overlays balloons separately).
Aspect ratio: 1:1. Resolution: 1K PNG with transparency after knockout.
```

Пример **ICON-balloon-pop** (иконка игры 512²):

```
Use the attached Image B (objects/UI reference) for style consistency.

Generate: a single app-icon style illustration for a toddlers' game "pop the balloon":
one bright cheerful balloon, simple shapes, centered, reads clearly when small.
Plain white (or solid soft) background for later knockout to transparency.
Constraints: no text, no watermark, no extra objects, no busy scene.
Aspect ratio: 1:1. Resolution: 1K (export/use at 512×512).
```

**Озвучка реплик «Лопни шарик» (не Nano Banana):** голос записывается отдельно (TTS с
проверкой родителем или диктор). Один файл = одна **точная** фраза из `hintForTask` /
пулов похвалы в `src/games/balloon-pop/logic.ts`. Формат: **mp3**, моно, ~44.1 kHz,
без музыки на фоне, громкость выровнять между файлами. Имена — см. `ASSET-MANIFEST`
(`docs/assets/balloon-pop-VOICE-SCRIPT.md`). После добавления файлов в `public/assets/games/balloon-pop/voice/`
подключить воспроизведение в игре (с учётом «тихого режима» родителя).

Пример **WELCOME-bg**:

```
Use the attached Image B for palette/mood.

Generate: joyful full-screen title-screen background for a kids app "Planeta Meow":
soft cosmic meadow / planet toys mood, book-illustration style, room in the center/upper
third for a large animated title (do not draw the title text in the image).
Constraints: no text, no watermark, no scary elements.
Aspect ratio: 3:2. Resolution: 2K. Export/use at 1536×1024.
```

Пример **WELCOME-hero** (арт за CSS-заголовком «Планета Мяу»):

```
Use the attached Image A (Meow) and Image B (palette).

Generate: a soft transparent-friendly illustration of a cute fluffy kitten sitting on a
small friendly planet or floating with stars, centered, suitable behind a large title.
Constraints: no text, no watermark, no UI buttons, calm and adorable.
Aspect ratio: 1:1. Resolution: 1K (export 1024×1024 PNG with transparency).
```

Пример **VISIT-mark** / домик для кнопки «В гости к Мяу» (не плитка меню):

```
Use the attached Image B for style.

Generate: a tiny cozy kitten house icon, warm colors, very simple silhouette, centered,
reads clearly at small size on a button.
Constraints: no text, no watermark, plain background for knockout.
Aspect ratio: 1:1. Resolution: 1K (export/use at 256×256).
```

### Мяу — дополнительные состояния/позы (MEOW-02…07) — пример MEOW-02 «радостный»:

```
Use the attached Image A (Meow character sheet) — same character, same exact colors
and proportions, do not redesign the character.

Generate: Meow the cat, jumping happily with front paws up, big joyful smile, eyes
closed with happiness, on a plain white background.
Constraints: no text, no watermark, no shadow on background, keep exact same character
design as reference.
Aspect ratio: 1:1. Resolution: 1K.
```

## 6. Прозрачный фон — важная техническая правда

В документации Gemini/Nano Banana Pro **нет** отдельного параметра «прозрачный фон
(alpha-канал)» — модель рисует полноценное изображение с фоном. Практический путь для
объектов, которым в игре нужна прозрачность (банк 106 объектов, шарики, Мяу-позы, UI):

1. В промпте всегда просите **plain white background** (уже сделано в шаблонах выше).
2. Удалите белый фон отдельным шагом — например через remove.bg, встроенный
   «Remove Background» в Google Photos/Figma, или любой похожий бесплатный
   инструмент — и сохраните как PNG с прозрачностью.
3. Полноэкранные сцены (зоны, пазл-картинки, фон прятки) — фон **не убираем**, они и
   должны быть цельной картинкой.

## 7. Соотношения сторон и разрешение — из официальной таблицы Gemini 3 Pro Image

| Тип ассета | Aspect ratio | Разрешение |
|---|---|---|
| Иконки объектов банка, UI-иконки, Мяу-состояния | `1:1` | `1K` (1024×1024) — этого достаточно для тайлов/иконок на iPad |
| Референсы (стилевые листы) | `1:1` или `4:3` | `2K` — чуть больше деталей для сверки стиля |
| Полноэкранные сцены/зоны/пазл-картинки | `4:3` (или `16:9`, если сцена шире) | `2K` |

Поддерживаемые моделью значения aspect ratio (весь список, на будущее):
`1:1, 1:4, 1:8, 2:3, 3:2, 3:4, 4:1, 4:3, 4:5, 5:4, 8:1, 9:16, 16:9, 21:9`.
Разрешение: `1K, 2K, 4K` (у Gemini 3.1 Flash Image есть ещё `512`).

## 8. После генерации — обязательная проверка

Модель **не идеальна в мелких деталях** (это прямо написано в документации Google
DeepMind) — перед тем как класть файл в `public/assets/`, посмотрите на:

- не «сплыл» ли стиль (сравните с референсом);
- нет ли лишних предметов в кадре, которых не просили;
- нормально ли выглядит на маленьком размере (уменьшите картинку в предпросмотре).

Если что-то не так — не правьте вручную, просто перегенерируйте с уточнением в
Constraints, что именно убрать/поправить.

## 9. Звук/музыка/голос — выбран отдельный инструмент

Nano Banana Pro не создаёт звук. **ЗАФИКСИРОВАНО владельцем 22.09.2026:** музыка и
фон — через **Suno**, голос Мяу и озвучка — через **ElevenLabs**. Промпты для обоих
— §10–11 ниже (факты взяты из официальной документации ElevenLabs и актуальных гайдов
по Suno v5.5, проверено веб-поиском 22.09.2026).

---

## 10. Suno — промпты для музыки/фона зон

**Факт (проверено):** в Suno (Custom Mode, v5.5) два поля работают по-разному:

- **Style** (до 1000 символов) — обычный текст через запятую: жанр, темп/BPM,
  инструменты, настроение, качество продакшна. **Никаких квадратных скобок** здесь —
  скобки — это только для поля Lyrics.
- **Lyrics** — текст песни + структурные метатеги в квадратных скобках: `[Verse]`,
  `[Chorus]`, `[Bridge]`, `[Intro]`, `[Outro]`, `[Instrumental]`.
- «Сладкая зона» — **6–12 тегов** в Style, самые важные — в начале (модель сильнее
  учитывает то, что написано раньше).
- Слайдеры: **Style Influence** (строго/свободно следовать Style), **Weirdness**
  (обычность/нестандартность), **Exclude** (что НЕ должно быть — сюда, а не в Style
  как «no drums»).

**Для «Планеты Мяу» нужна фоновая музыка без слов** — сейчас **меню плиток**
(`music-menu.mp3` + тихая `music-menu-quiet.mp3`, луп 30–60 сек). Музыка «по зонам»
устарела. В поле **Lyrics всегда только `[Instrumental]`**.

### Шаблон Style-поля (меню)

```
gentle instrumental lullaby, warm acoustic, soft xylophone and glockenspiel, slow
tempo 70 BPM, cozy and calm mood, toddler app background loop, no vocals, no sudden
loud sounds
```

### Пример — BGM меню плиток (спокойный, не резкий)

- **Style:** `cheerful instrumental, playful ukulele and soft marimba, light bouncy
  rhythm 100 BPM, sunny and friendly mood, toddler app background loop, no vocals,
  no harsh percussion`
- **Lyrics:** `[Instrumental]`
- Слайдеры: Style Influence — **Strong**, Weirdness — низкий/средний, Exclude:
  `drums, distortion, vocals, sudden loud hits`.

### Пример — ночь в домике Мяу (тихая версия / BGM-night)

- **Style:** `very soft instrumental lullaby, gentle music box and soft strings, very
  slow tempo 55 BPM, dreamy and quiet mood, bedtime app background loop, no vocals,
  no percussion`
- **Lyrics:** `[Instrumental]`

**Проверка после генерации:** прослушать луп на «склейке» конец→начало — если слышен
щелчок/скачок, попросить Suno сделать вариацию или обрезать/кроссфейднуть вручную
перед тем как класть файл в `public/assets/audio/`.

---

## 11. ElevenLabs — промпты для голоса Мяу и коротких звуков

**Факт (проверено, официальная документация ElevenLabs, модель Eleven v3):**

- Голос управляется **audio tags** прямо в тексте, в квадратных скобках, перед
  фразой, которую они меняют: `[warm]`, `[gentle]`, `[curious]`, `[excited]`,
  `[whispers]`, `[giggles]`, `[sighs]`, `[pause]`, `[short pause]`.
- Eleven v3 **не поддерживает** SSML `<break>` — паузы делаются тегами `[pause]` /
  `[short pause]` / `[long pause]` или многоточием «…».
- Для многоязычности (РУ + EN буквы, §2.14) — модель `eleven_multilingual_v2`
  поддерживает русский (`ru`) в списке языков.
- Отдельная модель **`eleven_text_to_sound_v2`** генерирует **короткие звуковые
  эффекты прямо из текстового описания** (не голос) — это альтернатива поиску
  звуков на стоках для части банка объектов (см. `FREE-RESOURCES-RESEARCH.md`).

### Шаблон фразы Мяу (голос, ласковый, не резкий — тон уже зафиксирован в продукте)

```
[warm] [gentle] Здорово! [pause] Давай попробуем ещё раз.
```

```
[curious] Ой, а где же спрятался мячик? [short pause] [giggles]
```

**Важно для нашего продукта:** избегать тегов `[shouts]`, `[angry]`, `[crying]` —
не подходят под тон «мягкая поддержка, никогда не ругаем» (общее продуктовое правило
о soft-error). Разрешённый набор тегов для Мяу: `[warm]`, `[gentle]`, `[curious]`,
`[excited]` (умеренно), `[giggles]`, `[sighs]` (только для сонных сцен «В гостях у
Мяу»), `[pause]`/`[short pause]`.

### Шаблон для eleven_text_to_sound_v2 (короткий звук вместо стока)

```
A short, soft, non-startling "pop" sound of a balloon bursting, cute and gentle, no
sharp bang, suitable for a toddler app. Duration: 0.5 seconds.
```

```
A single friendly "moo" sound of a cartoon cow, warm and soft, not loud, suitable for
a toddler learning app. Duration: 1-2 seconds.
```

**Проверка после генерации:** каждую фразу/звук прослушать на реальной громкости
iPad — правило продукта «без резких/пугающих звуков» (§ безопасность) обязательно к
соблюдению, при малейшем сомнении — перегенерировать с более мягким описанием.

---

## 12. Игра «Изучаем звуки с Мяу» — иллюстрации карточек (2.2)

Полная спецификация экрана, safe area и таблица **30** id → filename:
[`sound-world-CARD-ART.md`](sound-world-CARD-ART.md).

**Куда класть файлы:** `public/assets/bank/<id>.png` (общий банк §13, kebab-case как
в `ASSET-MANIFEST`). **Не генерировать** PNG для букв — в UI только CSS-плитки.

**Стиль:** тот же блок Style из §2 этого гайда (книжная иллюстрация), на **каждый**
объект — отдельный промпт по шаблону из CARD-ART §5. Сначала 3–4 якоря из одной
категории (например cat, dog, cow + car), затем остальные с референсами.

### Пример промпта — «Кошка» (PET-01 / `cat.png`)

```
Subject: a single friendly cartoon cat for toddlers, sitting calmly, soft fluffy orange
fur, big round eyes.
Action: relaxed pose, slight head tilt, approachable smile.
Setting: no scenery — isolated for a toddler flashcard app.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean
readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color
palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Composition: centered, cat fills about 70% of frame height, plain transparent background.
Constraints: no text, no watermark, no scary claws, no collar tag text, no card border.
Aspect ratio: 1:1. Resolution: 2K. Export: 512×512 PNG with alpha.
```

### Пример промпта — «Скорая» (`ambulance.png`)

```
Subject: a single friendly cartoon ambulance van for toddlers, simplified rounded shape,
soft red and white colors, no realistic gore or emergency scene.
Action: static side view, calm.
Setting: isolated object, transparent background.
Style: (same Style block as §2 — copy verbatim).
Composition: centered, vehicle fills ~70% of frame height, readable silhouette at small size.
Constraints: no flashing light effects drawn as harsh streaks, no text on vehicle, no siren
sound visualization, no people, no card frame.
Aspect ratio: 1:1. Resolution: 2K. Export: 512×512 PNG with alpha.
```

**MEGAFILE:** при сборке мегафайла промптов включить все 30 строк из CARD-ART §4
(один блок на файл), плюс опциональные SW-BG/SW-CARD только если откажемся от CSS-рамки.

---

## 13. Игра «Куда положить?» — корзинки, игрушки, фон (2.3)

Полная таблица id → filename, safe area и **шаблоны промптов** (корзинка, игрушка, фон):
[`sort-colors-ART.md`](sort-colors-ART.md).

**Куда класть:** `public/assets/games/sort-colors/` (см. ART § «Куда класть»).

**Порядок:** сначала пара **circle/red** (шарик) — проверить, что силуэт на корзинке и игрушке
**одинаковый**; затем остальные 4 пары; фон — последним.

**UI без текста на PNG:** подписи «Мячик», «Кубик»… рисует приложение, не модель.

### Пример — игрушка SORT-TOY-01 (`sort-toy-circle-red.png`)

```
Subject: a single toddler sorting toy — soft red ball / sphere, solid warm red (#e85d5d),
friendly cartoon prop, chunky and graspable look.
Action: static, no cast shadow on background (alpha).
Setting: isolated, transparent background.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean
readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color
palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Composition: object centered, fills ~70% of frame height.
Constraints: no basket, no text, no face, no watermark, no extra decorations.
Aspect ratio: 1:1. Resolution: 2K. Export: 512×512 PNG with alpha.
```

**MEGAFILE:** 5× (корзинка + игрушка) + 1× фон из `sort-colors-ART.md`.

---

## 14. Игра «Собери пазл» — 6 сцен (2.4)

Таблица id → filename и шаблон промпта: [`puzzle-ART.md`](puzzle-ART.md).

**Куда класть:** `public/assets/games/puzzle/scenes/puzzle-*.png`.

**Порядок:** якоря **Поляна** + **Мяу дома** → остальные 4 сцены одним стилем.

**Формат:** 4:3 landscape **1024×768** (см. `puzzle-ART.md`). Сетка в игре: **4 / 6 / 9** прямоугольников.

Кусочки **не** генерируем отдельно — UI режет цельную картинку. До S16 — tint + URL fallback.

---

## 15. Игра «Собери фигурку» — шаблоны и фигуры (2.5)

Таблица id → filename и промпты: [`shape-build-ART.md`](shape-build-ART.md).

**Куда класть:** `public/assets/games/shape-build/templates/` и `public/assets/games/shape-build/pieces/`.

**Порядок:** одна фигура (circle) + шаблон «Дом» → проверка масштаба на доске → остальные 4 шаблона и 4 фигуры.

---

## 16. Игра «Прятки» — 5 локаций (2.6)

Таблица id → filename и промпты: [`hide-seek-ART.md`](hide-seek-ART.md). **5×5** предметов; позиции в коде (`shuffleTargetPositions`) — при экспорте PNG сверять safe zones.

**Куда класть:** `public/assets/games/hide-seek/scenes/hide-*.png`.

**Порядок:** **Комната** (якорь) → поляна → пляж → лес → площадка.
