/**
 * 2×2 лист поз → 6 кадров танца Мяу для меню.
 * Запуск: node scripts/build-menu-meow-dance.mjs
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const srcPath = path.join(root, 'assets-master', 'mascot', 'menu-meow-dance-sheet.jpg')
const masterDir = path.join(root, 'assets-master', 'mascot', 'menu-dance')
const publicDir = path.join(root, 'public', 'assets', 'mascot', 'menu-dance')

const BG = [214, 238, 248]
/** Фон, соединённый с краем кадра. Шерсть внутри контура не трогаем. */
const KEY_FLOOD = 22
const KEY_EDGE = 40
const CROP = 16
const ALPHA_BLUR = 1.1

const cells = [
  ['neutral', 0, 0],
  ['half_lean', 1, 0],
  ['peak_lean', 0, 1],
  ['clap', 1, 1],
]

function distToBg(r, g, b) {
  return Math.hypot(r - BG[0], g - BG[1], b - BG[2])
}

function keyAlpha(rgba, width, height) {
  const n = width * height
  const isBg = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    if (distToBg(rgba[o], rgba[o + 1], rgba[o + 2]) <= KEY_FLOOD) isBg[i] = 1
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
        rgba[((idx - 1) * 4) + 3] === 0 ||
        rgba[((idx + 1) * 4) + 3] === 0 ||
        rgba[((idx - width) * 4) + 3] === 0 ||
        rgba[((idx + width) * 4) + 3] === 0
      if (!touchesHole) continue
      const d = distToBg(rgba[o], rgba[o + 1], rgba[o + 2])
      if (d >= KEY_EDGE) continue
      const a = Math.round(((d - KEY_FLOOD) / (KEY_EDGE - KEY_FLOOD)) * 255)
      rgba[o + 3] = clampByte(a)
      if (a > 0 && a < 255) {
        const af = a / 255
        rgba[o] = clampByte((rgba[o] - BG[0] * (1 - af)) / af)
        rgba[o + 1] = clampByte((rgba[o + 1] - BG[1] * (1 - af)) / af)
        rgba[o + 2] = clampByte((rgba[o + 2] - BG[2] * (1 - af)) / af)
      }
    }
  }
  const alpha = Buffer.alloc(n)
  for (let i = 0; i < n; i++) alpha[i] = rgba[i * 4 + 3]
  return alpha
}

function clampByte(n) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

async function blurAlpha(alpha, width, height) {
  const blurred = await sharp(alpha, {
    raw: { width, height, channels: 1 },
  })
    .greyscale()
    .blur(ALPHA_BLUR)
    .raw()
    .toBuffer()
  if (blurred.length !== width * height) {
    throw new Error(`Alpha blur size ${blurred.length}, expected ${width * height}`)
  }
  return blurred
}

function applyAlpha(rgba, alpha) {
  for (let i = 0; i < alpha.length; i++) rgba[i * 4 + 3] = alpha[i]
}

function footBottom(rgba, width, height) {
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] > 40) return y
    }
  }
  return height - 1
}

function contentBox(rgba, width, height) {
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] > 20) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  return { minX, minY, maxX, maxY }
}

async function pngFromRgba(rgba, width, height) {
  return sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer()
}

const sheet = sharp(srcPath).rotate()
const meta = await sheet.metadata()
const width = meta.width
const height = meta.height
if (!width || !height || width !== height) {
  throw new Error(`Expected a square sheet, got ${width}x${height}`)
}
const cellW = width / 2
const cellH = height / 2

await mkdir(masterDir, { recursive: true })
await mkdir(publicDir, { recursive: true })

