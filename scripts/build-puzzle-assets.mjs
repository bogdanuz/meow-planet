/**
 * Мастера «Собери пазл» → public/assets/games/puzzle/
 * Запуск: npm run assets:puzzle
 *
 * assets-master/games/puzzle/puzzle-<id>.jpg (4:3) → scenes/<id>.webp 2048×1536 и thumbs/<id>.webp 480×360.
 * Сцены без мастера пропускаются: игра рисует для них цветную заглушку.
 * В конце пишет src/games/puzzle/art-ready.ts.
 */
import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const srcDir = path.join(root, 'assets-master', 'games', 'puzzle')
const outDir = path.join(root, 'public', 'assets', 'games', 'puzzle')
const readyFile = path.join(root, 'src', 'games', 'puzzle', 'art-ready.ts')

// Порядок как PUZZLE_SCENE_IDS в src/games/puzzle/logic.ts.
const SCENES = [
  'bake',
  'picnic',
  'bath',
  'beach',
  'snowman',
  'garden',
  'bedtime',
  'birthday',
  'train',
  'autumn',
  'music',
  'rain',
  'farm',
  'painting',
  'garage',
  'dentist',
  'newyear',
]

/** Мастер назван иначе, чем сцена. */
const MASTER_NAMES = {
  garage: 'car_repair_garage',
}

const exists = async (file) => {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

async function findMaster(base) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const file = path.join(srcDir, base + ext)
    if (await exists(file)) return file
  }
  return null
}

await mkdir(path.join(outDir, 'scenes'), { recursive: true })
await mkdir(path.join(outDir, 'thumbs'), { recursive: true })

const ready = []
for (const id of SCENES) {
  const master = (await findMaster(`puzzle-${id}`)) ?? (MASTER_NAMES[id] && (await findMaster(`puzzle-${MASTER_NAMES[id]}`)))
  if (!master) continue
  await sharp(master)
    .rotate()
    .resize(2048, 1536, { fit: 'cover', position: 'attention' })
    .webp({ quality: 84 })
    .toFile(path.join(outDir, 'scenes', `${id}.webp`))
  await sharp(master)
    .rotate()
    .resize(480, 360, { fit: 'cover', position: 'attention' })
    .webp({ quality: 80 })
    .toFile(path.join(outDir, 'thumbs', `${id}.webp`))
  ready.push(id)
  console.log(`${id}: scenes + thumbs ← ${path.basename(master)}`)
}

const list = (values) => `[${values.map((v) => `'${v}'`).join(', ')}]`
await writeFile(
  readyFile,
  `/** Создаётся \`npm run assets:puzzle\`: какие картинки пазла уже нарисованы (остальные — заглушки кодом). */
export const PUZZLE_ART_READY = {
  scenes: ${list(ready)} as readonly string[],
}
`,
)
console.log(`art-ready.ts: ${ready.length} из ${SCENES.length} сцен`)
