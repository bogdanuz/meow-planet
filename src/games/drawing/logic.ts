import type { CreativeColorId } from '../../shared/creative-palette'

export const DRAWING_BRUSHES = ['brush', 'marker', 'crayon', 'watercolor'] as const

export type DrawingBrush = (typeof DRAWING_BRUSHES)[number]
export type DrawingTool = DrawingBrush | 'eraser' | 'bucket'
export type DrawingSize = 'thin' | 'thick'
export type NormPoint = { x: number; y: number }

export type DrawingStroke = {
  tool: DrawingBrush | 'eraser' | 'fill'
  color: CreativeColorId
  size: DrawingSize
  points: NormPoint[]
}

export type ToolPaintStyle = {
  alpha: number
  widthScale: number
  composite: 'source-over' | 'destination-out'
  jitter: boolean
}

const STROKE_LIMIT = 1000
const MIN_POINT_DISTANCE = 0.012
const SOUND_GAP_MS = 160
const PALM_MIN_PX = 44

export function isPalmTouch(touch: { width: number; height: number }): boolean {
  return touch.width >= PALM_MIN_PX && touch.height >= PALM_MIN_PX
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
      return { alpha: 0.9, widthScale: 0.72, composite: 'source-over', jitter: false }
    case 'crayon':
      return { alpha: 0.75, widthScale: 1.05, composite: 'source-over', jitter: true }
    case 'watercolor':
      return { alpha: 0.35, widthScale: 1.85, composite: 'source-over', jitter: false }
    case 'eraser':
      return { alpha: 1, widthScale: 1.7, composite: 'destination-out', jitter: false }
    case 'brush':
    case 'bucket':
      return { alpha: 1, widthScale: 1, composite: 'source-over', jitter: false }
  }
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
