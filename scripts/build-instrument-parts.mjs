/**
 * Новые барабаны + пианино (корпус + 7 клавиш) + дырка колокольчика.
 * node scripts/build-instrument-parts.mjs
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite, punchNearWhiteBand } from './knockout-white.mjs'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-master', 'games', 'sound-world')
const playDir = path.join(root, 'public', 'assets', 'games', 'sound-world', 'play')

function distWhite(r, g, b) {
  return Math.sqrt((r - 255) ** 2 + (g - 255) ** 2 + (b - 255) ** 2)
}

function featherAlpha(rgba, width, height) {
  const copy = Uint8Array.from(rgba)
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = (y * width + x) * 4
      if (copy[i + 3] < 8) continue
      let nearClear = false
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        if (copy[((y + dy) * width + (x + dx)) * 4 + 3] < 8) nearClear = true
      }
      if (nearClear) rgba[i + 3] = Math.min(rgba[i + 3], 140)
    }
  }
}

function cropBlob(rgba, width, height, blob, pad = 2) {
  const x0 = Math.max(0, blob.minX - pad)
  const y0 = Math.max(0, blob.minY - pad)
  const x1 = Math.min(width - 1, blob.maxX + pad)
  const y1 = Math.min(height - 1, blob.maxY + pad)
  const cw = x1 - x0 + 1
  const ch = y1 - y0 + 1
  const out = Buffer.alloc(cw * ch * 4)
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      const s = ((y0 + y) * width + (x0 + x)) * 4
      const o = (y * cw + x) * 4
      out[o] = rgba[s]
      out[o + 1] = rgba[s + 1]
      out[o + 2] = rgba[s + 2]
      out[o + 3] = rgba[s + 3]
    }
  }
  return { out, cw, ch, x0, y0 }
}

function findBlobs(rgba, width, height, minArea = 400) {
  const n = width * height
  const seen = new Uint8Array(n)
  const blobs = []
  const ink = (idx) => rgba[idx * 4 + 3] > 40
  for (let i = 0; i < n; i += 1) {
    if (seen[i] || !ink(i)) continue
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    let area = 0
    const stack = [i]
    seen[i] = 1
    while (stack.length) {
      const idx = stack.pop()
      const x = idx % width
      const y = (idx / width) | 0
      area += 1
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      for (const nidx of [idx - 1, idx + 1, idx - width, idx + width]) {
        if (nidx < 0 || nidx >= n || seen[nidx] || !ink(nidx)) continue
        seen[nidx] = 1
        stack.push(nidx)
      }
    }
    if (area >= minArea) blobs.push({ minX, minY, maxX, maxY, area })
  }
  return blobs
}

async function loadRaw(file) {
  const { data, info } = await sharp(file).rotate().ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  })
  return { rgba: new Uint8Array(data), w: info.width, h: info.height }
}

async function writePng(buf, w, h, file) {
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(file)
}

async function knockoutFile(input, output, { punchHole = false, punchBand = null } = {}) {
  const { rgba, w, h } = await loadRaw(input)
  knockOutEdgeWhite(rgba, w, h, 16)
  if (punchBand) {
    punchNearWhiteBand(rgba, w, h, punchBand)
  }
  if (punchHole) {
    for (let y = 0; y < Math.floor(h * 0.2); y += 1) {
      for (let x = Math.floor(w * 0.32); x < Math.floor(w * 0.68); x += 1) {
        const o = (y * w + x) * 4
        if (distWhite(rgba[o], rgba[o + 1], rgba[o + 2]) < 28) rgba[o + 3] = 0
      }
    }
    knockOutEdgeWhite(rgba, w, h, 14)
  }
  featherAlpha(rgba, w, h)
  const blobs = findBlobs(rgba, w, h, 200)
  const main = blobs.sort((a, b) => b.area - a.area)[0]
  if (!main) throw new Error(`no blob ${input}`)
  const crop = cropBlob(rgba, w, h, main, 4)
  await writePng(crop.out, crop.cw, crop.ch, output)
  const meta = await sharp(output).metadata()
  console.log(path.basename(output), meta.width, meta.height)
  return { width: meta.width, height: meta.height }
}

await mkdir(playDir, { recursive: true })

await knockoutFile(path.join(srcDir, 'snare-drum.jpg'), path.join(playDir, 'drum-snare.png'), {
  punchBand: { minYRatio: 0.58, minAlpha: 20, minLum: 228, chroma: 28 },
})
await knockoutFile(path.join(srcDir, 'bass-drum.jpg'), path.join(playDir, 'drum-kick.png'))
await knockoutFile(path.join(srcDir, 'tom-drum.jpg'), path.join(playDir, 'drum-tom.png'))
await knockoutFile(path.join(srcDir, 'bell-play.jpg'), path.join(playDir, 'bell.png'), {
  punchHole: true,
})

const piano2 = path.join(srcDir, 'piano2')
const pianoLayers = [
  ['piano-body-no-keys v2.png', 'piano-body.png'],
  ['piano-body-top.png', 'piano-lid.png'],
  ...Array.from({ length: 7 }, (_, index) => [`key ${index + 1}.png`, `key-${index + 1}.png`]),
]

for (const [fromName, toName] of pianoLayers) {
  const input = path.join(piano2, fromName)
  const output = path.join(playDir, toName)
  const before = await sharp(input).metadata()
  await sharp(input).png({ compressionLevel: 9, effort: 10 }).toFile(output)
  const after = await sharp(output).metadata()
  if (after.width !== before.width || after.height !== before.height) {
    throw new Error(`${toName} был масштабирован`)
  }
  console.log(toName, after.width, after.height)
}
