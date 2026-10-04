import { createSeededRandom, shuffleCopy, type Rng } from '../../shared/random'
import type { BalloonSize } from './logic'

export type BalloonPlacement = {
  xPct: number
  yPct: number
}

export type BalloonLayoutOptions = {
  modeScale?: number
  fieldProfile?: 'free' | 'task'
}

/**
 * Во сколько раз шарики крупнее, чем до теста на iPad (решение владельца 01.10.2026):
 * большой ×1,5, маленький ×1,1. Те же множители стоят в balloon-pop.css.
 */
export const BALLOON_SIZE_BOOST: Record<BalloonSize, number> = {
  sm: 1.1,
  lg: 1.5,
}

/** Охранный радиус для **задания** (консервативно). */
const TASK_GUARD_RADIUS: Record<BalloonSize, number> = {
  sm: 10.5 * BALLOON_SIZE_BOOST.sm,
  lg: 21 * BALLOON_SIZE_BOOST.lg,
}

/** Свобода: радиусы ближе к реальному rem на iPad при scale ≥ 0.82. */
const FREE_GUARD_RADIUS: Record<BalloonSize, number> = {
  sm: 8.5 * BALLOON_SIZE_BOOST.sm,
  lg: 17 * BALLOON_SIZE_BOOST.lg,
}

export function balloonGuardRadius(size: BalloonSize, profile: 'free' | 'task'): number {
  return profile === 'free' ? FREE_GUARD_RADIUS[size] : TASK_GUARD_RADIUS[size]
}

const MEOW_BUBBLE_GUARD = {
  xPctMax: 28,
  yPctMin: 72,
}

const FREE_COLS = 4
const FREE_ROWS = 3

const EXTENDED_SLOT_CANDIDATES: readonly BalloonPlacement[] = [
  { xPct: 24, yPct: 22 },
  { xPct: 46, yPct: 20 },
  { xPct: 68, yPct: 22 },
  { xPct: 82, yPct: 24 },
  { xPct: 22, yPct: 42 },
  { xPct: 48, yPct: 40 },
  { xPct: 70, yPct: 42 },
  { xPct: 84, yPct: 44 },
  { xPct: 40, yPct: 62 },
  { xPct: 62, yPct: 60 },
  { xPct: 78, yPct: 62 },
  { xPct: 54, yPct: 70 },
]

export type BalloonLayoutPlan = {
  layoutScale: number
  modeScale: number
  placementsById: Map<string, BalloonPlacement>
}

/** В свободе не ужимаем ниже — иначе шары «точки». */
export const FREE_LAYOUT_SCALE_MIN = 0.72
export const FREE_MODE_VISUAL_SCALE = 1

function dist(a: BalloonPlacement, b: BalloonPlacement): number {
  // На альбомном iPad 1% ширины — меньше пикселей, чем 1% высоты.
  // Горизонталь считаем строже, чтобы соседние шарики не делили одно нажатие.
  return Math.hypot((a.xPct - b.xPct) * 1.45, a.yPct - b.yPct)
}

function inMeowGuard(p: BalloonPlacement): boolean {
  return p.xPct <= MEOW_BUBBLE_GUARD.xPctMax && p.yPct >= MEOW_BUBBLE_GUARD.yPctMin
}

function guardRadius(
  size: BalloonSize,
  layoutScale: number,
  modeScale: number,
  profile: 'free' | 'task',
  guardGapPct: number,
): number {
  const base = profile === 'free' ? FREE_GUARD_RADIUS[size] : TASK_GUARD_RADIUS[size]
  const freeMul = profile === 'free' ? FREE_MODE_VISUAL_SCALE : 1
  return base * layoutScale * modeScale * freeMul + guardGapPct
}

function circlesOverlap(
  a: BalloonPlacement,
  ra: number,
  b: BalloonPlacement,
  rb: number,
): boolean {
  return dist(a, b) < ra + rb - 0.05
}

/** Два шара почти в одной точке — визуальная «куча», даже если круги чуть не пересеклись. */
function visuallyStacked(a: BalloonPlacement, b: BalloonPlacement): boolean {
  return Math.abs(a.xPct - b.xPct) < 12 && Math.abs(a.yPct - b.yPct) < 22
}

function clampFree(p: BalloonPlacement): BalloonPlacement {
  let xPct = Math.min(84, Math.max(18, p.xPct))
  let yPct = Math.min(66, Math.max(18, p.yPct))
  if (inMeowGuard({ xPct, yPct })) {
    xPct = Math.max(MEOW_BUBBLE_GUARD.xPctMax + 8, xPct)
    yPct = Math.min(yPct, MEOW_BUBBLE_GUARD.yPctMin - 8)
  }
  return { xPct, yPct }
}

