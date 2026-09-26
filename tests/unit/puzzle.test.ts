import { describe, expect, it } from 'vitest'
import {
  PUZZLE_FRAME_MAGNET_PX,
  PUZZLE_SCENES,
  PUZZLE_SCENE_IDS,
} from '../../src/games/puzzle/logic'

describe('puzzle logic', () => {
  it('6 сцен с PNG', () => {
    expect(PUZZLE_SCENE_IDS).toHaveLength(6)
    expect(PUZZLE_SCENES).toHaveLength(6)
    expect(PUZZLE_FRAME_MAGNET_PX).toBeGreaterThanOrEqual(80)
  })
})

describe('puzzle scene-art', () => {
  it('scenePreviewBackground для сцены', async () => {
    const { scenePreviewBackground, pieceCellBackground } = await import(
      '../../src/games/puzzle/scene-art'
    )
    expect(scenePreviewBackground('#8fce6b', { sceneId: 'meadow' })).toContain(
      'puzzle-meadow.png',
    )
    expect(pieceCellBackground(2, 3, 2, '#fff', null)).toContain('linear-gradient')
  })
})
