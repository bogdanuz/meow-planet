import sharp from 'sharp'
import path from 'node:path'

const src = path.resolve(import.meta.dirname, '..', 'assets-master', 'games', 'sound-world')
const play = path.resolve(import.meta.dirname, '..', 'public', 'assets', 'games', 'sound-world', 'play')

async function meta(file) {
  const m = await sharp(file).metadata()
  console.log(path.basename(file), m.width, m.height)
}

for (const f of [
  'snare-drum.jpg',
  'tom-drum.jpg',
  'bass-drum.jpg',
  'piano-body-no-keys.jpg',
  'piano-keys-sheet.jpg',
  'piano-play.jpg',
]) {
  await meta(path.join(src, f))
}
await meta(path.join(play, 'piano.png'))
await meta(path.join(play, 'bell.png'))
