/**
 * Мастера balloon-pop → public/assets/games/balloon-pop/
 * Запуск: node scripts/build-balloon-pop-assets.mjs
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite, punchNearWhiteBand } from './knockout-white.mjs'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-master', 'games', 'balloon-pop')
const outDir = path.join(root, 'public', 'assets', 'games', 'balloon-pop')

const SKY_W = 2400
const SKY_H = 1792

/** Голубой лист ведущего (~#D3EDFA). */
const MEOW_BG = [211, 237, 250]
const KEY_FLOOD = 34
const KEY_EDGE = 56
const ALPHA_BLUR = 1.1

function isKeyBg(r, g, b) {
  if (distToBg(r, g, b) <= KEY_FLOOD) return true
  if (r >= 246 && g >= 246 && b >= 246) return true
  return false
}

const BALLOONS = [
  ['red', 0, 0],
  ['orange', 1, 0],
  ['yellow', 2, 0],
  ['green', 0, 1],
  ['violet', 1, 1],
]

const MEOW = [
  ['happy', 0],
  ['idle', 1],
  ['miss', 2],
]

function distToBg(r, g, b) {
  return Math.hypot(r - MEOW_BG[0], g - MEOW_BG[1], b - MEOW_BG[2])
}

function clampByte(n) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function keyAlpha(rgba, width, height) {
  const n = width * height
  const isBg = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    if (isKeyBg(rgba[o], rgba[o + 1], rgba[o + 2])) isBg[i] = 1
  }
  const seen = new Uint8Array(n)
  const queue = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const idx = y * width + x
    if (seen[idx] || !isBg[idx]) return
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
      const touchesHole =
        rgba[(idx - 1) * 4 + 3] === 0 ||
        rgba[(idx + 1) * 4 + 3] === 0 ||
        rgba[(idx - width) * 4 + 3] === 0 ||
        rgba[(idx + width) * 4 + 3] === 0
      if (!touchesHole) continue
      const d = distToBg(rgba[o], rgba[o + 1], rgba[o + 2])
      if (d >= KEY_EDGE) continue
      const a = Math.round(((d - KEY_FLOOD) / (KEY_EDGE - KEY_FLOOD)) * 255)
      rgba[o + 3] = clampByte(a)
      if (a > 0 && a < 255) {
        const af = a / 255
        rgba[o] = clampByte((rgba[o] - MEOW_BG[0] * (1 - af)) / af)
        rgba[o + 1] = clampByte((rgba[o + 1] - MEOW_BG[1] * (1 - af)) / af)
        rgba[o + 2] = clampByte((rgba[o + 2] - MEOW_BG[2] * (1 - af)) / af)
      }
    }
  }
  const alpha = Buffer.alloc(n)
  for (let i = 0; i < n; i++) alpha[i] = rgba[i * 4 + 3]
  return alpha
}

async function blurAlpha(alpha, width, height) {
  const blurred = await sharp(alpha, {
    raw: { width, height, channels: 1 },
  })
    .greyscale()
    .blur(ALPHA_BLUR)
    .raw()
    .toBuffer()
  return blurred
}

function applyAlpha(rgba, alpha) {
  for (let i = 0; i < alpha.length; i++) rgba[i * 4 + 3] = alpha[i]
}

await mkdir(outDir, { recursive: true })

const skySrc = path.join(srcDir, 'balloon-pop-sky.jpg')
const skyOut = path.join(outDir, 'balloon-sky-bg.webp')
await sharp(skySrc)
  .rotate()
  .resize(SKY_W, SKY_H, { fit: 'cover' })
  .webp({ quality: 82 })
  .toFile(skyOut)
const skyMeta = await sharp(skyOut).metadata()
console.log(`balloon-sky-bg.webp ${skyMeta.width}x${skyMeta.height}`)

const balloonSrc = path.join(srcDir, 'balloon-pop-balloons-sheet.png')
const balloonMeta = await sharp(balloonSrc).rotate().metadata()
const bw = balloonMeta.width
const bh = balloonMeta.height
if (!bw || !bh) throw new Error('balloon sheet has no size')
const cellW = Math.floor(bw / 3)
const cellH = Math.floor(bh / 2)
const inset = 8

for (const [color, col, row] of BALLOONS) {
  const left = col * cellW + inset
  const top = row * cellH + inset
  const width = (col === 2 ? bw : (col + 1) * cellW) - left - inset
  const height = (row === 1 ? bh : (row + 1) * cellH) - top - inset
  const out = path.join(outDir, `balloon-${color}.png`)
  const extracted = await sharp(balloonSrc)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rgba = new Uint8Array(extracted.data)
  const ew = extracted.info.width
  const eh = extracted.info.height
  knockOutEdgeWhite(rgba, ew, eh, 16)
  punchNearWhiteBand(rgba, ew, eh)
  const trimmed = await sharp(Buffer.from(rgba), {
    raw: { width: ew, height: eh, channels: 4 },
  })
    .trim({ threshold: 8 })
    .resize(512, 640, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const outRgba = new Uint8Array(trimmed.data)
  punchNearWhiteBand(outRgba, trimmed.info.width, trimmed.info.height, {
    minYRatio: 0.55,
    minLum: 208,
    chroma: 42,
  })
  await sharp(Buffer.from(outRgba), {
    raw: { width: trimmed.info.width, height: trimmed.info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(out)
  const meta = await sharp(out).metadata()
  console.log(`balloon-${color}.png ${meta.width}x${meta.height}`)
}

const meowSrc = path.join(srcDir, 'balloon-pop-meow-presenter-sheet.jpg')
const meowMeta = await sharp(meowSrc).rotate().metadata()
const mw = meowMeta.width
const mh = meowMeta.height
if (!mw || !mh) throw new Error('meow sheet has no size')
const meowCellW = Math.floor(mw / 3)
const cropX = 18
const cropY = 8

for (const [pose, col] of MEOW) {
  const extracted = await sharp(meowSrc)
    .rotate()
    .extract({
      left: col * meowCellW + cropX,
      top: cropY,
      width: meowCellW - cropX * 2,
      height: mh - cropY * 2,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rgba = Buffer.from(extracted.data)
  const w = extracted.info.width
  const h = extracted.info.height
  const alpha = await blurAlpha(keyAlpha(rgba, w, h), w, h)
  applyAlpha(rgba, alpha)
  const out = path.join(outDir, `meow-presenter-${pose}.png`)
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 28 })
    .resize(640, 720, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(out)
  const meta = await sharp(out).metadata()
  console.log(`meow-presenter-${pose}.png ${meta.width}x${meta.height}`)
}
