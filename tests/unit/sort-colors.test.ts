import { describe, expect, it } from 'vitest'
import { createSeededRandom } from '../../src/shared/random'
import { resolveMatchDrop } from '../../src/shared/placement'
import {
  SORT_COLORS,
  SORT_KINDS,
  sortBinLabelRu,
  sortToyLabelRu,
} from '../../src/games/sort-colors/catalog'
import {
  advanceTaskProgress,
  createFreeRound,
  createRoundState,
  createTaskProgress,
  createTaskRound,
  evaluateDrop,
  FREE_KIND_COUNT,
  FREE_PER_KIND,
  isRoundComplete,
  SUCCESSES_PER_LEVEL,
  TASK_LEVELS,
  taskTargetsLeft,
  toyMatchesTask,
  type SortTask,
  type SortToy,
} from '../../src/games/sort-colors/logic'

const toy = (id: string, kind: SortToy['kind'], color: SortToy['color']): SortToy => ({ id, kind, color })

describe('sort-colors catalog', () => {
  it('7 видов и 4 цвета в зафиксированном порядке', () => {
    expect(SORT_KINDS).toEqual(['ball', 'cube', 'star', 'pyramid', 'heart', 'duck', 'ring'])
    expect(SORT_COLORS).toEqual(['red', 'yellow', 'blue', 'green'])
  })

  it('подписи для aria согласуют род', () => {
    expect(sortToyLabelRu('ball', 'red')).toBe('красный мячик')
    expect(sortToyLabelRu('star', 'blue')).toBe('синяя звёздочка')
    expect(sortToyLabelRu('heart', 'green')).toBe('зелёное сердечко')
    expect(sortToyLabelRu('duck', 'yellow')).toBe('жёлтая уточка')
    expect(sortBinLabelRu('ball')).toBe('Ящик с мячиками')
    expect(sortBinLabelRu('star')).toBe('Ящик со звёздочками')
  })

  it('shared placement: совпадение и soft-error', () => {
    expect(resolveMatchDrop('ball', 'ball', 'hint')).toEqual({ ok: true })
    expect(resolveMatchDrop('ball', 'cube', 'В ящик с мячиками')).toEqual({
      ok: false,
      soft: true,
      message: 'В ящик с мячиками',
    })
  })
})

describe('sort-colors free round', () => {
  it('4 вида × 3 игрушки, у каждого вида свой цвет', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const round = createFreeRound(createSeededRandom(seed))
      expect(round.kinds).toHaveLength(FREE_KIND_COUNT)
      expect(new Set(round.kinds).size).toBe(FREE_KIND_COUNT)
      expect(round.toys).toHaveLength(FREE_KIND_COUNT * FREE_PER_KIND)
      const colorByKind = new Map<string, string>()
      for (const t of round.toys) {
        expect(round.kinds).toContain(t.kind)
        const prev = colorByKind.get(t.kind)
        if (prev) expect(t.color).toBe(prev)
        colorByKind.set(t.kind, t.color)
      }
      expect(new Set(colorByKind.values()).size).toBe(FREE_KIND_COUNT)
      expect(new Set(round.toys.map((t) => t.id)).size).toBe(round.toys.length)
      expect(round.task).toBeNull()
    }
  })

  it('следующая куча — другой набор видов', () => {
    const rng = createSeededRandom(9)
    let prev = createFreeRound(rng)
    for (let i = 0; i < 20; i += 1) {
      const next = createFreeRound(rng, prev.kinds)
      expect([...next.kinds].sort()).not.toEqual([...prev.kinds].sort())
      prev = next
    }
  })
})

