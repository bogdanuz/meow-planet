import { FIELD_COLORS, type FieldColor } from '../../shared/field-colors'
import {
  createSeededRandom,
  pickOne,
  shuffleCopy,
  type Rng,
} from '../../shared/random'

/** На небе только эти 5 — без синего/indigo (не путаем с небом). */
export const BALLOON_FIELD_COLORS = FIELD_COLORS

export type BalloonFieldColor = FieldColor

export type BalloonSize = 'sm' | 'lg'

export const BALLOON_SIZES: readonly BalloonSize[] = ['sm', 'lg']

/** Шаров в режиме «Задание». */
export const FIELD_COUNT = 5

/** Шаров в свободном небе (8 зон, random; крупный scale ≥ 0.78). */
export const FREE_FIELD_COUNT = 8

export const FREE_POPS_AFTER_TASK_SUCCESS = 3

export type BalloonSpec = {
  id: string
  color: BalloonFieldColor
  size: BalloonSize
}

/** «direct» = «Лопни …»; «together» = «Давай лопнем …» (викторина S14, 50/50). */
export type BalloonTaskTone = 'direct' | 'together'

export type BalloonTask =
  | { type: 'none' }
  | { type: 'color'; color: BalloonFieldColor; tone?: BalloonTaskTone }
  | { type: 'all_color'; color: BalloonFieldColor }
  | { type: 'color_size'; color: BalloonFieldColor; size: BalloonSize }
  | { type: 'one_size'; size: BalloonSize }
  | { type: 'two_big' }

export type PopEvaluation = {
  matchedTask: boolean
  hint: string
  taskCompleted?: boolean
}

const COLOR_LABEL_RU: Record<BalloonFieldColor, string> = {
  red: 'красный',
  orange: 'оранжевый',
  yellow: 'жёлтый',
  green: 'зелёный',
  violet: 'фиолетовый',
}

let idSeq = 0

export function resetBalloonIdSeq(): void {
  idSeq = 0
}

export function colorLabelRu(color: BalloonFieldColor): string {
  return COLOR_LABEL_RU[color]
}

const COLOR_PLURAL_RU: Record<BalloonFieldColor, string> = {
  red: 'красных',
  orange: 'оранжевых',
  yellow: 'жёлтых',
  green: 'зелёных',
  violet: 'фиолетовых',
}

export function colorPluralRu(color: BalloonFieldColor): string {
  return COLOR_PLURAL_RU[color]
}

/** Без рода: не «молодец/справился», чтобы не привязываться к полу ребёнка. */
/** ЗАФИКСИРОВАНО викториной владельца 23.09.2026; без рода. */
export const FREE_POP_PRAISES = [
  'Отлично!',
  'Ура! Давай ещё!',
  'Здорово!',
  'Продолжай!',
] as const

export const TASK_COMPLETE_PRAISES = [
  'Супер! Всё получилось!',
  'Здорово! Всё получилось!',
  'Класс! Всё получилось!',
] as const

export const MULTI_STEP_PRAISES = ['Ещё один!', 'Ещё шарик!'] as const

export const BALLOON_FREE_IDLE_LINE = 'Шарики ждут. Выбирай любой!'

export const BALLOON_WRONG_BALLOON_NUDGE = 'Это другой шарик. Давай найдём нужный!'

export function pickFreePopPraise(rng: Rng = Math.random): string {
  return pickOne(FREE_POP_PRAISES, rng)!
}

export function pickTaskCompletePraise(rng: Rng = Math.random): string {
  return pickOne(TASK_COMPLETE_PRAISES, rng)!
}

export function pickMultiStepPraise(rng: Rng = Math.random): string {
  return pickOne(MULTI_STEP_PRAISES, rng)!
}

