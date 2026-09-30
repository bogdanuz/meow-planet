# Раскраска — 50 промптов v3 (простая детская раскраска)

Дата: **30.09.2026**. Версия v3 после проверки первых двух картинок (мяч и шар). Они получились слишком линейными: полосы на мяче, блики, лишние шарики, россыпь мелких звёзд и кружков. В этой версии страница простая, как в классической дошкольной раскраске.

## Что изменено

- **Внутри предмета никаких линий.** Только контур и крупные замкнутые части. Нет полос, узоров, бликов, складок и текстуры.
- **Одна линия.** Одна толщина везде, округлые концы. Внутренних тонких линий больше нет.
- **В сцене 2–3 крупных элемента.** Земля или холм, облако, солнце или один цветок. Конфетти, мелкие звёзды и флажки убраны.
- **Воздух.** Главный предмет занимает примерно 60% листа, вокруг много белого места, ничего не обрезается краем.
- **Объём.** Только от линии земли и лёгкого перекрытия фигур.
- **Главные зоны** не менялись: ребёнок закрашивает те же части, что и в исходном файле.
- **Возраст 2–4.** Длина каждого промпта меньше 1600 символов.

## Куда класть файлы

Папка `assets-master/games/coloring/scenes/`, PNG, ровно эти имена (например `apple.png`). Не переименовывать по-русски и не нумеровать.

## Как вырезать белый

Убрать **весь** белый: вокруг картинки и внутри фигур. Остаются только тёмные линии на прозрачном фоне. Серую тень, бумагу и рамку убирать вместе с белым.

## Порядок работы

1. Сначала перегенерируйте `big-ball.png` и `balloon.png`, покажите результат.
2. Если линия всё ещё слишком сложная, добавьте в начало промпта: `Draw it like a coloring page for a 2-year-old: only big outlines.`
3. Если модель снова рисует полосы или блики, добавьте в конец: `Every shape is completely empty inside.`
4. Остальные 48 гоните тем же шаблоном.

## 1. `big-ball.png` — Большой мяч

**Главные зоны (механика):** левая половина, правая половина.

**В сцене:** It sits on one gentle grass hill line. One big round sun with a few short chunky rays in the top right corner and one simple cloud at the top left.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one big round beach ball split by one curved seam into two big equal halves. Nothing else on the ball.
Main coloring zones (big and closed): left half, right half.
Scene: It sits on one gentle grass hill line. One big round sun with a few short chunky rays in the top right corner and one simple cloud at the top left.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 2. `balloon.png` — Воздушный шар

**Главные зоны (механика):** шар, бант.

**В сцене:** Two big simple stars, one on each side of the balloon, and one gentle grass hill line at the bottom.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one big round party balloon with a small knot, and one chubby bow with three loops tied on its string. The string is one simple gentle curve. Nothing else on the balloon.
Main coloring zones (big and closed): balloon, bow.
Scene: Two big simple stars, one on each side of the balloon, and one gentle grass hill line at the bottom.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 3. `apple.png` — Яблоко

**Главные зоны (механика):** плод, лист.

**В сцене:** It sits on one gentle ground line. One big simple cloud at the top left.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one big round apple with a short rounded stem, and one big simple leaf. No highlight, no inner lines.
Main coloring zones (big and closed): apple, leaf.
Scene: It sits on one gentle ground line. One big simple cloud at the top left.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 4. `sun.png` — Солнышко

**Главные зоны (механика):** центр, лучи.

**В сцене:** One gentle hill line at the bottom and one simple cloud on one side.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one big friendly sun: a large round face with two round eyes and a smile, and six chunky rounded rays around it.
Main coloring zones (big and closed): face center, rays.
Scene: One gentle hill line at the bottom and one simple cloud on one side.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 5. `flower.png` — Цветок

**Главные зоны (механика):** лепестки, середина, стебель, листья.

**В сцене:** It grows from one gentle ground line. One simple cloud at the top and one big simple butterfly on one side.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one big flower: five chubby petals joined as one shape, one big round center, one thick stem, and two big leaves as one shape.
Main coloring zones (big and closed): petals, center, stem, leaves.
Scene: It grows from one gentle ground line. One simple cloud at the top and one big simple butterfly on one side.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 6. `cat.png` — Кот Мяу

**Главные зоны (механика):** тело, животик, хвост, воротник, мордочка с ушами.

