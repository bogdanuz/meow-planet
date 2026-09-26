# Реестр ассетов «Планета Мяу»

Одна строка — один файл. Как делать следующий файл — в [ASSET-PRODUCTION-PLAYBOOK.md](ASSET-PRODUCTION-PLAYBOOK.md). Стиль — в [BRANDBOOK.md](BRANDBOOK.md).

Проверено по папкам 26.09.2026. **Welcome + Menu — validated.** Картинок игр и голосовых mp3 balloon-pop в репозитории пока нет. Статус `generated` / `integrated` / `validated` — только где файл есть и (для `integrated`) подключён в коде.

Статусы: `planned`, `brief-ready`, `generated`, `selected`, `edited`, `integrated`, `validated`, `rejected`, `archived`.

Мастер якорей: `assets-master/reference/`. В игру эти файлы не копируются.

## Якоря (в игру не идут)

| ID | Экран/игра | Назначение | Filename | Путь | Тип | Размер | Ratio | Статус | Source | License | Integrated | Validated | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| REF-STYLE | стиль | Стиль, палитра, узор | ref-style-board.jpg | assets-master/reference/ | jpg | 2752×1536 | 16:9 | selected | owner | own | no | no | Утверждён 25.09.2026 на все игры. В игру не идёт, WebP не нужен |
| REF-01 | стиль | Лист Мяу | ref-meow-sheet.jpg | assets-master/reference/ | jpg | 2400×1792 | 4:3 | selected | owner | own | no | no | Белый девон-рекс, 6 поз. Канон персонажа |
| REF-POSE | стиль | Позы Мяу | ref-meow-poses.jpg | assets-master/reference/ | jpg | 2048×2048 | 1:1 | generated | owner | own | no | no | Покой, лапа вправо, радость, сон. В игру не идёт |
| REF-02 | стиль | Луг и небо | ref-meadow.jpg | assets-master/reference/ | jpg | 2752×1536 | 16:9 | generated | owner | own | no | no | Без кота. Та же гуашь, что стиль-якорь |
| REF-03 | стиль | Сетка предметов | ref-objects.jpg | assets-master/reference/ | jpg | 4800×3584 | 4:3 | generated | owner | own | no | no | 6 предметов. Чёрные линии сетки в игре не используем |
| REF-04 | стиль | Сетка UI-иконок | ref-ui-icons.jpg | assets-master/reference/ | jpg | 4096×4096 | 1:1 | generated | owner | own | no | no | Дом, назад, звук, шестерёнка. Без сетки |

## Вход

| ID | Экран/игра | Назначение | Filename | Путь | Тип | Размер | Ratio | Статус | Source | License | Integrated | Validated | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WELCOME-bg | welcome, boot | Фон | welcome-bg.webp | public/assets/shell/ | webp | 2400×1792 | 4:3 | validated | owner | own | yes | yes | Утверждён 25.09.2026 вместе с welcome |
| MENU-bg | menu | Фон меню | menu-bg.webp | public/assets/shell/ | webp | 2400×1792 | 4:3 | validated | owner | own | yes | yes | Утверждён 26.09.2026 вместе с menu |
| WELCOME-meow | welcome | Поза «покажи на кнопку» | welcome-meow.png | public/assets/shell/ | png | 1115×1400 | 1:1 | validated | owner | own | yes | yes | Утверждён 25.09.2026 |
| WELCOME-title | welcome | Надпись «Планета Мяу» | welcome-title.png | public/assets/shell/ | png | 2458×426 | 16:9 | validated | owner | own | yes | yes | Утверждён 25.09.2026 |
| WELCOME-play | welcome | Кнопка «Играть» | welcome-play.png | public/assets/shell/ | png | 1429×1390 | 1:1 | validated | owner | own | yes | yes | Слово на картинке обрезано. Утверждён 25.09.2026 |
| MENU-meow | menu | Танец на площадке, 6 кадров | frame_01…06.png | public/assets/mascot/menu-dance/ | png | 808×960 | — | integrated | owner | own | yes | yes | Лист `assets-master/mascot/menu-meow-dance-sheet.jpg`. Пинг-понг 180 мс |
| GATE-turn | orientation | Поворот планшета | gate-turn.png | public/assets/shell/ | png | — | — | planned | owner | own | no | no | Два кадра для reduced motion |
| UI-settings | хаб | Настройки | icon-settings.png | public/assets/ui/icons/ | png | с листа REF-04 | 1:1 | validated | owner | own | yes | yes | Вырезано из ref-ui-icons.jpg |
| UI-sound-on | welcome | Звук вкл | icon-sound.png | public/assets/ui/icons/ | png | с листа REF-04 | 1:1 | validated | owner | own | yes | yes | Выкл — та же картинка, тише |
| UI-sound-off | welcome | Звук выкл | icon-sound.png | public/assets/ui/icons/ | png | с листа REF-04 | 1:1 | validated | owner | own | yes | yes | |
| UI-back | chrome | Назад | icon-back.png | public/assets/ui/icons/ | png | с листа REF-04 | 1:1 | validated | owner | own | yes | yes | |
| UI-home | chrome | Домой | icon-home.png | public/assets/ui/icons/ | png | с листа REF-04 | 1:1 | validated | owner | own | yes | yes | |
| PWA-192 | установка | Иконка | pwa-icon-192.png | public/ | png | 192 | 1:1 | shipped | owner | own | no | no | Мяу в корзине |
| PWA-512 | установка | Иконка | pwa-icon-512.png | public/ | png | 512 | 1:1 | shipped | owner | own | no | no | |
| PWA-apple | установка | Apple touch | apple-touch-icon.png | public/ | png | 180 | 1:1 | shipped | owner | own | no | no | |
| FONT-fredoka | весь UI | Шрифт | Fredoka-variable.ttf | src/assets/fonts/ | ttf | — | — | integrated | Fredoka Project | OFL-1.1 | yes | no | Уже локально. Notices есть |

