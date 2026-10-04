import { pickOne, randomInt, shuffleCopy, type Rng } from '../../shared/random'
import { SORT_COLORS, SORT_KINDS, type SortColor, type SortKind } from './catalog'

export type SortToy = { id: string; kind: SortKind; color: SortColor }

export type SortTaskTone = 'direct' | 'together'

export type SortTask =
  | { type: 'one'; kind: SortKind; tone: SortTaskTone }
  | { type: 'all'; kind: SortKind; tone: SortTaskTone }
  | { type: 'color'; kind: SortKind; color: SortColor }
  | { type: 'allColor'; kind: SortKind; color: SortColor }

export type SortTaskType = SortTask['type']

/** Рост сложности: по 2 успеха на ступень, потом вперемешку. */
export const TASK_LEVELS: readonly SortTaskType[] = ['one', 'all', 'color', 'allColor']
export const SUCCESSES_PER_LEVEL = 2

export const FREE_KIND_COUNT = 4
export const FREE_PER_KIND = 3

export type SortRound = {
  kinds: SortKind[]
  toys: SortToy[]
  task: SortTask | null
}

export type SortRoundState = SortRound & { placed: Set<string> }

export type DropResult =
  | { type: 'ignored' }
  | { type: 'wrong'; kind: SortKind }
  | {
      type: 'placed'
      toyId: string
      kind: SortKind
      matchedTask: boolean
      taskDone: boolean
      roundDone: boolean
    }

let toySeq = 0

function nextToyId(): string {
  toySeq += 1
  return `toy-${toySeq}`
}

function makeToys(kind: SortKind, colors: readonly SortColor[]): SortToy[] {
  return colors.map((color) => ({ id: nextToyId(), kind, color }))
}

function sameSet(a: readonly SortKind[], b: readonly SortKind[]): boolean {
  return a.length === b.length && a.every((k) => b.includes(k))
}

/** Свободная куча: 4 вида × 3, у вида один цвет, цвета видов разные; набор видов меняется. */
export function createFreeRound(rng: Rng = Math.random, previousKinds: readonly SortKind[] = []): SortRound {
  const kinds = shuffleCopy(SORT_KINDS, rng).slice(0, FREE_KIND_COUNT)
  if (previousKinds.length > 0 && sameSet(kinds, previousKinds)) {
    const fresh = SORT_KINDS.filter((k) => !previousKinds.includes(k))
    const swap = pickOne(fresh, rng)
    if (swap) kinds[randomInt(0, kinds.length - 1, rng)] = swap
  }
  const colors = shuffleCopy(SORT_COLORS, rng)
  const toys = kinds.flatMap((kind, i) => makeToys(kind, Array(FREE_PER_KIND).fill(colors[i]!)))
  return { kinds, toys: shuffleCopy(toys, rng), task: null }
}

function otherColors(color: SortColor, count: number, rng: Rng): SortColor[] {
  return shuffleCopy(
    SORT_COLORS.filter((c) => c !== color),
    rng,
  ).slice(0, count)
}

/** Отвлекающие виды: 1–2 вида, у каждого ≥1 игрушка, один цвет на вид, не цвет цели. */
function distractors(
  target: SortKind,
  targetColor: SortColor,
  count: number,
  rng: Rng,
): { kinds: SortKind[]; toys: SortToy[] } {
  const kindCount = count >= 2 ? randomInt(1, 2, rng) : 1
  const kinds = shuffleCopy(
    SORT_KINDS.filter((k) => k !== target),
    rng,
  ).slice(0, kindCount)
  const counts = kinds.map(() => 1)
  for (let left = count - kinds.length; left > 0; left -= 1) {
    counts[randomInt(0, counts.length - 1, rng)]! += 1
  }
  const palette = otherColors(targetColor, SORT_COLORS.length - 1, rng)
  const toys = kinds.flatMap((kind, i) => makeToys(kind, Array(counts[i]!).fill(palette[i % palette.length]!)))
  return { kinds, toys }
}

/** Маленькая куча задания: 5–6 игрушек из 2–3 видов, цель всегда есть. */
export function createTaskRound(type: SortTaskType, rng: Rng = Math.random, tone: SortTaskTone = 'direct'): SortRound {
  const kind = pickOne(SORT_KINDS, rng)!
  const color = pickOne(SORT_COLORS, rng)!
  let task: SortTask
  let targetColors: SortColor[]
  let total: number
  switch (type) {
    case 'one':
      task = { type, kind, tone }
      targetColors = Array(randomInt(1, 2, rng)).fill(color)
      total = 5
      break
    case 'all':
      task = { type, kind, tone }
      targetColors = Array(randomInt(2, 3, rng)).fill(color)
      total = randomInt(5, 6, rng)
      break
    case 'color':
      task = { type, kind, color }
      targetColors = [color, ...otherColors(color, randomInt(1, 2, rng), rng)]
      total = randomInt(5, 6, rng)
      break
    case 'allColor':
      task = { type, kind, color }
      targetColors = [color, color, ...otherColors(color, randomInt(1, 2, rng), rng)]
      total = 6
      break
  }
  const rest = distractors(kind, color, total - targetColors.length, rng)
  const toys = [...makeToys(kind, targetColors), ...rest.toys]
  return { kinds: shuffleCopy([kind, ...rest.kinds], rng), toys: shuffleCopy(toys, rng), task }
}

export function createRoundState(round: SortRound): SortRoundState {
  return { ...round, placed: new Set() }
}

export function toyMatchesTask(toy: SortToy, task: SortTask): boolean {
  if (toy.kind !== task.kind) return false
  return task.type === 'one' || task.type === 'all' || toy.color === task.color
}

/** Сколько ещё целей до конца задания; без задания — 0. */
export function taskTargetsLeft(state: SortRoundState): number {
  const task = state.task
  if (!task) return 0
  const targets = state.toys.filter((t) => toyMatchesTask(t, task))
  const left = targets.filter((t) => !state.placed.has(t.id)).length
  if (task.type === 'one' || task.type === 'color') return left < targets.length ? 0 : 1
  return left
}

export function isRoundComplete(state: SortRoundState): boolean {
  return state.toys.every((t) => state.placed.has(t.id))
}

export function evaluateDrop(state: SortRoundState, toyId: string, binKind: SortKind): DropResult {
  const toy = state.toys.find((t) => t.id === toyId)
  if (!toy || state.placed.has(toyId)) return { type: 'ignored' }
  if (toy.kind !== binKind) return { type: 'wrong', kind: toy.kind }
  const wasOpen = state.task !== null && taskTargetsLeft(state) > 0
  state.placed.add(toyId)
  const matchedTask = state.task !== null && wasOpen && toyMatchesTask(toy, state.task)
  return {
    type: 'placed',
    toyId,
    kind: toy.kind,
    matchedTask,
    taskDone: matchedTask && taskTargetsLeft(state) === 0,
    roundDone: isRoundComplete(state),
  }
}

export type TaskProgress = { level: number; successes: number }

export function createTaskProgress(): TaskProgress {
  return { level: 0, successes: 0 }
}

export function advanceTaskProgress(p: TaskProgress): TaskProgress {
  if (p.level >= TASK_LEVELS.length) return p
  const successes = p.successes + 1
  if (successes >= SUCCESSES_PER_LEVEL) return { level: p.level + 1, successes: 0 }
  return { level: p.level, successes }
}

export function taskTypeForProgress(p: TaskProgress, rng: Rng = Math.random): SortTaskType {
  return TASK_LEVELS[p.level] ?? pickOne(TASK_LEVELS, rng)!
}
