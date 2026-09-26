/**
 * assets-master/menu/ → public/assets/menu/
 * - card-*.jpg → PNG 1024, knockout белого, trim
 * - menu-visit-bed.jpg → PNG широкий, knockout (лежанка «В гости»)
 */
import { access, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite } from './knockout-white.mjs'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-master', 'menu')
const outDir = path.join(root, 'public', 'assets', 'menu')

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function toKnockoutPng(inputPath, outputPath, resize) {
  const { data, info } = await sharp(inputPath)
    .rotate()
    .resize(resize.width, resize.height, resize.options)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rgba = new Uint8Array(data)
  knockOutEdgeWhite(rgba, info.width, info.height, resize.tolerance ?? 14)

  await sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim()
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outputPath)

  const meta = await sharp(outputPath).metadata()
  console.log(`${path.basename(outputPath)} ${meta.width}x${meta.height}`)
}

const all = await readdir(srcDir)
const cardFiles = all.filter(
  (f) => /^card-.+\.jpe?g$/i.test(f) && !/^card-meow-home\./i.test(f),
)

if (cardFiles.length === 0) {
  console.error('No card-*.jpg (except meow-home) in assets-master/menu')
  process.exit(1)
}

for (const file of cardFiles.sort()) {
  const base = file.replace(/\.jpe?g$/i, '')
  await toKnockoutPng(path.join(srcDir, file), path.join(outDir, `${base}.png`), {
    width: 1024,
    height: 1024,
    options: {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
}

const visitCandidates = [
  'menu-visit-bed.png',
  'menu-visit-bed.jpg',
  'card-meow-home.jpg',
]
let visitSrc = null
for (const name of visitCandidates) {
  const p = path.join(srcDir, name)
  if (await exists(p)) {
    visitSrc = p
    break
  }
}

if (visitSrc) {
  const srcMeta = await sharp(visitSrc).metadata()
  if (srcMeta.hasAlpha && visitSrc.toLowerCase().endsWith('.png')) {
    await sharp(visitSrc)
      .rotate()
      .trim()
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(path.join(outDir, 'menu-visit-bed.png'))
    const meta = await sharp(path.join(outDir, 'menu-visit-bed.png')).metadata()
    console.log(`menu-visit-bed.png ${meta.width}x${meta.height} (transparent png)`)
  } else {
    await toKnockoutPng(visitSrc, path.join(outDir, 'menu-visit-bed.png'), {
      width: 768,
      height: 1024,
      options: {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
      tolerance: 16,
    })
  }
} else {
  console.warn('Skip menu-visit-bed: no source file')
}

console.log(`Done: ${cardFiles.length} grid icons`)
