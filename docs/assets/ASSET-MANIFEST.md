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
| REF-OLLI-01 | стиль | Лист совы | ref-owl-sheet.jpg | assets-master/reference/ | jpg | — | 4:3 | selected | owner | own | no | no | Канон Олли, 6 видов. В игру не идёт. 30.09.2026 |
| REF-OLLI-POSE | стиль | Позы совы | ref-owl-poses.jpg | assets-master/reference/ | jpg | — | 1:1 | selected | owner | own | no | no | Покой, крыло, радость, сон. В игру не идёт. 30.09.2026 |
| REF-02 | стиль | Луг и небо | ref-meadow.jpg | assets-master/reference/ | jpg | 2752×1536 | 16:9 | generated | owner | own | no | no | Без кота. Та же гуашь, что стиль-якорь |
| REF-03 | стиль | Сетка предметов | ref-objects.jpg | assets-master/reference/ | jpg | 4800×3584 | 4:3 | generated | owner | own | no | no | 6 предметов. Чёрные линии сетки в игре не используем |
| REF-04 | стиль | Сетка UI-иконок | ref-ui-icons.jpg | assets-master/reference/ | jpg | 4096×4096 | 1:1 | generated | owner | own | no | no | Дом, назад, звук, шестерёнка. Без сетки |

## Вход

| ID | Экран/игра | Назначение | Filename | Путь | Тип | Размер | Ratio | Статус | Source | License | Integrated | Validated | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| WELCOME-bg | welcome | Фон | welcome-bg.webp | public/assets/shell/ | webp | 2400×1792 | 4:3 | integrated | owner | own | yes | yes | С 30.09.2026 лесная поляна вместо луга. Мастер `assets-master/shell/welcome-bg-forest.jpg` |
| BOOT-bg | boot | Отдельная лесная поляна | boot-forest-bg.webp | public/assets/shell/boot/ | webp | 2048×1536 | 4:3 | integrated | Cursor GenerateImage | own | yes | no | Мастер `assets-master/shell/boot/boot-forest-clearing.jpg`; 30.09.2026 |
| BOOT-title | boot | «УСТАНОВКА И ПОДГОТОВКА ИГР» | boot-title.png | public/assets/shell/boot/ | png | 1225×333 | — | integrated | Cursor GenerateImage | own | yes | no | Точный текст, прозрачный слой |
| BOOT-owl | boot | Сова с пылесосом, стабильный кадр | boot-owl-vacuum.png | public/assets/shell/boot/ | png | 360×304 | — | integrated | Cursor GenerateImage | own | yes | no | Первый кадр мастер-листа; мягкое CSS-покачивание без смены арта и мерцания |
| BOOT-leaves | boot | Длинная куча листьев | boot-leaves.png | public/assets/shell/boot/ | png | 1212×295 | — | integrated | Cursor GenerateImage | own | yes | no | Плавно растворяется широкой альфа-маской по реальному progress, без линии обрезки |
| MENU-bg | menu | Фон меню | menu-bg.webp | public/assets/shell/ | webp | 2400×1792 | 4:3 | validated | owner | own | yes | yes | Утверждён 26.09.2026 вместе с menu |
| WELCOME-meow | welcome | Поза «покажи на кнопку» | welcome-meow.png | archive/public-assets/_binaries/shell/ | png | 1115×1400 | 1:1 | archived | owner | own | yes | yes | Утверждён 25.09.2026; с 0.22.1 в архиве — приветствие показывает Олли (`welcome-olli-open.png`) |
| WELCOME-title | welcome | Надпись «Планета Мяу» | welcome-title.png | public/assets/shell/ | png | 2458×426 | 16:9 | validated | owner | own | yes | yes | Утверждён 25.09.2026 |
| WELCOME-play | welcome | Кнопка «Играть» | welcome-play.png | public/assets/shell/ | png | 1429×1390 | 1:1 | validated | owner | own | yes | yes | Слово на картинке обрезано. Утверждён 25.09.2026 |
| MENU-meow | menu | Танец на площадке, 6 кадров | frame_01…06.png | public/assets/mascot/menu-dance/ | png | 808×960 | — | integrated | owner | own | yes | yes | Лист `assets-master/mascot/menu-meow-dance-sheet.jpg`. Пинг-понг 180 мс |
| GATE-turn | orientation | Поворот планшета | gate-turn.png | public/assets/shell/ | png | — | — | planned | owner | own | no | no | Два кадра для reduced motion |
| UI-settings | хаб | Настройки | icon-settings.png | public/assets/ui/icons/ | png | с листа REF-04 | 1:1 | validated | owner | own | yes | yes | Вырезано из ref-ui-icons.jpg |
| UI-sound-on | welcome | Звук вкл | icon-sound.png | public/assets/ui/icons/ | png | с листа REF-04 | 1:1 | validated | owner | own | yes | yes | Выкл — та же картинка, тише |
| UI-sound-off | welcome | Звук выкл | icon-sound.png | public/assets/ui/icons/ | png | с листа REF-04 | 1:1 | validated | owner | own | yes | yes | |
| UI-back | chrome | Назад | icon-back.png | public/assets/ui/icons/ | png | с листа REF-04 | 1:1 | validated | owner | own | yes | yes | |
| UI-home | chrome | Домой | icon-home.png | public/assets/ui/icons/ | png | с листа REF-04 | 1:1 | validated | owner | own | yes | yes | |
| PWA-192 | установка | Иконка | pwa-icon-192.png | public/ | png | 192 | 1:1 | shipped | owner | own | no | no | Сейчас Мяу. Новый мастер — оба персонажа, пакет 30.09.2026 |
| PWA-512 | установка | Иконка | pwa-icon-512.png | public/ | png | 512 | 1:1 | shipped | owner | own | no | no | |
| PWA-apple | установка | Apple touch | apple-touch-icon.png | public/ | png | 180 | 1:1 | shipped | owner | own | no | no | |
| FONT-fredoka | весь UI | Шрифт | Fredoka-variable.ttf | src/assets/fonts/ | ttf | — | — | integrated | Fredoka Project | OFL-1.1 | yes | no | Уже локально. Notices есть |

