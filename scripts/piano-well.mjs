import sharp from 'sharp'
import path from 'node:path'
import { readdir } from 'node:fs/promises'

const play = path.resolve(import.meta.dirname, '..', 'public', 'assets', 'games', 'sound-world', 'play')
console.log((await readdir(play)).filter((f) => f.startsWith('key') || f.includes('piano') || f.includes('drum') || f === 'bell.png'))

const { data, info } = await sharp(path.join(play, 'piano-body.png')).ensureAlpha().raw().toBuffer({
  resolveWithObject: true,
})
const { width: w, height: h } = info
const rgba = data

function isWell(x, y) {
  const o = (y * w + x) * 4
  if (rgba[o + 3] < 40) return false
  const r = rgba[o]
  const g = rgba[o + 1]
  const b = rgba[o + 2]
  return r > 120 && r < 210 && g > 70 && g < 160 && b < 110 && r - b > 40 && r > g
}

let minX = w
let minY = h
let maxX = 0
let maxY = 0
let count = 0
for (let y = Math.floor(h * 0.25); y < Math.floor(h * 0.85); y += 1) {
  for (let x = Math.floor(w * 0.05); x < Math.floor(w * 0.95); x += 1) {
    if (!isWell(x, y)) continue
    count += 1
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
}
console.log({ w, h, count, minX, minY, maxX, maxY, x: minX / w, y: minY / h, ww: (maxX - minX) / w, hh: (maxY - minY) / h })
