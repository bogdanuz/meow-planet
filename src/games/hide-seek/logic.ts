import { shuffleCopy, type Rng } from '../../shared/random'
import type { HideSeekLevel } from '../../shared/storage'
import { HIDE_SCENE_IDS, type HideItem, type HideScene, type HideSceneId, type Hideout } from './scenes'

export type HideLevel = HideSeekLevel

/** Сколько искать за раунд. */
export const LEVEL_TARGETS: Readonly<Record<HideLevel, number>> = { easy: 3, medium: 4, hard: 5 }
/**
 * Какая доля предмета уходит за край укрытия: «Легко» — виден целиком, «Средне» — видно
 * от половины до двух третей, «Сложно» — треть (в «ку-ку» спрятан весь).
 */
export const LEVEL_COVER: Readonly<Record<HideLevel, { min: number; max: number }>> = {
  easy: { min: 0, max: 0 },
  medium: { min: 1 / 3, max: 1 / 2 },
  hard: { min: 2 / 3, max: 2 / 3 },
}
/** Предмет крупнее на «Легко», чуть мельче на «Сложно». */
export const LEVEL_SCALE: Readonly<Record<HideLevel, number>> = { easy: 1.15, medium: 1, hard: 0.92 }
/** Насколько тон предмета подгоняется под фон укрытия (0 — родные цвета). */
export const LEVEL_TINT: Readonly<Record<HideLevel, number>> = { easy: 0, medium: 0.12, hard: 0.3 }
/** Обманка на «Сложно» видна почти целиком: манит, но это не то. */
export const DECOY_COVER = 0.3

/** Мягкие подсказки по бездействию (не штрафной таймер). */
export const HINT_REPEAT_MS = 6000
export const HINT_GLOW_MS = 12000
/** Промахов подряд до «где-то рядом…» и выглядывания. */
export const MISSES_BEFORE_PEEK = 2

/** Укрытия раунда не ближе этого (в % картинки), чтобы предметы не налезали. */
export const HIDEOUT_MIN_GAP = 10

export type Placement = {
  readonly item: HideItem
  readonly hideout: Hideout
  /** Доля предмета за краем укрытия (1 — «ку-ку», не видно совсем). */
  readonly cover: number
}

export type HideRound = {
  readonly sceneId: HideSceneId
  readonly level: HideLevel
  readonly mirrored: boolean
  /** В порядке заданий. */
  readonly targets: readonly Placement[]
  readonly decoys: readonly Placement[]
}

const gap = (a: Hideout, b: Hideout): number => Math.hypot(a.x - b.x, a.y - b.y)
const roomy = (spot: Hideout, taken: readonly Hideout[]): boolean =>
  taken.every((t) => t !== spot && gap(spot, t) >= HIDEOUT_MIN_GAP)
const suits = (spot: Hideout, item: HideItem): boolean => !spot.fits || spot.fits.includes(item.id)

/** «Легко» и «Средне» — только за предметами сцены; текстуры и «ку-ку» — для «Сложно». */
const openToLevel = (spot: Hideout, level: HideLevel): boolean => level === 'hard' || (!spot.kuku && !spot.texture)

function coverFor(spot: Hideout, level: HideLevel, rng: Rng): number {
  if (spot.kuku) return 1
  const { min, max } = LEVEL_COVER[level]
  return min + (max - min) * rng()
}

/**
 * Одна попытка расставить цели: на «Сложно» первая — в «ку-ку» (тому, кому там место),
 * остальные — каждому предмету случайное подходящее укрытие без наложений.
 */
