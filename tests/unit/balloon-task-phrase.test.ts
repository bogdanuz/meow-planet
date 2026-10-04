import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GameMountContext } from '../../src/shared/game-module'
import { balloonPopGame } from '../../src/games/balloon-pop'

class FakeVoice {
  paused = true
  ended = false
  volume = 1
  src: string
  currentTime = 0
  readyState = 4
  duration = 2.4
  onended: (() => void) | null = null
  private listeners = new Map<string, Set<() => void>>()

  constructor(url?: string) {
    this.src = url ?? ''
  }

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
    this.onended?.()
  })

  load = vi.fn()
  removeAttribute = vi.fn()

  dispatchEvent(event: Event) {
    if (event.type !== 'ended') return true
    this.listeners.get('ended')?.forEach((fn) => fn())
    return true
  }
}

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
      companion: 'meow' as const,
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

describe('balloon-pop task phrase', () => {
  afterEach(() => {
    balloonPopGame.unmount()
    document.body.innerHTML = ''
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('похвала за задание доигрывает до начала следующего', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    vi.stubGlobal(
      'Audio',
      vi.fn(function Audio(url?: string) {
        return new FakeVoice(url)
      }),
    )

    const container = document.createElement('div')
    document.body.append(container)
    balloonPopGame.mount(container, createContext())
    await vi.advanceTimersByTimeAsync(0)

    container
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Задание — режим с подсказкой Мяу"]',
      )
      ?.click()
    await vi.advanceTimersByTimeAsync(0)

    const target = container.querySelector<HTMLButtonElement>(
      '.balloon-pop__balloon[data-color="red"]',
    )
    expect(target).not.toBeNull()
    target!.click()
    await vi.advanceTimersByTimeAsync(500)

    const speech = container.querySelector('.balloon-pop__speech')
    expect(speech?.textContent).toContain('Всё получилось')

    await vi.advanceTimersByTimeAsync(2400)
    expect(speech?.textContent).not.toContain('Всё получилось')
  })

  it('тап по другому шарику во время похвалы не отменяет следующее задание', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    vi.stubGlobal(
      'Audio',
      vi.fn(function Audio(url?: string) {
        return new FakeVoice(url)
      }),
    )

    const container = document.createElement('div')
    document.body.append(container)
    balloonPopGame.mount(container, createContext())
    await vi.advanceTimersByTimeAsync(0)

    container
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Задание — режим с подсказкой Мяу"]',
      )
      ?.click()
    await vi.advanceTimersByTimeAsync(0)

    container.querySelector<HTMLButtonElement>('.balloon-pop__balloon[data-color="red"]')!.click()
    await vi.advanceTimersByTimeAsync(500)

    const other = container.querySelector<HTMLButtonElement>(
      '.balloon-pop__balloon:not([data-color="red"])',
    )
    expect(other).not.toBeNull()
    other!.click()
    await vi.advanceTimersByTimeAsync(5000)

    expect(other!.isConnected).toBe(false)
  })
})
