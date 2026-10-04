import { describe, expect, it } from 'vitest'
import { GAME_IDS } from '../../src/content/catalog'
import {
  CHILD_NAME_USED_IN_RELEASED_GAMES,
  isGameReleased,
  RELEASED_GAME_IDS,
} from '../../src/content/released-games'

describe('released games', () => {
  it('в релизе восемь игр; «В гости» на доработке — заглушка (решение владельца 03.10.2026)', () => {
    expect(RELEASED_GAME_IDS).toEqual([
      'balloon-pop',
      'sound-world',
      'drawing',
      'sort-colors',
      'puzzle',
      'shape-build',
      'hide-seek',
      'counting',
    ])
    expect(isGameReleased('balloon-pop')).toBe(true)
    expect(isGameReleased('drawing')).toBe(true)
    expect(isGameReleased('sort-colors')).toBe(true)
    expect(isGameReleased('puzzle')).toBe(true)
    expect(isGameReleased('shape-build')).toBe(true)
    expect(isGameReleased('hide-seek')).toBe(true)
    expect(isGameReleased('counting')).toBe(true)
    expect(isGameReleased('meow-home')).toBe(false)
    expect(GAME_IDS.filter(isGameReleased)).toHaveLength(8)
    expect(CHILD_NAME_USED_IN_RELEASED_GAMES).toBe(true)
  })
})
