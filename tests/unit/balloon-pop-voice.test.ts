import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GameMountContext } from '../../src/shared/game-module'

const audioMock = vi.hoisted(() => {
  let currentVoiceResolve: (() => void) | null = null
  let currentVoice = Promise.resolve()

  const playUrl = vi.fn(async (channel: string, _url?: string) => {
    if (channel === 'voice') {
      currentVoiceResolve?.()
      currentVoice = new Promise<void>((resolve) => {
        currentVoiceResolve = resolve
      })
    }
    return true
  })

  const waitUntilVoiceEnded = vi.fn(() => currentVoice)
  const createAudioManager = vi.fn(() => ({
    unlock: vi.fn(async () => undefined),
    isUnlocked: vi.fn(() => true),
    playBeep: vi.fn(async () => undefined),
    playTone: vi.fn(async () => undefined),
    playUrl,
    playUrlSegment: vi.fn(async (channel: string, url: string) => {
      if (channel === 'voice') return playUrl(channel, url)
      return true
    }),
    stopMusic: vi.fn(),
    fadeOutMusic: vi.fn(),
    switchMusic: vi.fn(async () => true),
    waitUntilVoiceEnded,
    stopSfx: vi.fn(),
    allowBrightMotion: vi.fn(() => true),
    updateSettings: vi.fn(),
  }))

  return {
    createAudioManager,
    playUrl,
    waitUntilVoiceEnded,
    reset() {
      currentVoiceResolve?.()
      currentVoiceResolve = null
      currentVoice = Promise.resolve()
      playUrl.mockClear()
      waitUntilVoiceEnded.mockClear()
      createAudioManager.mockClear()
    },
  }
})

vi.mock('../../src/shared/audio', () => ({
  createAudioManager: audioMock.createAudioManager,
}))

import { balloonPopGame } from '../../src/games/balloon-pop'

function createContext(): GameMountContext {
  return {
    settings: {
      childName: '',
      soundEnabled: true,
      musicEnabled: false,
      quietMode: false,
      hideEnglishAlphabet: false,
      countingLimit: 3,
      balloonTasksEnabled: true,
    },
    onSoftHint: vi.fn(),
    onTaskVisual: vi.fn(),
    hubNavigation: {
      goMenu: vi.fn(),
      goWelcome: vi.fn(),
    },
    onChromeSceneLabel: vi.fn(),
  }
}

function voiceCallCount(): number {
  return audioMock.playUrl.mock.calls.filter(([channel]) => channel === 'voice').length
}

describe('balloon-pop voice sequencing', () => {
  afterEach(() => {
    balloonPopGame.unmount()
    document.body.innerHTML = ''
    vi.useRealTimers()
    vi.restoreAllMocks()
    audioMock.reset()
  })

  it('не запускает лишнюю voice-фразу при первом входе в free-mode', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const container = document.createElement('div')
    document.body.append(container)
    balloonPopGame.mount(container, createContext())

    audioMock.reset()

    const taskBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Задание — режим с подсказкой Мяу"]',
    )
    expect(taskBtn).not.toBeNull()
    taskBtn!.click()
    audioMock.reset()

    const target = container.querySelector<HTMLButtonElement>('.balloon-pop__balloon[data-color="red"]')
    expect(target).not.toBeNull()
    target!.click()

    await vi.advanceTimersByTimeAsync(420)
    expect(voiceCallCount()).toBe(1)

    const freeBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Свободный режим"]',
    )
    expect(freeBtn).not.toBeNull()
    freeBtn!.click()

    await Promise.resolve()
    expect(voiceCallCount()).toBe(2)
  })
})
