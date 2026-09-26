import { describe, expect, it } from 'vitest'
import { letterGridColumn1Based, letterGridLayout } from './letter-grid-layout'

describe('letterGridLayout', () => {
  it('RU 33 — не 11×3, меньше колонок для крупных квадратов', () => {
    const { cols, rows } = letterGridLayout(33)
    expect(cols * rows).toBeGreaterThanOrEqual(33)
    expect(cols).toBeLessThan(11)
    expect(rows).toBeGreaterThanOrEqual(4)
  })

  it('EN 26 — не 13×2', () => {
    const { cols, rows } = letterGridLayout(26)
    expect(cols * rows).toBeGreaterThanOrEqual(26)
    expect(cols).toBeLessThan(13)
    expect(rows).toBeGreaterThanOrEqual(3)
  })

  it('последняя строка RU 33 — центрирована', () => {
    const { cols, rows } = letterGridLayout(33)
    const lastRowStart = (rows - 1) * cols
    const firstCol = letterGridColumn1Based(lastRowStart, 33, cols, rows)
    const lastCol = letterGridColumn1Based(32, 33, cols, rows)
    expect(firstCol).toBeGreaterThan(1)
    expect(lastCol).toBeLessThan(cols)
  })
})
