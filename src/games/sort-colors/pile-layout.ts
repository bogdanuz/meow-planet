import type { Rng } from '../../shared/random'

export type PileBox = { width: number; height: number; item: number }

/** Центр игрушки в px полосы кучи; верхние ряды — выше и поверх. */
export type PileSlot = { x: number; y: number; rot: number; z: number; row: number }

export type PileHitItem = { id: string; x: number; y: number; size: number; rot: number; z: number }

/** u, v ∈ [0,1] — точка в системе картинки игрушки (без поворота). */
export type OpaqueAt = (id: string, u: number, v: number) => boolean

/** Ряды горки снизу вверх: 5-4-3, 3-2-1… последний может быть неполным. */
export function pileRows(count: number): number[] {
  if (count <= 0) return []
  let base = 1
  while ((base * (base + 1)) / 2 < count) base += 1
  const rows: number[] = []
  let left = count
  for (let size = base; left > 0; size -= 1) {
    rows.push(Math.min(size, left))
    left -= size
  }
  return rows
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function layoutPile(count: number, box: PileBox, rng: Rng): PileSlot[] {
  const rows = pileRows(count)
  if (rows.length === 0) return []
  const half = box.item / 2
  const widest = rows[0]!
  const spacing = widest > 1 ? Math.min(box.item * 0.92, (box.width - box.item) / (widest - 1)) : 0
  const rowStep =
    rows.length > 1 ? Math.min(box.item * 0.62, (box.height - box.item) / (rows.length - 1)) : 0
  const jx = box.item * 0.08
  const jy = rowStep * 0.18
  const slots: PileSlot[] = []
  let zBase = 0
  rows.forEach((size, row) => {
    const order = Array.from({ length: size }, (_, i) => i)
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1))
      ;[order[i], order[j]] = [order[j]!, order[i]!]
    }
    const y0 = box.height - half - row * rowStep
    for (let i = 0; i < size; i += 1) {
      const x0 = box.width / 2 + (i - (size - 1) / 2) * spacing
      slots.push({
        x: clamp(x0 + (rng() * 2 - 1) * jx, half, box.width - half),
        y: clamp(y0 + (rng() * 2 - 1) * jy, half, box.height - half),
        rot: Math.round((rng() * 2 - 1) * 22),
        z: zBase + order[i]! + 1,
        row,
      })
    }
    zBase += size
  })
  return slots
}

/**
 * Верхняя игрушка под точкой. С альфа-маской — сначала та, чей пиксель виден под пальцем;
 * если под пальцем пусто (дырка колечка, промах у края) — верхняя по эллипсу.
 */
export function topmostAt(
  px: number,
  py: number,
  items: readonly PileHitItem[],
  opaqueAt?: OpaqueAt,
): string | null {
  const sorted = [...items].sort((a, b) => b.z - a.z)
  const local = sorted.map((it) => {
    const rad = (-it.rot * Math.PI) / 180
    const dx = px - it.x
    const dy = py - it.y
    return {
      it,
      lx: dx * Math.cos(rad) - dy * Math.sin(rad),
      ly: dx * Math.sin(rad) + dy * Math.cos(rad),
    }
  })
  if (opaqueAt) {
    for (const { it, lx, ly } of local) {
      const half = it.size / 2
      if (Math.abs(lx) > half || Math.abs(ly) > half) continue
      if (opaqueAt(it.id, (lx + half) / it.size, (ly + half) / it.size)) return it.id
    }
  }
  for (const { it, lx, ly } of local) {
    const r = it.size * 0.48
    if ((lx * lx + ly * ly) / (r * r) <= 1) return it.id
  }
  return null
}
