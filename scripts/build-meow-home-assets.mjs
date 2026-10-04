/**
 * Мастера «В гости» → public/assets/games/meow-home/
 * Запуск: npm run assets:meow-home
 *
 * assets-master/games/meow-home/
 *   mh-<room>-<day|night>.jpg, mh-yard-<season>-<day|night>.jpg, mh-kitchen-fridge-open.jpg (4:3)
 *     → bg/<name>.webp 2048×1536; дворы ещё → bg/yard-<season>-thumb.webp 480×360 (плитка «Сезон»).
 *   mh-<meow|olli>-f-<action>.jpg (4:3, два кадра: левая и правая половина на голубом)
 *     → <who>/f-<action>-1.webp, f-<action>-2.webp (вся клетка 576×864: масштаб и линия ступней общие).
 *   mh-<who>-stand.jpg (1:1) → <who>/stand.webp — основа на улице.
 *   mh-<who>-face-<mood>.jpg — правка мордочки → <who>/face-<mood>.webp: голова выше шеи, совмещена с основой.
 *   mh-<who>-wear-<item>.jpg — правка «надень вещь» → <who>/wear-<item>.webp (слой на холсте основы)
 *     и items/wear-<who>-<item>.webp (иконка для вешалки и корзинки).
 *     Правка сначала совмещается с основой (сдвиг + масштаб по частям тела, которые не меняются),
 *     потом в слой идут только пиксели, которых нет рядом на основе (сама вещь, без сдвинутых ушей и глаз).
 *   mh-items-*.jpg, mh-animals.jpg, mh-fx.jpg (на белом, сетка) → items/<name>.webp
 *   mh-bed-empty.jpg (левая половина) → items/bed.webp
 * Пропорции предметов → src/games/meow-home/art-aspect.ts (руками не править).
 * Проверочные картинки (основа + слои) → assets-master/games/meow-home/_review/ (в игру не идут).
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutKey } from './knockout-key.mjs'
import { knockOutEdgeWhite } from './knockout-white.mjs'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-master', 'games', 'meow-home')
const outDir = path.join(root, 'public', 'assets', 'games', 'meow-home')
const reviewDir = path.join(srcDir, '_review')
const WHO = ['meow', 'olli']

/** `--only=bg|frames|outdoor|items` — пересобрать одну часть, не трогая остальные. */
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7)
const part = (name) => !only || only.split(',').includes(name)

if (!only) await rm(outDir, { recursive: true, force: true })
for (const dir of ['bg', 'meow', 'olli', 'items']) await mkdir(path.join(outDir, dir), { recursive: true })
await mkdir(reviewDir, { recursive: true })

const files = (await readdir(srcDir)).filter((f) => f.endsWith('.jpg')).sort()
const master = (name) => path.join(srcDir, name)
const webpAlpha = { quality: 86, alphaQuality: 90, effort: 5 }

/* ---------- фоны ---------- */

const bgFiles = part('bg') ? files.filter((f) => /^mh-(hall|bath|kitchen|bedroom|yard-\w+)-(day|night)\.jpg$/.test(f) || f === 'mh-kitchen-fridge-open.jpg') : []
for (const file of bgFiles) {
  const name = file.replace(/^mh-/, '').replace(/\.jpg$/, '')
  await sharp(master(file)).rotate().resize(2048, 1536, { fit: 'cover', kernel: 'lanczos3' }).webp({ quality: 84 }).toFile(path.join(outDir, 'bg', `${name}.webp`))
  if (/^yard-\w+-day$/.test(name)) {
    await sharp(master(file)).rotate().resize(480, 360, { fit: 'cover' }).webp({ quality: 80 }).toFile(path.join(outDir, 'bg', `${name.replace('-day', '')}-thumb.webp`))
  }
}
console.log('фоны готовы')

/* ---------- общие помощники ---------- */

async function loadRgba(file) {
  const { data, info } = await sharp(file).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { rgba: new Uint8Array(data), w: info.width, h: info.height }
}