## Карточки меню

Плитки меню 1:1. Мастер: `assets-master/menu/card-<id>.jpg` или `.png` → PNG 1024 в `public/assets/menu/`. Скрипт: `node scripts/process-menu-cards.mjs`. «Раскраска» и «Рисовалка» — та же серия, название на картинке.

| ID | Экран/игра | Filename | Путь | Статус | Integrated | Notes |
|---|---|---|---|---|---|---|
| CARD-balloon | Лопни шарик | card-balloon-pop.png | public/assets/menu/ | integrated | yes | v2 серия 25.09 |
| CARD-sound | Изучаем звуки | card-sound-world.png | public/assets/menu/ | integrated | yes | |
| CARD-coloring | Раскраска | card-coloring.png | assets-master/menu/retired/ | retired | no | 01.10.2026: плитки нет, раскраска внутри «Рисовалки» |
| CARD-drawing | Рисовалка | card-drawing.png | public/assets/menu/ | integrated | yes | Серия меню 30.09, название на картинке |
| CARD-sort | Куда положить? | card-sort-colors.png | public/assets/menu/ | integrated | yes | |
| CARD-puzzle | Собери пазл | card-puzzle.png | public/assets/menu/ | integrated | yes | |
| CARD-shape | Собери что угодно! (02.10.2026, сгенерировал Cursor; старая «Собери фигурку» — `archive/assets-master/menu/card-shape-build-v1.jpg`) | card-shape-build.png | public/assets/menu/ | integrated | yes | Резка `cutCard` (скруглённый квадрат по краям карточки) в `scripts/build-shape-build-assets.mjs`; заливка «белого от краёв» грызла светлую рамку (исправлено 02.10.2026) |
| CARD-hide | Прятки | card-hide-seek.png | public/assets/menu/ | integrated | yes | Лупа над кустом + «Прятки» в стиле серии меню; проверено 02.10.2026 (0.19.0) — подходит, не перегенерировали |
| CARD-seasons | Времена года | card-seasons.png | assets-master/menu/retired/ | retired | no | 01.10.2026: плитки нет, улица внутри «В гости» |
| CARD-count | Учимся считать | card-counting.png | public/assets/menu/ | integrated | yes | Мастер `assets-master/menu/card-counting.png` + 3D-подложка как у соседних плиток |
| CARD-home | В гости | menu-visit-bed.png | public/assets/menu/ | integrated | yes | Лежанка Мяу. Дерево совы — отдельный файл пакета 30.09.2026 |

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
| PUZZLE-`<id>` (17) | puzzle | Сцены: сова — главный герой, Мяу рядом. Промпты — `puzzle-ART.md` | `scenes/<id>.webp` + `thumbs/<id>.webp` из `assets-master/games/puzzle/puzzle-<id>.jpg` (`garage` ← `puzzle-car_repair_garage.jpg`) | public/assets/games/puzzle/ | webp | 2048×1536 / 480×360 | 4:3 | in game 02.10 (0.16.8) | owner | own | no | no | 14 сцен + `garage`, `dentist`, `newyear`. Кусочки отдельно не храним. Без мастера — цветная заглушка кодом. Демо `puzzle-meadow.png` удалено (0.16.6) |
| HIDE-scene-`<id>` (6) | hide-seek | Пёстрые сцены без целей: room, kitchen, garden, beach, forest, playground. Промпты — `hide-seek-ART.md` | `scenes/<id>.webp` + `thumbs/<id>.webp` из `assets-master/games/hide-seek/hs-scene-<id>.jpg` | public/assets/games/hide-seek/ | webp | 2048×1536 / 640×480 | 4:3 | in game 02.10 (0.19.0) | Cursor (по референсам проекта) | own | yes | no | Генерация 1024 px; 4K — те же промпты. Укрытия размечены в `src/games/hide-seek/scenes.ts` |
| HIDE-items-`<id>` (60) | hide-seek | 10 предметов и зверят на сцену (5×2 на белом) | `items/<scene>-<item>.png` из `assets-master/games/hide-seek/hs-items-<id>.jpg` | public/assets/games/hide-seek/items/ | png | до 384 px | — | in game 02.10 (0.19.0) | Cursor | own | yes | no | Белый убран; пропорции → `item-aspect.ts`. Нарезка `npm run assets:hide-seek` |
| HIDE-icon-hint | общий набор шапки | Лупа «Подсказка» | hint.png из `assets-master/games/hide-seek/icons/hint.jpg` | public/assets/games/creative/icons/ | png | 256 | 1:1 | in game 02.10 (0.19.0) | Cursor | own | yes | no | Брать для подсказки в других играх |
| HIDE-voice | hide-seek | Фразы ведущего (150) | `*.mp3` из `assets-master/games/hide-seek/hide-seek-voice-reel.mp3` | public/assets/games/hide-seek/voice/ | mp3 | — | — | integrated 03.10 (0.19.1) | owner (ElevenLabs) | own | yes | no | Текст — `hide-seek-VOICE-SCRIPT.md`; нарезка `node scripts/split-hide-seek-voice.mjs` (по тексту, громкость выровнена); unit-тест сверяет 150 файлов |
| MH-bg (21) | meow-home | Прихожая, ванная, кухня, спальня днём и ночью; двор в 4 сезонах днём и ночью; открытый холодильник; миниатюры сезонов. Промпты — `meow-home-ART.md` | `bg/<name>.webp` из `assets-master/games/meow-home/mh-<name>.jpg` | public/assets/games/meow-home/bg/ | webp | 2048×1536 / 480×360 | 4:3 | in game 03.10 (0.21.0) | Cursor | own | yes | no | Нарезка `npm run assets:meow-home` (`--only=bg`) |
| MH-frames (2×56) | meow-home | Кадры дома: 28 действий × 2 кадра, кот и сова | `<who>/f-<action>-{1,2}.webp` из `mh-<who>-f-<action>.jpg` (2 кадра на голубом) | public/assets/games/meow-home/{meow,olli}/ | webp | клетка 576×864 | 2:3 | in game 03.10 (0.21.0) | Cursor | own | yes | no | Общий масштаб и линия ступней; голубая тень у кадров сна стирается |
| MH-outdoor | meow-home | Основа стоя, 5 мордочек (холодно, жарко, мокро, радость, сонный), 9 вещей одежды слоями | `<who>/stand.webp`, `face-<mood>.webp`, `wear-<item>.webp` + иконки `items/wear-<who>-<item>.webp` | public/assets/games/meow-home/{meow,olli,items}/ | webp | — | 1:1 | in game 03.10 (0.21.0) | Cursor | own | yes | no | Правки основы совмещаются скриптом, в слой идёт только изменённое (`--only=outdoor`) |
| MH-items (119) | meow-home | Предметы ухода, еда, спальня, вешалка, таблички, небо, двор, снеговик, игры, зверята, эффекты | `items/<name>.webp` из `mh-items-*.jpg`, `mh-animals.jpg`, `mh-fx.jpg`, `mh-bed-empty.jpg` | public/assets/games/meow-home/items/ | webp | — | — | in game 03.10 (0.21.0) | Cursor | own | yes | no | Белый убран; пропорции → `src/games/meow-home/art-aspect.ts` (`--only=items`) |
| MH-voice | meow-home | Фразы Мяу и Олли (98 на персонажа) | `voice/<who>-<ключ>.mp3` | public/assets/games/meow-home/voice/ | mp3 | — | — | planned | owner | own | — | no | Текст — `meow-home-VOICE-SCRIPT.md`; пока фразы в облачке |
| COUNT-bg | counting | Уголок детской: гирлянда, счёты, коврик под игрушки, свободный пол под ящик. Промпт — `counting-ART.md` | counting-bg.webp из `assets-master/games/counting/counting-bg.jpg` | public/assets/games/counting/ | webp | 2048×1536 | 4:3 | in game 03.10 (0.20.0) | Cursor (по референсам проекта) | own | yes | no | Нарезка `npm run assets:counting` |
| COUNT-digits (10) | counting | Нарисованные цифры 1–10 (панель внизу и наклейка на ящике) | `digits/1.png`…`10.png` из `assets-master/games/counting/counting-digits.jpg` (5×2 на белом) | public/assets/games/counting/digits/ | png | высота 256 | — | in game 03.10 (0.20.0) | Cursor | own | yes | no | Режутся по кляксам, белое по краям и в дырках прозрачное |
| COUNT-toys | counting | Игрушки и ящик — общие с «Куда положить?» | `sort-colors/toys/<kind>-<color>.png`, `bin.png` | public/assets/games/sort-colors/toys/ | png | — | — | reuse 03.10 (0.20.0) | owner | own | yes | no | Через `src/shared/toys.ts`; яблок/рыбок (старый план COUNT-chip) больше нет |
| COUNT-voice | counting | Фразы ведущего (232) | `*.mp3` из `assets-master/games/counting/counting-voice-reel.mp3` (строки 1–179) и `counting-voice-reel 2.mp3` (180–232) | public/assets/games/counting/voice/ | mp3 | — | — | in game 03.10 (0.20.1): 232 | owner | own | yes | no | Текст — `counting-VOICE-SCRIPT.md`; нарезка `node scripts/split-counting-voice.mjs --parts=1-180:cut,180-232` (первый трек оборван на строке 181) |
| SW-cards | sound-world | 18 животных + 6 транспорт + 5 инструментов | `{id}.png` | public/assets/games/sound-world/cards/ | png | ~1K | 1:1 | integrated | owner | own | yes | no | Мастера JPEG в `assets-master/games/sound-world/`. Скрипт `npm run assets:sound-world` |
| SW-play | sound-world | Экраны 5 инструментов | `{id}.png` | public/assets/games/sound-world/play/ | png | ~4:3 | 4:3 | integrated | owner | own | yes | no | Барабан, маракасы, колокольчик, пианино, гитара |
| SW-letters-ru | sound-world | 33 буквы А–Я | `ru-01.png`…`ru-33.png` | public/assets/games/sound-world/letters/ | png | с листа | — | integrated | owner | own | yes | no | Лист имел дубли; кляксы под глифом снимаются без обрезки ножек |
| SW-letters-en | sound-world | 26 букв A–Z | `en-A.png`…`en-Z.png` | public/assets/games/sound-world/letters/ | png | с листа | — | integrated | owner | own | yes | no | Лист 7×4 |
| SW-voice-letters | sound-world | Озвучка А–Я и A–Z | `letter-ru-*.mp3`, `letter-en-*.mp3` | public/assets/games/sound-world/sfx/ | mp3 | с дорожек | — | integrated | owner | own | yes | no | Нарезка `sources/games/sound-world/letters-ru.mp3` и `letters-en.mp3` |
| SW-sfx-ship | sound-world | Корабль | ship.mp3 | public/assets/games/sound-world/sfx/ | mp3 | — | — | integrated | owner | own | yes | no | Мастер `sources/games/sound-world/ship.mp3` |

