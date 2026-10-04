import { describe, expect, it } from 'vitest'
import { SORT_COLORS, SORT_KINDS } from '../../src/games/sort-colors/catalog'
import { SORT_ART_READY } from '../../src/games/sort-colors/art-ready'
import {
  BIN_GEOMETRY,
  binArtUrl,
  binClipPath,
  sortBackgroundUrl,
  sortSfxUrl,
  stickerArtUrl,
  toyArtUrl,
} from '../../src/games/sort-colors/art'

function parseSvgDataUrl(url: string): Document {
  expect(url.startsWith('data:image/svg+xml')).toBe(true)
  const xml = decodeURIComponent(url.slice(url.indexOf(',') + 1))
  return new DOMParser().parseFromString(xml, 'image/svg+xml')
}

describe('sort-colors art', () => {
  it('все SVG-заглушки — корректный XML (иначе в браузере битая картинка)', () => {
    const urls = [
      binArtUrl(),
      ...SORT_KINDS.map(stickerArtUrl),
      ...SORT_KINDS.flatMap((k) => SORT_COLORS.map((c) => toyArtUrl(k, c))),
    ].filter((url) => url.startsWith('data:'))
    for (const url of urls) {
      const doc = parseSvgDataUrl(url)
      expect(doc.getElementsByTagName('parsererror')).toHaveLength(0)
      expect(doc.documentElement.nodeName).toBe('svg')
    }
  })

  it('готовый арт — PNG из public, остальное — заглушки; звуки только готовые', () => {
    expect(sortBackgroundUrl()).toContain(SORT_ART_READY.background ? 'sort-playroom-bg.webp' : 'menu-bg.webp')
    expect(binArtUrl().endsWith('/bin.png')).toBe(SORT_ART_READY.bin)
    expect(BIN_GEOMETRY.aspect).toBe(SORT_ART_READY.binAspect ?? 1.2)
    for (const kind of SORT_KINDS) {
      for (const color of SORT_COLORS) {
        const ready = SORT_ART_READY.toys.includes(`${kind}-${color}`)
        expect(toyArtUrl(kind, color).endsWith(`/toys/${kind}-${color}.png`)).toBe(ready)
      }
    }
    expect(sortSfxUrl('pickup')).toMatch(/assets\/audio\/pickup\.mp3$/)
    expect(sortSfxUrl('drop')).toMatch(/assets\/audio\/drop\.mp3$/)
    const pile = sortSfxUrl('pile')
    if (SORT_ART_READY.sfx.includes('pile')) expect(pile).toMatch(/sort-colors\/sfx\/pile\.mp3$/)
    else expect(pile).toBeNull()
  })

  it('слой игрушек в ящике обрезан по переднему краю', () => {
    const clip = binClipPath()
    expect(clip.startsWith('polygon(')).toBe(true)
    expect(clip).toContain('-90%')
  })

  it('обрезка идёт по ломаной переднего края (прямоугольный ящик)', () => {
    const clip = binClipPath({
      aspect: 1.4,
      opening: { x: 0, y: 0, w: 1, h: 1 },
      front: [
        [0.1, 0.2],
        [0.8, 0.25],
        [0.95, 0.05],
      ],
      sticker: { x: 0.5, y: 0.5, w: 0.3 },
    })
    expect(clip).toBe(
      'polygon(-25% -90%, 125% -90%, 125% 5.00%, 95.00% 5.00%, 80.00% 25.00%, 10.00% 20.00%, -25% 20.00%)',
    )
  })
})
