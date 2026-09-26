import type { PlaceholderColor } from './placeholders'

/** Общие 5 цветов поля (шарики и сортировка). Игры не импортируют друг друга. */
export const FIELD_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'violet',
] as const satisfies readonly PlaceholderColor[]

export type FieldColor = (typeof FIELD_COLORS)[number]