export function hintForTask(task: BalloonTask): string {
  if (task.type === 'none') {
    return BALLOON_FREE_IDLE_LINE
  }
  if (task.type === 'color') {
    const label = COLOR_LABEL_RU[task.color]
    if (task.tone === 'together') {
      return `Давай лопнем ${label} шарик!`
    }
    return `Лопни ${label} шарик.`
  }
  if (task.type === 'all_color') {
    return `Давай лопнем оба ${colorPluralRu(task.color)} шарика!`
  }
  if (task.type === 'color_size') {
    const sizeWord = task.size === 'lg' ? 'большой' : 'маленький'
    return `Лопни ${sizeWord} ${COLOR_LABEL_RU[task.color]} шарик.`
  }
  if (task.type === 'one_size') {
    return task.size === 'lg'
      ? 'Лопни большой шарик.'
      : 'Лопни маленький шарик.'
  }
  return 'Лопни два больших шарика.'
}

export function softChainMessagesForTask(
  task: BalloonTask,
): { repeat: string; nudge: string; beforeHighlight: string } | null {
  if (task.type === 'none') return null
  const repeat = hintForTask(task)
  if (task.type === 'color') {
    return {
      repeat,
      nudge: BALLOON_WRONG_BALLOON_NUDGE,
      beforeHighlight: repeat,
    }
  }
  return {
    repeat,
    nudge: BALLOON_WRONG_BALLOON_NUDGE,
    beforeHighlight: repeat,
  }
}

export function countTargets(task: BalloonTask, field: readonly BalloonSpec[]): number {
  if (task.type === 'none') return 0
  if (task.type === 'color' || task.type === 'all_color') {
    return field.filter((b) => b.color === task.color).length
  }
  if (task.type === 'color_size') {
    return field.filter((b) => b.color === task.color && b.size === task.size).length
  }
  if (task.type === 'one_size') return field.filter((b) => b.size === task.size).length
  if (task.type === 'two_big') return field.filter((b) => b.size === 'lg').length
  return 0
}

export function balloonMatchesTask(
  balloon: BalloonSpec,
  task: BalloonTask,
): boolean {
  if (task.type === 'none') return true
  if (task.type === 'color' || task.type === 'all_color') {
    return balloon.color === task.color
  }
  if (task.type === 'color_size') {
    return balloon.color === task.color && balloon.size === task.size
  }
  if (task.type === 'one_size') {
    return balloon.size === task.size
  }
  if (task.type === 'two_big') return balloon.size === 'lg'
  return false
}

export function evaluatePop(
  balloon: BalloonSpec,
  task: BalloonTask,
  targetsRemainingBeforePop: number,
): PopEvaluation {
  if (task.type === 'none') {
    return { matchedTask: true, hint: pickFreePopPraise() }
  }
  const ok = balloonMatchesTask(balloon, task)
  if (!ok) {
    return { matchedTask: false, hint: hintForTask(task) }
  }
  const leftAfter = Math.max(0, targetsRemainingBeforePop - 1)
  if (leftAfter === 0 && targetsRemainingBeforePop > 0) {
    return {
      matchedTask: true,
      hint: pickTaskCompletePraise(),
      taskCompleted: true,
    }
  }
  return {
    matchedTask: true,
    hint:
      task.type === 'two_big' || task.type === 'all_color'
        ? pickMultiStepPraise()
        : hintForTask(task),
  }
}

export function createBalloon(
  rng: Rng = Math.random,
  overrides: Partial<Omit<BalloonSpec, 'id'>> = {},
): BalloonSpec {
  idSeq += 1
  return {
    id: `balloon-${idSeq}`,
    color: overrides.color ?? pickOne(BALLOON_FIELD_COLORS, rng)!,
    size: overrides.size ?? (rng() < 0.5 ? 'sm' : 'lg'),
  }
}

function assignUniqueColors(rng: Rng): BalloonFieldColor[] {
  return shuffleCopy(BALLOON_FIELD_COLORS, rng) as BalloonFieldColor[]
}

/** Свобода: все 5 цветов + повторы; ~40% больших — крупнее на экране. */
export function createFreeField(rng: Rng = Math.random): BalloonSpec[] {
  const base = assignUniqueColors(rng)
  const colors: BalloonFieldColor[] = [...base]
  while (colors.length < FREE_FIELD_COUNT) {
    colors.push(pickOne(BALLOON_FIELD_COLORS, rng)!)
  }
  return colors.map((color) =>
    createBalloon(rng, {
      color,
      size: rng() < 0.42 ? 'lg' : 'sm',
    }),
  )
}

