# PWA — иконка «Планета Мяу» (Home Screen / iPad)

**Дата:** 24.09.2026 · **Статус:** **НУЖНО СГЕНЕРИРОВАТЬ** (владелец, Nano Banana Pro)  
**Зачем:** установка PWA на **рабочий стол iPad**; в manifest сейчас только `favicon.svg` (K-002).

## Файлы (обязательно)

| ID | Назначение | Файл | px | Прозрачность |
|----|------------|------|-----|--------------|
| PWA-icon-192 | Android / general | `public/icon-192.png` | **192×192** | нет (squircle safe zone) |
| PWA-icon-512 | Splash / store-like | `public/icon-512.png` | **512×512** | нет |
| PWA-apple-touch | iOS / iPad | `public/apple-touch-icon.png` | **180×180** (Apple) + экспорт **512** для manifest | нет |

После генерации: обновить `vite.config.ts` → `manifest.icons` и `includeAssets`.

## Дизайн (зафиксировано владельцем)

- **Собирательный образ хаба:** один узнаваемый кадр «все игры — одна планета».
- **Персонаж:** кот **Мяу** — референс **REF-01** (`GENERATION-GUIDE.md`).
- **Текст на иконке:** заголовок **«Планета Мяу»** кириллицей, **крупно и читаемо** на 192px (исключение из правила «без текста на PNG» — **только** для PWA-иконки).
- **Стиль:** книжная иллюстрация, якорь Image B (палитра), тёплые пастели.
- **Без:** мелкого текста, 9 мини-игр на одной иконке (перегруз), страшных элементов.

## Промпт (Nano Banana Pro)

```
Use the attached Image A (Meow character sheet) for the exact cat character.
Use the attached Image B for color palette and illustration style.

Generate: a square app icon for a toddlers' PWA game hub "Planeta Meow".
Center: friendly fluffy orange kitten Meow, full body or 3/4, waving or welcoming.
Background: soft planet / stars / meadow mood, simple, not cluttered.
Typography: large readable Russian title "Планета Мяу" in a playful rounded children's
font, high contrast, occupies lower third of the icon, no other text.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean
readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color
palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Constraints: no watermark, no scary elements, no tiny illegible text besides the title.
Aspect ratio: 1:1. Resolution: 2K (export master 1024×1024, then downscale to 512 and 192).
Safe zone: keep Meow face and title inside central 85% for iOS rounded corners.
```

## Проверка перед коммитом ассетов

1. Прочитать «Планета Мяу» на **192×192** с расстояния вытянутой руки (iPad).
2. Мяу узнаваем vs REF-01.
3. Положить `LICENSE-pwa-icon.txt` (источник, если сток; или «self-generated NBP»).

См. также: `MEGAFILE.md` § PWA, `docs/08-KNOWN-ISSUES.md` K-002.
