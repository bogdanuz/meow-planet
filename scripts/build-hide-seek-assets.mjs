/**
 * Мастера «Прятки» → public/assets/games/hide-seek/
 * Запуск: npm run assets:hide-seek
 *
 * assets-master/games/hide-seek/hs-scene-<id>.jpg (4:3) → scenes/<id>.webp 2048×1536 и thumbs/<id>.webp 640×480.
 * assets-master/games/hide-seek/hs-items-<id>.jpg (5×2 на белом) → items/<id>-<item>.png:
 * предметы ищутся как пятна на белом (строка за строкой, слева направо), белый вокруг и в дырках убирается.
 * Порядок предметов на листе — как в `docs/assets/hide-seek-ART.md` и `src/games/hide-seek/scenes.ts`.
 * Пропорции готовых предметов (ширина / высота) → src/games/hide-seek/item-aspect.ts (раскладка без ожидания картинок).
 * assets-master/games/hide-seek/icons/*.jpg → public/assets/games/creative/icons/*.png (общий набор иконок шапки).
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite } from './knockout-white.mjs'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-master', 'games', 'hide-seek')
const outDir = path.join(root, 'public', 'assets', 'games', 'hide-seek')

const SHEETS = {
  room: ['duck', 'car', 'drum', 'book', 'sock', 'top', 'plane', 'rattle', 'slipper', 'umbrella'],
  kitchen: ['spoon', 'lemon', 'apple', 'banana', 'carrot', 'cheese', 'mouse', 'kettle', 'pear', 'cookie'],
  garden: ['snail', 'ladybug', 'butterfly', 'strawberry', 'cucumber', 'can', 'pumpkin', 'frog', 'bird', 'spade'],
  beach: ['shell', 'crab', 'pail', 'star', 'fish', 'turtle', 'boat', 'hat', 'melon', 'gull'],
  forest: ['hedgehog', 'mushroom', 'cone', 'squirrel', 'berry', 'hare', 'fox', 'nut', 'beetle', 'snail'],
  playground: ['pail', 'scooter', 'balloon', 'scoop', 'mold', 'cap', 'pigeon', 'pinwheel', 'truck', 'butterfly'],
}

const ITEM_MAX = 384
const INK_BELOW = 236
const MERGE_RADIUS = 10

await mkdir(path.join(outDir, 'scenes'), { recursive: true })
await mkdir(path.join(outDir, 'thumbs'), { recursive: true })
await mkdir(path.join(outDir, 'items'), { recursive: true })

for (const id of Object.keys(SHEETS)) {
  const master = path.join(srcDir, `hs-scene-${id}.jpg`)
  await sharp(master)
    .rotate()
    .resize(2048, 1536, { fit: 'cover', kernel: 'lanczos3' })
    .webp({ quality: 86 })
    .toFile(path.join(outDir, 'scenes', `${id}.webp`))
  await sharp(master).rotate().resize(640, 480, { fit: 'cover' }).webp({ quality: 80 }).toFile(path.join(outDir, 'thumbs', `${id}.webp`))
  console.log(`${id}: scene + thumb`)
}

/** Пятна краски на белом листе: маска «не белое», расширенная на MERGE_RADIUS, чтобы усики и ниточки не отрывались. */
function findBlobs(rgb, w, h) {
  const ink = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const o = i * 3
    if (Math.min(rgb[o], rgb[o + 1], rgb[o + 2]) < INK_BELOW) ink[i] = 1
  }
  const grown = new Uint8Array(w * h)
  const r = MERGE_RADIUS
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!ink[y * w + x]) continue
      for (let dy = -r; dy <= r; dy += 2) {
        const yy = y + dy
        if (yy < 0 || yy >= h) continue
        for (let dx = -r; dx <= r; dx += 2) {
          const xx = x + dx
          if (xx >= 0 && xx < w) grown[yy * w + xx] = 1
        }
      }
    }
  }
  const label = new Int32Array(w * h)
  const blobs = []
  for (let start = 0; start < w * h; start++) {
    if (!grown[start] || label[start]) continue
    const id = blobs.length + 1
    let x0 = w, y0 = h, x1 = 0, y1 = 0, area = 0
    const stack = [start]
    label[start] = id
    while (stack.length) {
      const p = stack.pop()
      const x = p % w
      const y = (p / w) | 0
      area++
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h || label[q] || !grown[q]) continue
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue
        label[q] = id
        stack.push(q)
      }
    }
    blobs.push({ id, x0, y0, x1, y1, area })
  }
  return { blobs, label }
}

