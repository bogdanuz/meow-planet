/**
 * Нарезка озвучки «Учимся считать» → public/assets/games/counting/voice/*.mp3 (тот же способ, что «Прятки»).
 * Порядок и имена — из docs/assets/counting-VOICE-SCRIPT.md (= phrases.ts, сверяет unit-тест).
 * Источник: assets-master/games/counting/counting-voice-reel.mp3 (+ counting-voice-reel-2.mp3 / «… 2.mp3»…);
 *   каждый трек режется отдельно на свои строки (`--parts`, см. parseParts).
 *
 * Алгоритм владельца (01.10.2026):
 * 1. silencedetect −40 dB, ≥ 0.25 с; 2. ровно N−1 пауз — разрезы (выбор — см. alignByText);
 * 3. по времени → N фрагментов; 4. n-й фрагмент = n-я строка скрипта;
 * 5. тишина по краям обрезана, остаётся 60/90 мс; 6. одинаковая громкость; mp3 моно.
 *
 * Сначала режет во временную папку и печатает таблицу. В public/ кладёт только если
 * проверки прошли; иначе выходит с кодом 1 и ничего не трогает.
 * Запуск: node scripts/split-counting-voice.mjs [--parts=1-180:cut,180-232 | --first=N] [--min=0.1] [--longest] [--force]
 * Треки 03.10.2026: --parts=1-180:cut,180-232 (первый оборван на строке 181, второй начат со строки 180).
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
const outDir = path.join(root, 'public', 'assets', 'games', 'counting', 'voice')
const masterDir = path.join(root, 'assets-master', 'games', 'counting')
const scriptDoc = path.join(root, 'docs', 'assets', 'counting-VOICE-SCRIPT.md')
const workDir = path.join(os.tmpdir(), 'counting-voice-cut')
const reportFile = path.join(workDir, 'report.md')

const SILENCE_DB = -40
/** Трек 03.10.2026: ~60 пауз между фразами короче 0.25 с (числа читались быстро) — разрезы ищутся по тексту среди пауз от 0.1 с. */
const SILENCE_MIN = Number(process.argv.find((a) => a.startsWith('--min='))?.slice(6) ?? 0.1)
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

/** y ≈ a + b·x + c·z по МНК (3×3, Крамер); null — вырожденно. */
function leastSquares3(xs, zs, ys) {
  const s = { n: 0, x: 0, z: 0, xx: 0, zz: 0, xz: 0, y: 0, xy: 0, zy: 0 }
  xs.forEach((x, k) => {
    const z = zs[k]
    const y = ys[k]
    s.n += 1; s.x += x; s.z += z; s.xx += x * x; s.zz += z * z; s.xz += x * z; s.y += y; s.xy += x * y; s.zy += z * y
  })
  const det3 = (m) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  const M = [[s.n, s.x, s.z], [s.x, s.xx, s.xz], [s.z, s.xz, s.zz]]
  const v = [s.y, s.xy, s.zy]
  const d = det3(M)
  if (Math.abs(d) < 1e-9) return null
  return [0, 1, 2].map((col) => det3(M.map((row, r) => row.map((val, cIdx) => (cIdx === col ? v[r] : val)))) / d)
}

