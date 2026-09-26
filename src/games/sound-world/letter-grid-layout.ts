/** Соотношение высоты к ширине игровой зоны (iPad landscape, ~660/1136). */
const LANDSCAPE_H_OVER_W = 0.58

/**
 * Сетка алфавита без листания: крупные квадратные плитки, заполняют высоту экрана.
 * (11×3 / 13×2 дают мелкие «прямоугольники» и пустоту сверху/снизу.)
 */
export function letterGridLayout(letterCount: number): { cols: number; rows: number } {
  let bestCols = 6
  let bestRows = Math.ceil(letterCount / 6)
  let bestFit = -1

  for (let cols = 5; cols <= 10; cols += 1) {
    const rows = Math.ceil(letterCount / cols)
    if (rows < 2 || rows > 6) continue
    const empty = cols * rows - letterCount
    const fit =
      Math.min(1 / cols, LANDSCAPE_H_OVER_W / rows) - empty * 0.008
    if (fit > bestFit) {
      bestFit = fit
      bestCols = cols
      bestRows = rows
    }
  }

  return { cols: bestCols, rows: bestRows }
}

/** 1-based column для CSS grid; последняя неполная строка — по центру. */
export function letterGridColumn1Based(
  index: number,
  letterCount: number,
  cols: number,
  rows: number,
): number {
  const row = Math.floor(index / cols)
  const colInRow = index % cols
  const lastRowCount = letterCount - (rows - 1) * cols
  if (row === rows - 1 && lastRowCount > 0 && lastRowCount < cols) {
    const offset = Math.floor((cols - lastRowCount) / 2)
    return colInRow + 1 + offset
  }
  return colInRow + 1
}
