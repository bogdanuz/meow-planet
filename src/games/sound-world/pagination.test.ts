import { describe, expect, it } from 'vitest'
import {
  pageCountBalanced,
  pageSliceBalanced,
  pageStartIndices,
} from './pagination'

describe('sound-world pagination', () => {
  it('5 карточек → 3+2, не 4+1', () => {
    expect(pageStartIndices(5)).toEqual([0, 3])
    expect(pageSliceBalanced([1, 2, 3, 4, 5], 0)).toEqual([1, 2, 3])
    expect(pageSliceBalanced([1, 2, 3, 4, 5], 1)).toEqual([4, 5])
  })

  it('9 карточек без страницы из одной', () => {
    const starts = pageStartIndices(9)
    expect(starts.length).toBe(pageCountBalanced(9))
    for (let p = 0; p < starts.length; p += 1) {
      expect(pageSliceBalanced(Array.from({ length: 9 }, (_, i) => i), p).length).toBeGreaterThan(1)
    }
  })

  it('18 животных → три страницы по 6', () => {
    expect(pageStartIndices(18, 6)).toEqual([0, 6, 12])
    expect(pageCountBalanced(18, 6)).toBe(3)
    const ids = Array.from({ length: 18 }, (_, i) => i)
    expect(pageSliceBalanced(ids, 0, 6)).toEqual(ids.slice(0, 6))
    expect(pageSliceBalanced(ids, 1, 6)).toEqual(ids.slice(6, 12))
    expect(pageSliceBalanced(ids, 2, 6)).toEqual(ids.slice(12, 18))
  })
})