/** Цвет фона по четырём углам (у генератора голубой чуть плавает). */
function cornerKey(rgba, w, h) {
  const n = 24
  const sum = [0, 0, 0]
  let count = 0
  for (const [x0, y0] of [[0, 0], [w - n, 0], [0, h - n], [w - n, h - n]]) {
    for (let y = y0; y < y0 + n; y++) {
      for (let x = x0; x < x0 + n; x++) {
        const o = (y * w + x) * 4
        sum[0] += rgba[o]
        sum[1] += rgba[o + 1]
        sum[2] += rgba[o + 2]
        count++
      }
    }
  }
  return sum.map((v) => Math.round(v / count))
}

function knockOutBlue(img) {
  knockOutKey(img.rgba, img.w, img.h, cornerKey(img.rgba, img.w, img.h), 40, 72)
  return img
}

function crop(img, x0, y0, cw, ch) {
  const out = new Uint8Array(cw * ch * 4)
  for (let y = 0; y < ch; y++) out.set(img.rgba.subarray(((y0 + y) * img.w + x0) * 4, ((y0 + y) * img.w + x0 + cw) * 4), y * cw * 4)
  return { rgba: out, w: cw, h: ch }
}

function save(img, file, opts = webpAlpha) {
  return sharp(Buffer.from(img.rgba), { raw: { width: img.w, height: img.h, channels: 4 } }).webp(opts).toFile(file)
}

function alphaBox(img) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (img.rgba[(y * img.w + x) * 4 + 3] < 128) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  return { x0, y0, x1, y1 }
}

/* ---------- кадры дома ---------- */

/** Тень под кроватью на синем фоне остаётся голубым пятном — ниже ножек убираем синеватые пиксели. */
function dropBlueShadow(img, fromRatio) {
  const out = Buffer.from(img.rgba)
  for (let y = Math.floor(img.h * fromRatio); y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const i = (y * img.w + x) * 4
      if (out[i + 3] && out[i + 2] - out[i] > 40 && out[i + 2] >= out[i + 1]) out[i + 3] = 0
    }
  }
  return { ...img, rgba: out }
}
const BED_SHADOW_FROM = 0.8

let frameCount = 0
for (const file of part('frames') ? files.filter((f) => /^mh-(meow|olli)-f-[\w-]+\.jpg$/.test(f)) : []) {
  const [, who, action] = file.match(/^mh-(meow|olli)-f-([\w-]+)\.jpg$/)
  const sheet = knockOutBlue(await loadRgba(master(file)))
  const half = Math.floor(sheet.w / 2)
  for (const [i, x0] of [[1, 0], [2, half]]) {
    const cell = crop(sheet, x0, 0, half, sheet.h)
    await save(action === 'sleep' ? dropBlueShadow(cell, BED_SHADOW_FROM) : cell, path.join(outDir, who, `f-${action}-${i}.webp`))
    frameCount++
  }
}
console.log(`кадры дома: ${frameCount}`)

/* ---------- улица: основа, мордочки, одежда ---------- */

/** Билинейная выборка с совмещением: точка основы (x, y) ← правка ((x-c)/s + c - dx, ...). */
function warp(img, s, dx, dy) {
  const { w, h, rgba } = img
  const out = new Uint8Array(w * h * 4)
  const cx = w / 2
  const cy = h / 2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x - cx) / s + cx - dx
      const v = (y - cy) / s + cy - dy
      const xi = Math.floor(u)
      const yi = Math.floor(v)
      const o = (y * w + x) * 4
      if (xi < 0 || yi < 0 || xi >= w - 1 || yi >= h - 1) continue
      const fx = u - xi
      const fy = v - yi
      const a = (yi * w + xi) * 4
      const b = a + 4
      const c = a + w * 4
      const d = c + 4
      for (let k = 0; k < 4; k++) {
        out[o + k] = Math.round(
          rgba[a + k] * (1 - fx) * (1 - fy) + rgba[b + k] * fx * (1 - fy) + rgba[c + k] * (1 - fx) * fy + rgba[d + k] * fx * fy,
        )
      }
    }
  }
  return { rgba: out, w, h }
}

