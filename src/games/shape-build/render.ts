import {
  BUCKET_HANDLE_Y,
  BUCKET_PARTS,
  CHUTE_LENGTH,
  CHUTE_SLOPE,
  getPieceSpec,
  HOOP_SCALE,
  SHELF_LENGTH,
  WRECKING_LOOP_Y,
  type PieceKind,
  type Pt,
  type ShapePart,
} from './pieces'
import type { CharPose } from './characters'
import { floorShadow, paintOrder } from './depth'
import type { PieceView, RopeView, TieView, WireView } from './physics'
import {
  BOARD_KINDS,
  BUCKET_SPRITE,
  LINK_BEHIND,
  bladesBox,
  bodySprites,
  linkSprites,
  pieceSprite,
  poseSprite,
  spriteBox,
  spriteTinted,
  tintedSprite,
  type SpriteBox,
  type SpriteImage,
  type SpritePart,
} from './sprites'

/**
 * Детали — картинки с листов владельца (`sprites.ts`); пока они грузятся — рисуем кодом.
 * Единицы → пиксели через `scale`.
 */

/** `picked` — выбрана (кнопки вокруг); `target` — сюда можно провести провод. */
export type Highlight = 'picked' | 'target'

const OUTLINE_K = 0.62

function shade(hex: string, k: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k)))
  const r = ch((n >> 16) & 255)
  const g = ch((n >> 8) & 255)
  const b = ch(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function polyPath(ctx: CanvasRenderingContext2D, points: readonly Pt[]): void {
  ctx.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i]!.x, points[i]!.y)
  ctx.closePath()
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Пока картинки грузятся, механизмы рисуются кодом по частям физики; подвижная часть — `drawLink`. */
const MACHINES: ReadonlySet<PieceKind> = new Set([
  'seesaw',
  'conveyor',
  'mill',
  'lift',
  'cannon',
  'button',
  'gate',
  'pusher',
  'pulley',
])

function partsPath(ctx: CanvasRenderingContext2D, parts: readonly ShapePart[]): void {
  for (const part of parts) {
    if (part.type === 'circle') {
      const x = part.x ?? 0
      const y = part.y ?? 0
      ctx.moveTo(x + part.r, y)
      ctx.arc(x, y, part.r, 0, Math.PI * 2)
    } else {
      polyPath(ctx, part.points)
    }
  }
}

/** Форма детали; у полки и жёлоба она зависит от длины. */
function shapeParts(kind: PieceKind, len = 1): readonly ShapePart[] {
  const spec = getPieceSpec(kind)
  return spec.stretch ? spec.stretch(len) : spec.parts
}

/** Контур детали в её собственных единицах (центр — 0,0). */
function outlinePath(ctx: CanvasRenderingContext2D, kind: PieceKind, len = 1): void {
  const spec = getPieceSpec(kind)
  if (kind === 'conveyor') {
    roundRectPath(ctx, -spec.w / 2, -spec.h / 2, spec.w, spec.h, spec.h / 2)
    return
  }
  if (MACHINES.has(kind) || spec.stretch) {
    partsPath(ctx, shapeParts(kind, len))
    return
  }
  switch (kind) {
    case 'cube':
    case 'brick':
    case 'plank':
    case 'column':
    case 'spring':
      roundRectPath(ctx, -spec.w / 2, -spec.h / 2, spec.w, spec.h, kind === 'plank' ? 0.08 : 0.12)
      return
    case 'arch': {
      const w = spec.w / 2
      const h = spec.h / 2
      ctx.moveTo(-w, h)
      ctx.lineTo(-w, -h + 0.1)
      ctx.arcTo(-w, -h, -w + 0.1, -h, 0.1)
      ctx.lineTo(w - 0.1, -h)
      ctx.arcTo(w, -h, w, -h + 0.1, 0.1)
      ctx.lineTo(w, h)
      ctx.lineTo(0.65, h)
      ctx.arc(0, h, 0.65, 0, Math.PI, true)
      ctx.closePath()
      return
    }
    case 'dome':
      ctx.moveTo(-0.8, 0.4)
      ctx.arc(0, 0.4, 0.8, Math.PI, 0)
      ctx.closePath()
      return
    case 'ball':
    case 'balloon':
    case 'wrecking': {
      const part = spec.parts[0]!
      if (part.type === 'circle') ctx.arc(0, 0, part.r, 0, Math.PI * 2)
      return
    }
    case 'cart':
      ctx.moveTo(-1.1, -0.55)
      ctx.lineTo(-0.94, -0.55)
      ctx.lineTo(-0.94, 0)
      ctx.lineTo(0.94, 0)
      ctx.lineTo(0.94, -0.55)
      ctx.lineTo(1.1, -0.55)
      ctx.lineTo(1.1, 0.22)
      ctx.lineTo(-1.1, 0.22)
      ctx.closePath()
      return
    default:
      partsPath(ctx, spec.parts)
  }
}

function strokeFill(ctx: CanvasRenderingContext2D, color: string, lineW: number): void {
  const grad = ctx.createLinearGradient(0, -1, 0, 1)
  grad.addColorStop(0, shade(color, 1.18))
  grad.addColorStop(1, shade(color, 0.92))
  ctx.fillStyle = grad
  ctx.fill()
  ctx.lineWidth = lineW
  ctx.strokeStyle = shade(color, OUTLINE_K)
  ctx.stroke()
}

