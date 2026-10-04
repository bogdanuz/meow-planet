/**
 * Картинки «Куда положить?»: PNG из public/, когда они есть в SORT_ART_READY,
 * иначе объёмные SVG-заглушки из кода (offline, без внешних URL).
 */
import { hubSoundUrl } from '../../shared/hub-sounds'
import { TOY_BIN } from '../../shared/toys'
import { SORT_ART_READY } from './art-ready'
import { SORT_COLOR_HEX, type SortColor, type SortKind } from './catalog'

const BASE = () => import.meta.env.BASE_URL ?? '/'
const ART_DIR = () => `${BASE()}assets/games/sort-colors`

export const STICKER_NAVY = '#26365E'
const STICKER_FILL = '#E3ECF7'
const TUB_CREAM = '#F7EEDC'

/**
 * Геометрия ящика в долях его картинки (ширина × высота).
 * opening — область центров игрушек (выше проёма: горка торчит из ящика);
 * front — передний край проёма слева направо (ниже линии игрушки скрыты стенкой);
 * sticker — центр и ширина наклейки на передней стенке.
 */
export type BinGeometry = {
  aspect: number
  opening: { x: number; y: number; w: number; h: number }
  front: readonly (readonly [number, number])[]
  sticker: { x: number; y: number; w: number }
}

function ellipseFront(cx: number, cy: number, rx: number, ry: number, steps = 16): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = Math.PI - (Math.PI * i) / steps
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]
  })
}

const PLACEHOLDER_BIN: BinGeometry = {
  aspect: 1.2,
  opening: { x: 0.05, y: -0.12, w: 0.9, h: 0.42 },
  front: ellipseFront(0.5, 0.26, 0.45, 0.18),
  sticker: { x: 0.5, y: 0.66, w: 0.34 },
}

/** bin.png: прямоугольный ящик спереди-сверху, справа видна боковая стенка (общая геометрия — `shared/toys`). */
const ART_BIN: BinGeometry = { ...TOY_BIN, aspect: SORT_ART_READY.binAspect ?? TOY_BIN.aspect }

export const BIN_GEOMETRY: BinGeometry = SORT_ART_READY.bin ? ART_BIN : PLACEHOLDER_BIN

const pct = (v: number) => `${(v * 100).toFixed(2)}%`

/** clip-path слоя с игрушками: всё выше переднего края ящика, ниже — спрятано стенкой. */
export function binClipPath(g: BinGeometry = BIN_GEOMETRY): string {
  const first = g.front[0]!
  const last = g.front[g.front.length - 1]!
  const pts: string[] = ['-25% -90%', '125% -90%', `125% ${pct(last[1])}`]
  for (const [x, y] of [...g.front].reverse()) pts.push(`${pct(x)} ${pct(y)}`)
  pts.push(`-25% ${pct(first[1])}`)
  return `polygon(${pts.join(', ')})`
}

function mix(hex: string, target: number, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c + (target - c) * amount))
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

const svgUrl = (body: string, viewBox = '0 0 100 100') =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`,
  )}`

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (Math.PI * i) / 5
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

const HEART = 'M50 90 C20 68 5 50 9 31 C13 12 38 8 50 27 C62 8 87 12 91 31 C95 50 80 68 50 90 Z'
const RING = 'M50 10 a42 42 0 1 0 0.01 0 Z M50 32 a20 20 0 1 1 -0.01 0 Z'
const CONE = 'M50 8 L87 80 A37 12 0 0 1 13 80 Z'
const DUCK_BODY = 'M18 64 C18 48 34 46 52 50 C66 52 78 46 90 38 C92 56 86 86 52 88 C30 88 18 80 18 64 Z'

/** Силуэт вида: fill — заливка, extra — атрибуты (обводка наклейки). */
function shape(kind: SortKind, fill: string, extra = ''): string {
  switch (kind) {
    case 'ball':
      return `<circle cx="50" cy="52" r="40" fill="${fill}" ${extra}/>`
    case 'cube':
      return `<path d="M50 10 L88 29 L88 73 L50 92 L12 73 L12 29 Z" fill="${fill}" ${extra}/>`
    case 'star':
      return `<polygon points="${starPoints(50, 54, 45, 21)}" fill="${fill}" ${extra}/>`
    case 'pyramid':
      return `<path d="${CONE}" fill="${fill}" ${extra}/>`
    case 'heart':
      return `<path d="${HEART}" fill="${fill}" ${extra}/>`
    case 'duck':
      return `<path d="${DUCK_BODY}" fill="${fill}" ${extra}/><circle cx="34" cy="34" r="19" fill="${fill}" ${extra}/>`
    case 'ring':
      return `<path d="${RING}" fill="${fill}" fill-rule="evenodd" ${extra}/>`
  }
}

