import { describe, expect, it } from 'vitest'
import {
  CREATIVE_COLORS,
  CREATIVE_COLOR_IDS,
  isCreativeColorId,
} from '../../src/shared/creative-palette'

describe('creative palette', () => {
  it('показывает ровно 10 основных цветов без радуги и неона', () => {
    expect(CREATIVE_COLOR_IDS).toEqual([
      'red',
      'yellow',
      'blue',
      'green',
      'orange',
      'violet',
      'pink',
      'brown',
      'black',
      'white',
    ])
    expect(CREATIVE_COLORS).toHaveLength(10)
    expect(CREATIVE_COLORS.map((color) => color.id)).toEqual([...CREATIVE_COLOR_IDS])
    expect(CREATIVE_COLORS.every((color) => color.hex.startsWith('#'))).toBe(true)
    expect((CREATIVE_COLOR_IDS as readonly string[]).includes('rainbow')).toBe(false)
  })

  it('отличает цвет палитры от произвольной строки', () => {
    expect(isCreativeColorId('blue')).toBe(true)
    expect(isCreativeColorId('neon')).toBe(false)
    expect(isCreativeColorId(3)).toBe(false)
  })
})
