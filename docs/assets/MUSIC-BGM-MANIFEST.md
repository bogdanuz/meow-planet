# Музыка и фон (BGM) — манифест для владельца

**Дата:** 24.09.2026 (расширено) · **Статус:** ЧЕРНОВИК  
**Лицензии:** только **бесплатные** (CC0, Pixabay License, CC-BY с записью) + `LICENSE-<track>.txt`  
**Папка:** `public/assets/music/` · **Подключение в код:** S16 (после P15)

---

## Как читать таблицы

| Колонка | Значение |
|---------|----------|
| **Где** | экран / режим игры |
| **Когда играет** | старт / loop / crossfade |
| **Quiet** | `_quiet.mp3` или gain −6…−10 dB в коде |
| **Не играет** | если `musicEnabled` off или quiet без музыки |

---

## 1. Хаб и загрузка

| ID | Где | Файл | Настроение | Quiet |
|----|-----|------|------------|-------|
| BGM-welcome | **Приветствие** | `music-welcome.mp3` | «звёздная планета», тёплый invite | `music-welcome-quiet.mp3` |
| BGM-menu | **Меню** плиток | `music-menu.mp3` | игривый, лёгкий (marimba/ukulele) | `music-menu-quiet.mp3` |
| BGM-boot | **Splash загрузки** (опц.) | `music-boot-pad.mp3` | 15–30 с ultra-soft pad, можно = welcome | опц. |
| SFX-whoosh | welcome→menu | `sfx-whoosh.mp3` | SFX, не loop | — |

**Логика:** welcome → (whoosh) → menu; boot — только если не режет precache (иначе без музыки на boot).

---

## 2. Сутки и «режим дня» (meow-home + общий слой)

Игра **«В гостях у Мяу»** и частично **seasons** — привязка к **утро / день / вечер / ночь / сон**.

| ID | Период | Файл | Где используется | Поиск (бесплатно) |
|----|--------|------|------------------|-------------------|
| BGM-daypart-morning | **Утро** 06–11 | `music-daypart-morning.mp3` | meow-home «утро», опц. counting старт | gentle wake, birds soft |
| BGM-daypart-day | **День** 11–17 | `music-daypart-day.mp3` | meow-home комната, default game bed | sunny playful calm |
| BGM-daypart-evening | **Вечер** 17–21 | `music-daypart-evening.mp3` | meow-home вечер, уход за Мяу | warm acoustic, slow |
| BGM-daypart-night | **Ночь** 21–06 | `music-daypart-night.mp3` | meow-home ночь (не сон) | quiet moon, music box |
| BGM-sleep | **Сон / укладывание** | `music-sleep.mp3` | meow-home: Мяу в кровати, одеяло; **родитель может оставить** | lullaby, 60–90 BPM, **no vocals** |
| BGM-sleep-deep | **Глубокий сон** (опц.) | `music-sleep-deep.mp3` | тот же экран, crossfade после 2–3 мин | ambient sleep |

**Рекомендация:** `music-meow-home.mp3` в старых таблицах **заменить** на daypart-набор + sleep; в коде — выбор по `period` + сцене.

---

## 3. Настройки

Играет **та же петля, что меню** (`hub-music.mp3`). Отдельный тихий трек не используем.

| ID | Где | Файл | Настроение |
|----|-----|------|------------|
| BGM-parent | Раздел «Для родителей» | `music-parent-neutral.mp3` | **очень тихий** neutral pad или **тишина** |

**Рекомендация:** по умолчанию **без BGM** (только sfx beep теста звука).

---

## 4. Игры — матрица (что включать)

| Игра | BGM | ID файла | Комментарий |
|------|-----|----------|-------------|
| balloon-pop | да | `music-balloon-pop.mp3` | лёгкий праздник |
| sound-world | **нет** / pad −24 dB | — | приоритет sfx и инструментов |
| sort-colors | да | `music-sort-colors.mp3` | спокойный ритм |
| puzzle | да | `music-puzzle.mp3` | focus, без напряжения |
| shape-build | да | `music-shape-build.mp3` | песочница «Собери что угодно!»: тихо, звуки ударов деталей главнее |
| hide-seek | да | `music-hide-seek.mp3` | curiosity |
| seasons | **4 сезона** + daypart опц. | `music-seasons-*.mp3` | см. §5 |
| counting | да | `music-counting.mp3` | простой pulse; без отвлечения |
| meow-home | **daypart + sleep** | §2 | главный потребитель «утро/ночь» |

**Fallback:** `music-game-default.mp3` — если per-game файл ещё не положен.

---

## 5. Времена года (seasons)

| ID | Режим | Файл | Идея |
|----|-------|------|------|
| BGM-seasons-spring | Весна | `music-seasons-spring.mp3` | птицы, рост |
| BGM-seasons-summer | Лето | `music-seasons-summer.mp3` | солнце, прогулка |
| BGM-seasons-autumn | Осень | `music-seasons-autumn.mp3` | листья, waltz |
| BGM-seasons-winter | Зима | `music-seasons-winter.mp3` | **лёгкое новогоднее** без слов, bells дозировано |
| BGM-seasons-rain-pad | Дождь | `music-seasons-rain-pad.mp3` | ambient rain (или только sfx) |
| BGM-seasons-rainbow | Радуга | `music-seasons-rainbow-stinger.mp3` | 3–5 с stinger |

Crossfade между сезоном и погодой: 1–2 с.

---

## 6. Stingers (коротко, не loop)

| ID | Событие | Файл |
|----|---------|------|
| STING-complete | Пазл / фигурка / раунд | `sting-complete.mp3` |
| STING-celebrate | Шарики / praise | `sting-celebrate.mp3` |
| STING-meow-yawn | Мяу зевает / сон | `sting-yawn.mp3` |

---

## 7. Карта «экран → музыка» (для кода S16)

```
boot (опц.) → welcome BGM → menu BGM
game:* → per-game OR default; sound-world OFF
meow-home → daypart by period; night scene → night; bed → sleep
seasons → BGM-seasons-{season}; rainbow → stinger
parent → silence
```

---

## 8. Где искать (бесплатно)

Pixabay Music, OpenGameArt (CC0), Free Music Archive (CC0/CC-BY), YouTube Audio Library — см. LICENSE каждого трека.

**Не использовать:** нелицензированные mp3.

---

## 9. Чеклист владельца

1. [ ] UI chrome — `UI-ICONS-OWNER-BATCH.md`
2. [ ] **PWA icon** — `PWA-APP-ICON.md`
3. [ ] Welcome + menu (+ quiet)
4. [ ] **Daypart** morning/day/evening/night + **sleep** (+ quiet опц.)
5. [ ] Per-game OR default
6. [ ] Seasons ×4 + rainbow stinger
7. [ ] Stingers (опц.)
8. [ ] LICENSE на каждый файл

См. `MEGAFILE.md`, `P15-SKELETON-POLISH-ROADMAP.md` (ASSET-BGM).
