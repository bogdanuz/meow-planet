export type SlotRect = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export function expandRect(rect: SlotRect, expandPx: number): SlotRect {
  return {
    left: rect.left - expandPx,
    top: rect.top - expandPx,
    right: rect.right + expandPx,
    bottom: rect.bottom + expandPx,
    width: rect.width + expandPx * 2,
    height: rect.height + expandPx * 2,
  }
}

export function rectsIntersect(a: SlotRect, b: SlotRect): boolean {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
}

export function overlapArea(a: SlotRect, b: SlotRect): number {
  const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
  const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  return w * h
}
