import { describe, expect, it } from 'vitest'
import {
  BALLOON_FIELD_COLORS,
  FREE_FIELD_COUNT,
  balloonMatchesTask,
  countTargets,
  createFieldForTask,
  createFreeFieldFromSeed,
  evaluatePop,
  hintForTask,
  pickOptionalTaskFromSeed,
} from '../../src/games/balloon-pop/logic'

describe('balloon-pop logic', () => {
  it('free field: 8 шаров, все 5 цветов, есть большие', () => {
    const field = createFreeFieldFromSeed(42)
    expect(field).toHaveLength(FREE_FIELD_COUNT)
    const colors = new Set(field.map((b) => b.color))
    expect(colors.size).toBe(5)
    for (const c of BALLOON_FIELD_COLORS) {
      expect(colors.has(c)).toBe(true)
    }
    expect(field.filter((b) => b.size === 'lg').length).toBeGreaterThanOrEqual(2)
  })

  it('one small: 4 lg + 1 sm, уникальные цвета', () => {
    const task = { type: 'one_size' as const, size: 'sm' as const }
    const field = createFieldForTask(task, () => 0.2)
    expect(field.filter((b) => b.size === 'sm')).toHaveLength(1)
    expect(field.filter((b) => b.size === 'lg')).toHaveLength(4)
    expect(new Set(field.map((b) => b.color)).size).toBe(5)
  })

  it('one big: 4 sm + 1 lg', () => {
    const task = { type: 'one_size' as const, size: 'lg' as const }
    const field = createFieldForTask(task, () => 0.2)
    expect(field.filter((b) => b.size === 'lg')).toHaveLength(1)
    expect(field.filter((b) => b.size === 'sm')).toHaveLength(4)
  })

  it('color_size: один целевой шар', () => {
    const task = {
      type: 'color_size' as const,
      color: 'yellow' as const,
      size: 'lg' as const,
    }
    const field = createFieldForTask(task, () => 0.3)
    expect(countTargets(task, field)).toBe(1)
    const target = field.find((b) => b.color === 'yellow' && b.size === 'lg')!
    expect(balloonMatchesTask(target, task)).toBe(true)
  })

  it('two big: 2 больших', () => {
    const task = { type: 'two_big' as const }
    const field = createFieldForTask(task, () => 0.1)
    expect(countTargets(task, field)).toBe(2)
  })

  it('all_color: два шарика цвета на поле', () => {
    const task = { type: 'all_color' as const, color: 'orange' as const }
    const field = createFieldForTask(task, () => 0.5)
    expect(field.filter((b) => b.color === 'orange')).toHaveLength(2)
    expect(countTargets(task, field)).toBe(2)
  })

  it('color task: ровно один шар нужного цвета на поле из 5', () => {
    const task = { type: 'color' as const, color: 'green' as const }
    const field = createFieldForTask(task, () => 0.5)
    expect(field.filter((b) => b.color === 'green')).toHaveLength(1)
    expect(balloonMatchesTask(field.find((b) => b.color === 'green')!, task)).toBe(true)
  })

  it('evaluatePop: при нуле оставшихся целей повторно задание не завершает', () => {
    const task = { type: 'all_color' as const, color: 'green' as const }
    const field = createFieldForTask(task, () => 0.1)
    const g = field.find((b) => b.color === 'green')!
    const r = evaluatePop(g, task, 0)
    expect(r.matchedTask).toBe(true)
    expect(r.taskCompleted).toBeFalsy()
  })

  it('evaluatePop multi: all_color — второй pop ещё не завершён', () => {
    const task = { type: 'all_color' as const, color: 'green' as const }
    const field = createFieldForTask(task, () => 0.1)
    const g = field.find((b) => b.color === 'green')!
    const r = evaluatePop(g, task, 2)
    expect(r.matchedTask).toBe(true)
    expect(r.taskCompleted).toBeFalsy()
    expect(r.hint).toMatch(/ещё/i)
  })

  it('hintForTask: свобода и цвет direct/together', () => {
    expect(hintForTask({ type: 'none' })).toMatch(/Шарики ждут/)
    expect(hintForTask({ type: 'color', color: 'red', tone: 'direct' })).toBe(
      'Лопни красный шарик.',
    )
    expect(hintForTask({ type: 'color', color: 'red', tone: 'together' })).toBe(
      'Давай лопнем красный шарик!',
    )
  })

  it('pickOptionalTask даёт известные типы', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const t = pickOptionalTaskFromSeed(seed)
      expect(hintForTask(t).length).toBeGreaterThan(0)
    }
  })
})
