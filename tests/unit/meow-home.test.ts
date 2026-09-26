import { describe, expect, it } from 'vitest'
import {
  careActionsFor,
  formatClock24,
  periodFromHour,
  sceneKindFor,
} from '../../src/games/meow-home/logic'

describe('meow-home time', () => {
  it('границы периодов', () => {
    expect(periodFromHour(7)).toBe('morning')
    expect(periodFromHour(12)).toBe('day')
    expect(periodFromHour(18)).toBe('evening')
    expect(periodFromHour(23)).toBe('night')
    expect(periodFromHour(3)).toBe('night')
  })

  it('уход утром/вечером, день/ночь — без ухода', () => {
    expect(careActionsFor('morning').length).toBeGreaterThan(0)
    expect(careActionsFor('evening').length).toBeGreaterThan(0)
    expect(careActionsFor('day')).toEqual([])
    expect(careActionsFor('night')).toEqual([])
  })

  it('сцены: ванная / комната / ночь', () => {
    expect(sceneKindFor('morning')).toBe('bathroom')
    expect(sceneKindFor('day')).toBe('room')
    expect(sceneKindFor('night')).toBe('night')
  })

  it('часы 24ч', () => {
    expect(formatClock24(new Date(2026, 0, 1, 9, 5))).toBe('09:05')
  })
})
