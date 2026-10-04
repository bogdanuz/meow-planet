import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountInstrumentView, unmountInstrumentView } from '../../src/games/sound-world/instrument-view'
import type { AudioManager } from '../../src/shared/audio'

function mockAudio(): AudioManager {
  return {
    unlock: vi.fn().mockResolvedValue(undefined),
    isUnlocked: () => true,
    playBeep: vi.fn(),
    playTone: vi.fn(),
    playUrl: vi.fn().mockResolvedValue(true),
    playUrlSegment: vi.fn().mockResolvedValue(true),
    stopMusic: vi.fn(),
    fadeOutMusic: vi.fn(),
    switchMusic: vi.fn(),
    waitUntilVoiceEnded: vi.fn().mockResolvedValue(undefined),
    stopSfx: vi.fn(),
    stopVoice: vi.fn(),
    allowBrightMotion: () => true,
    updateSettings: vi.fn(),
    preload: vi.fn().mockResolvedValue(undefined),
    duckMusic: vi.fn(),
    restoreMusic: vi.fn(),
  }
}

function urls(): Map<string, string> {
  const m = new Map<string, string>()
  m.set('drum-right', '/sfx/drum-right.mp3')
  m.set('drum-snare', '/sfx/drum-snare.mp3')
  m.set('drum-tom', '/sfx/drum-tom.mp3')
  for (const note of ['do', 're', 'mi', 'fa', 'sol', 'la']) m.set(`piano-${note}`, `/sfx/piano-${note}.mp3`)
  m.set('guitar-1', '/sfx/guitar-1.mp3')
  m.set('maracas', '/sfx/maracas.mp3')
  m.set('bell', '/sfx/bell.mp3')
  return m
}

function pointer(
  target: Element,
  type: string,
  init: { pointerId: number; clientX?: number; clientY?: number; timeStamp?: number },
): void {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: init.pointerId,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    button: 0,
  })
  target.dispatchEvent(event)
}

function segmentCalls(audio: AudioManager): { url: string; start: number; opts: Record<string, unknown> }[] {
  return (audio.playUrlSegment as ReturnType<typeof vi.fn>).mock.calls.map((call) => ({
    url: call[1] as string,
    start: call[2] as number,
    opts: (call[4] ?? {}) as Record<string, unknown>,
  }))
}