**В сцене:** It sits on one big round cushion. One big ball of yarn next to it.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one small white Devon Rex kitten named Meow sitting in front view, big rounded ears, big round eyes drawn as thick rings, tiny nose, chubby body, a round belly, a thick tail, a simple collar. No fur lines, no claws, no teeth.
Main coloring zones (big and closed): body, round belly, tail, collar, face with both ears.
Scene: It sits on one big round cushion. One big ball of yarn next to it.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 7. `dog.png` — Собака

**Главные зоны (механика):** тело, уши, животик, ошейник.

**В сцене:** One big simple bone shape next to it and one gentle ground line. One simple cloud.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one friendly chubby puppy sitting in front view: big body, two floppy ears, a round belly, a simple collar, two round eyes and a smile. No teeth.
Main coloring zones (big and closed): body, floppy ears, belly, collar.
Scene: One big simple bone shape next to it and one gentle ground line. One simple cloud.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 8. `owl.png` — Сова Уху

**Главные зоны (механика):** тело, крылья, животик, глаза, клюв.

**В сцене:** It sits on one thick tree branch with two big leaves. One big crescent moon and one big star in the sky.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one round friendly owl sitting still in front view: big body, two wings as one shape, round belly, two very large round eyes, one small triangular beak. Calm, no feather lines.
Main coloring zones (big and closed): body, wings, belly, eyes, beak.
Scene: It sits on one thick tree branch with two big leaves. One big crescent moon and one big star in the sky.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 9. `fish.png` — Рыбка

**Главные зоны (механика):** тело, хвост, плавники, пятна.

**В сцене:** Two big simple bubbles and one big simple seaweed plant at the bottom.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one big friendly fish facing left: oval body, one big tail, two fins as one shape, two round spots as one shape, one round eye.
Main coloring zones (big and closed): body, tail, fins, spots.
Scene: Two big simple bubbles and one big simple seaweed plant at the bottom.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 10. `duck.png` — Уточка

**Главные зоны (механика):** тело, крыло, клюв, вода.

**В сцене:** It floats on one big wavy oval of water. One big simple lily pad and one simple cloud.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one chubby duck in side view: round body, one wing, one wide beak, one round eye and a small smile.
Main coloring zones (big and closed): body, wing, beak, water.
Scene: It floats on one big wavy oval of water. One big simple lily pad and one simple cloud.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 11. `car.png` — Машинка

**Главные зоны (механика):** кузов, окна, колёса, фара.

**В сцене:** It drives on one simple road line. One big round tree and one big sun.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one chubby toy car facing right: one rounded body, two windows as one shape, two round wheels, one round headlight. No letters.
Main coloring zones (big and closed): body, windows, wheels, headlight.
Scene: It drives on one simple road line. One big round tree and one big sun.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 12. `bus.png` — Автобус

**Главные зоны (механика):** кузов, окна, дверь, колёса.

**В сцене:** It drives on one simple road line. One big round tree and one simple cloud.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one long friendly bus: rounded body, four square windows as one shape, one door, two round wheels. No letters, no route number.
Main coloring zones (big and closed): body, windows, door, wheels.
Scene: It drives on one simple road line. One big round tree and one simple cloud.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 13. `tractor.png` — Трактор

**Главные зоны (механика):** кузов, кабина, большое колесо, малое колесо.

**В сцене:** It drives on one gentle ground line. One big round haystack and one simple cloud.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one friendly toy tractor: one body, one cabin with a window, one very large rear wheel and one smaller front wheel. No letters.
Main coloring zones (big and closed): body, cabin, large wheel, small wheel.
Scene: It drives on one gentle ground line. One big round haystack and one simple cloud.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 14. `boat.png` — Кораблик

**Главные зоны (механика):** корпус, парус, флаг, вода.

**В сцене:** One big sun and one simple cloud in the sky.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one simple toy sailboat: one hull, one big triangular sail, one small flag with no symbol, and one big wavy shape of water under the hull.
Main coloring zones (big and closed): hull, sail, flag, water.
Scene: One big sun and one simple cloud in the sky.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 15. `plane.png` — Самолёт

**Главные зоны (механика):** корпус, крыло, хвост, окна.