function placeholderToySvg(kind: SortKind, color: SortColor): string {
  const base = SORT_COLOR_HEX[color]
  const light = mix(base, 255, 0.5)
  const dark = mix(base, 0, 0.28)
  const grad = `<defs><radialGradient id="g" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></radialGradient><linearGradient id="h" x1="0" x2="1"><stop offset="0" stop-color="${light}"/><stop offset=".5" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs>`
  const gloss = '<ellipse cx="36" cy="30" rx="11" ry="7" fill="#fff" opacity=".55" transform="rotate(-25 36 30)"/>'
  switch (kind) {
    case 'cube':
      return (
        grad +
        `<path d="M50 10 L88 29 L50 48 L12 29 Z" fill="${light}"/>` +
        `<path d="M12 29 L50 48 L50 92 L12 73 Z" fill="${base}"/>` +
        `<path d="M88 29 L50 48 L50 92 L88 73 Z" fill="${dark}"/>` +
        `<path d="M50 10 L88 29 L88 73 L50 92 L12 73 L12 29 Z" fill="none" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>`
      )
    case 'pyramid':
      return (
        grad +
        `<ellipse cx="50" cy="80" rx="37" ry="12" fill="${dark}"/>` +
        `<path d="${CONE}" fill="url(#h)"/>` +
        '<path d="M44 22 L30 66" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/>'
      )
    case 'star':
      return grad + shape(kind, 'url(#g)', `stroke="url(#g)" stroke-width="6" stroke-linejoin="round"`) + gloss
    case 'duck':
      return (
        grad +
        shape(kind, 'url(#g)') +
        `<path d="M15 34 L1 39 L15 44 Z" fill="#F39A2B" stroke="#D97F14" stroke-width="2" stroke-linejoin="round"/>` +
        `<circle cx="30" cy="29" r="3.4" fill="${STICKER_NAVY}"/>` +
        `<path d="M42 64 C52 74 66 72 74 62" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round" opacity=".6"/>`
      )
    default:
      return grad + shape(kind, 'url(#g)') + gloss
  }
}

function placeholderStickerSvg(kind: SortKind): string {
  return (
    `<rect x="3" y="3" width="94" height="94" rx="22" fill="#FFF8EC" stroke="${STICKER_NAVY}" stroke-width="4"/>` +
    `<g transform="translate(17 17) scale(.66)">${shape(kind, STICKER_FILL, `stroke="${STICKER_NAVY}" stroke-width="7" stroke-linejoin="round"`)}</g>`
  )
}

function placeholderBinSvg(): string {
  const shade = mix(TUB_CREAM, 0, 0.12)
  const deep = mix(TUB_CREAM, 0, 0.24)
  const edge = mix(TUB_CREAM, 0, 0.4)
  return (
    `<defs><linearGradient id="w" x1="0" x2="1"><stop offset="0" stop-color="${shade}"/><stop offset=".45" stop-color="${TUB_CREAM}"/><stop offset="1" stop-color="${shade}"/></linearGradient></defs>` +
    `<ellipse cx="60" cy="96" rx="48" ry="4" fill="#000" opacity=".12"/>` +
    `<ellipse cx="60" cy="26" rx="54" ry="18" fill="${deep}"/>` +
    `<path d="M6 26 A54 18 0 0 0 114 26 L105 88 Q104 94 96 94 L24 94 Q16 94 15 88 Z" fill="url(#w)" stroke="${edge}" stroke-width="1.6"/>` +
    `<ellipse cx="60" cy="26" rx="54" ry="18" fill="none" stroke="${edge}" stroke-width="3"/>` +
    `<path d="M10 30 A52 16 0 0 0 110 30" fill="none" stroke="#fff" stroke-width="2.4" opacity=".7"/>`
  )
}

export function toyArtUrl(kind: SortKind, color: SortColor): string {
  return SORT_ART_READY.toys.includes(`${kind}-${color}`)
    ? `${ART_DIR()}/toys/${kind}-${color}.png`
    : svgUrl(placeholderToySvg(kind, color))
}

export function toyArtIsBitmap(kind: SortKind, color: SortColor): boolean {
  return SORT_ART_READY.toys.includes(`${kind}-${color}`)
}

export function binArtUrl(): string {
  return SORT_ART_READY.bin ? `${ART_DIR()}/bin.png` : svgUrl(placeholderBinSvg(), '0 0 120 100')
}

export function stickerArtUrl(kind: SortKind): string {
  return SORT_ART_READY.stickers ? `${ART_DIR()}/stickers/${kind}.png` : svgUrl(placeholderStickerSvg(kind))
}

export function sortBackgroundUrl(): string {
  return SORT_ART_READY.background
    ? `${ART_DIR()}/sort-playroom-bg.webp`
    : `${BASE()}assets/shell/menu-bg.webp`
}

export type SortSfx = 'pickup' | 'drop' | 'pile'

export function sortSfxUrl(id: SortSfx): string | null {
  if (id === 'pickup') return hubSoundUrl.pickup()
  if (id === 'drop') return hubSoundUrl.drop()
  return SORT_ART_READY.sfx.includes(id) ? `${ART_DIR()}/sfx/${id}.mp3` : null
}
