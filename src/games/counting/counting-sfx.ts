import type { AudioManager } from '../../shared/audio'
import { playSoftMiss } from '../../shared/hub-sounds'

export function playCountSuccess(audio: AudioManager): void {
  void audio.playTone(523, { channel: 'sfx', durationSec: 0.1, gain: 0.11 })
  window.setTimeout(() => {
    void audio.playTone(659, { channel: 'sfx', durationSec: 0.09, gain: 0.1 })
  }, 45)
}

export function playCountSoft(audio: AudioManager): void {
  playSoftMiss(audio)
}
