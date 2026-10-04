export const CREATIVE_COLOR_IDS = [
  'red',
  'burgundy',
  'orange',
  'lemon',
  'yellow',
  'lime',
  'green',
  'dark-green',
  'teal',
  'blue',
  'navy',
  'lilac',
  'violet',
  'pink',
  'beige',
  'brown',
  'white',
  'gray',
  'black',
] as const

export type CreativeColorId = (typeof CREATIVE_COLOR_IDS)[number]
/** Цвет штриха: из палитры или «Свой цвет» в виде #rrggbb. */
export type StrokeColor = CreativeColorId | `#${string}`

export const CREATIVE_COLORS: readonly {
  id: CreativeColorId
  label: string
  hex: string
}[] = [
  { id: 'red', label: 'Красный', hex: '#e4534a' },
  { id: 'burgundy', label: 'Бордовый', hex: '#9e2f45' },
  { id: 'orange', label: 'Оранжевый', hex: '#f0913a' },
  { id: 'lemon', label: 'Лимонный', hex: '#f5e663' },
  { id: 'yellow', label: 'Жёлтый', hex: '#f2c14e' },
  { id: 'lime', label: 'Салатовый', hex: '#a6d84f' },
  { id: 'green', label: 'Зелёный', hex: '#5cba6a' },
  { id: 'dark-green', label: 'Тёмно-зелёный', hex: '#2f7d4a' },
  { id: 'teal', label: 'Бирюзовый', hex: '#2bb3a7' },
  { id: 'blue', label: 'Голубой', hex: '#4aa3e0' },
  { id: 'navy', label: 'Тёмно-синий', hex: '#2c4a9a' },
  { id: 'lilac', label: 'Сиреневый', hex: '#b89be6' },
  { id: 'violet', label: 'Фиолетовый', hex: '#8d6ad8' },
  { id: 'pink', label: 'Розовый', hex: '#f08ab0' },
  { id: 'beige', label: 'Бежевый', hex: '#e8d3b0' },
  { id: 'brown', label: 'Коричневый', hex: '#8a5a3b' },
  { id: 'white', label: 'Белый', hex: '#fffdf8' },
  { id: 'gray', label: 'Серый', hex: '#9a9a9a' },
  { id: 'black', label: 'Чёрный', hex: '#2b2724' },
]

const COLOR_SET = new Set<string>(CREATIVE_COLOR_IDS)
const HEX_COLOR = /^#[0-9a-f]{6}$/i

export function isCreativeColorId(value: unknown): value is CreativeColorId {
  return typeof value === 'string' && COLOR_SET.has(value)
}

export function isHexColor(value: unknown): value is `#${string}` {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

export function isStrokeColor(value: unknown): value is StrokeColor {
  return isCreativeColorId(value) || isHexColor(value)
}

export function creativeColorHex(id: CreativeColorId): string {
  return CREATIVE_COLORS.find((color) => color.id === id)?.hex ?? '#fffdf8'
}

export function strokeColorHex(color: StrokeColor): string {
  return isHexColor(color) ? color.toLowerCase() : creativeColorHex(color)
}
