/** Каталог игр MVP — только данные, без DOM и логики.
 *  zoneId — историческая группировка (UI зон снят в S13); меню = плоский список.
 */

export const ZONE_IDS = [
  'meow-orbit',
  'rainbow-meadow',
  'sound-grove',
  'planet-corners',
  'star-workshop',
] as const

export type ZoneId = (typeof ZONE_IDS)[number]

export const GAME_IDS = [
  'balloon-pop',
  'sound-world',
  'drawing',
  'sort-colors',
  'puzzle',
  'shape-build',
  'hide-seek',
  'meow-home',
  'counting',
] as const

export type GameId = (typeof GAME_IDS)[number]

export type ZoneMeta = {
  id: ZoneId
  title: string
}

export type GameMeta = {
  id: GameId
  title: string
  zoneId: ZoneId
  /** Номера модулей из идеи продукта (§11 / docs/11). */
  modules: readonly string[]
}

export const ZONES: readonly ZoneMeta[] = [
  { id: 'meow-orbit', title: 'Домик Мяу на орбите' },
  { id: 'rainbow-meadow', title: 'Радужная поляна' },
  { id: 'sound-grove', title: 'Звуковая роща' },
  { id: 'planet-corners', title: 'Уголки планеты' },
  { id: 'star-workshop', title: 'Мастерская звёзд' },
]

/**
 * Историческая таблица зон (docs/11 до 22.09.2026). UI зон снят; данные для тестов/мета.
 */
export const MVP_ZONE_GAMES: Readonly<Record<ZoneId, readonly GameId[]>> = {
  'meow-orbit': ['meow-home'],
  'rainbow-meadow': ['balloon-pop'],
  'sound-grove': ['sound-world'],
  'planet-corners': ['hide-seek'],
  'star-workshop': ['sort-colors', 'puzzle', 'shape-build', 'counting', 'drawing'],
}

export const GAMES: readonly GameMeta[] = [
  {
    id: 'balloon-pop',
    title: 'Лопни шарик',
    zoneId: 'rainbow-meadow',
    modules: ['2.1'],
  },
  {
    id: 'sound-world',
    title: 'Изучаем звуки',
    zoneId: 'sound-grove',
    modules: ['2.2', '2.8', '2.14'],
  },
  {
    id: 'drawing',
    title: 'Рисовалка',
    zoneId: 'star-workshop',
    modules: ['2.20', '2.7'],
  },
  {
    id: 'sort-colors',
    title: 'Куда положить?',
    zoneId: 'star-workshop',
    modules: ['2.3'],
  },
  {
    id: 'puzzle',
    title: 'Собери пазл',
    zoneId: 'star-workshop',
    modules: ['2.4'],
  },
  {
    id: 'shape-build',
    title: 'Собери фигурку',
    zoneId: 'star-workshop',
    modules: ['2.5'],
  },
  {
    id: 'hide-seek',
    title: 'Прятки',
    zoneId: 'planet-corners',
    modules: ['2.6'],
  },
  {
    id: 'meow-home',
    title: 'В гости',
    zoneId: 'meow-orbit',
    modules: ['2.13', '2.16', '2.10'],
  },
  {
    id: 'counting',
    title: 'Учимся считать',
    zoneId: 'star-workshop',
    modules: ['2.18'],
  },
]
