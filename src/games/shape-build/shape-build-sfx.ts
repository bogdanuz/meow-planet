import type { AudioManager } from '../../shared/audio'
import { playSoftMiss } from '../../shared/hub-sounds'

export function playShapePickup(audio: AudioManager): void {
  void audio.playTone(330, { channel: 'sfx', durationSec: 0.07, gain: 0.1 })
}

export function playShapeSnap(audio: AudioManager): void {
  void audio.playTone(494, { channel: 'sfx', durationSec: 0.14, gain: 0.16 })
  window.setTimeout(() => {
    void audio.playTone(622, { channel: 'sfx', durationSec: 0.1, gain: 0.12 })
  }, 50)
}

export function playShapeWrong(audio: AudioManager): void {
  playSoftMiss(audio)
}

export function playShapeComplete(audio: AudioManager): void {
  const notes = [392, 494, 587, 740] as const
  notes.forEach((freq, i) => {
    window.setTimeout(() => {
      void audio.playTone(freq, {
        channel: 'sfx',
        durationSec: 0.22,
        gain: 0.17,
      })
    }, i * 95)
  })
}
