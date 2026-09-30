import path from 'node:path'
import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { MENU_TILE_IDS } from '../../src/app/screens/menu'
import { menuCardPngUrl, menuVisitBedPngUrl } from '../../src/app/menu-cards'

describe('menu card assets', () => {
  it('URL для каждой плитки сетки и «В гости»', () => {
    for (const id of MENU_TILE_IDS) {
      expect(menuCardPngUrl(id)).toContain(`card-${id}.png`)
    }
    expect(MENU_TILE_IDS.slice(0, 4)).toEqual([
      'balloon-pop',
      'sound-world',
      'drawing',
      'sort-colors',
    ])
    expect(MENU_TILE_IDS).toHaveLength(8)
    expect(MENU_TILE_IDS).not.toContain('coloring' as never)
    expect(MENU_TILE_IDS).not.toContain('seasons' as never)
    expect(menuVisitBedPngUrl()).toContain('menu-visit-bed.png')
  })

  it('плитка counting берёт мастер «Учимся считать» с кубиками 1-2-3', async () => {
    const file = path.resolve(
      import.meta.dirname,
      '../../public/assets/menu/card-counting.png',
    )
    const { data, info } = await sharp(file)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const x = Math.floor(info.width * 0.5)
    const y = Math.floor(info.height * 0.32)
    const i = (y * info.width + x) * 4
    expect(info.width).toBe(1024)
    expect(info.height).toBe(1024)
    expect(data[3]).toBe(0)
    expect(data[i]).toBeGreaterThan(220)
    expect(data[i + 1]).toBeGreaterThan(180)
    expect(data[i + 2]).toBeLessThan(140)

    const lipY = Math.floor(info.height * 0.975)
    const lip = (lipY * info.width + x) * 4
    expect(data[lip]).toBeLessThan(205)
    expect(data[lip + 1]).toBeLessThan(190)
    expect(Math.abs(data[lip] - data[lip + 2])).toBeLessThan(30)
  })
})