**В сцене:** Two big simple fluffy clouds, one above and one below the plane, and one big sun.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one chubby toy airplane facing right: one long body, one wide wing, one tail fin, three round windows as one shape. No letters.
Main coloring zones (big and closed): body, wing, tail, windows.
Scene: Two big simple fluffy clouds, one above and one below the plane, and one big sun.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 16. `boots.png` — Сапоги в луже

**Главные зоны (механика):** сапоги, подошвы, лужа.

**В сцене:** Three big raindrops above the boots and one simple cloud at the top.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: two chubby rain boots standing in one oval puddle: the two boots as one shape, the two soles as one shape, and the puddle as one big wavy shape.
Main coloring zones (big and closed): boots, soles, puddle.
Scene: Three big raindrops above the boots and one simple cloud at the top.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 17. `rain.png` — Облако и дождь

**Главные зоны (механика):** небо, облако, капли.

**В сцене:** One big simple rainbow with three wide bands in a corner of the sky.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one big soft cloud and four big raindrops as one shape, inside one big rounded sky rectangle that fills most of the page. The sky, the cloud and the drops are separate closed parts.
Main coloring zones (big and closed): sky, cloud, drops.
Scene: One big simple rainbow with three wide bands in a corner of the sky.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 18. `bunny.png` — Зайчик с морковкой

**Главные зоны (механика):** зайчик, животик, морковь, ботва.

**В сцене:** One gentle ground line, one big carrot tuft in the soil and one simple cloud.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one chubby bunny sitting in front view with two long ears, holding one big carrot with two leaves. Two eyes and a smile. No teeth.
Main coloring zones (big and closed): bunny with ears, belly, carrot, carrot leaves.
Scene: One gentle ground line, one big carrot tuft in the soil and one simple cloud.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 19. `bear-balloon.png` — Мишка с шаром

**Главные зоны (механика):** мишка, животик, шар, бант.

**В сцене:** One gentle ground line and one big round tree behind.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one round teddy bear standing in front view, holding one round balloon with a small bow. Two round ears, round belly, two eyes and a smile. No teeth.
Main coloring zones (big and closed): bear, belly, balloon, bow.
Scene: One gentle ground line and one big round tree behind.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 20. `hedgehog.png` — Ёжик и яблоко

**Главные зоны (механика):** мордочка, колючки, яблоко, лист.

**В сцене:** One gentle ground line, one big mushroom and one big fallen leaf.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one friendly hedgehog in side view: round face, one spiky back made of a few very large rounded triangles, and one apple with one leaf. Two eyes and a smile.
Main coloring zones (big and closed): face, spiky back, apple, leaf.
Scene: One gentle ground line, one big mushroom and one big fallen leaf.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 21. `cup.png` — Чашка и ложка

**Главные зоны (механика):** чашка, блюдце, ложка, напиток.

**В сцене:** One big cookie on the side and one gentle table line.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one chubby cup on a saucer, one spoon beside it, and one oval of drink inside the cup. No pattern, no letters.
Main coloring zones (big and closed): cup, saucer, spoon, drink.
Scene: One big cookie on the side and one gentle table line.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 22. `bath.png` — Купаем уточку

**Главные зоны (механика):** ванночка, вода, уточка, пузыри.

**В сцене:** One big towel shape hanging on the side and one round rug at the bottom.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one toy bathtub, one big wavy shape of water, one small duck with one eye, and three big bubbles as one shape.
Main coloring zones (big and closed): tub, water, duck, bubbles.
Scene: One big towel shape hanging on the side and one round rug at the bottom.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 23. `watering.png` — Поливаем цветок

**Главные зоны (механика):** лейка, цветок, листья, земля.

**В сцене:** Three big water drops fall from the can. One simple cloud and one big sun.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one watering can with a short spout beside one simple flower: the can, the flower head, two leaves as one shape, and one big mound of ground.
Main coloring zones (big and closed): watering can, flower, leaves, ground.
Scene: Three big water drops fall from the can. One simple cloud and one big sun.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 24. `sleep.png` — Мишка спит

**Главные зоны (механика):** ночь, луна, подушка, мишка, одеяло.

**В сцене:** Three big stars in the night sky.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one sleeping teddy bear in a bed inside one large rounded night rectangle: one big round moon, one pillow, the bear with two short closed-eye curves, and one blanket.
Main coloring zones (big and closed): night, moon, pillow, bear, blanket.
Scene: Three big stars in the night sky.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 25. `cake.png` — Праздничный торт

