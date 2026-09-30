import { creativeColorHex } from '../../shared/creative-palette'
import type { DrawingBackground } from '../../shared/creative-works'
import {
  colorWallMask,
  dilateMask,
  floodRegion,
  lineWallMask,
  maskChangesColor,
  paintMask,
  type PixelMask,
} from './fill'
import { heldDotRadius, toolPaintStyle, type DrawingStroke } from './logic'

/** Всё, что лежит под и над слоем краски. */
export type SheetSources = {
  background: DrawingBackground
  photo: CanvasImageSource | null
  /** Контур раскраски (PNG с прозрачным фоном) — рисуется поверх краски. */
  line: CanvasImageSource | null
}

type FillCrop = { key: string; x: number; y: number; w: number; h: number; mask: Uint8Array }

const COLOR_FILL_TOLERANCE = 28

/**
 * Лист «Рисовалки»: фон → слой краски → контур.
 * Слой краски кэшируется; новые штрихи дорисовываются, без переигрывания всей истории.
 */
export function createSheetRenderer(view: HTMLCanvasElement) {
  const committed = document.createElement('canvas')
  const working = document.createElement('canvas')
  const fillCache = new WeakMap<DrawingStroke, FillCrop>()
  let applied: DrawingStroke[] = []
  let appliedKey = ''
  let walls: { line: CanvasImageSource; w: number; h: number; mask: PixelMask } | null = null

  function sourcesKey(sources: SheetSources, w: number, h: number): string {
    const bg = sources.background
    const bgKey = bg.kind === 'solid' ? bg.color : bg.kind === 'photo' ? bg.photoId : bg.sceneId
    return `${w}x${h}|${bg.kind}:${bgKey}|${sources.photo ? 1 : 0}|${sources.line ? 1 : 0}`
  }

  function lineWalls(line: CanvasImageSource, w: number, h: number): PixelMask | null {
    if (walls && walls.line === line && walls.w === w && walls.h === h) return walls.mask
    const scratch = document.createElement('canvas')
    scratch.width = w
    scratch.height = h
    const ctx = scratch.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(line, 0, 0, w, h)
    const mask = lineWallMask(ctx.getImageData(0, 0, w, h).data, w, h)
    walls = { line, w, h, mask }
    return mask
  }

  function computeFill(stroke: DrawingStroke, sources: SheetSources, key: string): FillCrop | null {
    const point = stroke.points[0]
    if (!point) return null
    const w = committed.width
    const h = committed.height
    const x = point.x * w
    const y = point.y * h
    let region: PixelMask | null
    let radius: number
    if (sources.background.kind === 'coloring' && sources.line) {
      const mask = lineWalls(sources.line, w, h)
      if (!mask) return null
      region = floodRegion(mask, w, h, x, y)
      radius = w >= 1200 ? 3 : 2
    } else {
      const scratch = document.createElement('canvas')
      scratch.width = w
      scratch.height = h
      const ctx = scratch.getContext('2d', { willReadFrequently: true })
      if (!ctx) return null
      paintBackground(ctx, w, h, sources.background, sources.photo)
      ctx.drawImage(committed, 0, 0)
      const composite = ctx.getImageData(0, 0, w, h).data
      region = floodRegion(colorWallMask(composite, w, h, x, y, COLOR_FILL_TOLERANCE), w, h, x, y)
      radius = 1
    }
    if (!region) return null
    return cropMask(dilateMask(region, w, h, radius), w, h, key)
  }

  function fillCrop(stroke: DrawingStroke, sources: SheetSources, key: string): FillCrop | null {
    const cached = fillCache.get(stroke)
    if (cached && cached.key === key) return cached
    const crop = computeFill(stroke, sources, key)
    if (crop) fillCache.set(stroke, crop)
    return crop
  }

  function applyFill(stroke: DrawingStroke, sources: SheetSources, key: string): void {
    const crop = fillCrop(stroke, sources, key)
    const ctx = committed.getContext('2d')
    if (!crop || !ctx) return
    const image = ctx.getImageData(crop.x, crop.y, crop.w, crop.h)
    paintMask(image.data, crop.mask, hexToRgb(creativeColorHex(stroke.color)))
    ctx.putImageData(image, crop.x, crop.y)
  }

  function applyStroke(stroke: DrawingStroke, sources: SheetSources, key: string): void {
    if (stroke.tool === 'fill') {
      applyFill(stroke, sources, key)
      return
    }
    const ctx = committed.getContext('2d')
    if (ctx) drawStroke(ctx, stroke, committed.width, committed.height)
  }

  function sync(strokes: readonly DrawingStroke[], sources: SheetSources): void {
    const w = view.width
    const h = view.height
    const key = sourcesKey(sources, w, h)
    const extendsApplied =
      key === appliedKey &&
      strokes.length >= applied.length &&
      applied.every((stroke, index) => strokes[index] === stroke)
    if (!extendsApplied) {
      committed.width = w
      committed.height = h
      committed.getContext('2d')?.clearRect(0, 0, w, h)
      applied = []
      appliedKey = key
    }
    for (let index = applied.length; index < strokes.length; index += 1) {
      const stroke = strokes[index]
      if (stroke) applyStroke(stroke, sources, key)
    }
    applied = [...strokes]
  }

  return {
    /** Изменит ли заливка лист: тап по линии или тем же цветом — нет. */
    fillChangesSheet(strokes: readonly DrawingStroke[], fill: DrawingStroke, sources: SheetSources): boolean {
      if (!view.getContext('2d')) return false
      sync(strokes, sources)
      const crop = fillCrop(fill, sources, appliedKey)
      const ctx = committed.getContext('2d')
      if (!crop || !ctx) return false
      const image = ctx.getImageData(crop.x, crop.y, crop.w, crop.h)
      return maskChangesColor(image.data, crop.mask, hexToRgb(creativeColorHex(fill.color)))
    },

    render(strokes: readonly DrawingStroke[], drafts: readonly DrawingStroke[], sources: SheetSources): void {
      const ctx = view.getContext('2d')
      if (!ctx) return
      sync(strokes, sources)
      const w = view.width
      const h = view.height
      ctx.clearRect(0, 0, w, h)
      paintBackground(ctx, w, h, sources.background, sources.photo)
      if (drafts.length > 0) {
        if (working.width !== w || working.height !== h) {
          working.width = w
          working.height = h
        }
        const workCtx = working.getContext('2d')
        if (workCtx) {
          workCtx.clearRect(0, 0, w, h)
          workCtx.drawImage(committed, 0, 0)
          for (const draft of drafts) drawStroke(workCtx, draft, w, h)
          ctx.drawImage(working, 0, 0)
        }
      } else {
        ctx.drawImage(committed, 0, 0)
      }
      if (sources.background.kind === 'coloring' && sources.line) {
        ctx.drawImage(sources.line, 0, 0, w, h)
      }
    },
  }
}

