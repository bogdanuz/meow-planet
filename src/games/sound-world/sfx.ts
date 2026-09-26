import type { AudioManager } from '../../shared/audio'
import {
  SOUND_WORLD_SFX_FADE_SEC,
  SOUND_WORLD_SFX_LEVEL,
  SOUND_WORLD_SFX_PLAYBACK,
} from './sfx-playback'

/** Только реальный файл; без synth-заглушки (S14 v2). */
export async function playCatalogSfx(
  audio: AudioManager,
  sfxBase: string,
  urlById?: ReadonlyMap<string, string>,
): Promise<boolean> {
  audio.stopSfx()
  const url = urlById?.get(sfxBase) ?? null
  if (!url) return false

  const clip = SOUND_WORLD_SFX_PLAYBACK[sfxBase]
  const fade = { volume: SOUND_WORLD_SFX_LEVEL, fadeOutSec: SOUND_WORLD_SFX_FADE_SEC }
  if (clip) {
    const ok = await audio.playUrlSegment('sfx', url, clip.startSec ?? 0, clip.durationSec, {
      ...fade,
      repeat: clip.repeat,
    })
    if (ok) return true
  }
  return audio.playUrlSegment('sfx', url, 0, 30, fade)
}
