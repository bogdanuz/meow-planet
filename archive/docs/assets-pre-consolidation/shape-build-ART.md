# Игра «Собери фигурку» — шаблоны и детали (2.5)

**Дата:** 24.09.2026 · **SSOT:** `docs/games/S14-shape-build-BRIEF.md`

## Два способа арта (выбор владельца — викторина S14)

| Подход | Плюсы для 2–3 лет | Минусы |
|---|---|---|
| **A. Код (placeholder/CSS)** | Быстро в S14; цвет + форма читаются; как сортировка | Слабее «это домик», абстрактнее |
| **B. Нарезка в Photoshop (рекомендуем для S16)** | Каждая деталь **узнаваема** (кровля, колесо); как toddler wooden puzzle | Ручная нарезка; 3–5 PNG на шаблон |
| **C. Гибрид (рекомендация агента)** | S14: polish UX + placeholder; параллельно генерите **B** для 1–2 шаблонов-якорей | Два этапа подключения |

**Рынок (toddler shape / picture builders):** крупные **предметные** кусочки (кровля выглядит как кровля) удерживают внимание лучше, чем один жёлтый треугольник «без истории». Логику MVP (**без rotate**) можно сохранить с любым артом.

---

## Workflow владельца (вариант B / C — нарезка)

1. **Сгенерировать цельную картинку** по промпту «готовый домик» на **белом или очень светлом** фоне, детали **крупные**, между частями **зазор** 2–4% (удобнее резать).
2. В Photoshop: вырезать **N деталей** → PNG **с alpha**, без фона.
3. Имена файлов — **строго** по таблице ниже (код S16 маппит `slot.id` → файл).
4. Опционально: та же цельная картинка **уменьшенная** как фон доски (`*-preview.png` или тот же файл в CSS `opacity`).

**Не генерируем** отдельно «абстрактный круг колеса», если в шаблоне колесо — часть art машины (уникальный PNG на слот).

---

## Папки

```
public/assets/games/shape-build/
  templates/           # цельные картинки для генерации/превью (можно не класть в prod)
  parts/
    house/
    car/
    fish/
    meow/
    rocket/
  previews/            # опционально: иконка picker 256²
```

---

## Таблица шаблонов → детали (MVP 5 шаблонов)

Слоты совпадают с `src/games/shape-build/logic.ts` (`slot.id`).

### SHAPE-TPL-01 — Дом (`house`) — **3 детали**

| slot.id | Форма (логика) | Filename (PNG α) | RU (aria) |
|---|---|---|---|
| `house-roof` | triangle | `parts/house/shape-house-roof.png` | Крыша |
| `house-body` | square | `parts/house/shape-house-body.png` | Стены |
| `house-door` | rect | `parts/house/shape-house-door.png` | Дверь |

**Промпт цельной картинки (MEGAFILE / генератор):**

```
Subject: a simple toddler house picture on plain white background — triangle roof, square walls,
rectangle door, friendly cartoon, chunky shapes with visible gaps between roof, body and door.
Action: static front view, completed house.
Setting: isolated on white (#ffffff), no scenery clutter.
Style: (GENERATION-GUIDE §2 verbatim).
Composition: house centered, each region large enough to cut as separate PNG; soft outlines
between parts; colors warm pastel.
Constraints: no text, no watermark, no shadows on white, no extra objects.
Aspect ratio: 4:3 landscape. Resolution: 2K. Export: 1024×768 PNG.
```

**После нарезки:** 3 файла в `parts/house/`; в MEGAFILE одна строка «HOUSE-WHOLE» + три строки частей.

---

### SHAPE-TPL-02 — Машина (`car`) — **4 детали**

| slot.id | Форма | Filename | RU |
|---|---|---|---|
| `car-cabin` | square | `parts/car/shape-car-cabin.png` | Кабина |
| `car-body` | rect | `parts/car/shape-car-body.png` | Кузов |
| `car-wheel-l` | circle | `parts/car/shape-car-wheel.png` | Колесо |
| `car-wheel-r` | circle | *(тот же файл)* | Колесо |

**Правило колёс:** один PNG **`shape-car-wheel.png`**, в игре **два** экземпляра; snap **any_slot** (форма circle, любой свободный слот-круг).

**Промпт цельной:**

```
Subject: toddler cartoon car on white background — square cabin, rectangle body, two circle wheels,
clear gaps between parts, side view, friendly colors.
(... Style, Constraints as house ...)
Aspect ratio: 4:3. Export: 1024×768 PNG.
```

**Нарезка:** 3 уникальных файла (кабина, кузов, колесо); колесо ×2 в коде.

---

### SHAPE-TPL-03 — Рыбка (`fish`) — **3 детали**

