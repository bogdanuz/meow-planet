import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite } from './knockout-white.mjs'

const SOURCE = 'assets-master/games/creative/tool-icons.jpg'
const OUT_DIR = 'public/assets/games/creative/icons'
const NAMES = [
  'undo',
  'sheet',
  'palette',
  'pictures',
  'brush',
  'marker',
  'crayon',
  'watercolor',
  'bucket',
  'eraser',
  'thin',
  'thick',
  'background',
  'themes',
  'gallery',
  'more',
]

const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height } = info
const rgba = new Uint8Array(data)
const mask = new Uint8Array(width * height)
for (let i = 0; i < width * height; i += 1) {
  const o = i * 4
  const nearWhite = rgba[o] >= 248 && rgba[o + 1] >= 248 && rgba[o + 2] >= 248
  mask[i] = nearWhite ? 0 : 1
}

function spans(count) {
  const found = []
  let start = -1
  for (let i = 0; i < count.length; i += 1) {
    if (count[i] > 0 && start < 0) start = i
    if ((count[i] === 0 || i === count.length - 1) && start >= 0) {
      const end = count[i] === 0 ? i - 1 : i
      found.push([start, end])
      start = -1
    }
  }
  return found
}

function mergeTo(bands, target) {
  const next = bands.map((band) => [...band])
  while (next.length > target) {
    let best = 0
    let gap = Infinity
    for (let i = 0; i < next.length - 1; i += 1) {
      const size = next[i + 1][0] - next[i][1]
      if (size < gap) {
        gap = size
        best = i
      }
    }
    next.splice(best, 2, [next[best][0], next[best + 1][1]])
  }
  return next
}

const rowCount = new Array(height).fill(0)
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) rowCount[y] += mask[y * width + x]
}
const rows = mergeTo(spans(rowCount).filter((band) => band[1] - band[0] > 8), 4)
if (rows.length !== 4) throw new Error(`expected 4 rows, got ${rows.length}`)

const cells = []
for (const [y0, y1] of rows) {
  const colCount = new Array(width).fill(0)
  for (let y = y0; y <= y1; y += 1) {
    for (let x = 0; x < width; x += 1) colCount[x] += mask[y * width + x]
  }
  const cols = mergeTo(spans(colCount).filter((band) => band[1] - band[0] > 4), 4)
  if (cols.length !== 4) throw new Error(`expected 4 columns, got ${cols.length}`)
  for (const [x0, x1] of cols) cells.push({ x0, y0, x1, y1 })
}

await mkdir(OUT_DIR, { recursive: true })
for (let index = 0; index < NAMES.length; index += 1) {
  const cell = cells[index]
  const pad = 8
  const left = Math.max(0, cell.x0 - pad)
  const top = Math.max(0, cell.y0 - pad)
  const cropWidth = Math.min(width - left, cell.x1 - cell.x0 + 1 + pad * 2)
  const cropHeight = Math.min(height - top, cell.y1 - cell.y0 + 1 + pad * 2)
  const crop = await sharp(SOURCE)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const pixels = new Uint8Array(crop.data)
  knockOutEdgeWhite(pixels, crop.info.width, crop.info.height, 10)
  const file = path.join(OUT_DIR, `${NAMES[index]}.png`)
  const trimmed = await sharp(Buffer.from(pixels), {
    raw: { width: crop.info.width, height: crop.info.height, channels: 4 },
  })
    .trim({ threshold: 1 })
    .resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(file, trimmed)
  console.log(NAMES[index], cropWidth, cropHeight, trimmed.length)
}