async function smallRgb(file, size) {
  const { data } = await sharp(file).rotate().removeAlpha().resize(size, size, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true })
  return data
}

/** Сдвиг и масштаб правки к основе по полосам `bands` (доли высоты персонажа), которые на правке не меняются. */
async function register(baseFile, editFile, box, bands) {
  const inBand = (yFrac) => bands.some(([a, b]) => yFrac >= a && yFrac <= b)
  const run = (M, E, size, scales, shifts, stepPx) => {
    const k = size / 1024
    const top = box.y0 * k
    const height = (box.y1 - box.y0) * k
    const x0 = Math.max(0, Math.floor((box.x0 - 40) * k))
    const x1 = Math.min(size - 1, Math.ceil((box.x1 + 40) * k))
    const pts = []
    for (let y = 0; y < size; y += stepPx) {
      if (!inBand((y - top) / height)) continue
      for (let x = x0; x <= x1; x += stepPx) pts.push(x, y)
    }
    const c = size / 2
    let best = { err: Infinity }
    for (const s of scales) {
      for (const [dx, dy] of shifts) {
        let err = 0
        for (let i = 0; i < pts.length; i += 2) {
          const x = pts[i]
          const y = pts[i + 1]
          const u = Math.round((x - c) / s + c - dx)
          const v = Math.round((y - c) / s + c - dy)
          if (u < 0 || v < 0 || u >= size || v >= size) {
            err += 255
            continue
          }
          const m = (y * size + x) * 3
          const e = (v * size + u) * 3
          err += Math.abs(M[m] - E[e]) + Math.abs(M[m + 1] - E[e + 1]) + Math.abs(M[m + 2] - E[e + 2])
        }
        if (err < best.err) best = { err, s, dx, dy }
      }
    }
    return best
  }
  const range = (a, b, step) => {
    const out = []
    for (let v = a; v <= b + 1e-9; v += step) out.push(Math.round(v * 10000) / 10000)
    return out
  }
  const grid = (r, step) => {
    const out = []
    for (const dx of range(-r, r, step)) for (const dy of range(-r, r, step)) out.push([dx, dy])
    return out
  }
  const M1 = await smallRgb(baseFile, 128)
  const E1 = await smallRgb(editFile, 128)
  const coarse = run(M1, E1, 128, range(0.9, 1.1, 0.01), grid(12, 1), 1)
  const M2 = await smallRgb(baseFile, 512)
  const E2 = await smallRgb(editFile, 512)
  const shifts = grid(4, 1).map(([dx, dy]) => [coarse.dx * 4 + dx, coarse.dy * 4 + dy])
  const fine = run(M2, E2, 512, range(coarse.s - 0.012, coarse.s + 0.012, 0.004), shifts, 2)
  return { s: fine.s, dx: fine.dx * 2, dy: fine.dy * 2 }
}

const dist3 = (a, i, b, j) => Math.abs(a[i] - b[j]) + Math.abs(a[i + 1] - b[j + 1]) + Math.abs(a[i + 2] - b[j + 2])

function dilate(mask, w, h, r) {
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue
      for (let yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r); yy++) {
        for (let xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) {
          if ((xx - x) ** 2 + (yy - y) ** 2 <= r * r) out[yy * w + xx] = 1
        }
      }
    }
  }
  return out
}

function erode(mask, w, h, r) {
  const inv = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) inv[i] = mask[i] ? 0 : 1
  const grown = dilate(inv, w, h, r)
  const out = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) out[i] = grown[i] ? 0 : 1
  return out
}

/** Связные куски маски (4-соседи). */
function components(mask, w, h, value = 1) {
  const label = new Int32Array(w * h)
  const list = []
  for (let start = 0; start < w * h; start++) {
    if (mask[start] !== value || label[start]) continue
    const id = list.length + 1
    const pixels = []
    const stack = [start]
    label[start] = id
    let border = false
    while (stack.length) {
      const p = stack.pop()
      pixels.push(p)
      const x = p % w
      const y = (p / w) | 0
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border = true
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
        if (q < 0 || q >= w * h || label[q] || mask[q] !== value) continue
        label[q] = id
        stack.push(q)
      }
    }
    list.push({ pixels, border })
  }
  return list
}

