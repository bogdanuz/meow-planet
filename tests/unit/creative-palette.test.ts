import { describe, expect, it } from 'vitest'
import {
  CREATIVE_COLORS,
  CREATIVE_COLOR_IDS,
  isCreativeColorId,
  isStrokeColor,
  strokeColorHex,
} from '../../src/games/drawing/creative-palette'

describe('creative palette', () => {
  it('19 цветов по порядку оттенков, старые id на месте', () => {
    expect(CREATIVE_COLOR_IDS).toEqual([
      'red',
      'burgundy',
      'orange',
      'lemon',
      'yellow',
      'lime',
      'green',
      'dark-green',
      'teal',
      'blue',
      'navy',
      'lilac',
      'violet',
      'pink',
      'beige',
      'brown',
      'white',
      'gray',
      'black',
    ])
    expect(CREATIVE_COLORS).toHaveLength(19)
    expect(CREATIVE_COLORS.map((color) => color.id)).toEqual([...CREATIVE_COLOR_IDS])
    expect(CREATIVE_COLORS.every((color) => /^#[0-9a-f]{6}$/.test(color.hex))).toBe(true)
    expect(new Set(CREATIVE_COLORS.map((color) => color.hex)).size).toBe(19)
    expect(CREATIVE_COLORS.find((color) => color.id === 'dark-green')?.label).toBe('Тёмно-зелёный')
    expect((CREATIVE_COLOR_IDS as readonly string[]).includes('rainbow')).toBe(false)
  })

  it('отличает цвет палитры от произвольной строки', () => {
    expect(isCreativeColorId('blue')).toBe(true)
    expect(isCreativeColorId('neon')).toBe(false)
    expect(isCreativeColorId(3)).toBe(false)
  })

  it('цвет штриха — id палитры или свой #rrggbb', () => {
    expect(isStrokeColor('teal')).toBe(true)
    expect(isStrokeColor('#12ab9f')).toBe(true)
    expect(isStrokeColor('#12AB9F')).toBe(true)
    expect(isStrokeColor('#fff')).toBe(false)
    expect(isStrokeColor('#12ab9f; background:url(x)')).toBe(false)
    expect(isStrokeColor('neon')).toBe(false)
    expect(strokeColorHex('red')).toBe('#e4534a')
    expect(strokeColorHex('#12AB9F')).toBe('#12ab9f')
  })
})
