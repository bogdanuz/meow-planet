import { describe, expect, it, vi } from 'vitest'
import { createAudioManager } from '../../src/shared/audio'

describe('audio manager', () => {
  it('тихий режим глушит яркое движение и музыку', () => {
    const audio = createAudioManager({
      soundEnabled: true,
      musicEnabled: true,
      quietMode: true,
    })
    expect(audio.allowBrightMotion()).toBe(false)
  })

  it('без тихого режима яркое движение разрешено', () => {
    const audio = createAudioManager({
      soundEnabled: true,
      musicEnabled: true,
      quietMode: false,
    })
    expect(audio.allowBrightMotion()).toBe(true)
  })

  it('при выключенном звуке beep не падает', async () => {
    const audio = createAudioManager({
      soundEnabled: false,
      musicEnabled: false,
      quietMode: false,
    })
    await expect(audio.playBeep('sfx')).resolves.toBeUndefined()
    await expect(audio.playBeep('voice')).resolves.toBeUndefined()
  })

  it('updateSettings обновляет quietMode', () => {
    const audio = createAudioManager({
      soundEnabled: true,
      musicEnabled: true,
      quietMode: false,
    })
    audio.updateSettings({
      soundEnabled: true,
      musicEnabled: true,
      quietMode: true,
    })
    expect(audio.allowBrightMotion()).toBe(false)
  })

  it('stopSfx есть у менеджера', () => {
    const audio = createAudioManager()
    expect(typeof audio.stopSfx).toBe('function')
    audio.stopSfx()
  })

  it('switchMusic есть у менеджера', () => {
    const audio = createAudioManager()
    expect(typeof audio.switchMusic).toBe('function')
  })

  it('выключение музыки обрывает начатый switchMusic', async () => {
    const pause = vi.fn()
    vi.stubGlobal(
      'Audio',
      vi.fn(function Audio() {
        return {
          paused: true,
          volume: 0,
          src: '',
          loop: false,
          play: vi.fn(async () => {
            await new Promise((r) => setTimeout(r, 30))
          }),
          pause,
        }
      }),
    )
    const audio = createAudioManager({
      soundEnabled: true,
      musicEnabled: true,
      quietMode: false,
    })
    const pending = audio.switchMusic('hub-music.mp3', 0.28)
    audio.updateSettings({
      soundEnabled: false,
      musicEnabled: false,
      quietMode: false,
    })
    expect(await pending).toBe(false)
    expect(pause).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('второй switchMusic того же файла не глушит уже идущий трек', async () => {
    const pause = vi.fn()
    vi.stubGlobal(
      'Audio',
      vi.fn(function Audio(this: { src: string; paused: boolean; volume: number }, url?: string) {
        this.src = url ? new URL(url, window.location.href).href : ''
        this.paused = true
        this.volume = 0
        return {
          src: this.src,
          paused: true,
          volume: 0,
          loop: false,
          play: vi.fn(async function (this: { paused: boolean }) {
            this.paused = false
          }),
          pause,
        }
      }),
    )
    const audio = createAudioManager({
      soundEnabled: true,
      musicEnabled: true,
      quietMode: false,
    })
    const first = audio.switchMusic('hub-music.mp3', 0.28, {
      fadeInMs: 0,
      fadeOutMs: 0,
    })
    const second = audio.switchMusic('hub-music.mp3', 0.28, {
      fadeInMs: 0,
      fadeOutMs: 0,
    })
    expect(await first).toBe(true)
    expect(await second).toBe(true)
    expect(pause).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('waitUntilVoiceEnded ждёт ended у голоса', async () => {
    class FakeVoice {
      paused = false
      ended = false
      volume = 1
      src = ''
      currentTime = 0
      readyState = 4
      duration = 2
      onended: (() => void) | null = null
      private listeners = new Map<string, Set<() => void>>()
      addEventListener(type: string, fn: () => void) {
        const set = this.listeners.get(type) ?? new Set()
        set.add(fn)
        this.listeners.set(type, set)
      }
      removeEventListener(type: string, fn: () => void) {
        this.listeners.get(type)?.delete(fn)
      }
      play = vi.fn(async () => undefined)
      pause = vi.fn()
      load = vi.fn()
      removeAttribute = vi.fn()
      finish() {
        this.ended = true
        this.paused = true
        this.onended?.()
        this.listeners.get('ended')?.forEach((fn) => fn())
      }
    }
    const box: { finish: (() => void) | null } = { finish: null }
    vi.stubGlobal(
      'Audio',
      vi.fn(function Audio() {
        const voice = new FakeVoice()
        box.finish = () => voice.finish()
        return voice
      }),
    )
    const audio = createAudioManager({
      soundEnabled: true,
      musicEnabled: true,
      quietMode: false,
    })
    await audio.unlock()
    const started = audio.playUrl('voice', 'voice.mp3')
    const waiting = audio.waitUntilVoiceEnded()
    let done = false
    void waiting.then(() => {
      done = true
    })
    await started
    await Promise.resolve()
    expect(done).toBe(false)
    box.finish?.()
    await waiting
    expect(done).toBe(true)
    vi.unstubAllGlobals()
  })

  it('unlock помечает менеджер разблокированным', async () => {
    class FakeCtx {
      state = 'running'
      createBuffer() {
        return {}
      }
      createBufferSource() {
        return {
          buffer: null as unknown,
          connect: vi.fn(),
          start: vi.fn(),
        }
      }
      get destination() {
        return {}
      }
      resume = vi.fn(async () => undefined)
    }
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function AudioContext() {
        return new FakeCtx()
      }),
    )
    const audio = createAudioManager()
    await audio.unlock()
    expect(audio.isUnlocked()).toBe(true)
    vi.unstubAllGlobals()
  })
})