/** Слой вещи: пиксели правки, которых нет на основе рядом (в радиусе), в зоне вещи. */
function extractItem(base, edit, box, zone) {
  const { w, h } = base
  const B = base.rgba
  const E = edit.rgba
  const height = box.y1 - box.y0
  const R = 20
  const flat = new Uint8Array(w * h)
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const o = (y * w + x) * 4
      if (B[o + 3] < 128) continue
      let ok = true
      for (const q of [o - 8, o + 8, o - w * 8, o + w * 8]) if (B[q + 3] < 128 || dist3(B, o, B, q) > 45) ok = false
      if (ok) flat[y * w + x] = 1
    }
  }
  const mask = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const f = (y - box.y0) / height
    if (f < zone[0] || f > zone[1]) continue
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const o = i * 4
      if (E[o + 3] < 128) continue
      if (B[o + 3] >= 128 && dist3(E, o, B, o) < 54) continue
      let explained = false
      for (let yy = Math.max(0, y - R); yy <= Math.min(h - 1, y + R) && !explained; yy += 2) {
        for (let xx = Math.max(0, x - R); xx <= Math.min(w - 1, x + R); xx += 2) {
          const q = (yy * w + xx) * 4
          if (flat[yy * w + xx] && dist3(E, o, B, q) < 30) {
            explained = true
            break
          }
        }
      }
      if (!explained) mask[i] = 1
    }
  }
  let m = erode(mask, w, h, 1)
  m = dilate(m, w, h, 1)
  m = erode(dilate(m, w, h, 9), w, h, 9)
  for (const hole of components(m, w, h, 0)) {
    if (!hole.border && hole.pixels.length < 40000) for (const p of hole.pixels) m[p] = 1
  }
  for (const part of components(m, w, h, 1)) {
    if (part.pixels.length < 900) for (const p of part.pixels) m[p] = 0
  }
  m = dilate(m, w, h, 3)
  const out = new Uint8Array(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    if (!m[i]) continue
    const o = i * 4
    out[o] = E[o]
    out[o + 1] = E[o + 1]
    out[o + 2] = E[o + 2]
    out[o + 3] = E[o + 3]
  }
  return { rgba: out, w, h }
}

/** Голова с новой мордочкой: всё выше шеи из правки, к шее — мягкий переход. */
function extractHead(edit, neckY) {
  const { w, h } = edit
  const out = new Uint8Array(edit.rgba)
  const ramp = 24
  for (let y = 0; y < h; y++) {
    const k = y <= neckY - ramp ? 1 : y >= neckY + ramp ? 0 : (neckY + ramp - y) / (2 * ramp)
    for (let x = 0; x < w; x++) out[(y * w + x) * 4 + 3] = Math.round(out[(y * w + x) * 4 + 3] * k)
  }
  return { rgba: out, w, h }
}

function composite(layers) {
  const { w, h } = layers[0]
  const out = new Uint8Array(w * h * 4)
  for (const layer of layers) {
    for (let i = 0; i < w * h * 4; i += 4) {
      const a = layer.rgba[i + 3] / 255
      if (!a) continue
      const b = out[i + 3] / 255
      const oa = a + b * (1 - a)
      for (let k = 0; k < 3; k++) out[i + k] = Math.round((layer.rgba[i + k] * a + out[i + k] * b * (1 - a)) / oa)
      out[i + 3] = Math.round(oa * 255)
    }
  }
  return { rgba: out, w, h }
}

