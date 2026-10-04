/**
 * «Собери что угодно!»: assets-master → public.
 * - assets-master/games/shape-build/icons/*.jpg → public/assets/games/creative/icons/*.png
 *   (иконки кнопок шапки в общем наборе: белый фон убираем, 256 px)
 * - assets-master/menu/card-shape-build.jpg → public/assets/menu/card-shape-build.png
 * - assets-master/games/shape-build/hand.jpg → public/assets/games/shape-build/hand.png (рука-подсказка)
 * - если владелец положил мастера (`docs/assets/shape-build-ART.md`):
 *   sb-room-wall.jpg → room-wall.webp (обои плиткой), sb-room-floor.jpg → room-floor.webp (плинтус и пол),
 *   sb-cabinet.jpg → cabinet.webp (белый фон убран),
 *   sb-pieces-wood.jpg (3×3, только шарик) и sb-pieces-items.jpg (4×3) → pieces/<деталь>.png;
 *   деревянные детали строго сбоку рисует build-shape-build-wood.mjs (контур = физика)
 *   в public/assets/games/shape-build/.
 *   После этого включить флаги в src/games/shape-build/art.ts.
 * - иконки игры нарезаны из sb-icons-sheet.jpg (3×3) в icons/*.jpg один раз вручную.
 */
import { access, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite } from './knockout-white.mjs'

const root = path.resolve(import.meta.dirname, '..')
const gameSrc = path.join(root, 'assets-master', 'games', 'shape-build')
const gameOut = path.join(root, 'public', 'assets', 'games', 'shape-build')
const iconsSrc = path.join(gameSrc, 'icons')
const iconsOut = path.join(root, 'public', 'assets', 'games', 'creative', 'icons')
const cardSrc = path.join(root, 'assets-master', 'menu', 'card-shape-build.jpg')
const cardOut = path.join(root, 'public', 'assets', 'menu', 'card-shape-build.png')

async function exists(file) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

async function report(output) {
  const meta = await sharp(output).metadata()
  console.log(`${path.relative(root, output)} ${meta.width}x${meta.height}`)
}

