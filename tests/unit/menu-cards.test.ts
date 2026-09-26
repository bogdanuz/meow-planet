import { describe, expect, it } from 'vitest'
import { MENU_TILE_IDS } from '../../src/app/screens/menu'
import { menuCardPngUrl, menuVisitBedPngUrl } from '../../src/app/menu-cards'

describe('menu card assets', () => {
  it('URL для каждой плитки сетки и «В гости»', () => {
    for (const id of MENU_TILE_IDS) {
      expect(menuCardPngUrl(id)).toContain(`card-${id}.png`)
    }
    expect(menuVisitBedPngUrl()).toContain('menu-visit-bed.png')
  })
})