function woodGrain(ctx: CanvasRenderingContext2D, kind: PieceKind, color: string): void {
  const spec = getPieceSpec(kind)
  ctx.save()
  outlinePath(ctx, kind)
  ctx.clip()
  ctx.strokeStyle = shade(color, 0.85)
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 0.025
  const lines = Math.max(2, Math.round(spec.h / 0.3))
  for (let i = 1; i < lines; i += 1) {
    const y = -spec.h / 2 + (spec.h * i) / lines
    ctx.beginPath()
    ctx.moveTo(-spec.w / 2, y)
    ctx.bezierCurveTo(-spec.w / 6, y - 0.05, spec.w / 6, y + 0.05, spec.w / 2, y)
    ctx.stroke()
  }
  ctx.globalAlpha = 0.45
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.ellipse(-spec.w * 0.22, -spec.h * 0.28, spec.w * 0.16, Math.max(0.04, spec.h * 0.07), -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}

/** Ветер вправо от включённого вентилятора. */
function windLines(ctx: CanvasRenderingContext2D, view: PieceView): void {
  if (!view.on) return
  const phase = ((view.spin ?? 0) * 0.35) % 0.5
  ctx.save()
  ctx.strokeStyle = 'rgb(140 200 238 / 75%)'
  ctx.lineWidth = 0.07
  ctx.lineCap = 'round'
  ctx.setLineDash([0.3, 0.2])
  ctx.lineDashOffset = -phase
  for (const y of [-0.45, -0.15, 0.15]) {
    ctx.beginPath()
    ctx.moveTo(0.8, y)
    ctx.bezierCurveTo(1.3, y - 0.12, 1.8, y + 0.12, 2.4, y)
    ctx.stroke()
  }
  ctx.restore()
}

function imageSize(src: SpriteImage): { w: number; h: number } {
  if (src instanceof HTMLImageElement) return { w: src.naturalWidth, h: src.naturalHeight }
  return { w: src.width, h: src.height }
}

function drawBox(ctx: CanvasRenderingContext2D, src: SpriteImage, box: SpriteBox): void {
  ctx.drawImage(src, box.x, box.y, box.w, box.h)
}

/** Длинная доска: торцы не тянем, тянем только середину. */
function drawThreeSlice(ctx: CanvasRenderingContext2D, src: SpriteImage, box: SpriteBox): void {
  const { w: sw, h: sh } = imageSize(src)
  const cap = Math.min(sw / 3, sh * 0.8)
  const dcap = (box.h * cap) / sh
  ctx.drawImage(src, 0, 0, cap, sh, box.x, box.y, dcap, box.h)
  ctx.drawImage(src, cap, 0, sw - cap * 2, sh, box.x + dcap, box.y, box.w - dcap * 2, box.h)
  ctx.drawImage(src, sw - cap, 0, cap, sh, box.x + box.w - dcap, box.y, dcap, box.h)
}

/** Части механизма картинками; `false` — какой-то ещё нет, тогда весь механизм рисуем кодом. */
function drawParts(ctx: CanvasRenderingContext2D, parts: readonly SpritePart[]): boolean {
  const images = parts.map((part) => (part.tint ? tintedSprite(part.name, part.tint) : pieceSprite(part.name)))
  if (images.some((img) => !img)) return false
  parts.forEach((part, i) => {
    const src = images[i]!
    const { box } = part
    if (part.rotate) {
      ctx.save()
      ctx.translate(box.x + box.w / 2, box.y + box.h / 2)
      ctx.rotate(part.rotate)
      drawBox(ctx, src, { x: -box.w / 2, y: -box.h / 2, w: box.w, h: box.h })
      ctx.restore()
    } else if (part.slice) {
      drawThreeSlice(ctx, src, box)
    } else {
      drawBox(ctx, src, box)
    }
  })
  return true
}

/** Огонь из сопла ракеты (за картинкой). */
function rocketFlame(ctx: CanvasRenderingContext2D, view: PieceView): void {
  if (!view.on) return
  const flicker = 0.85 + 0.15 * Math.sin((view.id * 7 + performance.now() / 45) % (Math.PI * 2))
  const len = 0.9 * flicker
  const grad = ctx.createLinearGradient(0, 0.6, 0, 0.6 + len)
  grad.addColorStop(0, '#fff3b0')
  grad.addColorStop(0.4, '#f7c95c')
  grad.addColorStop(1, 'rgb(242 139 125 / 0%)')
  ctx.beginPath()
  ctx.moveTo(-0.2, 0.62)
  ctx.quadraticCurveTo(-0.16, 0.6 + len * 0.6, 0, 0.6 + len)
  ctx.quadraticCurveTo(0.16, 0.6 + len * 0.6, 0.2, 0.62)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()
}

/** Свет вокруг лампочки (за картинкой) и блик поверх. */
function lampGlow(ctx: CanvasRenderingContext2D, view: PieceView): void {
  if (!view.on) return
  const glow = ctx.createRadialGradient(0, -0.27, 0.1, 0, -0.27, 1.3)
  glow.addColorStop(0, 'rgb(255 236 150 / 90%)')
  glow.addColorStop(0.45, 'rgb(255 220 110 / 45%)')
  glow.addColorStop(1, 'rgb(255 220 110 / 0%)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(0, -0.27, 1.3, 0, Math.PI * 2)
  ctx.fill()
}

function lampLit(ctx: CanvasRenderingContext2D, view: PieceView): void {
  if (!view.on) return
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  dot(ctx, 0, -0.27, 0.3, 'rgb(255 214 90 / 55%)')
  ctx.restore()
}

/** Полотно ленты бежит, когда она включена. */
function beltRun(ctx: CanvasRenderingContext2D, view: PieceView): void {
  const w = getPieceSpec('conveyor').w
  ctx.save()
  ctx.strokeStyle = 'rgb(255 255 255 / 55%)'
  ctx.lineWidth = 0.05
  ctx.lineCap = 'round'
  ctx.setLineDash([0.12, 0.3])
  ctx.lineDashOffset = -(view.spin ?? 0)
  ctx.beginPath()
  ctx.moveTo(-w / 2 + 0.35, -0.2)
  ctx.lineTo(w / 2 - 0.35, -0.2)
  ctx.stroke()
  ctx.restore()
  lamp(ctx, 0, 0.02, view.on)
}

/** Картинка детали; `false` — картинки ещё нет, рисуем кодом. */
/** Иллюминатор ракеты (центр стекла на картинке) — в нём виден груз. */
const PORTHOLE = { x: 0, y: -0.144, r: 0.155 }

function drawPorthole(ctx: CanvasRenderingContext2D, cargo: NonNullable<PieceView['cargo']>): void {
  const spec = getPieceSpec(cargo.kind)
  const fit = (PORTHOLE.r * 1.7) / Math.max(spec.w, spec.h)
  ctx.save()
  ctx.beginPath()
  ctx.arc(PORTHOLE.x, PORTHOLE.y, PORTHOLE.r, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = '#cfe9fb'
  ctx.fill()
  drawPiece(ctx, { id: -1, kind: cargo.kind, color: cargo.color, x: PORTHOLE.x, y: PORTHOLE.y, angle: 0, size: fit, flip: false }, undefined, false)
  ctx.beginPath()
  ctx.ellipse(PORTHOLE.x - 0.05, PORTHOLE.y - 0.07, 0.07, 0.035, -0.5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgb(255 255 255 / 70%)'
  ctx.fill()
  ctx.restore()
}

/** Предмет втягивает пушка или ракета: кружится, уменьшается и тянется к ней (только картинка). */
export function suckedView(view: PieceView, to: { x: number; y: number }, t: number, still: boolean): PieceView {
  const e = t * t
  return {
    ...view,
    x: view.x + (to.x - view.x) * 0.35 * e,
    y: view.y + (to.y - view.y) * 0.35 * e,
    angle: still ? view.angle : view.angle + e * Math.PI * 2,
    size: view.size * (1 - 0.4 * e),
  }
}

/** Пушка или ракета светится, пока в неё втягивается предмет. */
export function drawSuckGlow(ctx: CanvasRenderingContext2D, at: { x: number; y: number }, t: number, now: number): void {
  const r = 0.7 + 0.5 * t
  ctx.save()
  const glow = ctx.createRadialGradient(at.x, at.y, 0.05, at.x, at.y, r)
  glow.addColorStop(0, `rgb(255 244 190 / ${Math.round(40 + 50 * t)}%)`)
  glow.addColorStop(1, 'rgb(255 236 150 / 0%)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(at.x, at.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgb(255 255 255 / 80%)'
  ctx.lineWidth = 0.06
  ctx.lineCap = 'round'
  const spin = now / 180
  for (let i = 0; i < 3; i += 1) {
    const a = spin + (i * Math.PI * 2) / 3
    const rr = r * (0.9 - 0.4 * (((now / 600) + i / 3) % 1))
    ctx.beginPath()
    ctx.arc(at.x, at.y, rr, a, a + 0.9)
    ctx.stroke()
  }
  ctx.restore()
}

/** Высота позы в высотах детали; широкие позы (сон, полёт) ещё ужимаются по ширине. */
const POSE_HEIGHT: Record<CharPose, number> = {
  plush: 1.12,
  blink: 1.12,
  walk1: 1.12,
  walk2: 1.12,
  joy: 1.2,
  hang: 1.3,
  ride: 1.15,
  fly: 1.2,
  float: 1.2,
  sleep: 0.95,
  wave: 1.15,
  jetpack: 1.4,
}
const POSE_CENTERED: ReadonlySet<CharPose> = new Set(['joy', 'fly', 'float'])

/** Сопло ракетного рюкзака на картинке (доли ширины и высоты) и куда бьёт огонь. */
const JETPACK_NOZZLE: Record<'meow' | 'olli', { x: number; y: number; dx: number; dy: number }> = {
  meow: { x: 0.8, y: 0.64, dx: 0.32, dy: 0.95 },
  olli: { x: 0.19, y: 0.75, dx: -0.22, dy: 0.97 },
}

function jetpackFlame(ctx: CanvasRenderingContext2D, at: Pt, dir: Pt, t: number): void {
  const len = 0.75 * (0.85 + 0.15 * Math.sin(t * 40))
  ctx.save()
  ctx.translate(at.x, at.y)
  ctx.rotate(Math.atan2(-dir.x, dir.y))
  const grad = ctx.createLinearGradient(0, 0, 0, len)
  grad.addColorStop(0, '#fff3b0')
  grad.addColorStop(0.4, '#f7c95c')
  grad.addColorStop(1, 'rgb(242 139 125 / 0%)')
  ctx.beginPath()
  ctx.moveTo(-0.13, 0)
  ctx.quadraticCurveTo(-0.11, len * 0.6, 0, len)
  ctx.quadraticCurveTo(0.11, len * 0.6, 0.13, 0)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()
  ctx.restore()
}

/** Купол парашюта над героем и стропы к лапкам; `open` — секунды с раскрытия (купол раздувается). */
function drawChute(ctx: CanvasRenderingContext2D, w: number, top: number, open: number): void {
  const k = Math.min(1, open / 0.3)
  const grow = 1 - (1 - k) * (1 - k)
  const img = pieceSprite('parachute')
  const cw = 2.3 * (0.35 + 0.65 * grow)
  const ch = img ? (cw * img.naturalHeight) / img.naturalWidth : cw * 0.6
  const bottom = top - 0.85 * grow - 0.15
  ctx.save()
  ctx.strokeStyle = '#8a6a4e'
  ctx.lineWidth = 0.03
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (const side of [-1, 1]) {
    for (const edge of [0.44, 0.16]) {
      ctx.moveTo(side * cw * edge, bottom - 0.04)
      ctx.lineTo(side * w * 0.3, top + 0.08)
    }
  }
  ctx.stroke()
  if (img) {
    ctx.drawImage(img, -cw / 2, bottom - ch, cw, ch)
  } else {
    ctx.beginPath()
    ctx.ellipse(0, bottom, cw / 2, ch, 0, Math.PI, 0)
    ctx.closePath()
    ctx.fillStyle = '#f28b7d'
    ctx.fill()
  }
  ctx.restore()
}

/** Мяу и Олли: картинка позы, покачивание, прыжок радости, шаги, «Zzz» во сне. */
function drawCharacter(ctx: CanvasRenderingContext2D, view: PieceView, kind: 'meow' | 'olli'): boolean {
  const char = view.char ?? { pose: 'plush' as const, t: 0, dx: 0 }
  const img = pieceSprite(poseSprite(kind, char.pose)) ?? pieceSprite(kind)
  if (!img) return false
  const spec = getPieceSpec(kind)
  const aspect = img.naturalWidth / img.naturalHeight || 0.75
  let h = spec.h * POSE_HEIGHT[char.pose]
  let w = h * aspect
  const maxW = spec.w * 1.5
  if (w > maxW) {
    w = maxW
    h = w / aspect
  }
  const bottom = spec.h / 2 + 0.03
  const top = char.pose === 'hang' ? -spec.h / 2 - 0.2 : POSE_CENTERED.has(char.pose) ? -h / 2 : bottom - h
  const t = char.t
  let sx = 1
  let sy = 1
  let lift = 0
  let rot = 0
  if (char.pose === 'plush' || char.pose === 'blink' || char.pose === 'ride' || char.pose === 'sleep') {
    sy = 1 + 0.022 * Math.sin(t * 2.4)
    sx = 1 - 0.012 * Math.sin(t * 2.4)
  } else if (char.pose === 'walk1' || char.pose === 'walk2') {
    lift = Math.abs(Math.sin(t * 12.5)) * 0.07
  } else if (char.pose === 'joy') {
    const k = Math.sin(t * 9)
    sy = 1 + 0.06 * k
    sx = 1 - 0.05 * k
  } else if (char.pose === 'float') {
    lift = Math.sin(t * 1.6) * 0.08
  } else if (char.pose === 'hang' || char.pose === 'wave') {
    rot = Math.sin(t * 3) * 0.05
  } else if (char.pose === 'jetpack') {
    rot = Math.sin(t * 5) * 0.04
    lift = char.flame ? Math.sin(t * 11) * 0.03 : 0
  }
  ctx.save()
  ctx.rotate(rot)
  if (view.chute !== undefined) drawChute(ctx, w, top, view.chute)
  ctx.translate(char.dx, bottom - lift)
  ctx.scale(sx, sy)
  ctx.translate(0, -bottom)
  if (char.pose === 'jetpack' && char.flame) {
    const n = JETPACK_NOZZLE[kind]
    jetpackFlame(ctx, { x: -w / 2 + n.x * w, y: top + n.y * h }, { x: n.dx, y: n.dy }, t)
  }
  ctx.drawImage(img, -w / 2, top, w, h)
  ctx.restore()
  if (char.pose === 'sleep') {
    ctx.save()
    ctx.scale(0.01, 0.01)
    ctx.fillStyle = 'rgb(120 140 190 / 85%)'
    ctx.font = '700 28px Fredoka, system-ui, sans-serif'
    for (let i = 0; i < 3; i += 1) {
      const p = (t * 0.45 + i / 3) % 1
      ctx.globalAlpha = Math.sin(p * Math.PI)
      ctx.fillText('z', (w / 2 - 0.1 + p * 0.35) * 100, (top - p * 0.5) * 100)
    }
    ctx.restore()
  }
  return true
}

function drawSpriteBody(ctx: CanvasRenderingContext2D, view: PieceView): boolean {
  const { kind } = view
  if (kind === 'meow' || kind === 'olli') return drawCharacter(ctx, view, kind)
  const src = spriteTinted(kind) ? tintedSprite(kind, view.color) : pieceSprite(kind)
  if (!src) return false
  const box = spriteBox(kind)
  if (kind === 'rocket') rocketFlame(ctx, view)
  if (kind === 'lamp') lampGlow(ctx, view)
  if (kind === 'plank') drawThreeSlice(ctx, src, box)
  else drawBox(ctx, src, box)
  if (kind === 'rocket' && view.cargo) drawPorthole(ctx, view.cargo)
  if (kind === 'lamp') lampLit(ctx, view)
  if (kind === 'conveyor') beltRun(ctx, view)
  if (kind === 'fan') {
    const blades = pieceSprite('fan-blades')
    if (blades) {
      ctx.save()
      ctx.translate(0, -0.15)
      ctx.rotate(view.spin ?? 0)
      if (!view.on) ctx.globalAlpha = 0.6
      drawBox(ctx, blades, bladesBox(0.4))
      ctx.restore()
    }
    windLines(ctx, view)
  }
  return true
}

/** Мордочки и детали предметов поверх формы. */
function decorate(ctx: CanvasRenderingContext2D, view: PieceView): void {
  const { kind, color } = view
  const ink = '#4a3426'
  switch (kind) {
    case 'wrecking':
      dot(ctx, -0.22, -0.24, 0.16, 'rgb(255 255 255 / 45%)')
      return
    case 'fan': {
      ctx.beginPath()
      ctx.arc(0, -0.15, 0.46, 0, Math.PI * 2)
      ctx.fillStyle = '#f4fbff'
      ctx.fill()
      ctx.lineWidth = 0.05
      ctx.strokeStyle = shade(color, OUTLINE_K)
      ctx.stroke()
      ctx.save()
      ctx.translate(0, -0.15)
      ctx.rotate(view.spin ?? 0)
      ctx.fillStyle = view.on ? '#f28b7d' : '#c9b8ad'
      for (let i = 0; i < 3; i += 1) {
        ctx.rotate((Math.PI * 2) / 3)
        ctx.beginPath()
        ctx.ellipse(0, -0.2, 0.11, 0.2, 0.3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      dot(ctx, 0, -0.15, 0.07, shade(color, 0.6))
      windLines(ctx, view)
      return
    }
    case 'column': {
      ctx.beginPath()
      ctx.ellipse(0, -0.78, 0.4, 0.1, 0, 0, Math.PI * 2)
      ctx.fillStyle = shade(color, 1.25)
      ctx.fill()
      ctx.lineWidth = 0.03
      ctx.strokeStyle = shade(color, OUTLINE_K)
      ctx.stroke()
      return
    }
    case 'ball': {
      ctx.save()
      ctx.beginPath()
      ctx.arc(0, 0, 0.55, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = '#fff7ea'
      ctx.fillRect(-0.6, -0.1, 1.2, 0.2)
      ctx.restore()
      dot(ctx, -0.18, -0.22, 0.09, 'rgb(255 255 255 / 70%)')
      return
    }
    case 'balloon': {
      dot(ctx, -0.2, -0.22, 0.12, 'rgb(255 255 255 / 55%)')
      ctx.beginPath()
      ctx.moveTo(-0.08, 0.62)
      ctx.lineTo(0.08, 0.62)
      ctx.lineTo(0, 0.54)
      ctx.closePath()
      ctx.fillStyle = shade(color, 0.8)
      ctx.fill()
      return
    }
    case 'stone': {
      for (const [x, y, r] of [
        [-0.25, -0.1, 0.05],
        [0.2, 0.12, 0.04],
        [0.05, -0.25, 0.035],
        [-0.05, 0.25, 0.04],
      ] as const) {
        dot(ctx, x, y, r, 'rgb(90 84 78 / 35%)')
      }
      return
    }
    case 'spring': {
      ctx.fillStyle = '#f28b7d'
      ctx.beginPath()
      roundRectPath(ctx, -0.95, -getPieceSpec('spring').h / 2, 1.9, 0.12, 0.06)
      ctx.fill()
      ctx.strokeStyle = shade(color, OUTLINE_K)
      ctx.lineWidth = 0.035
      ctx.beginPath()
      for (const sx of [-0.6, 0, 0.6]) {
        ctx.moveTo(sx, -0.1)
        for (let i = 1; i <= 4; i += 1) ctx.lineTo(sx + (i % 2 ? 0.1 : -0.1), -0.1 + i * 0.065)
      }
      ctx.stroke()
      return
    }
    case 'meow': {
      ctx.fillStyle = color
      ctx.strokeStyle = shade(color, OUTLINE_K)
      ctx.lineWidth = 0.04
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(side * 0.42, -0.5)
        ctx.lineTo(side * 0.36, -0.82)
        ctx.lineTo(side * 0.12, -0.52)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(side * 0.36, -0.54)
        ctx.lineTo(side * 0.33, -0.72)
        ctx.lineTo(side * 0.2, -0.55)
        ctx.closePath()
        ctx.fillStyle = '#f2b8b5'
        ctx.fill()
        ctx.fillStyle = color
      }
      dot(ctx, -0.18, -0.15, 0.07, ink)
      dot(ctx, 0.18, -0.15, 0.07, ink)
      dot(ctx, 0, 0.0, 0.05, '#e8807a')
      ctx.beginPath()
      ctx.arc(0, 0.12, 0.1, 0.2, Math.PI - 0.2)
      ctx.strokeStyle = ink
      ctx.lineWidth = 0.03
      ctx.stroke()
      return
    }
    case 'olli': {
      ctx.fillStyle = color
      ctx.strokeStyle = shade(color, OUTLINE_K)
      ctx.lineWidth = 0.04
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(side * 0.3, -0.6)
        ctx.lineTo(side * 0.42, -0.84)
        ctx.lineTo(side * 0.08, -0.6)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.ellipse(0, 0.25, 0.32, 0.36, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#f2dcc0'
      ctx.fill()
      for (const side of [-1, 1]) {
        dot(ctx, side * 0.2, -0.22, 0.16, '#fffaf0')
        dot(ctx, side * 0.2, -0.22, 0.08, ink)
      }
      ctx.beginPath()
      ctx.moveTo(-0.06, -0.08)
      ctx.lineTo(0.06, -0.08)
      ctx.lineTo(0, 0.04)
      ctx.closePath()
      ctx.fillStyle = '#f2a65a'
      ctx.fill()
      return
    }
    default:
  }
}

function wheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  const sprite = pieceSprite('cart-wheel')
  if (sprite) {
    drawBox(ctx, sprite, { x: -r, y: -r, w: r * 2, h: r * 2 })
    ctx.restore()
    return
  }
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = '#5b4a40'
  ctx.fill()
  dot(ctx, 0, 0, r * 0.45, '#e9d3b3')
  ctx.fillStyle = '#5b4a40'
  ctx.fillRect(-r * 0.08, -r * 0.45, r * 0.16, r * 0.9)
  ctx.restore()
}

const HIGHLIGHT_COLOR: Record<Highlight, string> = {
  picked: '#8cc8ee',
  target: '#f7c95c',
}

/** Кольцо на стене: щит, обод и сетка. Мяч пролетает между ободом и щитом. */
function drawHoop(ctx: CanvasRenderingContext2D, color: string, highlight?: Highlight): void {
  ctx.beginPath()
  roundRectPath(ctx, 0.75, -1.3, 0.2, 1.9, 0.06)
  if (highlight) {
    ctx.lineWidth = 0.26
    ctx.strokeStyle = '#fffdf8'
    ctx.stroke()
    ctx.lineWidth = 0.15
    ctx.strokeStyle = HIGHLIGHT_COLOR[highlight]
    ctx.stroke()
  }
  const sprite = pieceSprite('hoop')
  if (sprite) {
    drawBox(ctx, sprite, spriteBox('hoop'))
    return
  }
  strokeFill(ctx, '#fff3df', 0.05)
  ctx.strokeStyle = 'rgb(255 255 255 / 85%)'
  ctx.lineWidth = 0.035
  ctx.beginPath()
  for (let i = 0; i <= 5; i += 1) {
    const x = -0.68 + i * 0.27
    ctx.moveTo(x, 0)
    ctx.lineTo(x * 0.62 + 0.06, 0.75)
  }
  for (const y of [0.25, 0.5]) {
    ctx.moveTo(-0.68 + y * 0.42, y)
    ctx.lineTo(0.75 - y * 0.3, y)
  }
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(0.015, 0, 0.735, 0.12, 0, 0, Math.PI * 2)
  ctx.lineWidth = 0.1
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.lineWidth = 0.03
  ctx.strokeStyle = shade(color, OUTLINE_K)
  ctx.stroke()
  dot(ctx, -0.72, 0, 0.12, color)
}

/** «Замри!»: по детали бегают искорки-снежинки. `t` — секунды (0 — без движения). */
export function drawFrost(ctx: CanvasRenderingContext2D, view: PieceView, t: number): void {
  const spec = getPieceSpec(view.kind)
  const k = view.kind === 'hoop' ? HOOP_SCALE : 1
  const rx = spec.w * 0.32 * view.size * k
  const ry = spec.h * 0.32 * view.size * k
  ctx.save()
  ctx.strokeStyle = '#ffffff'
  ctx.lineCap = 'round'
  for (let i = 0; i < 2; i += 1) {
    const phase = t * 0.9 + view.id * 1.7 + i * Math.PI
    const x = view.x + Math.cos(phase) * rx
    const y = view.y + Math.sin(phase * 1.3) * ry
    const r = 0.13 + 0.05 * Math.sin(t * 4 + view.id + i)
    ctx.globalAlpha = 0.65 + 0.3 * Math.sin(t * 3 + i + view.id)
    ctx.lineWidth = 0.035
    ctx.beginPath()
    for (let a = 0; a < 3; a += 1) {
      const ang = (a * Math.PI) / 3 + t * 0.5
      ctx.moveTo(x - Math.cos(ang) * r, y - Math.sin(ang) * r)
      ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r)
    }
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * Одна деталь в координатах мира (единицы). `dangling` — у шарика висит ниточка.
 * `buckets` — ведёрки блока рисуются тут же (сцена рисует их сама: задняя стенка за грузом, передняя — поверх).
 */
export function drawPiece(
  ctx: CanvasRenderingContext2D,
  view: PieceView,
  highlight?: Highlight,
  dangling = true,
  buckets = true,
): void {
  const spec = getPieceSpec(view.kind)
  const size = view.size
  if (view.kind === 'rocket' && view.rider !== undefined) return
  if (view.kind === 'balloon' && dangling) {
    const knot = pieceSprite('balloon') ? 0.74 : 0.62
    ctx.save()
    ctx.strokeStyle = '#8a7462'
    ctx.lineWidth = 0.03
    ctx.beginPath()
    const bx = view.x - Math.sin(view.angle) * knot * size
    const by = view.y + Math.cos(view.angle) * knot * size
    ctx.moveTo(bx, by)
    ctx.bezierCurveTo(bx + 0.15, by + 0.35, bx - 0.15, by + 0.6, bx, by + 1)
    ctx.stroke()
    ctx.restore()
  }
  if (view.kind === 'pulley' && buckets) drawBuckets(ctx, view)
  const linkBehind = LINK_BEHIND.has(view.kind)
  if (spec.link && linkBehind) drawLink(ctx, view, highlight)
  ctx.save()
  ctx.translate(view.x, view.y)
  ctx.rotate(view.angle)
  ctx.scale(view.flip ? -size : size, size)
  ctx.lineJoin = 'round'

  if (view.kind === 'hoop') {
    ctx.scale(HOOP_SCALE, HOOP_SCALE)
    drawHoop(ctx, view.color, highlight)
    ctx.restore()
    return
  }

  const parts = bodySprites(view.kind)
  const hasSprite = parts ? parts.every((p) => pieceSprite(p.name)) : Boolean(pieceSprite(view.kind))
  if (!hasSprite) {
    ctx.save()
    ctx.translate(0.05, 0.07)
    ctx.beginPath()
    outlinePath(ctx, view.kind, view.len)
    ctx.fillStyle = 'rgb(74 46 18 / 16%)'
    ctx.fill()
    ctx.restore()
  }

  if (highlight) {
    ctx.beginPath()
    outlinePath(ctx, view.kind, view.len)
    ctx.lineWidth = 0.26
    ctx.strokeStyle = '#fffdf8'
    ctx.stroke()
    ctx.lineWidth = 0.15
    ctx.strokeStyle = HIGHLIGHT_COLOR[highlight]
    ctx.stroke()
  }

  if (RIGGED.has(view.kind)) {
    drawRigged(ctx, view)
  } else if (parts && drawParts(ctx, parts)) {
    // корпус картинками
  } else if (drawSpriteBody(ctx, view)) {
    // картинка целиком
  } else if (MACHINES.has(view.kind)) {
    drawMachineBody(ctx, view)
  } else {
    ctx.beginPath()
    outlinePath(ctx, view.kind, view.len)
    strokeFill(ctx, view.color, 0.05)
    if (spec.material === 'wood' && view.kind !== 'cart') woodGrain(ctx, view.kind, view.color)
    decorate(ctx, view)
  }
  ctx.restore()

  for (const w of view.wheels ?? []) wheel(ctx, w.x, w.y, w.r, w.angle)
  if (spec.link && !linkBehind) drawLink(ctx, view, highlight)
}

/** Верёвки от колёсиков блока и ведёрки на них — за балкой. */
function drawBuckets(ctx: CanvasRenderingContext2D, view: PieceView): void {
  ctx.save()
  ctx.strokeStyle = '#8a6a4e'
  ctx.lineWidth = 0.05
  ctx.lineCap = 'round'
  for (const cord of view.cords ?? []) {
    ctx.beginPath()
    ctx.moveTo(cord.ax, cord.ay)
    ctx.lineTo(cord.bx, cord.by)
    ctx.stroke()
  }
  ctx.restore()
  for (const pose of view.extras ?? []) {
    ctx.save()
    ctx.translate(pose.x, pose.y)
    ctx.rotate(pose.angle)
    ctx.scale(view.size, view.size)
    ctx.lineJoin = 'round'
    if (!drawParts(ctx, [BUCKET_SPRITE])) {
      ctx.beginPath()
      partsPath(ctx, BUCKET_PARTS)
      strokeFill(ctx, '#7cc4e8', 0.045)
      ctx.beginPath()
      ctx.moveTo(-0.5, -0.57)
      ctx.quadraticCurveTo(0, BUCKET_HANDLE_Y - 0.2, 0.5, -0.57)
      ctx.strokeStyle = METAL
      ctx.lineWidth = 0.05
      ctx.stroke()
    }
    ctx.restore()
  }
}

/** Горлышко ведёрка на картинке (в единицах ведра): за его нижним краем — передняя стенка. */
const BUCKET_MOUTH = { y: -0.4, rx: 0.5, ry: 0.085 }

/** Передняя стенка ведёрка поверх груза: предмет сидит внутри и торчит только сверху. */
function drawBucketFront(ctx: CanvasRenderingContext2D, pose: { x: number; y: number; angle: number }, size: number): void {
  const half = BUCKET_SPRITE.box.w / 2 + 0.05
  const bottom = BUCKET_SPRITE.box.y + BUCKET_SPRITE.box.h + 0.05
  ctx.save()
  ctx.translate(pose.x, pose.y)
  ctx.rotate(pose.angle)
  ctx.scale(size, size)
  ctx.beginPath()
  ctx.moveTo(-half, BUCKET_MOUTH.y)
  ctx.lineTo(-BUCKET_MOUTH.rx, BUCKET_MOUTH.y)
  ctx.ellipse(0, BUCKET_MOUTH.y, BUCKET_MOUTH.rx, BUCKET_MOUTH.ry, 0, Math.PI, 0, true)
  ctx.lineTo(half, BUCKET_MOUTH.y)
  ctx.lineTo(half, bottom)
  ctx.lineTo(-half, bottom)
  ctx.closePath()
  ctx.clip()
  drawParts(ctx, [BUCKET_SPRITE])
  ctx.restore()
}

/** Деталь, сжатая вокруг своей середины (в дуле пушки или только что из него). */
function drawShrunk(ctx: CanvasRenderingContext2D, view: PieceView, highlight: Highlight | undefined, dangling: boolean): void {
  const k = view.shrink ?? 1
  if (k === 1) {
    drawPiece(ctx, view, highlight, dangling, false)
    return
  }
  ctx.save()
  ctx.translate(view.x, view.y)
  ctx.scale(k, k)
  ctx.translate(-view.x, -view.y)
  drawPiece(ctx, view, highlight, dangling, false)
  ctx.restore()
}

/** Отверстие дула на картинке видно сбоку: овал во столько раз уже вдоль ствола, чем поперёк. */
const MUZZLE_HOLE_SQUASH = 0.25

/**
 * Предмет в дуле — поверх пушки, но видно только то, что впереди среза дула, и то, что видно в само
 * отверстие: остальное внутри ствола. Предмет сжат до ширины отверстия, ободок дула остаётся видным.
 */
function drawInMuzzle(ctx: CanvasRenderingContext2D, view: PieceView, highlight: Highlight | undefined, dangling: boolean): void {
  const m = view.muzzle!
  const far = 50
  ctx.save()
  ctx.beginPath()
  // Обе фигуры обходятся по часовой стрелке — clip берёт их объединение.
  ctx.moveTo(m.x - m.dy * far, m.y + m.dx * far)
  ctx.lineTo(m.x + m.dy * far, m.y - m.dx * far)
  ctx.lineTo(m.x + m.dy * far + m.dx * far, m.y - m.dx * far + m.dy * far)
  ctx.lineTo(m.x - m.dy * far + m.dx * far, m.y + m.dx * far + m.dy * far)
  ctx.closePath()
  ctx.moveTo(m.x + m.dx * m.r * MUZZLE_HOLE_SQUASH, m.y + m.dy * m.r * MUZZLE_HOLE_SQUASH)
  ctx.ellipse(m.x, m.y, m.r * MUZZLE_HOLE_SQUASH, m.r, Math.atan2(m.dy, m.dx), 0, Math.PI * 2)
  ctx.clip()
  drawShrunk(ctx, view, highlight, dangling)
  ctx.restore()
}

/**
 * Все детали комнаты по глубине: задние стенки ведёрок, детали (герой в ракетном рюкзаке — сразу за ракетой,
 * предмет в дуле — сразу после пушки, торчит из жерла), передние стенки ведёрок.
 */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  views: readonly PieceView[],
  tied: ReadonlySet<number>,
  highlightOf: (view: PieceView) => Highlight | undefined = () => undefined,
): void {
  const byId = new Map(views.map((v) => [v.id, v]))
  const after = new Map<number, PieceView>()
  const before = new Map<number, PieceView>()
  for (const v of views) {
    if (v.muzzle && byId.has(v.muzzle.holder)) before.set(v.muzzle.holder, v)
    const rider = v.rider === undefined ? undefined : byId.get(v.rider)
    if (rider) after.set(v.id, rider.char ? { ...rider, char: { ...rider.char, flame: Boolean(v.on) } } : rider)
  }
  const loaded = new Set([...after.values(), ...before.values()].map((v) => v.id))
  for (const v of views) if (v.kind === 'pulley') drawBuckets(ctx, v)
  for (const v of paintOrder(views.filter((v) => !loaded.has(v.id)))) {
    drawShrunk(ctx, v, highlightOf(v), !tied.has(v.id))
    const inMuzzle = before.get(v.id)
    if (inMuzzle) drawInMuzzle(ctx, inMuzzle, highlightOf(inMuzzle), !tied.has(inMuzzle.id))
    const rider = after.get(v.id)
    if (rider) drawShrunk(ctx, rider, highlightOf(rider), !tied.has(rider.id))
  }
  for (const v of views) {
    if (v.kind === 'pulley') for (const pose of v.extras ?? []) drawBucketFront(ctx, pose, v.size)
    else if (v.kind === 'bucket') drawBucketFront(ctx, v, v.size)
  }
}

type WireEnds = Pick<WireView, 'ax' | 'ay' | 'bx' | 'by'>

/** Провод провисает дугой над деталями: середина дуги. */
function wireBend(wire: WireEnds): Pt {
  return {
    x: (wire.ax + wire.bx) / 2,
    y: Math.min(wire.ay, wire.by) - 0.4 - Math.abs(wire.bx - wire.ax) * 0.08,
  }
}

/** Точка на проводе: `t` = 0 у источника, 1 у механизма. */
export function wirePoint(wire: WireEnds, t: number): Pt {
  const m = wireBend(wire)
  const u = 1 - t
  return {
    x: u * u * wire.ax + 2 * u * t * m.x + t * t * wire.bx,
    y: u * u * wire.ay + 2 * u * t * m.y + t * t * wire.by,
  }
}

/**
 * Провод всегда виден: тонкий и бледный (решение владельца 02.10.2026).
 * Яркий — когда механизм работает, по проводу бежит искорка или выбран источник.
 */
export function drawWire(ctx: CanvasRenderingContext2D, wire: WireView, selected = false): void {
  const m = wireBend(wire)
  const bright = wire.live || selected
  ctx.save()
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(wire.ax, wire.ay)
  ctx.quadraticCurveTo(m.x, m.y, wire.bx, wire.by)
  if (bright) {
    ctx.setLineDash([0.05, 0.2])
    ctx.lineWidth = 0.15
    ctx.strokeStyle = 'rgb(255 253 248 / 85%)'
    ctx.stroke()
    ctx.lineWidth = 0.08
    ctx.strokeStyle = wire.live ? '#f7c95c' : '#f28b7d'
    ctx.lineDashOffset = wire.live ? -performance.now() / 120 : 0
    ctx.stroke()
  } else {
    ctx.setLineDash([0.1, 0.12])
    ctx.lineWidth = 0.045
    ctx.strokeStyle = 'rgb(176 120 100 / 42%)'
    ctx.stroke()
  }
  ctx.restore()
  dot(ctx, wire.bx, wire.by, bright ? 0.09 : 0.05, bright ? (wire.live ? '#f7c95c' : '#f28b7d') : 'rgb(176 120 100 / 50%)')
}

/** Искорка бежит по проводу от источника к механизму. */
export function drawSpark(ctx: CanvasRenderingContext2D, wire: WireEnds, t: number): void {
  const p = wirePoint(wire, Math.min(1, Math.max(0, t)))
  const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 0.34)
  glow.addColorStop(0, 'rgb(255 248 200 / 95%)')
  glow.addColorStop(0.4, 'rgb(247 201 92 / 70%)')
  glow.addColorStop(1, 'rgb(247 201 92 / 0%)')
  ctx.save()
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(p.x, p.y, 0.34, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  dot(ctx, p.x, p.y, 0.07, '#fffdf8')
}

/** Механизм получил сигнал — мягкое свечение вокруг (`alpha` 0…1). */
export function drawGlow(ctx: CanvasRenderingContext2D, view: PieceView, alpha: number): void {
  const spec = getPieceSpec(view.kind)
  const r = (Math.max(spec.w, spec.h) * 0.62 + 0.3) * view.size
  const glow = ctx.createRadialGradient(view.x, view.y, r * 0.2, view.x, view.y, r)
  glow.addColorStop(0, `rgb(255 236 150 / ${Math.round(alpha * 60)}%)`)
  glow.addColorStop(1, 'rgb(255 236 150 / 0%)')
  ctx.save()
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(view.x, view.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Копия вида с центром в (0, 0) — для «полёта домой» на своём маленьком холсте. */
export function viewAtOrigin(view: PieceView): PieceView {
  const dx = -view.x
  const dy = -view.y
  const out: PieceView = { ...view, x: 0, y: 0 }
  if (view.link) out.link = { ...view.link, x: view.link.x + dx, y: view.link.y + dy }
  if (view.wheels) out.wheels = view.wheels.map((w) => ({ ...w, x: w.x + dx, y: w.y + dy }))
  if (view.extras) out.extras = view.extras.map((e) => ({ ...e, x: e.x + dx, y: e.y + dy }))
  if (view.cords) {
    out.cords = view.cords.map((c) => ({ ax: c.ax + dx, ay: c.ay + dy, bx: c.bx + dx, by: c.by + dy }))
  }
  return out
}

const WOOD = '#e2b27a'
const METAL = '#5d6673'

/** Где подвижная часть, пока физика её не сдвинула (иконка в шкафу). */
function linkRest(view: PieceView): { x: number; y: number; angle: number } {
  const at = getPieceSpec(view.kind).link?.at ?? { x: 0, y: 0 }
  const lx = at.x * (view.flip ? -view.size : view.size)
  const ly = at.y * view.size
  const c = Math.cos(view.angle)
  const s = Math.sin(view.angle)
  return { x: view.x + lx * c - ly * s, y: view.y + lx * s + ly * c, angle: view.angle }
}

function lamp(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean | undefined): void {
  dot(ctx, x, y, 0.1, '#fffdf8')
  dot(ctx, x, y, 0.07, on ? '#7ed957' : '#c9b8ad')
}

function machineBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
): void {
  ctx.beginPath()
  roundRectPath(ctx, x, y, w, h, r)
  strokeFill(ctx, color, 0.045)
}

/** Корпус механизма в его собственных единицах. */
function drawMachineBody(ctx: CanvasRenderingContext2D, view: PieceView): void {
  const { color } = view
  const spec = getPieceSpec(view.kind)
  switch (view.kind) {
    case 'seesaw': {
      ctx.beginPath()
      partsPath(ctx, spec.parts)
      strokeFill(ctx, shade(color, 0.92), 0.05)
      dot(ctx, 0, 0.25, 0.12, shade(color, 1.2))
      return
    }
    case 'conveyor': {
      const w = spec.w
      const h = spec.h
      machineBox(ctx, -w / 2, -h / 2, w, h, h / 2, METAL)
      const roll = (view.spin ?? 0) / 0.2
      for (const x of [-w / 2 + h / 2, w / 2 - h / 2]) {
        ctx.save()
        ctx.translate(x, 0)
        ctx.rotate(roll)
        dot(ctx, 0, 0, h * 0.36, '#c9d2dc')
        ctx.fillStyle = METAL
        ctx.fillRect(-0.03, -h * 0.3, 0.06, h * 0.6)
        ctx.restore()
      }
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = 0.09
      ctx.lineCap = 'round'
      ctx.setLineDash([0.22, 0.2])
      ctx.lineDashOffset = -(view.spin ?? 0)
      ctx.beginPath()
      ctx.moveTo(-w / 2 + h / 2, -h / 2 + 0.06)
      ctx.lineTo(w / 2 - h / 2, -h / 2 + 0.06)
      ctx.stroke()
      ctx.restore()
      ctx.save()
      ctx.strokeStyle = 'rgb(255 255 255 / 55%)'
      ctx.lineWidth = 0.05
      ctx.beginPath()
      ctx.moveTo(-0.5, 0.06)
      ctx.lineTo(0.3, 0.06)
      ctx.lineTo(0.18, -0.04)
      ctx.moveTo(0.3, 0.06)
      ctx.lineTo(0.18, 0.16)
      ctx.stroke()
      ctx.restore()
      lamp(ctx, 0.62, 0.06, view.on)
      return
    }
    case 'mill': {
      machineBox(ctx, -0.8, 1.25, 1.6, 0.25, 0.08, WOOD)
      machineBox(ctx, -0.12, -0.45, 0.24, 1.7, 0.08, WOOD)
      return
    }
    case 'cannon': {
      ctx.beginPath()
      partsPath(ctx, [spec.parts[1]!])
      strokeFill(ctx, color, 0.05)
      const barrel = spec.parts[1]!
      if (barrel.type === 'poly') {
        const [, b, c] = barrel.points
        ctx.beginPath()
        ctx.moveTo(b!.x, b!.y)
        ctx.lineTo(c!.x, c!.y)
        ctx.lineWidth = 0.16
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#f2a65a'
        ctx.stroke()
      }
      machineBox(ctx, -0.65, 0.3, 1.3, 0.45, 0.1, WOOD)
      for (const x of [-0.38, 0.38]) {
        dot(ctx, x, 0.66, 0.24, '#5b4a40')
        dot(ctx, x, 0.66, 0.1, '#e9d3b3')
      }
      dot(ctx, -0.2, 0.28, 0.12, '#f7c95c')
      return
    }
    default:
      ctx.beginPath()
      partsPath(ctx, spec.parts)
      strokeFill(ctx, view.kind === 'button' ? '#f28b7d' : WOOD, 0.045)
  }
}

/** Рисуются своим кодом поверх картинок: подвижная часть или длина меняют вид. */
const RIGGED: ReadonlySet<PieceKind> = new Set([...BOARD_KINDS, 'gate', 'lift', 'launcher'])

const SHUTTER = '#a8dcb5'
const SPRING_RED = '#e86b5f'

/** Где подвижная часть в единицах корпуса (центр корпуса — 0,0). */
function linkLocal(view: PieceView): Pt {
  const pose = view.link ?? linkRest(view)
  const dx = pose.x - view.x
  const dy = pose.y - view.y
  const c = Math.cos(view.angle)
  const s = Math.sin(view.angle)
  const lx = (dx * c + dy * s) / view.size
  const ly = (-dx * s + dy * c) / view.size
  return { x: view.flip ? -lx : lx, y: ly }
}

/** Доска из картинки `plank`, перекрашенная в цвет детали. */
function board(ctx: CanvasRenderingContext2D, color: string, box: SpriteBox): void {
  const src = tintedSprite('plank', color)
  if (src) {
    drawThreeSlice(ctx, src, box)
    return
  }
  ctx.beginPath()
  roundRectPath(ctx, box.x, box.y, box.w, box.h, 0.08)
  strokeFill(ctx, color, 0.045)
}

/** Уголки-держатели под полкой: видно, что она прибита к стене. */
function shelfBrackets(ctx: CanvasRenderingContext2D, w: number, color: string): void {
  const x = w / 2 - Math.min(0.5, w * 0.18)
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(side * x - 0.06, 0.1)
    ctx.lineTo(side * x + 0.06, 0.1)
    ctx.lineTo(side * x + 0.06, 0.42)
    ctx.closePath()
    ctx.moveTo(side * x - 0.06, 0.1)
    ctx.lineTo(side * x - 0.06 - side * 0.3, 0.1)
    ctx.lineTo(side * x - 0.06, 0.42)
    ctx.closePath()
    strokeFill(ctx, shade(color, 0.82), 0.035)
  }
}

/** Полотно рольставни: планки поперёк и ручка внизу. */
function shutter(ctx: CanvasRenderingContext2D, top: number, bottom: number): void {
  ctx.beginPath()
  roundRectPath(ctx, -0.15, top, 0.3, bottom - top, 0.04)
  strokeFill(ctx, SHUTTER, 0.04)
  ctx.save()
  ctx.strokeStyle = shade(SHUTTER, 0.72)
  ctx.lineWidth = 0.025
  ctx.beginPath()
  for (let y = bottom - 0.2; y > top + 0.04; y -= 0.16) {
    ctx.moveTo(-0.13, y)
    ctx.lineTo(0.13, y)
  }
  ctx.stroke()
  ctx.restore()
  ctx.beginPath()
  roundRectPath(ctx, -0.18, bottom - 0.11, 0.36, 0.11, 0.04)
  strokeFill(ctx, shade(SHUTTER, 0.7), 0.035)
}

/** Ножницы подъёмника: крест-накрест от основания до площадки, сколько поместится. */
function scissorLegs(ctx: CanvasRenderingContext2D, y0: number, y1: number): void {
  const h = y0 - y1
  if (h < 0.05) return
  const n = Math.max(1, Math.round(h / 0.6))
  const step = h / n
  ctx.save()
  ctx.lineCap = 'round'
  for (const [width, color] of [
    [0.13, '#4a525c'],
    [0.07, '#a9b4bf'],
  ] as const) {
    ctx.lineWidth = width
    ctx.strokeStyle = color
    ctx.beginPath()
    for (let i = 0; i < n; i += 1) {
      const ya = y0 - i * step
      const yb = ya - step
      ctx.moveTo(-0.6, ya)
      ctx.lineTo(0.6, yb)
      ctx.moveTo(0.6, ya)
      ctx.lineTo(-0.6, yb)
    }
    ctx.stroke()
  }
  for (let i = 0; i < n; i += 1) dot(ctx, 0, y0 - (i + 0.5) * step, 0.06, '#f2a65a')
  ctx.restore()
}

/** Пружинки катапульты: тянутся от основания до подскочившей площадки. */
function coilSprings(ctx: CanvasRenderingContext2D, y0: number, y1: number): void {
  const h = y0 - y1
  if (h < 0.02) return
  const turns = 5
  ctx.save()
  ctx.strokeStyle = SPRING_RED
  ctx.lineWidth = 0.05
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (const x of [-0.55, 0, 0.55]) {
    ctx.moveTo(x, y0)
    for (let i = 1; i <= turns * 2; i += 1) ctx.lineTo(x + (i % 2 ? 0.13 : -0.13), y0 - (h * i) / (turns * 2))
  }
  ctx.stroke()
  ctx.restore()
}

/** Полка, жёлоб, полка с люком, рольставня, подъёмник и катапульта — в единицах детали. */
function drawRigged(ctx: CanvasRenderingContext2D, view: PieceView): void {
  const len = view.len ?? 1
  switch (view.kind) {
    case 'shelf': {
      const w = SHELF_LENGTH * len
      shelfBrackets(ctx, w, view.color)
      board(ctx, view.color, { x: -w / 2, y: -0.15, w, h: 0.3 })
      return
    }
    case 'chute': {
      const half = (CHUTE_LENGTH * len) / 2
      ctx.save()
      ctx.rotate(CHUTE_SLOPE)
      board(ctx, view.color, { x: -half, y: -0.1, w: half * 2, h: 0.2 })
      ctx.restore()
      ctx.beginPath()
      partsPath(ctx, [shapeParts('chute', len)[1]!])
      strokeFill(ctx, shade(view.color, 0.9), 0.04)
      return
    }
    case 'trapdoor': {
      board(ctx, view.color, { x: -1.9, y: -0.15, w: 1.1, h: 0.3 })
      board(ctx, view.color, { x: 0.8, y: -0.15, w: 1.1, h: 0.3 })
      dot(ctx, -0.8, 0, 0.1, METAL)
      return
    }
    case 'gate': {
      const bottom = linkLocal(view).y + 1
      ctx.save()
      ctx.strokeStyle = 'rgb(120 150 132 / 55%)'
      ctx.lineWidth = 0.05
      ctx.beginPath()
      for (const x of [-0.21, 0.21]) {
        ctx.moveTo(x, -0.8)
        ctx.lineTo(x, 1.22)
      }
      ctx.stroke()
      ctx.restore()
      if (bottom > -0.75) shutter(ctx, -0.8, bottom)
      ctx.beginPath()
      partsPath(ctx, [getPieceSpec('gate').parts[1]!])
      strokeFill(ctx, WOOD, 0.04)
      if (!drawParts(ctx, bodySprites('gate')!)) machineBox(ctx, -0.7, -1.3, 1.4, 0.5, 0.12, SHUTTER)
      return
    }
    case 'lift': {
      scissorLegs(ctx, 0.14, linkLocal(view).y + 0.1)
      if (!drawParts(ctx, bodySprites('lift')!)) machineBox(ctx, -0.95, 0.04, 1.9, 0.36, 0.1, view.color)
      lamp(ctx, 0.74, 0.25, view.on)
      return
    }
    case 'launcher': {
      const plate = linkLocal(view).y + 0.08
      if (drawParts(ctx, bodySprites('launcher')!)) {
        coilSprings(ctx, -0.1, plate)
      } else {
        machineBox(ctx, -0.8, 0.04, 1.6, 0.26, 0.08, view.color)
        coilSprings(ctx, 0.04, plate)
      }
      return
    }
    default:
  }
}

/** Подвижная часть механизма — у неё своё положение в мире. */
function drawLink(ctx: CanvasRenderingContext2D, view: PieceView, highlight?: Highlight): void {
  const spec = getPieceSpec(view.kind)
  const link = spec.link
  // Полотно рольставни рисует корпус: оно уезжает в короб.
  if (!link || view.kind === 'gate') return
  const pose = view.link ?? linkRest(view)
  ctx.save()
  ctx.translate(pose.x, pose.y)
  ctx.rotate(pose.angle)
  ctx.scale(view.flip ? -view.size : view.size, view.size)
  ctx.lineJoin = 'round'
  if (highlight) {
    ctx.beginPath()
    partsPath(ctx, link.parts)
    ctx.lineWidth = 0.26
    ctx.strokeStyle = '#fffdf8'
    ctx.stroke()
    ctx.lineWidth = 0.15
    ctx.strokeStyle = HIGHLIGHT_COLOR[highlight]
    ctx.stroke()
  }
  const sprites = linkSprites(view.kind)
  if (sprites && drawParts(ctx, sprites)) {
    if (view.kind === 'seesaw') {
      dot(ctx, 0, 0, 0.13, '#fffdf8')
      dot(ctx, 0, 0, 0.08, '#f2a65a')
    }
    ctx.restore()
    return
  }
  ctx.beginPath()
  if (view.kind === 'mill') {
    partsPath(ctx, link.parts.slice(1))
    strokeFill(ctx, view.color, 0.045)
    dot(ctx, 0, 0, 0.24, '#fff3df')
    dot(ctx, 0, 0, 0.09, shade(view.color, 0.6))
  } else if (view.kind === 'lift') {
    roundRectPath(ctx, -0.95, -0.1, 1.9, 0.2, 0.08)
    strokeFill(ctx, shade(view.color, 1.1), 0.045)
    ctx.fillStyle = 'rgb(255 255 255 / 45%)'
    ctx.fillRect(-0.6, -0.06, 1.2, 0.04)
  } else if (view.kind !== 'seesaw') {
    partsPath(ctx, link.parts)
    strokeFill(ctx, view.kind === 'trapdoor' ? WOOD : view.color, 0.045)
  } else {
    partsPath(ctx, link.parts)
    strokeFill(ctx, view.color, 0.045)
    ctx.save()
    ctx.strokeStyle = shade(view.color, 0.82)
    ctx.globalAlpha = 0.45
    ctx.lineWidth = 0.025
    ctx.beginPath()
    ctx.moveTo(-2.2, 0)
    ctx.bezierCurveTo(-0.8, -0.05, 0.8, 0.05, 2.2, 0)
    ctx.stroke()
    ctx.restore()
    dot(ctx, 0, 0, 0.09, '#8a6a4e')
  }
  ctx.restore()
}

/** Мягкие тени деталей на полу комнаты — рисуются до самих деталей. */
export function drawFloorShadows(ctx: CanvasRenderingContext2D, views: readonly PieceView[], floorY: number): void {
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  glow.addColorStop(0, 'rgb(74 46 18 / 100%)')
  glow.addColorStop(0.55, 'rgb(74 46 18 / 60%)')
  glow.addColorStop(1, 'rgb(74 46 18 / 0%)')
  ctx.save()
  ctx.fillStyle = glow
  for (const view of views) {
    const s = floorShadow(view, floorY)
    if (!s) continue
    ctx.save()
    ctx.globalAlpha = s.alpha
    ctx.translate(s.x, s.y)
    ctx.scale(s.rx, s.ry)
    ctx.beginPath()
    ctx.arc(0, 0, 1, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}

/** Верёвка шара-тарана с крючком на потолке. */
export function drawRope(ctx: CanvasRenderingContext2D, rope: RopeView): void {
  ctx.save()
  ctx.fillStyle = '#b98450'
  ctx.beginPath()
  roundRectPath(ctx, rope.ax - 0.35, rope.ay - 0.12, 0.7, 0.22, 0.08)
  ctx.fill()
  ctx.strokeStyle = '#8a6a4e'
  ctx.lineWidth = 0.07
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(rope.ax, rope.ay)
  ctx.lineTo(rope.bx, rope.by)
  ctx.stroke()
  ctx.restore()
}

/** Ниточка шарика к детали, которую он поднимает. */
export function drawTie(ctx: CanvasRenderingContext2D, tie: TieView): void {
  ctx.save()
  ctx.strokeStyle = '#8a7462'
  ctx.lineWidth = 0.035
  ctx.beginPath()
  ctx.moveTo(tie.ax, tie.ay)
  const mx = (tie.ax + tie.bx) / 2 + 0.12
  const my = (tie.ay + tie.by) / 2
  ctx.quadraticCurveTo(mx, my, tie.bx, tie.by)
  ctx.stroke()
  dot(ctx, tie.bx, tie.by, 0.06, '#8a7462')
  ctx.restore()
}

/** Пунктирный след брошенной детали: точки от старых к новым. */
export function drawTrail(ctx: CanvasRenderingContext2D, points: readonly { x: number; y: number }[]): void {
  ctx.save()
  points.forEach((p, i) => {
    const k = (i + 1) / points.length
    ctx.globalAlpha = 0.15 + k * 0.55
    dot(ctx, p.x, p.y, 0.05 + k * 0.08, '#fffdf8')
  })
  ctx.restore()
}

/** Иконка детали для шкафа: вписать в квадрат `size` px. */
export function drawShelfIcon(ctx: CanvasRenderingContext2D, kind: PieceKind, color: string, size: number): void {
  const spec = getPieceSpec(kind)
  const extraH = kind === 'balloon' || kind === 'wrecking' ? 0.8 : 0
  // Длинная тонкая доска наискосок, иначе в квадратной ячейке она превращается в ниточку.
  const angle = kind === 'plank' || kind === 'shelf' ? -Math.PI / 4 : 0
  const c = Math.abs(Math.cos(angle))
  const s = Math.abs(Math.sin(angle))
  const frame = ICON_FRAME[kind]
  const boxW = frame?.w ?? spec.w * c + spec.h * s
  const boxH = frame?.h ?? spec.w * s + (spec.h + extraH) * c
  const fit = (size * 0.84) / Math.max(boxW, boxH)
  ctx.save()
  ctx.clearRect(0, 0, size, size)
  const lift = kind === 'wrecking' ? extraH : kind === 'balloon' ? -extraH : 0
  ctx.translate(size / 2, size / 2 + (lift * fit) / 2)
  ctx.scale(fit, fit)
  if (kind === 'wrecking') {
    drawRope(ctx, { id: 0, ax: 0, ay: -spec.h / 2 - extraH + 0.1, bx: 0, by: -WRECKING_LOOP_Y })
  }
  const wheels = spec.wheels?.map((w) => ({ x: w.x, y: w.y, angle: 0, r: w.r }))
  const view: PieceView = {
    id: 0,
    kind,
    color,
    x: frame?.dx ?? 0,
    y: frame?.dy ?? (kind === 'cart' ? -0.1 : 0),
    angle,
    size: 1,
    flip: false,
  }
  if (wheels) view.wheels = wheels
  if (kind === 'fan') {
    view.on = true
    view.spin = 0.4
  }
  if (kind === 'rocket') view.on = true
  if (kind === 'mill') view.link = { ...linkRest(view), angle: Math.PI / 4 }
  const pulley = spec.pulley
  if (pulley) {
    const handleY = view.y + pulley.y + 0.5
    const bucketY = handleY - BUCKET_HANDLE_Y
    view.extras = [-pulley.x, pulley.x].map((x) => ({ x: view.x + x, y: bucketY, angle: 0 }))
    view.cords = [-pulley.x, pulley.x].map((x) => ({
      ax: view.x + x,
      ay: view.y + pulley.y,
      bx: view.x + x,
      by: handleY,
    }))
  }
  drawPiece(ctx, view)
  ctx.restore()
}

/** Рамка иконки, когда подвижные части торчат за корпус: сдвиг центра и размер в единицах. */
const ICON_FRAME: Partial<Record<PieceKind, { dx: number; dy: number; w: number; h: number }>> = {
  fan: { dx: -0.35, dy: 0, w: 1.9, h: 1.5 },
  pusher: { dx: -0.44, dy: 0, w: 2.08, h: 1.2 },
  pulley: { dx: 0, dy: -0.9, w: 3, h: 3.15 },
  rocket: { dx: 0, dy: -0.4, w: 1.1, h: 2.4 },
}

/** Обои плиткой — сторона плитки в «кубиках». */
const WALL_TILE_U = 7
/** Полоса пола (плинтус сверху) — от 75% высоты экрана до низа. */
const FLOOR_STRIP_FROM = 0.75
const OUTSIDE = '#eadbc9'

export type RoomPaint = {
  /** Камера: точка комнаты в левом верхнем углу экрана и пикселей в кубике. */
  cam: { x: number; y: number; k: number }
  room: { left: number; right: number; top: number }
  unitsH: number
  viewW: number
  viewH: number
  wall: HTMLImageElement | null
  floor: HTMLImageElement | null
  /** Подсветить край, к которому тянут деталь (комната раздвигается). */
  edge?: { x: number; y: number } | null
}

function patternAt(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  repeat: 'repeat' | 'repeat-x',
  x: number,
  y: number,
  k: number,
): CanvasPattern | null {
  const pattern = ctx.createPattern(img, repeat)
  if (!pattern) return null
  if (typeof DOMMatrix === 'function') pattern.setTransform(new DOMMatrix().translate(x, y).scale(k))
  return pattern
}

/**
 * Комната в пикселях экрана: обои, плинтус и пол плиткой (комната растёт в любую сторону),
 * тень у стенок и полоска под потолком; за стенками — «снаружи».
 */
export function paintRoomView(ctx: CanvasRenderingContext2D, p: RoomPaint): void {
  const { cam, room, unitsH, viewW, viewH } = p
  const sx = (u: number): number => (u - cam.x) * cam.k
  const sy = (u: number): number => (u - cam.y) * cam.k
  const x0 = sx(room.left)
  const x1 = sx(room.right)
  const ceil = sy(room.top)
  ctx.fillStyle = OUTSIDE
  ctx.fillRect(0, 0, viewW, viewH)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x0, 0, x1 - x0, viewH)
  ctx.clip()
  const wall = p.wall?.naturalWidth ? patternAt(ctx, p.wall, 'repeat', sx(0), sy(0), (WALL_TILE_U * cam.k) / p.wall.naturalWidth) : null
  if (wall) {
    ctx.fillStyle = wall
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, viewH)
    grad.addColorStop(0, '#fff6e8')
    grad.addColorStop(1, '#fbe8d2')
    ctx.fillStyle = grad
  }
  ctx.fillRect(x0, 0, x1 - x0, viewH)
  const stripTop = sy(unitsH * FLOOR_STRIP_FROM)
  const stripH = (unitsH * (1 - FLOOR_STRIP_FROM) + 0.4) * cam.k
  const floor = p.floor?.naturalHeight
    ? patternAt(ctx, p.floor, 'repeat-x', sx(0), stripTop, stripH / p.floor.naturalHeight)
    : null
  if (floor) {
    ctx.fillStyle = floor
  } else {
    const grad = ctx.createLinearGradient(0, stripTop, 0, stripTop + stripH)
    grad.addColorStop(0, '#f1c48e')
    grad.addColorStop(1, '#e2a96c')
    ctx.fillStyle = grad
  }
  ctx.fillRect(x0, stripTop, x1 - x0, Math.max(stripH, viewH - stripTop))
  // Полоска под потолком: видно, где комната кончается сверху.
  const band = Math.max(4, 0.14 * cam.k)
  ctx.fillStyle = '#fffaf2'
  ctx.fillRect(x0, ceil - band, x1 - x0, band)
  ctx.fillStyle = 'rgb(200 160 120 / 45%)'
  ctx.fillRect(x0, ceil - 2, x1 - x0, 2)
  ctx.fillStyle = OUTSIDE
  ctx.fillRect(x0, 0, x1 - x0, ceil - band)
  // Мягкая тень в углах у стенок.
  const shade = 0.7 * cam.k
  for (const [from, dir] of [
    [x0, 1],
    [x1, -1],
  ] as const) {
    const grad = ctx.createLinearGradient(from, 0, from + dir * shade, 0)
    grad.addColorStop(0, 'rgb(150 105 70 / 22%)')
    grad.addColorStop(1, 'rgb(150 105 70 / 0%)')
    ctx.fillStyle = grad
    ctx.fillRect(dir > 0 ? from : from - shade, ceil, shade, viewH - ceil)
  }
  ctx.restore()
  if (p.edge && (p.edge.x !== 0 || p.edge.y !== 0)) {
    const glow = 0.9 * cam.k
    ctx.save()
    const paintEdge = (gx0: number, gy0: number, gx1: number, gy1: number, rx: number, ry: number, rw: number, rh: number): void => {
      const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1)
      grad.addColorStop(0, 'rgb(247 201 92 / 55%)')
      grad.addColorStop(1, 'rgb(247 201 92 / 0%)')
      ctx.fillStyle = grad
      ctx.fillRect(rx, ry, rw, rh)
    }
    if (p.edge.x < 0) paintEdge(0, 0, glow, 0, 0, 0, glow, viewH)
    if (p.edge.x > 0) paintEdge(viewW, 0, viewW - glow, 0, viewW - glow, 0, glow, viewH)
    if (p.edge.y < 0) paintEdge(0, Math.max(0, ceil), 0, Math.max(0, ceil) + glow, 0, Math.max(0, ceil), viewW, glow)
    ctx.restore()
  }
}
