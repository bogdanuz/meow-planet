# S14 UX/UI — «Изучаем звуки» (завершено 24.09.2026)

Skill: `ux-ui-kids-hub`, `game-screen-polish`. Бриф: `S14-sound-world-BRIEF.md`.

## Итог S14 (0.15.0)

| Область | Статус |
|---|---|
| 4 вкладки + pill RU/ABC; без Мяу на экране | ✅ |
| 30 объектных карточек, sfx локально; буквы TTS wav | ✅ |
| Сетка на весь экран, карточки **1:1**; shell `grid-template-rows: auto 1fr` | ✅ |
| Алфавит: авто-сетка (~7×5 RU, ~7×4 EN), CSS-плитки (без PNG) | ✅ |
| Плейсхолдеры без соседних дублей; подписи RU под объектами | ✅ |
| Docs ассетов: `sound-world-CARD-ART.md`, GENERATION-GUIDE §12 | ✅ |

## После S14 (S16 / ассеты)

- PNG иллюстраций объектов → `public/assets/bank/` (см. CARD-ART §4).
- Опционально: фон playfield PNG (сейчас CSS gradient).
- Голосовые имена объектов (не блокер MVP-звука).

## Self-check (kids-hub)

- [x] Touch targets вкладок и карточек ≥ ~56px (landscape iPad)
- [x] Один фокус — сетка; без pager на объектах
- [x] Нет «ошибки» при тапе без sfx (wiggle + тишина)
- [x] «Скрыть английский» скрывает pill ABC