**Главные зоны (механика):** тарелка, основа, крем, свечи, украшения.

**В сцене:** Two big balloons behind the cake, one on each side.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one birthday cake on an oval plate: a cake base, a wavy cream layer, three candles with flames as one shape, and three round decorations as one shape. No letters, no numbers.
Main coloring zones (big and closed): plate, cake base, cream layer, candles, decorations.
Scene: Two big balloons behind the cake, one on each side.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 26. `lamp.png` — Настольная лампа

**Главные зоны (механика):** абажур, ножка, основание.

**В сцене:** It stands on one simple table line. Three short chunky light rays around the shade and one big star.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one table lamp: one trapezoid shade, one short stand and one oval base.
Main coloring zones (big and closed): shade, stand, base.
Scene: It stands on one simple table line. Three short chunky light rays around the shade and one big star.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 27. `kettle.png` — Чайник

**Главные зоны (механика):** корпус, крышка, ручка, носик.

**В сцене:** It stands on one simple stove line. Two big cloud-shaped puffs of steam.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one chubby kettle: round body, oval lid, one large handle and one spout. No pattern.
Main coloring zones (big and closed): body, lid, handle, spout.
Scene: It stands on one simple stove line. Two big cloud-shaped puffs of steam.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 28. `clock.png` — Будильник

**Главные зоны (механика):** корпус, циферблат, звоночки, ножки.

**В сцене:** It stands on one simple table line. One big sun and one cloud behind.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one round alarm clock: outer body, inner clock face with two simple hands and no numbers, two bells as one shape, two small feet as one shape.
Main coloring zones (big and closed): body, face, bells, feet.
Scene: It stands on one simple table line. One big sun and one cloud behind.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 29. `pear.png` — Груша

**Главные зоны (механика):** плод, лист.

**В сцене:** It sits on one gentle ground line. One more big leaf next to it and one simple cloud.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one big pear made of two stacked rounded shapes that read as one fruit, with a short stem and one big leaf.
Main coloring zones (big and closed): fruit, leaf.
Scene: It sits on one gentle ground line. One more big leaf next to it and one simple cloud.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 30. `banana.png` — Банан

**Главные зоны (механика):** плод, кончики, хвостик.

**В сцене:** It lies on one gentle ground line. One big palm leaf behind and one big sun.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one big curved banana with a short stem and two rounded tips.
Main coloring zones (big and closed): fruit, tips, stem.
Scene: It lies on one gentle ground line. One big palm leaf behind and one big sun.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 31. `ice-cream.png` — Мороженое

**Главные зоны (механика):** шарик, рожок, вишенка.

**В сцене:** One gentle ground line, one big sun and one simple cloud.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one ice cream: one round scoop, one triangle cone, and one round cherry. No drips, no sprinkles, no cone pattern.
Main coloring zones (big and closed): scoop, cone, cherry.
Scene: One gentle ground line, one big sun and one simple cloud.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 32. `plush.png` — Плюшевый мишка

**Главные зоны (механика):** тело, животик, уши, бант.

**В сцене:** It sits on one big round rug. One big toy block beside it.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one seated plush teddy bear in front view: round body, round belly, two round ears, one bow. Two eyes and a smile. No teeth.
Main coloring zones (big and closed): body, belly, ears, bow.
Scene: It sits on one big round rug. One big toy block beside it.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 33. `robot.png` — Дружелюбный робот

**Главные зоны (механика):** голова, тело, руки, ноги.

**В сцене:** One gentle ground line, one big star and one big gear shape.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one friendly rounded robot standing still: head, body, two arms as one shape, two legs as one shape. Two round eyes and a smile. No screen text.
Main coloring zones (big and closed): head, body, arms, legs.
Scene: One gentle ground line, one big star and one big gear shape.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 34. `cubes.png` — Три крупных кубика

**Главные зоны (механика):** левый, центр, правый.

**В сцене:** They stand on one gentle ground line. One big rainbow arch with three wide bands behind.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: three big rounded toy blocks in a row, the center one a little bigger, each a separate closed shape. No letters, no numbers, no pictures.
Main coloring zones (big and closed): left block, center block, right block.
Scene: They stand on one gentle ground line. One big rainbow arch with three wide bands behind.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 35. `whale.png` — Кит

**Главные зоны (механика):** тело, животик, плавник, вода.

