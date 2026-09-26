/**
 * Пазл 2×2: рама, 4 фиксированных слота (toddler frame puzzle).
 */

export const PUZZLE_SCENE_IDS = [
  'meow-home',
  'meadow',
  'forest',
  'sea',
  'winter',
  'summer',
] as const

export type PuzzleSceneId = (typeof PUZZLE_SCENE_IDS)[number]

export type PuzzleScene = {
  id: PuzzleSceneId
  titleRu: string
  /** CSS-цвет заглушки фона */
  tint: string
  /** Файл в `public/assets/games/puzzle/scenes/` (S16) */
  imageFile: string
}

/** Щедрый радиус «магнита» для рамы 2×2 (px, центр кусочка → центр слота). */
/** Запас для resolveMagnetDrop после попадания в расширенный rect слота. */
export const PUZZLE_FRAME_MAGNET_PX = 160

export const PUZZLE_SCENES: readonly PuzzleScene[] = [
  { id: 'meow-home', titleRu: 'Мяу дома', tint: '#f4c27a', imageFile: 'puzzle-meow-home.png' },
  { id: 'meadow', titleRu: 'Поляна', tint: '#8fce6b', imageFile: 'puzzle-meadow.png' },
  { id: 'forest', titleRu: 'Лес', tint: '#5cbf7a', imageFile: 'puzzle-forest.png' },
  { id: 'sea', titleRu: 'Море', tint: '#5aa6e0', imageFile: 'puzzle-sea.png' },
  { id: 'winter', titleRu: 'Зима', tint: '#c5d8f0', imageFile: 'puzzle-winter.png' },
  { id: 'summer', titleRu: 'Лето', tint: '#ffe08a', imageFile: 'puzzle-summer.png' },
]

export type PuzzlePieceId = 0 | 1 | 2 | 3

/** Слоты 2×2: tl=0, tr=1, bl=2, br=3 */
export const PUZZLE_SLOTS: readonly PuzzlePieceId[] = [0, 1, 2, 3]

export function pieceFits(pieceId: PuzzlePieceId, slotId: PuzzlePieceId): boolean {
  return pieceId === slotId
}

export function allSlotsFilled(filled: ReadonlySet<PuzzlePieceId>): boolean {
  return PUZZLE_SLOTS.every((id) => filled.has(id))
}

export function getPuzzleScene(id: PuzzleSceneId): PuzzleScene {
  const scene = PUZZLE_SCENES.find((s) => s.id === id)
  if (!scene) throw new Error(`Unknown puzzle scene: ${id}`)
  return scene
}
