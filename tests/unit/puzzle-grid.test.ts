import { describe, expect, it } from 'vitest'
import { allSlotsFilled, puzzleGridForCount, puzzleSlotIds } from '../../src/games/puzzle/grid'

describe('puzzle grid', () => {
  it('4/6/9 → альбомные сетки', () => {
    expect(puzzleGridForCount(4)).toEqual({ cols: 2, rows: 2, count: 4 })
    expect(puzzleGridForCount(6)).toEqual({ cols: 3, rows: 2, count: 6 })
    expect(puzzleGridForCount(9)).toEqual({ cols: 3, rows: 3, count: 9 })
  })

  it('allSlotsFilled учитывает count', () => {
    const g6 = puzzleGridForCount(6)
    expect(allSlotsFilled(new Set([0, 1, 2, 3, 4, 5]), g6)).toBe(true)
    expect(allSlotsFilled(new Set([0, 1, 2]), g6)).toBe(false)
    expect(puzzleSlotIds(g6)).toHaveLength(6)
  })
})
