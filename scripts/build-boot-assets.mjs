/**
 * assets-master/shell/boot/ → public/assets/shell/boot/
 * - отдельная лесная поляна → WebP 4:3
 * - заголовок и листья → прозрачные PNG
 * - первый стабильный кадр совы → прозрачный PNG без межкадрового мерцания
 */
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { knockOutEdgeWhite } from './knockout-white.mjs'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-master', 'shell', 'boot')
const outDir = path.join(root, 'public', 'assets', 'shell', 'boot')

await mkdir(outDir, { recursive: true })

async function whiteKnockout(inputName, outputName, width) {
  const { data, info } = await sharp(path.join(srcDir, inputName))
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rgba = new Uint8Array(data)
  knockOutEdgeWhite(rgba, info.width, info.height, 18)

  const outputPath = path.join(outDir, outputName)
  await sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outputPath)
}

function knockOutSolidBackground(rgba, target) {
  for (let index = 0; index < rgba.length; index += 4) {
    const distance = Math.max(
      Math.abs(rgba[index] - target.r),
      Math.abs(rgba[index + 1] - target.g),
      Math.abs(rgba[index + 2] - target.b),
    )
    if (distance <= 14) {
      rgba[index + 3] = 0
    } else if (distance < 52) {
      rgba[index + 3] = Math.round(((distance - 14) / 38) * 255)
    }
  }
}

async function buildOwlStill() {
  const source = sharp(path.join(srcDir, 'boot-owl-vacuum-sheet.jpg'))
  const { data, info } = await source
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rgba = new Uint8Array(data)
  const target = { r: rgba[0], g: rgba[1], b: rgba[2] }
  knockOutSolidBackground(rgba, target)

  const frameWidth = Math.floor(info.width / 3)
  const frameHeight = Math.floor(info.height / 2)
  const runtimeFrameWidth = 360
  const runtimeFrameHeight = 304
  const firstCell = await sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract({ left: 0, top: 0, width: frameWidth, height: frameHeight })
    .png()
    .toBuffer()
  const firstFrame = await sharp(firstCell)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(runtimeFrameWidth - 20, runtimeFrameHeight - 16, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 8,
      bottom: 8,
      left: 10,
      right: 10,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()

  await sharp(firstFrame).toFile(path.join(outDir, 'boot-owl-vacuum.png'))
  await rm(path.join(outDir, 'boot-owl-vacuum-sprite.png'), { force: true })
}

await sharp(path.join(srcDir, 'boot-forest-clearing.jpg'))
  .rotate()
  .resize(2048, 1536, { fit: 'cover' })
  .webp({ quality: 84, effort: 6 })
  .toFile(path.join(outDir, 'boot-forest-bg.webp'))

await Promise.all([
  whiteKnockout('boot-title.jpg', 'boot-title.png', 1600),
  whiteKnockout('boot-leaf-strip.jpg', 'boot-leaves.png', 1800),
  buildOwlStill(),
])

for (const name of [
  'boot-forest-bg.webp',
  'boot-title.png',
  'boot-leaves.png',
  'boot-owl-vacuum.png',
]) {
  const meta = await sharp(path.join(outDir, name)).metadata()
  console.log(`${name} ${meta.width}x${meta.height}`)
}