| slot.id | Форма | Filename | RU |
|---|---|---|---|
| `fish-body` | circle | `parts/fish/shape-fish-body.png` | Тело |
| `fish-tail` | triangle | `parts/fish/shape-fish-tail.png` | Хвост |
| `fish-eye` | circle | `parts/fish/shape-fish-eye.png` | Глаз |

**Промпт цельной:** cartoon fish on white, circle body, triangle tail, small circle eye, gaps visible.

---

### SHAPE-TPL-04 — Мяу (`meow`) — **4 детали**

| slot.id | Форма | Filename | RU |
|---|---|---|---|
| `meow-ear-l` | triangle | `parts/meow/shape-meow-ear.png` | Ушко |
| `meow-ear-r` | triangle | *(тот же ear PNG, mirror в CSS)* | Ушко |
| `meow-head` | circle | `parts/meow/shape-meow-head.png` | Головка |
| `meow-body` | rect | `parts/meow/shape-meow-body.png` | Туловище |

**Промпт цельной:** friendly orange tabby cat face+body on white, two triangle ears, round head, oval/rect body, gaps for cutting.

---

### SHAPE-TPL-05 — Ракета (`rocket`) — **4 детали**

| slot.id | Форма | Filename | RU |
|---|---|---|---|
| `rocket-tip` | triangle | `parts/rocket/shape-rocket-tip.png` | Нос |
| `rocket-body` | rect | `parts/rocket/shape-rocket-body.png` | Корпус |
| `rocket-window` | circle | `parts/rocket/shape-rocket-window.png` | Иллюминатор |
| `rocket-fin` | star | `parts/rocket/shape-rocket-fin.png` | Плавник |

**Промпт цельной:** cute rocket on white, triangle tip, rect body, circle window, star fin, clear separation.

---

## Picker (выбор шаблона)

| ID | Filename | Export |
|---|---|---|
| SHAPE-PICK-01…10 | `previews/shape-pick-{id}.png` | **256×256** PNG, crop из цельной или отдельный иконочный промпт |

**Промпт иконки (шаблон):** «same {object} as template, centered, simple, white or transparent bg, 1:1, 256px».

---

## SHAPE-TPL-06…10 — новые шаблоны (S14, итого 10)

| id | RU | Детали | Папка `parts/` |
|---|---|---|---|
| `sun` | Солнце | 2 | `sun/` — circle center + 4–6 rect rays as **one** «лучи» piece or 2 parts: `shape-sun-core`, `shape-sun-rays` |
| `flower` | Цветок | 3 | `flower/` — center circle, petals circle ring (square slot), stem rect |
| `boat` | Лодка | 3 | `boat/` — hull rect, sail triangle, flag rect |
| `apple` | Яблочко | 3 | `apple/` — body circle, leaf triangle, stem rect |
| `star-bunny` | Звёздный зайчик | 3 | `star-bunny/` — head circle, body circle, star badge |

Для каждого — **WHOLE** промпт (white bg, gaps) + нарезка как у дома. Picker: `previews/shape-pick-{id}.png` (256²).  
**Беклог S16+:** бабочка (4), дерево (3) — по запросу владельца.

### Пример WHOLE — солнце (2 детали)

```
Subject: toddler sun on white — large yellow circle center, separate arc of soft rectangular
rays as one grouped piece OR clearly separated ray band, minimal cute face optional (simple dots).
Style: (GENERATION-GUIDE §2). Gaps for 2-part cut. 4:3 1024×768.
```

---

## Legacy: общие геометрические PNG (если выберете только код)

Если **без** нарезки — опционально 5 файлов `pieces/shape-piece-{circle|square|…}.png` (512² α), цвет tint в CSS.  
**SSOT при выборе C:** сначала код + placeholders; общие pieces **не** обязательны.

---

## Звук S16

| ID | Назначение |
|---|---|
| SHAPE-SFX-pickup / snap / wrong / complete | как `puzzle-sfx.ts` |

---

## MEGAFILE (формат строки для владельца)

Для каждого шаблона **две группы**:

1. `{TEMPLATE}-WHOLE` — полный промпт 1024×768 white bg.  
2. `{TEMPLATE}-PART-{slot.id}` — имя файла после нарезки (без повторного промпта, пометка «нарезка из WHOLE»).

Пример:

```
HOUSE-WHOLE | prompt: … | export puzzle-meow-home style | 1024×768
HOUSE-PART-house-roof | file: parts/house/shape-house-roof.png | from: HOUSE-WHOLE
HOUSE-PART-house-body | file: parts/house/shape-house-body.png | from: HOUSE-WHOLE
HOUSE-PART-house-door | file: parts/house/shape-house-door.png | from: HOUSE-WHOLE
```

---

## Порядок работ (S16)

1. **Дом** — whole → нарезка 3 → проверка в dev.  
2. **Машина** — колесо one PNG ×2.  
3. Рыбка, Мяu, ракета.  
4. Picker previews 256².
