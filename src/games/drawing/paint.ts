import { creativeColorHex, strokeColorHex } from './creative-palette'
import type { DrawingBackground } from './creative-works'
import {
  colorWallMask,
  dilateMask,
  floodRegion,
  lineWallMask,
  maskChangesColor,
  paintMask,
  type PixelMask,
} from './fill'
import {
  heldDotRadius,
  seededRandom,
  toolPaintStyle,
  watercolorBlooms,
  watercolorNoise,
  type DrawingStroke,
  type ToolPaintStyle,
} from './logic'

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

  // iOS освобождает память холстов медленно: один служебный холст на рендерер.
  let scratch: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null
  function fillScratch(w: number, h: number): CanvasRenderingContext2D | null {
    if (!scratch) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return null
      scratch = { canvas, ctx }
    }
    if (scratch.canvas.width !== w) scratch.canvas.width = w
    if (scratch.canvas.height !== h) scratch.canvas.height = h
    scratch.ctx.setTransform(1, 0, 0, 1, 0, 0)
    scratch.ctx.globalCompositeOperation = 'source-over'
    scratch.ctx.globalAlpha = 1
    return scratch.ctx
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
      const ctx = fillScratch(w, h)
      if (!ctx) return null
      ctx.clearRect(0, 0, w, h)
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
    paintMask(image.data, crop.mask, hexToRgb(strokeColorHex(stroke.color)))
    ctx.putImageData(image, crop.x, crop.y)
  }

  function applyStroke(stroke: DrawingStroke, sources: SheetSources, key: string): void {
    if (stroke.tool === 'fill') {
      applyFill(stroke, sources, key)
      return
    }
    const ctx = committed.getContext('2d')
    if (!ctx) return
    drawStroke(ctx, stroke, committed.width, committed.height)
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
      return maskChangesColor(image.data, crop.mask, hexToRgb(strokeColorHex(fill.color)))
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

type Box = { x: number; y: number; w: number; h: number }

let strokeLayer: HTMLCanvasElement | null = null
let grainTile: HTMLCanvasElement | null = null

/** Отдельный слой штриха: прозрачность и фактура применяются к штриху целиком, без потемнения на самопересечениях. */
function layerFor(width: number, height: number): CanvasRenderingContext2D | null {
  strokeLayer ??= document.createElement('canvas')
  if (strokeLayer.width !== width || strokeLayer.height !== height) {
    strokeLayer.width = width
    strokeLayer.height = height
  }
  return strokeLayer.getContext('2d')
}

/** Шум для зерна мелка: одинаковый при каждой перерисовке. */
function grainCanvas(): HTMLCanvasElement {
  if (grainTile) return grainTile
  const size = 128
  grainTile = document.createElement('canvas')
  grainTile.width = size
  grainTile.height = size
  const ctx = grainTile.getContext('2d')
  if (!ctx) return grainTile
  const random = seededRandom(7)
  ctx.fillStyle = '#000'
  for (let index = 0; index < 900; index += 1) {
    ctx.globalAlpha = 0.45 + random() * 0.55
    ctx.beginPath()
    ctx.ellipse(random() * size, random() * size, 0.8 + random() * 2.2, 0.6 + random() * 1.2, random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  return grainTile
}

function strokeBox(stroke: DrawingStroke, width: number, height: number, margin: number): Box {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const point of stroke.points) {
    minX = Math.min(minX, point.x * width)
    minY = Math.min(minY, point.y * height)
    maxX = Math.max(maxX, point.x * width)
    maxY = Math.max(maxY, point.y * height)
  }
  const x = Math.max(0, Math.floor(minX - margin))
  const y = Math.max(0, Math.floor(minY - margin))
  return {
    x,
    y,
    w: Math.max(1, Math.min(width, Math.ceil(maxX + margin)) - x),
    h: Math.max(1, Math.min(height, Math.ceil(maxY + margin)) - y),
  }
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  width: number,
  height: number,
): void {
  if (stroke.points.length === 0) return
  const style = toolPaintStyle(stroke.tool === 'fill' ? 'brush' : stroke.tool)
  const lineWidth = heldDotRadius(stroke.size, width) * style.widthScale
  const color = strokeColorHex(stroke.color)
  if (!style.grain && style.softEdge === 0) {
    ctx.save()
    ctx.globalAlpha = style.alpha
    ctx.globalCompositeOperation = style.composite
    if (style.glow > 0) {
      ctx.shadowColor = color
      ctx.shadowBlur = lineWidth * style.glow
    }
    tracePath(ctx, stroke, width, height, style, lineWidth, color)
    ctx.restore()
    return
  }
  const margin = lineWidth * (1.2 + style.softEdge * 3) + 4
  const box = strokeBox(stroke, width, height, margin)
  const layer = layerFor(width, height)
  if (!layer || !strokeLayer) return
  layer.save()
  layer.clearRect(box.x, box.y, box.w, box.h)
  if (style.grain) paintCrayon(layer, stroke, width, height, style, lineWidth, color, box)
  else paintWatercolor(layer, stroke, width, height, style, lineWidth, color, box)
  layer.restore()
  ctx.save()
  ctx.globalAlpha = style.alpha
  ctx.globalCompositeOperation = style.composite
  ctx.drawImage(strokeLayer, box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h)
  ctx.restore()
}

function paintCrayon(
  layer: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  width: number,
  height: number,
  style: ToolPaintStyle,
  lineWidth: number,
  color: string,
  box: Box,
): void {
  tracePath(layer, stroke, width, height, style, lineWidth * 0.86, color)
  const random = seededRandom(Math.round(stroke.points[0]!.x * 9973 + stroke.points[0]!.y * 7919))
  for (let pass = 1; pass < style.passes; pass += 1) {
    layer.save()
    layer.globalAlpha = 0.7
    layer.translate((random() - 0.5) * lineWidth * 0.35, (random() - 0.5) * lineWidth * 0.35)
    tracePath(layer, stroke, width, height, style, lineWidth * 0.45, color)
    layer.restore()
  }
  const pattern = layer.createPattern(grainCanvas(), 'repeat')
  if (!pattern) return
  layer.globalCompositeOperation = 'destination-out'
  layer.fillStyle = pattern
  layer.fillRect(box.x, box.y, box.w, box.h)
}

/**
 * Мягкий край через тень: путь уходит за лист, на листе остаётся только размытая тень.
 * `ctx.filter` в Safari на iPad ненадёжен.
 */
function softTrace(
  layer: CanvasRenderingContext2D,
  draw: () => void,
  color: string,
  blur: number,
  width: number,
): void {
  layer.save()
  layer.shadowColor = color
  layer.shadowBlur = blur
  layer.shadowOffsetX = width * 2
  layer.translate(-width * 2, 0)
  draw()
  layer.restore()
}

/**
 * Акварель: размытый ореол с пятнами растёкшейся краски, чуть темнее край,
 * неровное тело мазка и зерно бумаги. Неровность из seed штриха — при перерисовке та же.
 */
function paintWatercolor(
  layer: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  width: number,
  height: number,
  style: ToolPaintStyle,
  lineWidth: number,
  color: string,
  box: Box,
): void {
  const radius = lineWidth / 2
  const wave = lineWidth * 1.6
  const circles = (list: readonly { x: number; y: number; r: number }[]) => {
    for (const c of list) {
      layer.moveTo(c.x + c.r, c.y)
      layer.arc(c.x, c.y, c.r, 0, Math.PI * 2)
    }
  }
  const soft = (alpha: number, fill: string, blur: number, path: () => void, composite?: GlobalCompositeOperation) => {
    layer.save()
    layer.globalAlpha = alpha
    if (composite) layer.globalCompositeOperation = composite
    softTrace(
      layer,
      () => {
        layer.fillStyle = fill
        layer.beginPath()
        path()
        layer.fill()
      },
      fill,
      blur,
      width,
    )
    layer.restore()
  }
  const body = { size: 0.34, shift: 0.24, pass: 1, wave }

  // Краска расползлась по мокрой бумаге: местами широкий размытый ореол.
  soft(0.3, color, lineWidth * 0.35 * (style.softEdge / 0.3), () =>
    circles(blotchyStamps(stroke, width, height, radius * 1.15, { size: 0.5, shift: 0.3, pass: 0, wave: wave * 1.4 })),
  )
  soft(0.38, color, lineWidth * 0.3, () => circles(bloomClusters(watercolorBlooms(stroke, width, height, lineWidth))))
  // Пигмент собирается у границы — темнее край той же неровной формы.
  const rim = mixHex(color, '#1d1a2e', 0.28)
  soft(0.8, rim, lineWidth * 0.05, () => circles(blotchyStamps(stroke, width, height, radius * 0.98, body)))
  soft(1, color, lineWidth * 0.08, () => circles(blotchyStamps(stroke, width, height, radius * 0.8, body)))
  // Неравномерная заливка: светлые «пустоты» внутри мазка.
  soft(
    0.28,
    '#000',
    lineWidth * 0.2,
    () => circles(lightPatches(stroke, width, height, lineWidth)),
    'destination-out',
  )

  const pattern = layer.createPattern(grainCanvas(), 'repeat')
  if (!pattern) return
  layer.save()
  layer.globalCompositeOperation = 'destination-out'
  layer.globalAlpha = 0.16
  layer.fillStyle = pattern
  layer.fillRect(box.x, box.y, box.w, box.h)
  layer.restore()
}

type Stamp = { x: number; y: number; r: number }
type BlotchyShape = { size: number; shift: number; pass: number; wave: number }

/** Обход штриха с шагом `step`: точка, нормаль и пройденный путь. */
function walkStroke(
  stroke: DrawingStroke,
  width: number,
  height: number,
  step: number,
  visit: (x: number, y: number, nx: number, ny: number, distance: number) => void,
): void {
  const points = stroke.points.map((p) => ({ x: p.x * width, y: p.y * height }))
  const first = points[0]
  if (!first) return
  if (points.length === 1) {
    visit(first.x, first.y, 0, 0, 0)
    return
  }
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
      visit(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, nx, ny, next)
      next += step
    }
    travelled += length
  }
  const last = points[points.length - 1]!
  visit(last.x, last.y, 0, 0, travelled)
}

