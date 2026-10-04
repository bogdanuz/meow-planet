import { sandboxPieceUrl } from './art'
import { CHAR_POSES, type CharPose } from './characters'
import { BUCKET_HANDLE_Y, BUCKET_SIZE, getPieceSpec, PIECE_KINDS, type PieceKind } from './pieces'

/** Картинки деталей с листов владельца и листов механизмов (`docs/assets/shape-build-ART.md`). */

const PART_NAMES = [
  'cart-wheel',
  'fan-blades',
  'seesaw-stand',
  'seesaw-board',
  'mill-stand',
  'mill-rotor',
  'lift-base',
  'lift-platform',
  'button-base',
  'button-cap',
  'gate-box',
  'pusher-base',
  'pusher-glove',
  'pulley-beam',
  'launcher-base',
  'launcher-plate',
  'parachute',
] as const

type PoseName = `${'meow' | 'olli'}-${Exclude<CharPose, 'plush'>}`

/** Позы Мяу и Олли: `meow.png` — мягкая игрушка, остальные — `meow-<поза>.png`. */
const POSE_NAMES: readonly PoseName[] = (['meow', 'olli'] as const).flatMap((who) =>
  CHAR_POSES.filter((p): p is Exclude<CharPose, 'plush'> => p !== 'plush').map((p): PoseName => `${who}-${p}`),
)

export type SpriteName = PieceKind | (typeof PART_NAMES)[number] | PoseName

export function poseSprite(kind: 'meow' | 'olli', pose: CharPose): SpriteName {
  return pose === 'plush' ? kind : `${kind}-${pose}`
}

/**
 * Собраны из нескольких картинок (корпус + подвижная часть) — своей картинки целиком нет.
 * Полка, жёлоб и полка с люком — из картинки доски: длина у них меняется.
 */
const BUILT_FROM_PARTS: ReadonlySet<PieceKind> = new Set([
  'seesaw',
  'mill',
  'lift',
  'button',
  'gate',
  'pusher',
  'pulley',
  'launcher',
  'shelf',
  'chute',
  'trapdoor',
])

/** Детали из доски: картинку `plank` кладём по длине детали (`render.ts`). */
export const BOARD_KINDS: ReadonlySet<PieceKind> = new Set(['shelf', 'chute', 'trapdoor'])

export const SPRITE_NAMES: readonly SpriteName[] = [
  ...PIECE_KINDS.filter((kind) => !BUILT_FROM_PARTS.has(kind)),
  ...PART_NAMES,
  ...POSE_NAMES,
]

/** Прямоугольник картинки в единицах детали (центр детали — 0,0; y вниз). */
export type SpriteBox = { x: number; y: number; w: number; h: number }

/**
 * Картинка части механизма: `rotate` — повернуть вокруг середины (лопасти мельницы — крестом),
 * `tint` — перекрасить (дверца из доски), `slice` — тянуть только середину (длинная доска).
 */
export type SpritePart = { name: SpriteName; box: SpriteBox; rotate?: number; tint?: string; slice?: boolean }

const BODY_PARTS: Partial<Record<PieceKind, readonly SpritePart[]>> = {
  seesaw: [{ name: 'seesaw-stand', box: { x: -0.595, y: -0.68, w: 1.19, h: 1.28 } }],
  mill: [{ name: 'mill-stand', box: { x: -0.53, y: -0.586, w: 1.062, h: 2.086 } }],
  lift: [{ name: 'lift-base', box: { x: -0.95, y: 0.04, w: 1.9, h: 0.36 } }],
  button: [{ name: 'button-base', box: { x: -0.65, y: -0.13, w: 1.3, h: 0.68 } }],
  gate: [{ name: 'gate-box', box: { x: -0.7, y: -1.3, w: 1.4, h: 0.6 } }],
  pusher: [{ name: 'pusher-base', box: { x: -0.585, y: -0.6, w: 1.17, h: 1.2 } }],
  pulley: [{ name: 'pulley-beam', box: { x: -1.5, y: -0.67, w: 3, h: 1.34 } }],  launcher: [{ name: 'launcher-base', box: { x: -0.8, y: -0.12, w: 1.6, h: 0.42 } }],
  shelf: [{ name: 'plank', box: { x: -1.8, y: -0.15, w: 3.6, h: 0.3 }, slice: true }],
  chute: [{ name: 'plank', box: { x: -1.8, y: -0.1, w: 3.6, h: 0.2 }, slice: true }],
  trapdoor: [
    { name: 'plank', box: { x: -1.9, y: -0.15, w: 1.1, h: 0.3 }, slice: true },
    { name: 'plank', box: { x: 0.8, y: -0.15, w: 1.1, h: 0.3 }, slice: true },
  ],
}