### «Куда положить?» (sort-colors) — S16, 01.10.2026

Промпты, порядок и проверки — [sort-colors-ART.md](sort-colors-ART.md). Озвучка — [sort-colors-VOICE-SCRIPT.md](sort-colors-VOICE-SCRIPT.md). Мастера: `assets-master/games/sort-colors/`. Сборка: `npm run assets:sort-colors`, озвучка — `node scripts/split-sort-colors-voice.mjs` (отчёт нарезки — [sort-colors-VOICE-CUT-REPORT.md](sort-colors-VOICE-CUT-REPORT.md)). Что готово, игра узнаёт из `src/games/sort-colors/art-ready.ts`; геометрия ящика (край, проём, наклейка) — `ART_BIN` в `src/games/sort-colors/art.ts`.

| ID | Назначение | Мастер | Файл в игре | Статус |
|---|---|---|---|---|
| SORT-TOY-`<вид>`-`<цвет>` | 7 видов × 4 цвета | `sort-toys-<вид>.jpg` (7 листов) | `public/assets/games/sort-colors/toys/<вид>-<цвет>.png` (28) | integrated 01.10 |
| SORT-BIN | Пустой сливочный ящик спереди-сверху | `sort-bin.jpg` | `public/assets/games/sort-colors/bin.png` | integrated 01.10 |
| SORT-STICKER-`<вид>` | Наклейка: серый предмет на кремовой карточке | `sort-stickers.jpg` | `public/assets/games/sort-colors/stickers/<вид>.png` (7) | integrated 01.10 |
| SORT-BG | Детская с ковриком, 4:3 | `sort-playroom.jpg` | `public/assets/games/sort-colors/sort-playroom-bg.webp` | integrated 01.10 |
| SORT-VOICE | 158 реплик | `sort-colors-voice-reel.mp3` | `public/assets/games/sort-colors/voice/*.mp3` | integrated 01.10 |
| SFX-pickup | Взял игрушку / кусочек (sort-colors, puzzle) | Kenney `pluck_001` (CC0) | `public/assets/audio/pickup.mp3` | integrated |
| SFX-drop | Попал в ящик / клетку (sort-colors, puzzle) | Kenney `select_001` (CC0) | `public/assets/audio/drop.mp3` | integrated |
| SORT-SFX-pile | Новая куча падает | `sort-pile.mp3` (ElevenLabs SFX) | `public/assets/games/sort-colors/sfx/pile.mp3` | brief-ready |

