/** «Учимся считать» S16: задания, проверка, раскладка ящика и коврика. Без DOM. */
import { randomInt, shuffleCopy, type Rng } from '../../shared/random'
import { COUNTING_TASK_IDS } from '../../shared/storage'
import { TOY_COLORS, type ToyColor } from '../../shared/toys'

export type TaskType = 'give' | 'count' | 'add' | 'remove' | 'howMany' | 'compare'

/** Галочки взрослого в настройках; «Добавь / убери одну» — одна галочка на два типа. */
export const TASK_TOGGLES = COUNTING_TASK_IDS

/** Порядок по кругу: «добавь» и «убери» не идут подряд. */
const TYPE_ORDER: readonly TaskType[] = ['give', 'count', 'add', 'howMany', 'remove', 'compare']

export function enabledTaskTypes(toggles: readonly string[]): TaskType[] {
  const on = new Set(toggles)
  const types = TYPE_ORDER.filter((t) => on.has(t === 'add' || t === 'remove' ? 'addRemove' : t))
  return types.length ? types : ['give']
}

export type CountTask =
  | { type: 'give'; target: number; rug: number }
  | { type: 'count'; target: number }
  | { type: 'add'; start: number; rug: number }
  | { type: 'remove'; start: number }
  | { type: 'howMany'; target: number }
  | { type: 'compare'; left: number; right: number }

export type TaskProgress = { readonly solved: number; readonly turn: number }

export const createProgress = (): TaskProgress => ({ solved: 0, turn: 0 })
export const advanceProgress = (p: TaskProgress): TaskProgress => ({ solved: p.solved + 1, turn: p.turn + 1 })

/** Начинаем с чисел до 3, каждые 3 задания — на одно больше, не выше «Считаем до». */
export function taskMax(p: TaskProgress, limit: number): number {
  return Math.min(limit, 3 + Math.floor(p.solved / 3))
}

export function nextTaskType(p: TaskProgress, types: readonly TaskType[]): TaskType {
  return types[p.turn % types.length]!
}

export function buildTask(type: TaskType, max: number, rng: Rng): CountTask {
  switch (type) {
    case 'give': {
      const target = randomInt(1, max, rng)
      return { type, target, rug: Math.min(10, Math.max(max, target + 2)) }
    }
    case 'count':
      return { type, target: randomInt(2, max, rng) }
    case 'add':
      return { type, start: randomInt(1, max - 1, rng), rug: 3 }
    case 'remove':
      return { type, start: randomInt(2, max, rng) }
    case 'howMany':
      return { type, target: randomInt(1, max, rng) }
    case 'compare': {
      const [left, right] = shuffleCopy(
        Array.from({ length: max }, (_, i) => i + 1),
        rng,
      )
      return { type, left: left!, right: right! }
    }
  }
}

export type StepResult = 'wait' | 'done' | 'too-many' | 'wrong-way'

export function checkGive(count: number, target: number): Exclude<StepResult, 'wrong-way'> {
  if (count === target) return 'done'
  return count > target ? 'too-many' : 'wait'
}

export function checkAdd(count: number, start: number): StepResult {
  if (count === start + 1) return 'done'
  if (count > start + 1) return 'too-many'
  return count < start ? 'wrong-way' : 'wait'
}

export function checkRemove(count: number, start: number): StepResult {
  if (count === start - 1) return 'done'
  if (count < start - 1) return 'too-many'
  return count > start ? 'wrong-way' : 'wait'
}

export function biggerSide(task: { left: number; right: number }): 'left' | 'right' {
  return task.left > task.right ? 'left' : 'right'
}

/** Цвета вперемешку: по кругу из перемешанных четырёх, соседние не совпадают. */
export function mixedColors(n: number, rng: Rng): ToyColor[] {
  const out: ToyColor[] = []
  let deck: ToyColor[] = []
  while (out.length < n) {
    if (!deck.length) {
      deck = shuffleCopy(TOY_COLORS, rng)
      if (deck[0] === out[out.length - 1]) deck.push(deck.shift()!)
    }
    out.push(deck.shift()!)
  }
  return out
}

