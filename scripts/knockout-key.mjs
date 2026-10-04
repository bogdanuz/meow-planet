/** Фон цвета `key` → прозрачный (flood от краёв) с мягкой кромкой. */
export function knockOutKey(rgba, width, height, key, flood = 34, edge = 60) {
  const dist = (o) => Math.hypot(rgba[o] - key[0], rgba[o + 1] - key[1], rgba[o + 2] - key[2])
  const seen = new Uint8Array(width * height)
  const queue = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const idx = y * width + x
    if (seen[idx] || dist(idx * 4) > flood) return
    seen[idx] = 1
    queue.push(idx)
  }
  for (let x = 0; x < width; x++) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    push(0, y)
    push(width - 1, y)
  }
  while (queue.length) {
    const idx = queue.pop()
    rgba[idx * 4 + 3] = 0
    const x = idx % width
    const y = (idx / width) | 0
    push(x - 1, y)
    push(x + 1, y)
    push(x, y - 1)
    push(x, y + 1)
  }
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const o = idx * 4
      if (rgba[o + 3] === 0) continue
      const touches =
        rgba[o - 4 + 3] === 0 || rgba[o + 4 + 3] === 0 || rgba[o - width * 4 + 3] === 0 || rgba[o + width * 4 + 3] === 0
      if (!touches) continue
      const d = dist(o)
      if (d < edge) rgba[o + 3] = Math.max(0, Math.min(255, Math.round(((d - flood) / (edge - flood)) * 255)))
    }
  }
}
