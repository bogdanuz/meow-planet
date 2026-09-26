/**
 * Нарезка общего трека фраз balloon-pop → 39 mp3.
 * Запуск: node scripts/split-balloon-pop-voice.mjs
 */
import { mkdir, readdir, copyFile } from 'node:fs/promises'
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
const outDir = path.join(root, 'public', 'assets', 'games', 'balloon-pop', 'voice')
const masterDir = path.join(root, 'assets-master', 'games', 'balloon-pop')
const masterOut = path.join(masterDir, 'balloon-pop-voice-reel.mp3')

const BALLOON_VOICE_FILES = [
  'free-idle.mp3',
  'praise-free-01.mp3',
  'praise-free-02.mp3',
  'praise-free-03.mp3',
  'praise-free-04.mp3',
  'praise-task-done-01.mp3',
  'praise-task-done-02.mp3',
  'praise-task-done-03.mp3',
  'praise-step-01.mp3',
  'praise-step-02.mp3',
  'nudge-wrong-balloon.mp3',
  'task-color-red-direct.mp3',
  'task-color-orange-direct.mp3',
  'task-color-yellow-direct.mp3',
  'task-color-green-direct.mp3',
  'task-color-violet-direct.mp3',
  'task-color-red-together.mp3',
  'task-color-orange-together.mp3',
  'task-color-yellow-together.mp3',
  'task-color-green-together.mp3',
  'task-color-violet-together.mp3',
  'task-both-red.mp3',
  'task-both-orange.mp3',
  'task-both-yellow.mp3',
  'task-both-green.mp3',
  'task-both-violet.mp3',
  'task-big-red.mp3',
  'task-small-red.mp3',
  'task-big-orange.mp3',
  'task-small-orange.mp3',
  'task-big-yellow.mp3',
  'task-small-yellow.mp3',
  'task-big-green.mp3',
  'task-small-green.mp3',
  'task-big-violet.mp3',
  'task-small-violet.mp3',
  'task-big-any.mp3',
  'task-small-any.mp3',
  'task-two-big.mp3',
]

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
  for (let i = 0; i < n; i += 1) {
    out.push({ start: starts[i], end: ends[i], dur: ends[i] - starts[i] })
  }
  return out
}

function islandsFromSilences(silences, duration) {
  const islands = []
  let cursor = 0
  for (const s of silences) {
    if (s.start > cursor + 0.05) islands.push({ start: cursor, end: s.start })
    cursor = s.end
  }
  if (duration - cursor > 0.08) islands.push({ start: cursor, end: duration })
  return islands
}

function mergeToCount(islands, want) {
  if (islands.length === 0) throw new Error('no speech islands')
  const gaps = []
  for (let i = 0; i < islands.length - 1; i += 1) {
    gaps.push({
      i,
      dur: islands[i + 1].start - islands[i].end,
    })
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
  return merged
}

async function findSource() {
  const files = await readdir(root, { withFileTypes: true })
  const hit = files.find(
    (f) => f.isFile() && /набор всех фраз/i.test(f.name) && f.name.endsWith('.mp3'),
  )
  if (!hit) throw new Error('source reel mp3 not found in repo root')
  return path.join(root, hit.name)
}

const src = await findSource()
const detectLog = await runFfmpeg([
  '-hide_banner',
  '-i',
  src,
  '-af',
  'silencedetect=noise=-28dB:d=0.22',
  '-f',
  'null',
  '-',
])
const duration = parseDuration(detectLog)
const silences = parseSilences(detectLog)
const islands = islandsFromSilences(silences, duration)
const segments = mergeToCount(islands, BALLOON_VOICE_FILES.length)
if (segments.length !== BALLOON_VOICE_FILES.length) {
  throw new Error(`expected 39 segments, got ${segments.length}`)
}

await mkdir(outDir, { recursive: true })
await mkdir(masterDir, { recursive: true })
await copyFile(src, masterOut)

const pad = 0.04
for (let i = 0; i < segments.length; i += 1) {
  const start = Math.max(0, segments[i].start - pad)
  const end = Math.min(duration, segments[i].end + pad)
  const out = path.join(outDir, BALLOON_VOICE_FILES[i])
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
  const len = (end - start).toFixed(2)
  console.log(`${String(i + 1).padStart(2, '0')} ${BALLOON_VOICE_FILES[i]}  ${start.toFixed(2)}–${end.toFixed(2)}  (${len}s)`)
}

console.log(`wrote ${segments.length} files → ${outDir}`)
