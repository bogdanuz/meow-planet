import { describe, expect, it } from 'vitest'
import { floorShadow, paintOrder } from '../../src/games/shape-build/depth'
import type { PieceView } from '../../src/games/shape-build/physics'
import { getPieceSpec } from '../../src/games/shape-build/pieces'

const FLOOR = 10

function piece(id: number, kind: PieceView['kind'], x: number, y: number, over: Partial<PieceView> = {}): PieceView {
  return { id, kind, color: '#fff', x, y, angle: 0, size: 1, flip: false, ...over }
}

describe('Собери что угодно! — глубина: порядок и тени', () => {
  it('рисуем снизу вверх: верхний кубик закрывает верхнюю грань нижнего', () => {
    const top = piece(1, 'cube', 5, FLOOR - 3)
    const bottom = piece(2, 'cube', 5, FLOOR - 0.6)
    const middle = piece(3, 'cube', 5, FLOOR - 1.8)
    expect(paintOrder([top, bottom, middle]).map((v) => v.id)).toEqual([2, 3, 1])
  })

  it('при равной высоте порядок стабильный', () => {
    const a = piece(4, 'cube', 2, FLOOR - 0.6)
    const b = piece(1, 'cube', 6, FLOOR - 0.6)
    expect(paintOrder([a, b]).map((v) => v.id)).toEqual([1, 4])
  })

  it('порядок не меняет исходный список', () => {
    const list = [piece(1, 'cube', 5, 3), piece(2, 'cube', 5, 9)]
    paintOrder(list)
    expect(list.map((v) => v.id)).toEqual([1, 2])
  })

  it('деталь на полу — мягкая тень по её ширине прямо на полу', () => {
    const s = floorShadow(piece(1, 'brick', 4, FLOOR - 0.6), FLOOR)
    expect(s).not.toBeNull()
    expect(s!.x).toBeCloseTo(4)
    expect(s!.y).toBeCloseTo(FLOOR)
    expect(s!.rx).toBeGreaterThan((getPieceSpec('brick').w / 2) * 0.9)
    expect(s!.alpha).toBeGreaterThan(0.15)
    expect(s!.alpha).toBeLessThan(0.35)
  })

  it('чем выше деталь, тем тень бледнее и меньше; совсем высоко — тени нет', () => {
    const low = floorShadow(piece(1, 'cube', 4, FLOOR - 0.6), FLOOR)!
    const mid = floorShadow(piece(2, 'cube', 4, FLOOR - 2.4), FLOOR)!
    expect(mid.alpha).toBeLessThan(low.alpha)
    expect(mid.rx).toBeLessThan(low.rx)
    expect(floorShadow(piece(3, 'cube', 4, FLOOR - 9), FLOOR)).toBeNull()
  })

  it('большая деталь — тень шире, повёрнутая доска — уже', () => {
    const small = floorShadow(piece(1, 'plank', 4, FLOOR - 0.2), FLOOR)!
    const big = floorShadow(piece(2, 'plank', 4, FLOOR - 0.4, { size: 2 }), FLOOR)!
    const upright = floorShadow(piece(3, 'plank', 4, FLOOR - 2, { angle: Math.PI / 2 }), FLOOR)!
    expect(big.rx).toBeGreaterThan(small.rx * 1.8)
    expect(upright.rx).toBeLessThan(small.rx / 3)
  })

  it('кольцо висит на стене — тени на полу нет', () => {
    expect(floorShadow(piece(1, 'hoop', 4, FLOOR - 4), FLOOR)).toBeNull()
  })
})