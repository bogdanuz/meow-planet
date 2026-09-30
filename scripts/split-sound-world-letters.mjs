/**
 * Нарезка sources/games/sound-world/letters-ru.mp3 и letters-en.mp3 → letter-*.mp3
 * и замена корабля из sources/games/sound-world/ship.mp3.
 */
import { copyFile, mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let ffmpegPath
try {
  ffmpegPath = require('ffmpeg-static')
} catch {
  ffmpegPath = 'ffmpeg'
}

const root = path.resolve(import.meta.dirname, '..')
const sourceDir = path.join(root, 'sources', 'games', 'sound-world')
const sfxDir = path.join(root, 'public', 'assets', 'games', 'sound-world', 'sfx')
const masterDir = path.join(root, 'assets-master', 'games', 'sound-world')

const RU = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('')
const EN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true })
    let err = ''
    child.stderr.on('data', (chunk) => {
      err += chunk.toString('utf8')
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(err || `ffmpeg exit ${code}`))
      else resolve(err)
    })
  })
}

function parseDuration(log) {
  const m = log.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
  if (!m) throw new Error('no duration')
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
}

function parseSilences(log) {
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]))
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]))
  const n = Math.min(starts.length, ends.length)
  const out = []
  for (let i = 0; i < n; i += 1) out.push({ start: starts[i], end: ends[i] })
  return out
}

function islandsFromSilences(silences, duration) {
  const islands = []
  let cursor = 0
  for (const s of silences) {
    if (s.start > cursor + 0.04) islands.push({ start: cursor, end: s.start })
    cursor = s.end
  }
  if (duration - cursor > 0.06) islands.push({ start: cursor, end: duration })
  return islands
}

function mergeToCount(islands, want, duration) {
  if (islands.length === 0) throw new Error('no speech islands')
  const gaps = []
  for (let i = 0; i < islands.length - 1; i += 1) {
    gaps.push({ i, dur: islands[i + 1].start - islands[i].end })
  }
  const keep = new Set(
    [...gaps]
      .sort((a, b) => b.dur - a.dur)
      .slice(0, Math.max(0, want - 1))
      .map((g) => g.i),
  )
  const merged = []
  let cur = { ...islands[0] }
  for (let i = 0; i < islands.length - 1; i += 1) {
    if (keep.has(i)) {
      merged.push(cur)
      cur = { ...islands[i + 1] }
    } else {
      cur.end = islands[i + 1].end
    }
  }
  merged.push(cur)
  return fatten(merged, duration)
}

function fatten(segments, duration, minLen = 0.34) {
  return segments.map((s, i) => {
    let { start, end } = s
    if (end - start >= minLen) return s
    const nextStart = i < segments.length - 1 ? segments[i + 1].start : duration
    const prevEnd = i > 0 ? segments[i - 1].end : 0
    const need = minLen - (end - start)
    const addAfter = Math.min((nextStart - end) * 0.65, need)
    end += addAfter
    start -= Math.min((start - prevEnd) * 0.35, Math.max(0, need - addAfter))
    return { start: Math.max(0, start), end: Math.min(duration, end) }
  })
}

function decodeMonoF32(src, rate) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      ffmpegPath,
      ['-hide_banner', '-i', src, '-ac', '1', '-ar', String(rate), '-f', 'f32le', '-'],
      { windowsHide: true },
    )
    const chunks = []
    child.stdout.on('data', (c) => chunks.push(c))
    child.stderr.on('data', () => {})
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`decode ${path.basename(src)}`))
      else resolve(Buffer.concat(chunks))
    })
  })
}

/** Пики речи: А и Б не сливаются; тихая «Й» не пропадает. */
function peaksFromEnergy(samples, rate, want) {
  const hop = Math.round(rate * 0.01)
  const rms = []
  for (let i = 0; i + hop <= samples.length; i += hop) {
    let s = 0
    for (let j = 0; j < hop; j += 1) s += samples[i + j] ** 2
    rms.push(Math.sqrt(s / hop))
  }
  const max = Math.max(...rms, 1e-9)
  const env = rms.map((v, i) => ({ t: i * (hop / rate), v: v / max }))
  const peaks = []
  for (let i = 2; i < env.length - 2; i += 1) {
    if (env[i].v < 0.2) continue
    if (env[i].v < env[i - 1].v || env[i].v < env[i + 1].v) continue
    const last = peaks[peaks.length - 1]
    if (last && env[i].t - last.t < 0.38) {
      if (env[i].v > last.v) peaks[peaks.length - 1] = env[i]
    } else {
      peaks.push(env[i])
    }
  }
  while (peaks.length > want) {
    let pair = 0
    let gap = Infinity
    for (let i = 0; i < peaks.length - 1; i += 1) {
      const g = peaks[i + 1].t - peaks[i].t
      if (g < gap) {
        gap = g
        pair = i
      }
    }
    const keep = peaks[pair].v >= peaks[pair + 1].v ? peaks[pair] : peaks[pair + 1]
    peaks.splice(pair, 2, keep)
  }
  if (peaks.length !== want) {
    throw new Error(`energy peaks: expected ${want}, got ${peaks.length}`)
  }
  return peaks
}

/** Длинные названия: «и-краткая», «твёрдый/мягкий знак». */
const LONG_TAIL = { Й: 1.5, Ъ: 1.4, Ь: 1.4 }