### «Собери что угодно!» (shape-build) — S16, 02.10.2026

Промпты, порядок и проверки — [shape-build-ART.md](shape-build-ART.md). Голоса нет. Мастера: `assets-master/games/shape-build/`. Сборка: `npm run assets:shape-build`. Что готово, игра узнаёт из `SANDBOX_ART_READY` в `src/games/shape-build/art.ts`. 0.16.15: весь арт владельца в игре — `sb-pieces-wood.jpg` (8 деревянных + шарик, светлые, игра красит в 6 цветов), `sb-pieces-items.jpg` (11 предметов, колесо тележки и лопасти вентилятора отдельно), `sb-room.jpg`, `sb-cabinet.jpg`; пока картинки грузятся, детали рисует код. Иконки игры перерисованы в общем стиле (лист `sb-icons-sheet.jpg`), старые — `archive/assets-master/games/shape-build-sandbox-0.16.14/icons/`. Корзинки нет. Иконки «Выбрать», «Магнит», «Луна» версии 1.0 — `archive/assets-master/games/shape-build-sandbox-0.16.12/icons/`. Рисунки и трек озвучки старой «Собери фигурку» — `archive/assets-master/games/shape-build-v1/`.

| ID | Назначение | Мастер | Файл в игре | Статус |
|---|---|---|---|---|
| SB-ICONS | Иконки кнопок «Бум!», «Замри!» (палочка), «Гравитация», «Фото», «Как играть» и кнопок у детали «Повернуть», «Убрать», «Больше», «Меньше» (общий набор) | `sb-icons-sheet.jpg` 3×3 → `icons/{boom,wand,gravity,photo,howto,rotate,remove,bigger,smaller}.jpg` (сгенерировал Cursor, 0.16.15 — общий стиль; 0.16.16 — `boom.jpg` перерисован отдельно: мультяшный взрыв, старый в `archive/assets-master/games/shape-build-sandbox-0.16.15/icons/`) | `public/assets/games/creative/icons/*.png` (256) | integrated |
| SB-HAND | Рука-подсказка: белая перчатка, палец вверх-влево | `hand.jpg` (сгенерировал Cursor) | `public/assets/games/shape-build/hand.png` (256) | integrated |
| SB-ICONS-2 | Иконки «Пуск!», «Включить», «Пли!», «Короче», «Длиннее», «Механизмы» (общий набор) | `sb-icons-sheet-2.jpg` + `sb-icon-longer.jpg` → `icons/{start,power,fire,shorter,longer,machines}.jpg` (сгенерировал Cursor, 0.16.17) | `public/assets/games/creative/icons/*.png` (256) | integrated 0.16.17 |
| SB-WOOD | 8 деревянных деталей, светлые (игра красит), строго сбоку с лёгким объёмом, контур = физика | `scripts/build-shape-build-wood.mjs` (SVG + sharp, 0.16.17; раньше — 3/4 с листа `sb-pieces-wood.jpg`) | `public/assets/games/shape-build/pieces/{cube,brick,plank,triangle,dome,arch,column,ramp}.png` | integrated 0.16.17 |
| SB-MACHINES | Механизмы и передатчики в стиле предметов (объём): пушка, качели, лента, мельница, лифт, кнопка, лампочка, кактус, толкатель, ведёрки на блоке, столбик дверцы, ракета; подвижные части отдельно. Люк дверцы — картинка `plank` | `sb-machines-sheet.jpg`, `sb-links-sheet.jpg`, `sb-machines-long.jpg`, `sb-machines-tall.jpg` (сгенерировал Cursor, 0.16.18) | `public/assets/games/shape-build/pieces/{cannon,seesaw-stand,seesaw-board,conveyor,mill-stand,mill-rotor,lift-stand,lift-platform,button-base,button-cap,lamp,pin,pusher-base,pusher-glove,pulley-beam,bucket,gate-post,rocket}.png` | integrated 0.16.18 |
| SB-MACHINES-3 | Новые механизмы 0.17.0 в стиле SB-MACHINES: коробка рольставни, ножницы, труба-телепорт, основание подъёмника-домкрата, пружина-катапульта (основание и площадка). Штору, ножницы домкрата, полку, жёлоб и люк рисует код | `sb-machines-sheet-3.jpg`, `sb-machines-long-2.jpg` (сгенерировал Cursor, 0.17.0) | `public/assets/games/shape-build/pieces/{gate-box,scissors,pipe,lift-base,launcher-base,launcher-plate}.png` | integrated 0.17.0 |
| SB-ICONS-3 | Иконки «Полетели!» (ракета), «Прибить», «Склеить», «Расклеить», «Резать!», «Подбросить!», «Провод», «Вся комната», «Вверх / Вниз» (общий набор) | `sb-icons-sheet-3.jpg` + `icons/rocket.jpg` → `icons/{rocket,nail,glue,unglue,cut,kick,wire,room,lift}.jpg` (сгенерировал Cursor, 0.17.0) | `public/assets/games/creative/icons/*.png` (256) | integrated 0.17.0 |
| SB-ROOM-2 | Бесшовные обои и пол для большой комнаты | `sb-room-wall.jpg`, `sb-room-floor.jpg` (сгенерировал Cursor, 0.17.0) | `public/assets/games/shape-build/{room-wall,room-floor}.webp` (заменили `room.webp`; `pieces/lift-stand.png` и `pieces/gate-post.png` убраны) | integrated 0.17.0 |
| SB-BALLOON | Шарик, светлый (игра красит) | клетка 9 листа `sb-pieces-wood.jpg` (владелец) | `public/assets/games/shape-build/pieces/balloon.png` | integrated 0.16.15 |
| SB-ITEMS | 11 предметов, колесо тележки и лопасти отдельно, сетка 4×3. С 0.18.0 Мяу и Олли берутся из SB-MEOW-POSES / SB-OLLI-POSES | `sb-pieces-items.jpg` (владелец) | `public/assets/games/shape-build/pieces/{ball,stone,cart,cart-wheel,spring,wrecking,hoop,fan,fan-blades}.png` | integrated 0.16.15 |
| SB-MEOW-POSES | Мяу как в хабе (кудрявый котёнок из танца меню, референс `public/assets/mascot/menu-dance/frame_01.png`), мягкая игрушка в анфас, 11 поз, сетка 4×3: игрушка, шаг 1, шаг 2, радость, висит, едет, летит, плавает, спит, машет, моргает | `sb-meow-poses.jpg` (сгенерировал Cursor, 0.18.0) | `public/assets/games/shape-build/pieces/meow.png`, `meow-{walk1,walk2,joy,hang,ride,fly,float,sleep,wave,blink}.png` | integrated 0.18.0 |
| SB-OLLI-POSES | Олли как в хабе (рыжая пятнистая сова, референс `public/assets/mascot/presenter/olli-idle.png`), те же 11 поз и сетка | `sb-olli-poses.jpg` (сгенерировал Cursor, 0.18.0) | `public/assets/games/shape-build/pieces/olli.png`, `olli-{walk1,walk2,joy,hang,ride,fly,float,sleep,wave,blink}.png` | integrated 0.18.0 |
| SB-JETPACK | Мяу и Олли с ракетой за спиной, как рюкзак (поза полёта, сопло снизу; огонь рисует код) — по одному кадру | `sb-meow-jetpack.jpg`, `sb-olli-jetpack.jpg` (сгенерировал Cursor, 0.22.0) | `public/assets/games/shape-build/pieces/{meow,olli}-jetpack.png` | integrated 0.22.0 |
| SB-PARACHUTE | Купол парашюта в стиле предметов (без строп — стропы рисует код) | `sb-parachute.jpg` (сгенерировал Cursor, 0.22.0) | `public/assets/games/shape-build/pieces/parachute.png` | integrated 0.22.0 |
| SB-ROOM | Детская 4:3 | `sb-room.jpg` (владелец) | `public/assets/games/shape-build/room.webp` (2400×1800) | integrated 0.16.15 |
| SB-CABINET | Высокий узкий шкаф-рамка | `sb-cabinet.jpg` (владелец) | `public/assets/games/shape-build/cabinet.webp` (рамка 9 частей) | integrated 0.16.15 |
Банк из 106 предметов (PET, FARM, WILD, EXOT, BIRD, SEA, FRUIT, VEG, FOOD, TREAT, VEH, HOME, INSTR, WEAR) остаётся со старыми ID и именами файлов из архивного манифеста. Папка будущей копии: `public/assets/bank/<filename>`. Все строки `planned`. В «Изучаем звуки» идут только те, у кого в старом манифесте столбец «Звук в 2.2» = да. Этот список не переписывался.

