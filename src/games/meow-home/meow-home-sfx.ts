import type { AudioManager } from '../../shared/audio'
import type { CareAction } from './logic'

export function playCareAction(audio: AudioManager, action: CareAction): void {
  const tone =
    action === 'feed'
      ? 440
      : action === 'teeth'
        ? 523
        : action === 'bath'
          ? 330
          : 392
  void audio.playTone(tone, { channel: 'sfx', durationSec: 0.14, gain: 0.11 })
}

export function playAmbientTap(audio: AudioManager): void {
  void audio.playTone(494, { channel: 'sfx', durationSec: 0.1, gain: 0.09 })
}

export function playMeowTap(audio: AudioManager): void {
  void audio.playTone(587, { channel: 'sfx', durationSec: 0.12, gain: 0.1 })
}
