import sharp from 'sharp'
import path from 'node:path'

const file = path.resolve(
  import.meta.dirname,
  '..',
  'public/assets/games/sound-world/play/piano.png',
)
const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: w, height: h } = info
let minX = w
let minY = h
let maxX = 0
let maxY = 0
for (let y = 0; y < h; y += 1) {
  for (let x = 0; x < w; x += 1) {
    if (data[(y * w + x) * 4 + 3] < 20) continue
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
}
console.log({ w, h, minX, minY, maxX, maxY, left: minX / w, top: minY / h, right: maxX / w, bottom: maxY / h })

// sample brightness along a horizontal line through the keys to find key gaps
const yMid = Math.floor(h * 0.52)
const row = []
for (let x = 0; x < w; x += 8) {
  const i = (yMid * w + x) * 4
  row.push({ x: +(x / w).toFixed(3), r: data[i], a: data[i + 3] })
}
console.log('row', row.filter((p) => p.a > 20).slice(0, 40))
