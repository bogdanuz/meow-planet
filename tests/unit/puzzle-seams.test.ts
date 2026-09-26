import { describe, expect, it } from 'vitest'
import { seamClassNamesForSlot } from '../../src/games/puzzle/seams'
import { puzzleGridForCount } from '../../src/games/puzzle/grid'

describe('puzzle seams', () => {
  it('убирает шов справа между двумя заполненными', () => {
    const g = puzzleGridForCount(4)
    const filled = new Set([0, 1])
    expect(seamClassNamesForSlot(0, filled, g)).toContain('puzzle-game__slot--seam-right-off')
    expect(seamClassNamesForSlot(1, filled, g)).not.toContain('puzzle-game__slot--seam-right-off')
  })
})
