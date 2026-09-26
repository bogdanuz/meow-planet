import { describe, expect, it } from 'vitest'
import {
  evaluateGiveSelect,
  evaluateOrderTap,
  maxCount,
  numberWordRu,
} from '../../src/games/counting/logic'

describe('counting logic', () => {
  it('лимит 3 и 10', () => {
    expect(maxCount(3)).toBe(3)
    expect(maxCount(10)).toBe(10)
  })

  it('порядок и soft-recount', () => {
    expect(evaluateOrderTap(1, 1)).toEqual({ ok: true, nextExpected: 2 })
    expect(evaluateOrderTap(3, 1).ok).toBe(false)
    expect(evaluateGiveSelect([1, 2], 2)).toEqual({
      complete: true,
      softRecount: false,
    })
    expect(evaluateGiveSelect([1, 2, 3], 2).softRecount).toBe(true)
    expect(numberWordRu(3)).toBe('три')
  })
})