function cropMask(mask: PixelMask, width: number, height: number, key: string): FillCrop | null {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y += 1) {
    const row = y * width
    for (let x = 0; x < width; x += 1) {
      if (!mask[row + x]) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return null
  const w = maxX - minX + 1
  const h = maxY - minY + 1
  const crop = new Uint8Array(w * h)
  for (let y = 0; y < h; y += 1) {
    const from = (minY + y) * width + minX
    crop.set(mask.subarray(from, from + w), y * w)
  }
  return { key, x: minX, y: minY, w, h, mask: crop }
}

export function paintBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: DrawingBackground,
  photo: CanvasImageSource | null,
): void {
  if (background.kind === 'photo' && photo) {
    drawCover(ctx, width, height, photo)
    return
  }
  ctx.fillStyle =
    background.kind === 'solid' ? creativeColorHex(background.color) : creativeColorHex('white')
  ctx.fillRect(0, 0, width, height)
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  photo: CanvasImageSource,
): void {
  const sourceWidth = 'width' in photo ? Number(photo.width) : width
  const sourceHeight = 'height' in photo ? Number(photo.height) : height
  const scale = Math.max(width / sourceWidth, height / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  ctx.drawImage(photo, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  width: number,
  height: number,
): void {
  const style = toolPaintStyle(stroke.tool === 'fill' ? 'brush' : stroke.tool)
  const lineWidth = heldDotRadius(stroke.size, width) * style.widthScale
  ctx.save()
  ctx.globalAlpha = style.alpha
  ctx.globalCompositeOperation = style.composite
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = creativeColorHex(stroke.color)
  ctx.fillStyle = creativeColorHex(stroke.color)
  ctx.lineWidth = lineWidth
  trace(ctx, stroke, width, height)
  if (style.jitter) {
    ctx.globalAlpha = style.alpha * 0.55
    ctx.translate(lineWidth * 0.15, 0)
    trace(ctx, stroke, width, height)
  }
  ctx.restore()
}

function trace(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  width: number,
  height: number,
): void {
  const first = stroke.points[0]
  if (!first) return
  if (stroke.points.length === 1) {
    ctx.beginPath()
    ctx.arc(first.x * width, first.y * height, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(first.x * width, first.y * height)
  for (const point of stroke.points.slice(1)) ctx.lineTo(point.x * width, point.y * height)
  ctx.stroke()
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}
