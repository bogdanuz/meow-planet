import type { AudioManager } from '../../shared/audio'
import type { Weather } from './logic'

export function playSeasonWeatherChange(audio: AudioManager, weather: Weather): void {
  const tone: Record<Weather, { freq: number; dur: number }> = {
    sun: { freq: 587, dur: 0.14 },
    rain: { freq: 330, dur: 0.18 },
    snow: { freq: 440, dur: 0.16 },
    wind: { freq: 280, dur: 0.12 },
    rainbow: { freq: 523, dur: 0.1 },
    clouds: { freq: 370, dur: 0.13 },
  }
  const { freq, dur } = tone[weather]
  void audio.playTone(freq, { channel: 'sfx', durationSec: dur, gain: 0.12 })
  if (weather === 'rainbow') {
    window.setTimeout(() => {
      void audio.playTone(659, { channel: 'sfx', durationSec: 0.1, gain: 0.1 })
    }, 55)
  }
}
