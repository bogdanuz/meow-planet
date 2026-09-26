/** Считаем с Мяу — режимы порядок и «дай N». */

export type CountingMode = 'order' | 'give'

export function maxCount(limit: 3 | 10): number {
  return limit
}

export function buildOrderTargets(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1)
}

export function buildGivePool(n: number, total: number): number[] {
  const pool = Array.from({ length: total }, (_, i) => i + 1)
  // Перемешивание лёгкое
  return pool.sort(() => Math.random() - 0.5).slice(0, Math.max(n + 2, Math.min(total, n + 3)))
}

export function evaluateOrderTap(
  value: number,
  expected: number,
): { ok: boolean; nextExpected: number } {
  if (value === expected) return { ok: true, nextExpected: expected + 1 }
  return { ok: false, nextExpected: expected }
}

export function evaluateGiveSelect(
  selected: readonly number[],
  target: number,
): { complete: boolean; softRecount: boolean } {
  if (selected.length < target) {
    return { complete: false, softRecount: false }
  }
  if (selected.length === target) {
    return { complete: true, softRecount: false }
  }
  return { complete: false, softRecount: true }
}

export function numberWordRu(n: number): string {
  const words = [
    '',
    'один',
    'два',
    'три',
    'четыре',
    'пять',
    'шесть',
    'семь',
    'восемь',
    'девять',
    'десять',
  ]
  return words[n] ?? String(n)
}
