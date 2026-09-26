/**
 * assets-master/games/sound-world/*.jpg → public/assets/games/sound-world/
 * Запуск: node scripts/build-sound-world-assets.mjs
 */
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite, punchNearWhiteBand } from './knockout-white.mjs'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-master', 'games', 'sound-world')
const outDir = path.join(root, 'public', 'assets', 'games', 'sound-world')

const CARD_IDS = [
  'cat',
  'dog',
  'cow',
  'horse',
  'pig',
  'hen',
  'rooster',
  'duck',
  'goose',
  'sheep',
  'bear',
  'wolf',
  'lion',
  'elephant',
  'monkey',
  'owl',
  'whale',
  'seal',
  'car',
  'train',
  'ambulance',
  'police-car',
  'ship',
  'helicopter',
]

const INSTRUMENT_IDS = ['drum', 'maracas', 'bell', 'piano', 'guitar']

const RU_ORDER = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('')
const EN_ORDER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

async function knockoutRaw(inputPath, { width, height, fit, punchHoles }) {
  const { data, info } = await sharp(inputPath)
    .rotate()
    .resize(width, height, {
      fit,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rgba = new Uint8Array(data)
  knockOutEdgeWhite(rgba, info.width, info.height, 18)
  if (punchHoles) {
    punchNearWhiteBand(rgba, info.width, info.height, {
      minYRatio: 0,
      minAlpha: 20,
      minLum: 228,
      chroma: 28,
    })
  }
  return { rgba, width: info.width, height: info.height }
}

async function writePng(rgba, width, height, outputPath) {
  await sharp(Buffer.from(rgba), {
    raw: { width, height, channels: 4 },
  })
    .trim()
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outputPath)
  const meta = await sharp(outputPath).metadata()
  console.log(`${path.relative(outDir, outputPath)} ${meta.width}x${meta.height}`)
}

function findBlobs(rgba, width, height) {
  const n = width * height
  const seen = new Uint8Array(n)
  const blobs = []

  const isInk = (idx) => rgba[idx * 4 + 3] > 36

  for (let i = 0; i < n; i += 1) {
    if (seen[i] || !isInk(i)) continue
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    let area = 0
    let sumX = 0
    let sumY = 0
    const stack = [i]
    seen[i] = 1
    while (stack.length) {
      const idx = stack.pop()
      const x = idx % width
      const y = (idx / width) | 0
      area += 1
      sumX += x
      sumY += y
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      const neigh = [idx - 1, idx + 1, idx - width, idx + width]
      for (const nidx of neigh) {
        if (nidx < 0 || nidx >= n || seen[nidx] || !isInk(nidx)) continue
        seen[nidx] = 1
        stack.push(nidx)
      }
    }
    if (area < 80) continue
    blobs.push({
      minX,
      minY,
      maxX,
      maxY,
      area,
      cx: sumX / area,
      cy: sumY / area,
    })
  }
  return blobs
}

function mergeDiacritics(blobs) {
  if (blobs.length === 0) return blobs
  const areas = [...blobs].sort((a, b) => a.area - b.area)
  const median = areas[(areas.length / 2) | 0].area
  const used = new Set()
  const out = []

  const canAttach = (small, large) => {
    const overlap =
      Math.min(small.maxX, large.maxX) - Math.max(small.minX, large.minX)
    const gapY = large.minY - small.maxY
    const closeY = small.cy < large.cy && gapY < large.maxY - large.minY
    return overlap > (small.maxX - small.minX) * 0.15 && closeY && gapY > -12
  }

  for (let i = 0; i < blobs.length; i += 1) {
    if (used.has(i)) continue
    const a = blobs[i]
    if (a.area >= median * 0.28) continue
    let best = -1
    for (let j = 0; j < blobs.length; j += 1) {
      if (i === j || used.has(j)) continue
      const b = blobs[j]
      if (b.area < median * 0.28) continue
      if (canAttach(a, b)) {
        best = j
        break
      }
    }
    if (best < 0) continue
    const b = blobs[best]
    used.add(i)
    used.add(best)
    out.push({
      minX: Math.min(a.minX, b.minX),
      minY: Math.min(a.minY, b.minY),
      maxX: Math.max(a.maxX, b.maxX),
      maxY: Math.max(a.maxY, b.maxY),
      area: a.area + b.area,
      cx: (a.cx * a.area + b.cx * b.area) / (a.area + b.area),
      cy: (a.cy * a.area + b.cy * b.area) / (a.area + b.area),
    })
  }

  for (let i = 0; i < blobs.length; i += 1) {
    if (!used.has(i)) out.push(blobs[i])
  }
  return out
}

function readingOrder(blobs) {
  if (blobs.length === 0) return blobs
  const byY = [...blobs].sort((a, b) => a.cy - b.cy)
  const rows = []
  const rowGap = blobs.reduce((s, b) => s + (b.maxY - b.minY), 0) / blobs.length
  for (const blob of byY) {
    const row = rows[rows.length - 1]
    if (!row || blob.cy - row[0].cy > rowGap * 0.55) rows.push([blob])
    else row.push(blob)
  }
  return rows.flatMap((row) => row.sort((a, b) => a.cx - b.cx))
}

/** Лист RU: 40 глифов, 7 лишних дублей (Ё, З, К, Л, М, О, С). */
const RU_PICK = [
  0, 1, 2, 3, 4, 5, 6, 8, 9, 11, 12, 13, 14, 17, 19, 20, 22, 23, 24, 26, 27, 28,
  29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
]

async function sliceLetters(sheetName, labels, destDir, pick) {
  const input = path.join(srcDir, sheetName)
  const { rgba, width, height } = await knockoutRaw(input, {
    width: 2400,
    height: 1800,
    fit: 'contain',
    punchHoles: false,
  })
  const ordered = readingOrder(mergeDiacritics(findBlobs(rgba, width, height)))
  const chosen = pick ? pick.map((index) => ordered[index]) : ordered
  console.log(`${sheetName}: ${ordered.length} glyphs → ${chosen.length} (need ${labels.length})`)
  if (chosen.length !== labels.length || chosen.some((b) => !b)) {
    throw new Error(
      `${sheetName}: expected ${labels.length} letters, got ${chosen.filter(Boolean).length} of ${ordered.length}`,
    )
  }

  for (let i = 0; i < labels.length; i += 1) {
    const b = chosen[i]
    const pad = 10
    const left = Math.max(0, b.minX - pad)
    const top = Math.max(0, b.minY - pad)
    const w = Math.min(width - left, b.maxX - b.minX + pad * 2 + 1)
    const h = Math.min(height - top, b.maxY - b.minY + pad * 2 + 1)
    const name = labels[i]
    const { data, info } = await sharp(Buffer.from(rgba), {
      raw: { width, height, channels: 4 },
    })
      .extract({ left, top, width: w, height: h })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const tile = new Uint8Array(data)
    punchNearWhiteBand(tile, info.width, info.height, {
      minYRatio: 0,
      minAlpha: 20,
      minLum: 232,
      chroma: 22,
    })
    eraseDetachedSpecks(tile, info.width, info.height)
    await sharp(Buffer.from(tile), {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .trim()
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(path.join(destDir, name))
  }
}

/** Снимает кляксы под глифом, не срезая ножки буквы. */
function eraseDetachedSpecks(rgba, width, height) {
  const blobs = findBlobs(rgba, width, height)
  if (blobs.length <= 1) return
  const main = blobs.reduce((a, b) => (b.area > a.area ? b : a))
  const mainH = main.maxY - main.minY
  for (const blob of blobs) {
    if (blob === main) continue
    const overlapX =
      Math.min(blob.maxX, main.maxX) - Math.max(blob.minX, main.minX)
    const above =
      blob.cy < main.cy && blob.maxY <= main.minY + 10 && overlapX > 0
    if (above) continue
    const strayBelow = blob.minY > main.maxY - mainH * 0.12
    if (!strayBelow && blob.area > main.area * 0.08) continue
    if (!strayBelow && blob.area >= 80) continue
    for (let y = blob.minY; y <= blob.maxY; y += 1) {
      for (let x = blob.minX; x <= blob.maxX; x += 1) {
        const i = (y * width + x) * 4
        rgba[i + 3] = 0
      }
    }
  }
}

const lettersOnly = process.argv.includes('--letters-only')

if (!lettersOnly) {
  await rm(path.join(outDir, 'cards'), { recursive: true, force: true })
  await rm(path.join(outDir, 'play'), { recursive: true, force: true })
}
await rm(path.join(outDir, 'letters'), { recursive: true, force: true })
if (!lettersOnly) {
  await mkdir(path.join(outDir, 'cards'), { recursive: true })
  await mkdir(path.join(outDir, 'play'), { recursive: true })
}
await mkdir(path.join(outDir, 'letters'), { recursive: true })

for (const id of lettersOnly ? [] : CARD_IDS) {
  const { rgba, width, height } = await knockoutRaw(path.join(srcDir, `${id}.jpg`), {
    width: 1024,
    height: 1024,
    fit: 'contain',
    punchHoles: false,
  })
  await writePng(rgba, width, height, path.join(outDir, 'cards', `${id}.png`))
}

for (const id of lettersOnly ? [] : INSTRUMENT_IDS) {
  const card = await knockoutRaw(path.join(srcDir, `${id}-card.jpg`), {
    width: 1024,
    height: 1024,
    fit: 'contain',
    punchHoles: false,
  })
  await writePng(card.rgba, card.width, card.height, path.join(outDir, 'cards', `${id}.png`))

  const play = await knockoutRaw(path.join(srcDir, `${id}-play.jpg`), {
    width: 1600,
    height: 1200,
    fit: 'contain',
    punchHoles: false,
  })
  await writePng(play.rgba, play.width, play.height, path.join(outDir, 'play', `${id}.png`))
}

const ruNames = RU_ORDER.map((_, i) => `ru-${String(i + 1).padStart(2, '0')}.png`)
const enNames = EN_ORDER.map((letter) => `en-${letter}.png`)
await sliceLetters(
  'letters-ru-sheet.jpg',
  ruNames,
  path.join(outDir, 'letters'),
  RU_PICK,
)
await sliceLetters('letters-en-sheet.jpg', enNames, path.join(outDir, 'letters'))
console.log('sound-world assets ready')
