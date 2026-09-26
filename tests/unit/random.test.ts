import { describe, expect, it } from 'vitest'
import {
  createSeededRandom,
  pickOne,
  randomInt,
  shuffleCopy,
} from '../../src/shared/random'

describe('random', () => {
  it('createSeededRandom детерминирован', () => {
    const a = createSeededRandom(42)
    const b = createSeededRandom(42)
    const seqA = [a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  it('разные seed дают разные последовательности', () => {
    const a = createSeededRandom(1)
    const b = createSeededRandom(2)
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()])
  })

  it('shuffleCopy не мутирует исходный массив', () => {
    const src = [1, 2, 3, 4, 5]
    const rng = createSeededRandom(7)
    const shuffled = shuffleCopy(src, rng)
    expect(src).toEqual([1, 2, 3, 4, 5])
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('randomInt в диапазоне', () => {
    const rng = createSeededRandom(99)
    for (let i = 0; i < 30; i += 1) {
      const n = randomInt(2, 5, rng)
      expect(n).toBeGreaterThanOrEqual(2)
      expect(n).toBeLessThanOrEqual(5)
    }
  })

  it('pickOne на пустом → undefined', () => {
    expect(pickOne([])).toBeUndefined()
    expect(pickOne(['a'], createSeededRandom(1))).toBe('a')
  })
})