## Карточки меню

Девять иконок 1:1 с названием на картинке (две строки). Мастер: `assets-master/menu/card-<id>.jpg` → PNG 1024 в `public/assets/menu/`. Скрипт: `node scripts/process-menu-cards.mjs`.

| ID | Экран/игра | Filename | Путь | Статус | Integrated | Notes |
|---|---|---|---|---|---|---|
| CARD-balloon | Лопни шарик | card-balloon-pop.png | public/assets/menu/ | integrated | yes | v2 серия 25.09 |
| CARD-sound | Изучаем звуки | card-sound-world.png | public/assets/menu/ | integrated | yes | |
| CARD-sort | Куда положить? | card-sort-colors.png | public/assets/menu/ | integrated | yes | |
| CARD-puzzle | Собери пазл | card-puzzle.png | public/assets/menu/ | integrated | yes | |
| CARD-shape | Собери фигурку | card-shape-build.png | public/assets/menu/ | integrated | yes | |
| CARD-hide | Прятки | card-hide-seek.png | public/assets/menu/ | integrated | yes | |
| CARD-seasons | Времена года | card-seasons.png | public/assets/menu/ | integrated | yes | |
| CARD-count | Считаем с Мяу | card-counting.png | public/assets/menu/ | integrated | yes | |
| CARD-home | В гости (у Мяу) | menu-visit-bed.png | public/assets/menu/ | integrated | yes | Лежанка+когтеточка; кот — слой UI на платформе |

## Игры — уже названные файлы

Старые детальные промпты: `archive/docs/assets-pre-consolidation/`. Статус всех строк `planned`, файлов нет.

