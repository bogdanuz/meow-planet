import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../shared/audio', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../shared/audio')>()
  return {
    ...real,
    createAudioManager: (...args: Parameters<typeof real.createAudioManager>) => ({
      ...real.createAudioManager(...args),
      waitUntilVoiceEnded: () => new Promise<void>(() => {}),
    }),
  }
})

const { sortColorsGame } = await import('./index')

describe('sort-colors: звук не отдал конец фразы', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    })
  })

  afterEach(() => {
    sortColorsGame.unmount()
    vi.useRealTimers()
  })

  it('следующее задание всё равно приходит, игра не зависает', async () => {
    const host = document.createElement('div')
    sortColorsGame.mount(host, {
      settings: {
        childName: '',
        soundEnabled: false,
        musicEnabled: false,
        quietMode: false,
        hideEnglishAlphabet: false,
        countingLimit: 10,
        balloonTasksEnabled: true,
        companion: 'olli',
      },
      hubNavigation: { goMenu: vi.fn(), goWelcome: vi.fn(), onSoundToggle: vi.fn() },
    })
    ;[...host.querySelectorAll<HTMLButtonElement>('.sort-colors__mode-btn')][1]!.click()
    const root = host.querySelector<HTMLElement>('.sort-colors')!
    const kind = root.dataset.taskKind!
    const round = root.dataset.round
    host.querySelector<HTMLButtonElement>(`.sort-colors__pile .sort-colors__toy[data-kind="${kind}"]`)!.click()
    host.querySelector<HTMLButtonElement>(`.sort-colors__bin[data-kind="${kind}"]`)!.click()
    await vi.advanceTimersByTimeAsync(3000)
    expect(root.dataset.round).toBe(round)
    await vi.advanceTimersByTimeAsync(5000)
    expect(root.dataset.round).not.toBe(round)
  })
})
