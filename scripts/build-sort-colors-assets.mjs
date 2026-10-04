/**
 * Мастера «Куда положить?» → public/assets/games/sort-colors/
 * Запуск: npm run assets:sort-colors
 *
 * Каждый шаг пропускается, если мастера ещё нет. В конце пишет
 * src/games/sort-colors/art-ready.ts — игра берёт PNG только для готового.
 */
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite } from './knockout-white.mjs'
import { knockOutKey } from './knockout-key.mjs'

const require = createRequire(import.meta.url)
let ffmpegPath
try {
  ffmpegPath = require('ffmpeg-static')
} catch {
  ffmpegPath = 'ffmpeg'
}

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-master', 'games', 'sort-colors')
const outDir = path.join(root, 'public', 'assets', 'games', 'sort-colors')
const readyFile = path.join(root, 'src', 'games', 'sort-colors', 'art-ready.ts')

const KINDS = ['ball', 'cube', 'star', 'pyramid', 'heart', 'duck', 'ring']
const COLORS = ['red', 'yellow', 'blue', 'green']
const KEY_BLUE = [214, 238, 248]

const exists = async (file) => {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

async function findMaster(base) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const file = path.join(srcDir, base + ext)
    if (await exists(file)) return file
  }
  return null
}

async function readRgba(file) {
  const { data, info } = await sharp(file).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { rgba: new Uint8Array(data), width: info.width, height: info.height }
}

/** Закрытые белые «дырки» (колечко) больше minArea → прозрачные. Мелкие блики остаются. */
function punchEnclosedWhite(rgba, width, height, minArea) {
  const seen = new Uint8Array(width * height)
  const isWhite = (idx) => {
    const o = idx * 4
    return rgba[o + 3] > 0 && rgba[o] >= 244 && rgba[o + 1] >= 244 && rgba[o + 2] >= 244
  }
  for (let start = 0; start < width * height; start++) {
    if (seen[start] || !isWhite(start)) continue
    const region = [start]
    seen[start] = 1
    for (let i = 0; i < region.length; i++) {
      const idx = region[i]
      const x = idx % width
      const y = (idx / width) | 0
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const n = ny * width + nx
        if (!seen[n] && isWhite(n)) {
          seen[n] = 1
          region.push(n)
        }
      }
    }
    if (region.length >= minArea) for (const idx of region) rgba[idx * 4 + 3] = 0
  }
}

/** Связные непрозрачные области по уменьшенной сетке → рамки, слева направо. */
function findBlobs(rgba, width, height, want) {
  const step = Math.max(1, Math.round(Math.max(width, height) / 900))
  const gw = Math.ceil(width / step)
  const gh = Math.ceil(height / step)
  const solid = new Uint8Array(gw * gh)
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const o = (Math.min(height - 1, gy * step) * width + Math.min(width - 1, gx * step)) * 4
      if (rgba[o + 3] > 40) solid[gy * gw + gx] = 1
    }
  }
  const label = new Int32Array(gw * gh).fill(-1)
  const blobs = []
  for (let i = 0; i < gw * gh; i++) {
    if (!solid[i] || label[i] >= 0) continue
    const box = { x0: Infinity, y0: Infinity, x1: -1, y1: -1, area: 0 }
    const stack = [i]
    label[i] = blobs.length
    while (stack.length) {
      const idx = stack.pop()
      const x = idx % gw
      const y = (idx / gw) | 0
      box.area += 1
      box.x0 = Math.min(box.x0, x)
      box.y0 = Math.min(box.y0, y)
      box.x1 = Math.max(box.x1, x)
      box.y1 = Math.max(box.y1, y)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
          const n = ny * gw + nx
          if (solid[n] && label[n] < 0) {
            label[n] = blobs.length
            stack.push(n)
          }
        }
      }
    }
    blobs.push(box)
  }
  const top = blobs.sort((a, b) => b.area - a.area).slice(0, want)
  if (top.length < want) throw new Error(`expected ${want} objects on the sheet, found ${top.length}`)
  return top
    .sort((a, b) => a.x0 - b.x0)
    .map((b) => {
      const pad = step * 2
      const left = Math.max(0, b.x0 * step - pad)
      const topY = Math.max(0, b.y0 * step - pad)
      return {
        left,
        top: topY,
        width: Math.min(width, (b.x1 + 1) * step + pad) - left,
        height: Math.min(height, (b.y1 + 1) * step + pad) - topY,
      }
    })
}

async function writeCrop(rgba, width, height, box, out, maxSide) {
  // sharp делает trim раньше extract — поэтому вырезаем отдельным проходом.
  const crop = await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .extract(box)
    .png()
    .toBuffer()
  await sharp(crop)
    .trim({ threshold: 6 })
    .resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(out)
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true })
    let err = ''
    child.stderr.on('data', (chunk) => (err += chunk.toString('utf8')))
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve(err) : reject(new Error(err || `ffmpeg exit ${code}`))))
  })
}

