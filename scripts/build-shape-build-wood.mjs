/**
 * «Собери что угодно!»: деревянные детали строго сбоку → public/assets/games/shape-build/pieces/<вид>.png
 *
 * Решение владельца 02.10.2026 (t7_wood_style = flat_light_volume): контур картинки = форма
 * в физике (`src/games/shape-build/pieces.ts`), поэтому детали стыкуются без щелей. Объём лёгкий:
 * блик сверху-слева, мягкая тень снизу-справа, тонкая фаска, едва видные волокна.
 * Цвет — светлое некрашеное дерево: игра сама красит детали в 6 цветов палитры.
 * Запуск: `npm run assets:shape-build` (вызывает этот файл).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const out = path.join(root, 'public', 'assets', 'games', 'shape-build', 'pieces')

/** Пикселей на единицу (кубик 1.2 → 264 px). */
const PX = 220
const OUTLINE = 0.05
const CORNER = 0.05
const INK = '#a08a78'

/** Формы как в физике: центр детали — 0,0; y вниз. */
const r = (w, h) => {
  const x = -w / 2
  const y = -h / 2
  const c = Math.min(CORNER, w / 4, h / 4)
  return [
    `M ${x + c} ${y}`,
    `H ${x + w - c}`,
    `Q ${x + w} ${y} ${x + w} ${y + c}`,
    `V ${y + h - c}`,
    `Q ${x + w} ${y + h} ${x + w - c} ${y + h}`,
    `H ${x + c}`,
    `Q ${x} ${y + h} ${x} ${y + h - c}`,
    `V ${y + c}`,
    `Q ${x} ${y} ${x + c} ${y}`,
    'Z',
  ].join(' ')
}

const SHAPES = {
  cube: { w: 1.2, h: 1.2, d: r(1.2, 1.2), grain: 'h' },
  brick: { w: 2.4, h: 1.2, d: r(2.4, 1.2), grain: 'h' },
  plank: { w: 4.8, h: 0.42, d: r(4.8, 0.42), grain: 'h' },
  triangle: { w: 1.5, h: 1.2, d: 'M -0.75 0.6 L 0.75 0.6 L 0 -0.6 Z', grain: 'h' },
  dome: { w: 1.6, h: 0.8, d: 'M -0.8 0.4 A 0.8 0.8 0 0 1 0.8 0.4 Z', grain: 'h' },
  arch: {
    w: 2.4,
    h: 1.2,
    d: 'M -1.2 -0.6 H 1.2 V 0.6 H 0.65 A 0.65 0.65 0 0 0 -0.65 0.6 H -1.2 Z',
    grain: 'h',
  },
  column: { w: 0.9, h: 1.8, d: r(0.9, 1.8), grain: 'v' },
  ramp: { w: 3.6, h: 1.2, d: 'M -1.8 0.6 L 1.8 0.6 L -1.8 -0.6 Z', grain: 'h' },
}

/** Волокна: несколько мягких волн поперёк детали. */
function grainPaths(shape) {
  const lines = []
  if (shape.grain === 'v') {
    const n = 3
    for (let i = 1; i <= n; i += 1) {
      const x = -shape.w / 2 + (shape.w * i) / (n + 1)
      lines.push(`M ${x} ${-shape.h / 2} C ${x - 0.05} ${-shape.h / 6} ${x + 0.05} ${shape.h / 6} ${x} ${shape.h / 2}`)
    }
  } else {
    const n = Math.max(2, Math.round(shape.h / 0.32))
    for (let i = 1; i <= n; i += 1) {
      const y = -shape.h / 2 + (shape.h * i) / (n + 1)
      lines.push(`M ${-shape.w / 2} ${y} C ${-shape.w / 6} ${y - 0.04} ${shape.w / 6} ${y + 0.04} ${shape.w / 2} ${y}`)
    }
  }
  return lines.join(' ')
}

function svg(name, shape) {
  const { w, h, d } = shape
  const W = Math.round(w * PX)
  const H = Math.round(h * PX)
  const lift = 0.07
  const column = shape.grain === 'v'
  // Цилиндр (в физике прямоугольник) — вертикальный блик, остальное — свет сверху-слева.
  const fill = column
    ? `<linearGradient id="f" x1="0" y1="0" x2="1" y2="0">
         <stop offset="0" stop-color="#eadbc4"/><stop offset="0.3" stop-color="#fdf8ef"/>
         <stop offset="0.75" stop-color="#f1e5d2"/><stop offset="1" stop-color="#e2d0b6"/>
       </linearGradient>`
    : `<linearGradient id="f" x1="0" y1="0" x2="0.35" y2="1">
         <stop offset="0" stop-color="#fdf8ef"/><stop offset="1" stop-color="#eee0ca"/>
       </linearGradient>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${-w / 2} ${-h / 2} ${w} ${h}">
  <defs>
    ${fill}
    <clipPath id="c"><path d="${d}"/></clipPath>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.025"/></filter>
  </defs>
  <g clip-path="url(#c)">
    <path d="${d}" fill="url(#f)"/>
    <path d="${grainPaths(shape)}" fill="none" stroke="#d9c6aa" stroke-width="0.018" stroke-linecap="round" opacity="0.55"/>
    <path d="${d}" transform="translate(${-lift} ${-lift})" fill="none" stroke="#c7b293" stroke-width="${lift * 2.2}" opacity="0.38" filter="url(#soft)"/>
    <path d="${d}" transform="translate(${lift} ${lift})" fill="none" stroke="#ffffff" stroke-width="${lift * 2}" opacity="0.75" filter="url(#soft)"/>
    <path d="${d}" fill="none" stroke="#fffaf1" stroke-width="${(OUTLINE + 0.035) * 2}" opacity="0.7"/>
    <path d="${d}" fill="none" stroke="${INK}" stroke-width="${OUTLINE * 2}" stroke-linejoin="round"/>
  </g>
</svg>`
}

await mkdir(out, { recursive: true })
for (const [name, shape] of Object.entries(SHAPES)) {
  const file = path.join(out, `${name}.png`)
  await sharp(Buffer.from(svg(name, shape)))
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(file)
  const meta = await sharp(file).metadata()
  console.log(`${path.relative(root, file)} ${meta.width}x${meta.height}`)
}
