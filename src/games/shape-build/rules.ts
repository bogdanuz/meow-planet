import { ITEM_MAX_PER_KIND, SHELF_KINDS, getPieceSpec, isPieceKind, type PieceKind } from './pieces'

export type SpawnCheck = 'ok' | 'full' | 'kind-max'

/** Шкаф даёт деталь, пока на экране есть место; предметов одного вида — до трёх. */
export function spawnCheck(kind: PieceKind, onScreen: readonly PieceKind[], limit: number): SpawnCheck {
  if (onScreen.length >= limit) return 'full'
  if (getPieceSpec(kind).group === 'item') {
    const same = onScreen.filter((k) => k === kind).length
    if (same >= ITEM_MAX_PER_KIND) return 'kind-max'
  }
  return 'ok'
}

const QUARTER = Math.PI / 2

export function snapRightAngle(angle: number): number {
  return Math.round(angle / QUARTER) * QUARTER
}

export function rotateQuarter(angle: number): number {
  return snapRightAngle(angle + QUARTER)
}

/** Размеры кнопок «Больше / Меньше»: 1 — как в шкафу. */
export const SIZE_STEPS = [0.6, 1, 1.5, 2] as const

export function nextSize(current: number, dir: 1 | -1): number | null {
  let index = 0
  SIZE_STEPS.forEach((step, i) => {
    if (Math.abs(step - current) < Math.abs(SIZE_STEPS[index]! - current)) index = i
  })
  return SIZE_STEPS[index + dir] ?? null
}

export type DropArea = {
  left: number
  right: number
  /** Половина ширины детали. */
  halfW: number
  floorY: number
  /** Верх самой высокой детали в полосе x0..x1, null — пусто. */
  topAt: (x0: number, x1: number) => number | null
}

const DROP_STEP = 0.5

/** Деталь из шкафа падает сверху: ближе к центру, но не на высокую постройку. */
export function chooseDropX(area: DropArea): number {
  const min = area.left + area.halfW
  const max = area.right - area.halfW
  if (max <= min) return (area.left + area.right) / 2
  const center = (min + max) / 2
  let best = center
  let bestScore = Infinity
  const count = Math.max(1, Math.floor((max - min) / DROP_STEP))
  for (let i = 0; i <= count; i += 1) {
    const x = min + ((max - min) * i) / count
    const top = area.topAt(x - area.halfW - 0.2, x + area.halfW + 0.2)
    const stack = top === null ? 0 : Math.max(0, area.floorY - top)
    const score = stack * 2 + Math.abs(x - center) * 0.6
    if (score < bestScore - 1e-9) {
      bestScore = score
      best = x
    }
  }
  return best
}

export type FingerSample = { readonly x: number; readonly y: number; readonly at: number }

const FLING_WINDOW_MS = 100

/** Скорость пальца в px/с за последние ~100 мс: смахнул и отпустил — деталь летит. */
export function fingerVelocity(samples: readonly FingerSample[]): { x: number; y: number } {
  if (samples.length < 2) return { x: 0, y: 0 }
  const last = samples[samples.length - 1]!
  let firstIndex = samples.findIndex((s) => s.at >= last.at - FLING_WINDOW_MS)
  if (firstIndex === samples.length - 1) firstIndex -= 1
  const first = samples[firstIndex]!
  const dt = (last.at - first.at) / 1000
  if (dt <= 0) return { x: 0, y: 0 }
  return { x: (last.x - first.x) / dt, y: (last.y - first.y) / dt }
}

/** Что показать в шкафу: всё, кроме спрятанного взрослым; кубик остаётся всегда. */
export function shelfKinds(hidden: readonly string[]): PieceKind[] {
  const off = new Set(hidden.filter(isPieceKind))
  const kinds = SHELF_KINDS.filter((kind) => !off.has(kind))
  if (!kinds.some((kind) => getPieceSpec(kind).group === 'block')) return ['cube', ...kinds]
  return kinds
}
