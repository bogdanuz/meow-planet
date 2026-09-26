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
})
