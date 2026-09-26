/**
 * Прозрачность: flood-fill от краёв для почти белого (#FFFFFF) фона экспорта.
 */
export function knockOutEdgeWhite(rgba, width, height, tolerance = 14) {
  const isBg = (byteIndex) => {
    const r = rgba[byteIndex]
    const g = rgba[byteIndex + 1]
    const b = rgba[byteIndex + 2]
    return (
      r >= 255 - tolerance &&
      g >= 255 - tolerance &&
      b >= 255 - tolerance
    )
  }

  const visited = new Uint8Array(width * height)
  const queue = []

  const trySeed = (px, py) => {
    const idx = py * width + px
    if (visited[idx]) return
    const bi = idx * 4
    if (!isBg(bi)) return
    visited[idx] = 1
    queue.push(idx)
  }

  for (let x = 0; x < width; x++) {
    trySeed(x, 0)
    trySeed(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    trySeed(0, y)
    trySeed(width - 1, y)
  }

  while (queue.length > 0) {
    const idx = queue.pop()
    const bi = idx * 4
    rgba[bi + 3] = 0
    const x = idx % width
    const y = (idx / width) | 0
    if (x > 0) tryPush(x - 1, y)
    if (x + 1 < width) tryPush(x + 1, y)
    if (y > 0) tryPush(x, y - 1)
    if (y + 1 < height) tryPush(x, y + 1)
  }

  function tryPush(px, py) {
    const idx = py * width + px
    if (visited[idx]) return
    const bi = idx * 4
    if (!isBg(bi)) return
    visited[idx] = 1
    queue.push(idx)
  }
}

/** Белые «островки» внутри завитка нитки — flood с края их не берёт. */
export function punchNearWhiteBand(
  rgba,
  width,
  height,
  { minYRatio = 0.62, minAlpha = 40, minLum = 214, chroma = 36 } = {},
) {
  const startY = Math.floor(height * minYRatio)
  for (let y = startY; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const o = (y * width + x) * 4
      if (rgba[o + 3] < minAlpha) continue
      const minc = Math.min(rgba[o], rgba[o + 1], rgba[o + 2])
      const maxc = Math.max(rgba[o], rgba[o + 1], rgba[o + 2])
      if (minc >= minLum && maxc - minc <= chroma) {
        rgba[o + 3] = 0
      }
    }
  }
}
