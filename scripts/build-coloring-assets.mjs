/**
 * assets-master/games/coloring/scenes/<Имя>.jpg → public/assets/games/coloring/
 *   lines/<id>.png  — только контур на прозрачном фоне (белое вырезано по яркости)
 *   thumbs/<id>.webp — миниатюра 4:3 для экрана выбора
 * Запуск: npm run assets:coloring
 */
import { mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-master', 'games', 'coloring', 'scenes')
const outDir = path.join(root, 'public', 'assets', 'games', 'coloring')

/** Порядок = порядок плиток на экране выбора. Совпадает с `src/games/drawing/coloring-pages.ts`. */
export const COLORING_FILES = [
  ['Шарик', 'balloon'],
  ['Яблоко', 'apple'],
  ['Цветок', 'flower'],
  ['Собака', 'dog'],
  ['Сова', 'owl'],
  ['Рыбка', 'fish'],
  ['Уточка', 'duck'],
  ['Машинка', 'car'],
  ['Автобус', 'bus'],
  ['Лодка', 'boat'],
  ['Самолёт', 'plane'],
  ['Сапоги в луже', 'boots'],
  ['Кролик', 'bunny'],
  ['Чашка', 'cup'],
  ['Спящий мишка', 'sleepy-bear'],
  ['Торт', 'cake'],
  ['Чайник', 'teapot'],
  ['Кит', 'whale'],
  ['Осминожка', 'octopus'],
  ['Крабик', 'crab'],
  ['Черепаха', 'turtle'],
  ['Динозавр', 'dino'],
  ['Снеговик', 'snowman'],
  ['Подарок', 'gift'],
]

const LINE_W = 1600
const LINE_H = 1200
const THUMB_W = 480
const THUMB_H = 360
const INK = { r: 43, g: 26, b: 34 }
/** Ярче этого — полностью прозрачно; темнее DARK — полностью контур. */
const LIGHT = 235
const DARK = 120

async function buildLines(input, output) {
  const { data, info } = await sharp(input)
    .rotate()
    .resize(LINE_W, LINE_H, { fit: 'fill', kernel: 'lanczos3' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rgba = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0; i < info.width * info.height; i += 1) {
    const lum = data[i * info.channels]
    const t = lum >= LIGHT ? 0 : lum <= DARK ? 1 : (LIGHT - lum) / (LIGHT - DARK)
    const o = i * 4
    rgba[o] = INK.r
    rgba[o + 1] = INK.g
    rgba[o + 2] = INK.b
    rgba[o + 3] = Math.round(t * 255)
  }
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9, effort: 10, palette: false })
    .toFile(output)
}

async function buildThumb(input, output) {
  await sharp(input)
    .rotate()
    .resize(THUMB_W, THUMB_H, { fit: 'fill', kernel: 'lanczos3' })
    .flatten({ background: '#ffffff' })
    .webp({ quality: 82, effort: 6 })
    .toFile(output)
}

const files = await readdir(srcDir)
await rm(path.join(outDir, 'scenes'), { recursive: true, force: true })
await rm(path.join(outDir, 'lines'), { recursive: true, force: true })
await rm(path.join(outDir, 'thumbs'), { recursive: true, force: true })
await mkdir(path.join(outDir, 'lines'), { recursive: true })
await mkdir(path.join(outDir, 'thumbs'), { recursive: true })

for (const [title, id] of COLORING_FILES) {
  const name = files.find((file) => file.normalize('NFC').replace(/\.(jpe?g|png)$/i, '') === title.normalize('NFC'))
  if (!name) throw new Error(`Нет мастера для «${title}» в ${srcDir}`)
  const input = path.join(srcDir, name)
  await buildLines(input, path.join(outDir, 'lines', `${id}.png`))
  await buildThumb(input, path.join(outDir, 'thumbs', `${id}.webp`))
  console.log(`${title} → ${id}`)
}
console.log(`coloring assets ready: ${COLORING_FILES.length}`)
