import type { PlaceholderColor } from './placeholders'

/** Детская пентатоника (Hz) — мягкие ноты по цвету шарика. */
const COLOR_TO_HZ: Record<PlaceholderColor, number> = {
  red: 262,
  orange: 294,
  yellow: 330,
  green: 392,
  blue: 440,
  indigo: 494,
  violet: 523,
}

export function balloonPopFrequency(color: PlaceholderColor): number {
  return COLOR_TO_HZ[color]
}