## Аудио хаба и игр

| ID | Экран/игра | Назначение | Filename | Путь | Статус | Integrated | Notes |
|---|---|---|---|---|---|---|---|
| AUD-hub-music | welcome, menu | Фон хаба, зацикл | hub-music.mp3 | public/assets/audio/ | integrated | yes | |
| AUD-game-music | игры | Общий фон игр | game-music.mp3 | public/assets/audio/ | integrated | yes | Нет в «В гостях» (дом и улица) и «Рисовалке». Обычные игры ~20%, «Изучаем звуки» и «Считаем с Мяу» ~5%. Fade in/out 280 ms |
| AUD-ui-transition | переходы | SFX смены экрана | ui-transition.mp3 | public/assets/audio/ | integrated | yes | startSec 0.95 |
| AUD-balloon-pop | balloon-pop | Лопнуть шарик | balloon-pop.mp3 | public/assets/audio/ | integrated | yes | |
| AUD-soft-miss | все игры | Мягкий промах | soft-miss.mp3 | public/assets/audio/ | integrated | yes | |

Остальные голоса и sfx игр — `planned`. Банк sound-world: на диске LICENSE и JSON, не как готовые ассеты.

## Раскраски — фон «Рисовалки» (24 картинки)

**01.10.2026:** отдельной игры «Раскраска» нет, картинки — фон «Раскраска» в «Рисовалке».

