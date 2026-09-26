import sharp from 'sharp'
import path from 'node:path'

const file = path.resolve(import.meta.dirname, '..', 'public/assets/games/sound-world/play/piano.png')
const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: w, height: h } = info

function lum(x, y) {
  const i = (y * w + x) * 4
  return (data[i] + data[i + 1] + data[i + 2]) / 3
}

function isWhite(x, y) {
  const i = (y * w + x) * 4
  if (data[i + 3] < 20) return false
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  return r > 220 && g > 210 && b > 190 && r - b < 50
}

for (const yf of [0.36, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.74]) {
  const y = Math.floor(h * yf)
  let first = -1
  let last = -1
  const gaps = []
  let prevWhite = false
  for (let x = 0; x < w; x += 1) {
    const wte = isWhite(x, y)
    if (wte && first < 0) first = x
    if (wte) last = x
    if (prevWhite && !wte) gaps.push(+(x / w).toFixed(3))
    prevWhite = wte
  }
  console.log(yf, { first: +(first / w).toFixed(3), last: +(last / w).toFixed(3), gaps: gaps.filter((g) => g > 0.1 && g < 0.9) })
}
