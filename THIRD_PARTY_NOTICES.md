# THIRD_PARTY_NOTICES

Этот файл перечисляет сторонние компоненты внутри проекта «Планета Мяу», которые
**не покрываются** лицензией проекта (`LICENSE`) и остаются под собственными лицензиями
своих авторов.

## Почему это отдельно от LICENSE

`LICENSE` = «Все права защищены» — но это касается **только вашего собственного** кода,
дизайна и ассетов. Библиотеки, которые вы устанавливаете через `npm install`
(инструменты сборки/тестирования), написаны другими людьми и живут под своими
лицензиями — обычно MIT (разрешает использование, но требует сохранения уведомления
об авторстве). Ничего платить/спрашивать разрешения не нужно, если это open-source
MIT/Apache-инструменты для разработки (не встраиваемый в продукт чужой арт/код).

## Инструменты разработки (devDependencies, `package.json`)

| Пакет | Назначение в проекте | Лицензия (проверить перед релизом) |
|---|---|---|
| `vite` | Сборка/dev-сервер | MIT (проверить в `node_modules/vite/LICENSE`) |
| `typescript` | Язык/типы | Apache-2.0 (проверить в `node_modules/typescript/LICENSE.txt`) |
| `vitest` + `@vitest/coverage-v8` | Unit-тесты | MIT |
| `@playwright/test` | e2e-тесты | Apache-2.0 |
| `vite-plugin-pwa` | PWA/Service Worker (Workbox) | MIT |
| `jsdom` | DOM-окружение для тестов | MIT |
| `@types/node` | Типы Node.js | MIT |

## Библиотеки механик игр (dependencies, `package.json`)

Встраиваются в готовое приложение (не только для разработки) — код остаётся под
своей лицензией, отдельно от `LICENSE` продукта.

| Пакет | Назначение в проекте | Лицензия | Источник |
|---|---|---|---|
| `interactjs` | Drag&drop/тап для игр «Куда положить?» и «Собери пазл» | **MIT** | https://interactjs.io/ |
| `planck` 1.5.0 | Физика песочницы «Собери что угодно!» (порт Box2D, добавлен 02.10.2026) | **MIT** | https://github.com/piqnt/planck.js |

Добавлены 22.09.2026, проверено запуском `typecheck`/`test`/`build` — зелёные. Подробный
разбор — `docs/assets/FREE-RESOURCES-RESEARCH.md` §1.

> Точные версии — в `package.json` / `package-lock.json`. Перед публичным релизом
> запустите `npx license-checker --summary` (устанавливать не обязательно заранее —
> команда сама разово скачает пакет через `npx`) и сверьте с таблицей выше.

## Шрифт

| Набор | Автор | Лицензия | Где лежит | Статус |
|---|---|---|---|---|
| Fredoka (variable) | Google Fonts / The Fredoka Project | **SIL Open Font License 1.1** | `src/assets/fonts/Fredoka-variable.ttf`, текст лицензии `src/assets/fonts/OFL.txt` | Подключён локально, без запроса к Google |

## Ассеты (иллюстрации, звуки, шрифты)

| Набор | Автор | Лицензия | Где лежит в репозитории | Статус |
|---|---|---|---|---|
| Kenney Game Icons (105 иконок) | Kenney (kenney.nl) | **CC0 1.0** (общественное достояние, атрибуция не обязательна) | `archive/public-assets/ui/ui-*.png` (6 файлов: home/back/parent-gate/settings/sound-on/sound-off) | **В архиве с 0.22.1** — в игре не используются (иконки — `public/assets/ui/icons/icon-*.png`) |
| Kenney Interface Sounds (100 звуков) | Kenney (kenney.nl) | **CC0 1.0** | `archive/public-assets/_candidates/ui-sounds/*.ogg` (16 файлов-кандидатов) | **В архиве с 0.22.1** — в игре не используются (звуки хаба — `public/assets/audio/`) |
| Kenney Animal Pack Redux (30 животных × 8 стилей) | Kenney (kenney.nl) | **CC0 1.0** | `archive/public-assets/_dev-placeholders/bank/*.png` (18 файлов) | **В архиве с 0.22.1** — черновая заглушка, в игре не используется |
| `crow_caw.wav` (ворона/птицы) | OpenGameArt (CC0) | **CC0** | `public/assets/games/sound-world/sfx/sparrow.wav`, `crow.wav` (копия одного файла) | MVP-заглушка для воробья; заменить на мягкий CC0 из Critter Zone |
| `dog_barking_mono.wav` | Brandon Morris (OGA, CC0) | **CC0** | `public/assets/games/sound-world/sfx/dog.wav` | MVP; прослушать — не слишком резкий для 2–3 лет |
| Буквы RU/EN `letter-*.wav` | Сгенерировано **локально** скриптом `scripts/bootstrap-sound-world-sfx.ps1` (Windows **SAPI**, голос системы) | Условия голоса Microsoft / ОС — **не** сторонний скачанный пак; перед коммерческим релизом заменить на записанные/ CC0 клипы | `public/assets/games/sound-world/sfx/letter-ru-*.wav`, `letter-en-*.wav` (59 файлов) | Рабочий черновик; финал — TTS/Rhvoice/ElevenLabs по `GENERATION-GUIDE.md` |
| OpenGameArt — `kitten_mew-1.wav`, baby-animals (Technopeasant), hits/beast (pauliuw), `bell.wav`, `guitar-1.wav` (AntumDeluge), `generic_car_startengine_1.wav`, `steamwhistle_0.wav` (bart), `helicopter.mp3` (aquinn), `theircoming.ogg` (StumpyStrust), water-splash pack (rubberduck) | см. страницы загрузки на opengameart.org | **CC0** (проверено на карточке OGA) | `public/assets/games/sound-world/sfx/*.{wav,ogg,mp3}` — предметные карточки S14 | Часть клипов — черновик; см. `docs/assets/sound-world-MISSING-SFX.md` |
| Pixabay — ambulance (#363656), bear (#191995), lion (#352860), whale (#346774), police (#508704), rooster (#364473), duck (#112941), owl (#223549), hen (#370337), seal (Pixabay) — авторы см. `sound-world-sfx-sources.json` | pixabay.com/sound-effects | **Pixabay Content License** | `public/assets/games/sound-world/sfx/*.mp3` (предметные карточки S14) | Обрезка/громкость: `sfx-playback.ts` |

Источник и разбор лицензий — `docs/assets/FREE-RESOURCES-RESEARCH.md`. Оригинальные
файлы лицензий сохранены рядом с ассетами (`LICENSE-kenney-*.txt`).

Кроме перечисленного выше — используются только собственные/сгенерированные ассеты и
SVG-заглушки. Любой новый сторонний файл добавляется в эту таблицу в момент добавления
в репозиторий, без исключений (правило проекта, §14–15 идеи).

## Правило проекта

Ничего стороннее (код, шрифт, звук, картинка) не добавляется в репозиторий без записи
в этом файле и проверки условий лицензии — см. также §14–15
`Планета_Мяу_Идея_продукта.md`.
