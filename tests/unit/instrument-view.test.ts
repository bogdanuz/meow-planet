import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountInstrumentView } from '../../src/games/sound-world/instrument-view'
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
  }
}

function urls(): Map<string, string> {
  const m = new Map<string, string>()
  m.set('drum-right', '/sfx/drum-right.mp3')
  m.set('drum-snare', '/sfx/drum-snare.mp3')
  m.set('drum-tom', '/sfx/drum-tom.mp3')
  m.set('piano-do', '/sfx/piano-do.mp3')
  m.set('guitar-1', '/sfx/guitar-1.mp3')
  m.set('maracas', '/sfx/maracas.mp3')
  m.set('bell', '/sfx/bell.mp3')
  return m
}

describe('mountInstrumentView', () => {
  let stage: HTMLElement

  beforeEach(() => {
    stage = document.createElement('div')
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