function segmentsFromPeaks(peaks, duration, labels) {
  return peaks.map((p, i) => {
    const extra = LONG_TAIL[labels[i]] ?? 0
    const prevMid = i === 0 ? 0 : (peaks[i - 1].t + p.t) / 2
    const last = i === peaks.length - 1
    const nextPeak = last ? duration : peaks[i + 1].t
    const limit = extra > 0 && !last ? nextPeak - 0.28 : last ? duration : nextPeak
    return {
      start: Math.max(prevMid, p.t - 0.2),
      end: Math.min(limit, p.t + 0.28 + extra),
    }
  })
}

async function splitRuByEnergy(src, labels, prefix) {
  const rate = 8000
  const buf = await decodeMonoF32(src, rate)
  const samples = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4))
  const duration = samples.length / rate
  const peaks = peaksFromEnergy(samples, rate, labels.length)
  const segments = segmentsFromPeaks(peaks, duration, labels)
  const cuts = {}
  const pad = 0.03
  for (let i = 0; i < labels.length; i += 1) {
    const start = Math.max(0, segments[i].start - pad)
    const end = Math.min(duration, segments[i].end + pad)
    cuts[labels[i]] = [Number(start.toFixed(3)), Number(end.toFixed(3))]
    const out = path.join(sfxDir, `${prefix}${labels[i]}.mp3`)
    await runFfmpeg([
      '-y',
      '-hide_banner',
      '-i',
      src,
      '-ss',
      start.toFixed(3),
      '-to',
      end.toFixed(3),
      '-ac',
      '1',
      '-ar',
      '44100',
      '-b:a',
      '128k',
      out,
    ])
    console.log(`${prefix}${labels[i]}  ${start.toFixed(2)}–${end.toFixed(2)}  (peak ${peaks[i].t.toFixed(2)})`)
  }
  await writeFile(path.join(sfxDir, 'letter-ru-cuts.json'), `${JSON.stringify(cuts, null, 2)}\n`)
}

async function splitReel(src, filter, labels, prefix) {
  const detectLog = await runFfmpeg([
    '-hide_banner',
    '-i',
    src,
    '-af',
    filter,
    '-f',
    'null',
    '-',
  ])
  const duration = parseDuration(detectLog)
  const islands = islandsFromSilences(parseSilences(detectLog), duration)
  const segments = mergeToCount(islands, labels.length, duration)
  if (segments.length !== labels.length) {
    throw new Error(`${path.basename(src)}: expected ${labels.length} letters, got ${segments.length}`)
  }
  const pad = 0.03
  for (let i = 0; i < labels.length; i += 1) {
    const start = Math.max(0, segments[i].start - pad)
    const end = Math.min(duration, segments[i].end + pad)
    const out = path.join(sfxDir, `${prefix}${labels[i]}.mp3`)
    await runFfmpeg([
      '-y',
      '-hide_banner',
      '-i',
      src,
      '-ss',
      start.toFixed(3),
      '-to',
      end.toFixed(3),
      '-ac',
      '1',
      '-ar',
      '44100',
      '-b:a',
      '128k',
      out,
    ])
    console.log(`${prefix}${labels[i]}  ${start.toFixed(2)}–${end.toFixed(2)}`)
  }
}

async function writeSfxIndex() {
  const names = await readdir(sfxDir)
  const ids = []
  const extById = {}
  for (const name of names) {
    const m = name.match(/^(.*)\.(mp3|ogg|wav)$/i)
    if (!m) continue
    const id = m[1]
    const ext = m[2].toLowerCase()
    if (extById[id] === 'mp3' && ext !== 'mp3') continue
    ids.push(id)
    extById[id] = ext
  }
  const unique = [...new Set(ids)].sort((a, b) => a.localeCompare(b, 'ru'))
  await writeFile(path.join(sfxDir, 'inventory.json'), JSON.stringify(unique))
  const files = {}
  for (const id of unique) files[id] = extById[id]
  await writeFile(path.join(sfxDir, 'sfx-files.json'), JSON.stringify(files))
}

await mkdir(sfxDir, { recursive: true })
await mkdir(masterDir, { recursive: true })

const ruSrc = path.join(sourceDir, 'letters-ru.mp3')
const enSrc = path.join(sourceDir, 'letters-en.mp3')
const shipSrc = path.join(sourceDir, 'ship.mp3')

await copyFile(ruSrc, path.join(masterDir, 'letters-ru-voice.mp3'))
await copyFile(enSrc, path.join(masterDir, 'letters-en-voice.mp3'))
await copyFile(shipSrc, path.join(masterDir, 'ship.mp3'))

await splitRuByEnergy(ruSrc, RU, 'letter-ru-')
await splitReel(enSrc, 'silencedetect=noise=-32dB:d=0.14', EN, 'letter-en-')

await copyFile(shipSrc, path.join(sfxDir, 'ship.mp3'))
try {
  await unlink(path.join(sfxDir, 'ship.ogg'))
} catch {
  // old clip may already be gone
}

const leftovers = await readdir(sfxDir)
for (const name of leftovers) {
  if (/^letter-(ru|en)-.+\.wav$/i.test(name)) {
    await unlink(path.join(sfxDir, name))
  }
}

await writeSfxIndex()
console.log('sound-world letter + ship sfx ready')
