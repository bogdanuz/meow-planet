import type { ShapeKind } from './logic'
import {
  expandRect,
  overlapArea,
  rectsIntersect,
  type SlotRect,
} from '../../shared/slot-geometry'

export const SHAPE_SLOT_HIT_EXPAND_RATIO = 0.72

type SlotCandidate = {
  id: string
  shape: ShapeKind
  color: string
  rect: SlotRect
}

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

/** Магнит: та же форма и тот же цвет (два колеса одного цвета взаимозаменяемы). */
export function findSlotHitForShapePiece(
  pieceRect: DOMRect,
  slots: ReadonlyArray<SlotCandidate>,
  pieceShape: ShapeKind,
  pieceColor: string,
  filledIds: ReadonlySet<string>,
  expandRatio = SHAPE_SLOT_HIT_EXPAND_RATIO,
): string | null {
  const piece = rectFromDom(pieceRect)
  let best: { id: string; overlap: number } | null = null

  for (const slot of slots) {
    if (filledIds.has(slot.id)) continue
    if (slot.shape !== pieceShape || slot.color !== pieceColor) continue

    const expand = Math.max(36, Math.min(slot.rect.width, slot.rect.height) * expandRatio)
    const magnetZone = expandRect(slot.rect, expand)
    if (!rectsIntersect(piece, magnetZone)) continue

    const overlap = overlapArea(piece, slot.rect)
    if (!best || overlap > best.overlap) {
      best = { id: slot.id, overlap }
    }
  }

  return best?.id ?? null
}
