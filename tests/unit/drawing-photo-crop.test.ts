import { describe, expect, it } from 'vitest'
import {
  clampPhotoCrop,
  initialPhotoCrop,
  minCoverScale,
  pinchPhotoCrop,
  rotatePhotoCrop,
  zoomPhotoCrop,
  type PhotoCrop,
} from '../../src/shared/photo-crop-math'

const FRAME = { w: 800, h: 600 }

/** Все 4 угла рамки лежат внутри повёрнутой картинки — фон без пустых углов. */
function coversFrame(crop: PhotoCrop, imgW: number, imgH: number): boolean {
  const cos = Math.cos(-crop.rotation)
  const sin = Math.sin(-crop.rotation)
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].every(([sx, sy]) => {
    const x = (sx! * FRAME.w) / 2 - crop.x
    const y = (sy! * FRAME.h) / 2 - crop.y
    const lx = x * cos - y * sin
    const ly = x * sin + y * cos
    return Math.abs(lx) <= (imgW * crop.scale) / 2 + 0.01 && Math.abs(ly) <= (imgH * crop.scale) / 2 + 0.01
  })
}

describe('кадрирование фото для фона Рисовалки', () => {
  it('сначала фото закрывает рамку 4:3 целиком и стоит по центру', () => {
    const wide = initialPhotoCrop(2000, 1000, FRAME.w, FRAME.h)
    expect(wide).toEqual({ x: 0, y: 0, scale: 0.6, rotation: 0 })
    const tall = initialPhotoCrop(900, 1600, FRAME.w, FRAME.h)
    expect(tall.scale).toBeCloseTo(800 / 900)
    expect(coversFrame(tall, 900, 1600)).toBe(true)
  })

  it('поворот на 90° требует большего масштаба, углы не пустые', () => {
    expect(minCoverScale(2000, 1000, FRAME.w, FRAME.h, Math.PI / 2)).toBeCloseTo(0.8)
    const turned = rotatePhotoCrop(initialPhotoCrop(2000, 1000, FRAME.w, FRAME.h), 2000, 1000, FRAME.w, FRAME.h)
    expect(turned.rotation).toBeCloseTo(Math.PI / 2)
    expect(coversFrame(turned, 2000, 1000)).toBe(true)
  })

  it('сдвиг и масштаб ограничены: за край фото не уехать', () => {
    for (let i = 0; i < 60; i += 1) {
      const raw: PhotoCrop = {
        x: Math.sin(i * 1.7) * 900,
        y: Math.cos(i * 2.3) * 700,
        scale: 0.05 + (i % 7) * 0.3,
        rotation: (i * 0.37) % (Math.PI * 2),
      }
      const crop = clampPhotoCrop(raw, 1600, 1200, FRAME.w, FRAME.h)
      expect(coversFrame(crop, 1600, 1200)).toBe(true)
      expect(crop.scale).toBeLessThanOrEqual(minCoverScale(1600, 1200, FRAME.w, FRAME.h, crop.rotation) * 6 + 1e-9)
    }
  })

  it('два пальца: точка фото под пальцами остаётся под ними, масштаб и поворот следуют', () => {
    const start = { x: 0, y: 0, scale: 1, rotation: 0 }
    const a0 = { x: 300, y: 300 }
    const b0 = { x: 500, y: 300 }
    const a1 = { x: 300, y: 200 }
    const b1 = { x: 300, y: 600 }
    const next = pinchPhotoCrop(start, [a0, b0], [a1, b1], FRAME.w, FRAME.h)
    expect(next.scale).toBeCloseTo(2)
    expect(next.rotation).toBeCloseTo(Math.PI / 2)
    const center = { x: FRAME.w / 2, y: FRAME.h / 2 }
    const toImage = (crop: PhotoCrop, p: { x: number; y: number }) => {
      const dx = p.x - center.x - crop.x
      const dy = p.y - center.y - crop.y
      const c = Math.cos(-crop.rotation)
      const s = Math.sin(-crop.rotation)
      return { x: (dx * c - dy * s) / crop.scale, y: (dx * s + dy * c) / crop.scale }
    }
    const mid0 = toImage(start, { x: 400, y: 300 })
    const mid1 = toImage(next, { x: 300, y: 400 })
    expect(mid1.x).toBeCloseTo(mid0.x)
    expect(mid1.y).toBeCloseTo(mid0.y)
  })

  it('кнопки «+» и «−» меняют масштаб, но не меньше, чем нужно для рамки', () => {
    const base = initialPhotoCrop(1600, 1200, FRAME.w, FRAME.h)
    const bigger = zoomPhotoCrop(base, 1.25, 1600, 1200, FRAME.w, FRAME.h)
    expect(bigger.scale).toBeCloseTo(base.scale * 1.25)
    const smaller = zoomPhotoCrop(base, 0.5, 1600, 1200, FRAME.w, FRAME.h)
    expect(smaller.scale).toBeCloseTo(base.scale)
  })
})