const WEAR = {
  hat: { anchor: [[0.5, 1]], zone: [-0.6, 0.42] },
  panama: { anchor: [[0.5, 1]], zone: [-0.6, 0.45] },
  glasses: { anchor: [[0.5, 1]], zone: [0.08, 0.48] },
  scarf: { anchor: [[0, 0.3], [0.9, 1]], zone: [0.28, 0.85] },
  mittens: { anchor: [[0, 0.32], [0.9, 1]], zone: [0.42, 0.95] },
  coat: { anchor: [[0, 0.3], [0.94, 1]], zone: [0.3, 1.02] },
  raincoat: { anchor: [[0, 0.3], [0.94, 1]], zone: [0.3, 1.02] },
  boots: { anchor: [[0, 0.72]], zone: [0.7, 1.12] },
  valenki: { anchor: [[0, 0.72]], zone: [0.7, 1.12] },
}
const NECK = { meow: 0.4, olli: 0.45 }
const OUTFITS = {
  winter: ['valenki', 'coat', 'mittens', 'scarf', 'hat'],
  rain: ['boots', 'raincoat'],
  summer: ['panama', 'glasses'],
}

for (const who of part('outdoor') ? WHO : []) {
  const baseFile = master(`mh-${who}-stand.jpg`)
  const base = knockOutBlue(await loadRgba(baseFile))
  const box = alphaBox(base)
  await save(base, path.join(outDir, who, 'stand.webp'))
  const layers = {}
  for (const file of files.filter((f) => f.startsWith(`mh-${who}-face-`) || f.startsWith(`mh-${who}-wear-`))) {
    const [, kind, name] = file.match(/^mh-\w+-(face|wear)-([\w-]+)\.jpg$/)
    const spec = kind === 'face' ? { anchor: [[0.5, 1]] } : WEAR[name]
    if (!spec) throw new Error(`${file}: нет правил слоя`)
    const reg = await register(baseFile, master(file), box, spec.anchor)
    const edit = warp(knockOutBlue(await loadRgba(master(file))), reg.s, reg.dx, reg.dy)
    const layer = kind === 'face' ? extractHead(edit, box.y0 + (box.y1 - box.y0) * NECK[who]) : extractItem(base, edit, box, spec.zone)
    await save(layer, path.join(outDir, who, `${kind}-${name}.webp`))
    layers[`${kind}-${name}`] = layer
    if (kind === 'wear') {
      const b = alphaBox(layer)
      if (b.x1 < 0) throw new Error(`${file}: вещь не нашлась`)
      await sharp(Buffer.from(crop(layer, b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1).rgba), {
        raw: { width: b.x1 - b.x0 + 1, height: b.y1 - b.y0 + 1, channels: 4 },
      })
        .resize(320, 320, { fit: 'inside' })
        .webp(webpAlpha)
        .toFile(path.join(outDir, 'items', `wear-${who}-${name}.webp`))
    }
    console.log(`${who} ${kind}-${name}: s=${reg.s} dx=${reg.dx} dy=${reg.dy}`)
  }
  const sheet = []
  for (const [key, layer] of Object.entries(layers)) sheet.push({ key, img: composite([base, layer]) })
  for (const [outfit, items] of Object.entries(OUTFITS)) {
    sheet.push({ key: outfit, img: composite([base, ...items.map((i) => layers[`wear-${i}`]).filter(Boolean)]) })
    sheet.push({ key: `${outfit}-cold`, img: composite([base, layers['face-cold'], ...items.map((i) => layers[`wear-${i}`]).filter(Boolean)].filter(Boolean)) })
  }
  const cell = 256
  const cols = 6
  const rows = Math.ceil(sheet.length / cols)
  const tiles = await Promise.all(
    sheet.map(async ({ img }, i) => ({
      input: await sharp(Buffer.from(img.rgba), { raw: { width: img.w, height: img.h, channels: 4 } }).resize(cell, cell).png().toBuffer(),
      left: (i % cols) * cell,
      top: Math.floor(i / cols) * cell,
    })),
  )
  await sharp({ create: { width: cols * cell, height: rows * cell, channels: 4, background: { r: 120, g: 170, b: 120, alpha: 1 } } })
    .composite(tiles)
    .jpeg({ quality: 88 })
    .toFile(path.join(reviewDir, `${who}-outdoor.jpg`))
  console.log(`${who}: улица готова (${sheet.map((s) => s.key).join(', ')})`)
}