Промпты: `docs/assets/coloring-SCENES-PROMPTS-v3.md`.

Мастер: `assets-master/games/coloring/scenes/<Имя>.jpg`. Владелец переименовал файлы по-русски, подпись карточки берётся из имени. Порядок и id — `src/games/drawing/coloring-pages.ts` (4 листа по 6): `balloon`, `apple`, `flower`, `dog`, `owl`, `fish`, `duck`, `car`, `bus`, `boat`, `plane`, `boots`, `bunny`, `cup`, `sleepy-bear`, `cake`, `teapot`, `whale`, `octopus`, `crab`, `turtle`, `dino`, `snowman`, `gift`.

Сборка: `npm run assets:coloring` (`scripts/build-coloring-assets.mjs`). Файлы в игре:
- `public/assets/games/coloring/lines/<id>.png` — только контур на прозрачном фоне, белое вырезано. Рисуется поверх краски, служит стеной для заливки.
- `public/assets/games/coloring/thumbs/<id>.webp` — миниатюра 4:3 для экрана выбора.

Старые `public/assets/games/coloring/scenes/*.jpg` и черновые SVG-сцены агента удалены.

## Иконки инструментов раскраски и рисовалки

Промпт: `docs/assets/creative-TOOL-ICONS-PROMPT.md`.

