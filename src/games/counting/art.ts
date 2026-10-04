import { ALL_VOICE_LINES } from './phrases'

const base = (): string => `${import.meta.env.BASE_URL ?? '/'}assets/games/counting`

export const countingBgUrl = (): string => `${base()}/counting-bg.webp`
export const digitUrl = (n: number): string => `${base()}/digits/${n}.png`

/**
 * Озвучено первых строк `counting-VOICE-SCRIPT.md` (оба трека владельца 03.10.2026 — все 232).
 * Строки без mp3 ведущий говорит облачком. Unit-тест сверяет число с файлами в `public/assets/games/counting/voice/`.
 */
export const COUNTING_VOICE_RECORDED = ALL_VOICE_LINES.length

const recordedFiles: ReadonlySet<string> = new Set(
  ALL_VOICE_LINES.slice(0, COUNTING_VOICE_RECORDED).map((l) => l.file),
)

export function countingVoiceUrl(file: string): string | null {
  return recordedFiles.has(file) ? `${base()}/voice/${file}` : null
}
