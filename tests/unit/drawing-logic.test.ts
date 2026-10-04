import { describe, expect, it } from 'vitest'
import * as logic from '../../src/games/drawing/logic'
import {
  DRAWING_BRUSHES,
  appendDrawingPoint,
  heldDotRadius,
  shouldPlayStrokeSound,
  toolPaintStyle,
  trimDrawingStrokes,
  watercolorBlooms,
  watercolorNoise,
  type DrawingStroke,
} from '../../src/games/drawing/logic'

describe('drawing logic', () => {
  it('даёт четыре кисти и не добавляет радужную', () => {
    expect(DRAWING_BRUSHES).toEqual(['brush', 'marker', 'crayon', 'watercolor'])
    expect(toolPaintStyle('eraser').composite).toBe('destination-out')
  })

  it('круглая кисть ровная и непрозрачная', () => {
    const brush = toolPaintStyle('brush')
    expect(brush.alpha).toBe(1)
    expect(brush.cap).toBe('round')
    expect(brush.grain).toBe(false)
    expect(brush.softEdge).toBe(0)
  })

  it('фломастер: квадратный кончик, полупрозрачный, светится своим цветом', () => {
    const marker = toolPaintStyle('marker')
    expect(marker.cap).toBe('butt')
    expect(marker.join).toBe('miter')
    expect(marker.squareDot).toBe(true)
    expect(marker.alpha).toBeGreaterThan(0.45)
    expect(marker.alpha).toBeLessThan(0.65)
    expect(marker.glow).toBeGreaterThan(0)
  })

  it('мелок зернистый и рисуется несколькими проходами', () => {
    const crayon = toolPaintStyle('crayon')
    expect(crayon.grain).toBe(true)
    expect(crayon.passes).toBeGreaterThanOrEqual(2)
  })

  it('акварель: мягкие края и смешивание, потёков нет', () => {
    const water = toolPaintStyle('watercolor')
    expect(water.composite).toBe('multiply')
    expect(water.softEdge).toBeGreaterThan(0)
    expect(water.alpha).toBeLessThan(0.7)
    expect('drips' in water).toBe(false)
    expect('watercolorDrips' in logic).toBe(false)
    expect('dripProgress' in logic).toBe(false)
  })

  it('фильтра ладони больше нет: рисует любое касание', () => {
    expect('isPalmTouch' in logic).toBe(false)
  })

  const water: DrawingStroke = {
    tool: 'watercolor',
    color: 'blue',
    size: 'thick',
    seed: 12345,
    points: Array.from({ length: 12 }, (_, i) => ({ x: 0.1 + i * 0.05, y: 0.3 + Math.sin(i) * 0.02 })),
  }

  const along = (stroke: DrawingStroke, pass: number) =>
    Array.from({ length: 40 }, (_, i) => watercolorNoise(stroke, pass, i * 10, 40))

  it('неровный край акварели: одинаковый для одного seed, в пределах ±1', () => {
    const first = along(water, 0)
    expect(along({ ...water, points: water.points.map((p) => ({ ...p })) }, 0)).toEqual(first)
    expect(first.every((v) => v >= -1 && v <= 1)).toBe(true)
    expect(new Set(first.map((v) => v.toFixed(2))).size).toBeGreaterThan(10)
    expect(along(water, 1)).not.toEqual(first)
    expect(along({ ...water, seed: 999 }, 0)).not.toEqual(first)
  })

  it('край плавный и не зависит от длины штриха — не «прыгает», пока палец ведёт линию', () => {
    for (let d = 0; d < 400; d += 7) {
      const step = Math.abs(watercolorNoise(water, 0, d, 40) - watercolorNoise(water, 0, d + 0.5, 40))
      expect(step).toBeLessThan(0.1)
    }
    const shorter = { ...water, points: water.points.slice(0, 5) }
    expect(along(shorter, 0)).toEqual(along(water, 0))
  })

  it('старый штрих без seed тоже получает свой постоянный край', () => {
    const legacy = { ...water, seed: undefined }
    expect(along(legacy, 0)).toEqual(along({ ...legacy }, 0))
    expect(along(legacy, 0).some((v) => v !== 0)).toBe(true)
  })

  it('растёкшаяся краска: пятна у края штриха, одинаковые для seed', () => {
    const lineWidth = 50
    const blooms = watercolorBlooms(water, 1000, 750, lineWidth)
    expect(blooms.length).toBeGreaterThan(2)
    expect(watercolorBlooms(water, 1000, 750, lineWidth)).toEqual(blooms)
    for (const bloom of blooms) {
      const near = Math.min(
        ...water.points.map((p) => Math.hypot(p.x * 1000 - bloom.x, p.y * 750 - bloom.y)),
      )
      expect(near).toBeLessThanOrEqual(lineWidth)
      expect(bloom.r).toBeGreaterThan(0)
      expect(bloom.r).toBeLessThanOrEqual(lineWidth * 0.5)
    }
    expect(watercolorBlooms({ ...water, tool: 'brush' }, 1000, 750, lineWidth)).toEqual([])
  })

  it('частые звуки и рост точки от удержания', () => {
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
