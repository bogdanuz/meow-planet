/**
 * Кадр фото в рамке листа: центр картинки смещён от центра рамки на (x, y),
 * картинка масштабирована на scale и повёрнута на rotation (радианы). Всё в пикселях рамки.
 */
export type PhotoCrop = { x: number; y: number; scale: number; rotation: number }
export type Point = { x: number; y: number }

const MAX_ZOOM = 6

/** Полуразмеры рамки в осях повёрнутой картинки. */
function frameExtents(frameW: number, frameH: number, rotation: number): { ex: number; ey: number } {
  const cos = Math.abs(Math.cos(rotation))
  const sin = Math.abs(Math.sin(rotation))
  const a = frameW / 2
  const b = frameH / 2
  return { ex: a * cos + b * sin, ey: a * sin + b * cos }
}

/** Наименьший масштаб, при котором повёрнутая картинка закрывает всю рамку. */
export function minCoverScale(imgW: number, imgH: number, frameW: number, frameH: number, rotation: number): number {
  const { ex, ey } = frameExtents(frameW, frameH, rotation)
  return Math.max((2 * ex) / imgW, (2 * ey) / imgH)
}

export function initialPhotoCrop(imgW: number, imgH: number, frameW: number, frameH: number): PhotoCrop {
  return { x: 0, y: 0, scale: minCoverScale(imgW, imgH, frameW, frameH, 0), rotation: 0 }
}

/** Масштаб в пределах [закрыть рамку … ×6], сдвиг — чтобы углы рамки не выходили за фото. */
export function clampPhotoCrop(
  crop: PhotoCrop,
  imgW: number,
  imgH: number,
  frameW: number,
  frameH: number,
): PhotoCrop {
  const min = minCoverScale(imgW, imgH, frameW, frameH, crop.rotation)
  const scale = Math.min(min * MAX_ZOOM, Math.max(min, crop.scale))
  const { ex, ey } = frameExtents(frameW, frameH, crop.rotation)
  const limitX = Math.max(0, (imgW * scale) / 2 - ex)
  const limitY = Math.max(0, (imgH * scale) / 2 - ey)
  const cos = Math.cos(crop.rotation)
  const sin = Math.sin(crop.rotation)
  // Сдвиг в осях картинки: там ограничение — простой прямоугольник.
  const localX = crop.x * cos + crop.y * sin
  const localY = -crop.x * sin + crop.y * cos
  const lx = Math.min(limitX, Math.max(-limitX, localX))
  const ly = Math.min(limitY, Math.max(-limitY, localY))
  return { x: lx * cos - ly * sin, y: lx * sin + ly * cos, scale, rotation: crop.rotation }
}

/** Масштаб вокруг точки рамки (по умолчанию центр): точка фото под ней остаётся на месте. */
export function zoomPhotoCrop(
  crop: PhotoCrop,
  factor: number,
  imgW: number,
  imgH: number,
  frameW: number,
  frameH: number,
  anchor: Point = { x: frameW / 2, y: frameH / 2 },
): PhotoCrop {
  const ax = anchor.x - frameW / 2
  const ay = anchor.y - frameH / 2
  const min = minCoverScale(imgW, imgH, frameW, frameH, crop.rotation)
  const scale = Math.min(min * MAX_ZOOM, Math.max(min, crop.scale * factor))
  const k = scale / crop.scale
  return clampPhotoCrop(
    { ...crop, scale, x: ax + (crop.x - ax) * k, y: ay + (crop.y - ay) * k },
    imgW,
    imgH,
    frameW,
    frameH,
  )
}

/** Повернуть на 90° по часовой, от ближайшего прямого угла. */
export function rotatePhotoCrop(
  crop: PhotoCrop,
  imgW: number,
  imgH: number,
  frameW: number,
  frameH: number,
): PhotoCrop {
  const quarter = Math.PI / 2
  const rotation = (Math.round(crop.rotation / quarter) + 1) * quarter
  const turned = { ...crop, rotation: rotation % (Math.PI * 2) }
  const min = minCoverScale(imgW, imgH, frameW, frameH, turned.rotation)
  return clampPhotoCrop({ ...turned, scale: Math.max(min, crop.scale) }, imgW, imgH, frameW, frameH)
}

/**
 * Два пальца: масштаб по расстоянию, поворот по углу между пальцами,
 * точка фото под серединой пальцев едет вместе с ней. Без ограничений — их накладывает clamp.
 */
export function pinchPhotoCrop(
  start: PhotoCrop,
  from: readonly [Point, Point],
  to: readonly [Point, Point],
  frameW: number,
  frameH: number,
): PhotoCrop {
  const [a0, b0] = from
  const [a1, b1] = to
  const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y) || 1
  const d1 = Math.hypot(b1.x - a1.x, b1.y - a1.y) || 1
  const k = d1 / d0
  const turn = Math.atan2(b1.y - a1.y, b1.x - a1.x) - Math.atan2(b0.y - a0.y, b0.x - a0.x)
  const m0 = { x: (a0.x + b0.x) / 2 - frameW / 2, y: (a0.y + b0.y) / 2 - frameH / 2 }
  const m1 = { x: (a1.x + b1.x) / 2 - frameW / 2, y: (a1.y + b1.y) / 2 - frameH / 2 }
  const vx = start.x - m0.x
  const vy = start.y - m0.y
  const cos = Math.cos(turn)
  const sin = Math.sin(turn)
  return {
    x: m1.x + k * (vx * cos - vy * sin),
    y: m1.y + k * (vx * sin + vy * cos),
    scale: start.scale * k,
    rotation: start.rotation + turn,
  }
}

/** Нарисовать кадр в холст выхода размером outW × outH (той же пропорции, что рамка). */
export function drawPhotoCrop(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imgW: number,
  imgH: number,
  crop: PhotoCrop,
  frameW: number,
  outW: number,
  outH: number,
): void {
  const k = outW / frameW
  ctx.save()
  ctx.translate(outW / 2 + crop.x * k, outH / 2 + crop.y * k)
  ctx.rotate(crop.rotation)
  ctx.scale(crop.scale * k, crop.scale * k)
  ctx.drawImage(image, -imgW / 2, -imgH / 2, imgW, imgH)
  ctx.restore()
}
