import { describe, expect, it, vi } from 'vitest'
import { backgroundAudioManagersForTests, createAudioManager } from '../../src/shared/audio'
import { resetAudioEngineForTests } from '../../src/shared/audio-engine'

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
        this.currentTime = this.duration
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

  it('ended предыдущей фразы не заканчивает новую', async () => {
    class FakeVoice {
      paused = true
      ended = false
      volume = 1
      src = ''
      currentTime = 0.4
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
      play = vi.fn(async () => {
        this.paused = false
      })
      pause = vi.fn(() => {
        this.paused = true
        // iPad шлёт ended, когда предыдущий голос обрывают новой фразой.
        this.onended?.()
      })
      load = vi.fn()
      removeAttribute = vi.fn()
      finish() {
        this.ended = true
        this.paused = true
        this.currentTime = this.duration
        this.onended?.()
        this.listeners.get('ended')?.forEach((fn) => fn())
      }
    }
    const voices: FakeVoice[] = []
    vi.stubGlobal(
      'Audio',
      vi.fn(function Audio() {
        const voice = new FakeVoice()
        voices.push(voice)
        return voice
      }),
    )
    const audio = createAudioManager({
      soundEnabled: true,
      musicEnabled: false,
      quietMode: false,
    })
    await audio.unlock()
    await audio.playUrl('voice', 'praise.mp3')
    await audio.playUrl('voice', 'next-task.mp3')
    const waiting = audio.waitUntilVoiceEnded()
    let done = false
    void waiting.then(() => {
      done = true
    })
    await Promise.resolve()
    expect(done).toBe(false)
    voices[1]?.finish()
    await waiting
    expect(done).toBe(true)
    vi.unstubAllGlobals()
  })

  it('ранний ended не открывает следующую фразу, пока клип не доиграл', async () => {
    vi.useFakeTimers()
    class FakeVoice {
      paused = true
      ended = false
      volume = 1
      src = ''
      currentTime = 0.2
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
      play = vi.fn(async () => {
        this.paused = false
      })
      pause = vi.fn()
      load = vi.fn()
      removeAttribute = vi.fn()
      fireEnded() {
        this.ended = true
        this.onended?.()
        this.listeners.get('ended')?.forEach((fn) => fn())
      }
    }
    const voices: FakeVoice[] = []
    vi.stubGlobal(
      'Audio',
      vi.fn(function Audio() {
        const voice = new FakeVoice()
        voices.push(voice)
        return voice
      }),
    )
    const audio = createAudioManager({
      soundEnabled: true,
      musicEnabled: false,
      quietMode: false,
    })
    await audio.unlock()
    await audio.playUrl('voice', 'praise.mp3')
    const waiting = audio.waitUntilVoiceEnded()
    let done = false
    void waiting.then(() => {
      done = true
    })
    voices[0]?.fireEnded()
    await Promise.resolve()
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1900)
    await waiting
    expect(done).toBe(true)
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('blur видимой страницы не обрывает текущую фразу', async () => {
    class FakeVoice {
      paused = true
      ended = false
      volume = 1
      src = ''
      currentTime = 0.2
      readyState = 4
      duration = 2
      onended: (() => void) | null = null
      addEventListener = vi.fn()
      removeEventListener = vi.fn()
      play = vi.fn(async () => {
        this.paused = false
      })
      pause = vi.fn(() => {
        this.paused = true
      })
      load = vi.fn()
      removeAttribute = vi.fn()
    }
    vi.stubGlobal(
      'Audio',
      vi.fn(function Audio() {
        return new FakeVoice()
      }),
    )
    const audio = createAudioManager({
      soundEnabled: true,
      musicEnabled: false,
      quietMode: false,
    })
    await audio.unlock()
    await audio.playUrl('voice', 'praise.mp3')
    window.dispatchEvent(new Event('blur'))
    const waiting = audio.waitUntilVoiceEnded()
    let done = false
    void waiting.then(() => {
      done = true
    })
    await Promise.resolve()
    expect(done).toBe(false)
    expect(document.hidden).toBe(false)
    vi.unstubAllGlobals()
  })

  it('duckMusic из игры уводит в тишину музыку оболочки, restoreMusic возвращает', async () => {
    const tracks: { volume: number; paused: boolean }[] = []
    vi.stubGlobal(
      'Audio',
      vi.fn(function Audio(url?: string) {
        const track = {
          src: url ? new URL(url, window.location.href).href : '',
          paused: true,
          volume: 1,
          loop: false,
          play: vi.fn(async () => {
            track.paused = false
          }),
          pause: vi.fn(),
        }
        tracks.push(track)
        return track
      }),
    )
    const shellAudio = createAudioManager({ soundEnabled: true, musicEnabled: true, quietMode: false })
    const gameAudio = createAudioManager({ soundEnabled: true, musicEnabled: true, quietMode: false })
    await shellAudio.switchMusic('game-music.mp3', 0.3, { fadeInMs: 0, fadeOutMs: 0 })
    expect(tracks[0]?.volume).toBeCloseTo(0.3)

    gameAudio.duckMusic(0)
    await vi.waitFor(() => expect(tracks[0]?.volume).toBe(0))
    expect(tracks[0]?.paused).toBe(false)

    gameAudio.restoreMusic(0)
    await vi.waitFor(() => expect(tracks[0]?.volume).toBeCloseTo(0.3))
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

describe('голос на iPad', () => {
  it('фраза идёт через Web Audio, а не через новый <audio>: на iPad он без касания молчит', async () => {
    resetAudioEngineForTests()
    const sources: { onended: (() => void) | null; start: ReturnType<typeof vi.fn> }[] = []
    const param = () => ({
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    })
    class FakeCtx {
      state = 'running'
      currentTime = 0
      destination = {}
      resume = vi.fn(async () => undefined)
      createBuffer() {
        return {}
      }
      createBufferSource() {
        const source = {
          buffer: null as unknown,
          onended: null as (() => void) | null,
          playbackRate: param(),
          connect: vi.fn(),
          disconnect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }
        sources.push(source)
        return source
      }
      createGain() {
        return { gain: param(), connect: vi.fn(), disconnect: vi.fn() }
      }
      decodeAudioData = vi.fn(async () => ({ duration: 1.2 }))
    }
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function AudioContext() {
        return new FakeCtx()
      }),
    )
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
    const audioCtor = vi.fn()
    vi.stubGlobal('Audio', audioCtor)
    const audio = createAudioManager()
    expect(await audio.playUrl('voice', '/voice/hello.mp3')).toBe(true)
    expect(audioCtor).not.toHaveBeenCalled()
    const voice = sources.at(-1)!
    expect(voice.start).toHaveBeenCalled()
    let ended = false
    void audio.waitUntilVoiceEnded().then(() => (ended = true))
    await Promise.resolve()
    expect(ended).toBe(false)
    voice.onended?.()
    await vi.waitFor(() => expect(ended).toBe(true))
    vi.unstubAllGlobals()
    resetAudioEngineForTests()
  })
})

describe('audio manager dispose', () => {
  it('ушедшая игра отписывает свой менеджер от фоновых событий', () => {
    const before = backgroundAudioManagersForTests()
    const audio = createAudioManager()
    expect(backgroundAudioManagersForTests()).toBe(before + 1)
    audio.dispose?.()
    expect(backgroundAudioManagersForTests()).toBe(before)
  })
})