| ID | Экран/игра | Назначение | Filename | Путь | Тип | Размер | Ratio | Статус | Source | License | Integrated | Validated | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BALL-bg | balloon-pop | Небо с лёгкими облаками | balloon-sky-bg.webp | public/assets/games/balloon-pop/ | webp | 2400×1792 | 4:3 | integrated | owner | own | yes | no | Мастер `balloon-pop-sky.jpg` 26.09.2026 |
| BALLOON-01 | balloon-pop | Красный | balloon-red.png | public/assets/games/balloon-pop/ | png | с листа | — | integrated | owner | own | yes | no | Лист `balloon-pop-balloons-sheet.png` |
| BALLOON-02 | balloon-pop | Оранжевый | balloon-orange.png | public/assets/games/balloon-pop/ | png | с листа | — | integrated | owner | own | yes | no | |
| BALLOON-03 | balloon-pop | Жёлтый | balloon-yellow.png | public/assets/games/balloon-pop/ | png | с листа | — | integrated | owner | own | yes | no | |
| BALLOON-04 | balloon-pop | Зелёный | balloon-green.png | public/assets/games/balloon-pop/ | png | с листа | — | integrated | owner | own | yes | no | |
| BALLOON-05 | balloon-pop | Фиолетовый | balloon-violet.png | public/assets/games/balloon-pop/ | png | с листа | — | integrated | owner | own | yes | no | Без синего шарика |
| BALLOON-meow-idle | balloon-pop | Мяу ведущий, покой | meow-presenter-idle.png | public/assets/games/balloon-pop/ | png | с листа | — | integrated | owner | own | yes | no | Дыхание CSS `meow-idle` |
| BALLOON-meow-happy | balloon-pop | Похвала / говорит | meow-presenter-happy.png | public/assets/games/balloon-pop/ | png | с листа | — | integrated | owner | own | yes | no | |
| BALLOON-meow-miss | balloon-pop | Мягкий промах | meow-presenter-miss.png | public/assets/games/balloon-pop/ | png | с листа | — | integrated | owner | own | yes | no | Без слёз/злости |
| BALLOON-voice | balloon-pop | Реплики Мяу | *.mp3 (39) | public/assets/games/balloon-pop/voice/ | mp3 | — | — | integrated | owner | own | yes | no | Нарезка с `balloon-pop-voice-reel.mp3` 26.09.2026 |
| PUZZLE-01…06 | puzzle | 6 сцен | puzzle-meow-home.png, puzzle-meadow.png, puzzle-forest.png, puzzle-sea.png, puzzle-winter.png, puzzle-summer.png | public/assets/games/puzzle/scenes/ | png | 1024×768 черновик | 4:3 | planned | owner | own | no | no | Кусочки отдельно не храним |
| HIDE-01…05 | hide-seek | 5 локаций | hide-room.png, hide-meadow.png, hide-beach.png, hide-forest.png, hide-playground.png | public/assets/games/hide-seek/scenes/ | png | — | 4:3 | planned | owner | own | no | no | Пляж зафиксирован 22.09.2026 |
| MH-01…03 | meow-home | Ванная, день, ночь | meow-bathroom.png, meow-room-day.png, meow-room-night.png | public/assets/games/meow-home/scenes/ | png | — | — | planned | owner | own | no | no | Часы не рисовать на картинке |
| SEASON-yard-* | seasons | Двор на 4 сезона | seasons-yard-summer.png и autumn, winter, spring | public/assets/games/seasons/ | png | черновик 1536×1024 | 3:2 | planned | owner | own | no | no | Отдельного ART-файла не было |
| COUNT-chip-* | counting | Яблоко, звезда, рыбка | count-chip-apple.png, count-chip-star.png, count-chip-fish.png | public/assets/games/counting/ | png | 512 | 1:1 | planned | owner | own | no | no | Мяу на этом экране нет |
| SW-cards | sound-world | 18 животных + 6 транспорт + 5 инструментов | `{id}.png` | public/assets/games/sound-world/cards/ | png | ~1K | 1:1 | integrated | owner | own | yes | no | Мастера JPEG в `assets-master/games/sound-world/`. Скрипт `npm run assets:sound-world` |
| SW-play | sound-world | Экраны 5 инструментов | `{id}.png` | public/assets/games/sound-world/play/ | png | ~4:3 | 4:3 | integrated | owner | own | yes | no | Барабан, маракасы, колокольчик, пианино, гитара |
| SW-letters-ru | sound-world | 33 буквы А–Я | `ru-01.png`…`ru-33.png` | public/assets/games/sound-world/letters/ | png | с листа | — | integrated | owner | own | yes | no | Лист имел дубли; кляксы под глифом снимаются без обрезки ножек |
| SW-letters-en | sound-world | 26 букв A–Z | `en-A.png`…`en-Z.png` | public/assets/games/sound-world/letters/ | png | с листа | — | integrated | owner | own | yes | no | Лист 7×4 |
| SW-voice-letters | sound-world | Озвучка А–Я и A–Z | `letter-ru-*.mp3`, `letter-en-*.mp3` | public/assets/games/sound-world/sfx/ | mp3 | с дорожек | — | integrated | owner | own | yes | no | Нарезка `Русский алфавит.mp3` / `Английский алфавит.mp3` |
| SW-sfx-ship | sound-world | Корабль | ship.mp3 | public/assets/games/sound-world/sfx/ | mp3 | — | — | integrated | owner | own | yes | no | Мастер `корабль.mp3` |

Банк из 106 предметов (PET, FARM, WILD, EXOT, BIRD, SEA, FRUIT, VEG, FOOD, TREAT, VEH, HOME, INSTR, WEAR) остаётся со старыми ID и именами файлов из архивного манифеста. Папка будущей копии: `public/assets/bank/<filename>`. Все строки `planned`. В «Изучаем звуки» идут только те, у кого в старом манифесте столбец «Звук в 2.2» = да. Этот список не переписывался.

## Аудио хаба и игр

| ID | Экран/игра | Назначение | Filename | Путь | Статус | Integrated | Notes |
|---|---|---|---|---|---|---|---|
| AUD-hub-music | welcome, menu | Фон хаба, зацикл | hub-music.mp3 | public/assets/audio/ | integrated | yes | |
| AUD-game-music | игры (7 из 9) | Общий фон игр | game-music.mp3 | public/assets/audio/ | integrated | yes | Нет в «В гостях» и «Времена года». Обычные игры ~20%, «Изучаем звуки» и «Считаем с Мяу» ~5%. Fade in/out 280 ms |
| AUD-ui-transition | переходы | SFX смены экрана | ui-transition.mp3 | public/assets/audio/ | integrated | yes | startSec 0.95 |
| AUD-balloon-pop | balloon-pop | Лопнуть шарик | balloon-pop.mp3 | public/assets/audio/ | integrated | yes | |
| AUD-soft-miss | все игры | Мягкий промах | soft-miss.mp3 | public/assets/audio/ | integrated | yes | |

Остальные голоса и sfx игр — `planned`. Банк sound-world: на диске LICENSE и JSON, не как готовые ассеты.