/* ---------- предметы на белом ---------- */

const SHEETS = {
  'mh-items-bath.jpg': [3, ['toothbrush', 'paste', 'cup', 'soap', 'sponge', 'duck', 'towel', 'potty', 'foam', 'bubble', 'shower', 'brush']],
  'mh-items-kitchen.jpg': [3, ['porridge', 'milk', 'water', 'apple', 'cookie', 'fish', 'berries', 'cocoa', 'napkin', 'bowl', 'cheese', 'banana']],
  'mh-items-bedroom.jpg': [2, ['book', 'book-open', 'ball', 'blocks', 'pajama', 'teddy', 'pillow', 'car']],
  'mh-items-hall.jpg': [2, ['plaque-bath', 'plaque-kitchen', 'plaque-bedroom', 'plaque-yard', 'basket', 'umbrella-open', 'umbrella', 'hanger']],
  'mh-items-sky.jpg': [3, ['sun', 'cloud', 'raincloud', 'rainbow', 'moon', 'star', 'star-small', 'drop', 'snowflake', 'wind', 'pinwheel', 'weathervane']],
  'mh-items-yard1.jpg': [3, ['puddle', 'mushroom-red', 'mushroom-brown', 'flower-open', 'flower-bud', 'icicle', 'leaf-yellow', 'leaf-orange', 'leaf-red', 'leaf-pile', 'puddle-ice', 'bush']],
  'mh-items-yard2.jpg': [3, ['snow-1', 'snow-2', 'snow-3', 'carrot', 'snowman-melt', 'puddle-carrot', 'sled', 'boat', 'bucket', 'watering-can', 'icecream', 'icecream-melt']],
  'mh-items-yard3.jpg': [2, ['swing', 'kite', 'laundry', 'lamp-off', 'lamp-on', 'sandcastle', 'mold', 'frog']],
  'mh-animals.jpg': [2, ['bird', 'bird-fly', 'butterfly', 'butterfly-2', 'snail', 'squirrel', 'bullfinch', 'firefly']],
  'mh-fx.jpg': [2, ['thought', 'sparkle', 'steam', 'heart', 'splash', 'mud', 'pawprint', 'bubbles']],
}
const ITEM_MAX = 384
const ITEM_BIG = new Set(['rainbow', 'laundry', 'swing', 'leaf-pile', 'basket'])
const INK_BELOW = 238
/** Только у этих предметов белый лист виден сквозь ручку; у снеговика и облаков белое — сам предмет. */
const PUNCH = new Set(['basket', 'bucket', 'hanger', 'swing', 'watering-can', 'cup', 'cocoa', 'laundry'])

/** Делит центры пятен на `n` групп по самым большим промежуткам. */
function splitByGaps(values, n) {
  const sorted = [...values].sort((a, b) => a - b)
  const gaps = sorted.slice(1).map((v, i) => ({ at: (v + sorted[i]) / 2, size: v - sorted[i] }))
  return gaps.sort((a, b) => b.size - a.size).slice(0, n - 1).map((g) => g.at).sort((a, b) => a - b)
}

/** Дырки (ручка корзинки, ведёрка): островки чистого белого листа внутри предмета. */
function punchPaperWhite(rgba, w, h) {
  const paper = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const o = i * 4
    if (rgba[o + 3] && Math.min(rgba[o], rgba[o + 1], rgba[o + 2]) >= 250) paper[i] = 1
  }
  for (const island of components(paper, w, h, 1)) if (island.pixels.length >= 60) for (const p of island.pixels) rgba[p * 4 + 3] = 0
}

function lightFringe(rgba, w, h) {
  for (let pass = 0; pass < 2; pass++) {
    const drop = []
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4
        if (rgba[o + 3] === 0 || Math.min(rgba[o], rgba[o + 1], rgba[o + 2]) < 210) continue
        const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1 || rgba[o - 1] === 0 || rgba[o + 7] === 0 || rgba[o - w * 4 + 3] === 0 || rgba[o + w * 4 + 3] === 0
        if (edge) drop.push(o)
      }
    }
    for (const o of drop) rgba[o + 3] = 0
  }
}

