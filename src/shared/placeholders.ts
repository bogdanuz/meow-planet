/**
 * Соглашение по CSS/SVG-заглушкам до мегафайла (путь А, S13).
 *
 * Классы в `src/styles/placeholders.css`:
 * - `.ph` — базовый блок-заглушка
 * - `.ph--circle` / `.ph--square` / `.ph--triangle` / `.ph--rect` / `.ph--heart` / `.ph--star`
 * - `.ph--balloon` — овал шарика
 * - `.ph-color--red|orange|yellow|green|blue|indigo|violet` — 7 цветов радуги
 *
 * Правила:
 * 1. Игровая логика не зависит от финальных PNG — только от data-атрибутов/классов.
 * 2. Цвет задаётся классом `.ph-color--*`, не хардкодом в TS (кроме тестов).
 * 3. Размер — CSS (`width`/`height` или scale), не отдельный файл ассета.
 * 4. Финальные картинки из мегафайла заменят содержимое, классы-роли сохранятся.
 */

export const PLACEHOLDER_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'indigo',
  'violet',
] as const

export type PlaceholderColor = (typeof PLACEHOLDER_COLORS)[number]

export const PLACEHOLDER_SHAPES = [
  'circle',
  'square',
  'triangle',
  'rect',
  'heart',
  'star',
  'balloon',
] as const

export type PlaceholderShape = (typeof PLACEHOLDER_SHAPES)[number]

export function placeholderClass(
  shape: PlaceholderShape,
  color?: PlaceholderColor,
): string {
  const parts = ['ph', `ph--${shape}`]
  if (color) parts.push(`ph-color--${color}`)
  return parts.join(' ')
}