function clampTask(p: BalloonPlacement): BalloonPlacement {
  let xPct = Math.min(92, Math.max(16, p.xPct))
  let yPct = Math.min(74, Math.max(16, p.yPct))
  if (inMeowGuard({ xPct, yPct })) {
    yPct = MEOW_BUBBLE_GUARD.yPctMin - 8
    xPct = Math.max(xPct, MEOW_BUBBLE_GUARD.xPctMax + 8)
  }
  return { xPct, yPct }
}

function freeZoneRect(col: number, row: number): {
  xLo: number
  xHi: number
  yLo: number
  yHi: number
} {
  const xBands = [
    [16, 34],
    [38, 54],
    [58, 74],
    [74, 84],
  ] as const
  const yBands = [
    [16, 34],
    [38, 54],
    [52, 66],
  ] as const
  return {
    xLo: xBands[col]![0],
    xHi: xBands[col]![1],
    yLo: yBands[row]![0],
    yHi: yBands[row]![1],
  }
}

function zoneCenter(zoneIndex: number): BalloonPlacement {
  const col = zoneIndex % FREE_COLS
  const row = Math.floor(zoneIndex / FREE_COLS)
  const z = freeZoneRect(col, row)
  return { xPct: (z.xLo + z.xHi) / 2, yPct: (z.yLo + z.yHi) / 2 }
}

function safeFreeZoneIndexes(): number[] {
  const out: number[] = []
  for (let i = 0; i < FREE_COLS * FREE_ROWS; i += 1) {
    const col = i % FREE_COLS
    const row = Math.floor(i / FREE_COLS)
    if (col === 0 && row === 2) continue
    out.push(i)
  }
  return out
}

function pickSpreadZones(count: number, rng: Rng): number[] {
  const pool = shuffleCopy(safeFreeZoneIndexes(), rng)
  const chosen: number[] = []
  while (chosen.length < count && pool.length > 0) {
    if (chosen.length === 0) {
      chosen.push(pool.shift()!)
      continue
    }
    let bestI = 0
    let bestMin = -1
    for (let i = 0; i < pool.length; i += 1) {
      const c = zoneCenter(pool[i]!)
      const minD = Math.min(...chosen.map((id) => dist(c, zoneCenter(id))))
      if (minD > bestMin) {
        bestMin = minD
        bestI = i
      }
    }
    chosen.push(pool.splice(bestI, 1)[0]!)
  }
  return chosen
}

function randomPointInFreeZone(zoneIndex: number, rng: Rng): BalloonPlacement {
  const col = zoneIndex % FREE_COLS
  const row = Math.floor(zoneIndex / FREE_COLS)
  const z = freeZoneRect(col, row)
  return clampFree({
    xPct: z.xLo + rng() * (z.xHi - z.xLo),
    yPct: z.yLo + rng() * (z.yHi - z.yLo),
  })
}

type SizedBalloon = { id: string; size: BalloonSize }

type Placed = { spec: SizedBalloon; pos: BalloonPlacement; r: number }

function tryPlaceFreeScattered(
  balloons: SizedBalloon[],
  layoutScale: number,
  modeScale: number,
  rng: Rng,
  guardGapPct: number,
): Map<string, BalloonPlacement> | null {
  const sorted = [...balloons].sort((a, b) => {
    if (a.size === b.size) return 0
    return a.size === 'lg' ? -1 : 1
  })
  const zones = pickSpreadZones(sorted.length, rng)
  if (zones.length < sorted.length) return null

  const placed: Placed[] = []

  for (let i = 0; i < sorted.length; i += 1) {
    const spec = sorted[i]!
    const zone = zones[i]!
    let found: BalloonPlacement | null = null
    const r = guardRadius(spec.size, layoutScale, modeScale, 'free', guardGapPct)

    for (let attempt = 0; attempt < 28; attempt += 1) {
      const pos = randomPointInFreeZone(zone, rng)
      let ok = true
      for (const other of placed) {
        if (circlesOverlap(pos, r, other.pos, other.r) || visuallyStacked(pos, other.pos)) {
          ok = false
          break
        }
      }
      if (ok) {
        found = pos
        break
      }
    }
    if (!found) return null
    placed.push({ spec, pos: found, r })
  }

  const map = new Map<string, BalloonPlacement>()
  for (const p of placed) {
    map.set(p.spec.id, p.pos)
  }
  return map
}

