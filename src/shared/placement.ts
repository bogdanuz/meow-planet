import { softError, softOk, type SoftCheckResult } from './soft-error'

/**
 * Общий resolve для «положить предмет в цель» (S05 сортировка, S06 фигуры).
 * Картинки не участвуют — только сравнение id/признака.
 */
export function resolveMatchDrop(
  itemKey: string,
  targetKey: string,
  softHint: string,
): SoftCheckResult {
  if (itemKey === targetKey) return softOk()
  return softError(softHint)
}

export type Point = { x: number; y: number }

export function distancePx(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

export type MagnetDropResult = SoftCheckResult & {
  /** Примагнитилось к слоту. */
  snapped: boolean
}

/**
 * Магнит: если далеко — без snap (фигура возвращается).
 * Если близко и ключ совпал — snap; иначе soft-hint без snap.
 */
export function resolveMagnetDrop(
  itemKey: string,
  slotKey: string,
  distance: number,
  magnetRadiusPx: number,
  softHint: string,
): MagnetDropResult {
  if (distance > magnetRadiusPx) {
    return { ok: false, soft: true, snapped: false, message: softHint }
  }
  const match = resolveMatchDrop(itemKey, slotKey, softHint)
  if (match.ok) {
    return { ok: true, snapped: true }
  }
  return { ok: false, soft: true, snapped: false, message: match.message }
}

export type MagnetCandidate<T extends { key: string }> = T & {
  center: Point
}

/** Ближайший свободный слот в радиусе магнита (по ключу совместимости снаружи). */
export function findNearestSlot<T extends { key: string }>(
  pieceCenter: Point,
  slots: readonly MagnetCandidate<T>[],
  magnetRadiusPx: number,
): MagnetCandidate<T> | null {
  let best: MagnetCandidate<T> | null = null
  let bestDist = Infinity
  for (const slot of slots) {
    const d = distancePx(pieceCenter, slot.center)
    if (d <= magnetRadiusPx && d < bestDist) {
      best = slot
      bestDist = d
    }
  }
  return best
}
