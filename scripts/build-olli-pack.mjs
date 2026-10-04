/**
 * Лист танца совы 3×2 → 6 выровненных кадров.
 * Кадр 6 — зеркало кадра 3, чтобы крыло было слева.
 * Запуск: node scripts/build-olli-pack.mjs
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite } from './knockout-white.mjs'
import { compositeMenuCardBacking } from './menu-card-backing.mjs'

const root = path.resolve(import.meta.dirname, '..')
const sheetPath = path.join(root, 'assets-master', 'mascot', 'menu-olli-dance-sheet.jpg')
const publicDir = path.join(root, 'public', 'assets', 'mascot', 'menu-dance-olli')
const INSET = 8
const ALPHA_MIN = 40

function clampByte(n) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function isWhite(r, g, b) {
  return r > 245 && g > 245 && b > 245
}

async function rawOf(file) {
  const extracted = await sharp(file).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return {
    rgba: Buffer.from(extracted.data),
    width: extracted.info.width,
    height: extracted.info.height,
  }
}

function gutters(rgba, width, height, axis) {
  const count = axis === 'x' ? width : height
  const flags = []
  for (let i = 0; i < count; i++) {
    let white = 0
    let samples = 0
    if (axis === 'x') {
      for (let y = 0; y < height; y += 4) {
        const o = (y * width + i) * 4
        if (isWhite(rgba[o], rgba[o + 1], rgba[o + 2])) white++
        samples++
      }
    } else {
      for (let x = 0; x < width; x += 4) {
        const o = (i * width + x) * 4
        if (isWhite(rgba[o], rgba[o + 1], rgba[o + 2])) white++
        samples++
      }
    }
    flags.push(white / samples > 0.45)
  }
  const spans = []
  let start = -1
  for (let i = 0; i <= flags.length; i++) {
    if (i < flags.length && flags[i]) {
      if (start < 0) start = i
    } else if (start >= 0) {
      if (i - start > 2) spans.push([start, i])
      start = -1
    }
  }
  return spans
}

function contentSpans(length, guttersSpans) {
  const cuts = [0, ...guttersSpans.flat(), length]
  const spans = []
  for (let i = 0; i < cuts.length - 1; i += 2) {
    const a = cuts[i] + INSET
    const b = cuts[i + 1] - INSET
    if (b - a > 20) spans.push([a, b])
  }
  return spans
}

function keyBlue(rgba, width, height) {
  const corner = [rgba[0], rgba[1], rgba[2]]
  const bg = (o) => {
    const d = Math.hypot(rgba[o] - corner[0], rgba[o + 1] - corner[1], rgba[o + 2] - corner[2])
    return d < 36 || isWhite(rgba[o], rgba[o + 1], rgba[o + 2])
  }
  const n = width * height
  const seen = new Uint8Array(n)
  const queue = []
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const idx = y * width + x
    if (seen[idx] || !bg(idx * 4)) return
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
}

function metrics(rgba, width, height) {
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let foot = 0
  let sumX = 0
  let n = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] <= ALPHA_MIN) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      if (y > foot) foot = y
      sumX += x
      n++
    }
  }
  return { minX, minY, maxX, maxY, foot, cx: n ? sumX / n : width / 2, height: Math.max(1, foot - minY) }
}

async function pngFromRgba(rgba, width, height) {
  return sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer()
}

async function loadCell(left, top, width, height) {
  const extracted = await sharp(sheetPath)
    .rotate()
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rgba = Buffer.from(extracted.data)
  keyBlue(rgba, extracted.info.width, extracted.info.height)
  return { rgba, width: extracted.info.width, height: extracted.info.height }
}

async function flop(frame) {
  const buf = await pngFromRgba(frame.rgba, frame.width, frame.height)
  const flipped = await sharp(buf).flop().ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { rgba: Buffer.from(flipped.data), width: flipped.info.width, height: flipped.info.height }
}

async function scaled(frame, scale) {
  if (Math.abs(scale - 1) < 0.01) return frame
  const buf = await pngFromRgba(frame.rgba, frame.width, frame.height)
  const width = Math.max(1, Math.round(frame.width * scale))
  const height = Math.max(1, Math.round(frame.height * scale))
  const out = await sharp(buf).resize(width, height, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { rgba: Buffer.from(out.data), width: out.info.width, height: out.info.height }
}

const sheet = await rawOf(sheetPath)
const xGutters = gutters(sheet.rgba, sheet.width, sheet.height, 'x')
const yGutters = gutters(sheet.rgba, sheet.width, sheet.height, 'y')
const cols = contentSpans(sheet.width, xGutters)
const rows = contentSpans(sheet.height, yGutters)
if (cols.length !== 3 || rows.length !== 2) {
  throw new Error(`Expected 3x2 cells, got ${cols.length}x${rows.length}`)
}

const cells = []
for (const [top, bottom] of rows) {
  for (const [left, right] of cols) {
    cells.push(await loadCell(left, top, right - left, bottom - top))
  }
}
cells[5] = await flop(cells[2])

const refH = metrics(cells[0].rgba, cells[0].width, cells[0].height).height
const fitted = []
for (const cell of cells) {
  const before = metrics(cell.rgba, cell.width, cell.height)
  fitted.push(await scaled(cell, refH / before.height))
}
const stats = fitted.map((frame) => metrics(frame.rgba, frame.width, frame.height))
const pad = 12
const canvasW = Math.max(...stats.map((s) => s.maxX - s.minX + 1)) + pad * 2
const canvasH = Math.max(...stats.map((s) => s.foot - s.minY + 1)) + pad * 2
const destFoot = canvasH - pad - 1
const destCx = canvasW / 2

await mkdir(publicDir, { recursive: true })
for (let i = 0; i < fitted.length; i++) {
  // Кадр 4 (улыбка) меню не показывает — см. OLLI_DANCE_FRAMES в src/app/menu-cards.ts.
  if (i + 1 === 4) continue
  const frame = fitted[i]
  const stat = stats[i]
  const out = Buffer.alloc(canvasW * canvasH * 4)
  const shiftY = destFoot - stat.foot
  const shiftX = Math.round(destCx - stat.cx)
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const src = (y * frame.width + x) * 4
      if (frame.rgba[src + 3] === 0) continue
      const dx = x + shiftX
      const dy = y + shiftY
      if (dx < 0 || dy < 0 || dx >= canvasW || dy >= canvasH) continue
      const dst = (dy * canvasW + dx) * 4
      out[dst] = frame.rgba[src]
      out[dst + 1] = frame.rgba[src + 1]
      out[dst + 2] = frame.rgba[src + 2]
      out[dst + 3] = frame.rgba[src + 3]
    }
  }
  const id = `frame_${String(i + 1).padStart(2, '0')}.png`
  await sharp(await pngFromRgba(out, canvasW, canvasH)).png({ compressionLevel: 9 }).toFile(path.join(publicDir, id))
  const check = metrics(out, canvasW, canvasH)
  console.log(id, 'foot', check.foot, 'cx', Math.round(check.cx), 'body', check.height)
}

await processWelcome()
await processPresenter()
await processStill(
  path.join(root, 'assets-master', 'shell', 'welcome-title-friends.png'),
  path.join(root, 'public', 'assets', 'shell', 'welcome-title.png'),
  false,
)
await processStill(
  path.join(root, 'assets-master', 'menu', 'menu-visit-tree.png'),
  path.join(root, 'public', 'assets', 'menu', 'menu-visit-tree.png'),
  false,
)
await processMenuCardPng(
  path.join(root, 'assets-master', 'menu', 'card-counting.png'),
  path.join(root, 'public', 'assets', 'menu', 'card-counting.png'),
)
await processCardJpg(
  path.join(root, 'assets-master', 'menu', 'card-hide-seek.jpg'),
  path.join(root, 'public', 'assets', 'menu', 'card-hide-seek.png'),
)
await processPwa()

async function processWelcome() {
  const open = await keyedFile(path.join(root, 'assets-master', 'shell', 'welcome-olli-open_eyes.jpg'))
  const closed = await keyedFile(path.join(root, 'assets-master', 'shell', 'welcome-olli-closed_eyes.jpg'))
  const openStat = metrics(open.rgba, open.width, open.height)
  const fittedClosed = await scaled(closed, openStat.height / metrics(closed.rgba, closed.width, closed.height).height)
  const closedStat = metrics(fittedClosed.rgba, fittedClosed.width, fittedClosed.height)
  const pad = 16
  const canvasW = Math.max(openStat.maxX - openStat.minX, closedStat.maxX - closedStat.minX) + pad * 2
  const canvasH = Math.max(openStat.foot - openStat.minY, closedStat.foot - closedStat.minY) + pad * 2
  const destFoot = canvasH - pad - 1
  const destCx = canvasW / 2
  await place(open, openStat, canvasW, canvasH, destFoot, destCx, path.join(root, 'public', 'assets', 'shell', 'welcome-olli-open.png'))
  await place(fittedClosed, closedStat, canvasW, canvasH, destFoot, destCx, path.join(root, 'public', 'assets', 'shell', 'welcome-olli-closed.png'))
}

async function processPresenter() {
  const file = path.join(root, 'assets-master', 'mascot', 'olli-presenter-sheet.jpg')
  const meta = await sharp(file).metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  const colW = Math.floor(width / 3)
  const names = ['olli-idle.png', 'olli-happy.png', 'olli-miss.png']
  const outDir = path.join(root, 'public', 'assets', 'mascot', 'presenter')
  await mkdir(outDir, { recursive: true })
  for (let i = 0; i < 3; i++) {
    const left = i * colW + 16
    const cellW = (i === 2 ? width - i * colW : colW) - 32
    const cell = await loadFrom(file, left, 12, cellW, height - 24)
    const buf = await pngFromRgba(cell.rgba, cell.width, cell.height)
    await sharp(buf).trim().png({ compressionLevel: 9 }).toFile(path.join(outDir, names[i]))
    console.log(names[i])
  }
}

async function keyedFile(file) {
  const frame = await rawOf(file)
  keyBlue(frame.rgba, frame.width, frame.height)
  return frame
}

async function loadFrom(file, left, top, width, height) {
  const extracted = await sharp(file)
    .rotate()
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rgba = Buffer.from(extracted.data)
  keyBlue(rgba, extracted.info.width, extracted.info.height)
  return { rgba, width: extracted.info.width, height: extracted.info.height }
}

async function place(frame, stat, canvasW, canvasH, destFoot, destCx, file) {
  const out = Buffer.alloc(canvasW * canvasH * 4)
  const shiftY = destFoot - stat.foot
  const shiftX = Math.round(destCx - stat.cx)
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const src = (y * frame.width + x) * 4
      if (frame.rgba[src + 3] === 0) continue
      const dx = x + shiftX
      const dy = y + shiftY
      if (dx < 0 || dy < 0 || dx >= canvasW || dy >= canvasH) continue
      const dst = (dy * canvasW + dx) * 4
      out[dst] = frame.rgba[src]
      out[dst + 1] = frame.rgba[src + 1]
      out[dst + 2] = frame.rgba[src + 2]
      out[dst + 3] = frame.rgba[src + 3]
    }
  }
  await mkdir(path.dirname(file), { recursive: true })
  await sharp(await pngFromRgba(out, canvasW, canvasH)).png({ compressionLevel: 9 }).toFile(file)
  console.log(path.basename(file))
}

async function processStill(input, output, resize) {
  let pipeline = sharp(input).rotate().trim()
  if (resize) pipeline = pipeline.resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
  await mkdir(path.dirname(output), { recursive: true })
  await pipeline.png({ compressionLevel: 9 }).toFile(output)
  const meta = await sharp(output).metadata()
  console.log(path.basename(output), `${meta.width}x${meta.height}`)
}

async function processMenuCardPng(input, output) {
  await mkdir(path.dirname(output), { recursive: true })
  await compositeMenuCardBacking(
    sharp,
    input,
    path.join(root, 'public', 'assets', 'menu', 'card-sort-colors.png'),
    output,
  )
  const meta = await sharp(output).metadata()
  console.log(path.basename(output), `${meta.width}x${meta.height}`)
}

async function processCardJpg(input, output) {
  const { data, info } = await sharp(input).rotate().resize(1024, 1024, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const rgba = new Uint8Array(data)
  knockOutEdgeWhite(rgba, info.width, info.height, 18)
  await sharp(Buffer.from(rgba), { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(output)
  console.log(path.basename(output))
}

async function processPwa() {
  const input = path.join(root, 'assets-master', 'shell', 'pwa-icon-friends.jpg')
  const targets = [
    ['public/pwa-icon-512.png', 512],
    ['public/pwa-icon-192.png', 192],
    ['public/apple-touch-icon.png', 180],
    ['public/favicon.png', 32],
  ]
  for (const [rel, size] of targets) {
    await sharp(input).rotate().resize(size, size, { fit: 'cover' }).png().toFile(path.join(root, rel))
    console.log(rel, size)
  }
}
