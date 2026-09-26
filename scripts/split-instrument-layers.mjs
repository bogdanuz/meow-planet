import sharp from 'sharp'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const play = path.join(root, 'public', 'assets', 'games', 'sound-world', 'play')

function idx(x, y, w) {
  return (y * w + x) * 4
}

function inEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx
  const dy = (y - cy) / ry
  return dx * dx + dy * dy <= 1
}

async function loadRaw(file) {
  const img = sharp(file)
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data: new Uint8Array(data), w: info.width, h: info.height }
}

async function writeMask(outFile, data, w, h, keep) {
  let minX = w
  let minY = h
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!keep[y * w + x]) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (maxX < minX) throw new Error(`empty mask ${outFile}`)
  const pad = 2
  const x0 = Math.max(0, minX - pad)
  const y0 = Math.max(0, minY - pad)
  const x1 = Math.min(w - 1, maxX + pad)
  const y1 = Math.min(h - 1, maxY + pad)
  const cw = x1 - x0 + 1
  const ch = y1 - y0 + 1
  const out = Buffer.alloc(cw * ch * 4)
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      const sx = x0 + x
      const sy = y0 + y
      if (!keep[sy * w + sx]) continue
      const s = idx(sx, sy, w)
      const o = (y * cw + x) * 4
      out[o] = data[s]
      out[o + 1] = data[s + 1]
      out[o + 2] = data[s + 2]
      out[o + 3] = data[s + 3]
    }
  }
  await sharp(out, { raw: { width: cw, height: ch, channels: 4 } }).png().toFile(outFile)
  return { file: path.basename(outFile), left: x0 / w, top: y0 / h, width: cw / w, height: ch / h }
}

const drum = await loadRaw(path.join(play, 'drum.png'))
const { w, h, data } = drum
const snare = new Uint8Array(w * h)
const kick = new Uint8Array(w * h)
const tom = new Uint8Array(w * h)

for (let y = 0; y < h; y += 1) {
  for (let x = 0; x < w; x += 1) {
    if (data[idx(x, y, w) + 3] < 20) continue
    const inSnare = inEllipse(x, y, w * 0.155, h * 0.835, w * 0.175, h * 0.2)
    const inTom = inEllipse(x, y, w * 0.82, h * 0.655, w * 0.2, h * 0.36)
    const inKick = inEllipse(x, y, w * 0.37, h * 0.4, w * 0.38, h * 0.44)
    if (inSnare && !inKick) snare[y * w + x] = 1
    else if (inSnare && y > h * 0.62) snare[y * w + x] = 1
    else if (inTom && x > w * 0.62) tom[y * w + x] = 1
    else if (inKick) kick[y * w + x] = 1
    else if (x < w * 0.32 && y > h * 0.58) snare[y * w + x] = 1
    else if (x > w * 0.62) tom[y * w + x] = 1
    else kick[y * w + x] = 1
  }
}

const layout = {
  'drum-snare': await writeMask(path.join(play, 'drum-snare.png'), data, w, h, snare),
  'drum-kick': await writeMask(path.join(play, 'drum-kick.png'), data, w, h, kick),
  'drum-tom': await writeMask(path.join(play, 'drum-tom.png'), data, w, h, tom),
}

console.log(JSON.stringify({ w, h, layout }, null, 2))
