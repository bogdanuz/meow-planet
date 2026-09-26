# Игра «Собери пазл» — иллюстрации сцен (2.4)

Мяу на сценах — **белый девон-рекс** (`GENERATION-GUIDE.md`). Упоминания orange tabby ниже не использовать.

**Дата:** 24.09.2026 · **SSOT механики:** `docs/games/S14-puzzle-BRIEF.md`, `MVP-GAMES-DETAILED.md` §4

## Принцип

- **6** цельных сцен в формате **4:3 (альбом)**; в коде режутся на **4 / 6 / 9** прямоугольных частей (сетка из настроек игры).
- Отдельные PNG **кусочков не храним** — `background-size` / `background-position` на DOM.
- **Своё фото:** родитель добавляет **в игре** (**+**); crop **4:3**, export **960×720** JPEG → IndexedDB (`meow-planet.puzzle-photos`). Не облако, без камеры в MVP.

**Папка сцен:** `public/assets/games/puzzle/scenes/`

| ID | RU (aria) | Filename | Статус в репо |
|---|---|---|---|
| PUZZLE-01 | Мяу дома | `puzzle-meow-home.png` | S16 — сгенерировать |
| PUZZLE-02 | Поляна | `puzzle-meadow.png` | S16 (якорь стиля; может быть локально для dev) |
| PUZZLE-03 | Лес | `puzzle-forest.png` | S16 |
| PUZZLE-04 | Море | `puzzle-sea.png` | S16 |
| PUZZLE-05 | Зима | `puzzle-winter.png` | S16 |
| PUZZLE-06 | Лето | `puzzle-summer.png` | S16 |

**Галерея в UI:** квадратные **превью** (cover crop из того же файла); подпись RU — только `aria-label`.

## Размеры и safe area

| Назначение | Размер | Заметки |
|---|---|---|
| Сцена (файл) | **1024×768** PNG (или WebP + PNG fallback) | 4:3; даунскейл с 2K |
| Custom photo (IDB) | **960×720** JPEG ~0.88 quality | Тот же 4:3; pan в crop-modal |
| Превью в галерее | из CSS (~4–5 rem) | не отдельный файл |
| Кусочек на доске | доля доски | читаемость: **крупные формы**, контраст subject/фон |

- **Safe area:** главный объект **не** у самого края — при нарезке 3×3 углы должны оставаться узнаваемыми.
- **Без текста** на иллюстрации.
- Мелкие детали (листья, мелкий рисунок) — минимум; иначе 2–3 года не сопоставят фрагмент.

## Стиль

Блок **Style** из `GENERATION-GUIDE.md` §2 — **дословно** во все промпты.

## Шаблон промпта (сцена)

```
Subject: a single friendly toddler puzzle illustration — {SCENE_DESC}, one clear main subject,
warm storybook scene for ages 2-3.
Action: calm static scene, no scary elements.
Setting: {SCENE_SETTING}.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean
readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color
palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Composition: main subject slightly off-center OK; simple background; high contrast subject vs
background so each rectangular piece remains recognizable when cropped.
Constraints: no text, no watermark, no clutter, no realistic violence; mascot cat only for
"Meow at home" scene (PUZZLE-01).
Aspect ratio: 4:3 landscape. Resolution: 2K. Export: 1024×768 PNG.
```

### SCENE_DESC / SETTING

| ID | SCENE_DESC | SCENE_SETTING |
|---|---|---|
| PUZZLE-01 | orange tabby Meow cat at cozy home window with cushion | warm indoor, soft daylight |
| PUZZLE-02 | sunny meadow with large flowers and gentle hill | outdoor spring |
| PUZZLE-03 | friendly forest clearing with two simple trees | woodland |
| PUZZLE-04 | calm sea, small boat, soft beach | seaside |
| PUZZLE-05 | gentle snow, friendly snowman, soft flakes | winter |
| PUZZLE-06 | summer park sandbox and sun | warm summer |

## Порядок генерации (S16)

1. **Поляна (02)** + **Мяу дома (01)** — утвердить стиль и контраст при нарезке 2×2 и 3×3.
2. Лес, море, зима, лето — тем же шаблоном.
3. Проверка в dev: `#/game/puzzle`, сетки 4/6/9, custom photo не ломает crop.

## Звук (не PNG)

| ID | Назначение | Статус |
|---|---|---|
| PUZZLE-SFX-* | pickup, snap, wrong, complete | **Web Audio** в `puzzle-sfx.ts` (MVP); опционально mp3 позже |
| PUZZLE-VOICE-* | похвала голосом | S16 / запись владельца; тексты — `praise.ts` |

## MEGAFILE

6 промптов по таблице выше → `MEGAFILE.md` (черновик S15). Ссылка из `GENERATION-GUIDE.md` §14.