function buildSizedField(
  rng: Rng,
  sizes: BalloonSize[],
): BalloonSpec[] {
  const colors = assignUniqueColors(rng)
  return sizes.map((size, i) =>
    createBalloon(rng, { color: colors[i]!, size }),
  )
}

export function createFieldForTask(task: BalloonTask, rng: Rng = Math.random): BalloonSpec[] {
  if (task.type === 'none') {
    return createFreeField(rng)
  }
  if (task.type === 'color') {
    const colors = assignUniqueColors(rng)
    return colors.map((color) => createBalloon(rng, { color, size: rng() < 0.5 ? 'sm' : 'lg' }))
  }
  if (task.type === 'all_color') {
    const others = assignUniqueColors(rng).filter((c) => c !== task.color).slice(0, 3)
    return [
      createBalloon(rng, { color: task.color, size: 'lg' }),
      createBalloon(rng, { color: task.color, size: 'sm' }),
      ...others.map((color) =>
        createBalloon(rng, { color, size: rng() < 0.5 ? 'sm' : 'lg' }),
      ),
    ]
  }
  if (task.type === 'one_size') {
    if (task.size === 'sm') {
      return buildSizedField(rng, ['lg', 'lg', 'lg', 'lg', 'sm'])
    }
    return buildSizedField(rng, ['sm', 'sm', 'sm', 'sm', 'lg'])
  }
  if (task.type === 'color_size') {
    const others = assignUniqueColors(rng).filter((c) => c !== task.color).slice(0, 4)
    return [
      createBalloon(rng, { color: task.color, size: task.size }),
      ...others.map((color) =>
        createBalloon(rng, { color, size: rng() < 0.5 ? 'sm' : 'lg' }),
      ),
    ]
  }
  if (task.type === 'two_big') {
    return buildSizedField(rng, ['lg', 'lg', 'sm', 'sm', 'sm'])
  }
  return createFreeField(rng)
}

/** ~50% цвет / ~50% размер+комбо (владелец S14). */
const TASK_POOL: BalloonTask[] = [
  ...BALLOON_FIELD_COLORS.map((color) => ({ type: 'color' as const, color })),
  { type: 'all_color', color: 'red' },
  { type: 'color_size', color: 'red', size: 'lg' },
  { type: 'one_size', size: 'sm' },
  { type: 'one_size', size: 'lg' },
  { type: 'two_big' },
  { type: 'two_big' },
]

export function pickOptionalTask(rng: Rng = Math.random): BalloonTask {
  const base = pickOne(TASK_POOL, rng)!
  if (base.type === 'all_color') {
    return {
      type: 'all_color',
      color: pickOne(BALLOON_FIELD_COLORS, rng)!,
    }
  }
  if (base.type === 'color_size') {
    return {
      type: 'color_size',
      color: pickOne(BALLOON_FIELD_COLORS, rng)!,
      size: pickOne(BALLOON_SIZES, rng)!,
    }
  }
  if (base.type === 'color') {
    return {
      type: 'color',
      color: base.color,
      tone: rng() < 0.5 ? 'direct' : 'together',
    }
  }
  return base
}

export function afterSuccessfulTask(): {
  task: BalloonTask
  cooldownFreePops: number
} {
  return { task: { type: 'none' }, cooldownFreePops: FREE_POPS_AFTER_TASK_SUCCESS }
}

export function tickTaskCooldown(
  cooldownFreePops: number,
  taskSessionEngaged: boolean,
  rng: Rng = Math.random,
): { cooldownFreePops: number; task: BalloonTask } {
  const next = Math.max(0, cooldownFreePops - 1)
  if (next > 0) {
    return { cooldownFreePops: next, task: { type: 'none' } }
  }
  if (taskSessionEngaged) {
    return { cooldownFreePops: 0, task: pickOptionalTask(rng) }
  }
  return { cooldownFreePops: 0, task: { type: 'none' } }
}

export function createFreeFieldFromSeed(seed: number): BalloonSpec[] {
  resetBalloonIdSeq()
  return createFreeField(createSeededRandom(seed))
}

export function pickOptionalTaskFromSeed(seed: number): BalloonTask {
  return pickOptionalTask(createSeededRandom(seed))
}
