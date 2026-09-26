# «Изучаем звуки» — статус sfx (S14)

**24.09.2026:** предметные **30/30** — файлы в `public/assets/games/sound-world/sfx/`, обрезка в `sfx-playback.ts`.

Владелец заменил неудачные клипы из папки «Звуки» → переименованы в `{id}.mp3`, папка удалена.

## Буквы RU/EN

Локально: `scripts/bootstrap-sound-world-sfx.ps1` (SAPI) → `letter-*.wav`. Не Pixabay.

## PWA / git

Коммить всю папку `sfx/` (mp3/wav + `inventory.json`). Workbox кэширует mp3/wav/ogg.

## Техника

- Поиск URL: `sfx-url.ts` (не принимать HEAD `text/html`).
- Длинные mp3: `playUrlSegment` + таблица в `sfx-playback.ts`.

Открытых «немых» предметных карточек нет.
