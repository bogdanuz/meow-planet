/** Обрезка/громкость для длинных или резких Pixabay-клипов (S14). */
export type SfxPlayback = {
  startSec?: number
  durationSec: number
  volume?: number
  /** Сколько раз проиграть этот фрагмент подряд (сирена полиции). */
  repeat?: number
}

/** Одна громкость для всех карточек «Изучаем звуки». */
export const SOUND_WORLD_SFX_LEVEL = 0.62
export const SOUND_WORLD_SFX_FADE_SEC = 0.18

const v = SOUND_WORLD_SFX_LEVEL

export const SOUND_WORLD_SFX_PLAYBACK: Partial<Record<string, SfxPlayback>> = {
  ambulance: { startSec: 0, durationSec: 3.4, volume: v },
  'police-car': { startSec: 0, durationSec: 1.85, volume: v, repeat: 3 },
  lion: { startSec: 0.4, durationSec: 2.4, volume: v },
  bear: { startSec: 0, durationSec: 2.1, volume: v },
  whale: { startSec: 0, durationSec: 3.0, volume: v },
  rooster: { startSec: 0.15, durationSec: 2.5, volume: v },
  duck: { startSec: 0, durationSec: 2.1, volume: v },
  owl: { startSec: 0.25, durationSec: 2.3, volume: v },
  seal: { startSec: 0.2, durationSec: 2.6, volume: v },
  hen: { startSec: 0, durationSec: 2.0, volume: v },
  goose: { startSec: 0.1, durationSec: 2.4, volume: v },
  wolf: { startSec: 0.35, durationSec: 2.6, volume: v },
  monkey: { startSec: 0.2, durationSec: 2.4, volume: v },
  car: { startSec: 0.5, durationSec: 3.4, volume: v },
  helicopter: { startSec: 1.15, durationSec: 2.5, volume: v },
  ship: { startSec: 0, durationSec: 2.4, volume: v },
  train: { startSec: 0, durationSec: 2.4, volume: v },
  drum: { startSec: 0, durationSec: 2.0, volume: v },
  'drum-kick': { startSec: 0, durationSec: 0.35, volume: v },
  'drum-snare': { startSec: 0, durationSec: 1.05, volume: v },
  'drum-tom': { startSec: 0, durationSec: 2.4, volume: v },
  'drum-right': { startSec: 0, durationSec: 1.32, volume: v },
  tambourine: { startSec: 0, durationSec: 1.7, volume: v },
  maracas: { startSec: 0.46, durationSec: 1.55, volume: v },
  /** Короткий шорох для тряски пальцем: повторяется примерно раз в 120 мс. */
  'maracas-shake': { startSec: 0.46, durationSec: 0.3, volume: v },
  bell: { startSec: 0.04, durationSec: 1.15, volume: v },
  piano: { startSec: 0.05, durationSec: 2.2, volume: v },
  // startSec — начало удара по клавише в файле (измерено по волне, порог 3% пика):
  // у «Ре», «Ми», «Ля», «Си» перед нотой 0,5–1 с тишины, из-за неё звук опаздывал.
  'piano-do': { startSec: 0.012, durationSec: 2.6, volume: v },
  'piano-re': { startSec: 0.605, durationSec: 2.4, volume: v },
  'piano-mi': { startSec: 0.58, durationSec: 1.6, volume: v },
  'piano-fa': { startSec: 0, durationSec: 2.3, volume: v },
  'piano-sol': { startSec: 0.016, durationSec: 2.2, volume: v },
  'piano-la': { startSec: 0.487, durationSec: 1.65, volume: v },
  'piano-si': { startSec: 0.99, durationSec: 2.15, volume: v },
  guitar: { startSec: 0, durationSec: 2.0, volume: v },
  'guitar-1': { startSec: 0, durationSec: 1.5, volume: v },
  'guitar-2': { startSec: 0, durationSec: 1.9, volume: v },
  'guitar-3': { startSec: 0, durationSec: 2.1, volume: v },
  'guitar-4': { startSec: 0, durationSec: 2.2, volume: v },
  'guitar-5': { startSec: 0, durationSec: 1.85, volume: v },
  'guitar-6': { startSec: 0, durationSec: 3.5, volume: v },
}