async function knockout(input, output, size, tolerance) {
  const { data, info } = await sharp(input)
    .rotate()
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rgba = new Uint8Array(data)
  knockOutEdgeWhite(rgba, info.width, info.height, tolerance)
  const trimmed = await sharp(Buffer.from(rgba), { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png()
    .toBuffer()
  const resized = sharp(trimmed).resize(size, size, { fit: 'inside' })
  if (output.endsWith('.webp')) await resized.webp({ quality: 86, alphaQuality: 100 }).toFile(output)
  else await resized.png({ compressionLevel: 9, effort: 10 }).toFile(output)
  await report(output)
}

/**
 * Карточка меню: светлая рамка почти белая, заливка «белого от краёв» прогрызает её.
 * Альфа = скруглённый квадрат по краям карточки (средняя строка и колонка), внутри всё непрозрачно.
 */
async function cutCard(input, output, size) {
  const { data, info } = await sharp(input)
    .rotate()
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const ink = (x, y) => {
    const o = (y * w + x) * 4
    return Math.min(data[o], data[o + 1], data[o + 2]) < 240
  }
  const midX = w >> 1
  const midY = h >> 1
  let left = 0
  while (left < midX && !ink(left, midY)) left++
  let right = w - 1
  while (right > midX && !ink(right, midY)) right--
  let top = 0
  while (top < midY && !ink(midX, top)) top++
  let bottom = h - 1
  while (bottom > midY && !ink(midX, bottom)) bottom--
  const halfW = (right - left + 1) / 2
  const halfH = (bottom - top + 1) / 2
  const cx = left + halfW
  const cy = top + halfH
  const radius = Math.min(halfW, halfH) * 0.36
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const qx = Math.abs(x + 0.5 - cx) - (halfW - radius)
      const qy = Math.abs(y + 0.5 - cy) - (halfH - radius)
      const dist = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
      const alpha = Math.max(0, Math.min(1, 0.5 - dist))
      data[(y * w + x) * 4 + 3] = Math.round(alpha * 255)
    }
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .resize(size, size, { fit: 'inside' })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(output)
  await report(output)
}

/** `--only=sb-a.jpg,sb-b.jpg` — нарезать только эти листы деталей, остальное не трогать. */
const ONLY = process.argv
  .find((a) => a.startsWith('--only='))
  ?.slice('--only='.length)
  .split(',')
  .filter(Boolean)
const everything = !ONLY

if (everything) {
  for (const file of (await readdir(iconsSrc)).filter((f) => /\.jpe?g$/i.test(f)).sort()) {
    await knockout(path.join(iconsSrc, file), path.join(iconsOut, file.replace(/\.jpe?g$/i, '.png')), 256, 18)
  }
  await cutCard(cardSrc, cardOut, 1024)
  await mkdir(gameOut, { recursive: true })
  await knockout(path.join(gameSrc, 'hand.jpg'), path.join(gameOut, 'hand.png'), 256, 18)
}

const cabinetSrc = path.join(gameSrc, 'sb-cabinet.jpg')
if (everything && (await exists(cabinetSrc))) await knockout(cabinetSrc, path.join(gameOut, 'cabinet.webp'), 1400, 16)

/**
 * Комната растёт в любую сторону (0.17.0): обои и полоса пола повторяются.
 * Плитку собираем зеркально (2×2 у обоев, 2×1 у пола) — стыков не видно.
 */
async function mirrorTile(src, out, { crop, cell, both }) {
  const base = await sharp(src).rotate().extract(crop).resize(cell.w, cell.h).toBuffer()
  const flipX = await sharp(base).flop().toBuffer()
  const tiles = [
    { input: base, left: 0, top: 0 },
    { input: flipX, left: cell.w, top: 0 },
  ]
  if (both) {
    tiles.push({ input: await sharp(base).flip().toBuffer(), left: 0, top: cell.h })
    tiles.push({ input: await sharp(flipX).flip().toBuffer(), left: cell.w, top: cell.h })
  }
  await sharp({
    create: { width: cell.w * 2, height: both ? cell.h * 2 : cell.h, channels: 3, background: '#fff7ea' },
  })
    .composite(tiles)
    .webp({ quality: 82 })
    .toFile(out)
  await report(out)
}
const wallSrc = path.join(gameSrc, 'sb-room-wall.jpg')
if (everything && (await exists(wallSrc))) {
  const meta = await sharp(wallSrc).metadata()
  const side = Math.min(meta.width, meta.height)
  await mirrorTile(wallSrc, path.join(gameOut, 'room-wall.webp'), {
    crop: { left: 0, top: 0, width: side, height: side },
    cell: { w: 512, h: 512 },
    both: true,
  })
}
const floorSrc = path.join(gameSrc, 'sb-room-floor.jpg')
if (everything && (await exists(floorSrc))) {
  const meta = await sharp(floorSrc).metadata()
  // Срез от верха плинтуса до низа: стена выше — плиткой обоев.
  const top = Math.round(meta.height * 0.285)
  await mirrorTile(floorSrc, path.join(gameOut, 'room-floor.webp'), {
    crop: { left: 0, top, width: meta.width, height: meta.height - top },
    cell: { w: 1024, h: Math.round(((meta.height - top) / meta.width) * 1024) },
    both: false,
  })
}

/**
 * Листы деталей → pieces/<вид>.png: клетка сетки, белый фон убран, обрезано по рисунку.
 * `punch` — белые дырки внутри рисунка (между спицами, в сетке кольца) тоже прозрачные.
 * `cropBottom` — отрезать низ (маленькие колёсики под тележкой: колесо отдельным рисунком).
 */
const SHEETS = [
  {
    // Из листа владельца берём только шарик; дерево — строго сбоку из build-shape-build-wood.mjs.
    file: 'sb-pieces-wood.jpg',
    cols: 3,
    rows: 3,
    cells: [null, null, null, null, null, null, null, null, 'balloon'],
  },
  {
    file: 'sb-pieces-items.jpg',
    cols: 4,
    rows: 3,
    // Мяу и Олли с 0.18.0 — из листов поз (ниже).
    cells: ['ball', 'stone', 'cart', 'cart-wheel', null, null, 'spring', 'wrecking', 'hoop', 'fan', 'fan-blades'],
  },
  // Мяу и Олли живые (0.18.0, сгенерировал Cursor по героям хаба): поза — картинка, движение — кодом.
  ...['meow', 'olli'].map((who) => ({
    file: `sb-${who}-poses.jpg`,
    cols: 4,
    rows: 3,
    cells: [who, 'walk1', 'walk2', 'joy', 'hang', 'ride', 'fly', 'float', 'sleep', 'wave', 'blink', null].map((pose) =>
      pose === who || pose === null ? pose : `${who}-${pose}`,
    ),
  })),
  {
    // Механизмы и новые детали в стиле предметов (0.16.18, сгенерировал Cursor).
    file: 'sb-machines-sheet.jpg',
    cols: 4,
    rows: 3,
    cells: ['cannon', 'seesaw-stand', null, null, null, 'mill-rotor', null, null, 'button-base', 'button-cap', 'lamp', null],
  },
  {
    file: 'sb-links-sheet.jpg',
    cols: 4,
    rows: 2,
    // Лючок дверцы — та же доска (`plank`), отдельная картинка не нужна.
    cells: [null, null, 'pin', 'pusher-base', 'pusher-glove', 'pulley-beam', 'bucket', null],
  },
  // Длинные и высокие — отдельными листами крупнее, чтобы не мылились.
  { file: 'sb-machines-long.jpg', cols: 1, rows: 3, cells: ['seesaw-board', 'conveyor', 'lift-platform'] },
  // Режем по своим границам (доли ширины). Лестница лифта и столбик дверцы с 0.17.0 не нужны.
  {
    file: 'sb-machines-tall.jpg',
    cols: 4,
    rows: 1,
    cells: [null, 'mill-stand', null, 'rocket'],
    spans: [
      [0, 0.31],
      [0.31, 0.52],
      [0.52, 0.735],
      [0.735, 1],
    ],
  },
  // Переработка механизмов (0.17.0, сгенерировал Cursor): коробка рольставни, ножницы, труба.
  { file: 'sb-machines-sheet-3.jpg', cols: 2, rows: 2, cells: ['gate-box', 'scissors', 'pipe', null] },
  { file: 'sb-machines-long-2.jpg', cols: 1, rows: 3, cells: ['lift-base', 'launcher-base', 'launcher-plate'] },
  // Ракетный рюкзак и парашют (0.22.0, сгенерировал Cursor по листам поз и ракете).
  { file: 'sb-meow-jetpack.jpg', cols: 1, rows: 1, cells: ['meow-jetpack'] },
  { file: 'sb-olli-jetpack.jpg', cols: 1, rows: 1, cells: ['olli-jetpack'] },
  { file: 'sb-parachute.jpg', cols: 1, rows: 1, cells: ['parachute'] },
]
const CELL_OPTS = {
  cart: { cropBottom: 0.2 },
  'cart-wheel': { punch: true },
  hoop: { punch: true },
  'mill-rotor': { punch: true },
  'seesaw-stand': { punch: true },
  bucket: { punch: true },
  scissors: { punch: true },
}
const LONG_SIDE = {
  plank: 1024,
  ramp: 1024,
  brick: 960,
  spring: 960,
  hoop: 800,
  'seesaw-board': 1024,
  conveyor: 960,
  'lift-platform': 800,
  'lift-base': 960,
  'launcher-base': 960,
  'launcher-plate': 960,
}

/** В клетку заходят краешки соседних рисунков — оставляем только крупные куски. */
function keepMainShape(rgba, width, height) {
  const label = new Int32Array(width * height)
  const sizes = [0]
  const stack = []
  for (let start = 0; start < width * height; start += 1) {
    if (label[start] || rgba[start * 4 + 3] === 0) continue
    const id = sizes.length
    let size = 0
    label[start] = id
    stack.push(start)
    while (stack.length) {
      const idx = stack.pop()
      size += 1
      const x = idx % width
      const y = (idx / width) | 0
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
        const n = ny * width + nx
        if (label[n] || rgba[n * 4 + 3] === 0) continue
        label[n] = id
        stack.push(n)
      }
    }
    sizes.push(size)
  }
  const biggest = Math.max(...sizes)
  for (let idx = 0; idx < width * height; idx += 1) {
    if (label[idx] && sizes[label[idx]] < biggest * 0.05) rgba[idx * 4 + 3] = 0
  }
}

