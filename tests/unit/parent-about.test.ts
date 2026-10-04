import { describe, expect, it } from 'vitest'
import { GAME_IDS, MENU_TILE_IDS } from '../../src/content/catalog'
import { parentBlurbsInMenuOrder } from '../../src/content/parent-game-blurbs'

describe('parent game blurbs', () => {
  it('все игры каталога', () => {
    const rows = parentBlurbsInMenuOrder()
    expect(rows).toHaveLength(GAME_IDS.length)
    expect(rows[0]?.title).toBe('Лопни шарик')
    for (const id of GAME_IDS) {
      expect(rows.some((r) => r.id === id)).toBe(true)
    }
  })

  it('порядок как в меню: плитки сверху вниз, «В гости» последней', () => {
    const ids = parentBlurbsInMenuOrder().map((r) => r.id)
    expect(ids).toEqual([...MENU_TILE_IDS, 'meow-home'])
  })
})