/** Динамика: острова речи → N подряд идущих групп; минимум Σ(лог-ошибка длительности)² + α·Σ пауз внутри групп. */
function alignCutsByText(gaps, lines, speechStart, speechEnd) {
  const starts = [speechStart, ...gaps.map((g) => g.end)]
  const ends = [...gaps.map((g) => g.start), speechEnd]
  const m = starts.length
  const n = lines.length
  const gapPrefix = [0]
  for (const g of gaps) gapPrefix.push(gapPrefix.at(-1) + g.len)
  const counts = lines.map((l) => letters(l.text))
  /** Паузы внутри фразы («Было пять, | стало шесть!») длиннее паузы между словами — считаются отдельно. */
  const breaks = lines.map((l) => (l.text.match(/[,.!?…]\s+\S/gu) ?? []).length)
  let a = 0.3
  let b = 1 / 13
  let c = 0.4
  const sigma = 0.22
  const alpha = 2.5
  let cutIdx = []
  for (let pass = 0; pass < 4; pass += 1) {
    const cost = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(Infinity))
    const back = Array.from({ length: n + 1 }, () => new Int32Array(m + 1).fill(-1))
    cost[0][0] = 0
    for (let k = 1; k <= n; k += 1) {
      const expected = Math.max(0.25, a + b * counts[k - 1] + c * breaks[k - 1])
      for (let j = k; j <= m - (n - k); j += 1) {
        for (let i = k - 1; i < j; i += 1) {
          if (!Number.isFinite(cost[k - 1][i])) continue
          const dur = Math.max(0.05, ends[j - 1] - starts[i])
          const fit = Math.log(dur / expected) / sigma
          const inside = gapPrefix[j - 1] - gapPrefix[i]
          const total = cost[k - 1][i] + fit * fit + alpha * inside
          if (total < cost[k][j]) {
            cost[k][j] = total
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
    const ys = bounds.map(([i, j]) => ends[j - 1] - starts[i])
    const fit3 = leastSquares3(counts, breaks, ys)
    if (fit3 && fit3[1] > 0 && fit3[2] >= 0) [a, b, c] = fit3
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

/** Треки по порядку: `counting-voice-reel.mp3` (= 1), `counting-voice-reel-2.mp3` / `counting-voice-reel 2.mp3`… */
async function findReels() {
  const files = await readdir(masterDir).catch(() => [])
  return files
    .map((f) => ({ f, m: f.match(/^counting-voice-reel(?:[ _-](\d+))?\.mp3$/) }))
    .filter((x) => x.m)
    .map((x) => ({ f: x.f, n: Number(x.m[1] ?? 1) }))
    .sort((a, b) => a.n - b.n)
    .map((x) => path.join(masterDir, x.f))
}

/** Один wav моно 44.1k: точные разрезы без сдвига mp3-кадров. */
async function decodeReel(reel, index) {
  const wav = path.join(workDir, `reel-${index + 1}.wav`)
  await runFfmpeg(['-y', '-hide_banner', '-i', reel, '-ac', '1', '-ar', '44100', wav])
  return wav
}

/**
 * Какие строки скрипта в каком треке: `--parts=1-180:cut,180-232` (номера строк с 1, включительно).
 * `:cut` — трек оборван на середине следующей фразы, недоговорённый хвост отбрасывается.
 * Строка в двух треках — берётся из более позднего. По умолчанию один трек = все строки;
 * `--first=N` = `--parts=1-N:cut`.
 */
function parseParts(arg, total, reelCount) {
  if (!arg) return reelCount === 1 ? [{ from: 1, to: total, cut: false }] : null
  return arg.split(',').map((p) => {
    const m = p.match(/^(\d+)-(\d+)(:cut)?$/)
    if (!m) throw new Error(`--parts: не понял «${p}»`)
    return { from: Number(m[1]), to: Number(m[2]), cut: Boolean(m[3]) }
  })
}

/** Режет один трек на строки `lines` во временную папку; возвращает строки отчёта и сводку трека. */
async function sliceReel(wav, lines, cut, reelName) {
  const log = await runFfmpeg([
    '-hide_banner', '-i', wav, '-af', `silencedetect=noise=${SILENCE_DB}dB:d=${SILENCE_MIN}`, '-f', 'null', '-',
  ])
  const duration = parseDuration(log)
  const silences = parseSilences(log, duration)
  const edgeEps = 0.01
  const lead = silences.find((s) => s.start <= edgeEps)
  let trail = silences.find((s) => s.end >= duration - edgeEps)
  const inner = silences.filter((s) => s !== lead && s !== trail).map((s) => ({ ...s, len: s.end - s.start }))
  if (cut && !trail) {
    const idx = inner.findLastIndex((s) => s.len >= 0.5)
    if (idx >= 0) trail = inner.splice(idx)[0]
  }
  const cutsWanted = lines.length - 1
  if (inner.length < cutsWanted) {
    throw new Error(`${reelName}: пауз между фразами ${inner.length}, нужно ${cutsWanted}. Ничего не нарезано.`)
  }
  const byLength = [...inner].sort((a, b) => b.len - a.len)
  const cuts = alignByText
    ? alignCutsByText(inner, lines, lead ? lead.end : 0, trail ? trail.start : duration)
    : byLength.slice(0, cutsWanted).sort((a, b) => a.start - b.start)
  const cutLens = cuts.map((c) => c.len).sort((a, b) => a - b)
  const keptLens = inner.filter((s) => !cuts.includes(s)).map((s) => s.len).sort((a, b) => b - a)

  const rows = []
  for (let i = 0; i < lines.length; i += 1) {
    const prev = cuts[i - 1]
    const next = cuts[i]
    const speechStart = prev ? prev.end : lead ? lead.end : 0
    const speechEnd = next ? next.start : trail ? trail.start : duration
    const headRoom = prev ? (prev.end - prev.start) / 2 : speechStart
    const tailRoom = next ? (next.end - next.start) / 2 : duration - speechEnd
    const seg = {
      start: speechStart - Math.min(PAD_HEAD, headRoom),
      end: speechEnd + Math.min(PAD_TAIL, tailRoom),
      speech: speechEnd - speechStart,
    }
    const line = lines[i]
    const vol = await volumeOf(wav, seg.start, seg.end)
    const gain = Math.min(TARGET_MEAN_DB - vol.mean, PEAK_LIMIT_DB - vol.max)
    await runFfmpeg([
      '-y', '-hide_banner', '-ss', seg.start.toFixed(3), '-to', seg.end.toFixed(3), '-i', wav,
      '-af', `volume=${gain.toFixed(2)}dB`, '-ac', '1', '-ar', '44100', '-b:a', '128k',
      path.join(workDir, 'mp3', line.file),
    ])
    rows.push({ ...line, ...seg, reel: reelName, len: seg.end - seg.start, gain, peakLimited: gain < TARGET_MEAN_DB - vol.mean - 0.05 })
  }
  const summary =
    `${reelName}: ${duration.toFixed(1)} с · строки ${lines[0].order}–${lines.at(-1).order} · пауз ≥ ${SILENCE_MIN} с при ${SILENCE_DB} dB: ` +
    `${inner.length} · разрезов ${cuts.length} · самая короткая пауза-разрез ${cutLens.length ? cutLens[0].toFixed(3) : '—'} с, ` +
    `самая длинная внутри фразы ${keptLens.length ? keptLens[0].toFixed(3) : '—'} с${cut ? ' · хвост оборван — отброшен' : ''}`
  return { rows, summary }
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

const allLines = await voiceLinesFromDoc()
if (allLines.length === 0) throw new Error('no mp3 rows in VOICE-SCRIPT')
const reels = await findReels()
if (reels.length === 0) {
  console.log(`нет мастера озвучки в ${masterDir} (counting-voice-reel.mp3, counting-voice-reel-2.mp3…)`)
  process.exit(0)
}
const firstArg = process.argv.find((a) => a.startsWith('--first='))?.slice(8)
const parts = parseParts(
  process.argv.find((a) => a.startsWith('--parts='))?.slice(8) ?? (firstArg ? `1-${firstArg}:cut` : undefined),
  allLines.length,
  reels.length,
)
if (!parts || parts.length !== reels.length) {
  console.error(`СТОП: треков ${reels.length} — укажите строки каждого: --parts=1-180:cut,180-232`)
  process.exit(1)
}

await rm(workDir, { recursive: true, force: true })
await mkdir(path.join(workDir, 'mp3'), { recursive: true })
const byFile = new Map()
const summaries = []
for (const [i, reel] of reels.entries()) {
  const wav = await decodeReel(reel, i)
  const { from, to, cut } = parts[i]
  const { rows: reelRows, summary } = await sliceReel(wav, allLines.slice(from - 1, to), cut, path.basename(reel))
  for (const r of reelRows) byFile.set(r.file, r)
  summaries.push(summary)
}
const lines = allLines.filter((l) => byFile.has(l.file))
const rows = lines.map((l) => byFile.get(l.file))

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
  `# Нарезка озвучки counting`,
  ``,
  `Режим: ${alignByText ? 'по тексту' : 'самые длинные паузы (--longest)'} · строк ${lines.length} из ${allLines.length}`,
  ...summaries.map((s) => `- ${s}`),
  `Медианный темп ${medianRate.toFixed(1)} букв/с · громкость: средняя ${TARGET_MEAN_DB} dB, пик ≤ ${PEAK_LIMIT_DB} dB`,
  ``,
  `| # | Файл | Трек | Длит., с | Темп | Текст | Аномалия |`,
  `|---:|---|---|---:|---:|---|---|`,
  ...rows.map(
    (r) =>
      `| ${r.order} | \`${r.file}\` | ${r.reel} | ${r.len.toFixed(2)} | ${r.rate.toFixed(1)} | ${r.text} | ${r.flags.join('; ') || (r.peakLimited ? '(тише: упёрлись в пик)' : '')} |`,
  ),
  ``,
  problems.length ? `**СТОП:** ${problems.join('; ')}` : `**ОК:** все проверки прошли`,
].join('\n')
await writeFile(reportFile, md)
console.log(md.split('\n').slice(0, 4 + summaries.length).join('\n'))
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