async function cutCell(src, meta, sheet, index, name) {
  const ch = meta.height / sheet.rows
  const span = sheet.spans?.[index]
  const left = Math.round(span ? span[0] * meta.width : (index % sheet.cols) * (meta.width / sheet.cols))
  const right = Math.round(span ? span[1] * meta.width : left + meta.width / sheet.cols)
  const top = Math.round(Math.floor(index / sheet.cols) * ch)
  const { data, info } = await sharp(src)
    .extract({ left, top, width: Math.min(right, meta.width) - left, height: Math.floor(ch) })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rgba = new Uint8Array(data)
  knockOutEdgeWhite(rgba, info.width, info.height, 18)
  keepMainShape(rgba, info.width, info.height)
  const opts = CELL_OPTS[name] ?? {}
  if (opts.punch) {
    for (let o = 0; o < rgba.length; o += 4) {
      if (rgba[o] >= 246 && rgba[o + 1] >= 246 && rgba[o + 2] >= 246) rgba[o + 3] = 0
    }
  }
  let img = await sharp(Buffer.from(rgba), { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png()
    .toBuffer()
  if (opts.cropBottom) {
    const m = await sharp(img).metadata()
    img = await sharp(img)
      .extract({ left: 0, top: 0, width: m.width, height: Math.round(m.height * (1 - opts.cropBottom)) })
      .trim()
      .png()
      .toBuffer()
  }
  const side = LONG_SIDE[name] ?? (/^(meow|olli)/.test(name) ? 400 : 640)
  const out = path.join(gameOut, 'pieces', `${name}.png`)
  await sharp(img)
    .resize(side, side, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(out)
  await report(out)
}

for (const sheet of SHEETS) {
  const src = path.join(gameSrc, sheet.file)
  if (ONLY && !ONLY.includes(sheet.file)) continue
  if (!(await exists(src))) continue
  await mkdir(path.join(gameOut, 'pieces'), { recursive: true })
  const meta = await sharp(src).metadata()
  for (const [index, name] of sheet.cells.entries()) if (name) await cutCell(src, meta, sheet, index, name)
}

if (everything) await import('./build-shape-build-wood.mjs')