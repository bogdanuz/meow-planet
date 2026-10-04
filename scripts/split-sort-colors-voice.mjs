/**
 * Нарезка озвучки «Куда положить?» → public/assets/games/sort-colors/voice/*.mp3.
 * Порядок и имена — из docs/assets/sort-colors-VOICE-SCRIPT.md (= phrases.ts, сверяет unit-тест).
 * Источник: assets-master/games/sort-colors/sort-colors-voice-reel.mp3
 *   или части sort-colors-voice-reel-1.mp3, -2.mp3… (склеиваются по порядку номеров).
 *
 * Алгоритм владельца (01.10.2026):
 * 1. silencedetect −40 dB, ≥ 0.25 с; 2. ровно N−1 пауз — разрезы (выбор — см. alignByText);
 * 3. по времени → N фрагментов; 4. n-й фрагмент = n-я строка скрипта;
 * 5. тишина по краям обрезана, остаётся 60/90 мс; 6. одинаковая громкость; mp3 моно.
 *
 * Сначала режет во временную папку и печатает таблицу. В public/ кладёт только если
 * проверки прошли; иначе выходит с кодом 1 и ничего не трогает.
 * Запуск: node scripts/split-sort-colors-voice.mjs [--longest] [--force]
 */
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import os from 'node:os'
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
const outDir = path.join(root, 'public', 'assets', 'games', 'sort-colors', 'voice')
const masterDir = path.join(root, 'assets-master', 'games', 'sort-colors')
const scriptDoc = path.join(root, 'docs', 'assets', 'sort-colors-VOICE-SCRIPT.md')
const workDir = path.join(os.tmpdir(), 'sort-colors-voice-cut')
const reportFile = path.join(workDir, 'report.md')

const SILENCE_DB = -40
const SILENCE_MIN = 0.25
const PAD_HEAD = 0.06
const PAD_TAIL = 0.09
const TARGET_MEAN_DB = -20
const PEAK_LIMIT_DB = -1
const MIN_LEN = 0.3
const ONE_WORD_MAX = 2.0
const TWO_PART_MIN = 1.5
/** Темп речи (букв/с) вне [медиана × LOW, медиана × HIGH] — признак сдвига разрезов (фразы от 3 слов). */
const RATE_LOW = 0.55
const RATE_HIGH = 1.8

const force = process.argv.includes('--force')
/**
 * По умолчанию (ЗАФИКСИРОВАНО 01.10.2026): паузы между фразами и внутри («Это мячик. | Ему нужен…»)
 * пересекаются по длине, поэтому разрезы выбираются так, чтобы длительность каждого куска совпала
 * с ожидаемой по тексту (буквы × темп), а внутри кусков оставались паузы покороче.
 * --longest — N−1 самых длинных пауз (на треке 01.10.2026 дал 14 аномалий).
 */
const alignByText = !process.argv.includes('--longest')

/** Динамика: острова речи → N подряд идущих групп; минимум Σ(лог-ошибка длительности)² + α·Σ пауз внутри групп. */
function alignCutsByText(gaps, lines, speechStart, speechEnd) {
  const starts = [speechStart, ...gaps.map((g) => g.end)]
  const ends = [...gaps.map((g) => g.start), speechEnd]
  const m = starts.length
  const n = lines.length
  const gapPrefix = [0]
  for (const g of gaps) gapPrefix.push(gapPrefix.at(-1) + g.len)
  const counts = lines.map((l) => letters(l.text))
  let a = 0.15
  let b = 1 / 10.5
  const sigma = 0.22
  const alpha = 2.5
  let cutIdx = []
  for (let pass = 0; pass < 3; pass += 1) {
    const cost = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(Infinity))
    const back = Array.from({ length: n + 1 }, () => new Int32Array(m + 1).fill(-1))
    cost[0][0] = 0
    for (let k = 1; k <= n; k += 1) {
      const expected = a + b * counts[k - 1]
      for (let j = k; j <= m - (n - k); j += 1) {
        for (let i = k - 1; i < j; i += 1) {
          if (!Number.isFinite(cost[k - 1][i])) continue
          const dur = ends[j - 1] - starts[i]
          const fit = Math.log(dur / expected) / sigma
          const inside = gapPrefix[j - 1] - gapPrefix[i]
          const c = cost[k - 1][i] + fit * fit + alpha * inside
          if (c < cost[k][j]) {
            cost[k][j] = c
            back[k][j] = i
          }
        }
      }
    }
    const bounds = []
    for (let k = n, j = m; k > 0; k -= 1) {
      const i = back[k][j]
      bounds.unshift([i, j])
      j = i
    }
    cutIdx = bounds.slice(0, -1).map(([, j]) => j - 1)
    const xs = bounds.map((_, k) => counts[k])
    const ys = bounds.map(([i, j]) => ends[j - 1] - starts[i])
    const mx = xs.reduce((s, x) => s + x, 0) / n
    const my = ys.reduce((s, y) => s + y, 0) / n
    const sxy = xs.reduce((s, x, k) => s + (x - mx) * (ys[k] - my), 0)
    const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
    b = sxy / sxx
    a = my - b * mx
  }
  return cutIdx.map((idx) => gaps[idx])
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true })
    let err = ''
    child.stderr.on('data', (chunk) => {
      err += chunk.toString('utf8')
    })
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve(err) : reject(new Error(err || `ffmpeg exit ${code}`))))
  })
}

