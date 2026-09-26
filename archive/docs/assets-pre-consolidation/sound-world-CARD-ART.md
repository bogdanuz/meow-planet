# «Изучаем звуки с Мяу» — визуальные ассеты карточек

**Дата:** 24 сентября 2026 · **Статус:** черновик для MEGAFILE / S16  
**Код:** `src/games/sound-world/` · **Звук:** `docs/assets/sound-world-AUDIO-SOURCES.md`  
**Общий стиль промптов:** `GENERATION-GUIDE.md` §2.

## 1. Экран и сетка (iPad landscape, без скролла)

| Вкладка | Карточек | Колонки × строки | Примечание |
|---|---|---|---|
| Животные | 18 | 6 × 3 | все строки одной высоты (`1fr`) |
| Транспорт | 6 | 3 × 2 | крупнее, по центру по ширине |
| Инструменты | 6 | 3 × 2 | то же |
| Буквы RU | 33 | **~7 × 5** (авто) | только **CSS**-плитки, без PNG |
| Буквы EN | 26 | **~7 × 4** (авто) | скрывается, если в настройках «без ABC» |

Chrome игры: без маскота Мяу; заголовок + «Назад/Домой» — см. `shell.css`  
`.app-shell--sound-world` (**`grid-template-rows: auto 1fr`**, иначе main не растягивается).  
Плитка на экране: **квадрат 1:1** (CSS `aspect-ratio` сетки = cols/rows + карточка в ячейке).  
Игровая зона: лёгкий radial-gradient (CSS), не PNG.

**Touch:** кнопки ≥ 56 px; карточки растягиваются по ячейке сетки, подпись RU  
внизу карточки (шрифт взрослый, `screen__lead--adult`).

## 2. Два слоя UI (важно для генерации)

1. **Рамка карточки** — сейчас **CSS** (белый фон, скругление ~1 rem, обводка accent).  
   Отдельный PNG «фон карточки» **не обязателен** для MVP.
2. **Иллюстрация объекта** — PNG с **прозрачным фоном**, одна на объект;  
   переиспользуется из общего банка §13 (те же имена файлов, что в `ASSET-MANIFEST`).

Путь в коде (когда подключим арт):  
`public/assets/bank/<kebab-id>.png`  
(как у остальных игр с банком объектов; id = `catalog.ts` / `enabled-ids.ts`).

## 3. Размеры иллюстраций (ориентир под сетку)

Генерировать **квадрат 1:1**, экспорт **512×512 px** (2K в промпте — для деталей;  
в игру класть 512 или 384 после сжатия).

| Режим сетки | Доля экрана у иллюстрации | Safe area (не обрезать силуэт) |
|---|---|---|
| 6×3 (18) | ~11–13 vw / vh clamp | центр 85% кадра, без мелких деталей по краям |
| 3×2 (6) | до ~14 vh | тот же safe area, объект можно чуть крупнее в кадре |
| Буквы | — | **не генерировать PNG**; финал = CSS (`letterTileStyle`, градиент, accent палитра §2) |

**Композиция промпта:** один объект по центру, **3/4 или фронт**, читаемый силуэт  
с 1–2 м, без текста, без рамки, без тени-подложки под объектом (тень только  
«мягкая на земле» опционально, но лучше без — фон прозрачный).

## 4. Список MVP (30 объектов в игре)

Соответствие **id** (код) → **filename** (банк) → вкладка. Статус арта: как в  
§13 `ASSET-MANIFEST` («Нужно сгенерировать»); sfx уже локально в  
`public/assets/games/sound-world/sfx/`.

### Животные (18)

| id | RU | filename |
|---|---|---|
| cat | Кошка | `cat.png` |
| dog | Собака | `dog.png` |
| cow | Корова | `cow.png` |
| horse | Лошадь | `horse.png` |
| pig | Свинья | `pig.png` |
| hen | Курица | `hen.png` |
| rooster | Петух | `rooster.png` |
| duck | Утка | `duck.png` |
| goose | Гусь | `goose.png` |
| sheep | Овца | `sheep.png` |
| bear | Медведь | `bear.png` |
| wolf | Волк | `wolf.png` |
| lion | Лев | `lion.png` |
| elephant | Слон | `elephant.png` |
| monkey | Обезьяна | `monkey.png` |
| owl | Сова | `owl.png` |
| whale | Кит | `whale.png` |
| seal | Тюлень | `seal.png` |

### Транспорт (6)

| id | RU | filename |
|---|---|---|
| car | Машина | `car.png` |
| train | Поезд | `train.png` |
| ambulance | Скорая | `ambulance.png` |
| police-car | Полиция | `police-car.png` |
| ship | Корабль | `ship.png` |
| helicopter | Вертолёт | `helicopter.png` |

### Инструменты (6)

| id | RU | filename |
|---|---|---|
| drum | Барабан | `drum.png` |
| tambourine | Бубен | `tambourine.png` |
| maracas | Маракасы | `maracas.png` |
| bell | Колокольчик | `bell.png` |
| piano | Пианино | `piano.png` |
| guitar | Гитара | `guitar.png` |

## 5. Шаблон промпта (Nano Banana Pro → MEGAFILE)

Подставить `{OBJECT_EN}` и `{OBJECT_RU}` (RU — для ваших заметок, в промпт EN).

```
Subject: a single friendly {OBJECT_EN} for toddlers, full body or clear iconic view.
Action: calm neutral pose, approachable expression, not running toward camera.
Setting: no scenery — isolated character/object for a flashcard.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean
readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color
palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Composition: centered, single subject fills about 70% of frame height, plain transparent
background (no floor line unless very subtle).
Constraints: no text, no watermark, no scary teeth/claws, no realistic blood, no weapons,
no cluttered background, no card frame or border drawn in the image.
Aspect ratio: 1:1. Resolution: 2K. Export for app: 512×512 PNG with alpha.
Reference: use REF-02 from GENERATION-GUIDE for palette; reuse style from previous
animal/vehicle icons in this game set when available.
```

### Подсказки по категориям

- **Животные:** мультяшно-узнаваемые, не фотореализм; хищники — без агрессии.
- **Транспорт:** упрощённые формы, яркие но мягкие цвета; сирены **не** рисовать  
  отдельным эффектом на иконке (звук уже в sfx).
- **Инструменты:** один инструмент, без рук/музыканта; барабан — вид сверху или  
  под углом, но силуэт читается.

## 6. Опционально позже (не MVP)

| ID | Назначение | Filename | Комментарий |
|---|---|---|---|
| SW-BG-01 | фон игровой зоны | `sound-world-playfield.png` | только если CSS-gradient недостаточен; 2048×1536, без UI |
| SW-CARD-01 | текстура рамки | `sound-world-card-bg.png` | 9-slice; сейчас достаточно CSS |

## 7. Чеклист перед «Проверено»

- [ ] Силуэт читается на белой карточке и на gradient playfield.
- [ ] Рядом в сетке 6×3 нет «слипшихся» по цвету соседей (конtrast).
- [ ] Имя файла = id из таблицы §4.
- [ ] Положить в `public/assets/bank/`; обновить статус строки в `ASSET-MANIFEST`.
- [ ] Подключение в коде sound-world (замена placeholder) — отдельная задача S16.
