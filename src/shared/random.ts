/**
 * Seeded RNG для воспроизводимых тестов и раскладок игр.
 * Mulberry32 — компактный качественный 32-bit PRNG.
 */

export type Rng = () => number

export function createSeededRandom(seed: number): Rng {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Перемешать копию массива (Fisher–Yates). */
export function shuffleCopy<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

/** Случайный элемент; пустой массив → undefined. */
export function pickOne<T>(items: readonly T[], rng: Rng = Math.random): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(rng() * items.length)]
}

/** Целое в диапазоне [min, max] включительно. */
export function randomInt(min: number, max: number, rng: Rng = Math.random): number {
  const lo = Math.ceil(min)
  const hi = Math.floor(max)
  return Math.floor(rng() * (hi - lo + 1)) + lo
}