const aspects = {}
async function saveItem(img, name) {
  const b = alphaBox(img)
  const piece = crop(img, b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1)
  const max = ITEM_BIG.has(name) ? 512 : ITEM_MAX
  const out = path.join(outDir, 'items', `${name}.webp`)
  await sharp(Buffer.from(piece.rgba), { raw: { width: piece.w, height: piece.h, channels: 4 } })
    .resize(max, max, { fit: 'inside', kernel: 'lanczos3' })
    .webp(webpAlpha)
    .toFile(out)
  aspects[name] = Math.round((piece.w / piece.h) * 1000) / 1000
}

for (const [file, [rowCount, names]] of part('items') ? Object.entries(SHEETS) : []) {
  const img = await loadRgba(master(file))
  const { w, h, rgba } = img
  const ink = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) if (Math.min(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]) < INK_BELOW) ink[i] = 1
  const blobs = components(dilate(ink, w, h, 3), w, h, 1)
    .filter((c) => c.pixels.length >= 60)
    .map((c) => {
      let sx = 0, sy = 0
      for (const p of c.pixels) {
        sx += p % w
        sy += (p / w) | 0
      }
      return { ...c, cx: sx / c.pixels.length, cy: sy / c.pixels.length }
    })
  const cols = names.length / rowCount
  const rowCuts = splitByGaps(blobs.map((b) => b.cy), rowCount)
  const rowOf = (b) => rowCuts.filter((c) => b.cy > c).length
  for (let r = 0; r < rowCount; r++) {
    const inRow = blobs.filter((b) => rowOf(b) === r)
    const colCuts = splitByGaps(inRow.map((b) => b.cx), cols)
    for (let c = 0; c < cols; c++) {
      const group = inRow.filter((b) => colCuts.filter((cut) => b.cx > cut).length === c)
      if (!group.length) throw new Error(`${file}: пусто в ряду ${r + 1}, колонке ${c + 1}`)
      const keep = new Uint8Array(w * h)
      for (const b of group) for (const p of b.pixels) keep[p] = 1
      for (const hole of components(keep, w, h, 0)) if (!hole.border) for (const p of hole.pixels) keep[p] = 1
      const out = { rgba: new Uint8Array(rgba), w, h }
      for (let i = 0; i < w * h; i++) if (!keep[i]) out.rgba[i * 4 + 3] = 0
      knockOutEdgeWhite(out.rgba, w, h, 20)
      if (PUNCH.has(names[r * cols + c])) punchPaperWhite(out.rgba, w, h)
      lightFringe(out.rgba, w, h)
      await saveItem(out, names[r * cols + c])
    }
  }
  console.log(`${file}: ${names.length} предметов`)
}

if (part('items')) {
  // Кровать — целая клетка без обрезки: тот же масштаб и линия пола, что у кадров сна.
  const bed = knockOutBlue(await loadRgba(master('mh-bed-empty.jpg')))
  const cell = dropBlueShadow(crop(bed, 0, 0, Math.floor(bed.w / 2), bed.h), BED_SHADOW_FROM)
  await sharp(Buffer.from(cell.rgba), { raw: { width: cell.w, height: cell.h, channels: 4 } })
    .webp(webpAlpha)
    .toFile(path.join(outDir, 'items', 'bed.webp'))
  aspects.bed = Math.round((cell.w / cell.h) * 1000) / 1000
  console.log('кровать готова')
}

const aspectLines = Object.entries(aspects)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, value]) => `  '${key}': ${value},`)
if (part('items')) await writeFile(
  path.join(root, 'src', 'games', 'meow-home', 'art-aspect.ts'),
  [
    '/** Ширина / высота картинок предметов. Файл пишет `npm run assets:meow-home` — руками не править. */',
    'export const ITEM_ASPECT: Readonly<Record<string, number>> = {',
    ...aspectLines,
    '}',
    '',
  ].join('\n'),
)
if (part('items')) console.log(`art-aspect.ts: ${aspectLines.length}`)
