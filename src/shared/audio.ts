import type { AppSettings } from './storage'

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
  /** В тихом режиме яркие анимации-реакции приглушены (В2.1 = Б). */
  allowBrightMotion: () => boolean
  updateSettings: (settings: AudioSettingsSnapshot) => void
}

let backgroundStopAll: (() => void) | null = null
let backgroundListenersInstalled = false

function ensureBackgroundPauseListeners(): void {
  if (backgroundListenersInstalled) return
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) backgroundStopAll?.()
  })

  window.addEventListener(
    'pagehide',
    () => {
      backgroundStopAll?.()
    },
    { capture: true },
  )

  window.addEventListener(
    'blur',
    () => {
      backgroundStopAll?.()
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
  let ctx: AudioContext | null = null
  let musicAudio: HTMLAudioElement | null = null
  let musicFade = 0
  let sfxElement: HTMLAudioElement | null = null
  let voiceElement: HTMLAudioElement | null = null
  let voiceEnded: Promise<void> = Promise.resolve()
  let settleVoiceEnded: (() => void) | null = null
  let sfxSource: AudioBufferSourceNode | null = null
  let sfxGain: GainNode | null = null
  const sfxLayers: { source: AudioBufferSourceNode; gain: GainNode }[] = []
  const MAX_SFX_LAYERS = 14

  function detachLayer(entry: { source: AudioBufferSourceNode; gain: GainNode }): void {
    const idx = sfxLayers.indexOf(entry)
    if (idx >= 0) sfxLayers.splice(idx, 1)
    try {
      entry.source.stop()
    } catch {
      // already stopped
    }
    try {
      entry.source.disconnect()
    } catch {
      // ignore
    }
    try {
      entry.gain.disconnect()
    } catch {
      // ignore
    }
  }

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

  function stopVoice(): void {
    if (voiceElement) {
      voiceElement.pause()
      voiceElement.removeAttribute('src')
      voiceElement.load()
      voiceElement = null
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
    if (sfxSource) {
      try {
        sfxSource.stop()
      } catch {
        // уже остановлен
      }
      try {
        sfxSource.disconnect()
      } catch {
        // ignore
      }
      sfxSource = null
    }
    if (sfxGain) {
      try {
        sfxGain.disconnect()
      } catch {
        // ignore
      }
      sfxGain = null
    }
    while (sfxLayers.length > 0) {
      detachLayer(sfxLayers[0]!)
    }
  }

  async function ensureContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AC) return null
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    return ctx
  }

  async function unlock(): Promise<void> {
    const audioCtx = await ensureContext()
    if (!audioCtx) {
      unlocked = true
      return
    }
    // Тихий буфер — «разблокировка» политики autoplay
    const buffer = audioCtx.createBuffer(1, 1, 22050)
    const source = audioCtx.createBufferSource()
    source.buffer = buffer
    source.connect(audioCtx.destination)
    source.start(0)
    unlocked = true
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
    const audioCtx = await ensureContext()
    if (!audioCtx) return

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
    gain.connect(audioCtx.destination)
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
    } = {},
  ): Promise<boolean> {
    if (!channelAllowed(channel, settings)) return false
    if (!unlocked) await unlock()
    const stopPrevious = options.stopPrevious !== false
    if (channel === 'sfx' && stopPrevious) stopSfx()
    const audioCtx = await ensureContext()
    if (!audioCtx) {
      return playUrl(channel, url)
    }

    const peak = options.volume ?? 0.7
    const times = Math.max(1, Math.floor(options.repeat ?? 1))
    try {
      const res = await fetch(url)
      if (!res.ok) return false
      const data = await res.arrayBuffer()
      const buffer = await audioCtx.decodeAudioData(data.slice(0))
      const start = Math.max(0, Math.min(startSec, buffer.duration))
      const maxDur = Math.max(0.05, buffer.duration - start)
      const dur = Math.min(Math.max(0.05, durationSec), maxDur)

      const source = audioCtx.createBufferSource()
      const gain = audioCtx.createGain()
      source.buffer = buffer
      source.connect(gain)
      gain.connect(audioCtx.destination)
      if (times > 1) {
        source.loop = true
        source.loopStart = start
        source.loopEnd = start + dur
      }
      const playDur = dur * times
      const fadeSec = Math.min(options.fadeOutSec ?? (channel === 'sfx' ? 0.16 : 0), playDur * 0.4)
      const t0 = audioCtx.currentTime
      gain.gain.setValueAtTime(peak, t0)
      if (fadeSec > 0.02) {
        gain.gain.setValueAtTime(peak, t0 + Math.max(0, playDur - fadeSec))
        gain.gain.linearRampToValueAtTime(0.0001, t0 + playDur)
      }
      if (channel === 'sfx') {
        const layer = { source, gain }
        if (stopPrevious) {
          sfxSource = source
          sfxGain = gain
          source.onended = () => {
            if (sfxSource === source) {
              sfxSource = null
              sfxGain = null
            }
          }
        } else {
          while (sfxLayers.length >= MAX_SFX_LAYERS) {
            detachLayer(sfxLayers[0]!)
          }
          sfxLayers.push(layer)
          source.onended = () => detachLayer(layer)
        }
      }
      source.start(0, start, times > 1 ? undefined : dur)
      if (times > 1) {
        source.stop(audioCtx.currentTime + playDur)
      }
      return true
    } catch {
      return playUrl(channel, url)
    }
  }

  function waitUntilVoiceEnded(): Promise<void> {
    return voiceEnded
  }

  async function playUrl(
    channel: AudioChannel,
    url: string,
    options: { volume?: number; startSec?: number } = {},
  ): Promise<boolean> {
    if (channel === 'voice') beginVoiceWait()
    if (!channelAllowed(channel, settings)) {
      if (channel === 'voice') finishVoiceWait()
      return false
    }
    if (!unlocked) await unlock()

    if (channel === 'music') {
      const nextSrc = new URL(url, window.location.href).href
      if (musicAudio && !musicAudio.paused && musicAudio.src === nextSrc) return true
      stopMusic()
      musicAudio = new Audio(url)
      musicAudio.loop = true
      const peak = options.volume ?? 0.28
      musicAudio.volume = settings.quietMode ? 0 : peak
      try {
        await musicAudio.play()
        return true
      } catch {
        return false
      }
    }

    if (channel === 'voice') {
      if (voiceElement) {
        voiceElement.pause()
        voiceElement.removeAttribute('src')
        voiceElement.load()
        voiceElement = null
      }
    } else {
      stopSfx()
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
      audio.onended = () => {
        if (channel === 'voice') {
          if (voiceElement === audio) voiceElement = null
          finishVoiceWait()
        } else if (sfxElement === audio) {
          sfxElement = null
        }
      }
      return true
    } catch {
      if (channel === 'voice') {
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
  }

  function stopMusic(): void {
    cancelMusicFade()
    if (musicAudio) {
      musicAudio.pause()
      musicAudio = null
    }
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
    if (!audioEl || audioEl.volume <= 0.001) {
      stopMusic()
      return Promise.resolve()
    }
    return fadeVolumeAsync(audioEl, audioEl.volume, 0, ms).then(() => {
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
      await fadeVolumeAsync(current, current.volume, peak, inMs)
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

    if (current && current.volume > 0.001) {
      await fadeOutMusicAsync(outMs)
    } else if (current) {
      stopMusic()
    }
    if (stale()) return false

    const next = new Audio(url)
    next.loop = true
    next.volume = 0
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
    await fadeVolumeAsync(next, 0, peak, inMs)
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

  backgroundStopAll = stopAllSounds

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
    allowBrightMotion: () => !settings.quietMode,
    updateSettings: (next) => {
      settings = { ...next }
      if (!channelAllowed('music', settings)) {
        musicSession += 1
        stopMusic()
      }
      if (!channelAllowed('voice', settings)) stopVoice()
    },
  }
}