const LINK_PARTS: Partial<Record<PieceKind, readonly SpritePart[]>> = {
  seesaw: [{ name: 'seesaw-board', box: { x: -2.4, y: -0.36, w: 4.8, h: 0.51 } }],
  mill: [{ name: 'mill-rotor', box: { x: -0.825, y: -0.845, w: 1.65, h: 1.69 }, rotate: Math.PI / 4 }],
  lift: [{ name: 'lift-platform', box: { x: -0.95, y: -0.1, w: 1.9, h: 0.2 } }],
  button: [{ name: 'button-cap', box: { x: -0.4, y: -0.25, w: 0.8, h: 0.55 } }],
  pusher: [{ name: 'pusher-glove', box: { x: -0.65, y: -0.36, w: 1.3, h: 0.72 } }],
  trapdoor: [{ name: 'plank', box: { x: 0, y: -0.15, w: 1.6, h: 0.3 }, tint: '#e2b27a', slice: true }],
  launcher: [{ name: 'launcher-plate', box: { x: -0.75, y: -0.08, w: 1.5, h: 0.16 } }],
}

/** Подвижная часть прячется за корпусом: шляпка кнопки уходит в коробку, шток перчатки — в ящик. */
export const LINK_BEHIND: ReadonlySet<PieceKind> = new Set(['button', 'pusher'])

/** Корпус механизма картинками; null — у детали одна картинка (`spriteBox`). */
export function bodySprites(kind: PieceKind): readonly SpritePart[] | null {
  return BODY_PARTS[kind] ?? null
}

export function linkSprites(kind: PieceKind): readonly SpritePart[] | null {
  return LINK_PARTS[kind] ?? null
}

/** Ведёрко: ручка — на `BUCKET_HANDLE_Y`, середина ведра — 0,0. */
export const BUCKET_SPRITE: SpritePart = {
  name: 'bucket',
  box: { x: -BUCKET_SIZE.w / 2, y: BUCKET_HANDLE_Y, w: BUCKET_SIZE.w, h: BUCKET_SIZE.h },
}

/** Пропорции нарезанных картинок (ширина / высота), см. `pieces/*.png`. */
const ASPECT = {
  balloon: 427 / 481,
  meow: 171 / 241,
  olli: 191 / 250,
  spring: 484 / 228,
  wrecking: 369 / 404,
  hoop: 382 / 484,
  fanBlades: 419 / 382,
} as const

/** Обод кольца на картинке — на 54% высоты; в физике обод на y = 0. */
const HOOP_RIM_AT = 263 / 484
/** Ось лопастей на картинке (центр масс трёх лопастей). */
const BLADES_HUB = { x: 0.498, y: 0.616 }

function specBox(kind: PieceKind): SpriteBox {
  const spec = getPieceSpec(kind)
  return { x: -spec.w / 2, y: -spec.h / 2, w: spec.w, h: spec.h }
}

/** Стоит на полу: низ картинки = низ детали, без растяжения. */
function standing(kind: PieceKind, aspect: number): SpriteBox {
  const spec = getPieceSpec(kind)
  const w = spec.h * aspect
  return { x: -w / 2, y: -spec.h / 2, w, h: spec.h }
}

