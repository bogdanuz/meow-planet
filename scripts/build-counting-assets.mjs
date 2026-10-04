/**
 * Мастера «Учимся считать» → public/assets/games/counting/
 * Запуск: npm run assets:counting
 *
 * assets-master/games/counting/counting-bg.jpg (4:3) → counting-bg.webp 2048×1536.
 * assets-master/games/counting/counting-digits.jpg (5×2 на белом: 1–5, 6–10) → digits/<n>.png.
 * Цифра — все пятна краски в своей клетке сетки 5×2 (у «10» их два); белый вокруг и в дырках убирается.
 * Промпты — `docs/assets/counting-ART.md`.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite } from './knockout-white.mjs'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-master', 'games', 'counting')
const outDir = path.join(root, 'public', 'assets', 'games', 'counting')

const COLS = 5
const ROWS = 2
const DIGIT_MAX_H = 256
const INK_BELOW = 236

await mkdir(path.join(outDir, 'digits'), { recursive: true })

await sharp(path.join(srcDir, 'counting-bg.jpg'))
  .rotate()
  .resize(2048, 1536, { fit: 'cover', kernel: 'lanczos3' })
  .webp({ quality: 86 })
  .toFile(path.join(outDir, 'counting-bg.webp'))
console.log('counting-bg.webp')

const { data, info } = await sharp(path.join(srcDir, 'counting-digits.jpg'))
  .rotate()
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
const { width: w, height: h } = info
const cellW = w / COLS
const cellH = h / ROWS

/** Дырки (у 4, 6, 8, 9, 0): чисто-белые островки внутри цифры. */
function punchHoles(rgba, bw, bh) {
  const seen = new Uint8Array(bw * bh)
  const pureWhite = (i) => {
    const o = i * 4
    const mn = Math.min(rgba[o], rgba[o + 1], rgba[o + 2])
    const mx = Math.max(rgba[o], rgba[o + 1], rgba[o + 2])
    return rgba[o + 3] > 0 && mn >= 244 && mx - mn <= 10
  }
  for (let start = 0; start < bw * bh; start++) {
    if (seen[start] || !pureWhite(start)) continue
    const pixels = []
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const p = stack.pop()
      pixels.push(p)
      const x = p % bw
      for (const q of [p - 1, p + 1, p - bw, p + bw]) {
        if (q < 0 || q >= bw * bh || seen[q] || !pureWhite(q)) continue
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === bw - 1)) continue
        seen[q] = 1
        stack.push(q)
      }
    }
    if (pixels.length >= 30) for (const p of pixels) rgba[p * 4 + 3] = 0
  }
}

/** Пятна краски (4-связность) с рамкой и центром. */
function findBlobs() {
  const label = new Int32Array(w * h)
  const isInk = (i) => Math.min(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) < INK_BELOW
  const blobs = []
  for (let start = 0; start < w * h; start++) {
    if (label[start] || !isInk(start)) continue
    const id = blobs.length + 1
    let bx0 = w, by0 = h, bx1 = 0, by1 = 0, area = 0
    const stack = [start]
    label[start] = id
    while (stack.length) {
      const p = stack.pop()
      const x = p % w
      const y = (p / w) | 0
      area++
      if (x < bx0) bx0 = x
      if (x > bx1) bx1 = x
      if (y < by0) by0 = y
      if (y > by1) by1 = y
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h || label[q] || !isInk(q)) continue
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue
        label[q] = id
        stack.push(q)
      }
    }
    blobs.push({ x0: bx0, y0: by0, x1: bx1, y1: by1, area })
  }
  return blobs.filter((b) => b.area >= 300)
}

/** Клетка сетки по центру пятна: «1» от «10» может заходить в клетку «9», но центр — в своей. */
const cells = Array.from({ length: COLS * ROWS }, () => [])
for (const b of findBlobs()) {
  const col = Math.min(COLS - 1, Math.floor((b.x0 + b.x1) / 2 / cellW))
  const row = Math.min(ROWS - 1, Math.floor((b.y0 + b.y1) / 2 / cellH))
  cells[row * COLS + col].push(b)
}

for (let n = 1; n <= COLS * ROWS; n++) {
  const parts = cells[n - 1]
  if (!parts.length) throw new Error(`цифра ${n}: клетка пустая`)
  const pad = 4
  const x0 = Math.max(0, Math.min(...parts.map((b) => b.x0)) - pad)
  const y0 = Math.max(0, Math.min(...parts.map((b) => b.y0)) - pad)
  const bw = Math.min(w, Math.max(...parts.map((b) => b.x1)) + pad + 1) - x0
  const bh = Math.min(h, Math.max(...parts.map((b) => b.y1)) + pad + 1) - y0
  const rgba = new Uint8Array(bw * bh * 4)
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const s = ((y0 + y) * w + x0 + x) * 3
      const o = (y * bw + x) * 4
      rgba[o] = data[s]
      rgba[o + 1] = data[s + 1]
      rgba[o + 2] = data[s + 2]
      rgba[o + 3] = 255
    }
  }
  knockOutEdgeWhite(rgba, bw, bh, 22)
  punchHoles(rgba, bw, bh)
  const out = path.join(outDir, 'digits', `${n}.png`)
  await sharp(Buffer.from(rgba), { raw: { width: bw, height: bh, channels: 4 } })
    .trim()
    .resize({ height: DIGIT_MAX_H, kernel: 'lanczos3' })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(out)
  const meta = await sharp(out).metadata()
  console.log(`digits/${n}.png ${meta.width}×${meta.height}`)
}