/** Штрих как цепочка кругов разного размера со смещением поперёк линии — неровный край. */
function blotchyStamps(
  stroke: DrawingStroke,
  width: number,
  height: number,
  radius: number,
  shape: BlotchyShape,
): Stamp[] {
  const stamps: Stamp[] = []
  walkStroke(stroke, width, height, Math.max(1.5, radius * 0.35), (x, y, nx, ny, d) => {
    const z =
      watercolorNoise(stroke, shape.pass, d, shape.wave) * 0.7 +
      watercolorNoise(stroke, shape.pass + 20, d, shape.wave * 0.35) * 0.3
    const s = watercolorNoise(stroke, shape.pass + 40, d, shape.wave * 1.3)
    stamps.push({
      x: x + nx * radius * shape.shift * s,
      y: y + ny * radius * shape.shift * s,
      r: Math.max(1, radius * (1 + shape.size * z)),
    })
  })
  return stamps
}

/** Пятно — несколько слившихся кругов, чтобы не выглядело ровной горошиной. */
function bloomClusters(blooms: readonly Stamp[]): Stamp[] {
  const out: Stamp[] = []
  for (const bloom of blooms) {
    const random = seededRandom(Math.round(bloom.x * 131 + bloom.y * 977))
    for (let index = 0; index < 3; index += 1) {
      const angle = random() * Math.PI * 2
      const spread = bloom.r * (0.3 + random() * 0.5)
      out.push({
        x: bloom.x + Math.cos(angle) * spread,
        y: bloom.y + Math.sin(angle) * spread,
        r: bloom.r * (0.45 + random() * 0.35),
      })
    }
  }
  return out
}