async function toMp3(src, out) {
  await runFfmpeg(['-y', '-hide_banner', '-i', src, '-ac', '1', '-ar', '44100', '-b:a', '128k', out])
}

const ready = { toys: [], bin: false, binAspect: null, stickers: false, background: false, voice: false, sfx: [] }

await mkdir(path.join(outDir, 'toys'), { recursive: true })
await mkdir(path.join(outDir, 'stickers'), { recursive: true })
await mkdir(path.join(outDir, 'sfx'), { recursive: true })

for (const kind of KINDS) {
  const master = await findMaster(`sort-toys-${kind}`)
  if (!master) continue
  const { rgba, width, height } = await readRgba(master)
  knockOutEdgeWhite(rgba, width, height, 16)
  punchEnclosedWhite(rgba, width, height, Math.round(width * height * 0.0015))
  const boxes = findBlobs(rgba, width, height, COLORS.length)
  for (let i = 0; i < COLORS.length; i++) {
    await writeCrop(rgba, width, height, boxes[i], path.join(outDir, 'toys', `${kind}-${COLORS[i]}.png`), 512)
    ready.toys.push(`${kind}-${COLORS[i]}`)
  }
  console.log(`toys ${kind}: 4 png`)
}

const binMaster = await findMaster('sort-bin')
if (binMaster) {
  const { rgba, width, height } = await readRgba(binMaster)
  knockOutKey(rgba, width, height, KEY_BLUE)
  const info = await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .trim({ threshold: 6 })
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'bin.png'))
  ready.bin = true
  ready.binAspect = Math.round((info.width / info.height) * 1000) / 1000
  console.log(`bin.png ${info.width}×${info.height}`)
}

const stickerMaster = await findMaster('sort-stickers')
if (stickerMaster) {
  const { rgba, width, height } = await readRgba(stickerMaster)
  knockOutKey(rgba, width, height, KEY_BLUE)
  const boxes = findBlobs(rgba, width, height, KINDS.length)
  for (let i = 0; i < KINDS.length; i++) {
    await writeCrop(rgba, width, height, boxes[i], path.join(outDir, 'stickers', `${KINDS[i]}.png`), 320)
  }
  ready.stickers = true
  console.log('stickers: 7 png')
}

const bgMaster = await findMaster('sort-playroom')
if (bgMaster) {
  await sharp(bgMaster)
    .rotate()
    .resize(2400, 1792, { fit: 'cover' })
    .webp({ quality: 82 })
    .toFile(path.join(outDir, 'sort-playroom-bg.webp'))
  ready.background = true
  console.log('sort-playroom-bg.webp')
}

// «Взял» и «положил» общие: public/assets/audio/pickup.mp3 и drop.mp3 (Kenney pluck_001 / select_001).
const SFX = [['pile', ['sort-pile.mp3', 'sort-pile.wav'], null]]
for (const [id, masters, fallback] of SFX) {
  let src = null
  for (const name of masters) {
    const file = path.join(srcDir, name)
    if (await exists(file)) {
      src = file
      break
    }
  }
  if (!src && fallback && (await exists(fallback))) src = fallback
  if (!src) continue
  await toMp3(src, path.join(outDir, 'sfx', `${id}.mp3`))
  ready.sfx.push(id)
  console.log(`sfx/${id}.mp3 ← ${path.basename(src)}`)
}

const voiceDir = path.join(outDir, 'voice')
if (await exists(voiceDir)) {
  const script = await readFile(path.join(root, 'docs', 'assets', 'sort-colors-VOICE-SCRIPT.md'), 'utf8')
  const wanted = [...script.matchAll(/^\|\s*`([a-z0-9-]+\.mp3)`\s*\|/gm)].map((m) => m[1])
  const have = new Set((await readdir(voiceDir)).filter((f) => f.endsWith('.mp3')))
  const missing = wanted.filter((f) => !have.has(f))
  ready.voice = wanted.length > 0 && missing.length === 0
  if (missing.length) console.log(`voice: нет ${missing.length} из ${wanted.length} фраз — пока без голоса`)
}

const list = (values) => `[${values.map((v) => `'${v}'`).join(', ')}]`
await writeFile(
  readyFile,
  `/** Создаётся \`npm run assets:sort-colors\`: какие файлы игры уже нарисованы и озвучены. */
export const SORT_ART_READY = {
  toys: ${list(ready.toys)} as readonly string[],
  bin: ${ready.bin},
  /** Ширина / высота bin.png; null — рисуем ящик-заглушку. */
  binAspect: ${ready.binAspect} as number | null,
  stickers: ${ready.stickers},
  background: ${ready.background},
  voice: ${ready.voice},
  sfx: ${list(ready.sfx)} as readonly string[],
}
`,
)
console.log(`art-ready.ts: ${JSON.stringify(ready)}`)
