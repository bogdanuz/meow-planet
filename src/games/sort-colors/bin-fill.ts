/**
 * Раскладка игрушек внутри ящика: ящик всегда выглядит полным — чем меньше игрушек, тем крупнее.
 * x и scale — доли ширины проёма, y — доля высоты проёма (центр игрушки).
 */
export type BinSlot = { x: number; y: number; scale: number; rot: number }

const PATTERNS: Record<number, { s: number; pts: [number, number][] }> = {
  1: { s: 0.78, pts: [[0.5, 0.55]] },
  2: { s: 0.5, pts: [[0.3, 0.58], [0.7, 0.58]] },
  3: { s: 0.48, pts: [[0.27, 0.66], [0.73, 0.66], [0.5, 0.36]] },
  4: { s: 0.44, pts: [[0.28, 0.68], [0.72, 0.68], [0.28, 0.35], [0.72, 0.35]] },
  5: { s: 0.36, pts: [[0.2, 0.68], [0.5, 0.68], [0.8, 0.68], [0.35, 0.38], [0.65, 0.38]] },
  6: { s: 0.34, pts: [[0.2, 0.68], [0.5, 0.68], [0.8, 0.68], [0.2, 0.36], [0.5, 0.36], [0.8, 0.36]] },
}

const TILT = [-8, 6, -4, 9, -7, 5]

export function binSlots(count: number): BinSlot[] {
  if (count <= 0) return []
  const pattern = PATTERNS[count]
  if (pattern) {
    return pattern.pts.map(([x, y], i) => ({ x, y, scale: pattern.s, rot: TILT[i % TILT.length]! }))
  }
  const cols = Math.ceil(Math.sqrt(count * 1.5))
  const rows = Math.ceil(count / cols)
  const scale = Math.min(0.96 / cols, 0.9 / rows)
  return Array.from({ length: count }, (_, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    return {
      x: (c + 0.5) / cols,
      y: 1 - (r + 0.5) / rows,
      scale,
      rot: TILT[i % TILT.length]!,
    }
  })
}