function runNode(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { cwd: root, stdio: 'inherit', windowsHide: true })
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${script} exit ${code}`))))
  })
}

function parseDuration(log) {
  const m = log.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
  if (!m) throw new Error('no duration')
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
}

function parseSilences(log, duration) {
  const starts = [...log.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])))
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]))
  return starts.map((start, i) => ({ start, end: ends[i] ?? duration }))
}

async function voiceLinesFromDoc() {
  const md = await readFile(scriptDoc, 'utf8')
  return [...md.matchAll(/^\|\s*`([a-z0-9-]+\.mp3)`\s*\|\s*(.+?)\s*\|\s*$/gm)].map((m, i) => ({
    order: i + 1,
    file: m[1],
    text: m[2].replace(/\\\|/g, '|'),
  }))
}

async function findReels() {
  const files = await readdir(masterDir).catch(() => [])
  if (files.includes('sort-colors-voice-reel.mp3')) return [path.join(masterDir, 'sort-colors-voice-reel.mp3')]
  return files
    .map((f) => ({ f, m: f.match(/^sort-colors-voice-reel-(\d+)\.mp3$/) }))
    .filter((x) => x.m)
    .sort((a, b) => Number(a.m[1]) - Number(b.m[1]))
    .map((x) => path.join(masterDir, x.f))
}

/** Один wav моно 44.1k: точные разрезы без сдвига mp3-кадров. */
async function decodeReel(reels) {
  const wav = path.join(workDir, 'reel.wav')
  if (reels.length === 1) {
    await runFfmpeg(['-y', '-hide_banner', '-i', reels[0], '-ac', '1', '-ar', '44100', wav])
  } else {
    const list = path.join(workDir, 'reels.txt')
    await writeFile(list, reels.map((r) => `file '${r.replace(/'/g, "'\\''")}'`).join('\n'))
    await runFfmpeg(['-y', '-hide_banner', '-f', 'concat', '-safe', '0', '-i', list, '-ac', '1', '-ar', '44100', wav])
  }
  return wav
}

async function volumeOf(wav, start, end) {
  const log = await runFfmpeg([
    '-hide_banner', '-ss', start.toFixed(3), '-to', end.toFixed(3), '-i', wav, '-af', 'volumedetect', '-f', 'null', '-',
  ])
  return {
    mean: Number(log.match(/mean_volume: (-?[\d.]+) dB/)?.[1] ?? -91),
    max: Number(log.match(/max_volume: (-?[\d.]+) dB/)?.[1] ?? -91),
  }
}

const letters = (text) => (text.match(/\p{L}/gu) ?? []).length
const words = (text) => text.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length
const isTwoPart = (text) => /[.!?…]\s+\p{Lu}/u.test(text)

const lines = await voiceLinesFromDoc()
if (lines.length === 0) throw new Error('no mp3 rows in VOICE-SCRIPT')
const reels = await findReels()
if (reels.length === 0) {
  console.log(`нет мастера озвучки в ${masterDir} (sort-colors-voice-reel.mp3 или -1.mp3, -2.mp3…)`)
  process.exit(0)
}

await rm(workDir, { recursive: true, force: true })
await mkdir(path.join(workDir, 'mp3'), { recursive: true })
const wav = await decodeReel(reels)

const log = await runFfmpeg([
  '-hide_banner', '-i', wav, '-af', `silencedetect=noise=${SILENCE_DB}dB:d=${SILENCE_MIN}`, '-f', 'null', '-',
])
const duration = parseDuration(log)
const silences = parseSilences(log, duration)
const edgeEps = 0.01
const lead = silences.find((s) => s.start <= edgeEps)
const trail = silences.find((s) => s.end >= duration - edgeEps)
const inner = silences.filter((s) => s !== lead && s !== trail).map((s) => ({ ...s, len: s.end - s.start }))
const cutsWanted = lines.length - 1
if (inner.length < cutsWanted) {
  console.error(`СТОП: пауз между фразами ${inner.length}, нужно ${cutsWanted}. Ничего не нарезано.`)
  process.exit(1)
}
const byLength = [...inner].sort((a, b) => b.len - a.len)
const cuts = alignByText
  ? alignCutsByText(inner, lines, lead ? lead.end : 0, trail ? trail.start : duration)
  : byLength.slice(0, cutsWanted).sort((a, b) => a.start - b.start)
const cutLens = cuts.map((c) => c.len).sort((a, b) => a - b)
const keptLens = inner.filter((s) => !cuts.includes(s)).map((s) => s.len).sort((a, b) => b - a)
const lastCut = { len: cutLens[0] }
const firstKept = keptLens.length ? { len: keptLens[0] } : null