**В сцене:** One big water fountain shape from its head and one big sun.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one friendly whale: big body, belly, one fin, and one big wavy shape of water. One round eye and a small smile. No teeth.
Main coloring zones (big and closed): body, belly, fin, water.
Scene: One big water fountain shape from its head and one big sun.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 36. `octopus.png` — Осьминог

**Главные зоны (механика):** голова, щупальца, глаза.

**В сцене:** Three big bubbles and one big simple starfish at the bottom.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one friendly octopus: round head, a few very thick tentacles as one shape, two round eyes as one shape and a smile. No suction cups.
Main coloring zones (big and closed): head, tentacles, eyes.
Scene: Three big bubbles and one big simple starfish at the bottom.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 37. `crab.png` — Краб

**Главные зоны (механика):** панцирь, клешни, лапки.

**В сцене:** One gentle sand line, one big shell and one big sun.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one friendly crab: round shell, two claws as one shape, four chubby legs as one shape, two eyes and a smile. No teeth.
Main coloring zones (big and closed): shell, claws, legs.
Scene: One gentle sand line, one big shell and one big sun.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 38. `turtle.png` — Морская черепаха

**Главные зоны (механика):** панцирь, тело, ласты.

**В сцене:** Three big bubbles and one big seaweed plant.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one sea turtle swimming: one large oval shell, a smaller body with head, four flippers as one shape, one eye and a small smile. No shell pattern.
Main coloring zones (big and closed): shell, body, flippers.
Scene: Three big bubbles and one big seaweed plant.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 39. `trex.png` — Добрый тираннозавр

**Главные зоны (механика):** тело, животик, голова, ноги.

**В сцене:** One gentle ground line, one big fern leaf and one big sun.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one kind chubby tyrannosaurus standing: body, round belly, large head, two legs as one shape, tiny rounded arms. One eye and a smile. No teeth, no claws, no spikes.
Main coloring zones (big and closed): body, belly, head, legs.
Scene: One gentle ground line, one big fern leaf and one big sun.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 40. `triceratops.png` — Трицератопс

**Главные зоны (механика):** тело, воротник, рога, ноги.

**В сцене:** One gentle ground line, one big fern leaf and one big sun.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one kind triceratops: body, one large round frill, two blunt horns as one shape, two legs as one shape. One eye and a smile. No teeth.
Main coloring zones (big and closed): body, frill, horns, legs.
Scene: One gentle ground line, one big fern leaf and one big sun.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 41. `stegosaurus.png` — Стегозавр

**Главные зоны (механика):** тело, пластины, животик, ноги.

**В сцене:** One gentle ground line, one big fern leaf and one simple cloud.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one kind stegosaurus: long body, three large rounded back plates as one shape, belly, two legs as one shape. One eye and a smile. No teeth, no thin spikes.
Main coloring zones (big and closed): body, plates, belly, legs.
Scene: One gentle ground line, one big fern leaf and one simple cloud.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 42. `butterfly.png` — Бабочка

**Главные зоны (механика):** левое крыло, правое крыло, тело, пятна.

**В сцене:** One big flower below it and one simple cloud.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one big butterfly seen from the front with symmetrical wings: left pair of wings, right pair of wings, a long body, and two round spots as one shape. Two short antennae.
Main coloring zones (big and closed): left wings, right wings, body, spots.
Scene: One big flower below it and one simple cloud.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 43. `ladybug.png` — Божья коровка

**Главные зоны (механика):** спинка, пятна, голова.

**В сцене:** It sits on one big leaf. One big flower beside it.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one big ladybug: large round shell, three big round spots as one shape, and one head with two eyes. No legs.
Main coloring zones (big and closed): shell, spots, head.
Scene: It sits on one big leaf. One big flower beside it.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 44. `bee.png` — Пчёлка

**Главные зоны (механика):** тело, полоски, крылья.

**В сцене:** One big flower next to it and one simple cloud.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one friendly bee: oval body, two thick stripes as one shape, two round wings as one shape, two eyes and a smile. No stinger.
Main coloring zones (big and closed): body, stripes, wings.
Scene: One big flower next to it and one simple cloud.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 45. `umbrella-child.png` — Ребёнок с зонтом

**Главные зоны (механика):** зонт, голова, плащ, сапожки.

