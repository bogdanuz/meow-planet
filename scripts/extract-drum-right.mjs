import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ffmpegPath = require('ffmpeg-static')
const root = path.resolve(import.meta.dirname, '..')
const sfxDir = path.join(root, 'public', 'assets', 'games', 'sound-world', 'sfx')
const src = path.join(root, 'sg_203880.mp3')
const out = path.join(sfxDir, 'drum-right.mp3')

await new Promise((resolve, reject) => {
  const child = spawn(
    ffmpegPath,
    [
      '-y',
      '-ss',
      '0',
      '-i',
      src,
      '-t',
      '1.32',
      '-af',
      'afade=t=out:st=1.2:d=0.12',
      '-c:a',
      'libmp3lame',
      '-q:a',
      '4',
      out,
    ],
    { windowsHide: true },
  )
  let err = ''
  child.stderr.on('data', (c) => {
    err += c.toString('utf8')
  })
  child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err))))
})

const inventoryPath = path.join(sfxDir, 'inventory.json')
const filesPath = path.join(sfxDir, 'sfx-files.json')
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'))
const files = JSON.parse(await readFile(filesPath, 'utf8'))
if (!inventory.includes('drum-right')) inventory.push('drum-right')
inventory.sort()
files['drum-right'] = 'mp3'
await writeFile(inventoryPath, JSON.stringify(inventory, null, 2) + '\n')
await writeFile(filesPath, JSON.stringify(files, null, 2) + '\n')
console.log('drum-right written')
