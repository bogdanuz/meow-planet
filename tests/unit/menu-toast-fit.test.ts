import { describe, expect, it } from 'vitest'
import { fitMenuToast, menuToastHeight, menuVisitScale } from '../../src/app/menu-toast-fit'

describe('«Погладь меня» — размер от персонажа и места над ним', () => {
  it('места много — шрифт пропорционален ширине персонажа', () => {
    const small = fitMenuToast({ charWidth: 220, spaceAbove: 400 })
    const big = fitMenuToast({ charWidth: 320, spaceAbove: 400 })
    expect(big.fontPx).toBeGreaterThan(small.fontPx)
    expect(big.fontPx / small.fontPx).toBeCloseTo(320 / 220, 1)
  })

  it('шрифт в разумных рамках: не мельче 14 px при большом месте и не крупнее 27 px', () => {
    expect(fitMenuToast({ charWidth: 80, spaceAbove: 400 }).fontPx).toBe(14)
    expect(fitMenuToast({ charWidth: 900, spaceAbove: 900 }).fontPx).toBe(27)
  })

  it('мало места — облачко ужимается и помещается с отступами сверху и снизу', () => {
    const fit = fitMenuToast({ charWidth: 300, spaceAbove: 54 })
    const ideal = fitMenuToast({ charWidth: 300, spaceAbove: 400 })
    expect(fit.fontPx).toBeLessThan(ideal.fontPx)
    expect(menuToastHeight(fit.fontPx) + 2 * fit.gapPx).toBeLessThanOrEqual(54 + 0.01)
    expect(fit.gapPx).toBeGreaterThanOrEqual(4)
  })

  it('места хватает — персонаж не уменьшается', () => {
    expect(menuVisitScale({ figureTop: 200, figureBottom: 700, ceiling: 60, need: 70 })).toBe(1)
  })

  it('тесно — персонаж с подставкой чуть уменьшается, ровно чтобы облачко встало', () => {
    const k = menuVisitScale({ figureTop: 120, figureBottom: 732, ceiling: 67, need: 70 })
    expect(k).toBeLessThan(1)
    expect(k).toBeGreaterThan(0.95)
    const newTop = 732 - k * (732 - 120)
    expect(newTop - 67).toBeCloseTo(70, 5)
  })

  it('очень тесно — уменьшение не больше чем до 88%', () => {
    expect(menuVisitScale({ figureTop: 70, figureBottom: 400, ceiling: 67, need: 90 })).toBe(0.88)
  })

  it('совсем нет места — шрифт не мельче 12 px (читаемо), отступы минимальные', () => {
    const fit = fitMenuToast({ charWidth: 300, spaceAbove: 10 })
    expect(fit.fontPx).toBe(12)
    expect(fit.gapPx).toBe(4)
  })
})