export function spriteBox(kind: PieceKind): SpriteBox {
  switch (kind) {
    case 'balloon': {
      const h = 1.2 / ASPECT.balloon
      return { x: -0.6, y: -0.6, w: 1.2, h }
    }
    case 'wrecking': {
      const h = 1.4 / ASPECT.wrecking
      return { x: -0.7, y: 0.7 - h, w: 1.4, h }
    }
    case 'cart':
      return { x: -1.1, y: -0.55, w: 2.2, h: 0.77 }
    case 'meow':
      return standing('meow', ASPECT.meow)
    case 'olli':
      return standing('olli', ASPECT.olli)
    case 'spring': {
      const spec = getPieceSpec('spring')
      const h = spec.w / ASPECT.spring
      return { x: -spec.w / 2, y: spec.h / 2 - h, w: spec.w, h }
    }
    case 'hoop': {
      // В единицах до HOOP_SCALE: от края обода (−0.84) до щита (0.95).
      const w = 1.79
      const h = w / ASPECT.hoop
      return { x: -0.84, y: -HOOP_RIM_AT * h, w, h }
    }
    case 'conveyor':
      return { x: -2.1, y: -0.29, w: 4.2, h: 0.58 }
    case 'cannon':
      return { x: -0.97, y: -0.75, w: 1.94, h: 1.5 }
    case 'scissors':
      return { x: -0.5, y: -0.38, w: 1, h: 0.76 }
    case 'bucket':
      return { ...BUCKET_SPRITE.box }
    default:
      // Дерево нарисовано строго сбоку по форме физики (scripts/build-shape-build-wood.mjs).
      return specBox(kind)
  }
}

/** Лопасти вокруг оси (0,0), длина лопасти ≈ `radius`. */
export function bladesBox(radius: number): SpriteBox {
  const h = radius / BLADES_HUB.y
  const w = h * ASPECT.fanBlades
  return { x: -BLADES_HUB.x * w, y: -BLADES_HUB.y * h, w, h }
}

/** Дерево и шарик нарисованы светлыми — код красит их в цвет детали. */
export function spriteTinted(kind: PieceKind): boolean {
  return kind === 'balloon' || kind === 'pipe' || getPieceSpec(kind).group === 'block'
}

const images = new Map<SpriteName, HTMLImageElement>()
let loading: Promise<void> | null = null

/** Загрузить все картинки один раз; до загрузки детали рисуются кодом. */
export function loadPieceSprites(): Promise<void> {
  if (loading) return loading
  if (typeof Image === 'undefined') {
    loading = Promise.resolve()
    return loading
  }
  loading = Promise.all(
    SPRITE_NAMES.map(
      (name) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => {
            images.set(name, img)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = sandboxPieceUrl(name)
        }),
    ),
  ).then(() => undefined)
  return loading
}

export function pieceSprite(name: SpriteName): HTMLImageElement | null {
  return images.get(name) ?? null
}

/** Перекрашенные копии храним не больше 512×512 по площади: 9 форм × 6 цветов. Длинная доска — в полный размер. */
const TINT_MAX_AREA = 512 * 512
const tintCache = new Map<string, HTMLCanvasElement>()

export type SpriteImage = HTMLImageElement | HTMLCanvasElement

export function tintedSprite(name: SpriteName, color: string): SpriteImage | null {
  const img = images.get(name)
  if (!img) return null
  const key = `${name}|${color}`
  const cached = tintCache.get(key)
  if (cached) return cached
  const k = Math.min(1, Math.sqrt(TINT_MAX_AREA / (img.naturalWidth * img.naturalHeight)))
  const w = Math.max(1, Math.round(img.naturalWidth * k))
  const h = Math.max(1, Math.round(img.naturalHeight * k))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const g = canvas.getContext('2d')
  if (!g) return img
  g.drawImage(img, 0, 0, w, h)
  g.globalCompositeOperation = 'multiply'
  g.fillStyle = color
  g.fillRect(0, 0, w, h)
  g.globalCompositeOperation = 'destination-in'
  g.drawImage(img, 0, 0, w, h)
  tintCache.set(key, canvas)
  return canvas
}
