import { describe, expect, it } from 'vitest'
import { GAME_IDS } from '../../src/content/catalog'
import {
  CHILD_NAME_USED_IN_RELEASED_GAMES,
  isGameReleased,
  RELEASED_GAME_IDS,
} from '../../src/content/released-games'

describe('released games', () => {
  it('в релизе шарики, звуки и рисовалка (с раскрасками внутри)', () => {
    expect(RELEASED_GAME_IDS).toEqual(['balloon-pop', 'sound-world', 'drawing'])
    expect(isGameReleased('balloon-pop')).toBe(true)
    expect(isGameReleased('drawing')).toBe(true)
    expect(isGameReleased('counting')).toBe(false)
    expect(GAME_IDS.filter(isGameReleased)).toHaveLength(3)
    expect(CHILD_NAME_USED_IN_RELEASED_GAMES).toBe(true)
  })
})
