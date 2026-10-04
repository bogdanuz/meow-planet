# HANDOFF

Дата: **4 октября 2026**

> **S14 — ГОТОВО (9/9).** **S15 — ГОТОВО**.  
> **S16:** welcome/menu ✅, balloon-pop ✅, **sound-world ✅ (первый релиз)**, **sort-colors ✅ (арт и озвучка владельца)**, **puzzle ✅ (механика + арт владельца, 17 картинок)**, **shape-build ✅ — «Собери что угодно!» 2.1, песочница с физикой, переработанные механизмы, большая комната, 35 готовых машин, тап/удержание, заряд ракеты и пушки, живые Мяу и Олли, «Хитрости» (0.18.0); предварительный финал — правок пока нет, ждём проверку на iPad**, **hide-seek ✅ — «Прятки» S16: 6 сцен × 10 предметов, случайные укрытия, уровни, подсказки, праздник (0.19.0); озвучка владельца и видимость по уровням (0.19.1); ждём проверку на iPad**, **counting ✅ — «Учимся считать» S16: ящик, коврик с игрушками, цифры, «Свободно» / «Задание» (0.20.0); голос владельца (все 232 фразы), ящик левее, игрушки только на коврике (0.20.1); ждём проверку на iPad**, **meow-home ⏸ — «В гости» S16 (0.21.0) снова закрыта заглушкой «скоро» по слову владельца (много косяков); доработка — `BACKLOG.md`, раздел «В гости»**. Настройки без капчи ✅.  
> **Код** **0.22.1**.
>
> **04.10, пушка и ведёрки + полная проверка хаба (0.22.1):**
> - Пушка (`physics.ts`): `muzzleFit` / `updateShrinks` — предмет в дуле уменьшается до `MUZZLE_BORE` 0,36 — ширины тёмного отверстия на картинке, сидит в `muzzle.hole` (`holeOf`; выстрел по-прежнему из `muzzle.at` / `muzzleOf` — от этой точки зависят рецепты «Пушка»), развёрнут вдоль ствола; `drawInMuzzle` рисует его после пушки с обрезкой «впереди среза + овал отверстия» (`view.muzzle.r`); при выстреле растёт обратно; мячик-снаряд по размеру пушки. Ведёрки после ножниц — отдельные предметы `bucket` (`dropBuckets` / `shedBuckets`); в руке ведёрко держится ровно. Трос шара-разрушителя: `dropRope` + `ropeCut` в снимке; `rebuild()` восстанавливает группу и сенсор держателя.
> - `index.ts`: неудачный выстрел — `forget(step)`; `pointercancel` → `onWindowCancel`; «Отменить» возвращает и размер комнаты (`stepRooms`); `room-save.ts` хранит `unitsH`, `fitRoomSave` сдвигает сохранение под новый экран.
> - Хаб: переходы меню/приветствия по таймеру проверяют `router.getRoute()`; имя сохраняется на `input`; `syncMusic` в `shell.ts` (возврат из фона, включение музыки); `MENU_TILE_IDS` перенесён в `catalog.ts`; IndexedDB-запись ждёт `oncomplete`; `AudioManager.dispose()` в cleanup всех игр; облачко «Погладь меня» (`fitToast`) пересчитывается по `ResizeObserver` на стопке/персонаже/облачке, загрузке лежанки и `animationend` входа меню (раньше при медленной загрузке наезжало на кнопки).
> - Игры: balloon-pop — тапы во время похвалы за задание игнорируются; puzzle — `floatLayer` чистится; sound-world — `unmountInstrumentView`; counting — `doneStep` и проверка `step` в «все в ящике»; sort-colors — напоминание только при `taskTargetsLeft > 0`; drawing — `loadThumbs` проверяет `disposed`.
>
> **03.10, «Собери что угодно!» правки владельца + меню + заглушка «В гости» (0.22.0):**
> - Физика (`physics.ts`): у блока с ведёрками флаг `ropeCut` — ножницы по верёвке (`cordsOf` → `cut()` → `dropBuckets`) рвут блок и обе верёвки, ведра падают; флаг в снимке, сохранении (`room-save.ts`) и «Отменить». Груз ракеты (не герой) сразу `putInside` — сенсор внутри, в виде `rider`/иллюминатор; герой у ракеты — «ракетный рюкзак»: ракета под ногами (`JETPACK_FEET`), ракета не рисуется, огонь рисует персонаж (`char.flame`). В дуле пушки предмет сидит наполовину (`muzzle` в виде, `drawInMuzzle` режет по срезу дула), герой — головой наружу (`HEAD_OUT`). `updateChutes()` — парашют Мяу и Олли: открывается при vy ≥ 4 и высоте ≥ 2 ростов, тянет vy к 5 и выпрямляет; складывается при касании, в руке, в грузе; событие `chute`.
> - Рисование: `drawScene` (render.ts) — задние части ведёрок → детали по глубине, предмет сразу после держателя → передние стенки ведёрок ниже края. `preview.ts` тоже на нём. Позы `jetpack`, `hang` при парашюте, `joy` в пушке (`characters.ts`).
> - Арт: `sb-meow-jetpack.jpg`, `sb-olli-jetpack.jpg`, `sb-parachute.jpg` (Cursor) → `node scripts/build-shape-build-assets.mjs --only=<листы>`.
> - Машина «Ракета-почтальон»: ракета на `sx + 2` (кактус больше не падает на кнопку на размере 18).
> - Меню: `MENU_TILE_IDS` в `menu.ts` — balloon-pop, sort-colors, drawing, puzzle, counting, sound-world, hide-seek, shape-build. `meow-home` убран из `released-games.ts` (заглушка, раздел настроек скрыт); `tests/e2e/meow-home.spec.ts` — `describe.skip`, `settings-meow-home.test.ts` мокает `isGameReleased`.
> - `BACKLOG.md` пересобран: только несделанное, пункт 29 чек-листа iPad.
>
> **03.10, «В гости» S16 (0.21.0):**
> - Решения — бриф `docs/games/S16-meow-home-BRIEF.md` (11 туров) + 2 верхние строки `docs/04-DECISION-REGISTER.md`. Весь арт генерирует Cursor, владелец потом точечно правит.
> - Код `src/games/meow-home/` написан заново: `index.ts` (экран, ~1200 строк), `wishes.ts`, `weather.ts`, `scene.ts` (все места в % сцены 4:3), `hero.ts` (дома — 2 кадра на действие; на улице — «кукла»: основа + мордочка + слои одежды), `yard.ts`, `phrases.ts`, `sfx.ts` (синтез), `sprites.ts` (кнопка-предмет держит пропорции картинки через `aspect-ratio` — нажимается до загрузки), `art.ts`, `art-aspect.ts` (генерирует скрипт).
> - Сцена: `.mh__scene` 4:3 по низу экрана (`max(100cqw, 133.333cqh)`), `Spot {x, y, w|h, a}` — x центр, y низ; z-index предметов = y. Облачка речи и мысли — `placeBubbles()` от места говорящего.
> - Настройки `meowHomePotty`, `meowHomeWishes`, `meowHomeRealTime`, `meowHomeSeasonByDate` (раздел «В гости» в `settings-form.ts`); игра в `released-games.ts`, `GAMES_WITH_OWN_PRESENTER`, chrome скрыт в `shell.ts`.
> - Арт: мастера `assets-master/games/meow-home/` → `npm run assets:meow-home` (`--only=bg|frames|outdoor|items`) → `public/assets/games/meow-home/{bg,meow,olli,items}` (~280 файлов, 7,3 МиБ). Описание — `docs/assets/meow-home-ART.md`.
> - Голос: фразы в облачке; `docs/assets/meow-home-VOICE-SCRIPT.md` (98 на персонажа, у совы 5 своих), `phrases.test.ts` сверяет с кодом. После записи — нарезка по образцу `split-counting-voice.mjs` в `voice/<who>-<ключ>.mp3`.
> - Тесты: `src/games/meow-home/{mount,phrases}.test.ts`, `tests/unit/meow-home-{weather,wishes}.test.ts`, `tests/unit/settings-meow-home.test.ts`, `tests/e2e/meow-home.spec.ts`.
> - Мелочи на потом: клумба зимой нарисована на фоне с цветами; настоящие сэмплы звуков и музыка дома.
>
> **03.10, «Учимся считать»: голос и раскладка (0.20.1):**
> - Решение владельца — верхняя строка `docs/04-DECISION-REGISTER.md`: ящик чуть выше и левее, игрушки только на коврике.
> - Раскладка: ящик и коврик в слое `.counting__scene` (прямоугольник фона 4:3 с той же обрезкой, что `object-fit: cover`) — коврик игры = нарисованный коврик на любом экране. `rugSlots` (logic.ts) подбирает самый крупный размер игрушки (`toyW`, CSS `--toy-w`), при котором низ каждой внутри овала; unit-тест проверяет n = 1…10 × 12 разбросов. Ящик в `box-rug` — на полу слева от коврика, над облачком ведущего.
> - Голос: два трека владельца — `counting-voice-reel.mp3` (оборван на середине строки 181 `give-duck-9`, но `give-duck-8` в нём целиком) и `counting-voice-reel 2.mp3` (строки 180–232, с `give-duck-8`). `node scripts/split-counting-voice.mjs --parts=1-180:cut,180-232`: каждый трек режется отдельно на свои строки, повтор берётся из более позднего трека, `:cut` отбрасывает недоговорённый хвост; паузы от 0,1 с, модель длительности с запятыми/точками внутри фразы → 232 mp3, 0 аномалий. `art.ts`: `COUNTING_VOICE_RECORDED = ALL_VOICE_LINES.length`, `countingVoiceUrl` даёт url только озвученным строкам (если когда-то трек снова окажется неполным — уменьшить число, остальные пойдут облачком); unit-тест сверяет файлы на диске с первыми N строками.
>
> **03.10, «Учимся считать» S16 (0.20.0):**
> - Решения — викторина 3 тура + 1Б, `docs/games/S16-counting-BRIEF.md` + верхние строки `docs/04-DECISION-REGISTER.md`. Арт (фон, лист цифр) — Cursor; игрушки и ящик — из «Куда положить?» через новый общий `src/shared/toys.ts` (sort-colors `art.ts` тоже на нём).
> - Код `src/games/counting/`: `words.ts` (числительные, падежи, род игрушек), `phrases.ts` (`ALL_VOICE_LINES`, 232), `logic.ts` (задания, `taskMax` = min(предел, 3 + решено/3), проверки, `boxSlots` / `rugSlots`), `art.ts` (`COUNTING_VOICE_READY = false`), `index.ts` / `counting.css` (раскладки `data-layout`, перетаскивание с capture, подсказки, праздник). Старые S14-файлы (`counter-kind`, `praise`, `counting-sfx`) удалены, старый блок `.app-shell--counting` из `shell.css` убран.
> - Настройки: `countingLimit` (по умолчанию 3), `countingTasks` (по умолчанию give/count/addRemove), `countingAutoHints`; `STORAGE_SCHEMA_VERSION = 3` — при миграции со схемы < 3 скрытый старый `countingLimit` сбрасывается. Раздел «Учимся считать» в `settings-form.ts`. Игра в `released-games.ts`, `GAMES_WITH_OWN_PRESENTER`, `PRESENTER_GAME_IDS`, chrome скрыт в `shell.ts`.
> - Арт: `assets-master/games/counting/` → `npm run assets:counting` (цифры режутся по кляксам). Промпты — `docs/assets/counting-ART.md`.
> - Голос: владелец записывает `counting-voice-reel.mp3` по `docs/assets/counting-VOICE-SCRIPT.md` → `node scripts/split-counting-voice.mjs` (копия нарезки «Пряток») → `COUNTING_VOICE_READY = true`; unit-тест сверит файлы и скрипт.
> - Тесты: `tests/unit/counting.test.ts`, `src/games/counting/mount.test.ts`, `tests/unit/settings-counting.test.ts`, `tests/e2e/counting.spec.ts`.
>
> **03.10, «Прятки»: озвучка и видимость по уровням (0.19.1):**
> - Решения — 2 верхние строки `docs/04-DECISION-REGISTER.md`. Владелец: «Легко» — целиком и по смыслу, «Средне» — видно ½–⅔, «Сложно» — ⅓, текстуры (куст, сено, песок) и «ку-ку» только на «Сложно».
> - Голос: `scripts/split-hide-seek-voice.mjs` (копия нарезки sort-colors, по тексту) режет `assets-master/games/hide-seek/hide-seek-voice-reel.mp3` → 150 mp3. ffmpeg — `npm install --no-save ffmpeg-static` (в package.json не попадает). `phrases.ts` — итоговый список владельца (без `find-*`), `HIDE_SEEK_VOICE_READY = true`, unit-тест сверяет файлы на диске со списком и с `hide-seek-VOICE-SCRIPT.md`.
> - Поток в `index.ts`: новая сцена — `introLine`, «Заново» — `START_LINES`; задание и повтор — `whereLine`; после `foundLine` — `PRAISE_LINES` или `NEXT_LINES` (50/50, после последнего — только похвала, `CONNECT_MS` 900), затем задание; 12 с — сияние + `IDLE_LINES`. Все группы подключены.
> - Видимость: `Hideout.texture` / `Hideout.fits` (хелперы `only('…', …)`, `texture(…)` в `scenes.ts`), `Placement.cover` (0 / ⅓–½ / ⅔, «ку-ку» 1) и `tryPlace` в `logic.ts`; `geometry.ts` даёт `patch: null` при cover 0. Новые укрытия: лес — бревно, 3 камня, мостик; площадка — горка, балансир, крылечко.
> - Dev: `?hs-debug=0&hs-cover=0.5#/game/hide-seek` — укрытия с подходящими предметами и заданной долей закрытого.
> - Mount-тесты на async-таймерах (голос «готов» → шаги ждут конца фразы через промис).
>
> **02.10, «Прятки» S16 (0.19.0):**
> - Решения — викторина 5 туров, `docs/games/S16-hide-seek-BRIEF.md` + `docs/04-DECISION-REGISTER.md`. Арт и код целиком делает Cursor (тур 5), референсы — ассеты проекта.
> - Код `src/games/hide-seek/`: `scenes.ts` (сцены, предметы с падежами и родом, 11–13 укрытий с `side`/`edge`/`kuku`), `logic.ts` (`buildRound`: уровни 3/4/5, ровно 1 «ку-ку», зазор `HIDEOUT_MIN_GAP` 10, обманка на «Сложно»; `evaluateTap`), `geometry.ts` (предмет, заплатка из картинки сцены с мягким краем, зона тапа), `phrases.ts` (`HIDE_SEEK_VOICE_SCRIPT`), `art.ts` (`HIDE_SEEK_VOICE_READY=false`), `item-aspect.ts` (генерирует скрипт), `index.ts` / `hide-seek.css` / `hide-seek-sfx.ts`.
> - Настройки: `hideSeekLevel` / `hideSeekMirror` / `hideSeekAutoHints` в `storage.ts`, раздел «Прятки» в `settings-form.ts`, звёздочки `gallery-progress.ts`; игра в `released-games.ts` и `GAMES_WITH_OWN_PRESENTER`.
> - Общее: `playCelebrationTune` в `src/shared/hub-sounds.ts` (пазл тоже на нём), иконка `hint` (`public/assets/games/creative/icons/hint.png`).
> - Арт: `assets-master/games/hide-seek/` → `npm run assets:hide-seek`. Разметку укрытий смотреть в dev: `?hs-debug=0#/game/hide-seek` (или `=1`).
> - Тесты: `tests/unit/hide-seek.test.ts` (+ сверка `docs/assets/hide-seek-VOICE-SCRIPT.md`), `src/games/hide-seek/mount.test.ts`, `tests/unit/settings-hide-seek.test.ts`, `tests/e2e/hide-seek.spec.ts`.
> - Голос: текст в облачке; после озвучки нарезать трек, положить в `public/assets/games/hide-seek/voice/`, `HIDE_SEEK_VOICE_READY = true`.
>
> **02.10, «Собери что угодно!» — предварительный финал:** владелец принял 0.18.0, больше правок пока нет (верхняя строка `docs/04-DECISION-REGISTER.md`). Карточка меню `card-shape-build.png` перевырезана: `cutCard` в `scripts/build-shape-build-assets.mjs` — альфа = скруглённый квадрат по краям карточки (средняя строка/колонка, порог 240, радиус 0,36 полуширины), рамка цела, внутри всё непрозрачно. Старый `knockout` (заливка белого от краёв) для карточек со светлой рамкой не годится.
>
> **02.10, «Собери что угодно!»: тап и удержание, заряд, живые Мяу и Олли, карточки, галерея, «Хитрости» (0.18.0):**
> - Решения — 4 верхние строки `docs/04-DECISION-REGISTER.md` (туры 1–4 после 0.17.0).
> - Тап/удержание: `tapAction(kind)` в `pieces.ts` (`press | fire | toggle | pop | greet | menu`); в `index.ts` `startHold`/`endHold` (`HOLD_MENU_MS` 500, кружок `.shape-build__hold`, `Press.held`), `togglePiece`/`firePiece`. Подсказка `ToolHint 'hold'` (`coach.firstUse('hold')` при появлении механизма, `coach.held()`), `playHoldHand` с демо-кружком `.is-demo` (`hideHand` его убирает).
> - Заряд (`physics.ts`): `SUCK_S` 0,6, `suckTarget`/`suckItems`/`suckState`, событие `load`; у ракеты втянутый рукой предмет — внутри (`insideSet`, сенсор, не ловится пальцем и контактами), в иллюминаторе (`PieceView.cargo`, `drawPorthole`); груз из рецептов остаётся на носу; Мяу/Олли (`PASSENGERS`) едут на носу. У потолка `releaseCargo` толкает груз `CARGO_PUSH` 9. Вытащенный пальцем из пушки предмет не втягивается снова, пока не уйдёт (`pulledOut`). Тесты — `sandbox-links` (ракета), `sandbox-machines` (пушка).
> - Мяу и Олли: `characters.ts` (`CHAR_POSES`, `charPose(state)` — порядок поз, `greetOffset`), `render.ts` `drawCharacter` (поза → картинка `poseSprite`, движение кодом), листы `sb-meow-poses.jpg`/`sb-olli-poses.jpg` (4×3) → `pieces/{meow,olli}-{walk1,walk2,joy,hang,ride,fly,float,sleep,wave,blink}.png`. Тест — `sandbox-characters.test.ts`.
> - Карточки «Что собрать»: `preview.ts` `drawRecipePreview` — временный `SandboxWorld` + `placeRecipe` без шагов физики, рисуется по 4 за кадр при открытии вкладки (`paintRecipePreviews`, `data-painted`); `.shape-build__recipe-chips`, шаги — CSS-счётчик, закон — `.shape-build__recipe-law-label`.
> - «Хитрости»: `trickItems` в `index.ts`, вкладка `howto-tab-tricks`, карточки `.shape-build__trick`. Трюк «кнопка набок/вверх ногами» проверен тестом в `sandbox-links`. Шпаргалка — `#sandbox-cheats` в `settings-form.ts` (первая группа раздела).
> - Галерея: долгое нажатие на фото (`startPhotoPress`, тот же `HOLD_MENU_MS`), дата `.shape-build__photo-date`, в просмотре `viewer-download` / `viewer-delete` / `viewer-back`.
>
> **02.10, «Собери что угодно!»: переработка механизмов, 35 машин, большая комната, тексты (0.17.0):**
> - Решения — 4 верхние строки `docs/04-DECISION-REGISTER.md` (этапы 1–4) + тексты (раздел F брифа). План и критерии приёмки — «Переработка механизмов» в `docs/games/S16-shape-build-BRIEF.md` (сделано).
> - Сигналы (`physics.ts`): источники `SIGNAL_SOURCES` (кнопка, лампочка, мельница), цели `SIGNAL_TARGETS`. `autoWire()` — источник без проводов (и не тронутый руками, `manualWires`) цепляется к ближайшему механизму; `connect/disconnect/wiresOf/isTarget`, до 3 проводов, без петель (`canConnect`). Кнопка — тумблер (нажата = шляпка ушла больше чем на половину хода + корпус успокоился). Лампочка передаёт сигнал через `LAMP_HOP_S` 0,4 с (`hopQueue`), мельница — сразу. `start(true)` пропускает цели проводов.
> - Механизмы: ворота-рольставня, подъёмник-домкрат (`LIFT_TRAVEL` 3,2; по сигналу — вверх и стоит, от «Пуск!» — туда-обратно), ракета с грузом (захват у носа, отпускает у потолка, потом «призрак»), пушка любым предметом, полка/жёлоб (`len`), трубы-телепорты (пара), полка с люком (`driveHatch`: закрытый люк заперт `setLimits(0, 0)`), ножницы (`cut`), пружина-катапульта (`kick`), «Прибить» (`setPinned`), «Склеить» (`canGlue`/`glue`/`unglue`), шарики по весу.
> - Комната: рост у края (`EDGE_ZONE_PX` 56, `EDGE_DELAY_S` 0,35), панорама пальцем, щипок, «Вся комната» (`toggleOverview`), камера за движением. Сохранение — `room-save.ts` (`meow-planet.shape-build-room`, проверка каждого поля). Пустая комната тоже пишется: без сохранения вход считается первым и ставит стартовую горку.
> - Машины: `recipes.ts` — 35 шт. (`RECIPE_LEVELS` 1–4, `wires`, `ties`, `glue`, `minHeight`). `tests/unit/sandbox-recipes.test.ts` проверяет **каждый шаг карточки по порядку** во всех трёх размерах (`ROOM_UNITS_H` 11,5 / 14 / 18) — 111 тестов.
> - Тексты: `laws.ts` — 20 карточек на все 36 деталей с полями `say` («Скажите ребёнку») и `try` («Попробуйте дома»), тест покрытия `tests/unit/sandbox-laws.test.ts`; «Как играть» — 8 карточек (новая «Большая комната»); тосты; `parent-game-blurbs.ts`; пояснения в `settings-form.ts`.
>
> **02.10, «Собери что угодно!»: цепочки механизмов, 3 размера, шкаф с вкладками, 22 машины (0.16.18):**
> - Викторина t8 (верхняя строка `docs/04-DECISION-REGISTER.md`): 3 размера (по умолчанию «Средние»), 7 передатчиков (кнопка → ближайший механизм с проводком, дверца, кактус, толкатель, ведёрки, лампочка, ракета), все механизмы картинками, шкаф с 4 вкладками без прокрутки, 3 уровня примеров с шагами и законом, «Как играть» — 3 вкладки.
> - Размер: `ROOM_UNITS_H` {big 11,5; small 14 («Средние»); tiny 18}. Большая машина — `fitRoomTo(recipeWidth(recipe))` в `index.ts` уменьшает комнату до «Заново» (`data-zoom="out"`).
> - Физика (`physics.ts`): кнопка — `PrismaticJoint` с пружиной, нажата → `power` у цели; цель — ближайший `BUTTON_TARGETS` по центру (`targetOf`), «Пуск!» такие цели пропускает. Дверца — `RevoluteJoint` (люк), толкатель — `PrismaticJoint` (`punch`), ведёрки — `PulleyJoint` + `RopeJoint`, ракета — тяга (`launch`), кактус лопает шарики. События `onAction` (press, power, fire, punch, launch, pop) → звуки в `sfx.ts`. `glue(a, b)` — склейка для готовых машин. Тесты — `tests/unit/sandbox-links.test.ts`.
> - Арт: листы `sb-machines-sheet.jpg`, `sb-machines-long.jpg`, `sb-machines-tall.jpg`, `sb-links-sheet.jpg` → `npm run assets:shape-build` → `pieces/*.png` (тело + подвижная часть: `seesaw-stand/board`, `mill-stand/rotor`, `lift-stand/platform`, `button-base/cap`, `pusher-base/glove`, `pulley-beam` + `bucket`, `gate-post` + люк из `plank`). `sprites.ts` `bodySprites` / `linkSprites`; код-рисунок остался запасным, пока картинки грузятся. Проводок — `drawWire` в `render.ts`.
> - Шкаф: `SHELF_TABS` / `shelfTabOf` (`pieces.ts`), вкладки `.shape-build__tab[data-tab]`, `fitShelves()` подбирает 2–4 колонки под самый крупный размер иконки, подписи `.shape-build__shelf-label`.
> - «Как играть»: вкладки `howto-tab-buttons|laws|recipes`; законы — `laws.ts` (`PIECE_LAWS`), машины — `recipes.ts` (`RECIPES` 22 шт., `RECIPE_LEVELS`, `steps`, `law`, `action`, `glue`, `minWidth`, `recipeWidth`). Тест физики на каждую машину + «дверца стоит ровно» в двух размерах комнаты — `tests/unit/sandbox-recipes.test.ts`.
>
> **02.10, «Собери что угодно!»: плоское дерево, механизмы, «Пуск!», примеры (0.16.17):**
> - Викторина t7 (верхняя строка `docs/04-DECISION-REGISTER.md`): дерево строго сбоку с лёгким объёмом; перерисовать только деревянные детали; верёвка — «Короче/Длиннее» в меню; тележка — мотор вкл/выкл, толкает по весу; механизмы — «Пуск!», качели, лента, мельница, лифт, пушка; иконки и примеры-сценарии в «Как играть».
> - Дерево: `scripts/build-shape-build-wood.mjs` (SVG + sharp, 220 px на единицу, контур = физика) пишет `public/assets/games/shape-build/pieces/{cube,brick,plank,triangle,dome,arch,column,ramp}.png`; запускается в конце `npm run assets:shape-build`. `BLOCK_OVERFLOW` убран, `spriteBox` дерева = прямоугольник детали.
> - Физика (`physics.ts`): у детали `link` (второе тело) + `linkJoint` — `RevoluteJoint` (качели с пределом, ротор мельницы) или `PrismaticJoint` (площадка лифта, мотор и пределы). Моторы: `power` (id включённых), `applyMotors()` каждый подшаг — тележка (сила `CART_PUSH`·size², пока на полу и медленнее цели; тормоз `CART_BRAKE`), лента (импульс к скорости ленты всем сверху), лифт (разворот на пределах с паузой `LIFT_PAUSE_S`), ветер крутит ротор (`windOnRotors`). Пушка: `filterGroupIndex` −id у пушки и мячика в дуле, `holdCannonBalls()` до и после шага, `fire()` (скорость `muzzle.speed`·√size, отдача), `fireLoaded()`. API: `togglePower`, `setAllPower`, `anyOn`, `isOn`, `spinOf`, `ropeLength`, `changeRope`, `muzzleOf`, `loadedBall`, `fire`, `setRightWall(x, instant)`.
> - Рисование: механизмы — кодом в `render.ts` (`drawMachineBody`, `drawLink`), не в `SPRITE_NAMES`.
> - Примеры: `recipes.ts` (`RECIPES`, `placeRecipe` — моторы выключены, в пушку кладётся мячик), тест физики на каждый — `tests/unit/sandbox-recipes.test.ts`. В «Как играть» раздел «Что собрать вместе», кнопка «Построить» (`buildRecipe` в `index.ts`: шкаф закрывается, стенка сразу на место, пример по центру, подсказка на «Пуск!»).
> - Шапка: «Пуск!» вторая (`data-role="start"`, `aria-pressed`). Меню детали: «Включить», «Пли!», «Короче», «Длиннее» — по виду детали. Иконки — `sb-icons-sheet-2.jpg` + `sb-icon-longer.jpg` → `icons/{start,power,fire,shorter,longer,machines}.jpg`; новые id в `GameToolIcon` (`src/shared/game-chrome.ts`).
>
> **02.10, «Собери что угодно!»: без щелей, тени, петля, «Бум!» (0.16.16):**
> - Замечания владельца после 0.16.15 + самоаудит. Физика деталей не менялась.
> - Щели: дерево нарисовано в 3/4. `sprites.ts` `BLOCK_OVERFLOW` {x 0,06; y 0,15}: картинка дерева выше физики (низ на месте) и чуть шире; `depth.ts` `paintOrder` — рисуем снизу вверх (по низу детали, шаг 0,05, при равенстве по id). Рамка выбранной детали в `drawPiece` повторяет растяжение; иконка в шкафу (`drawShelfIcon`) вписывает верхнюю грань.
> - Тени: `depth.ts` `floorShadow(view, floorY)` (ширина по повороту и размеру, бледнеет до 3,5 единиц высоты, у `fixed` — нет) → `render.ts` `drawFloorShadows` до верёвок и деталей. Боковая тень-силуэт осталась только у деталей без картинки.
> - Шар-таран: `WRECKING_LOOP_Y` 0,8 (`pieces.ts`) — `RopeJoint` `localAnchorB` на петле, `ropes()` отдаёт точку петли, длина верёвки по умолчанию и максимум считаются до петли.
> - «Бум!»: новый мастер `assets-master/games/shape-build/icons/boom.jpg` (сгенерировал Cursor), старый — `archive/assets-master/games/shape-build-sandbox-0.16.15/icons/`.
> - Мелочи: перекраска дерева — лимит по площади 512×512 (доска в полный размер), призрак «в шкаф» × 1,4.
>
> **02.10, «Собери что угодно!»: арт, «Отменить», иконки (0.16.15):**
> - Викторина (строка «„Отменить“ в шапке и иконки» в `docs/04-DECISION-REGISTER.md`).
> - Арт: `npm run assets:shape-build` режет `sb-pieces-wood.jpg` (3×3) и `sb-pieces-items.jpg` (4×3) в `public/assets/games/shape-build/pieces/*.png` (в клетке остаётся только главный рисунок — `keepMainShape`; сетка колеса и кольца прозрачная — `punch`; маленькие колёса тележки срезаны — `cropBottom`). `sprites.ts`: загрузка, `spriteBox(kind)` — прямоугольник картинки в единицах детали (круг шарика/тарана = физике, Мяу/Олли стоят без растяжения, кольцо по ободу), `tintedSprite` — перекраска дерева и шарика (multiply + альфа рисунка, кэш до 512 px). `render.ts` рисует картинку, если она загружена, иначе код; доска — 3 части; лопасти `bladesBox` вокруг оси (0; −0,15). `art.ts`: комната и шкаф включены, шкаф — `border-image` 9 частей.
> - Батут: физика 1,9 × 0,8 (было 0,45).
> - «Отменить»: `history.ts` (`UndoStack`, 20 шагов, `dropLast(step)` — если шаг всё ещё последний). В `index.ts` `remember()` перед каждым действием, `forget(step)` если действие не случилось; деталь из шкафа сразу вернули — шаг убирается. Снимок хранит `parked`/`loose`. Кнопка в шапке первой, `aria-disabled` когда пусто.
> - Иконки: лист `assets-master/games/shape-build/sb-icons-sheet.jpg` (сгенерировал Cursor) → 9 мастеров `icons/*.jpg` → `creative/icons/*.png`. Общие `undo`, `sheet`, `more`, `gallery` не трогали.
> - «Как играть»: `fillHowto()` пересобирает карточки при открытии (картинки деталей — уже арт владельца).
>
> **02.10, «Собери что угодно!» 2.1 (0.16.14):**
> - Владелец проверил 2.0 в браузере; самоаудит Cursor → викторина из 4 туров → строка «2.1» в `docs/04-DECISION-REGISTER.md`.
> - Физика (`physics.ts`): `add(..., { parked })` — мяч статичен до `push(id)`, касания, захвата или изменений рядом (`unparkAll`); `{ loose }` — шаткая башенка (низкое трение; удар детали быстрее `LOOSE_KNOCK_SPEED` → `knockLoose` роняет её толчком, мягкая физика сама только сдвигает стопку); упавшие становятся обычными (`firmFallen`). Липучка — только после `releaseGrab` медленнее `STICK_MAX_RELEASE`, ровно (`STICK_MAX_TILT`), при касании; не в невесомости/«Замри!»; `setGravityOff` и `shake` расклеивают; событие `onStick`. Руки по пальцам: `grab(ids, x, y, hand)`, `moveGrab(x, y, hand)`, `releaseGrab(v, hand)`, `grabbedIds(hand)`; твист удалён. `nextColor(kind)` — цвет следующей детали. Кольцо: `HOOP_SCALE` 1,3 (`pieces.ts`, `render.ts`), `applyHoopPull`.
> - Экран (`index.ts`): `presses` по `pointerId` (до `MAX_FINGERS` 3, у каждого свой призрак из шкафа), тап по ждущему мячу → `push`, `data-ball` `parked/rolling`; подсказки `push`/`stack`/`shelf`/`boom` (`coach.ts` `INVITES`, `skip()` если нечего показать); иней «Замри!» (`drawFrost` + CSS), `playChime`/`playStick` в `sfx.ts`; пятая кнопка у вентилятора (`piece-fan`); мини-снимок `.shape-build__snap` летит в «Ещё», тап — «Галерея»; кольцо из шкафа — в центр.
> - Дальше: владелец пробует 2.1 → арт по итоговым промптам `docs/assets/shape-build-ART.md`.
>
> **02.10, «Собери что угодно!» 2.0 (0.16.13):**
> - Владельцу 1.0 понравилась, но была непонятной и скучноватой, корзинка обрезала экран. Викторина из 7 туров → 3 строки в `docs/04-DECISION-REGISTER.md`, бриф переписан (`docs/games/S16-shape-build-BRIEF.md`).
> - Онбординг: стартовая сцена (горка, мяч, башенка), рука-подсказка `coach.ts` (`SandboxCoach`: вводная «потяни» до первого перетаскивания, потом после 10 с бездействия; подсказки инструментов один раз за сессию), звуки-эмоции, «Как играть» в «Ещё».
> - Шапка: «Бум!», «Замри!», «Гравитация» (тосты), «Фото», «Заново», «Ещё» («Галерея», «Как играть»), шестерёнка. Убраны «Выбрать», «Магнит», «Луна», двойной тап, корзинка.
> - Тап по детали → кнопки «Повернуть / Меньше / Больше / Убрать» (`SIZE_STEPS` в `rules.ts`). Убрать — ✕ или утащить в шкаф; «Вернуть» 6 с (`SandboxWorld.snapshot/restore`).
> - Физика (`physics.ts`): правая стенка-кинематика едет со шкафом (`setRightWall`), липучка (`WeldJoint` при успокоении, отрыв по силе), шар-таран (`RopeJoint` к потолку, крючок едет за пальцем), шарик сам привязывается (`RopeJoint`), кольцо (статичное, засчитывает пролёт сверху), вентилятор (сила вдоль оси), бросок (`releaseGrab(velocity)` по `fingerVelocity`), «Бум!» (`shake`), «Гравитация» (`setGravityOff`), размер/зеркало (`setSize`, `turn`).
> - Настройки: `sandboxSticky` (вкл), `sandboxPieceSize` (`big` / `small` → 11,5 / 14 кубиков по высоте экрана).
> - Новые иконки в общем наборе `creative/icons/` (`boom`, `gravity`, `howto`, `rotate`, `remove`, `bigger`, `smaller`) и `public/assets/games/shape-build/hand.png`. `magnet`, `moon`, `select` удалены из `GameToolIcon`, мастера — `archive/assets-master/games/shape-build-sandbox-0.16.12/icons/`.
> - **Порядок дальше (решение владельца):** владелец проверяет на iPad → Cursor обновляет промпты `docs/assets/shape-build-ART.md` → генерация арта → арт в игру.
>
> **02.10, «Собери что угодно!» (0.16.12) — замена «Собери фигурку»:**
> - Владелец счёл механику 0.16.11 вторичной. По викторине (3 тура + подтверждение, 4 строки в `docs/04-DECISION-REGISTER.md`, бриф `docs/games/S16-shape-build-BRIEF.md`): свободная песочница без заданий, помощника и голоса, мягкая физика, детская комната. `gameId` прежний — `shape-build`.
> - Код `src/games/shape-build/`: `pieces.ts` (15 видов: 7 деревянных блоков + 8 предметов, лимит предметов 3 на вид), `rules.ts` (лимит, двойной тап, прямой угол, что в шкафу), `physics.ts` (`SandboxWorld` на planck.js: стены, левая стенка правее корзинки, рука `MouseJoint`, магнит `WeldJoint`, палочка, луна, мягкий/«как в жизни» режим, удары → звуки), `render.ts` (всё рисуется кодом на canvas), `sfx.ts`, `art.ts` (`SANDBOX_ART_READY` — когда появятся комната/шкаф/корзинка владельца), `index.ts` (экран).
> - Фото построек — `src/shared/sandbox-photos.ts` (IndexedDB `meow-planet-sandbox`, до 60). Настройки — `sandbox*` в `storage.ts` и раздел игры в `settings-form.ts`. Звёздочки фигурок и «серые места» удалены; `gallery-progress.ts` остался только у пазла.
> - **Арт:** иконки кнопок и карточка меню готовы (`npm run assets:shape-build`). Комната, шкаф, корзинка, лист деталей — промпты в `docs/assets/shape-build-ART.md`; после генерации положить мастера и включить флаги в `art.ts`.
> - Старая версия: схемы и трек озвучки — `archive/assets-master/games/shape-build-v1/`, документы — `archive/docs/shape-build-v1/`.
>
> **02.10, «Собери фигурку» (0.16.11, заменена в 0.16.12):**
> - По викторине (5 туров, `docs/04-DECISION-REGISTER.md`, бриф `docs/games/S16-shape-build-BRIEF.md`): галерея 16 фигурок → доска-вкладыш слева + детали на столе справа + сова слева внизу → финал с оживлением и «Ещё». Код — `src/games/shape-build/`: `logic.ts` (16 фигурок в единицах доски 0..100, 7 форм, `pieceKey`, `findDropSlot`), `figure-svg.ts`, `table-layout.ts` (один масштаб, ряды, без наложений), `phrases.ts` (63 фразы = `docs/assets/shape-build-VOICE-SCRIPT.md`, unit сверяет), `art.ts` + `art-ready.ts`, `index.ts`.
> - Деталь подходит в любое место с тем же `pieceKey` (форма, размер, цвет, сторона): два колеса машинки взаимозаменяемы, ярусы ёлочки — нет.
> - Звёздочки галерей — общий `src/shared/gallery-progress.ts` (пазл переведён на него). «Начать заново» в настройках — у пазла и у фигурки; в новых играх с галереей — так же (`resetStarsGroup` в `settings-form.ts`).
> - Сова своя (`GAMES_WITH_OWN_PRESENTER`), фразы через `src/shared/voice-lines.ts` (вынесено из sort-colors).
> - **Арт:** `npm run assets:shape-build -- --layouts` → 16 схем Image C `assets-master/games/shape-build/layout/<id>.png` (уже сделаны). Мастера владельца `sb-table.jpg`, `sb-board.jpg`, `sb-obj-<id>.jpg`, `sb-magic.mp3` → `npm run assets:shape-build` → `public/assets/games/shape-build/` + `art-ready.ts`. Предметы не обрезаются: картинка 1:1 ложится ровно на собранные фигуры. Голос — трек `shape-build-voice-reel.mp3`, нарезка по образцу `split-sort-colors-voice.mjs` (скрипт для фигурки ещё не написан).
>
> **02.10, облачко меню и пазл после «Ещё» (0.16.10):**
> - «Погладь меня»: размер и отступы считает `src/app/menu-toast-fit.ts` (шрифт ~8% ширины персонажа, 14–27px). Потолок — верх поля, плюс низ кнопок звука/настроек, только если они стоят над облачком по горизонтали. Если места мало — `--visit-scale` на `.menu-visit-stack` (до 0.88). E2E `tests/e2e/menu-toast.spec.ts` — 7 экранов × Олли/Мяу.
> - Пазл: `transition` колонок только на `.is-finale` — выход из финала мгновенный, иначе `layoutTable` мерил стол по сжатой колонке и кусочки получались мелкими.
>
> **02.10, финал пазла (0.16.9):**
> - После сборки `celebrate()` кладёт на доску `.puzzle__board-full` — одну цельную картинку (у отдельных кусочков на дробных пикселях проступал шов).
> - `.puzzle__play.is-finale`: колонки доски плавно 2fr:1fr → 4.4fr:1fr (картинка ~80% ширины), карточка «Ещё» узкая справа. На 16:9 доска упирается в высоту и почти не растёт — это нормально, целевой экран 4:3.
> - «Автосервис»: логотип BMW стёрт точечно (генеративная заливка только в овале значка + подгон цвета). Оригинал — `assets-master/games/puzzle/originals/`.
>
> **02.10, арт пазла и точечные тесты (0.16.8):**
> - Пазл: 17 картинок владельца подключены (`npm run assets:puzzle` → `scenes/` + `thumbs/` webp, `art-ready.ts` 17/17). Новые сцены: `garage` «Автосервис» (мастер `puzzle-car_repair_garage.jpg`, алиас `MASTER_NAMES` в скрипте), `dentist` «Зубной врач», `newyear` «Новый год» — названия утверждены владельцем (ЗАФИКСИРОВАНО).
> - Настройки → «Об играх» снова листается: `renderAboutGamesPanel` больше не затирает класс `parent-about-host` (на нём прокрутка), текст рисуется во вложенный `.parent-about`.
> - Новое always-on правило `.cursor/rules/targeted-testing.mdc`: тесты только по изменённому и пересекающемуся; полный `npm run test` / `npm run test:e2e` — только по слову владельца («проверь всё», «все игры»).
>
> **01.10, настройки по разделам и общие кнопки игр (0.16.7):**
> - Настройки на весь экран: слева разделы («Общее» + игры с настройками), справа пункты по группам. Шестерёнка из игры открывает её раздел (`initialSection` = `returnTo`).
> - Новое always-on правило `.cursor/rules/game-chrome-universal.mdc`: слева «Назад», «Звук»; справа инструменты с подписью; крайняя — шестерёнка (только где сказал владелец: «Рисовалка», «Собери пазл»). «Галерея» = `gallery.png`, «Своё фото» = `background.png`. Код — `src/shared/game-chrome.ts`.
> - Пазл: шестерёнка; «Картинки» → «Галерея»; «Своё фото» в шапке галереи; свои фото первыми; подпись после обрезки (`ask-text.ts`, пусто → «Моё фото N»); удаление по одному «Выбрать → Удалить (N)» (`select-mode.css`, `deletePuzzlePhotos`); доска 2fr:1fr; 4 кусочка лесенкой крупнее, 6/9 прежние; наклонённые кусочки целиком на столе; подложка 0.09, серая, размытая.
>
> **01.10, «Собери пазл» (0.16.6):**
> - По викторине (`docs/04-DECISION-REGISTER.md`, бриф `docs/games/S16-puzzle-BRIEF.md`): экран выбора (14 сюжетов + «Своё фото», звёздочка у собранных) → доска слева, стол с кусочками справа (вразброс, под углом, с тенью; в руке размером с клетку) → праздник → «Ещё» со следующей несобранной. Без ведущего и фраз. Фон — стол «Рисовалки».
> - Настройки хаба: кусочки 4/6/9 (4), подсказка-подсветка клетки (вкл), «Убрать свои фото из пазла». Капча и ⚙ в игре удалены.
> - Общее: редактор фото → `src/shared/photo-crop-editor.ts` (+ css, math); «взял / положил» → `public/assets/audio/{pickup,drop}.mp3` (`hub-sounds.ts`). Слот `chromeGameActions` в шапке хаба удалён.
> - Магнит: в руке кусочек размером с клетку, поэтому зона захвата клетки сужена (0,1 стороны, минимум 24 px) — иначе положенный на стол кусочек прыгал в доску.
> - **Арт:** промпты 14 сцен — `docs/assets/puzzle-ART.md` (сначала Пирог и Пикник). Мастера `assets-master/games/puzzle/puzzle-<id>.jpg` → `npm run assets:puzzle`.
>
> **01.10, «Куда положить?» (0.16.5):**
> - Новая механика по викторине: куча объёмных игрушек внизу (7 видов × 4 цвета), ящики с наклейками сверху, drag и тап → тап, игрушки копятся в ящике. Режимы «Свободно» (4 ящика × 3, новая куча после праздника) и «Задание» (одна / все / цвет / все этого цвета, усложнение после 2 успехов). Бриф — `docs/games/S16-sort-colors-BRIEF.md`.
> - Код — `src/games/sort-colors/` (catalog, logic, phrases, pile-layout, bin-fill, art, index). 158 фраз — `phrases.ts` = `docs/assets/sort-colors-VOICE-SCRIPT.md` (unit сверяет).
> - **Арт и озвучка владельца в игре:** 28 игрушек, прямоугольный ящик, 7 наклеек, фон «детская», 158 фраз. Мастера — `assets-master/games/sort-colors/`, сборка `npm run assets:sort-colors`, озвучка `node scripts/split-sort-colors-voice.mjs` (режет по тексту, ЗАФИКСИРОВАНО; отчёт `docs/assets/sort-colors-VOICE-CUT-REPORT.md`).
> - Геометрия ящика (передний край, проём, наклейка) — `ART_BIN` в `art.ts`; при перерисовке ящика снять заново по скриншоту. Облачко совы — компактное, с хвостиком (`sort-colors.css`).
>
> **01.10, правки после первого теста на iPad (0.16.4):**
> - Загрузка: «Связь прервалась» только после ~30 с застоя, «Продолжить загрузку», сама продолжается при появлении сети.
> - Экраны на весь экран на любом iPad; размеры от высоты сцены (`--stage-h`, `--stage-unit`); сова на welcome ~40%.
> - Шарики крупнее (большие ×1,5, маленькие ×1,1), при нехватке места их меньше.
> - «Изучаем звуки»: общий звуковой движок, мультитач пианино, маракасы двумя пальцами, ogg → mp3, музыка затихает внутри инструмента.
> - «Рисовалка»: новые кисти, палитра 20 ячеек со «Своим цветом», галерея с выбором, просмотром и «Поделиться». Код игры — в `src/games/drawing/`.
> - Чек-лист второго теста — `BACKLOG.md` («Чек-лист iPad для 0.16.4»); там же замечания ревью на решение владельца.
>
> **01.10, объединение игр (0.16.3):**
> - «Раскраска» теперь внутри «Рисовалки». «Фон» → цвет / своё фото / раскраска. 24 картинки, 4 листа по 6. На раскраске краска ложится под контур. «Отменить» на пустом листе возвращает рисунок, унесённый в галерею.
> - Хедер: слева назад и звук, по центру отменить и заново, справа фон, галерея, настройки. Настройки возвращают обратно в игру.
> - Слева панель: цвета, кисть, заливка тапом, ластик, размер.
> - «Времена года» — улица внутри «В гости»: дверь «На улицу» и «Домой». Плитки нет, «В гости» в меню пока заглушка.
> - В меню 8 плиток. Спека — `BACKLOG.md`. Черновые SVG-сцены и старые работы раскраски удалены.
>
> **30.09, post-MVP:** в хабе появились «Раскраска» и «Рисовалка» (01.10 объединены, см. выше). S16 из-за них не закрыт.
>
> **Пакет «Мяу и друзья» подключён.** Сова на welcome, в играх и в меню.
> **30.09, правка экранов совы:** welcome — лесная поляна; меню при сове теплее; сова стоит на площадке; в покое улыбка (кадр 4); танец со скоростью Мяу; смена кадров без мигания; облачко текста выше.
> **30.09, новый boot:** отдельная лесная поляна; «УСТАНОВКА И ПОДГОТОВКА ИГР»; сова с пылесосом движется одним стабильным кадром без мерцания, листья плавно растворяются альфа-маской строго по реальному offline-progress; warm start без сцены.
>
> **Следующий шаг (04.10):** владелец коммитит 0.22.1 (все файлы вместе) и проверяет на iPad «Собери что угодно!» (пункт 29 `BACKLOG.md`: ведёрки, ножницы по верёвке, пушка с уменьшением в дуле, ракетный рюкзак, парашют) и новый порядок меню. «В гости» — на паузе за заглушкой, доработка по списку владельца (раздел «В гости» в `BACKLOG.md`). Остальное — чек-лист iPad. S17 (выпуск MVP) — по слову владельца.
>
> **Прошлый шаг:** владелец коммитит 0.19.1 и проверяет «Прятки» (пункты 24–25 чек-листа в `BACKLOG.md`: голос и видимость по уровням): правки по итогам — в эту же игру. «Собери что угодно!» — предварительный финал (0.18.0), проверка на iPad — пункты 22–23. После «Пряток» — **counting**: разбор, рынок, викторина S16 по тому же порядку.
>
> **PWA/offline после коммита `0d8d99e`:** единый Workbox/runtime manifest, полный
> precache любого файла сборки, build-gate и production boot e2e в CI.