function randomCandidates(rng: Rng, count: number): BalloonPlacement[] {
  const out: BalloonPlacement[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(
      clampTask({
        xPct: 18 + rng() * 72,
        yPct: 20 + rng() * 46,
      }),
    )
  }
  return out
}

function tryPlaceGreedyTask(
  balloons: SizedBalloon[],
  layoutScale: number,
  modeScale: number,
  rng: Rng,
  guardGapPct: number,
): Map<string, BalloonPlacement> | null {
  const sorted = [...balloons].sort((a, b) => {
    if (a.size === b.size) return 0
    return a.size === 'lg' ? -1 : 1
  })

  const placed: Placed[] = []
  const anchorPool = shuffleCopy(EXTENDED_SLOT_CANDIDATES, rng)

  for (const spec of sorted) {
    const candidates = shuffleCopy(
      [...anchorPool, ...randomCandidates(rng, 28)],
      rng,
    )
    let found: BalloonPlacement | null = null
    for (const raw of candidates) {
      const pos = clampTask(raw)
      const r = guardRadius(spec.size, layoutScale, modeScale, 'task', guardGapPct)
      let ok = true
      for (const other of placed) {
        if (circlesOverlap(pos, r, other.pos, other.r)) {
          ok = false
          break
        }
      }
      if (!ok) continue
      found = pos
      break
    }
    if (!found) return null
    placed.push({
      spec,
      pos: found,
      r: guardRadius(spec.size, layoutScale, modeScale, 'task', guardGapPct),
    })
  }

  const map = new Map<string, BalloonPlacement>()
  for (const p of placed) {
    map.set(p.spec.id, p.pos)
  }
  return map
}

function findLayoutScale(
  balloons: SizedBalloon[],
  rng: Rng,
  modeScale: number,
  profile: 'free' | 'task',
  guardGapPct: number,
): { scale: number; map: Map<string, BalloonPlacement> } {
  if (profile === 'free') {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      for (let layoutScale = 1; layoutScale >= FREE_LAYOUT_SCALE_MIN; layoutScale -= 0.018) {
        const map = tryPlaceFreeScattered(
          balloons,
          layoutScale,
          modeScale,
          rng,
          guardGapPct,
        )
        if (map) {
          return { scale: layoutScale, map }
        }
      }
    }
    for (let seed = 0; seed < 200; seed += 1) {
      const brute = createSeededRandom(20_000 + seed)
      for (const gap of [guardGapPct, guardGapPct + 0.5, guardGapPct + 1]) {
        const map = tryPlaceFreeScattered(
          balloons,
          FREE_LAYOUT_SCALE_MIN,
          modeScale,
          brute,
          gap,
        )
        if (map) {
          return { scale: FREE_LAYOUT_SCALE_MIN, map }
        }
      }
    }

    const emergency = tryPlaceFreeScattered(
      balloons,
      FREE_LAYOUT_SCALE_MIN,
      modeScale,
      createSeededRandom(99_001),
      guardGapPct + 1.2,
    )
    if (emergency) {
      return { scale: FREE_LAYOUT_SCALE_MIN, map: emergency }
    }

    for (let layoutScale = 0.64; layoutScale >= 0.58; layoutScale -= 0.02) {
      const map = tryPlaceFreeScattered(
        balloons,
        layoutScale,
        modeScale,
        createSeededRandom(99_777),
        guardGapPct + 1.5,
      )
      if (map) {
        return { scale: layoutScale, map }
      }
    }
  }

  const maxScaleSteps = modeScale > 1 ? 24 : 20
  for (let attempt = 0; attempt < 56; attempt += 1) {
    for (let scaleIdx = 0; scaleIdx <= maxScaleSteps; scaleIdx += 1) {
      const layoutScale = 1 - scaleIdx * 0.032
      const map = tryPlaceGreedyTask(balloons, layoutScale, modeScale, rng, guardGapPct)
      if (map) {
        return { scale: layoutScale, map }
      }
    }
  }

  return {
    scale: 0.4,
    map:
      tryPlaceGreedyTask(balloons, 0.4, modeScale, rng, guardGapPct + 1) ??
      new Map(balloons.map((b, i) => [b.id, EXTENDED_SLOT_CANDIDATES[i]!])),
  }
}