Один лист, 16 предметов, стиль `ref-ui-icons.jpg`. Мастер: `assets-master/games/creative/tool-icons.jpg`. Нарезанные PNG: `public/assets/games/creative/icons/`. Назад, звук, домой и шестерёнка остаются файлами REF-04 и на этом листе не повторяются.

## Стол «Раскраски» и «Рисовалки»

Мастер: `assets-master/games/creative/desk-table.jpg`. В игре: `public/assets/games/creative/desk-table.webp`. Это только дерево, вид сверху. Лист бумаги рисуется поверх, чтобы холст 4:3 совпадал с будущими картинками.

## Пробковая доска галереи «Рисовалки» — 01.10.2026

Мастер: `assets-master/games/creative/cork.jpg` (сгенерирован агентом через GenerateImage: пробка вид сверху, бесшовная плитка). В игре: `public/assets/games/creative/cork.webp` — 768 × 768, насыщенность 0,72, около 105 КБ. Повторяется плиткой как фон галереи (`--cork` в `creative-gallery.css`). Тени и кнопки-булавки у рисунков рисуются CSS.

## Пакет «Мяу и друзья» — 30.09.2026, ещё не нарисован

Мастера кладёт владелец. В `public/` их не копировать, пока Cursor не проверит. Промпты — GENERATION-GUIDE, раздел «Пакет друзей».

