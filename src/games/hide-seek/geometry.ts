import type { Hideout } from './scenes'

/** Прямоугольник на сцене: `x`, `w` — в % ширины, `y`, `h` — в % высоты картинки. */
export type Box = { x: number; y: number; w: number; h: number }

export type PlacementGeometry = {
  item: Box
  /** Кусок той же картинки сцены поверх предмета — передний край укрытия; null — предмет виден целиком. */
  patch: Box | null
  /** Ширина мягкого перехода у края, в % размера куска вдоль оси перехода (0 — прямой край). */
  fade: number
  hit: Box
  /** Куда предмет выпрыгивает из укрытия. */
  pop: 'up' | 'left' | 'right'
}

/** Сцена 4:3: 1 % высоты = 0,75 % ширины. */
const H_TO_W = 3 / 4
/** Самая длинная сторона предмета — не больше 1,2 высоты укрытия. */
const MAX_SIDE = 1.2
const SOFT_BAND = 0.14
const PATCH_SIDE_PAD = 0.18
const KUKU_GAP = 0.04

/**
 * Где лежит предмет и кусок сцены, который его прикрывает.
 * `aspect` — ширина/высота картинки предмета, `cover` — доля предмета за краем, `scale` — масштаб уровня.
 */
export function placementGeometry(hideout: Hideout, aspect: number, cover: number, scale: number): PlacementGeometry {
  const base = hideout.s * scale
  const h = base * Math.min(1, MAX_SIDE / aspect)
  const w = h * aspect * H_TO_W
  const soft = hideout.edge === 'soft'
  const open = !hideout.kuku && cover <= 0

  if (hideout.side === 'bottom') {
    const hidden = hideout.kuku ? h * (1 + KUKU_GAP) : h * cover
    const item: Box = { x: hideout.x - w / 2, y: hideout.y - h + hidden, w, h }
    const band = soft ? h * SOFT_BAND : 0
    const pad = w * PATCH_SIDE_PAD
    const top = hideout.y - band
    const bottom = item.y + h + h * 0.04
    const patch: Box = { x: item.x - pad, y: top, w: w + pad * 2, h: bottom - top }
    const hitTop = hideout.kuku ? hideout.y - h * 0.55 : item.y - h * 0.22
    const hitBottom = hideout.kuku ? hideout.y + h * 0.7 : hideout.y + h * 0.15
    const hit: Box = { x: item.x - w * 0.25, y: hitTop, w: w * 1.5, h: hitBottom - hitTop }
    if (open) return { item, patch: null, fade: 0, hit, pop: 'up' }
    return { item, patch, fade: band > 0 ? ((band * 2) / patch.h) * 100 : 0, hit, pop: 'up' }
  }

  const hidden = hideout.kuku ? w * (1 + KUKU_GAP) : w * cover
  const coverLeft = hideout.side === 'left'
  const itemX = coverLeft ? hideout.x - hidden : hideout.x - w + hidden
  const item: Box = { x: itemX, y: hideout.y - h / 2, w, h }
  const band = soft ? w * SOFT_BAND : 0
  const padY = h * PATCH_SIDE_PAD
  const patchX = coverLeft ? item.x - w * 0.04 : hideout.x - band
  const patchRight = coverLeft ? hideout.x + band : item.x + w + w * 0.04
  const patch: Box = { x: patchX, y: item.y - padY, w: patchRight - patchX, h: h + padY * 2 }
  let hitLeft: number
  let hitRight: number
  if (hideout.kuku) {
    hitLeft = Math.min(item.x, hideout.x) - w * 0.2
    hitRight = Math.max(item.x + w, hideout.x) + w * 0.2
  } else if (coverLeft) {
    hitLeft = hideout.x - w * 0.3
    hitRight = item.x + w + w * 0.3
  } else {
    hitLeft = item.x - w * 0.3
    hitRight = hideout.x + w * 0.3
  }
  const hit: Box = { x: hitLeft, y: item.y - h * 0.2, w: hitRight - hitLeft, h: h * 1.4 }
  const pop = coverLeft ? 'right' : 'left'
  if (open) return { item, patch: null, fade: 0, hit, pop }
  return { item, patch, fade: band > 0 ? ((band * 2) / patch.w) * 100 : 0, hit, pop }
}
