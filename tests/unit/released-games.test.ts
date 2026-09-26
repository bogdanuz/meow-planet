import { describe, expect, it } from 'vitest'
import { GAME_IDS } from '../../src/content/catalog'
import {
  CHILD_NAME_USED_IN_RELEASED_GAMES,
  isGameReleased,
  RELEASED_GAME_IDS,
} from '../../src/content/released-games'

describe('released games', () => {
  it('первый релиз — шарики и звуки', () => {
    expect(RELEASED_GAME_IDS).toEqual(['balloon-pop', 'sound-world'])
    expect(isGameReleased('balloon-pop')).toBe(true)
    expect(isGameReleased('counting')).toBe(false)
    expect(GAME_IDS.filter(isGameReleased)).toHaveLength(2)
    expect(CHILD_NAME_USED_IN_RELEASED_GAMES).toBe(true)
  })
})
