import type { PuzzleSceneId } from './logic'
import { getPuzzleScene, type PuzzleScene } from './logic'

const PUZZLE_SCENES_BASE = `${import.meta.env.BASE_URL ?? '/'}assets/games/puzzle/scenes/`

export function puzzleSceneAssetUrl(scene: PuzzleScene | PuzzleSceneId): string {
  const meta = typeof scene === 'string' ? getPuzzleScene(scene) : scene
  return `${PUZZLE_SCENES_BASE}${meta.imageFile}`
}

const QUAD_ACCENTS = ['#e85d5d', '#5aa6e0', '#5cbf7a', '#f0a04b'] as const

function quadrantGradientBackground(tint: string): string {
  const [c0, c1, c2, c3] = QUAD_ACCENTS
  const images = [
    `linear-gradient(135deg, ${tint}, ${c0})`,
    `linear-gradient(135deg, ${c1}, ${tint})`,
    `linear-gradient(135deg, ${tint}, ${c2})`,
    `linear-gradient(135deg, ${c3}, ${tint})`,
  ].join(', ')
  return `background-color:${tint};background-image:${images};background-size:50% 50%;background-repeat:no-repeat;background-position:left top,right top,left bottom,right bottom`
}

/** CSS-фон цельной картинки: PNG сцены + градиент-заглушка под ним. */
export function scenePreviewBackground(
  tint: string,
  options?: { sceneId?: PuzzleSceneId | null; customUrl?: string | null },
): string {
  const customUrl = options?.customUrl
  if (customUrl) {
    return `url("${customUrl}") center/cover no-repeat`
  }
  const sceneId = options?.sceneId
  if (sceneId) {
    const url = puzzleSceneAssetUrl(sceneId)
    return `background-color:${tint};background-image:url("${url}");background-size:cover;background-position:center;background-repeat:no-repeat`
  }
  return quadrantGradientBackground(tint)
}

export function sceneTintForId(sceneId: PuzzleSceneId | 'custom', customTint = '#ddd'): string {
  if (sceneId === 'custom') return customTint
  return getPuzzleScene(sceneId).tint
}

export function pieceCellBackground(
  pieceId: number,
  cols: number,
  rows: number,
  tint: string,
  imageSrc?: string | null,
): string {
  if (imageSrc) {
    const col = pieceId % cols
    const row = Math.floor(pieceId / cols)
    const x = cols === 1 ? '50%' : `${(col / (cols - 1)) * 100}%`
    const y = rows === 1 ? '50%' : `${(row / (rows - 1)) * 100}%`
    return `background-color:${tint};background-image:url("${imageSrc}");background-position:${x} ${y};background-size:${cols * 100}% ${rows * 100}%;background-repeat:no-repeat`
  }
  const accent = QUAD_ACCENTS[pieceId % QUAD_ACCENTS.length]!
  return `linear-gradient(135deg, ${tint}, ${accent})`
}

/** @deprecated alias */
export function pieceQuadrantBackground(
  pieceId: 0 | 1 | 2 | 3,
  tint: string,
  imageSrc?: string | null,
): string {
  return pieceCellBackground(pieceId, 2, 2, tint, imageSrc)
}
