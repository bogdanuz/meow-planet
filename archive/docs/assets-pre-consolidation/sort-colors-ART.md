# Игра «Куда положить?» — иллюстрации (2.3, sort-colors)

**Дата:** 24.09.2026 · **SSOT механики:** `docs/games/S14-sort-colors-GAME-POLISH.md`

## Экран (MVP)

| Зона | Сейчас | После S16 |
|---|---|---|
| Фон | CSS лоток + цветные корзинки | `SORT-BG-01` landscape |
| Корзинки | `placeholderClass` + подпись **фигуры** (Мячик, Кубик, …) | 5 PNG |
| Игрушки | placeholder, 10 кнопок (5 типов × 2) | 5 PNG (дубликаты в коде) |
| Подсказки | `chrome__hint` (тост), **без** Мяu в chrome | то же + голос S16 |

**Правило:** форма ↔ корзинка; цвет **1:1** с формой (как «Лопни шарик»).

## Куда класть файлы

`public/assets/games/sort-colors/`

```
sort-colors/
  bg/sort-colors-workshop-bg.webp
  baskets/sort-basket-{shape}-{color}.png
  toys/sort-toy-{shape}-{color}.png
```

`{shape}`: `circle` | `square` | `triangle` | `heart` | `star`  
`{color}`: `red` | `orange` | `yellow` | `green` | `violet`

## Таблица ID → файл

| ID | RU подпись | shape | color | Basket PNG | Toy PNG |
|---|---|---|---|---|---|
| SORT-BASKET-01 | Мячик | circle | red | `sort-basket-circle-red.png` | — |
| SORT-BASKET-02 | Кубик | square | orange | `sort-basket-square-orange.png` | — |
| SORT-BASKET-03 | Пирамидка | triangle | yellow | `sort-basket-triangle-yellow.png` | — |
| SORT-BASKET-04 | Сердечко | heart | green | `sort-basket-heart-green.png` | — |
| SORT-BASKET-05 | Звёздочка | star | violet | `sort-basket-star-violet.png` | — |
| SORT-TOY-01 | (мячик) | circle | red | — | `sort-toy-circle-red.png` |
| SORT-TOY-02 | (кубик) | square | orange | — | `sort-toy-square-orange.png` |
| SORT-TOY-03 | (пирамидка) | triangle | yellow | — | `sort-toy-triangle-yellow.png` |
| SORT-TOY-04 | (сердечко) | heart | green | — | `sort-toy-heart-green.png` |
| SORT-TOY-05 | (звёздочка) | star | violet | — | `sort-toy-star-violet.png` |
| SORT-BG-01 | фон зоны | — | — | `sort-colors-workshop-bg.webp` | — |

`SORT-01…10` в коде — **экземпляры** игрушек; ассетов **5** (повторяются).

## Safe area / размеры

- **Фон:** landscape **4:3** или **16:10**, ~2048×1536, без мелких деталей по краям (iPad).
- **Корзинка:** 1:1, export **512×512** PNG alpha; силуэт читается на **~80px** высоты на экране.
- **Игрушка:** 1:1, **512×512** PNG alpha; тот же силуэт, что на корзинке (узнаваемость).
- **Текст на PNG не рисуем** — подписи только в UI.

## Стиль

Блок Style из `GENERATION-GUIDE.md` §2 — **дословно** во все промпты.

Палитра корзин/игрушек — те же hex, что placeholder CSS (`sort-colors.css` data-color).

## Промпты — фон SORT-BG-01

```
Subject: empty toddler sorting play area in a cozy star workshop, soft wooden shelf
ledges, warm cream wall, subtle stars and craft tools blurred in background, no characters.
Action: static scene, calm daylight.
Setting: landscape tablet game background, horizontal composition with open center for UI.
Style: warm children's book illustration style, soft gouache/watercolor textures, clean
readable silhouettes, thick soft outlines, gentle rounded shapes, pastel but warm color
palette, no harsh shadows, calm and friendly mood, made for a toddler app.
Composition: wide shot, lower third slightly darker for toy tray contrast, no hard horizon line.
Constraints: no text, no watermark, no scary tools, no clutter, no mascot cat, no baskets with
labels drawn in image.
Aspect ratio: 4:3. Resolution: 2K. Export: WebP ~2048×1536.
```

## Промпт — корзинка (шаблон)

Подставить `{SHAPE}`, `{COLOR_NAME}`, `{COLOR_HEX}`, `{SHAPE_DESC}`.

```
Subject: a single empty woven toddler toy basket for sorting game, soft rounded basket rim,
pastel {COLOR_NAME} tint ({COLOR_HEX}), large friendly {SHAPE_DESC} icon embossed or painted
on the front center (same silhouette as matching toy).
Action: static front view, slightly 3/4 so depth is readable.
Setting: isolated object, transparent background.
Style: (copy Style block from GENERATION-GUIDE §2 verbatim).
Composition: basket fills ~75% of frame height, icon large and simple for ages 2-3.
Constraints: no text label on basket, no fruit, no other shapes, no scary shadows, no watermark.
Aspect ratio: 1:1. Resolution: 2K. Export: 512×512 PNG with alpha.
```

| shape | SHAPE_DESC |
|---|---|
| circle | soft red ball / toddler ball icon |
| square | rounded orange cube block icon |
| triangle | yellow stacking pyramid / triangle block icon |
| heart | green rounded cartoon heart icon |
| star | violet five-point star icon |

## Промпт — игрушка (шаблон)

Тот же `{SHAPE_DESC}` и цвет, что у парной корзинки; **один** объект, не сцена.

```
Subject: a single toddler sorting toy — {SHAPE_DESC}, solid {COLOR_NAME} ({COLOR_HEX}),
friendly cartoon prop, chunky and graspable look.
Action: static, slight soft shadow under object only (or none for alpha).
Setting: isolated, transparent background.
Style: (copy Style block from GENERATION-GUIDE §2 verbatim).
Composition: object centered, fills ~70% of frame height, silhouette matches basket icon exactly.
Constraints: no basket, no text, no face on geometric shapes, no extra decorations, no watermark.
Aspect ratio: 1:1. Resolution: 2K. Export: 512×512 PNG with alpha.
```

## Порядок генерации (рекомендация)

1. Одна игрушка + её корзинка (circle/red) — проверить **совпадение силуэта**.
2. Остальные 4 пары тем же шаблоном.
3. Фон — когда пары утверждены (подогнать контраст лотка).
4. MEGAFILE: 5 пар промптов + 1 фон (`docs/assets/MEGAFILE.md`).

## Звук / голос (не PNG)

- SFX drop/success — общий банк или `sort-colors/sfx/` (TBD S16).
- Похвала шага — короткие фразы без «корзинку»; ElevenLabs — `GENERATION-GUIDE` §11.