/** Дырки (ручка ведёрка, кольцо погремушки): чисто-белые островки внутри предмета. */
function punchHoles(rgba, w, h) {
  const seen = new Uint8Array(w * h)
  const pureWhite = (i) => {
    const o = i * 4
    const mn = Math.min(rgba[o], rgba[o + 1], rgba[o + 2])
    const mx = Math.max(rgba[o], rgba[o + 1], rgba[o + 2])
    return rgba[o + 3] > 0 && mn >= 246 && mx - mn <= 8
  }
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || !pureWhite(start)) continue
    const pixels = []
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const p = stack.pop()
      pixels.push(p)
      const x = p % w
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h || seen[q] || !pureWhite(q)) continue
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue
        seen[q] = 1
        stack.push(q)
      }
    }
    if (pixels.length >= 40) for (const p of pixels) rgba[p * 4 + 3] = 0
  }
}

/** Светлая кайма от белого листа: светлые пиксели на краю прозрачности убираются (2 прохода). */
function defringe(rgba, w, h) {
  for (let pass = 0; pass < 2; pass++) {
    const drop = []
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x
        const o = i * 4
        if (rgba[o + 3] === 0) continue
        if (Math.min(rgba[o], rgba[o + 1], rgba[o + 2]) < 205) continue
        const edge =
          x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
          rgba[o - 1] === 0 || rgba[o + 7] === 0 || rgba[o - w * 4 + 3] === 0 || rgba[o + w * 4 + 3] === 0
        if (edge) drop.push(o)
      }
    }
    for (const o of drop) rgba[o + 3] = 0
  }
}

const aspects = {}
for (const [id, items] of Object.entries(SHEETS)) {
  const sheet = path.join(srcDir, `hs-items-${id}.jpg`)
  const { data, info } = await sharp(sheet).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const { blobs, label } = findBlobs(data, w, h)
  const big = blobs.sort((a, b) => b.area - a.area).slice(0, items.length)
  if (big.length !== items.length) throw new Error(`${id}: найдено ${big.length} предметов вместо ${items.length}`)
  const midY = big.reduce((s, b) => s + (b.y0 + b.y1) / 2, 0) / big.length
  const rows = [big.filter((b) => (b.y0 + b.y1) / 2 < midY), big.filter((b) => (b.y0 + b.y1) / 2 >= midY)]
  const ordered = rows.flatMap((row) => row.sort((a, b) => a.x0 - b.x0))
  for (const [i, blob] of ordered.entries()) {
    const bw = blob.x1 - blob.x0 + 1
    const bh = blob.y1 - blob.y0 + 1
    const rgba = new Uint8Array(bw * bh * 4)
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const si = (blob.y0 + y) * w + blob.x0 + x
        const s = si * 3
        const o = (y * bw + x) * 4
        rgba[o] = data[s]
        rgba[o + 1] = data[s + 1]
        rgba[o + 2] = data[s + 2]
        rgba[o + 3] = label[si] === blob.id ? 255 : 0
      }
    }
    knockOutEdgeWhite(rgba, bw, bh, 22)
    punchHoles(rgba, bw, bh)
    defringe(rgba, bw, bh)
    const out = path.join(outDir, 'items', `${id}-${items[i]}.png`)
    await sharp(Buffer.from(rgba), { raw: { width: bw, height: bh, channels: 4 } })
      .trim()
      .resize(ITEM_MAX, ITEM_MAX, { fit: 'inside', kernel: 'lanczos3', withoutEnlargement: false })
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(out)
    const meta = await sharp(out).metadata()
    aspects[`${id}-${items[i]}`] = Math.round((meta.width / meta.height) * 1000) / 1000
  }
  console.log(`${id}: ${items.length} предметов`)
}

const aspectLines = Object.entries(aspects).map(([key, value]) => `  '${key}': ${value},`)
await writeFile(
  path.join(root, 'src', 'games', 'hide-seek', 'item-aspect.ts'),
  [
    '/** Ширина / высота картинок предметов. Файл пишет `npm run assets:hide-seek` — руками не править. */',
    'export const ITEM_ASPECT: Readonly<Record<string, number>> = {',
    ...aspectLines,
    '}',
    '',
  ].join('\n'),
)
console.log(`item-aspect.ts: ${aspectLines.length}`)

const iconsSrc = path.join(srcDir, 'icons')
const iconsOut = path.join(root, 'public', 'assets', 'games', 'creative', 'icons')
for (const file of (await readdir(iconsSrc)).filter((f) => /\.jpe?g$/i.test(f)).sort()) {
  const { data, info } = await sharp(path.join(iconsSrc, file))
    .rotate()
    .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rgba = new Uint8Array(data)
  knockOutEdgeWhite(rgba, info.width, info.height, 18)
  const trimmed = await sharp(Buffer.from(rgba), { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png()
    .toBuffer()
  const out = path.join(iconsOut, file.replace(/\.jpe?g$/i, '.png'))
  await sharp(trimmed).resize(256, 256, { fit: 'inside' }).png({ compressionLevel: 9, effort: 10 }).toFile(out)
  console.log(`icon ${path.relative(root, out)}`)
}
