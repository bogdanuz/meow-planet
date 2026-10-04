# archive/

**Историзм.** Сюда складываем устаревшие документы и (позже) ассеты.  
Агент и владелец **не опираются** на файлы здесь как на источник истины.

Правила: `docs/assets/ARCHIVE-POLICY.md` (рабочий SSOT остаётся в `docs/`).

## Сейчас лежит

| Путь | Что |
|---|---|
| `docs/MEGAFILE-CONCEPT.md` | Старый концепт «как собрать мегафайл» — заменён черновиком `docs/assets/MEGAFILE.md` |
| `docs/zones-asset-obsolete.md` | Плитки 5 зон — не генерировать |
| `docs/balloon-pop-s14-superseded.md` | Ранние решения S14 по шарикам (9 шаров, 3 free pops, …) |
| `public-assets/ui/` | Старые SVG-иконки и Kenney `ui-*.png` + лицензия (снято 04.10.2026, 0.22.1) |
| `public-assets/_candidates/ui-sounds/` | 16 UI-звуков-кандидатов Kenney + лицензия (не использовались) |
| `public-assets/_dev-placeholders/bank/` | 18 заготовок животных Kenney + лицензия (черновик) |
| `public-assets/menu/card-balloon-pop.webp` | Старая webp-плитка (меню берёт `card-*.png`) |
| `public-assets/_binaries/` (не в git) | Крупные: 7 старых картинок меню `<игра>.png`, кадр 4 танца Олли, лист и превью танца Мяу, `welcome-meow.png` (≈12,5 МБ; в истории git остаются) |

## На S15 (мегафайл → один файл ассетов)

- Бинарники зон / отвергнутые стоки → `public-assets/`
- После утверждения мегафайла — один актуальный список; разрозненные черновики
  можно дополнительно сюда, если заменены

Не кладите секреты. Крупные бинарники: `.gitignore` → `archive/public-assets/_binaries/`.