function tryPlace(scene: HideScene, level: HideLevel, count: number, rng: Rng): Placement[] | null {
  const pool = shuffleCopy(scene.items, rng)
  const spots = shuffleCopy(
    scene.hideouts.filter((h) => !h.kuku && openToLevel(h, level)),
    rng,
  )
  const placed: Placement[] = []
  const taken: Hideout[] = []
  const used = new Set<string>()
  const put = (item: HideItem, hideout: Hideout): void => {
    placed.push({ item, hideout, cover: coverFor(hideout, level, rng) })
    taken.push(hideout)
    used.add(item.id)
  }

  if (level === 'hard') {
    const kukus = shuffleCopy(
      scene.hideouts.filter((h) => h.kuku),
      rng,
    )
    for (const spot of kukus) {
      const item = pool.find((i) => suits(spot, i))
      if (item) {
        put(item, spot)
        break
      }
    }
    if (placed.length === 0) return null
  }
  for (const item of pool) {
    if (placed.length >= count) break
    if (used.has(item.id)) continue
    const spot = spots.find((h) => suits(h, item) && roomy(h, taken))
    if (spot) put(item, spot)
  }
  return placed.length >= count ? placed : null
}

/** Обманка: свободный предмет цвета одной из целей, в подходящем укрытии поближе к ней. */
function pickDecoy(scene: HideScene, level: HideLevel, targets: readonly Placement[], rng: Rng): Placement | null {
  const used = new Set(targets.map((t) => t.item.id))
  const taken = targets.map((t) => t.hideout)
  const colors = new Set(targets.map((t) => t.item.color))
  const free = shuffleCopy(
    scene.items.filter((i) => !used.has(i.id)),
    rng,
  ).sort((a, b) => Number(colors.has(b.color)) - Number(colors.has(a.color)))
  for (const item of free) {
    const twin = targets.find((t) => t.item.color === item.color) ?? targets[0]!
    const spot = scene.hideouts
      .filter((h) => !h.kuku && openToLevel(h, level) && suits(h, item) && roomy(h, taken))
      .sort((a, b) => gap(a, twin.hideout) - gap(b, twin.hideout))[0]
    if (spot) return { item, hideout: spot, cover: DECOY_COVER }
  }
  return null
}

/**
 * Раунд: 3/4/5 случайных предметов туда, где им место по смыслу, порядок заданий случайный.
 * На «Сложно» одна цель — в «ку-ку», рядом обманка похожего цвета.
 */
export function buildRound(scene: HideScene, level: HideLevel, rng: Rng = Math.random, mirrored = false): HideRound {
  const count = LEVEL_TARGETS[level]
  let placed: Placement[] | null = null
  for (let attempt = 0; attempt < 200 && !placed; attempt += 1) placed = tryPlace(scene, level, count, rng)
  if (!placed) throw new Error(`hide-seek: на сцене ${scene.id} не хватает укрытий`)

  const targets = shuffleCopy(placed, rng)
  const decoy = level === 'hard' ? pickDecoy(scene, level, targets, rng) : null
  return { sceneId: scene.id, level, mirrored, targets, decoys: decoy ? [decoy] : [] }
}

export type TapResult = 'found' | 'other' | 'miss'

/** `tappedId` — предмет под пальцем или null (пустое место / неигровой предмет сцены). */
export function evaluateTap(
  round: HideRound,
  found: ReadonlySet<string>,
  currentId: string | null,
  tappedId: string | null,
): TapResult {
  if (!tappedId || found.has(tappedId)) return 'miss'
  if (tappedId === currentId) return 'found'
  return round.targets.some((t) => t.item.id === tappedId) ? 'other' : 'miss'
}

export function nextTargetId(round: HideRound, found: ReadonlySet<string>): string | null {
  return round.targets.find((t) => !found.has(t.item.id))?.item.id ?? null
}

/** «Ещё» — следующая по кругу сцена без звёздочки; все со звёздочкой — просто следующая. */
export function nextUnstarredScene(current: HideSceneId | null, stars: ReadonlySet<string>): HideSceneId {
  const ids = HIDE_SCENE_IDS
  const start = current ? ids.indexOf(current) : -1
  for (let step = 1; step <= ids.length; step += 1) {
    const id = ids[(start + step) % ids.length]!
    if (id !== current && !stars.has(id)) return id
  }
  return ids[(start + 1) % ids.length]!
}
