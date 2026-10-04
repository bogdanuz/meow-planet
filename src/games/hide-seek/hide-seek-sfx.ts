import type { AudioManager } from '../../shared/audio'
import { hubSoundUrl } from '../../shared/hub-sounds'

/** Нашёл: мягкий «дзынь». */
export function playHideFound(audio: AudioManager): void {
  void audio.playTone(1047, { channel: 'sfx', durationSec: 0.16, gain: 0.13 })
  window.setTimeout(() => void audio.playTone(1568, { channel: 'sfx', durationSec: 0.22, gain: 0.1 }), 70)
}

/** «Фьют» — предмет летит в полоску. */
export function playHideFly(audio: AudioManager): void {
  const notes = [740, 988, 1319] as const
  notes.forEach((freq, i) => {
    window.setTimeout(() => void audio.playTone(freq, { channel: 'sfx', durationSec: 0.06, gain: 0.07 }), i * 40)
  })
}

/** Укрытие «ку-ку» шуршит. */
export function playHideRustle(audio: AudioManager): void {
  void audio.playUrl('sfx', hubSoundUrl.pickup(), { volume: 0.32 })
}
