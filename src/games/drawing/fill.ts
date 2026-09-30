/** Заливка по тапу: 1 в маске — пиксель стены или области. Чистые функции, без DOM. */
export type PixelMask = Uint8Array

/** Стены раскраски — непрозрачные пиксели контура. */
export function lineWallMask(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  alphaMin = 128,
): PixelMask {
  const walls = new Uint8Array(width * height)
  for (let index = 0; index < walls.length; index += 1) {
    if ((rgba[index * 4 + 3] ?? 0) >= alphaMin) walls[index] = 1
  }
  return walls
}

/** Стены на цвете или фото — всё, что заметно отличается от цвета под пальцем. */
export function colorWallMask(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  tolerance: number,
): PixelMask {
  const walls = new Uint8Array(width * height)
  const startX = Math.floor(x)
  const startY = Math.floor(y)
  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return walls.fill(1)
  const start = (startY * width + startX) * 4
  const r = rgba[start] ?? 0
  const g = rgba[start + 1] ?? 0
  const b = rgba[start + 2] ?? 0
  const a = rgba[start + 3] ?? 0
  for (let index = 0; index < walls.length; index += 1) {
    const offset = index * 4
    if (
      Math.abs((rgba[offset] ?? 0) - r) > tolerance ||
      Math.abs((rgba[offset + 1] ?? 0) - g) > tolerance ||
      Math.abs((rgba[offset + 2] ?? 0) - b) > tolerance ||
      Math.abs((rgba[offset + 3] ?? 0) - a) > tolerance
    ) {
      walls[index] = 1
    }
  }
  return walls
}

/** Связная область без стен вокруг точки. null — тап по стене или мимо листа. */
export function floodRegion(
  walls: PixelMask,
  width: number,
  height: number,
  x: number,
  y: number,
): PixelMask | null {
  const startX = Math.floor(x)
  const startY = Math.floor(y)
  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return null
  if (walls[startY * width + startX]) return null
  const region = new Uint8Array(width * height)
  const stack = new Int32Array(width * height + 1)
  let top = 0
  stack[top++] = startY * width + startX
  region[startY * width + startX] = 1
  while (top > 0) {
    const index = stack[--top] ?? 0
    const cx = index % width
    const cy = (index - cx) / width
    const visit = (next: number) => {
      if (region[next] || walls[next]) return
      region[next] = 1
      stack[top++] = next
    }
    if (cx > 0) visit(index - 1)
    if (cx < width - 1) visit(index + 1)
    if (cy > 0) visit(index - width)
    if (cy < height - 1) visit(index + width)
  }
  return region
}

/** Расширяет область на radius пикселей (квадратом): краска заходит под линию. */
export function dilateMask(
  mask: PixelMask,
  width: number,
  height: number,
  radius: number,
): PixelMask {
  const r = Math.max(0, Math.round(radius))
  if (r === 0) return new Uint8Array(mask)
  const rows = new Uint8Array(mask.length)
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * width
    let lastOn = -Infinity
    for (let x = 0; x < width; x += 1) {
      if (mask[rowStart + x]) lastOn = x
      if (x - lastOn <= r) rows[rowStart + x] = 1
    }
    lastOn = Infinity
    for (let x = width - 1; x >= 0; x -= 1) {
      if (mask[rowStart + x]) lastOn = x
      if (lastOn - x <= r) rows[rowStart + x] = 1
    }
  }
  const out = new Uint8Array(mask.length)
  for (let x = 0; x < width; x += 1) {
    let lastOn = -Infinity
    for (let y = 0; y < height; y += 1) {
      if (rows[y * width + x]) lastOn = y
      if (y - lastOn <= r) out[y * width + x] = 1
    }
    lastOn = Infinity
    for (let y = height - 1; y >= 0; y -= 1) {
      if (rows[y * width + x]) lastOn = y
      if (lastOn - y <= r) out[y * width + x] = 1
    }
  }
  return out
}

/** false — под маской уже лежит ровно этот непрозрачный цвет. */
export function maskChangesColor(
  rgba: Uint8ClampedArray,
  mask: PixelMask,
  rgb: readonly [number, number, number],
): boolean {
  for (let index = 0; index < mask.length; index += 1) {
    if (!mask[index]) continue
    const offset = index * 4
    if (
      rgba[offset] !== rgb[0] ||
      rgba[offset + 1] !== rgb[1] ||
      rgba[offset + 2] !== rgb[2] ||
      rgba[offset + 3] !== 255
    ) {
      return true
    }
  }
  return false
}

/** Кладёт непрозрачный цвет в слой краски только там, где маска = 1. */
export function paintMask(
  rgba: Uint8ClampedArray,
  mask: PixelMask,
  rgb: readonly [number, number, number],
): void {
  for (let index = 0; index < mask.length; index += 1) {
    if (!mask[index]) continue
    const offset = index * 4
    rgba[offset] = rgb[0]
    rgba[offset + 1] = rgb[1]
    rgba[offset + 2] = rgb[2]
    rgba[offset + 3] = 255
  }
}
