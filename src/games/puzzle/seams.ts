import type { PuzzleGrid } from './grid'

export type SeamEdge = 'right' | 'bottom'

/** Соседи в сетке row-major (id = row * cols + col). */
export function seamNeighbors(
  id: number,
  grid: PuzzleGrid,
): { right?: number; bottom?: number } {
  const col = id % grid.cols
  const row = Math.floor(id / grid.cols)
  const out: { right?: number; bottom?: number } = {}
  if (col < grid.cols - 1) out.right = id + 1
  if (row < grid.rows - 1) out.bottom = id + grid.cols
  return out
}

/**
 * Классы на слотах: швы справа/снизу исчезают, если оба соседа заполнены.
 */
export function seamClassNamesForSlot(
  id: number,
  filled: ReadonlySet<number>,
  grid: PuzzleGrid,
): string[] {
  const classes: string[] = []
  const n = seamNeighbors(id, grid)
  if (n.right !== undefined && filled.has(id) && filled.has(n.right)) {
    classes.push('puzzle__slot--seam-right-off')
  }
  if (n.bottom !== undefined && filled.has(id) && filled.has(n.bottom)) {
    classes.push('puzzle__slot--seam-bottom-off')
  }
  return classes
}

/** Финал: все швы исчезают с анимацией. */
export function applySeamsMergedAll(board: HTMLElement): void {
  for (const slot of board.querySelectorAll<HTMLElement>('.puzzle__slot')) {
    slot.classList.add(
      'puzzle__slot--seam-right-off',
      'puzzle__slot--seam-bottom-off',
    )
  }
}

export function applySeamsToBoard(
  board: HTMLElement,
  filled: ReadonlySet<number>,
  grid: PuzzleGrid,
): void {
  for (const slot of board.querySelectorAll<HTMLElement>('.puzzle__slot')) {
    slot.classList.remove(
      'puzzle__slot--seam-right-off',
      'puzzle__slot--seam-bottom-off',
    )
    const id = Number(slot.dataset.slotId)
    if (!Number.isFinite(id)) continue
    for (const cls of seamClassNamesForSlot(id, filled, grid)) {
      slot.classList.add(cls)
    }
  }
}