/** Место игрушки в ящике: x и scale — доли ширины проёма, y — доля высоты проёма (центр). */
export type BoxSlot = { x: number; y: number; scale: number; rot: number }

const TILT = [-6, 5, -3, 7, -5, 4, -7, 3, -4, 6]

function row(count: number, y: number, scale: number, gap: number): Omit<BoxSlot, 'rot'>[] {
  const step = scale + gap
  const start = 0.5 - (step * (count - 1)) / 2
  return Array.from({ length: count }, (_, i) => ({ x: start + i * step, y, scale }))
}

/** Каждую игрушку видно целиком: до 5 — один ряд, больше — второй ряд сзади, выше. */
export function boxSlots(n: number): BoxSlot[] {
  if (n <= 0) return []
  let slots: Omit<BoxSlot, 'rot'>[]
  if (n <= 3) slots = row(n, 0.66, 0.29, 0.03)
  else if (n <= 5) slots = row(n, 0.7, 0.19, 0.005)
  else slots = [...row(5, 0.78, 0.19, 0.005), ...row(n - 5, 0.5, 0.18, 0.012)]
  return slots.map((s, i) => ({ ...s, rot: TILT[i % TILT.length]! }))
}

/** Рамка нарисованного коврика на фоне (`counting-bg`, овал вписан в рамку): ширина / высота. */
export const RUG_ASPECT = 588 / 285
const RUG_TOY_MAX = 0.2
/** Низ игрушки (на что она «встаёт») — ниже центра на эту долю её высоты. */
const FOOT = 0.35

/**
 * Коврик: до 4 игрушек — один ряд, больше — два (сзади на одну меньше или столько же).
 * x, y — центр игрушки в долях рамки коврика; toyW — ширина игрушки в долях ширины коврика.
 * Размер — самый крупный, при котором низ каждой игрушки стоит внутри овала.
 */
export type RugLayout = { rows: number; toyW: number; slots: { x: number; y: number; rot: number }[] }

export function rugSlots(n: number, rng: Rng): RugLayout {
  const rows = n <= 4 ? 1 : 2
  const back = rows === 1 ? 0 : Math.floor(n / 2)
  const front = n - back
  const jitter = Array.from({ length: n }, () => ({
    x: (rng() - 0.5) * 0.12,
    y: (rng() - 0.5) * 0.06,
    rot: Math.round((rng() - 0.5) * 16),
  }))
  const onRug = (x: number, y: number, tw: number, th: number): boolean => {
    const a = 0.5 - tw * 0.4
    const b = 0.5 - th * 0.12
    const fx = (x - 0.5) / a
    const fy = (y + th * FOOT - 0.5) / b
    return fx * fx + fy * fy <= 1 && y + th / 2 <= 1
  }
  const layout = (tw: number): RugLayout['slots'] | null => {
    const th = tw * RUG_ASPECT
    const step = tw * 1.08
    const sep = th * 0.62
    const feet = rows === 1 ? [0.52] : [0.5 - sep / 2, 0.5 + sep / 2]
    const counts = rows === 1 ? [front] : [back, front]
    const slots: RugLayout['slots'] = []
    counts.forEach((count, r) => {
      const stagger = rows === 2 && back === front ? (r === 0 ? -0.25 : 0.25) * step : 0
      for (let i = 0; i < count; i += 1) {
        const j = jitter[slots.length]!
        slots.push({
          x: 0.5 + (i - (count - 1) / 2) * step + stagger + j.x * tw,
          y: feet[r]! - th * FOOT + j.y * th,
          rot: j.rot,
        })
      }
    })
    return slots.every((s) => onRug(s.x, s.y, tw, th)) ? slots : null
  }
  for (let tw = RUG_TOY_MAX; tw > 0.04; tw -= 0.005) {
    const slots = layout(tw)
    if (slots) return { rows, toyW: tw, slots }
  }
  return { rows, toyW: 0.04, slots: layout(0.04) ?? [] }
}