**В сцене:** Three big raindrops and one big puddle at the bottom.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one small child under one large umbrella: a simple rounded figure with a round head, a coat and two boots as one shape. Two eyes and a smile. No hair strands.
Main coloring zones (big and closed): umbrella, head, coat, boots.
Scene: Three big raindrops and one big puddle at the bottom.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 46. `family.png` — Семейный портрет

**Главные зоны (механика):** взрослый слева, взрослый справа, ребёнок.

**В сцене:** One gentle ground line, one big round tree and one big sun.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: three simple rounded people standing together in front view: two taller adults and one smaller child in the middle. Each person is one closed shape with two eyes and a smile. No hair strands, no clothes details.
Main coloring zones (big and closed): adult left, adult right, child.
Scene: One gentle ground line, one big round tree and one big sun.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 47. `snowman.png` — Снеговик

**Главные зоны (механика):** голова, тело, шарф.

**В сцене:** One gentle snow hill line, one big fir tree and two big simple snowflakes.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one snowman: round head, bigger round body, one scarf, a simple carrot nose, two eyes and a smile. No buttons.
Main coloring zones (big and closed): head, body, scarf.
Scene: One gentle snow hill line, one big fir tree and two big simple snowflakes.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 48. `autumn-tree.png` — Осеннее дерево

**Главные зоны (механика):** крона, ствол, листья.

**В сцене:** One gentle ground line and one big sun.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one autumn tree: one big round crown, one thick trunk, and three fallen leaves as one shape. No twigs.
Main coloring zones (big and closed): crown, trunk, leaves.
Scene: One gentle ground line and one big sun.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 49. `gift.png` — Подарок

**Главные зоны (механика):** коробка, крышка, лента.

**В сцене:** One gentle ground line, one big balloon on each side.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one gift box: the box, the lid, and one ribbon with a simple bow. No pattern, no tag text.
Main coloring zones (big and closed): box, lid, ribbon.
Scene: One gentle ground line, one big balloon on each side.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## 50. `holiday-tree.png` — Нарядная ёлка

**Главные зоны (механика):** ёлка, шары, звезда, горшок.

**В сцене:** One gentle ground line and two big gift boxes beside the pot.

```
A very simple children's coloring book page for toddlers, black line art only. Subject: one holiday tree in a pot: one big triangle tree, three round ornaments as one shape, one simple star on top, and one pot. No tinsel, no text.
Main coloring zones (big and closed): tree, ornaments, star, pot.
Scene: One gentle ground line and two big gift boxes beside the pot.
Line art: one single thick dark-plum #2B2724 line, the same width everywhere, round line caps, on pure white #FFFFFF, pure white inside every shape. Very few lines: outlines only. No inner decoration lines, no patterns, no stripes, no highlights, no texture, no shading, no hatching, no gray, no color. All shapes are large, smooth, rounded and fully closed.
Composition: landscape 4:3, calm and airy with lots of empty white space. One big main subject centered, about 60% of the page, with only the few large simple supporting shapes listed in Scene, placed in a balanced way. Nothing touches or is cut by the page edge; small white margin. Depth only from a simple ground line and one shape slightly overlapping another.
Style: like a classic preschool coloring book: cute, simple, friendly, harmonious and easy to read, for ages 2-4.
Text: no letters, no numbers, no logo, no watermark, no border.
Avoid: busy backgrounds, confetti, many small shapes, thin lines, stripes, repeated patterns, extra balloons or objects, teeth, claws, tears.
Aspect ratio: 4:3. Resolution: 2K.
```

## Страницы выбора в игре

| Страница | Файлы |
|---|---|
| Игрушки | `big-ball`, `balloon`, `cubes`, `plush`, `robot`, `gift` |
| Зверята | `cat`, `dog`, `owl`, `bunny`, `bear-balloon`, `hedgehog` |
| Машины | `car`, `bus`, `tractor`, `boat`, `plane` |
| Дом | `cup`, `lamp`, `kettle`, `clock`, `boots`, `bath` |
| Еда | `apple`, `pear`, `banana`, `ice-cream`, `cake` |
| Вода | `fish`, `duck`, `whale`, `octopus`, `crab`, `turtle` |
| Букашки | `butterfly`, `ladybug`, `bee` |
| Динозавры | `trex`, `triceratops`, `stegosaurus` |
| Прогулка | `sun`, `flower`, `rain`, `watering`, `sleep`, `umbrella-child`, `family`, `snowman`, `autumn-tree`, `holiday-tree` |