describe('mountInstrumentView', () => {
  let stage: HTMLElement

  beforeEach(() => {
    stage = document.createElement('div')
    document.body.replaceChildren(stage)
  })

  it('пианино: два пальца — две ноты одновременно (аккорд), каждая со своим началом', () => {
    const audio = mockAudio()
    const m = urls()
    m.set('piano-si', '/sfx/piano-si.mp3')
    mountInstrumentView(stage, { instrumentId: 'piano', audio, sfxUrls: m })
    const keys = stage.querySelectorAll<HTMLButtonElement>('.sound-world__piano-key')
    const scene = stage.querySelector<HTMLElement>('.sound-world__piano-scene')!
    let target: Element = keys[0]!
    document.elementFromPoint = vi.fn(() => target)

    pointer(scene, 'pointerdown', { pointerId: 1 })
    target = keys[6]!
    pointer(scene, 'pointerdown', { pointerId: 2 })

    const calls = segmentCalls(audio)
    expect(calls.map((c) => c.url)).toEqual(['/sfx/piano-do.mp3', '/sfx/piano-si.mp3'])
    expect(calls.every((c) => c.opts.stopPrevious === false)).toBe(true)
    // В файле «Си» нота начинается через ~1 с тишины — её нужно пропустить.
    expect(calls[1]!.start).toBeGreaterThan(0.9)
  })

  it('пианино: глиссандо каждого пальца отдельно', () => {
    const audio = mockAudio()
    mountInstrumentView(stage, { instrumentId: 'piano', audio, sfxUrls: urls() })
    const keys = stage.querySelectorAll<HTMLButtonElement>('.sound-world__piano-key')
    const scene = stage.querySelector<HTMLElement>('.sound-world__piano-scene')!
    const at = new Map<number, Element>([
      [1, keys[0]!],
      [2, keys[4]!],
    ])
    let current = 1
    document.elementFromPoint = vi.fn(() => at.get(current)!)
    pointer(scene, 'pointerdown', { pointerId: 1 })
    current = 2
    pointer(scene, 'pointerdown', { pointerId: 2 })
    // Палец 1 едет на соседнюю клавишу, палец 2 стоит на месте.
    at.set(1, keys[1]!)
    current = 1
    pointer(scene, 'pointermove', { pointerId: 1 })
    current = 2
    pointer(scene, 'pointermove', { pointerId: 2 })
    expect(audio.playUrlSegment).toHaveBeenCalledTimes(3)
  })

  it('барабан звучит сразу на касание (pointerdown), без ожидания click', () => {
    const audio = mockAudio()
    mountInstrumentView(stage, { instrumentId: 'drum', audio, sfxUrls: urls() })
    const snare = stage.querySelector<HTMLButtonElement>('[data-piece="snare"]')!
    pointer(snare, 'pointerdown', { pointerId: 1 })
    expect(audio.playUrlSegment).toHaveBeenCalledTimes(1)
    snare.click()
    expect(audio.playUrlSegment).toHaveBeenCalledTimes(1)
  })

  it('маракасы: два пальца трясут оба сразу, ведение пальцем шуршит', () => {
    vi.useFakeTimers()
    const audio = mockAudio()
    mountInstrumentView(stage, { instrumentId: 'maracas', audio, sfxUrls: urls() })
    const left = stage.querySelector<HTMLButtonElement>('[data-piece="left"]')!
    const right = stage.querySelector<HTMLButtonElement>('[data-piece="right"]')!
    pointer(left, 'pointerdown', { pointerId: 1, clientX: 10, clientY: 10 })
    pointer(right, 'pointerdown', { pointerId: 2, clientX: 300, clientY: 10 })
    expect(audio.playUrlSegment).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(150)
    pointer(left, 'pointermove', { pointerId: 1, clientX: 60, clientY: 30 })
    expect(audio.playUrlSegment).toHaveBeenCalledTimes(3)
    // Слишком рано для следующего шороха.
    pointer(left, 'pointermove', { pointerId: 1, clientX: 10, clientY: 10 })
    expect(audio.playUrlSegment).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })

  it('колокольчик звучит на pointerdown', () => {
    const audio = mockAudio()
    mountInstrumentView(stage, { instrumentId: 'bell', audio, sfxUrls: urls() })
    pointer(stage.querySelector('.sound-world__bell')!, 'pointerdown', { pointerId: 1 })
    expect(audio.playUrlSegment).toHaveBeenCalledTimes(1)
  })

  it('колокольчик закрыли, пока качается, — он больше не звенит', () => {
    const frames = new Map<number, FrameRequestCallback>()
    let nextId = 1
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.set(nextId, cb)
      return nextId++
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
    try {
      const audio = mockAudio()
      mountInstrumentView(stage, { instrumentId: 'bell', audio, sfxUrls: urls() })
      pointer(stage.querySelector('.sound-world__bell')!, 'pointerdown', { pointerId: 1 })
      unmountInstrumentView(stage)
      expect(stage.querySelector('.sound-world__instrument')).toBeNull()
      for (let t = 1000; t < 6000; t += 16) {
        const due = [...frames.values()]
        frames.clear()
        for (const cb of due) cb(t)
      }
      expect(audio.playUrlSegment).toHaveBeenCalledTimes(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('ксилофон: у каждой пластинки своя высота звука', () => {
    const audio = mockAudio()
    mountInstrumentView(stage, { instrumentId: 'xylophone', audio, sfxUrls: urls() })
    const bars = stage.querySelectorAll<HTMLButtonElement>('.sound-world__xylo-bar')
    pointer(bars[0]!, 'pointerdown', { pointerId: 1 })
    pointer(bars[4]!, 'pointerdown', { pointerId: 2 })
    const rates = segmentCalls(audio).map((c) => c.opts.playbackRate as number)
    expect(rates).toHaveLength(2)
    expect(rates[1]).toBeGreaterThan(rates[0]!)
  })

  it('без заголовка на экране инструмента', () => {
    mountInstrumentView(stage, { instrumentId: 'drum', audio: mockAudio(), sfxUrls: urls() })
    expect(stage.querySelector('.sound-world__instrument-title')).toBeNull()
    expect(stage.textContent).not.toContain('Барабан')
  })

  it('барабаны — три отдельные картинки и свои звуки', () => {
    mountInstrumentView(stage, { instrumentId: 'drum', audio: mockAudio(), sfxUrls: urls() })
    const pads = stage.querySelectorAll<HTMLButtonElement>('.sound-world__drum-pad')
    expect(pads.length).toBe(3)
    expect(stage.querySelector<HTMLButtonElement>('[data-piece="snare"]')?.dataset.sfxId).toBe(
      'drum-snare',
    )
    expect(stage.querySelector<HTMLButtonElement>('[data-piece="kick"]')?.dataset.sfxId).toBe(
      'drum-tom',
    )
    expect(stage.querySelector<HTMLButtonElement>('[data-piece="tom"]')?.dataset.sfxId).toBe(
      'drum-right',
    )
    expect(stage.querySelectorAll('.sound-world__layer-art').length).toBe(3)
    expect(
      Number.parseFloat(stage.querySelector<HTMLButtonElement>('[data-piece="snare"]')?.style.left ?? '1'),
    ).toBe(9)
  })

  it('маракасы — два независимых объекта', () => {
    mountInstrumentView(stage, { instrumentId: 'maracas', audio: mockAudio(), sfxUrls: urls() })
    expect(stage.querySelectorAll('.sound-world__maraca').length).toBe(2)
    expect(stage.querySelector('[data-piece="left"]')).not.toBeNull()
    expect(stage.querySelector('[data-piece="right"]')).not.toBeNull()
  })

  it('пианино — 7 клавиш с нотами', () => {
    mountInstrumentView(stage, { instrumentId: 'piano', audio: mockAudio(), sfxUrls: urls() })
    const keys = stage.querySelectorAll<HTMLButtonElement>('.sound-world__piano-key')
    expect(keys.length).toBe(7)
    expect(stage.querySelectorAll('.sound-world__piano-key-art').length).toBe(7)
    expect(stage.querySelector('.sound-world__piano-lid')).not.toBeNull()
    expect(stage.querySelector('.sound-world__piano-body')).not.toBeNull()
    expect(keys[0]?.dataset.sfxId).toBe('piano-do')
    expect(keys[6]?.dataset.sfxId).toBe('piano-si')
  })

  it('гитара — 6 струн от высокой к низкой', () => {
    mountInstrumentView(stage, { instrumentId: 'guitar', audio: mockAudio(), sfxUrls: urls() })
    const strings = stage.querySelectorAll<HTMLButtonElement>('.sound-world__guitar-string')
    expect(strings.length).toBe(6)
    expect(strings[0]?.dataset.sfxId).toBe('guitar-1')
    expect(strings[5]?.dataset.sfxId).toBe('guitar-6')
    expect(stage.querySelector('.sound-world__instrument')?.getAttribute('data-instrument-id')).toBe(
      'guitar',
    )
  })
})
