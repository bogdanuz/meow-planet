import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite } from './knockout-white.mjs'

const src = path.resolve(
  import.meta.dirname,
  '..',
  'assets-master',
  'games',
  'sound-world',
  'piano-keys-sheet.jpg',
)
const play = path.resolve(import.meta.dirname, '..', 'public', 'assets', 'games', 'sound-world', 'play')

const { data, info } = await sharp(src).rotate().ensureAlpha().raw().toBuffer({
  resolveWithObject: true,
})
const rgba = new Uint8Array(data)
const { width: w, height: h } = info
knockOutEdgeWhite(rgba, w, h, 12)

const col = Array(w).fill(0)
for (let y = 0; y < h; y += 1) {
  for (let x = 0; x < w; x += 1) {
    if (rgba[(y * w + x) * 4 + 3] > 40) col[x] += 1
  }
}
const ink = []
for (let x = 0; x < w; x += 1) if (col[x] > 10) ink.push(x)
const islands = []
let s = ink[0]
let p = ink[0]
for (const x of ink.slice(1)) {
  if (x > p + 8) {
    islands.push([s, p])
    s = x
  }
  p = x
}
islands.push([s, p])
const widths = islands.map((r) => r[1] - r[0] + 1)
const single = Math.min(...widths)
const counts = widths.map((ww) => Math.max(1, Math.round(ww / single)))
console.log({ islands, widths, counts })

const cuts = []
for (let i = 0; i < islands.length; i += 1) {
  const [a, b] = islands[i]
  const n = counts[i]
  const span = b - a + 1
  for (let k = 0; k < n; k += 1) {
    const x0 = a + Math.round((span * k) / n)
    const x1 = a + Math.round((span * (k + 1)) / n) - 1
    cuts.push([x0, x1])
  }
}
if (cuts.length !== 7) throw new Error(`cuts ${cuts.length}`)

for (let i = 0; i < 7; i += 1) {
  const [x0, x1] = cuts[i]
  let minY = h
  let maxY = 0
  for (let x = x0; x <= x1; x += 1) {
    for (let y = 0; y < h; y += 1) {
      if (rgba[(y * w + x) * 4 + 3] < 40) continue
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  const pad = 2
  const cx0 = Math.max(0, x0 - pad)
  const cy0 = Math.max(0, minY - pad)
  const cw = Math.min(w - 1, x1 + pad) - cx0 + 1
  const ch = Math.min(h - 1, maxY + pad) - cy0 + 1
  const out = Buffer.alloc(cw * ch * 4)
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      const si = ((cy0 + y) * w + (cx0 + x)) * 4
      const oi = (y * cw + x) * 4
      out.set(rgba.subarray(si, si + 4), oi)
    }
  }
  await sharp(out, { raw: { width: cw, height: ch, channels: 4 } })
    .png()
    .toFile(path.join(play, `key-${i + 1}.png`))
  console.log(`key-${i + 1}`, cw, ch)
}