---

| Этап | Статус |
|---|---|
| S00–S13 | **ГОТОВО** |
| **S14** | **ГОТОВО** |
| **S15** | **ГОТОВО** |
| **S16** | **В работе** — хаб ✅; balloon-pop ✅; sound-world ✅; sort-colors ✅ (арт и озвучка в игре); puzzle ✅ (арт владельца); shape-build ✅ (песочница «Собери что угодно!» 2.1, ждём проверку на iPad); hide-seek ✅ («Прятки» 0.19.1 с озвучкой, ждём проверку на iPad); counting ✅ («Учимся считать» 0.20.1 с озвучкой, ждём проверку на iPad); meow-home ⏸ («В гости» 0.21.0 закрыта заглушкой до доработки, `BACKLOG.md`); настройки ✅. Вне спринта в хабе есть «Рисовалка» (с раскрасками внутри) |
| S17 | Выпуск MVP |

## Новый чат — с чего начать

1. `HANDOFF.md` → `AGENTS.md` → `docs/05-CURRENT-STATE.md`
2. Готовые игры: balloon-pop, sound-world, sort-colors, puzzle (арт владельца, 17 картинок), shape-build («Собери что угодно!» 2.1, песочница с физикой), hide-seek («Прятки», 6 сцен), counting («Учимся считать»), drawing (раскраска — фон внутри drawing). meow-home («В гости») — код есть, в меню заглушка
3. Дальше: проверка на iPad (чек-лист `BACKLOG.md`); «В гости» — когда владелец пришлёт список косяков; потом S17
4. Беклог (`BACKLOG.md`): чек-лист iPad, доработка «В гости», замечания ревью, отдельное выключение **голосов** в настройках
5. Любые новые runtime-файлы: правило `pwa-precache-integrity.mdc` и
   `docs/quality/PWA-OFFLINE-GUARDRAILS.md`

## SSOT

| Тема | Файл |
|---|---|
| Идея | `Планета_Мяу_Идея_продукта.md` |
| MVP механики | `docs/games/MVP-GAMES-DETAILED.md` |
| Экран любой игры | **`docs/games/S16-GAME-SCREEN-PATTERN.md`** |
| Ассеты | **`ASSET-PRODUCTION-PLAYBOOK.md`**, `ASSET-MANIFEST.md`, `BRANDBOOK.md` |
| PWA/offline | **`docs/quality/PWA-OFFLINE-GUARDRAILS.md`**, ADR-0001 |
| Архив | `archive/` — **не** SSOT |
