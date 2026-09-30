export const CREATIVE_COLOR_IDS = [
  'red',
  'yellow',
  'blue',
  'green',
  'orange',
  'violet',
  'pink',
  'brown',
  'black',
  'white',
] as const

export type CreativeColorId = (typeof CREATIVE_COLOR_IDS)[number]

export const CREATIVE_COLORS: readonly {
  id: CreativeColorId
  label: string
  hex: string
}[] = [
  { id: 'red', label: 'Красный', hex: '#e4534a' },
  { id: 'yellow', label: 'Жёлтый', hex: '#f2c14e' },
  { id: 'blue', label: 'Голубой', hex: '#4aa3e0' },
  { id: 'green', label: 'Зелёный', hex: '#5cba6a' },
  { id: 'orange', label: 'Оранжевый', hex: '#f0913a' },
  { id: 'violet', label: 'Фиолетовый', hex: '#8d6ad8' },
  { id: 'pink', label: 'Розовый', hex: '#f08ab0' },
  { id: 'brown', label: 'Коричневый', hex: '#8a5a3b' },
  { id: 'black', label: 'Чёрный', hex: '#2b2724' },
  { id: 'white', label: 'Белый', hex: '#fffdf8' },
]

const COLOR_SET = new Set<string>(CREATIVE_COLOR_IDS)

export function isCreativeColorId(value: unknown): value is CreativeColorId {
  return typeof value === 'string' && COLOR_SET.has(value)
}

export function creativeColorHex(id: CreativeColorId): string {
  return CREATIVE_COLORS.find((color) => color.id === id)?.hex ?? '#fffdf8'
}
