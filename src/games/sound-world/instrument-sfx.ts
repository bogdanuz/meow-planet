import type { AudioManager } from '../../shared/audio'
import {
  SOUND_WORLD_SFX_FADE_SEC,
  SOUND_WORLD_SFX_LEVEL,
  SOUND_WORLD_SFX_PLAYBACK,
} from './sfx-playback'

/** Звук зоны инструмента; overlap для глиссандо. */
export async function playInstrumentSfx(
  audio: AudioManager,
  sfxBase: string,
  urlById?: ReadonlyMap<string, string>,
  options?: { overlap?: boolean },
): Promise<boolean> {
  const url = urlById?.get(sfxBase) ?? null
  if (!url) return false

  const clip = SOUND_WORLD_SFX_PLAYBACK[sfxBase]
  const fade = {
    volume: SOUND_WORLD_SFX_LEVEL,
    fadeOutSec: SOUND_WORLD_SFX_FADE_SEC,
    stopPrevious: !options?.overlap,
  }
  if (clip) {
    return audio.playUrlSegment('sfx', url, clip.startSec ?? 0, clip.durationSec, {
      ...fade,
      repeat: clip.repeat,
    })
  }
  return audio.playUrlSegment('sfx', url, 0, 6, fade)
}
