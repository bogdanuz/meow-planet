import type { PlaceholderColor, PlaceholderShape } from './placeholders'

/** Категории банка объектов (сжатый каркас до мегафайла S13). */
export const OBJECT_CATEGORIES = [
  'animals',
  'food',
  'transport',
  'nature',
  'shapes',
  'instruments',
] as const

export type ObjectCategory = (typeof OBJECT_CATEGORIES)[number]

export type BankObject = {
  id: string
  category: ObjectCategory
  labelRu: string
  shape: PlaceholderShape
  color: PlaceholderColor
  /** Есть ли предметный звук (для «Изучаем звуки»). */
  hasSound: boolean
}

/**
 * Небольшой набор заглушек: логика игр опирается на id/категорию/форму,
 * не на финальные PNG.
 */
export const OBJECT_BANK: readonly BankObject[] = [
  {
    id: 'cat',
    category: 'animals',
    labelRu: 'Кошка',
    shape: 'circle',
    color: 'orange',
    hasSound: true,
  },
  {
    id: 'dog',
    category: 'animals',
    labelRu: 'Собака',
    shape: 'circle',
    color: 'yellow',
    hasSound: true,
  },
  {
    id: 'bird',
    category: 'animals',
    labelRu: 'Птица',
    shape: 'triangle',
    color: 'blue',
    hasSound: true,
  },
  {
    id: 'apple',
    category: 'food',
    labelRu: 'Яблоко',
    shape: 'circle',
    color: 'red',
    hasSound: false,
  },
  {
    id: 'banana',
    category: 'food',
    labelRu: 'Банан',
    shape: 'rect',
    color: 'yellow',
    hasSound: false,
  },
  {
    id: 'car',
    category: 'transport',
    labelRu: 'Машина',
    shape: 'rect',
    color: 'blue',
    hasSound: true,
  },
  {
    id: 'tree',
    category: 'nature',
    labelRu: 'Дерево',
    shape: 'triangle',
    color: 'green',
    hasSound: false,
  },
  {
    id: 'sun',
    category: 'nature',
    labelRu: 'Солнце',
    shape: 'circle',
    color: 'yellow',
    hasSound: false,
  },
  {
    id: 'circle-shape',
    category: 'shapes',
    labelRu: 'Круг',
    shape: 'circle',
    color: 'red',
    hasSound: false,
  },
  {
    id: 'square-shape',
    category: 'shapes',
    labelRu: 'Квадрат',
    shape: 'square',
    color: 'blue',
    hasSound: false,
  },
  {
    id: 'star-shape',
    category: 'shapes',
    labelRu: 'Звезда',
    shape: 'star',
    color: 'violet',
    hasSound: false,
  },
  {
    id: 'drum',
    category: 'instruments',
    labelRu: 'Барабан',
    shape: 'circle',
    color: 'orange',
    hasSound: true,
  },
  {
    id: 'bell',
    category: 'instruments',
    labelRu: 'Колокольчик',
    shape: 'triangle',
    color: 'yellow',
    hasSound: true,
  },
]

export function listByCategory(category: ObjectCategory): BankObject[] {
  return OBJECT_BANK.filter((item) => item.category === category)
}

export function listSoundObjects(): BankObject[] {
  return OBJECT_BANK.filter((item) => item.hasSound)
}

export function getObjectById(id: string): BankObject | undefined {
  return OBJECT_BANK.find((item) => item.id === id)
}
