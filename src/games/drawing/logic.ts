import type { StrokeColor } from './creative-palette'

export const DRAWING_BRUSHES = ['brush', 'marker', 'crayon', 'watercolor'] as const

export type DrawingBrush = (typeof DRAWING_BRUSHES)[number]
export type DrawingTool = DrawingBrush | 'eraser' | 'bucket'
export type DrawingSize = 'thin' | 'thick'
export type NormPoint = { x: number; y: number }

export type DrawingStroke = {
  tool: DrawingBrush | 'eraser' | 'fill'
  color: StrokeColor
  size: DrawingSize
  points: NormPoint[]
  /** Акварель: зерно неровного края — при перерисовке и отмене он тот же. */
  seed?: number
}

export type ToolPaintStyle = {
  alpha: number
  widthScale: number
  composite: 'source-over' | 'destination-out' | 'multiply'
  cap: CanvasLineCap
  join: CanvasLineJoin
  squareDot: boolean
  /** Свечение своим цветом: доля толщины линии. */
  glow: number
  grain: boolean
  passes: number
  /** Мягкий край: доля толщины линии. */
  softEdge: number
}

/** Пятно растёкшейся краски у края акварельного штриха, в пикселях листа. */
export type WatercolorBloom = { x: number; y: number; r: number }

const STROKE_LIMIT = 1000
const MIN_POINT_DISTANCE = 0.012
const SOUND_GAP_MS = 160

const BASE_STYLE: ToolPaintStyle = {
  alpha: 1,
  widthScale: 1,
  composite: 'source-over',
  cap: 'round',
  join: 'round',
  squareDot: false,
  glow: 0,
  grain: false,
  passes: 1,
  softEdge: 0,
}

export function shouldPlayStrokeSound(lastAt: number | null, now: number): boolean {
  if (lastAt === null) return true
  return now - lastAt >= SOUND_GAP_MS
}

export function heldDotRadius(size: DrawingSize, canvasWidth: number): number {
  const base = size === 'thin' ? 10 : 28
  return (base * canvasWidth) / 1000
}

export function toolPaintStyle(tool: DrawingTool): ToolPaintStyle {
  switch (tool) {
    case 'marker':
      return { ...BASE_STYLE, alpha: 0.55, widthScale: 0.8, cap: 'butt', join: 'miter', squareDot: true, glow: 0.9 }
    case 'crayon':
      return { ...BASE_STYLE, alpha: 0.9, widthScale: 1.05, grain: true, passes: 3 }
    case 'watercolor':
      return { ...BASE_STYLE, alpha: 0.5, widthScale: 1.85, composite: 'multiply', softEdge: 0.3 }
    case 'eraser':
      return { ...BASE_STYLE, widthScale: 1.7, composite: 'destination-out' }
    case 'brush':
    case 'bucket':
      return { ...BASE_STYLE }
  }
}

/** Детерминированный ГПСЧ (mulberry32): один seed — одна и та же картинка. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function newStrokeSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff) + 1
}

/** Старые работы сохранены без seed: зерно берём из первой точки. */
function watercolorSeed(stroke: DrawingStroke): number {
  if (stroke.seed !== undefined) return stroke.seed
  const first = stroke.points[0]
  return first ? Math.round(first.x * 99991 + first.y * 7919) + 1 : 1
}

/**
 * Плавный шум −1…1 по пройденному вдоль штриха пути (px), узлы через `wavelength`.
 * Зависит только от seed и расстояния — край не дрожит, пока палец ведёт линию.
 */
export function watercolorNoise(
  stroke: DrawingStroke,
  pass: number,
  distance: number,
  wavelength: number,
): number {
  const seed = watercolorSeed(stroke) ^ Math.imul(pass + 1, 0x9e3779b1)
  const knot = (index: number) =>
    seededRandom((seed ^ Math.imul(index + 7, 0x85ebca6b)) >>> 0)() * 2 - 1
  const at = distance / wavelength
  const index = Math.floor(at)
  const t = at - index
  const smooth = t * t * (3 - 2 * t)
  const from = knot(index)
  return from + (knot(index + 1) - from) * smooth
}

/** Пятна, куда краска «расползлась» по мокрой бумаге, — по обе стороны штриха. */
export function watercolorBlooms(
  stroke: DrawingStroke,
  width: number,
  height: number,
  lineWidth: number,
): WatercolorBloom[] {
  if (stroke.tool !== 'watercolor' || stroke.points.length === 0) return []
  const random = seededRandom((watercolorSeed(stroke) ^ 0x5bd1e995) >>> 0)
  const blooms: WatercolorBloom[] = []
  const place = (x: number, y: number, nx: number, ny: number) => {
    const chance = random()
    const side = random() < 0.5 ? -1 : 1
    const offset = lineWidth * (0.3 + random() * 0.35) * side
    const r = lineWidth * (0.18 + random() * 0.27)
    if (chance < 0.55) blooms.push({ x: x + nx * offset, y: y + ny * offset, r })
  }
  const points = stroke.points.map((p) => ({ x: p.x * width, y: p.y * height }))
  if (points.length === 1) {
    const { x, y } = points[0]!
    for (let index = 0; index < 4; index += 1) {
      const angle = random() * Math.PI * 2
      place(x, y, Math.cos(angle), Math.sin(angle))
    }
    return blooms
  }
  const step = lineWidth * 0.55
  let next = 0
  let travelled = 0
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1]!
    const b = points[index]!
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    if (length === 0) continue
    const nx = -(b.y - a.y) / length
    const ny = (b.x - a.x) / length
    while (next <= travelled + length) {
      const t = (next - travelled) / length
      place(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, nx, ny)
      next += step
    }
    travelled += length
  }
  return blooms
}

export function appendDrawingPoint(points: readonly NormPoint[], point: NormPoint): NormPoint[] {
  const last = points[points.length - 1]
  if (last && Math.hypot(last.x - point.x, last.y - point.y) < MIN_POINT_DISTANCE) {
    return [...points]
  }
  return [...points, { x: point.x, y: point.y }]
}

export function trimDrawingStrokes(
  strokes: readonly DrawingStroke[],
  max = STROKE_LIMIT,
): DrawingStroke[] {
  if (strokes.length <= max) return [...strokes]
  return strokes.slice(strokes.length - max)
}
