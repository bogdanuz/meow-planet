# «Изучаем звуки» — откуда взять mp3 (черновик)

**Статус:** частично закрыто (23.09.2026) — **59 букв** + 3 животных CC0 в репо; ~40+ предметных sfx ещё нужны вручную / Freesound Critter Zone.

**Авто на вашем ПК:** `powershell -ExecutionPolicy Bypass -File scripts/bootstrap-sound-world-sfx.ps1` — буквы (SAPI) + строки из `scripts/sound-world-sfx-sources.json`.  
**Правило продукта:** только после проверки лицензии → запись в `THIRD_PARTY_NOTICES.md`.  
**Решение S14:** предметный **sfx**; название — **только подпись** под карточкой (без голоса «Кошка»).

## Что нужно покрыть

1. **Животные + птицы + часть морских** — все строки ASSET-MANIFEST с «Звук в 2.2 = да» (см. §13).
2. **Транспорт** — VEH-* где «да» (~9).
3. **Инструменты** — INSTR-01…07.
4. **Алфавит RU** — 33 буквы (отдельный sfx на букву или короткий «А», «Б»…).
5. **Алфавит EN** — 26 букв (без слова-примера).

Имена файлов — согласовать с кодом при подключении (например `sfx/cat.mp3`, `sfx/letter-ru-a.mp3`).

## Кандидаты (проверять лицензию на странице загрузки)

| Источник | Что там | Лицензия (как заявлено) | Примечание |
|---|---|---|---|
| [Kenney — Animal Pack](https://kenney.nl/assets/animal-pack) | Звуки животных (если в наборе) + арт | **CC0** | Kenney часто даёт CC0; **прослушать** — мягкие ли для 2–3 лет |
| [Kenney — Interface Sounds](https://kenney.nl/assets/interface-sounds) | UI, не звери | **CC0** | Уже кандидат для UI; не подменяет рычание льва |
| [OpenGameArt — animal sound](https://opengameart.org/) | Поиск «dog bark», «cow moo» | **разная** | Фильтр CC0 / Public Domain; каждый файл — в NOTICES |
| [Freesound.org](https://freesound.org/) | Огромный каталог | **CC0, CC-BY…** | Только **CC0** без атрибуции для MVP; BY — только если готовы указать автора в NOTICES |
| [BBC Sound Effects (личное использование)](https://sound-effects.bbcrewind.co.uk/) | Реалистичные звуки | **RemArc — некоммерческое/ограниченное** | **Осторожно:** лицензия может **не** подойти коммерческому PWA — юрист/владелец решает |
| TTS / озвучка букв | Google/Azure TTS, Rhvoice offline | платно / свои условия | Для **букв** часто проще один раз записать 33+26 коротких клипов или Rhvoice локально |

## Рекомендуемый порядок для владельца

1. Пройти ASSET-MANIFEST → список id с «Звук = да» (агент может выгрузить CSV в S16).
2. Для **животных:** набор CC0 на OpenGameArt или несколько Kenney/ itch.io «animal sfx pack CC0» — **один стиль громкости** (ffmpeg normalize).
3. Для **букв RU/EN:** пак «alphabet sounds» CC0 или запись TTS одним голосом; EN без слов («A» not «Apple»).
4. Положить в `public/assets/games/sound-world/sfx/` → агент подключает в `audio` + `THIRD_PARTY_NOTICES.md`.

## Не делать

- Брать звуки из GCompris / платных детских app (лицензия).
- Резкие «error» или сирены для животных.
- Скачивать без строки в `THIRD_PARTY_NOTICES.md`.
