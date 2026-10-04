import { SORT_ART_READY } from './art-ready'

/** URL mp3 фразы или null, пока озвучка не нарезана (тогда только текст в пузыре). */
export function sortVoiceUrl(file: string, ready: boolean = SORT_ART_READY.voice): string | null {
  if (!ready) return null
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/games/sort-colors/voice/${file}`
}
