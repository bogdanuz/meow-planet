import { spawn } from 'node:child_process'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ffmpegPath = require('ffmpeg-static')
const root = path.resolve(import.meta.dirname, '..')

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true })
    let err = ''
    child.stderr.on('data', (c) => {
      err += c.toString('utf8')
    })
    child.on('close', (code) => (code === 0 ? resolve(err) : reject(new Error(err.slice(-800)))))
  })
}

function parseDur(log) {
  const dm = log.match(/Duration: (\d+):(\d+):([\d.]+)/)
  return dm ? Number(dm[1]) * 3600 + Number(dm[2]) * 60 + Number(parseFloat(dm[3])) : 0
}

const files = {
  newDrum: path.join(root, 'sources', 'games', 'sound-world', 'drum-right.mp3'),
  maracas: path.join(root, 'public', 'assets', 'games', 'sound-world', 'sfx', 'maracas.mp3'),
}

for (const [k, file] of Object.entries(files)) {
  const log = await run([
    '-i',
    file,
    '-af',
    'silencedetect=noise=-32dB:d=0.05',
    '-f',
    'null',
    '-',
  ])
  const duration = parseDur(log)
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]))
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]))
  console.log(k, { duration, starts: starts.slice(0, 8), ends: ends.slice(0, 8) })
}
