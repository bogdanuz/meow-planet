import { describe, expect, it } from 'vitest'
import {
  assertTemplateShapes,
  evaluatePieceNearSlot,
  getTemplate,
  MAGNET_RADIUS_PX,
  SHAPE_KINDS,
  TEMPLATES,
  TEMPLATE_IDS,
} from '../../src/games/shape-build/logic'
import {
  distancePx,
  findNearestSlot,
  resolveMagnetDrop,
} from '../../src/shared/placement'

describe('shape-build templates', () => {
  it('10 шаблонов MVP (S14)', () => {
    expect(TEMPLATE_IDS).toEqual([
      'house',
      'car',
      'fish',
      'meow',
      'rocket',
      'sun',
      'flower',
      'boat',
      'apple',
      'star-bunny',
    ])
    expect(TEMPLATES).toHaveLength(10)
    expect(TEMPLATES.map((t) => t.id)).toEqual([...TEMPLATE_IDS])
  })

  it('слоты только из круга/квадрата/треугольника/прямоугольника/звезды', () => {
    for (const template of TEMPLATES) {
      expect(assertTemplateShapes(template)).toBe(true)
      expect(template.slots.length).toBeGreaterThanOrEqual(2)
      expect(new Set(template.slots.map((s) => s.id)).size).toBe(
        template.slots.length,
      )
      for (const slot of template.slots) {
        expect(SHAPE_KINDS).toContain(slot.shape)
        expect(slot.xPct).toBeGreaterThan(0)
        expect(slot.xPct).toBeLessThan(100)
        expect(slot.yPct).toBeGreaterThan(0)
        expect(slot.yPct).toBeLessThan(100)
      }
    }
  })

  it('getTemplate возвращает дом', () => {
    expect(getTemplate('house').titleRu).toBe('Дом')
    expect(getTemplate('house').slots.some((s) => s.shape === 'triangle')).toBe(
      true,
    )
  })
})

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

  it('evaluatePieceNearSlot для дома', () => {
    const house = getTemplate('house')
    const roof = house.slots.find((s) => s.shape === 'triangle')!
    const near = evaluatePieceNearSlot(
      'triangle',
      roof,
      { x: 100, y: 100 },
      { x: 110, y: 105 },
      MAGNET_RADIUS_PX,
    )
    expect(near.snapped).toBe(true)

    const far = evaluatePieceNearSlot(
      'triangle',
      roof,
      { x: 0, y: 0 },
      { x: 400, y: 400 },
      MAGNET_RADIUS_PX,
    )
    expect(far.snapped).toBe(false)
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
