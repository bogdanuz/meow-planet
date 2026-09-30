import { describe, expect, it } from 'vitest'
import {
  DRAWING_BRUSHES,
  appendDrawingPoint,
  heldDotRadius,
  isPalmTouch,
  shouldPlayStrokeSound,
  toolPaintStyle,
  trimDrawingStrokes,
} from '../../src/games/drawing/logic'

describe('drawing logic', () => {
  it('даёт четыре кисти и не добавляет радужную', () => {
    expect(DRAWING_BRUSHES).toEqual(['brush', 'marker', 'crayon', 'watercolor'])
    expect(toolPaintStyle('crayon').jitter).toBe(true)
    expect(toolPaintStyle('watercolor').alpha).toBeLessThan(0.5)
    expect(toolPaintStyle('eraser').composite).toBe('destination-out')
    expect(toolPaintStyle('brush').alpha).toBe(1)
  })

  it('игнорирует ладонь, частые звуки и рост точки от удержания', () => {
    expect(isPalmTouch({ width: 52, height: 48 })).toBe(true)
    expect(isPalmTouch({ width: 18, height: 18 })).toBe(false)
    expect(shouldPlayStrokeSound(null, 1000)).toBe(true)
    expect(shouldPlayStrokeSound(1000, 1100)).toBe(false)
    expect(shouldPlayStrokeSound(1000, 1200)).toBe(true)
    expect(heldDotRadius('thin', 1000)).toBe(heldDotRadius('thin', 1000))
    expect(heldDotRadius('thick', 1000)).toBeGreaterThan(heldDotRadius('thin', 1000))
  })

  it('линия не копит лишние точки', () => {
    const points = appendDrawingPoint(
      [{ x: 0.1, y: 0.1 }],
      { x: 0.101, y: 0.101 },
    )
    expect(points).toHaveLength(1)
    const kept = appendDrawingPoint(points, { x: 0.4, y: 0.4 })
    expect(kept).toHaveLength(2)
    const many = Array.from({ length: 1200 }, (_, index) => ({
      tool: 'brush' as const,
      color: 'red' as const,
      size: 'thin' as const,
      points: [{ x: index / 1200, y: 0.2 }],
    }))
    expect(trimDrawingStrokes(many.slice(0, 600))).toHaveLength(600)
    expect(trimDrawingStrokes(many)).toHaveLength(1000)
  })

})
