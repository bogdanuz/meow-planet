import { PUZZLE_ART_READY } from './art-ready'
import { getPuzzleScene, PUZZLE_SCENE_IDS, type PuzzleSceneId } from './logic'

const ART_DIR = () => `${import.meta.env.BASE_URL ?? '/'}assets/games/puzzle`

const PALETTE = ['#e8503f', '#f4c23a', '#4a8bd6', '#55ae5c', '#f08a3c', '#b07ad8', '#ffffff', '#2f6f8f', '#f08a9c'] as const

const SHAPES: readonly ((cx: number, cy: number, fill: string) => string)[] = [
  (cx, cy, f) => `<circle cx="${cx}" cy="${cy}" r="30" fill="${f}"/>`,
  (cx, cy, f) =>
    `<polygon points="${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map((i) => {
        const r = i % 2 ? 14 : 34
        const a = (Math.PI / 5) * i - Math.PI / 2
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
      })
      .join(' ')}" fill="${f}"/>`,
  (cx, cy, f) =>
    `<path d="M${cx} ${cy + 28} C${cx - 44} ${cy - 2} ${cx - 22} ${cy - 38} ${cx} ${cy - 16} C${cx + 22} ${cy - 38} ${cx + 44} ${cy - 2} ${cx} ${cy + 28}Z" fill="${f}"/>`,
  (cx, cy, f) => `<polygon points="${cx},${cy - 34} ${cx + 32},${cy + 26} ${cx - 32},${cy + 26}" fill="${f}"/>`,
  (cx, cy, f) => `<rect x="${cx - 28}" y="${cy - 28}" width="56" height="56" rx="10" fill="${f}"/>`,
  (cx, cy, f) =>
    `<g fill="${f}"><circle cx="${cx - 18}" cy="${cy + 6}" r="16"/><circle cx="${cx + 2}" cy="${cy - 8}" r="20"/><circle cx="${cx + 22}" cy="${cy + 6}" r="15"/><rect x="${cx - 34}" y="${cy + 4}" width="70" height="18" rx="9"/></g>`,
  (cx, cy, f) =>
    `<g fill="${f}">${[0, 72, 144, 216, 288]
      .map((deg) => `<ellipse cx="${cx}" cy="${cy - 18}" rx="11" ry="18" transform="rotate(${deg} ${cx} ${cy})"/>`)
      .join('')}<circle cx="${cx}" cy="${cy}" r="10" fill="#fff6dc"/></g>`,
  (cx, cy, f) => `<polygon points="${cx},${cy - 34} ${cx + 30},${cy} ${cx},${cy + 34} ${cx - 30},${cy}" fill="${f}"/>`,
  (cx, cy, f) => `<ellipse cx="${cx}" cy="${cy}" rx="38" ry="22" fill="${f}"/>`,
]

/** Цветная картинка-заглушка 4:3: в каждой из 9 частей своя фигура, чтобы кусочки различались. */
function placeholderSvg(id: PuzzleSceneId): string {
  const { tint } = getPuzzleScene(id)
  const n = PUZZLE_SCENE_IDS.indexOf(id)
  const cells: string[] = []
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const i = row * 3 + col
      const shape = SHAPES[(i + n * 2) % SHAPES.length]!
      const fill = PALETTE[(i * 4 + n) % PALETTE.length]!
      cells.push(shape(67 + col * 133, 50 + row * 100, fill))
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="1600" height="1200"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6e6"/><stop offset="1" stop-color="${tint}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><path d="M0 210 Q100 180 200 205 T400 200 V300 H0Z" fill="${tint}" opacity="0.75"/>${cells.join('')}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const placeholderCache = new Map<PuzzleSceneId, string>()

function placeholderUrl(id: PuzzleSceneId): string {
  let url = placeholderCache.get(id)
  if (!url) {
    url = placeholderSvg(id)
    placeholderCache.set(id, url)
  }
  return url
}

export function puzzleSceneUrl(id: PuzzleSceneId): string {
  return PUZZLE_ART_READY.scenes.includes(id) ? `${ART_DIR()}/scenes/${id}.webp` : placeholderUrl(id)
}

export function puzzleThumbUrl(id: PuzzleSceneId): string {
  return PUZZLE_ART_READY.scenes.includes(id) ? `${ART_DIR()}/thumbs/${id}.webp` : placeholderUrl(id)
}

/** CSS одного кусочка: та же картинка, сдвинутая на свою клетку сетки. */
export function pieceCellBackground(pieceId: number, cols: number, rows: number, imageSrc: string): string {
  const col = pieceId % cols
  const row = Math.floor(pieceId / cols)
  const x = cols === 1 ? 50 : (col / (cols - 1)) * 100
  const y = rows === 1 ? 50 : (row / (rows - 1)) * 100
  return `background-image:url("${imageSrc}");background-position:${x}% ${y}%;background-size:${cols * 100}% ${rows * 100}%;background-repeat:no-repeat`
}
