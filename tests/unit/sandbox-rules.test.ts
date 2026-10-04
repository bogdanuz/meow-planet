import { describe, expect, it } from 'vitest'
import {
  SIZE_STEPS,
  chooseDropX,
  fingerVelocity,
  nextSize,
  rotateQuarter,
  shelfKinds,
  snapRightAngle,
  spawnCheck,
} from '../../src/games/shape-build/rules'
import { BLOCK_KINDS, PIECE_KINDS, SHELF_KINDS } from '../../src/games/shape-build/pieces'

describe('spawnCheck: можно ли достать деталь из шкафа', () => {
  it('деревянных — сколько угодно, пока не предел', () => {
    expect(spawnCheck('cube', Array(39).fill('cube'), 40)).toBe('ok')
    expect(spawnCheck('cube', Array(40).fill('cube'), 40)).toBe('full')
  })

  it('предметов одного вида — не больше шести', () => {
    expect(spawnCheck('spring', Array(5).fill('spring'), 40)).toBe('ok')
    expect(spawnCheck('spring', Array(6).fill('spring'), 40)).toBe('kind-max')
    expect(spawnCheck('ball', Array(6).fill('spring'), 40)).toBe('ok')
  })

  it('полный экран важнее лимита вида', () => {
    expect(spawnCheck('ball', Array(20).fill('cube'), 20)).toBe('full')
  })
})

describe('выравнивание и поворот', () => {
  it('snapRightAngle — к ближайшим 90°', () => {
    expect(snapRightAngle(0.2)).toBeCloseTo(0)
    expect(snapRightAngle(1.4)).toBeCloseTo(Math.PI / 2)
    expect(snapRightAngle(-1.7)).toBeCloseTo(-Math.PI / 2)
    expect(snapRightAngle(3.0)).toBeCloseTo(Math.PI)
  })

  it('rotateQuarter — ровно +90° от выровненного', () => {
    expect(rotateQuarter(0)).toBeCloseTo(Math.PI / 2)
    expect(rotateQuarter(0.3)).toBeCloseTo(Math.PI / 2)
    expect(rotateQuarter(Math.PI / 2 - 0.1)).toBeCloseTo(Math.PI)
  })
})

describe('размер детали: кнопки «Больше / Меньше»', () => {
  it('шаги от маленькой до большой, обычная — 1', () => {
    expect(SIZE_STEPS).toEqual([0.6, 1, 1.5, 2])
  })

  it('следующий шаг; на краю — null', () => {
    expect(nextSize(1, 1)).toBe(1.5)
    expect(nextSize(1, -1)).toBe(0.6)
    expect(nextSize(2, 1)).toBeNull()
    expect(nextSize(0.6, -1)).toBeNull()
  })

  it('чужой размер прижимается к ближайшему шагу', () => {
    expect(nextSize(1.1, 1)).toBe(1.5)
  })
})

describe('chooseDropX: куда упадёт деталь из шкафа', () => {
  const floor = 10

  it('в пустой комнате — в середину', () => {
    expect(chooseDropX({ left: 0, right: 12, halfW: 0.6, floorY: floor, topAt: () => null })).toBeCloseTo(6, 0)
  })

  it('если в середине башня — рядом, где свободно', () => {
    const topAt = (x0: number, x1: number): number | null => (x1 > 5 && x0 < 7 ? floor - 6 : null)
    const x = chooseDropX({ left: 0, right: 12, halfW: 0.6, floorY: floor, topAt })
    expect(x < 5 - 0.6 || x > 7 + 0.6).toBe(true)
    expect(Math.abs(x - 6)).toBeLessThan(4)
  })

  it('всегда внутри стен', () => {
    expect(chooseDropX({ left: 3, right: 6, halfW: 1.5, floorY: floor, topAt: () => floor - 1 })).toBeCloseTo(4.5)
    expect(chooseDropX({ left: 3, right: 4, halfW: 1.5, floorY: floor, topAt: () => null })).toBeCloseTo(3.5)
  })
})

describe('fingerVelocity: скорость пальца для броска', () => {
  it('по последним ~100 мс', () => {
    const v = fingerVelocity([
      { x: 0, y: 0, at: 0 },
      { x: 100, y: 0, at: 300 },
      { x: 120, y: -10, at: 350 },
      { x: 160, y: -30, at: 400 },
    ])
    expect(v.x).toBeCloseTo(600, -1)
    expect(v.y).toBeCloseTo(-300, -1)
  })

  it('палец замер перед отпусканием — броска нет', () => {
    const v = fingerVelocity([
      { x: 0, y: 0, at: 0 },
      { x: 100, y: 0, at: 100 },
      { x: 100, y: 0, at: 400 },
    ])
    expect(Math.hypot(v.x, v.y)).toBeLessThan(1)
  })

  it('мало точек — ноль', () => {
    expect(fingerVelocity([])).toEqual({ x: 0, y: 0 })
    expect(fingerVelocity([{ x: 1, y: 1, at: 0 }])).toEqual({ x: 0, y: 0 })
  })
})

describe('shelfKinds: что лежит в шкафу', () => {
  it('по умолчанию всё, кроме ведёрка (оно появляется, только когда срезали верёвку блока)', () => {
    expect(shelfKinds([])).toEqual([...SHELF_KINDS])
    expect(shelfKinds([])).not.toContain('bucket')
  })

  it('спрятанные взрослым — убраны, чужие названия игнорируются', () => {
    expect(shelfKinds(['stone', 'nope'])).toEqual(SHELF_KINDS.filter((k) => k !== 'stone'))
  })

  it('если спрятали все деревянные — кубик всё равно остаётся', () => {
    const kinds = shelfKinds([...PIECE_KINDS])
    expect(kinds).toEqual(['cube'])
    expect(shelfKinds([...BLOCK_KINDS])).toContain('cube')
  })
})