describe('sort-colors task rounds', () => {
  it('уровни сложности в порядке one → all → color → allColor', () => {
    expect(TASK_LEVELS).toEqual(['one', 'all', 'color', 'allColor'])
    expect(SUCCESSES_PER_LEVEL).toBe(2)
  })

  it('каждый тип задания: маленькая куча 5–6, 2–3 вида, цель есть', () => {
    for (const type of TASK_LEVELS) {
      for (let seed = 1; seed <= 25; seed += 1) {
        const round = createTaskRound(type, createSeededRandom(seed * 7), 'direct')
        const task = round.task!
        expect(task.type).toBe(type)
        expect(round.toys.length).toBeGreaterThanOrEqual(5)
        expect(round.toys.length).toBeLessThanOrEqual(6)
        expect(round.kinds.length).toBeGreaterThanOrEqual(2)
        expect(round.kinds.length).toBeLessThanOrEqual(3)
        expect(new Set(round.toys.map((t) => t.kind))).toEqual(new Set(round.kinds))
        const targets = round.toys.filter((t) => toyMatchesTask(t, task))
        expect(targets.length).toBeGreaterThan(0)
      }
    }
  })

  it('цветные задания: есть тот же вид другого цвета (отвлекающий)', () => {
    for (const type of ['color', 'allColor'] as const) {
      for (let seed = 1; seed <= 25; seed += 1) {
        const round = createTaskRound(type, createSeededRandom(seed), 'direct')
        const task = round.task as Extract<SortTask, { color: unknown }>
        const sameKindOther = round.toys.filter((t) => t.kind === task.kind && t.color !== task.color)
        expect(sameKindOther.length).toBeGreaterThan(0)
        const targets = round.toys.filter((t) => toyMatchesTask(t, task))
        if (type === 'color') expect(targets).toHaveLength(1)
        else expect(targets.length).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('отвлекающие виды другого цвета, чем цель — куча пёстрая', () => {
    for (const type of TASK_LEVELS) {
      for (let seed = 1; seed <= 25; seed += 1) {
        const round = createTaskRound(type, createSeededRandom(seed * 3), 'direct')
        const task = round.task!
        const targetColor = 'color' in task ? task.color : round.toys.find((t) => t.kind === task.kind)!.color
        const others = round.toys.filter((t) => t.kind !== task.kind)
        expect(others.every((t) => t.color !== targetColor)).toBe(true)
      }
    }
  })

  it('«все одного вида»: целей 2–3', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const round = createTaskRound('all', createSeededRandom(seed), 'together')
      const targets = round.toys.filter((t) => toyMatchesTask(t, round.task!))
      expect(targets.length).toBeGreaterThanOrEqual(2)
      expect(targets.length).toBeLessThanOrEqual(3)
      expect(round.task).toMatchObject({ type: 'all', tone: 'together' })
    }
  })
})

describe('sort-colors drop evaluation', () => {
  it('свободный режим: свой ящик — placed, чужой — wrong, раунд закончен когда пусто', () => {
    const state = createRoundState({
      kinds: ['ball', 'cube'],
      toys: [toy('a', 'ball', 'red'), toy('b', 'cube', 'blue')],
      task: null,
    })
    expect(evaluateDrop(state, 'a', 'cube')).toEqual({ type: 'wrong', kind: 'ball' })
    expect(state.placed.size).toBe(0)
    expect(evaluateDrop(state, 'a', 'ball')).toMatchObject({ type: 'placed', kind: 'ball', roundDone: false })
    expect(evaluateDrop(state, 'b', 'cube')).toMatchObject({ type: 'placed', roundDone: true })
    expect(isRoundComplete(state)).toBe(true)
  })

  it('уже положенную игрушку повторно не оцениваем', () => {
    const state = createRoundState({ kinds: ['ball'], toys: [toy('a', 'ball', 'red')], task: null })
    evaluateDrop(state, 'a', 'ball')
    expect(evaluateDrop(state, 'a', 'ball')).toEqual({ type: 'ignored' })
  })

  it('задание «один»: цель → taskDone; другая игрушка в свой ящик → accepted+remind', () => {
    const state = createRoundState({
      kinds: ['ball', 'cube'],
      toys: [toy('a', 'ball', 'red'), toy('b', 'cube', 'blue'), toy('c', 'cube', 'blue')],
      task: { type: 'one', kind: 'cube', tone: 'direct' },
    })
    expect(evaluateDrop(state, 'a', 'ball')).toMatchObject({ type: 'placed', matchedTask: false, taskDone: false })
    expect(evaluateDrop(state, 'b', 'ball')).toEqual({ type: 'wrong', kind: 'cube' })
    expect(evaluateDrop(state, 'b', 'cube')).toMatchObject({ type: 'placed', matchedTask: true, taskDone: true })
  })

  it('задание «все красные мячики»: шаги до последней цели', () => {
    const state = createRoundState({
      kinds: ['ball', 'cube'],
      toys: [
        toy('a', 'ball', 'red'),
        toy('b', 'ball', 'red'),
        toy('c', 'ball', 'blue'),
        toy('d', 'cube', 'red'),
      ],
      task: { type: 'allColor', kind: 'ball', color: 'red' },
    })
    expect(taskTargetsLeft(state)).toBe(2)
    expect(evaluateDrop(state, 'c', 'ball')).toMatchObject({ matchedTask: false, taskDone: false })
    expect(evaluateDrop(state, 'a', 'ball')).toMatchObject({ matchedTask: true, taskDone: false })
    expect(taskTargetsLeft(state)).toBe(1)
    expect(evaluateDrop(state, 'b', 'ball')).toMatchObject({ matchedTask: true, taskDone: true })
  })
})

describe('sort-colors progression', () => {
  it('2 успеха на уровень, после последнего — смешанный режим', () => {
    let p = createTaskProgress()
    expect(p.level).toBe(0)
    p = advanceTaskProgress(p)
    expect(p.level).toBe(0)
    p = advanceTaskProgress(p)
    expect(p.level).toBe(1)
    for (let i = 0; i < 6; i += 1) p = advanceTaskProgress(p)
    expect(p.level).toBe(TASK_LEVELS.length)
    p = advanceTaskProgress(p)
    expect(p.level).toBe(TASK_LEVELS.length)
  })
})
