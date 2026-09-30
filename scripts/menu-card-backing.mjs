/**
 * Накладывает 3D-подложку соседних плиток меню (ободок + блик)
 * на карточку, у которой есть только плоский скруглённый фон.
 */
export function applyMenuCardBacking(artRgba, templateRgba, width, height) {
  const outsideAlpha = 24
  const rim = 54
  const fade = 16
  const n = width * height
  const dist = new Float32Array(n)
  dist.fill(1e6)
  const queue = new Int32Array(n)
  let head = 0
  let tail = 0

  const seed = (i) => {
    if (dist[i] === 0) return
    dist[i] = 0
    queue[tail] = i
    tail += 1
  }

  for (let i = 0; i < n; i += 1) {
    if (templateRgba[i * 4 + 3] <= outsideAlpha) seed(i)
  }
  for (let x = 0; x < width; x += 1) {
    seed(x)
    seed((height - 1) * width + x)
  }
  for (let y = 0; y < height; y += 1) {
    seed(y * width)
    seed(y * width + width - 1)
  }

  while (head < tail) {
    const i = queue[head]
    head += 1
    const x = i % width
    const y = (i / width) | 0
    const next = dist[i] + 1
    const visit = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) return
      const j = ny * width + nx
      if (next >= dist[j]) return
      dist[j] = next
      queue[tail] = j
      tail += 1
    }
    visit(x - 1, y)
    visit(x + 1, y)
    visit(x, y - 1)
    visit(x, y + 1)
  }

  const out = new Uint8Array(artRgba)
  for (let i = 0; i < n; i += 1) {
    const t = i * 4
    if (templateRgba[t + 3] <= outsideAlpha) {
      out[t + 3] = 0
      continue
    }

    const d = dist[i]
    const tr = templateRgba[t]
    const tg = templateRgba[t + 1]
    const tb = templateRgba[t + 2]
    const chroma = Math.max(tr, tg, tb) - Math.min(tr, tg, tb)
    const x = i % width
    const y = (i / width) | 0
    const ar = out[t]
    const ag = out[t + 1]
    const ab = out[t + 2]
    const artChroma = Math.max(ar, ag, ab) - Math.min(ar, ag, ab)
    const artCream = artChroma < 40 && Math.min(ar, ag, ab) > 180
    const gloss =
      artCream &&
      x < width * 0.4 &&
      y < height * 0.36 &&
      chroma < 26 &&
      Math.min(tr, tg, tb) > 232
    let mix = 0
    if (d <= rim) mix = 1
    else if (d < rim + fade) mix = 1 - (d - rim) / fade
    if (gloss) mix = Math.max(mix, 0.78)

    if (mix > 0 && artChroma > 55 && d > 10) mix = 0
    if (mix <= 0) continue
    out[t] = Math.round(out[t] + (tr - out[t]) * mix)
    out[t + 1] = Math.round(out[t + 1] + (tg - out[t + 1]) * mix)
    out[t + 2] = Math.round(out[t + 2] + (tb - out[t + 2]) * mix)
    out[t + 3] = Math.round(out[t + 3] + (templateRgba[t + 3] - out[t + 3]) * mix)
  }
  return out
}

export async function compositeMenuCardBacking(sharp, artInput, templateInput, outputPath) {
  const size = 1024
  const art = await sharp(artInput)
    .rotate()
    .trim({
      threshold: 8,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const template = await sharp(templateInput)
    .rotate()
    .resize(size, size, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rgba = applyMenuCardBacking(
    new Uint8Array(art.data),
    new Uint8Array(template.data),
    size,
    size,
  )

  await sharp(Buffer.from(rgba), {
    raw: { width: size, height: size, channels: 4 },
  })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outputPath)
}
