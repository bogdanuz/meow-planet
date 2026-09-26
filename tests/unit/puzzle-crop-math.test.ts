import { describe, expect, it } from 'vitest'
import {
  initialCoverPan,
  PUZZLE_LANDSCAPE_HEIGHT,
  PUZZLE_LANDSCAPE_WIDTH,
  sourceRectFromPan,
} from '../../src/shared/puzzle-crop-math'

describe('puzzle crop math', () => {
  it('экспорт 4:3', () => {
    expect(PUZZLE_LANDSCAPE_WIDTH / PUZZLE_LANDSCAPE_HEIGHT).toBeCloseTo(4 / 3, 5)
  })

  it('sourceRectFromPan покрывает viewport', () => {
    const pan = initialCoverPan(2000, 1500, 400, 300)
    const { sx, sy, sw, sh } = sourceRectFromPan(pan, 2000, 1500)
    expect(sx).toBeGreaterThanOrEqual(0)
    expect(sy).toBeGreaterThanOrEqual(0)
    expect(sw).toBeCloseTo(400 / pan.scale, 0)
    expect(sh).toBeCloseTo(300 / pan.scale, 0)
    expect(sx + sw).toBeLessThanOrEqual(2000)
    expect(sy + sh).toBeLessThanOrEqual(1500)
  })
})
