import { describe, expect, it } from 'vitest'
import { createSeededRandom } from '../../src/shared/random'
import type { PuzzlePieceCount } from '../../src/shared/storage'
import {
  PIECE_TILT_MAX_DEG,
  PIECE_TILT_MIN_DEG,
  scatterTraySpots,
  trayPieceSize,
  type Size,
  type TraySpot,
} from '../../src/games/puzzle/table-layout'

/** Примерно iPad 1180×820: доска ~724×543, стол справа ~376×694. */
const IPAD_TABLE = { zoneW: 376, zoneH: 694 }
const IPAD_SLOT: Record<PuzzlePieceCount, Size> = {
  4: { w: 362, h: 271 },
  6: { w: 241, h: 271 },
  9: { w: 241, h: 181 },
}

function overlapShare(a: TraySpot, b: TraySpot, piece: Size): number {
  const ox = Math.max(0, piece.w - Math.abs(a.x - b.x))
  const oy = Math.max(0, piece.h - Math.abs(a.y - b.y))
  return (ox * oy) / (piece.w * piece.h)
}

describe('puzzle table layout', () => {
  it('4 кусочка крупные: не меньше 60% клетки', () => {
    const slot = IPAD_SLOT[4]
    const size = trayPieceSize({ slotW: slot.w, slotH: slot.h, count: 4, ...IPAD_TABLE })
    expect(size.w).toBeGreaterThanOrEqual(slot.w * 0.6)
    expect(size.w).toBeLessThan(slot.w)
    expect(size.w / size.h).toBeCloseTo(slot.w / slot.h, 5)
  })

  it('6 и 9 не крупнее клетки и помещаются в две колонки', () => {
    for (const count of [6, 9] as const) {
      const slot = IPAD_SLOT[count]
      const size = trayPieceSize({ slotW: slot.w, slotH: slot.h, count, ...IPAD_TABLE })
      expect(size.w).toBeLessThanOrEqual(slot.w * 0.9)
      expect(size.w * 2).toBeLessThanOrEqual(IPAD_TABLE.zoneW)
      expect(size.h * Math.ceil(count / 2)).toBeLessThanOrEqual(IPAD_TABLE.zoneH)
      expect(size.w).toBeGreaterThan(slot.w * 0.55)
    }
  })

  it('4 кусочка лежат змейкой: сверху вниз, по очереди левее и правее', () => {
    const slot = IPAD_SLOT[4]
    const piece = trayPieceSize({ slotW: slot.w, slotH: slot.h, count: 4, ...IPAD_TABLE })
    const zone = { w: IPAD_TABLE.zoneW, h: IPAD_TABLE.zoneH }
    const spots = scatterTraySpots(4, zone, piece, createSeededRandom(3))
    for (let i = 1; i < spots.length; i += 1) {
      expect(spots[i]!.y - spots[i - 1]!.y).toBeGreaterThan(piece.h * 0.7)
    }
    const sides = spots.map((s) => Math.sign(s.x - zone.w / 2))
    expect(sides).toEqual([-1, 1, -1, 1])
  })

  it('кусочки почти не заходят друг на друга: до любого можно дотянуться', () => {
    const zone = { w: IPAD_TABLE.zoneW, h: IPAD_TABLE.zoneH }
    for (const count of [4, 6, 9] as const) {
      const slot = IPAD_SLOT[count]
      const piece = trayPieceSize({ slotW: slot.w, slotH: slot.h, count, ...IPAD_TABLE })
      for (let seed = 1; seed <= 20; seed += 1) {
        const spots = scatterTraySpots(count, zone, piece, createSeededRandom(seed))
        for (let i = 0; i < spots.length; i += 1) {
          let covered = 0
          for (let j = 0; j < spots.length; j += 1) {
            if (i === j) continue
            const share = overlapShare(spots[i]!, spots[j]!, piece)
            expect(share).toBeLessThanOrEqual(0.1)
            covered += share
          }
          expect(covered).toBeLessThanOrEqual(0.2)
        }
      }
    }
  })

  it('наклонённый кусочек целиком лежит на столе — не залезает под шапку и за край экрана', () => {
    const zone = { w: IPAD_TABLE.zoneW, h: IPAD_TABLE.zoneH }
    for (const count of [4, 6, 9] as const) {
      const slot = IPAD_SLOT[count]
      const piece = trayPieceSize({ slotW: slot.w, slotH: slot.h, count, ...IPAD_TABLE })
      for (let seed = 1; seed <= 20; seed += 1) {
        for (const s of scatterTraySpots(count, zone, piece, createSeededRandom(seed))) {
          const rad = (Math.abs(s.rotate) * Math.PI) / 180
          const halfW = (piece.w * Math.cos(rad) + piece.h * Math.sin(rad)) / 2
          const halfH = (piece.w * Math.sin(rad) + piece.h * Math.cos(rad)) / 2
          expect(s.x - halfW).toBeGreaterThanOrEqual(-0.5)
          expect(s.x + halfW).toBeLessThanOrEqual(zone.w + 0.5)
          expect(s.y - halfH).toBeGreaterThanOrEqual(-0.5)
          expect(s.y + halfH).toBeLessThanOrEqual(zone.h + 0.5)
        }
      }
    }
  })

  it('места внутри стола, под разными углами, не стопкой', () => {
    const zone = { w: 420, h: 640 }
    for (const count of [4, 6, 9] as const) {
      const piece = trayPieceSize({ slotW: 320, slotH: 240, zoneW: zone.w, zoneH: zone.h, count })
      const spots = scatterTraySpots(count, zone, piece, createSeededRandom(count))
      expect(spots).toHaveLength(count)
      for (const s of spots) {
        expect(s.x - piece.w / 2).toBeGreaterThanOrEqual(0)
        expect(s.x + piece.w / 2).toBeLessThanOrEqual(zone.w)
        expect(s.y - piece.h / 2).toBeGreaterThanOrEqual(0)
        expect(s.y + piece.h / 2).toBeLessThanOrEqual(zone.h)
        expect(Math.abs(s.rotate)).toBeGreaterThanOrEqual(PIECE_TILT_MIN_DEG)
        expect(Math.abs(s.rotate)).toBeLessThanOrEqual(PIECE_TILT_MAX_DEG)
      }
      const signs = new Set(spots.map((s) => Math.sign(s.rotate)))
      expect(signs.size).toBe(2)
      for (let i = 0; i < spots.length; i += 1) {
        for (let j = i + 1; j < spots.length; j += 1) {
          const d = Math.hypot(spots[i]!.x - spots[j]!.x, spots[i]!.y - spots[j]!.y)
          expect(d).toBeGreaterThan(piece.h * 0.6)
        }
      }
    }
  })

  it('каждый раз раскладка другая', () => {
    const zone = { w: 420, h: 640 }
    const piece = { w: 150, h: 112 }
    const a = scatterTraySpots(4, zone, piece, createSeededRandom(1))
    const b = scatterTraySpots(4, zone, piece, createSeededRandom(2))
    expect(a).not.toEqual(b)
  })
})