| ID | Файл мастера | Куда потом в игре |
|---|---|---|
| WELCOME-title-friends | `assets-master/shell/welcome-title-friends.jpg` | `public/assets/shell/welcome-title.png` |
| WELCOME-olli | `assets-master/shell/welcome-olli.jpg` | `public/assets/shell/welcome-olli.png` |
| OLLI-presenter | `assets-master/mascot/olli-presenter-sheet.jpg` | `public/assets/mascot/presenter/olli-idle.png`, `olli-happy.png`, `olli-miss.png` |
| OLLI-dance | `assets-master/mascot/menu-olli-dance-sheet.jpg` | `public/assets/mascot/menu-dance-olli/frame_01.png` … `frame_06.png` (цикл 1 2 3 2 1 5 6 5 1, кадр 4 в запасе) |
| MENU-visit-tree | `assets-master/menu/menu-visit-tree.jpg` | `public/assets/menu/menu-visit-tree.png` |
| PWA-friends | `assets-master/shell/pwa-icon-friends.jpg` | `public/pwa-icon-192.png`, `pwa-icon-512.png`, `apple-touch-icon.png` |
| CARD-count-v2 | `assets-master/menu/card-counting.png` | `public/assets/menu/card-counting.png` |
| CARD-hide-v2 | `assets-master/menu/card-hide-seek.jpg` | `public/assets/menu/card-hide-seek.png` |