const segments = []
for (let i = 0; i < lines.length; i += 1) {
  const prev = cuts[i - 1]
  const next = cuts[i]
  const speechStart = prev ? prev.end : lead ? lead.end : 0
  const speechEnd = next ? next.start : trail ? trail.start : duration
  const headRoom = prev ? (prev.end - prev.start) / 2 : speechStart
  const tailRoom = next ? (next.end - next.start) / 2 : duration - speechEnd
  segments.push({
    start: speechStart - Math.min(PAD_HEAD, headRoom),
    end: speechEnd + Math.min(PAD_TAIL, tailRoom),
    speech: speechEnd - speechStart,
  })
}

const rows = []
for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i]
  const seg = segments[i]
  const vol = await volumeOf(wav, seg.start, seg.end)
  const gain = Math.min(TARGET_MEAN_DB - vol.mean, PEAK_LIMIT_DB - vol.max)
  await runFfmpeg([
    '-y', '-hide_banner', '-ss', seg.start.toFixed(3), '-to', seg.end.toFixed(3), '-i', wav,
    '-af', `volume=${gain.toFixed(2)}dB`, '-ac', '1', '-ar', '44100', '-b:a', '128k',
    path.join(workDir, 'mp3', line.file),
  ])
  rows.push({ ...line, ...seg, len: seg.end - seg.start, gain, peakLimited: gain < TARGET_MEAN_DB - vol.mean - 0.05 })
}

const rates = rows.map((r) => letters(r.text) / Math.max(0.05, r.speech))
const sortedRates = [...rates].sort((a, b) => a - b)
const medianRate = sortedRates[Math.floor(sortedRates.length / 2)]
for (let i = 0; i < rows.length; i += 1) {
  const r = rows[i]
  r.rate = rates[i]
  r.flags = []
  if (r.len < MIN_LEN) r.flags.push(`короче ${MIN_LEN} с`)
  if (words(r.text) === 1 && r.len > ONE_WORD_MAX) r.flags.push(`одно слово длиннее ${ONE_WORD_MAX} с`)
  if (isTwoPart(r.text) && r.len < TWO_PART_MIN) r.flags.push(`двухсоставная короче ${TWO_PART_MIN} с`)
  if (words(r.text) >= 3) {
    if (r.rate < medianRate * RATE_LOW) r.flags.push(`темп ${r.rate.toFixed(1)} букв/с — медленно (склейка?)`)
    if (r.rate > medianRate * RATE_HIGH) r.flags.push(`темп ${r.rate.toFixed(1)} букв/с — быстро (обрезано?)`)
  }
}

const expected = new Set(lines.map((l) => l.file))
const written = new Set((await readdir(path.join(workDir, 'mp3'))).filter((f) => f.endsWith('.mp3')))
const problems = []
if (written.size !== lines.length) problems.push(`файлов ${written.size}, нужно ${lines.length}`)
for (const f of expected) if (!written.has(f)) problems.push(`нет файла ${f}`)
const flagged = rows.filter((r) => r.flags.length)
if (flagged.length) problems.push(`аномалий: ${flagged.length}`)

const md = [
  `# Нарезка озвучки sort-colors`,
  ``,
  `Режим: ${alignByText ? 'по тексту' : `${cutsWanted} самых длинных пауз (--longest)`}`,
  `Трек ${duration.toFixed(1)} с · пауз ≥ ${SILENCE_MIN} с при ${SILENCE_DB} dB: ${inner.length} (+ края) · разрезов ${cuts.length}`,
  `Самая короткая пауза-разрез ${lastCut.len.toFixed(3)} с, самая длинная пауза внутри фразы ${firstKept ? firstKept.len.toFixed(3) : '—'} с`,
  `Медианный темп ${medianRate.toFixed(1)} букв/с · громкость: средняя ${TARGET_MEAN_DB} dB, пик ≤ ${PEAK_LIMIT_DB} dB`,
  ``,
  `| # | Файл | Длит., с | Темп | Текст | Аномалия |`,
  `|---:|---|---:|---:|---|---|`,
  ...rows.map(
    (r) =>
      `| ${r.order} | \`${r.file}\` | ${r.len.toFixed(2)} | ${r.rate.toFixed(1)} | ${r.text} | ${r.flags.join('; ') || (r.peakLimited ? '(тише: упёрлись в пик)' : '')} |`,
  ),
  ``,
  problems.length ? `**СТОП:** ${problems.join('; ')}` : `**ОК:** все проверки прошли`,
].join('\n')
await writeFile(reportFile, md)
console.log(md.split('\n').slice(0, 5).join('\n'))
for (const r of flagged) console.log(`  #${r.order} ${r.file} ${r.len.toFixed(2)} с «${r.text}» — ${r.flags.join('; ')}`)
console.log(problems.length ? `СТОП: ${problems.join('; ')}` : 'ОК: все проверки прошли')
console.log(`полная таблица: ${reportFile}`)

if (problems.length && !force) {
  console.error('\nПроверки не сошлись — в public/ ничего не положено.')
  process.exit(1)
}

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })
for (const line of lines) await copyFile(path.join(workDir, 'mp3', line.file), path.join(outDir, line.file))
console.log(`\nwrote ${lines.length} files → ${outDir}`)
await runNode(path.join('scripts', 'build-sort-colors-assets.mjs'))
