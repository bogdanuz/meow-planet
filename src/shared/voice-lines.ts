import type { Rng } from './random'

/** Фраза ведущего: mp3 и тот же текст для облачка. */
export type VoiceLine = { readonly file: string; readonly text: string }

export const voiceLine = (file: string, text: string): VoiceLine => ({ file: `${file}.mp3`, text })

/** Случайная фраза из группы без повтора подряд (память на каждый ключ). */
export function createLinePicker(rng: Rng = Math.random) {
  const last = new Map<string, string>()
  return (key: string, lines: readonly VoiceLine[]): VoiceLine => {
    const prev = last.get(key)
    const pool = lines.length > 1 ? lines.filter((l) => l.file !== prev) : lines
    const picked = pool[Math.floor(rng() * pool.length)]!
    last.set(key, picked.file)
    return picked
  }
}
