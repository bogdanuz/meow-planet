# МЕГАФАЙЛ ассетов «Планета Мяу»

**Дата:** 24 сентября 2026 · **Статус:** **ЗАФИКСИРОВАНО** (владелец: «утверждаю мегафайл», 24.09.2026)  
**Код (скелет):** **0.15.21** · **Бренд:** `BRANDBOOK.md` · **Промпты NBP:** `GENERATION-GUIDE.md`  
**Инвентарь 106 объектов:** `ASSET-MANIFEST.md` (таблицы §13) · **Не дублировать** банк здесь построчно.

> **SSOT для генерации:** этот файл + брендбук.  
> **Приложения** (`*-ART.md`) — детальные промпты; при расхождении приоритет у **кода** и этой таблицы.  
> **S16 активен:** генерация и подключение ассетов **строго по этому файлу** (скелет кода не менять без отдельного согласования).

---

## Оглавление

1. [Как пользоваться](#1-как-пользоваться-s16)  
2. [Карта экранов (факт UI)](#2-карта-экранов-факт-ui-01521)  
3. [Якоря REF-01…04](#3-якоря-ref-0104)  
4. [Хаб: welcome, menu, boot, PWA](#4-хаб-welcome-menu-boot-pwa)  
5. [8 иконок меню + «В гости»](#5-8-иконок-меню--в-гости)  
6. [Мяу: спрайты и позы](#6-мяу-спрайты-и-позы)  
7. [UI chrome + splash](#7-ui-chrome--splash)  
8. [Игра 1 — Лопни шарик](#8-игра-1--лопни-шарик)  
9. [Игра 2 — Изучаем звуки](#9-игра-2--изучаем-звуки)  
10. [Игра 3 — Куда положить?](#10-игра-3--куда-положить)  
11. [Игра 4 — Собери пазл](#11-игра-4--собери-пазл)  
12. [Игра 5 — Собери фигурку](#12-игра-5--собери-фигурку)  
13. [Игра 6 — Прятки](#13-игра-6--прятки)  
14. [Игра 7 — Времена года](#14-игра-7--времена-года)  
15. [Игра 8 — В гостях у Мяу](#15-игра-8--в-гостях-у-мяу)  
16. [Игра 9 — Считаем с Мяу](#16-игра-9--считаем-с-мяу)  
17. [Звук, музыка, голос](#17-звук-музыка-голос)  
18. [Приложения и архив](#18-приложения-и-архив)  
19. [Чеклист владельца перед S16](#19-чеклист-владельца-перед-s16)

---

## 1. Как пользоваться (S16)

| Шаг | Действие |
|-----|----------|
| 1 | Сгенерировать **REF-01…04** (`GENERATION-GUIDE.md` §3) |
| 2 | **Хаб** (§4) + **PWA** (`PWA-APP-ICON.md`) + **8 ICON** (§5) |
| 3 | Пакет **UI icons** (`UI-ICONS-OWNER-BATCH.md`) |
| 4 | **BGM/SFX** по `MUSIC-BGM-MANIFEST.md` + sfx игр |
| 5 | Игры **по одной** (§8–16); после каждой партии — проверка на iPad |
| 6 | Банк **106** — `ASSET-MANIFEST.md` §13 (общие `bank/*.png`) |
| 7 | Подключение в код — агент в S16; manifest precache — следить за размером |

**Nano Banana Pro поля** (каждый промпт): Subject · Action · Setting · Style (§2 GUIDE) · Composition · Constraints · Aspect ratio · Resolution 2K → export по таблице.

---

## 2. Карта экранов (факт UI 0.15.21)

| Экран / игра | Визуал | Звук |
|--------------|--------|------|
| **Boot splash** | CSS + % precache | опц. `music-boot-pad.mp3` |
| **Welcome** | фон, hero, Play, ⚙/звук снизу | whoosh → menu |
| **Menu** | 8 плиток + CTA «В гости», ⚙ справа сверху | BGM menu |
| **Parent** | капча → вкладки Настройки / Об играх | beep тест |
| **9 игр** | см. §8–16 | sfx + опц. BGM |
| **PWA** | icon 192/512, apple-touch | — |

**Не генерировать:** ZONE-01…05 (`archive/docs/zones-asset-obsolete.md`).

**Единый подложечный слой игр (P15-V1):** один стиль «обоев» экрана (CSS сейчас; опц. одна иллюстрация-backdrop позже).

---

## 3. Якоря REF-01…04

| ID | Назначение | Путь | Промпт |
|----|------------|------|--------|
| REF-01 | Мяу character sheet | `_reference/ref-meow-sheet.png` | `GENERATION-GUIDE.md` §3 REF-01 |
| REF-02 | Палитра луг/небо | `_reference/ref-meadow-palette.png` | §3 REF-02 |
| REF-03 | UI prop (optional) | `_reference/ref-ui-prop.png` | §3 |
| REF-04 | Object style sample | `_reference/ref-object-sample.png` | §3 |

В каждый запрос: *Use attached Image A (REF-01) for character; Image B (REF-02) for palette.*

---

## 4. Хаб: welcome, menu, boot, PWA

Landscape **3:2**, генерация **2K**, export **1536×1024** для full-screen bg (WebP допустим).

| ID | Назначение | Файл | Путь | Прозр. |
|----|------------|------|------|--------|
| WELCOME-bg | фон welcome | `welcome-bg.png` | `public/assets/shell/` | нет |
| WELCOME-hero | арт за CSS-заголовком | `welcome-hero.png` | `shell/` | да |
| MENU-bg | фон меню (сетка + зона Мяу) | `menu-bg.png` | `shell/` | нет |
| BOOT-art | опц. art на splash | `boot-planet.png` | `shell/` | да |
| VISIT-mark | домик на CTA | `menu-visit-mark.png` | `public/assets/menu/` | да |
| PWA-* | иконки установки | см. `PWA-APP-ICON.md` | `public/` | нет |

**Welcome/menu промпты (кратко):** космос/планета/луг; **без текста**; место под CSS «Планета Мяу»; справа на menu — зона под стоящего Мяу (~⅓ ширины).

---

## 5. 8 иконок меню + «В гости»

**512×512 PNG α**, **название игры на art** (читаемо на ~120px).  
Путь: `public/assets/menu/icons/`

| ID | Игра | Файл |
|----|------|------|
| ICON-balloon-pop | Лопни шарик | `icon-balloon-pop.png` |
| ICON-sound-world | Изучаем звуки | `icon-sound-world.png` |
| ICON-sort-colors | Куда положить? | `icon-sort-colors.png` |
| ICON-puzzle | Собери пазл | `icon-puzzle.png` |
| ICON-shape-build | Собери фигурку | `icon-shape-build.png` |
| ICON-hide-seek | Прятки | `icon-hide-seek.png` |
| ICON-seasons | Времена года | `icon-seasons.png` |
| ICON-counting | Считаем с Мяу | `icon-counting.png` |

**Не в сетке:** meow-home — только CTA + `VISIT-mark`.  
Полные промпты иконок: `GENERATION-GUIDE.md` § menu icons.

---

## 6. Мяу: спрайты и позы

| ID | Где | Файлы | Путь |
|----|-----|-------|------|
| MASCOT-menu | меню CTA | `meow-menu-idle-01…04.png` | `public/assets/mascot/` |
| MASCOT-idle/happy/point/sleep | игры, chrome | `meow-{idle,happy,pointing,sleepy}.png` | `mascot/` |
| MASCOT-coat/rain | seasons (опц.) | `meow-coat.png`, `meow-raincoat.png` | `mascot/` |

Скелет: CSS `mascot-ph`; PNG — S16.

---

## 7. UI chrome + splash

| ID | Статус 0.15.x | Финал |
|----|---------------|-------|
| UI back/home/settings/sound | PLACEHOLDER SVG | `UI-ICONS-OWNER-BATCH.md` |

Splash: код `boot-loader.ts` — art опционален (§4 BOOT-art).

---

## 8. Игра 1 — Лопни шарик

**Папка:** `public/assets/games/balloon-pop/`

| ID | Файл | px | Примечание |
|----|------|-----|------------|
| BALL-bg | `balloon-sky-bg.webp` | 1536×1024 | небо, без шариков на art |
| BALL-01…05 | `balloon-{red,orange,yellow,green,violet}.png` | 256×320 α | 5 цветов поля |
| VOICE-* | `voice/*.mp3` | — | `balloon-pop-VOICE-SCRIPT.md` |

Промпты шариков и неба: `GENERATION-GUIDE.md` § balloon.  
Мяу на сцене: опционально отдельный PNG (`meow-looking-up.png`).

---

## 9. Игра 2 — Изучаем звуки

**Карточки объектов:** `public/assets/bank/<id>.png` (512² α) — список **30** id → `sound-world-CARD-ART.md` §4 + `enabled-ids.ts`.  
**Буквы:** только CSS (без PNG).  
**Инструменты (P15-07):** экраны с zones — после PNG владельца разметка hotspots:

| instrument | Файл (целевой) | Зоны |
|------------|----------------|------|
| drum | `instrument-drum-kit.png` | 4 pads |
| piano | `instrument-piano.png` | 7 keys |
| guitar | `instrument-guitar.png` | 6 strings |
| maracas | `instrument-maracas.png` | 2 |
| tambourine, bell, xylophone | `instrument-*.png` | см. код `instrument-view.ts` |

SFX: `public/assets/games/sound-world/sfx/` (частично есть).  
Детали: `sound-world-CARD-ART.md`, `sound-world-AUDIO-SOURCES.md`.

---

## 10. Игра 3 — Куда положить?

**Папка:** `public/assets/games/sort-colors/`  
Таблица SORT-BG, 5 корзинок, 5 игрушек (форма+цвет 1:1): **`sort-colors-ART.md`**.  
Подписи корзин **только UI** (Мячик, Кубик, …).

---

## 11. Игра 4 — Собери пазл

**Папка:** `public/assets/games/puzzle/scenes/`  
6 сцен 4:3 **1024×768** — **`puzzle-ART.md`**.  
Кусочки **не** храним (CSS crop). Custom photo — только IndexedDB (не в мегафайле).

---

## 12. Игра 5 — Собери фигурку

**10 шаблонов** в коде: house, car, fish, meow, rocket, sun, flower, boat, apple, star-bunny.  
Workflow WHOLE → нарезка parts: **`shape-build-ART.md`**.  
**Папка:** `public/assets/games/shape-build/parts/<template>/`.

---

## 13. Игра 6 — Прятки

**5 локаций** 4:3 — SSOT targets: `src/games/hide-seek/logic.ts`  
**Папка:** `public/assets/games/hide-seek/scenes/`

| ID | RU (header) | Файл |
|----|-------------|------|
| HIDE-01 | Комната | `hide-room.png` |
| HIDE-02 | Поляна | `hide-meadow.png` |
| HIDE-03 | Пляж | `hide-beach.png` |
| HIDE-04 | Лес | `hide-forest.png` |
| HIDE-05 | Площадка | `hide-playground.png` |

Промпты: **`hide-seek-ART.md`**. Объекты — placeholder или опц. PNG α 512².

---

## 14. Игра 7 — Времена года

**Одна композиция:** **двор + детская площадка** (МКД, качели, песочница); **4 сезона** — варианты art или color-grade слоёв.

| ID | Файл | Сезон |
|----|------|-------|
| SEASON-yard-summer | `seasons-yard-summer.png` | якорь |
| SEASON-yard-autumn | `seasons-yard-autumn.png` | |
| SEASON-yard-winter | `seasons-yard-winter.png` | + снеговик зона |
| SEASON-yard-spring | `seasons-yard-spring.png` | |

**2048×1536** или **1536×1024** landscape; погода — FX CSS + опц. overlay PNG.  
Мяу: одежда в UI (куртка tap); радуга — только логика дождь→солнце.  
Иконки погоды/сезонов: UI или emoji до art-panels.

---

## 15. Игра 8 — В гостях у Мяу

3 сцены + кровать/одеяло + уход: **`meow-home-ART.md`** (MH-01…03, MH-BED-*, MH-CARE-*).  
**Папка:** `public/assets/games/meow-home/scenes/`.  
Часы — overlay в коде, **не** цифры на PNG.

---

## 16. Игра 9 — Считаем с Мяу

**Без маскота** на экране (P15).  
Предметы 🍎⭐🐟 — **`counting`** chips: опц. `count-chip-apple.png` и т.д. (512² α) или CSS placeholders.  
Голос чисел 1–10: `count-01.mp3` … `ASSET-MANIFEST.md`.

---

## 17. Звук, музыка, голос

| Категория | SSOT |
|-----------|------|
| **BGM** (welcome, menu, dayparts, sleep, игры, seasons) | `MUSIC-BGM-MANIFEST.md` |
| **UI SFX** | `ASSET-MANIFEST.md` + `_candidates/ui-sounds/` |
| **Игровые sfx** | по папкам игр + `THIRD_PARTY_NOTICES.md` |
| **Голос Мяу** | ElevenLabs, тексты → `src/content/` |
| **Suno / музыка** | промпты `GENERATION-GUIDE.md` §10 |

---

## 18. Приложения и архив

| Файл | Содержание |
|------|------------|
| `sort-colors-ART.md` | корзинки, игрушки, фон |
| `puzzle-ART.md` | 6 сцен |
| `shape-build-ART.md` | 10 шаблонов, нарезка |
| `hide-seek-ART.md` | 5 фонов |
| `sound-world-CARD-ART.md` | 30 карточек + инструменты |
| `meow-home-ART.md` | 3 сцены, кровать, уход |
| `UI-ICONS-OWNER-BATCH.md` | chrome icons |
| `PWA-APP-ICON.md` | установка iPad |
| `MUSIC-BGM-MANIFEST.md` | все треки |
| `balloon-pop-VOICE-SCRIPT.md` | голос шариков |

Устаревшие зоны и audit backlog: **`archive/docs/`** (не SSOT).

---

## 19. Чеклист владельца перед S16

- [ ] Прочитаны **BRANDBOOK.md** + этот **MEGAFILE.md**
- [ ] REF-01…04 сгенерированы и «узнаваемы»
- [x] **«утверждаю мегафайл»** — 24.09.2026
- [ ] Подготовлены папки `public/assets/` по путям выше
- [ ] Для каждого MP3 — файл лицензии
- [ ] План партий: хаб → иконки → 1–2 игры → банк → остальное

**После утверждения:** массовая генерация = **S16**; подключение в код — задачи агента по файлам из таблиц.
