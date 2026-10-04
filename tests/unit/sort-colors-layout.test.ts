import { describe, expect, it } from 'vitest'
import { createSeededRandom } from '../../src/shared/random'
import { layoutPile, pileRows, topmostAt, type PileSlot } from '../../src/games/sort-colors/pile-layout'
import { binSlots } from '../../src/games/sort-colors/bin-fill'

const BOX = { width: 900, height: 260, item: 120 }

describe('pile-layout', () => {
  it('ряды горки: широкий низ, узкий верх', () => {
    expect(pileRows(12)).toEqual([5, 4, 3])
    expect(pileRows(6)).toEqual([3, 2, 1])
    expect(pileRows(5)).toEqual([3, 2])
    expect(pileRows(1)).toEqual([1])
    expect(pileRows(0)).toEqual([])
  })

  it('все игрушки внутри полосы, верхние ряды выше и поверх', () => {
    for (const count of [1, 5, 6, 12]) {
      const slots = layoutPile(count, BOX, createSeededRandom(count))
      expect(slots).toHaveLength(count)
      const half = BOX.item / 2
      for (const s of slots) {
        expect(s.x).toBeGreaterThanOrEqual(half - 1)
        expect(s.x).toBeLessThanOrEqual(BOX.width - half + 1)
        expect(s.y).toBeGreaterThanOrEqual(half - 1)
        expect(s.y).toBeLessThanOrEqual(BOX.height - half + 1)
        expect(Math.abs(s.rot)).toBeLessThanOrEqual(25)
      }
      expect(new Set(slots.map((s) => s.z)).size).toBe(count)
      const byRow = new Map<number, PileSlot[]>()
      for (const s of slots) byRow.set(s.row, [...(byRow.get(s.row) ?? []), s])
      for (let r = 1; r < byRow.size; r += 1) {
        const lowMaxZ = Math.max(...byRow.get(r - 1)!.map((s) => s.z))
        const highMinZ = Math.min(...byRow.get(r)!.map((s) => s.z))
        expect(highMinZ).toBeGreaterThan(lowMaxZ)
        const lowY = Math.min(...byRow.get(r - 1)!.map((s) => s.y))
        const highY = Math.max(...byRow.get(r)!.map((s) => s.y))
        expect(highY).toBeLessThan(lowY)
      }
    }
  })

  it('та же семечка — та же горка', () => {
    expect(layoutPile(12, BOX, createSeededRandom(4))).toEqual(layoutPile(12, BOX, createSeededRandom(4)))
  })

  it('topmostAt: под пальцем берётся верхняя игрушка, мимо — null', () => {
    const items = [
      { id: 'low', x: 100, y: 100, size: 100, rot: 0, z: 1 },
      { id: 'top', x: 130, y: 100, size: 100, rot: 0, z: 5 },
    ]
    expect(topmostAt(115, 100, items)).toBe('top')
    expect(topmostAt(60, 100, items)).toBe('low')
    expect(topmostAt(400, 400, items)).toBeNull()
  })

  it('topmostAt: альфа-маска пропускает прозрачный угол к нижней игрушке', () => {
    const items = [
      { id: 'low', x: 100, y: 100, size: 100, rot: 0, z: 1 },
      { id: 'top', x: 140, y: 100, size: 100, rot: 0, z: 5 },
    ]
    const opaque = (id: string, u: number) => (id === 'top' ? u > 0.5 : true)
    expect(topmostAt(110, 100, items, opaque)).toBe('low')
    expect(topmostAt(160, 100, items, opaque)).toBe('top')
  })

  it('topmostAt: дырка колечка — если под пальцем ничего не видно, берётся игрушка по овалу', () => {
    const ringHole = (id: string, u: number, v: number) =>
      id !== 'ring' || (u - 0.5) ** 2 + (v - 0.5) ** 2 > 0.04
    const ring = { id: 'ring', x: 100, y: 100, size: 100, rot: 0, z: 5 }
    expect(topmostAt(100, 100, [ring], ringHole)).toBe('ring')
    const below = { id: 'below', x: 100, y: 100, size: 100, rot: 0, z: 1 }
    expect(topmostAt(100, 100, [ring, below], ringHole)).toBe('below')
    expect(topmostAt(400, 400, [ring], ringHole)).toBeNull()
  })
})

describe('bin-fill', () => {
  it('ящик заполнен целиком: чем меньше игрушек, тем они крупнее', () => {
    let prevScale = Infinity
    for (let n = 1; n <= 6; n += 1) {
      const slots = binSlots(n)
      expect(slots).toHaveLength(n)
      const scale = slots[0]!.scale
      expect(slots.every((s) => s.scale === scale)).toBe(true)
      expect(scale).toBeLessThanOrEqual(prevScale)
      prevScale = scale
      const left = Math.min(...slots.map((s) => s.x - s.scale / 2))
      const right = Math.max(...slots.map((s) => s.x + s.scale / 2))
      expect(left).toBeGreaterThanOrEqual(-0.02)
      expect(right).toBeLessThanOrEqual(1.02)
      expect(right - left).toBeGreaterThanOrEqual(0.7)
    }
    expect(binSlots(0)).toEqual([])
  })
})
