/**
 * Нарезка mp3 инструментов из корня репо → public/.../sfx/
 * node scripts/split-sound-world-instruments.mjs
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
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
const sfxDir = path.join(root, 'public', 'assets', 'games', 'sound-world', 'sfx')

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

async function extract(inFile, outName, startSec, durationSec) {
  const out = path.join(sfxDir, outName)
  await runFfmpeg([
    '-y',
    '-ss',
    String(startSec),
    '-i',
    inFile,
    '-t',
    String(durationSec),
    '-af',
    'afade=t=out:st=' + Math.max(0, durationSec - 0.12) + ':d=0.12',
    '-c:a',
    'libmp3lame',
    '-q:a',
    '4',
    out,
  ])
  return out
}

async function copyTrim(inFile, outName, startSec, durationSec) {
  return extract(inFile, outName, startSec, durationSec)
}

const GUITAR_ISLANDS = [
  [0.73, 4.31],
  [19.19, 22.77],
  [37.52, 41.64],
  [55.04, 57.24],
  [72.7, 74.52],
  [86.75, 88.18],
]

const PIANO = [
  ['до', 'piano-do', 0.465, 2.85],
  ['ре', 'piano-re', 0, 3.05],
  ['ми', 'piano-mi', 0, 2.2],
  ['фа', 'piano-fa', 0.474, 2.3],
  ['соль', 'piano-sol', 0.436, 2.2],
  ['ля', 'piano-la', 0, 2.15],
  ['си', 'piano-si', 0, 3.15],
]

await mkdir(sfxDir, { recursive: true })

const drumKick = path.join(root, 'кик.mp3')
const drumSnare = path.join(root, 'снейр.mp3')
const drumTom = path.join(root, 'бас.mp3')

await copyTrim(drumKick, 'drum-kick.mp3', 0, 0.35)
await copyTrim(drumSnare, 'drum-snare.mp3', 0, 1.05)
await copyTrim(drumTom, 'drum-tom.mp3', 0.12, 2.4)
const drumRight = path.join(root, 'sg_203880.mp3')
await copyTrim(drumRight, 'drum-right.mp3', 0, 1.32)

for (const [ru, id, start, dur] of PIANO) {
  await copyTrim(path.join(root, `${ru}.mp3`), `${id}.mp3`, start, dur)
}

const guitarFiles = await readdir(root)
const guitarMaster = guitarFiles.find(
  (f) => f.includes('6') && f.includes('гитар') && f.endsWith('.mp3'),
)
if (!guitarMaster) throw new Error('guitar master mp3 not found')
const guitarPath = path.join(root, guitarMaster)

const guitarCuts = {}
for (let i = 0; i < GUITAR_ISLANDS.length; i += 1) {
  const stringNum = 6 - i
  const [start, end] = GUITAR_ISLANDS[i]
  const dur = end - start
  const id = `guitar-${stringNum}`
  await extract(guitarPath, `${id}.mp3`, start, dur)
  guitarCuts[stringNum] = [start, end]
}

await writeFile(
  path.join(sfxDir, 'instrument-cuts.json'),
  JSON.stringify({ guitar: guitarCuts, piano: PIANO, drums: ['drum-kick', 'drum-snare', 'drum-tom', 'drum-right'] }, null, 2),
)

const inventoryPath = path.join(sfxDir, 'inventory.json')
const filesPath = path.join(sfxDir, 'sfx-files.json')
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'))
const files = JSON.parse(await readFile(filesPath, 'utf8'))

const newIds = [
  'drum-kick',
  'drum-snare',
  'drum-tom',
  'drum-right',
  'piano-do',
  'piano-re',
  'piano-mi',
  'piano-fa',
  'piano-sol',
  'piano-la',
  'piano-si',
  'guitar-1',
  'guitar-2',
  'guitar-3',
  'guitar-4',
  'guitar-5',
  'guitar-6',
]

for (const id of newIds) {
  if (!inventory.includes(id)) inventory.push(id)
  files[id] = 'mp3'
}

inventory.sort()
await writeFile(inventoryPath, JSON.stringify(inventory, null, 2) + '\n')
await writeFile(filesPath, JSON.stringify(files, null, 2) + '\n')

console.log('instrument sfx written:', newIds.length)
