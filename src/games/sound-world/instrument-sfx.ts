import type { AudioManager } from '../../shared/audio'
import {
  SOUND_WORLD_SFX_FADE_SEC,
  SOUND_WORLD_SFX_LEVEL,
  SOUND_WORLD_SFX_PLAYBACK,
} from './sfx-playback'

export type InstrumentSfxOptions = {
  /** Не обрывать предыдущий звук (аккорды, глиссандо, два маракаса). */
  overlap?: boolean
  /** Другая нарезка того же файла (короткий шорох маракаса). */
  clipId?: string
  /** Высота звука: ксилофон — питч колокольчика. */
  playbackRate?: number
}

/** Звук зоны инструмента. */
export async function playInstrumentSfx(
  audio: AudioManager,
  sfxBase: string,
  urlById?: ReadonlyMap<string, string>,
  options: InstrumentSfxOptions = {},
): Promise<boolean> {
  const url = urlById?.get(sfxBase) ?? null
  if (!url) return false

  const clip = SOUND_WORLD_SFX_PLAYBACK[options.clipId ?? sfxBase]
  const common = {
    volume: SOUND_WORLD_SFX_LEVEL,
    fadeOutSec: SOUND_WORLD_SFX_FADE_SEC,
    stopPrevious: !options.overlap,
    playbackRate: options.playbackRate,
  }
  if (clip) {
    return audio.playUrlSegment('sfx', url, clip.startSec ?? 0, clip.durationSec, {
      ...common,
      repeat: clip.repeat,
    })
  }
  return audio.playUrlSegment('sfx', url, 0, 6, common)
}

/** Все файлы инструментов — декодируются заранее, чтобы касание звучало мгновенно. */
export const INSTRUMENT_SFX_IDS = [
  'drum-snare',
  'drum-tom',
  'drum-right',
  'maracas',
  'bell',
  'piano-do',
  'piano-re',
  'piano-mi',
  'piano-fa',
  'piano-sol',
  'piano-la',
  'piano-si',
  'guitar-1',
  'guitar-2',
  'guitar-3',
  'guitar-4',
  'guitar-5',
  'guitar-6',
] as const
