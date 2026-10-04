import type { PuzzlePieceCount } from '../../shared/storage'

export type PuzzleGrid = {
  cols: number
  rows: number
  count: PuzzlePieceCount
}

/** Альбомная сетка: 4→2×2, 6→3×2, 9→3×3. */
export function puzzleGridForCount(count: PuzzlePieceCount): PuzzleGrid {
  switch (count) {
    case 4:
      return { cols: 2, rows: 2, count: 4 }
    case 6:
      return { cols: 3, rows: 2, count: 6 }
    case 9:
      return { cols: 3, rows: 3, count: 9 }
    default: {
      const _exhaustive: never = count
      return _exhaustive
    }
  }
}

export function puzzleSlotIds(grid: PuzzleGrid): number[] {
  return Array.from({ length: grid.count }, (_, i) => i)
}

export function pieceFitsSlot(pieceId: number, slotId: number): boolean {
  return pieceId === slotId
}

export function allSlotsFilled(filled: ReadonlySet<number>, grid: PuzzleGrid): boolean {
  return puzzleSlotIds(grid).every((id) => filled.has(id))
}
