import { describe, expect, it } from 'vitest'
import { findSlotHitForPieceRect } from '../../src/games/puzzle/slot-magnet'

describe('puzzle slot magnet', () => {
  const slot0 = {
    id: 0,
    rect: { left: 100, top: 100, right: 200, bottom: 175, width: 100, height: 75 },
  }

  it('притягивает угол кусочка (центр вне слота)', () => {
    const piece = {
      left: 155,
      top: 60,
      right: 255,
      bottom: 135,
      width: 100,
      height: 75,
    }
    const hit = findSlotHitForPieceRect(piece, [slot0])
    expect(hit?.slotId).toBe(0)
  })

  it('не цепляет далеко от слота', () => {
    const piece = {
      left: 0,
      top: 0,
      right: 40,
      bottom: 30,
      width: 40,
      height: 30,
    }
    expect(findSlotHitForPieceRect(piece, [slot0])).toBeNull()
  })

  describe('в руке кусочек размером с клетку', () => {
    const big = { id: 1, rect: { left: 0, top: 0, right: 300, bottom: 225, width: 300, height: 225 } }
    const pieceAt = (left: number, top: number) => ({
      left,
      top,
      right: left + 300,
      bottom: top + 225,
      width: 300,
      height: 225,
    })

    it('положил обратно на стол рядом с доской — не прыгает в клетку', () => {
      expect(findSlotHitForPieceRect(pieceAt(360, 0), [big])).toBeNull()
      expect(findSlotHitForPieceRect(pieceAt(0, -290), [big])).toBeNull()
    })

    it('чуть не дотянул до клетки — всё равно встаёт', () => {
      expect(findSlotHitForPieceRect(pieceAt(318, 0), [big])?.slotId).toBe(1)
    })

    it('задел клетку краем — встаёт', () => {
      expect(findSlotHitForPieceRect(pieceAt(250, 150), [big])?.slotId).toBe(1)
    })
  })
})
