import { describe, expect, it } from 'vitest'
import { distancePx, findNearestSlot, resolveMagnetDrop } from '../../src/shared/placement'

describe('magnet placement', () => {
  it('далеко — без snap', () => {
    const result = resolveMagnetDrop('circle', 'circle', 200, 56, 'ближе')
    expect(result.snapped).toBe(false)
    expect(result.ok).toBe(false)
  })

  it('близко и форма совпала — snap', () => {
    const result = resolveMagnetDrop('triangle', 'triangle', 20, 56, 'hint')
    expect(result.snapped).toBe(true)
    expect(result.ok).toBe(true)
  })

  it('близко но форма другая — без snap + soft', () => {
    const result = resolveMagnetDrop('circle', 'square', 10, 56, 'квадрат')
    expect(result.snapped).toBe(false)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toBe('квадрат')
  })

  it('findNearestSlot выбирает ближайший', () => {
    const slots = [
      { key: 'a', center: { x: 0, y: 0 } },
      { key: 'b', center: { x: 50, y: 0 } },
    ]
    const found = findNearestSlot({ x: 45, y: 0 }, slots, 20)
    expect(found?.key).toBe('b')
    expect(distancePx({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})
