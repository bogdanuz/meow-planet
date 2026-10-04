import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type ParamCall = [string, number, number?]

class FakeParam {
  value = 1
  calls: ParamCall[] = []
  setValueAtTime(v: number, t: number) {
    this.calls.push(['set', v, t])
    this.value = v
  }
  linearRampToValueAtTime(v: number, t: number) {
    this.calls.push(['ramp', v, t])
  }
  cancelScheduledValues(t: number) {
    this.calls.push(['cancel', 0, t])
  }
}

class FakeNode {
  connect = vi.fn()
  disconnect = vi.fn()
}

class FakeGain extends FakeNode {
  gain = new FakeParam()
}

class FakeSource extends FakeNode {
  buffer: unknown = null
  loop = false
  loopStart = 0
  loopEnd = 0
  playbackRate = new FakeParam()
  onended: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
}

class FakeCompressor extends FakeNode {
  threshold = new FakeParam()
  knee = new FakeParam()
  ratio = new FakeParam()
  attack = new FakeParam()
  release = new FakeParam()
}

class FakeCtx {
  static created = 0
  state = 'running'
  currentTime = 10
  destination = new FakeNode()
  gains: FakeGain[] = []
  sources: FakeSource[] = []
  compressors: FakeCompressor[] = []
  constructor() {
    FakeCtx.created += 1
  }
  createGain() {
    const g = new FakeGain()
    this.gains.push(g)
    return g
  }
  createBufferSource() {
    const s = new FakeSource()
    this.sources.push(s)
    return s
  }
  createDynamicsCompressor() {
    const c = new FakeCompressor()
    this.compressors.push(c)
    return c
  }
  decodeAudioData = vi.fn(async () => ({ duration: 2 }))
  resume = vi.fn(async () => undefined)
}

beforeEach(() => {
  FakeCtx.created = 0
  vi.stubGlobal(
    'AudioContext',
    vi.fn(function AudioContext() {
      return new FakeCtx()
    }),
  )
})

afterEach(async () => {
  const engine = await import('../../src/shared/audio-engine')
  engine.resetAudioEngineForTests()
  vi.unstubAllGlobals()
})

describe('audio engine', () => {
  it('один AudioContext на приложение и ограничитель на выходе', async () => {
    const { getAudioMaster } = await import('../../src/shared/audio-engine')
    const a = getAudioMaster()
    const b = getAudioMaster()
    expect(a).not.toBeNull()
    expect(a).toBe(b)
    expect(FakeCtx.created).toBe(1)
    const ctx = a!.ctx as unknown as FakeCtx
    expect(ctx.compressors).toHaveLength(1)
    expect(a!.output).toBe(ctx.compressors[0])
  })

  it('кэширует декодированный звук: файл скачивается и декодируется один раз', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    vi.stubGlobal('fetch', fetchMock)
    const { loadBuffer, getAudioMaster } = await import('../../src/shared/audio-engine')
    const [first, second] = await Promise.all([loadBuffer('/a.mp3'), loadBuffer('/a.mp3')])
    await loadBuffer('/a.mp3')
    expect(first).not.toBeNull()
    expect(first).toBe(second)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect((getAudioMaster()!.ctx as unknown as FakeCtx).decodeAudioData).toHaveBeenCalledTimes(1)
  })

  it('сбой загрузки не кэшируется навсегда', async () => {
    let ok = false
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok, arrayBuffer: async () => new ArrayBuffer(8) })),
    )
    const { loadBuffer } = await import('../../src/shared/audio-engine')
    expect(await loadBuffer('/b.mp3')).toBeNull()
    ok = true
    expect(await loadBuffer('/b.mp3')).not.toBeNull()
  })

  it('каждый звук начинается и заканчивается мягко (без щелчка)', async () => {
    const { getAudioMaster, startBufferVoice } = await import('../../src/shared/audio-engine')
    const master = getAudioMaster()!
    startBufferVoice(master, { duration: 2 } as AudioBuffer, {
      volume: 0.6,
      startSec: 0.465,
      durationSec: 1,
    })
    const ctx = master.ctx as unknown as FakeCtx
    const gain = ctx.gains.at(-1)!
    expect(gain.gain.calls[0]).toEqual(['set', 0, 10])
    expect(gain.gain.calls[1]).toEqual(['ramp', 0.6, 10.005])
    expect(gain.gain.calls.at(-1)).toEqual(['ramp', 0, 11])
    expect(ctx.sources.at(-1)!.start).toHaveBeenCalledWith(10, 0.465, 1)
  })

  it('остановка голоса — короткое затухание, а не обрыв', async () => {
    const { getAudioMaster, startBufferVoice } = await import('../../src/shared/audio-engine')
    const master = getAudioMaster()!
    const voice = startBufferVoice(master, { duration: 2 } as AudioBuffer, { volume: 0.5 })
    const ctx = master.ctx as unknown as FakeCtx
    ctx.currentTime = 10.5
    voice.stop()
    const gain = ctx.gains.at(-1)!
    expect(gain.gain.calls.at(-1)?.[0]).toBe('ramp')
    expect(gain.gain.calls.at(-1)?.[1]).toBe(0)
    const stopAt = ctx.sources.at(-1)!.stop.mock.calls.at(-1)?.[0] as number
    expect(stopAt).toBeGreaterThan(10.5)
  })

  it('лимит голосов: старейший плавно уходит, когда приходит новый', async () => {
    const { createVoicePool } = await import('../../src/shared/audio-engine')
    const pool = createVoicePool(2)
    const stops: string[] = []
    const voice = (id: string) => ({ stop: () => stops.push(id) })
    pool.add(voice('a'))
    pool.add(voice('b'))
    pool.add(voice('c'))
    expect(stops).toEqual(['a'])
    expect(pool.size()).toBe(2)
    pool.stopAll()
    expect(stops).toEqual(['a', 'b', 'c'])
    expect(pool.size()).toBe(0)
  })

  it('затухание музыки: подписчики узнают о duck/restore один раз', async () => {
    const { onMusicDuck, setMusicDucked, isMusicDucked } = await import(
      '../../src/shared/audio-engine'
    )
    const events: [boolean, number][] = []
    const off = onMusicDuck((ducked, ms) => events.push([ducked, ms]))
    setMusicDucked(true, 400)
    setMusicDucked(true, 400)
    expect(isMusicDucked()).toBe(true)
    setMusicDucked(false, 300)
    off()
    setMusicDucked(true)
    expect(events).toEqual([
      [true, 400],
      [false, 300],
    ])
  })
})
