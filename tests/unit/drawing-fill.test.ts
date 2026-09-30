import { describe, expect, it } from 'vitest'
import {
  colorWallMask,
  dilateMask,
  floodRegion,
  lineWallMask,
  maskChangesColor,
  paintMask,
} from '../../src/games/drawing/fill'

/** 5×1: прозрачно, прозрачно, линия, прозрачно, прозрачно. */
function lineRow(): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(5 * 4)
  rgba[2 * 4 + 3] = 255
  return rgba
}

describe('drawing fill', () => {
  it('контур раскраски — стена: заливка останавливается у линии', () => {
    const walls = lineWallMask(lineRow(), 5, 1)
    expect(Array.from(walls)).toEqual([0, 0, 1, 0, 0])
    const region = floodRegion(walls, 5, 1, 0, 0)
    expect(Array.from(region!)).toEqual([1, 1, 0, 0, 0])
    expect(floodRegion(walls, 5, 1, 2, 0)).toBeNull()
    expect(floodRegion(walls, 5, 1, 9, 0)).toBeNull()
  })

  it('заливка заходит под линию на несколько пикселей, чтобы не было щели', () => {
    const walls = lineWallMask(lineRow(), 5, 1)
    const region = floodRegion(walls, 5, 1, 0, 0)!
    expect(Array.from(dilateMask(region, 5, 1, 1))).toEqual([1, 1, 1, 0, 0])
    expect(Array.from(dilateMask(region, 5, 1, 0))).toEqual([1, 1, 0, 0, 0])
  })

  it('на цветном фоне границей служит другой цвет', () => {
    const white = [255, 255, 255, 255]
    const red = [220, 40, 40, 255]
    const rgba = new Uint8ClampedArray([...white, ...white, ...red, ...white])
    const walls = colorWallMask(rgba, 4, 1, 0, 0, 28)
    expect(Array.from(walls)).toEqual([0, 0, 1, 0])
    expect(Array.from(floodRegion(walls, 4, 1, 0, 0)!)).toEqual([1, 1, 0, 0])
  })

  it('краска ложится только в маску и не трогает остальное', () => {
    const layer = new Uint8ClampedArray(3 * 4)
    paintMask(layer, new Uint8Array([1, 0, 1]), [10, 20, 30])
    expect(Array.from(layer)).toEqual([10, 20, 30, 255, 0, 0, 0, 0, 10, 20, 30, 255])
  })

  it('повторная заливка тем же цветом ничего не меняет — лишний шаг не нужен', () => {
    const layer = new Uint8ClampedArray([10, 20, 30, 255, 0, 0, 0, 0])
    expect(maskChangesColor(layer, new Uint8Array([1, 0]), [10, 20, 30])).toBe(false)
    expect(maskChangesColor(layer, new Uint8Array([1, 1]), [10, 20, 30])).toBe(true)
    expect(maskChangesColor(layer, new Uint8Array([1, 0]), [11, 20, 30])).toBe(true)
  })

  it('заливает двумерную область целиком, а не только строку', () => {
    const w = 4
    const h = 4
    const rgba = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y += 1) rgba[(y * w + 2) * 4 + 3] = 255
    const region = floodRegion(lineWallMask(rgba, w, h), w, h, 0, 3)!
    const filled = Array.from(region).filter((v) => v === 1).length
    expect(filled).toBe(8)
  })
})
