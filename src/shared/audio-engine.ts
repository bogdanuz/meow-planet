/**
 * Общий звуковой движок приложения: один AudioContext, ограничитель на выходе,
 * кэш декодированных звуков, мягкие края у каждого голоса и общий «duck» музыки.
 * Игры создают свои AudioManager, но все они звучат через этот мастер.
 */

export type AudioMaster = {
  ctx: AudioContext
  /** Вход ограничителя: все голоса подключаются сюда, а не к destination. */
  output: AudioNode
}

export type EngineVoice = {
  stop: (releaseSec?: number) => void
}

export type BufferVoiceOptions = {
  volume: number
  startSec?: number
  durationSec?: number
  /** Повторить сегмент N раз подряд (маракас, барабанная дробь). */
  loopTimes?: number
  playbackRate?: number
  fadeInSec?: number
  fadeOutSec?: number
  onEnded?: () => void
}

/** Мягкое начало: 5 мс убирают щелчок на старте сэмпла. */
export const VOICE_FADE_IN_SEC = 0.005
/** Минимальное мягкое окончание, даже если сегмент обрезан посередине волны. */
export const VOICE_MIN_FADE_OUT_SEC = 0.012
const VOICE_RELEASE_SEC = 0.02

let master: AudioMaster | null = null
const pendingBuffers = new Map<string, Promise<AudioBuffer>>()
const readyBuffers = new Map<string, AudioBuffer>()
let musicDucked = false
const duckListeners = new Set<(ducked: boolean, ms: number) => void>()
let gestureResumeInstalled = false

function audioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  )
}

function installGestureResume(): void {
  if (gestureResumeInstalled || typeof document === 'undefined') return
  gestureResumeInstalled = true
  // iOS переводит контекст в suspended/interrupted после звонка или фона.
  // Любое касание возвращает звук, не дожидаясь очередного unlock() игры.
  const resume = (): void => {
    const ctx = master?.ctx
    if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => undefined)
  }
  document.addEventListener('pointerdown', resume, { capture: true, passive: true })
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resume()
  })
}

export function getAudioMaster(): AudioMaster | null {
  if (master) return master
  const AC = audioContextCtor()
  if (!AC) return null
  // Web Audio на iPad по умолчанию молчит при беззвучном режиме — а голос и звуки нужны всегда.
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
  if (session) {
    try {
      session.type = 'playback'
    } catch {
      // старый Safari
    }
  }
  let ctx: AudioContext
  try {
    ctx = new AC({ latencyHint: 'interactive' })
  } catch {
    return null
  }
  let output: AudioNode = ctx.destination
  try {
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -8
    limiter.knee.value = 4
    limiter.ratio.value = 12
    limiter.attack.value = 0.003
    limiter.release.value = 0.12
    limiter.connect(ctx.destination)
    output = limiter
  } catch {
    output = ctx.destination
  }
  master = { ctx, output }
  installGestureResume()
  return master
}

export async function resumeAudioMaster(): Promise<AudioMaster | null> {
  const m = getAudioMaster()
  if (!m) return null
  if (m.ctx.state !== 'running') {
    try {
      await m.ctx.resume()
    } catch {
      // iOS может отказать вне жеста — следующий pointerdown повторит.
    }
  }
  return m
}

function bufferKey(url: string): string {
  if (typeof window === 'undefined') return url
  return new URL(url, window.location.href).href
}

/** Уже декодированный звук без ожидания (для мгновенного старта на касание). */
export function getReadyBuffer(url: string): AudioBuffer | null {
  return readyBuffers.get(bufferKey(url)) ?? null
}

export function loadBuffer(url: string): Promise<AudioBuffer | null> {
  const m = getAudioMaster()
  if (!m) return Promise.resolve(null)
  const key = bufferKey(url)
  let pending = pendingBuffers.get(key)
  if (!pending) {
    pending = fetch(key)
      .then((res) => {
        if (!res.ok) throw new Error(`audio ${res.status}`)
        return res.arrayBuffer()
      })
      .then((data) => m.ctx.decodeAudioData(data))
      .then((buffer) => {
        readyBuffers.set(key, buffer)
        return buffer
      })
    pendingBuffers.set(key, pending)
    pending.catch(() => {
      if (pendingBuffers.get(key) === pending) pendingBuffers.delete(key)
    })
  }
  return pending.catch(() => null)
}