function lightPatches(stroke: DrawingStroke, width: number, height: number, lineWidth: number): Stamp[] {
  const patches: Stamp[] = []
  walkStroke(stroke, width, height, lineWidth * 0.5, (x, y, nx, ny, d) => {
    const n = watercolorNoise(stroke, 60, d, lineWidth * 2.2)
    if (n < 0.2) return
    const s = watercolorNoise(stroke, 61, d, lineWidth * 1.5) * lineWidth * 0.18
    patches.push({ x: x + nx * s, y: y + ny * s, r: lineWidth * (0.12 + n * 0.16) })
  })
  return patches
}

function tracePath(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  width: number,
  height: number,
  style: ToolPaintStyle,
  lineWidth: number,
  strokeColor: string,
  fillColor = strokeColor,
): void {
  const first = stroke.points[0]
  if (!first) return
  ctx.lineCap = style.cap
  ctx.lineJoin = style.join
  ctx.miterLimit = 2
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = strokeColor
  ctx.fillStyle = fillColor
  const x = first.x * width
  const y = first.y * height
  if (stroke.points.length === 1) {
    ctx.beginPath()
    if (style.squareDot) ctx.rect(x - lineWidth / 2, y - lineWidth / 2, lineWidth, lineWidth)
    else ctx.arc(x, y, lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(x, y)
  for (const point of stroke.points.slice(1)) ctx.lineTo(point.x * width, point.y * height)
  ctx.stroke()
}

function mixHex(base: string, other: string, amount: number): string {
  const a = hexToRgb(base)
  const b = hexToRgb(other)
  const channel = (index: 0 | 1 | 2) => Math.round(a[index] + (b[index] - a[index]) * amount)
  return `#${[channel(0), channel(1), channel(2)].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}