export function layoutBalloonsForField(
  balloons: readonly SizedBalloon[],
  rng: Rng = Math.random,
  options: BalloonLayoutOptions = {},
): BalloonLayoutPlan {
  const modeScale = options.modeScale ?? 1
  const profile = options.fieldProfile ?? 'task'
  const guardGapPct = profile === 'free' ? 2.2 : 3.5

  if (balloons.length === 0) {
    return { layoutScale: 1, modeScale, placementsById: new Map() }
  }
  const { scale, map } = findLayoutScale(
    [...balloons],
    rng,
    modeScale,
    profile,
    guardGapPct,
  )
  return { layoutScale: scale, modeScale, placementsById: map }
}

/** Ниже этого масштаба разница размеров уже заметно теряется — лучше убрать шарик. */
export const KEEP_SIZE_SCALE_MIN = 0.9
export const FIT_MIN_COUNT = { free: 5, task: 3 } as const

export type BalloonFitOptions<T extends SizedBalloon> = BalloonLayoutOptions & {
  /** Цели задания: их никогда не убираем. */
  isRequired?: (balloon: T) => boolean
  minCount?: number
}

function pickDropVictim<T extends SizedBalloon>(
  balloons: readonly T[],
  isRequired: (balloon: T) => boolean,
): T | null {
  const optional = balloons.filter((b) => !isRequired(b))
  // Один «не тот» шарик остаётся всегда, иначе задание теряет выбор.
  if (optional.length <= 1) return null
  const countOf = (size: BalloonSize) => balloons.filter((b) => b.size === size).length
  // Большие занимают больше всего места, но хотя бы один большой и один маленький
  // остаются — иначе не видно разницы размеров.
  const lg = optional.filter((b) => b.size === 'lg')
  if (lg.length > 0 && countOf('lg') > 1) return lg[lg.length - 1]!
  const sm = optional.filter((b) => b.size === 'sm')
  if (sm.length > 0 && countOf('sm') > 1) return sm[sm.length - 1]!
  return optional[optional.length - 1] ?? null
}

/**
 * Шарики крупные: если весь набор не помещается без заметного уменьшения,
 * сначала убираем лишние шарики (не цели задания), и только потом уменьшаем масштаб.
 */
export function fitBalloonsToField<T extends SizedBalloon>(
  balloons: readonly T[],
  rng: Rng = Math.random,
  options: BalloonFitOptions<T> = {},
): { plan: BalloonLayoutPlan; kept: T[] } {
  const profile = options.fieldProfile ?? 'task'
  const minCount = options.minCount ?? FIT_MIN_COUNT[profile]
  const isRequired = options.isRequired ?? (() => false)
  let kept = [...balloons]
  while (true) {
    const plan = probeLayout(kept, rng, options, KEEP_SIZE_SCALE_MIN)
    if (plan) return { plan, kept }
    if (kept.length <= minCount) break
    const victim = pickDropVictim(kept, isRequired)
    if (!victim) break
    kept = kept.filter((b) => b !== victim)
  }
  // Меньше шариков уже нельзя — полный поиск с уменьшением масштаба.
  return { plan: layoutBalloonsForField(kept, rng, options), kept }
}

/** Быстрая проба: помещаются ли шарики без уменьшения ниже minScale. */
function probeLayout(
  balloons: readonly SizedBalloon[],
  rng: Rng,
  options: BalloonLayoutOptions,
  minScale: number,
): BalloonLayoutPlan | null {
  const modeScale = options.modeScale ?? 1
  const profile = options.fieldProfile ?? 'task'
  const guardGapPct = profile === 'free' ? 2.2 : 3.5
  if (balloons.length === 0) return { layoutScale: 1, modeScale, placementsById: new Map() }
  const list = [...balloons]
  const step = profile === 'free' ? 0.018 : 0.032
  for (let attempt = 0; attempt < 24; attempt += 1) {
    for (let layoutScale = 1; layoutScale >= minScale - 1e-9; layoutScale -= step) {
      const map =
        profile === 'free'
          ? tryPlaceFreeScattered(list, layoutScale, modeScale, rng, guardGapPct)
          : tryPlaceGreedyTask(list, layoutScale, modeScale, rng, guardGapPct)
      if (map) return { layoutScale, modeScale, placementsById: map }
    }
  }
  return null
}

export function layoutBalloonPositions(
  count: number,
  rng: Rng = Math.random,
): BalloonPlacement[] {
  const pseudo: SizedBalloon[] = Array.from({ length: count }, (_, i) => ({
    id: `slot-${i}`,
    size: (rng() < 0.42 ? 'lg' : 'sm') as BalloonSize,
  }))
  const plan = layoutBalloonsForField(pseudo, rng, { fieldProfile: 'free' })
  return pseudo.map((b) => plan.placementsById.get(b.id) ?? { xPct: 50, yPct: 40 })
}
