import type { AudioManager } from '../../shared/audio'
import { playSoftMiss } from '../../shared/hub-sounds'

export function playHideFound(audio: AudioManager): void {
  void audio.playTone(523, { channel: 'sfx', durationSec: 0.12, gain: 0.15 })
  window.setTimeout(() => {
    void audio.playTone(659, { channel: 'sfx', durationSec: 0.1, gain: 0.12 })
  }, 45)
}

export function playHideMiss(audio: AudioManager): void {
  playSoftMiss(audio)
}

export function playHideRoundComplete(audio: AudioManager): void {
  const notes = [392, 494, 587] as const
  notes.forEach((freq, i) => {
    window.setTimeout(() => {
      void audio.playTone(freq, { channel: 'sfx', durationSec: 0.2, gain: 0.14 })
    }, i * 90)
  })
}