export async function preloadBuffers(urls: readonly string[]): Promise<void> {
  await Promise.all(urls.map((url) => loadBuffer(url)))
}

function rampToSilence(param: AudioParam, now: number, releaseSec: number): void {
  const current = param.value
  param.cancelScheduledValues(now)
  param.setValueAtTime(current, now)
  param.linearRampToValueAtTime(0, now + releaseSec)
}

export function startBufferVoice(
  m: AudioMaster,
  buffer: AudioBuffer,
  options: BufferVoiceOptions,
): EngineVoice {
  const { ctx, output } = m
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = buffer
  const rate = options.playbackRate ?? 1
  if (rate !== 1) source.playbackRate.value = rate
  source.connect(gain)
  gain.connect(output)

  const start = Math.max(0, Math.min(options.startSec ?? 0, buffer.duration))
  const available = Math.max(0.05, buffer.duration - start)
  const segment = Math.min(Math.max(0.05, options.durationSec ?? available), available)
  const times = Math.max(1, Math.floor(options.loopTimes ?? 1))
  if (times > 1) {
    source.loop = true
    source.loopStart = start
    source.loopEnd = start + segment
  }
  const playDur = (segment * times) / rate
  const fadeIn = Math.min(options.fadeInSec ?? VOICE_FADE_IN_SEC, playDur * 0.3)
  const fadeOut = Math.min(
    Math.max(options.fadeOutSec ?? VOICE_MIN_FADE_OUT_SEC, VOICE_MIN_FADE_OUT_SEC),
    playDur * 0.4,
  )
  const t0 = ctx.currentTime
  const peak = Math.max(0, options.volume)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(peak, t0 + fadeIn)
  gain.gain.setValueAtTime(peak, t0 + Math.max(fadeIn, playDur - fadeOut))
  gain.gain.linearRampToValueAtTime(0, t0 + playDur)

  let finished = false
  source.onended = () => {
    if (finished) return
    finished = true
    try {
      source.disconnect()
      gain.disconnect()
    } catch {
      // ignore
    }
    options.onEnded?.()
  }
  if (times > 1) {
    source.start(t0, start)
    source.stop(t0 + playDur + 0.01)
  } else {
    source.start(t0, start, segment)
  }

  return {
    stop(releaseSec = VOICE_RELEASE_SEC) {
      if (finished) return
      const now = ctx.currentTime
      try {
        rampToSilence(gain.gain, now, releaseSec)
        source.stop(now + releaseSec + 0.005)
      } catch {
        // уже остановлен
      }
    },
  }
}

/** Пул голосов: при переполнении старейший уходит коротким затуханием. */
export function createVoicePool(max: number) {
  const voices: EngineVoice[] = []
  const remove = (voice: EngineVoice): void => {
    const idx = voices.indexOf(voice)
    if (idx >= 0) voices.splice(idx, 1)
  }
  return {
    add(voice: EngineVoice): void {
      while (voices.length >= max) voices.shift()?.stop(0.03)
      voices.push(voice)
    },
    remove,
    stopAll(releaseSec?: number): void {
      for (const voice of voices.splice(0)) voice.stop(releaseSec)
    },
    size: () => voices.length,
  }
}

export function isMusicDucked(): boolean {
  return musicDucked
}

/** Увести фоновую музыку в тишину (инструменты) или вернуть её. */
export function setMusicDucked(ducked: boolean, ms = 400): void {
  if (musicDucked === ducked) return
  musicDucked = ducked
  for (const listener of duckListeners) listener(ducked, ms)
}

export function onMusicDuck(listener: (ducked: boolean, ms: number) => void): () => void {
  duckListeners.add(listener)
  return () => duckListeners.delete(listener)
}

export function resetAudioEngineForTests(): void {
  master = null
  pendingBuffers.clear()
  readyBuffers.clear()
  musicDucked = false
  duckListeners.clear()
}
