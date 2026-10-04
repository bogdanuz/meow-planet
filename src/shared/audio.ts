import type { AppSettings } from './storage'
import {
  createVoicePool,
  getAudioMaster,
  getReadyBuffer,
  isMusicDucked,
  loadBuffer,
  onMusicDuck,
  preloadBuffers,
  resumeAudioMaster,
  setMusicDucked,
  startBufferVoice,
  type EngineVoice,
} from './audio-engine'

export type AudioChannel = 'sfx' | 'voice' | 'music'

export type AudioSettingsSnapshot = Pick<
  AppSettings,
  'soundEnabled' | 'musicEnabled' | 'quietMode'
>

export type AudioManager = {
  /** Разблокировка AudioContext после жеста пользователя (обязательно на iPad). */
  unlock: () => Promise<void>
  isUnlocked: () => boolean
  /** Короткий тестовый тон без файлов (для unit / stub). */
  playBeep: (channel?: AudioChannel) => Promise<void>
  /** Мягкий тон заданной частоты (шарики, ноты по цвету). */
  playTone: (
    frequencyHz: number,
    options?: { channel?: AudioChannel; durationSec?: number; gain?: number },
  ) => Promise<void>
  playUrl: (
    channel: AudioChannel,
    url: string,
    options?: { volume?: number; startSec?: number },
  ) => Promise<boolean>
  /** Фрагмент файла (обрезка длинных sfx без ffmpeg). */
  playUrlSegment: (
    channel: AudioChannel,
    url: string,
    startSec: number,
    durationSec: number,
    options?: {
      volume?: number
      repeat?: number
      fadeOutSec?: number
      /** false — не обрывать предыдущий sfx (глиссандо пианино/гитары). */
      stopPrevious?: boolean
      /** Скорость/высота воспроизведения (ксилофон из колокольчика). */
      playbackRate?: number
    },
  ) => Promise<boolean>
  stopMusic: () => void
  /** Быстро и ровно увести музыку в тишину, без обрыва. */
  fadeOutMusic: (ms?: number) => void
  /** Смена фоновой петли: fade-out текущей → fade-in новой (или только громкость, если тот же файл). */
  switchMusic: (
    url: string,
    peakVolume: number,
    options?: { fadeOutMs?: number; fadeInMs?: number },
  ) => Promise<boolean>
  /** Ждёт, пока доиграет текущая реплика (или сразу, если голоса нет). */
  waitUntilVoiceEnded: () => Promise<void>
  /** Обрывает текущий sfx (карточки sound-world и др.). */
  stopSfx: () => void
  /** Обрывает текущую голосовую фразу. */
  stopVoice: () => void
  /** Заранее скачать и декодировать звуки, чтобы касание звучало мгновенно. */
  preload: (urls: readonly string[]) => Promise<void>
  /** Увести фоновую музыку приложения в тишину (музыка продолжает идти). */
  duckMusic: (ms?: number) => void
  /** Вернуть фоновую музыку после duckMusic. */
  restoreMusic: (ms?: number) => void
  /** В тихом режиме яркие анимации-реакции приглушены (В2.1 = Б). */
  allowBrightMotion: () => boolean
  updateSettings: (settings: AudioSettingsSnapshot) => void
  /** Игра уходит: заглушить свои звуки и отписаться от общих событий. */
  dispose?: () => void
}

/** Сколько sfx-голосов звучит одновременно; больше — треск от суммирования. */
const MAX_SFX_VOICES = 8

// На iPad разные игры могут создавать свои AudioManager-инстансы.
// Фоновые обработчики должны останавливать ВСЕ активные инстансы,
// а не только последний (иначе часть музыки может продолжить играть).
const backgroundStopAllSet = new Set<() => void>()
let backgroundListenersInstalled = false

function stopAllBackgroundSounds(): void {
  for (const stop of backgroundStopAllSet) {
    try {
      stop()
    } catch {
      // ignore
    }
  }
}

