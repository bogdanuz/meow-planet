import type { AudioManager } from '../../shared/audio'

export function playPuzzlePickup(audio: AudioManager): void {
  void audio.playTone(392, { channel: 'sfx', durationSec: 0.07, gain: 0.1 })
}

export function playPuzzleSnap(audio: AudioManager): void {
  void audio.playTone(587, { channel: 'sfx', durationSec: 0.14, gain: 0.16 })
  window.setTimeout(() => {
    void audio.playTone(740, { channel: 'sfx', durationSec: 0.1, gain: 0.12 })
  }, 50)
}

export function playPuzzleWrong(audio: AudioManager): void {
  void audio.playTone(220, { channel: 'sfx', durationSec: 0.18, gain: 0.11 })
}

export function playPuzzleComplete(audio: AudioManager): void {
  const notes = [523, 659, 784, 988] as const
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
