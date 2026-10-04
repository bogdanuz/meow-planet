import type { GameId } from '../content/catalog'
import type { AudioManager } from './audio'

function asset(file: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/audio/${file}`
}

export const hubSoundUrl = {
  transition: () => asset('ui-transition.mp3'),
  balloonPop: () => asset('balloon-pop.mp3'),
  music: () => asset('hub-music.mp3'),
  gameMusic: () => asset('game-music.mp3'),
  softMiss: () => asset('soft-miss.mp3'),
  pickup: () => asset('pickup.mp3'),
  drop: () => asset('drop.mp3'),
}

/** Без общей фоновой петли — своя музыка или тишина. */
export const GAME_IDS_WITHOUT_SHARED_MUSIC = [
  'meow-home',
  'drawing',
] as const satisfies readonly GameId[]

const HUB_MUSIC_VOLUME = 0.28 * 0.95
const DEFAULT_GAME_MUSIC_VOLUME = 0.2 * 0.95
/** Тихий фон в «Изучаем звуки» / счёте. Ещё −10%. */
const WHISPER_GAME_MUSIC_VOLUME = 0.05 * 0.95 * 0.9
const BALLOON_GAME_MUSIC_VOLUME = DEFAULT_GAME_MUSIC_VOLUME * 0.9
export const MUSIC_CROSSFADE_MS = 280

const GAME_MUSIC_VOLUME: Partial<Record<GameId, number>> = {
  'sound-world': WHISPER_GAME_MUSIC_VOLUME,
  counting: WHISPER_GAME_MUSIC_VOLUME,
  'balloon-pop': BALLOON_GAME_MUSIC_VOLUME,
}

export function gameMusicVolume(gameId: GameId): number {
  return GAME_MUSIC_VOLUME[gameId] ?? DEFAULT_GAME_MUSIC_VOLUME
}

export function gameUsesSharedMusic(gameId: GameId): boolean {
  return !(GAME_IDS_WITHOUT_SHARED_MUSIC as readonly GameId[]).includes(gameId)
}

/** Ктош около 2 с, начало тихое. Слышим со середины, вместе с движением экрана. */
const TRANSITION_START_SEC = 0.95

let transitionWarm: HTMLAudioElement | null = null

export function preloadScreenTransition(): void {
  if (transitionWarm || typeof Audio === 'undefined') return
  transitionWarm = new Audio(hubSoundUrl.transition())
  transitionWarm.preload = 'auto'
}

export function preloadHubMusic(): void {
  if (typeof Audio === 'undefined') return
  const warm = new Audio(hubSoundUrl.music())
  warm.preload = 'auto'
}

export function playScreenTransition(audio: AudioManager): void {
  preloadScreenTransition()
  void audio.playUrl('sfx', hubSoundUrl.transition(), {
    volume: 0.5,
    startSec: TRANSITION_START_SEC,
  })
}

export function playHubMusic(audio: AudioManager): void {
  void audio.switchMusic(hubSoundUrl.music(), HUB_MUSIC_VOLUME, {
    fadeOutMs: MUSIC_CROSSFADE_MS,
    fadeInMs: MUSIC_CROSSFADE_MS,
  })
}

/** Зацикленный фон почти всех игр (не «В гостях» и не «Рисовалка»). */
export function playGameMusic(audio: AudioManager, gameId: GameId): void {
  if (!gameUsesSharedMusic(gameId)) return
  const volume = gameMusicVolume(gameId)
  void audio.switchMusic(hubSoundUrl.gameMusic(), volume, {
    fadeOutMs: MUSIC_CROSSFADE_MS,
    fadeInMs: MUSIC_CROSSFADE_MS,
  })
}

export function playBalloonPopSound(audio: AudioManager): void {
  void audio.playUrl('sfx', hubSoundUrl.balloonPop(), { volume: 0.88 })
}

/** Тихий звук «не то». Один на все игры. */
export function playSoftMiss(audio: AudioManager): void {
  void audio.playUrl('sfx', hubSoundUrl.softMiss(), { volume: 0.5 })
}

/** «Взял» и «положил» — одни на все игры с перетаскиванием. */
export function playPickupSound(audio: AudioManager): void {
  void audio.playUrl('sfx', hubSoundUrl.pickup(), { volume: 0.7 })
}

export function playDropSound(audio: AudioManager): void {
  void audio.playUrl('sfx', hubSoundUrl.drop(), { volume: 0.7 })
}

/** Короткая мелодия «готово!» в конце картинки (пазл, прятки). */
export function playCelebrationTune(audio: AudioManager): void {
  const notes = [523, 659, 784, 1047] as const
  notes.forEach((freq, i) => {
    window.setTimeout(() => {
      void audio.playTone(freq, { channel: 'sfx', durationSec: 0.22, gain: 0.17 })
    }, i * 110)
  })
}