const keyed = []
for (const [name, col, row] of cells) {
  const extracted = await sharp(srcPath)
    .rotate()
    .extract({
      left: col * cellW + CROP,
      top: row * cellH + CROP,
      width: cellW - CROP * 2,
      height: cellH - CROP * 2,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rgba = Buffer.from(extracted.data)
  const w = extracted.info.width
  const h = extracted.info.height
  const alpha = await blurAlpha(keyAlpha(rgba, w, h), w, h)
  applyAlpha(rgba, alpha)
  const buf = await pngFromRgba(rgba, w, h)
  await sharp(buf).toFile(path.join(masterDir, `${name}.png`))
  const rgbaOut = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  keyed.push({
    name,
    rgba: Buffer.from(rgbaOut.data),
    width: rgbaOut.info.width,
    height: rgbaOut.info.height,
  })
  await sharp(buf).toFile(path.join(masterDir, `${name}_rgba.png`))
}

async function flipBuffer(rgba, w, h) {
  const buf = await pngFromRgba(rgba, w, h)
  const flipped = await sharp(buf).flop().ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return {
    rgba: Buffer.from(flipped.data),
    width: flipped.info.width,
    height: flipped.info.height,
  }
}

const leftSet = []
for (const frame of keyed) {
  const flipped = await flipBuffer(frame.rgba, frame.width, frame.height)
  await sharp(await pngFromRgba(flipped.rgba, flipped.width, flipped.height)).toFile(
    path.join(masterDir, `${frame.name}_L.png`),
  )
  leftSet.push({ name: frame.name, ...flipped })
}

const byName = Object.fromEntries(leftSet.map((f) => [f.name, f]))
const halfR = await flipBuffer(byName.half_lean.rgba, byName.half_lean.width, byName.half_lean.height)
const peakR = await flipBuffer(byName.peak_lean.rgba, byName.peak_lean.width, byName.peak_lean.height)
await sharp(await pngFromRgba(halfR.rgba, halfR.width, halfR.height)).toFile(
  path.join(masterDir, 'half_lean_R.png'),
)
await sharp(await pngFromRgba(peakR.rgba, peakR.width, peakR.height)).toFile(
  path.join(masterDir, 'peak_lean_R.png'),
)

const sequence = [
  ['frame_01', byName.neutral],
  ['frame_02', byName.half_lean],
  ['frame_03', byName.peak_lean],
  ['frame_04', byName.clap],
  ['frame_05', { name: 'peak_lean_R', ...peakR }],
  ['frame_06', { name: 'half_lean_R', ...halfR }],
]

const feet = sequence.map(([, f]) => footBottom(f.rgba, f.width, f.height))
const boxes = sequence.map(([, f]) => contentBox(f.rgba, f.width, f.height))
const pad = 8
let canvasW = 0
let aboveFoot = 0
for (let i = 0; i < sequence.length; i++) {
  const box = boxes[i]
  canvasW = Math.max(canvasW, box.maxX - box.minX + 1)
  aboveFoot = Math.max(aboveFoot, feet[i] - box.minY)
}
canvasW += pad * 2
const canvasH = aboveFoot + pad * 2

const aligned = []
for (let i = 0; i < sequence.length; i++) {
  const [id, frame] = sequence[i]
  const box = boxes[i]
  const out = Buffer.alloc(canvasW * canvasH * 4)
  const destFoot = canvasH - pad - 1
  const shiftY = destFoot - feet[i]
  const shiftX = Math.round((canvasW - (box.maxX - box.minX + 1)) / 2) - box.minX
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const dy = y + shiftY
      const dx = x + shiftX
      if (dx < 0 || dy < 0 || dx >= canvasW || dy >= canvasH) continue
      const src = (y * frame.width + x) * 4
      if (frame.rgba[src + 3] === 0) continue
      const dst = (dy * canvasW + dx) * 4
      out[dst] = frame.rgba[src]
      out[dst + 1] = frame.rgba[src + 1]
      out[dst + 2] = frame.rgba[src + 2]
      out[dst + 3] = frame.rgba[src + 3]
    }
  }
  const buf = await pngFromRgba(out, canvasW, canvasH)
  await sharp(buf).toFile(path.join(publicDir, `${id}.png`))
  await sharp(buf).toFile(path.join(masterDir, `${id}.png`))
  aligned.push(buf)
  console.log(
    id,
    'foot was',
    feet[i],
    'shiftY',
    shiftY,
    'content top',
    boxes[i].minY,
  )
}

const sheetBuf = await sharp({
  create: {
    width: canvasW * 6,
    height: canvasH,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(aligned.map((input, index) => ({ input, left: index * canvasW, top: 0 })))
  .png()
  .toBuffer()
// Лист и превью — только для просмотра; в public/ (и в offline-кэш) не кладём.
await sharp(sheetBuf).toFile(path.join(masterDir, 'menu-meow-dance-sheet.png'))

const order = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1]
await sharp(order.map((index) => aligned[index]), { join: { animated: true } })
  .webp({ loop: 0, delay: order.map(() => 180) })
  .toFile(path.join(masterDir, 'menu-meow-dance-preview.webp'))


console.log('canvas', canvasW, canvasH)
console.log('feet before align', feet.join(', '))