export function backgroundAudioManagersForTests(): number {
  return backgroundStopAllSet.size
}

function ensureBackgroundPauseListeners(): void {
  if (backgroundListenersInstalled) return
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAllBackgroundSounds()
  })

  window.addEventListener(
    'pagehide',
    () => {
      stopAllBackgroundSounds()
    },
    { capture: true },
  )

  window.addEventListener(
    'blur',
    () => {
      // Пока страница на экране, blur на iPad приходит и от обычного тапа.
      // Голос в этот момент не обрываем — иначе следующая фраза стартует раньше времени.
      if (document.hidden) stopAllBackgroundSounds()
    },
    { capture: true },
  )

  backgroundListenersInstalled = true
}

function channelAllowed(
  channel: AudioChannel,
  settings: AudioSettingsSnapshot,
): boolean {
  if (channel === 'music') {
    if (settings.quietMode) return false
    return settings.musicEnabled
  }
  // Голос и SFX остаются в тихом режиме (В2.1 вариант Б)
  return settings.soundEnabled
}

/**
 * Клиентский аудио-менеджер без бэкенда.
 * Файлы появятся в мегафайле (S13); до этого — beep через Web Audio.
 */
export function createAudioManager(
  initial: AudioSettingsSnapshot = {
    soundEnabled: true,
    musicEnabled: true,
    quietMode: false,
  },
): AudioManager {
  let settings = { ...initial }
  ensureBackgroundPauseListeners()
  let unlocked = false
  let musicSession = 0
  let musicAudio: HTMLAudioElement | null = null
  let musicFade = 0
  let settleMusicFade: (() => void) | null = null
  const musicGains = new WeakMap<HTMLAudioElement, GainNode>()
  const musicLevels = new WeakMap<HTMLAudioElement, number>()
  let duckSubscribed = false
  let unsubscribeDuck: (() => void) | null = null
  let sfxElement: HTMLAudioElement | null = null
  let voiceElement: HTMLAudioElement | null = null
  let voiceToken = 0
  let voiceEnded: Promise<void> = Promise.resolve()
  let settleVoiceEnded: (() => void) | null = null
  const sfxPool = createVoicePool(MAX_SFX_VOICES)

  function finishVoiceWait(): void {
    const settle = settleVoiceEnded
    settleVoiceEnded = null
    settle?.()
  }

  function beginVoiceWait(): void {
    finishVoiceWait()
    voiceEnded = new Promise<void>((resolve) => {
      settleVoiceEnded = resolve
    })
  }

  function silenceVoiceElement(el: HTMLAudioElement): void {
    el.onended = null
    el.pause()
    el.removeAttribute('src')
    try {
      el.load()
    } catch {
      // ignore
    }
  }

  function stopVoice(): void {
    if (voiceElement) {
      const current = voiceElement
      voiceElement = null
      silenceVoiceElement(current)
    }
    finishVoiceWait()
  }

  function stopSfx(): void {
    if (sfxElement) {
      sfxElement.pause()
      sfxElement.removeAttribute('src')
      sfxElement.load()
      sfxElement = null
    }
    sfxPool.stopAll()
  }

  async function unlock(): Promise<void> {
    const master = await resumeAudioMaster()
    if (!master) {
      unlocked = true
      return
    }
    // Тихий буфер — «разблокировка» политики autoplay
    try {
      const buffer = master.ctx.createBuffer(1, 1, 22050)
      const source = master.ctx.createBufferSource()
      source.buffer = buffer
      source.connect(master.ctx.destination)
      source.start(0)
    } catch {
      // ignore
    }
    unlocked = true
  }

  function startPooledVoice(
    buffer: AudioBuffer,
    options: Parameters<typeof startBufferVoice>[2],
  ): boolean {
    const master = getAudioMaster()
    if (!master) return false
    let voice: EngineVoice | null = null
    voice = startBufferVoice(master, buffer, {
      ...options,
      onEnded: () => {
        if (voice) sfxPool.remove(voice)
      },
    })
    sfxPool.add(voice)
    return true
  }

  async function playSfxBuffer(
    url: string,
    volume: number,
    startSec = 0,
  ): Promise<boolean> {
    const master = await resumeAudioMaster()
    if (!master) return false
    const buffer = getReadyBuffer(url) ?? (await loadBuffer(url))
    if (!buffer) return false
    return startPooledVoice(buffer, {
      volume,
      startSec,
      fadeOutSec: 0.16,
    })
  }

  /** Резервный путь без Web Audio: не трогает другие звуки. */
  async function playHtmlOneShot(url: string, volume: number): Promise<boolean> {
    try {
      const el = new Audio(url)
      el.volume = volume
      await el.play()
      return true
    } catch {
      return false
    }
  }

  async function playBeep(channel: AudioChannel = 'sfx'): Promise<void> {
    const freq = channel === 'music' ? 220 : channel === 'voice' ? 440 : 660
    await playTone(freq, {
      channel,
      durationSec: 0.12,
      gain: channel === 'music' ? 0.04 : 0.08,
    })
  }

  async function playTone(
    frequencyHz: number,
    options: {
      channel?: AudioChannel
      durationSec?: number
      gain?: number
    } = {},
  ): Promise<void> {
    const channel = options.channel ?? 'sfx'
    if (!channelAllowed(channel, settings)) return
    if (!unlocked) await unlock()
    const master = await resumeAudioMaster()
    if (!master) return
    const audioCtx = master.ctx

    const duration = options.durationSec ?? 0.14
    const peakGain = options.gain ?? 0.06

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = Math.max(80, Math.min(1200, frequencyHz))
    const t0 = audioCtx.currentTime
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(gain)
    gain.connect(master.output)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
  }

  async function playUrlSegment(
    channel: AudioChannel,
    url: string,
    startSec: number,
    durationSec: number,
    options: {
      volume?: number
      repeat?: number
      fadeOutSec?: number
      stopPrevious?: boolean
      playbackRate?: number
    } = {},
  ): Promise<boolean> {
    if (!channelAllowed(channel, settings)) return false
    if (!unlocked) await unlock()
    const stopPrevious = options.stopPrevious !== false
    if (channel === 'sfx' && stopPrevious) stopSfx()
    const peak = options.volume ?? 0.7
    const fallback = (): Promise<boolean> =>
      stopPrevious ? playUrl(channel, url) : playHtmlOneShot(url, peak)
    const master = await resumeAudioMaster()
    if (!master) return fallback()
    const buffer = getReadyBuffer(url) ?? (await loadBuffer(url))
    if (!buffer) return fallback()

    const voiceOptions = {
      volume: peak,
      startSec,
      durationSec,
      loopTimes: options.repeat,
      playbackRate: options.playbackRate,
      fadeOutSec: options.fadeOutSec ?? (channel === 'sfx' ? 0.16 : 0),
    }
    if (channel === 'sfx') return startPooledVoice(buffer, voiceOptions)
    startBufferVoice(master, buffer, voiceOptions)
    return true
  }

  function clipAtEnd(el: HTMLAudioElement): boolean {
    const dur = el.duration
    if (!Number.isFinite(dur) || dur <= 0.2) return false
    return el.currentTime >= dur - 0.12
  }

  function waitUntilVoiceEnded(): Promise<void> {
    const el = voiceElement
    if (!el || voiceToken === 0) return voiceEnded
    if (el.ended && clipAtEnd(el)) return voiceEnded

    return new Promise<void>((resolve) => {
      let settled = false
      let timer: ReturnType<typeof setTimeout> | undefined
      const done = () => {
        if (settled) return
        settled = true
        if (timer !== undefined) clearTimeout(timer)
        el.removeEventListener('ended', onEnded)
        resolve()
      }
      const onEnded = () => {
        if (clipAtEnd(el)) done()
      }
      const arm = (durationSec: number) => {
        const remainMs = Math.max(0, (durationSec - el.currentTime) * 1000)
        timer = setTimeout(done, remainMs)
        const handle = timer as unknown as { unref?: () => void }
        handle.unref?.()
      }
      if (Number.isFinite(el.duration) && el.duration > 0) {
        arm(el.duration)
      } else {
        el.addEventListener(
          'loadedmetadata',
          () => {
            if (!settled && Number.isFinite(el.duration) && el.duration > 0) {
              arm(el.duration)
            }
          },
          { once: true },
        )
      }
      el.addEventListener('ended', onEnded)
    })
  }

  async function playUrl(
    channel: AudioChannel,
    url: string,
    options: { volume?: number; startSec?: number } = {},
  ): Promise<boolean> {
    const token = channel === 'voice' ? ++voiceToken : 0
    if (channel === 'voice') beginVoiceWait()
    if (!channelAllowed(channel, settings)) {
      if (channel === 'voice') finishVoiceWait()
      return false
    }
    if (!unlocked) await unlock()
    if (channel === 'voice' && token !== voiceToken) return false

    if (channel === 'music') {
      const nextSrc = new URL(url, window.location.href).href
      if (musicAudio && !musicAudio.paused && musicAudio.src === nextSrc) return true
      stopMusic()
      const track = createMusicTrack(url)
      musicAudio = track
      const peak = options.volume ?? 0.28
      void setMusicLevel(track, settings.quietMode ? 0 : peak, 0)
      try {
        await track.play()
        return true
      } catch {
        return false
      }
    }

    if (channel === 'voice') {
      if (voiceElement) {
        const previous = voiceElement
        voiceElement = null
        silenceVoiceElement(previous)
      }
    } else {
      stopSfx()
      // Web Audio не отнимает у голоса аудиосессию и звучит без задержки на повторах.
      if (await playSfxBuffer(url, options.volume ?? 0.7, options.startSec ?? 0)) return true
    }
    const audio = new Audio(url)
    const peak = options.volume ?? 0.7
    audio.volume = peak
    const startSec = options.startSec ?? 0
    if (channel === 'sfx') {
      const fadeHtml = (el: HTMLAudioElement) => {
        if (!Number.isFinite(el.duration) || el.duration <= 0) return
        const left = el.duration - el.currentTime
        const fade = Math.min(0.16, el.duration * 0.4)
        if (left <= fade) el.volume = peak * Math.max(0, left / fade)
      }
      audio.addEventListener('timeupdate', () => fadeHtml(audio))
    }
    if (channel === 'voice') voiceElement = audio
    else sfxElement = audio
    try {
      if (startSec > 0 && audio.readyState < 1) {
        await new Promise<void>((resolve) => {
          audio.addEventListener('loadedmetadata', () => resolve(), { once: true })
        })
      }
      if (startSec > 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(startSec, Math.max(0, audio.duration - 0.05))
      }
      await audio.play()
      if (channel === 'voice' && token !== voiceToken) {
        silenceVoiceElement(audio)
        if (voiceElement === audio) voiceElement = null
        return false
      }
      audio.onended = () => {
        if (channel === 'voice') {
          if (token !== voiceToken || voiceElement !== audio) return
          voiceElement = null
          finishVoiceWait()
          return
        }
        if (sfxElement === audio) sfxElement = null
      }
      return true
    } catch {
      if (channel === 'voice') {
        if (token !== voiceToken) return false
        if (voiceElement === audio) voiceElement = null
        finishVoiceWait()
      } else if (sfxElement === audio) {
        sfxElement = null
      }
      return false
    }
  }

  function cancelMusicFade(): void {
    if (musicFade) {
      cancelAnimationFrame(musicFade)
      musicFade = 0
    }
    const settle = settleMusicFade
    settleMusicFade = null
    settle?.()
  }

  function stopMusic(): void {
    cancelMusicFade()
    if (musicAudio) {
      const track = musicAudio
      musicAudio = null
      track.pause()
      try {
        musicGains.get(track)?.disconnect()
      } catch {
        // ignore
      }
    }
  }

  function subscribeMusicDuck(): void {
    if (duckSubscribed) return
    duckSubscribed = true
    unsubscribeDuck = onMusicDuck((ducked, ms) => {
      const track = musicAudio
      if (track) void rampMusic(track, ducked ? 0 : musicLevel(track), ms)
    })
  }

  /**
   * Музыка идёт через GainNode общего контекста: на iOS у `<audio>.volume` нет эффекта,
   * поэтому затухание через volume там не работало.
   */
  function createMusicTrack(url: string): HTMLAudioElement {
    const track = new Audio(url)
    track.loop = true
    musicLevels.set(track, 0)
    subscribeMusicDuck()
    const master = getAudioMaster()
    if (master && typeof master.ctx.createMediaElementSource === 'function') {
      try {
        const source = master.ctx.createMediaElementSource(track)
        const gain = master.ctx.createGain()
        gain.gain.value = 0
        source.connect(gain)
        gain.connect(master.output)
        musicGains.set(track, gain)
        track.volume = 1
        return track
      } catch {
        // старый WebKit: остаётся затухание через volume
      }
    }
    track.volume = 0
    return track
  }

  function musicLevel(track: HTMLAudioElement): number {
    return musicLevels.get(track) ?? track.volume
  }

  function rampMusic(track: HTMLAudioElement, to: number, ms: number): Promise<void> {
    const gain = musicGains.get(track)
    if (!gain) return fadeVolumeAsync(track, track.volume, to, ms)
    cancelMusicFade()
    const now = gain.context.currentTime
    const current = gain.gain.value
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(current, now)
    gain.gain.linearRampToValueAtTime(Math.max(0, to), now + Math.max(0.01, ms / 1000))
    if (ms <= 0) return Promise.resolve()
    return new Promise((resolve) => {
      settleMusicFade = resolve
      window.setTimeout(() => {
        if (settleMusicFade === resolve) settleMusicFade = null
        resolve()
      }, ms)
    })
  }

  function setMusicLevel(track: HTMLAudioElement, level: number, ms: number): Promise<void> {
    musicLevels.set(track, level)
    return rampMusic(track, isMusicDucked() ? 0 : level, ms)
  }

  function musicSrcHref(url: string): string {
    if (typeof window === 'undefined') return url
    return new URL(url, window.location.href).href
  }

  function fadeVolumeAsync(
    audioEl: HTMLAudioElement,
    from: number,
    to: number,
    ms: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      cancelMusicFade()
      settleMusicFade = resolve
      if (ms <= 0) {
        try {
          audioEl.volume = Math.min(1, Math.max(0, to))
        } catch {
          // jsdom
        }
        resolve()
        return
      }
      try {
        audioEl.volume = Math.min(1, Math.max(0, from))
      } catch {
        resolve()
        return
      }
      const t0 = performance.now()
      const step = (now: number): void => {
        if (musicAudio !== audioEl) {
          resolve()
          return
        }
        const t = Math.min(1, (now - t0) / ms)
        const eased = t * t
        const nextVol = from + (to - from) * eased
        try {
          audioEl.volume = Math.min(1, Math.max(0, nextVol))
        } catch {
          musicFade = 0
          resolve()
          return
        }
        if (t < 1) {
          musicFade = requestAnimationFrame(step)
          return
        }
        musicFade = 0
        try {
          audioEl.volume = Math.min(1, Math.max(0, to))
        } catch {
          // jsdom / detached element
        }
        resolve()
      }
      musicFade = requestAnimationFrame(step)
    })
  }

  function fadeOutMusicAsync(ms = 280): Promise<void> {
    const audioEl = musicAudio
    if (!audioEl || musicLevel(audioEl) <= 0.001 || isMusicDucked()) {
      stopMusic()
      return Promise.resolve()
    }
    return setMusicLevel(audioEl, 0, ms).then(() => {
      if (musicAudio === audioEl) stopMusic()
    })
  }

  function fadeOutMusic(ms = 280): void {
    void fadeOutMusicAsync(ms)
  }

  async function switchMusic(
    url: string,
    peakVolume: number,
    options: { fadeOutMs?: number; fadeInMs?: number } = {},
  ): Promise<boolean> {
    if (!channelAllowed('music', settings)) {
      musicSession += 1
      stopMusic()
      return false
    }

    const nextSrc = musicSrcHref(url)
    const current = musicAudio
    // Тот же файл: не поднимать session — иначе переход welcome→меню глушит жест.
    if (current && current.src === nextSrc) {
      void unlock()
      const peak = settings.quietMode ? 0 : peakVolume
      const inMs = options.fadeInMs ?? 280
      try {
        if (current.paused) {
          const playing = current.play()
          await playing
        }
      } catch {
        return false
      }
      if (!channelAllowed('music', settings)) {
        stopMusic()
        return false
      }
      await setMusicLevel(current, peak, inMs)
      return channelAllowed('music', settings)
    }

    const session = (musicSession += 1)
    const stale = (): boolean =>
      session !== musicSession || !channelAllowed('music', settings)

    if (stale()) {
      if (!channelAllowed('music', settings)) stopMusic()
      return false
    }
    // HTMLAudio.play() не ждать unlock() — на iPad жест протухает после await resume.
    void unlock()

    const outMs = options.fadeOutMs ?? 280
    const inMs = options.fadeInMs ?? 280
    const peak = settings.quietMode ? 0 : peakVolume

    if (current && musicLevel(current) > 0.001 && !isMusicDucked()) {
      await fadeOutMusicAsync(outMs)
    } else if (current) {
      stopMusic()
    }
    // Новый трек оболочки (переход в меню/другую игру) всегда снимает duck инструмента.
    setMusicDucked(false, 0)
    if (stale()) return false

    const next = createMusicTrack(url)
    musicAudio = next
    try {
      await next.play()
    } catch {
      if (musicAudio === next) musicAudio = null
      return false
    }
    if (stale()) {
      if (musicAudio === next) stopMusic()
      return false
    }
    await setMusicLevel(next, peak, inMs)
    if (stale()) {
      stopMusic()
      return false
    }
    return true
  }

  // iOS Safari / PWA: при уходе в background может продолжать играть звук.
  // На скрытии экрана останавливаем активные каналы, чтобы избежать фонового аудио.
  function stopAllSounds(): void {
    stopSfx()
    stopVoice()
    stopMusic()
  }

  backgroundStopAllSet.add(stopAllSounds)

  return {
    unlock,
    isUnlocked: () => unlocked,
    playBeep,
    playTone,
    playUrl,
    playUrlSegment,
    waitUntilVoiceEnded,
    stopMusic,
    fadeOutMusic,
    switchMusic,
    stopSfx,
    stopVoice,
    preload: (urls) => preloadBuffers(urls),
    duckMusic: (ms = 400) => setMusicDucked(true, ms),
    restoreMusic: (ms = 400) => setMusicDucked(false, ms),
    allowBrightMotion: () => !settings.quietMode,
    updateSettings: (next) => {
      settings = { ...next }
      if (!channelAllowed('music', settings)) {
        musicSession += 1
        stopMusic()
      }
      if (!channelAllowed('voice', settings)) stopVoice()
    },
    dispose: () => {
      // Короткий sfx (тап по «Назад») доигрывает сам; голос и музыка ушедшей игры — нет.
      musicSession += 1
      stopVoice()
      stopMusic()
      backgroundStopAllSet.delete(stopAllSounds)
      unsubscribeDuck?.()
      unsubscribeDuck = null
      duckSubscribed = false
    },
  }
}
