# Игра «Прятки» — сцены и объекты (2.6)

**Дата:** 24.09.2026 · **SSOT UX:** `docs/games/S14-hide-seek-BRIEF.md` ( **0.15.11** )

## Принцип

- **5** фоновых локаций (landscape **4:3**); на каждой **5** tap-целей (`logic.ts`).
- Позиции **перемешиваются в коде** (`shuffleTargetPositions`) — при экспорте PNG закладывайте **несколько «ниш»** по сцене, не один фиксированный объект в пикселе.
- **Паттерн-стиль** до S16: CSS; после S16 — фон PNG + опционально спрайты или hotspots.
- Задание «Найди …» — **mission bar** в игре (не текст на PNG).

**Папка:** `public/assets/games/hide-seek/scenes/`

| ID | RU | Filename | Статус |
|---|---|---|---|
| HIDE-01 | Комната | `hide-room.png` | S16 |
| HIDE-02 | Поляна | `hide-meadow.png` | S16 |
| HIDE-03 | Пляж | `hide-beach.png` | S16 |
| HIDE-04 | Лес | `hide-forest.png` | S16 |
| HIDE-05 | Площадка | `hide-playground.png` | S16 |

## Размеры

| Asset | Export | Заметки |
|---|---|---|
| Фон сцены | **2048×1536** WebP или **1024×768** PNG 4:3 | Safe area по центру |
| Объект (опц.) | **512×512** PNG α | «Выглядывает» из-за мебели/куста |
| Picker preview | **256×256** | `previews/hide-pick-{id}.png` или CSS-паттерн до S16 |

## Объекты по сценам (id → labelRu)

Список синхронизирован с `HIDE_SCENES` в `logic.ts`.

### HIDE-01 Комната

ball · pillow · lamp · book · **toy**

### HIDE-02 Поляна

flower · butterfly · mushroom · bee · **sun**

### HIDE-03 Пляж

shell · crab · bucket · fish · **boat**

### HIDE-04 Лес

berry · cone · snail · leaf · **nest**

### HIDE-05 Площадка

swing · slide · ball-pg · car-toy · **kite**

## Шаблон промпта — фон сцены

```
Subject: toddler seek-and-find game background — {SCENE_DESC}, wide readable play area,
few large hiding spots where small objects could peek out.
Action: static daytime, calm, no characters in scene.
Setting: {SCENE_SETTING}.
Style: (GENERATION-GUIDE §2 verbatim).
Composition: landscape 4:3, lower third richer ground detail, upper simpler sky/wall.
Constraints: no text, no watermark, no scary elements, no tiny clutter, no Meow in scene (MVP).
Aspect ratio: 4:3 landscape. Resolution: 2K. Export: 1024×768 PNG or WebP 2048×1536.
```

| ID | SCENE_DESC | SCENE_SETTING |
|---|---|---|
| HIDE-01 | cozy child room | warm room, rug, toy corner |
| HIDE-02 | sunny meadow | grass and flowers |
| HIDE-03 | calm beach | sand and shallow sea |
| HIDE-04 | friendly forest glade | trees, bushes |
| HIDE-05 | toddler playground | swing, slide, sand |

## Порядок генерации

1. Комната → dev-проверка tap-зон с shuffle слотов.  
2. Остальные 4 локации.  
3. Спрайты объектов — только если не рисуем в фоне.

## Звук

Polish: Web Audio в `hide-seek-sfx.ts`; mp3 опционально S16.
