/**
 * «Собери пазл» (S16): 17 картинок, главный герой — сова, Мяу рядом.
 * Промпты и порядок — docs/assets/puzzle-ART.md.
 */

export const PUZZLE_SCENE_IDS = [
  'bake',
  'picnic',
  'bath',
  'beach',
  'snowman',
  'garden',
  'bedtime',
  'birthday',
  'train',
  'autumn',
  'music',
  'rain',
  'farm',
  'painting',
  'garage',
  'dentist',
  'newyear',
] as const

export type PuzzleSceneId = (typeof PUZZLE_SCENE_IDS)[number]

export type PuzzleScene = {
  id: PuzzleSceneId
  titleRu: string
  /** Основной цвет заглушки, пока нет картинки. */
  tint: string
}

/** Запас для resolveMagnetDrop после попадания в расширенный rect слота. */
export const PUZZLE_FRAME_MAGNET_PX = 160

export const PUZZLE_SCENES: readonly PuzzleScene[] = [
  { id: 'bake', titleRu: 'Пирог', tint: '#f4b860' },
  { id: 'picnic', titleRu: 'Пикник', tint: '#8fce6b' },
  { id: 'bath', titleRu: 'Купание', tint: '#7cc4e8' },
  { id: 'beach', titleRu: 'Море', tint: '#4fb3d9' },
  { id: 'snowman', titleRu: 'Снеговик', tint: '#b9d4f0' },
  { id: 'garden', titleRu: 'Сад', tint: '#6cc070' },
  { id: 'bedtime', titleRu: 'Сказка на ночь', tint: '#5b6fb8' },
  { id: 'birthday', titleRu: 'День рождения', tint: '#f08a9c' },
  { id: 'train', titleRu: 'Паровозик', tint: '#e8604c' },
  { id: 'autumn', titleRu: 'Осень', tint: '#e8923a' },
  { id: 'music', titleRu: 'Оркестр', tint: '#b07ad8' },
  { id: 'rain', titleRu: 'Дождик', tint: '#5aa0d0' },
  { id: 'farm', titleRu: 'Ферма', tint: '#d9a05a' },
  { id: 'painting', titleRu: 'Рисуем', tint: '#f2c94c' },
  { id: 'garage', titleRu: 'Автосервис', tint: '#3d5a99' },
  { id: 'dentist', titleRu: 'Зубной врач', tint: '#8fd3c7' },
  { id: 'newyear', titleRu: 'Новый год', tint: '#d9483b' },
]

export function getPuzzleScene(id: PuzzleSceneId): PuzzleScene {
  const scene = PUZZLE_SCENES.find((s) => s.id === id)
  if (!scene) throw new Error(`Unknown puzzle scene: ${id}`)
  return scene
}

export function isPuzzleSceneId(value: unknown): value is PuzzleSceneId {
  return typeof value === 'string' && (PUZZLE_SCENE_IDS as readonly string[]).includes(value)
}

/** Для «Ещё»: следующая по кругу, сначала несобранные. */
export function nextUnsolvedScene(
  current: PuzzleSceneId | null,
  solved: ReadonlySet<string>,
): PuzzleSceneId {
  const ids = PUZZLE_SCENE_IDS
  const start = current ? ids.indexOf(current) : -1
  for (let step = 1; step <= ids.length; step += 1) {
    const id = ids[(start + step) % ids.length]!
    if (id !== current && !solved.has(id)) return id
  }
  return ids[(start + 1) % ids.length]!
}
