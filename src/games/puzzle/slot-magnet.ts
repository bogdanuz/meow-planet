export type { SlotRect } from '../../shared/slot-geometry'
export { expandRect, overlapArea, rectsIntersect } from '../../shared/slot-geometry'
import {
  expandRect,
  overlapArea,
  rectsIntersect,
  type SlotRect,
} from '../../shared/slot-geometry'

export type SlotHit = {
  slotId: number
  /** Для resolveMagnetDrop: 0 = в зоне захвата. */
  dist: number
}

/** Расширение зоны слота (доля меньшей стороны). */
export const PUZZLE_SLOT_HIT_EXPAND_RATIO = 0.72

function rectFromDom(r: DOMRect): SlotRect {
  return {
    left: r.left,
    top: r.top,
    right: r.right,
    bottom: r.bottom,
    width: r.width,
    height: r.height,
  }
}

/**
 * Магнит по **пересечению** кусочка и слота (углы и края), не только по центру.
 */
export function findSlotHitForPieceRect(
  pieceRect: DOMRect | SlotRect,
  slots: ReadonlyArray<{ id: number; rect: SlotRect }>,
  expandRatio = PUZZLE_SLOT_HIT_EXPAND_RATIO,
): SlotHit | null {
  const piece = 'width' in pieceRect && 'left' in pieceRect ? pieceRect : rectFromDom(pieceRect as DOMRect)

  let best: { slotId: number; overlap: number } | null = null

  for (const { id, rect } of slots) {
    const expand = Math.max(40, Math.min(rect.width, rect.height) * expandRatio)
    const magnetZone = expandRect(rect, expand)
    if (!rectsIntersect(piece, magnetZone)) continue

    const overlap = overlapArea(piece, rect)
    if (!best || overlap > best.overlap) {
      best = { slotId: id, overlap }
    }
  }

  if (!best) return null
  return { slotId: best.slotId, dist: 0 }
}

/** @deprecated центр точки — для тестов совместимости */
export function findSlotHitForPoint(
  cx: number,
  cy: number,
  slots: ReadonlyArray<{ id: number; rect: SlotRect }>,
  expandRatio = PUZZLE_SLOT_HIT_EXPAND_RATIO,
): SlotHit | null {
  const size = 8
  return findSlotHitForPieceRect(
    {
      left: cx - size / 2,
      top: cy - size / 2,
      right: cx + size / 2,
      bottom: cy + size / 2,
      width: size,
      height: size,
    },
    slots,
    expandRatio,
  )
}
