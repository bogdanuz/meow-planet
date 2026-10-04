import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderMenuScreen } from '../../src/app/screens/menu'
import { renderWelcomeScreen } from '../../src/app/screens/welcome'
import type { Route } from '../../src/app/router'
import type { RouterController } from '../../src/app/router-controller'
import type { AudioManager } from '../../src/shared/audio'
import { DEFAULT_SETTINGS } from '../../src/shared/storage'

type TestRouter = RouterController & { navigate: ReturnType<typeof vi.fn>; current: Route }

function makeRouter(current: Route): TestRouter {
  const router = { current, navigate: vi.fn() } as unknown as TestRouter
  router.getRoute = () => router.current
  return router
}

const audio = new Proxy({}, { get: () => () => Promise.resolve() }) as unknown as AudioManager

describe('Переход с экрана по таймеру не срабатывает, если экран уже ушёл', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.replaceChildren()
  })
  afterEach(() => vi.useRealTimers())

  it('меню: тап по плитке, затем сразу «Настройки» — игра не открывается поверх настроек', () => {
    const router = makeRouter({ screen: 'menu' })
    renderMenuScreen(document.body, router)
    document.querySelector<HTMLButtonElement>('[data-game-id="puzzle"]')!.click()
    router.current = { screen: 'parent' }
    document.body.replaceChildren()
    vi.advanceTimersByTime(1000)
    expect(router.navigate).not.toHaveBeenCalledWith({ screen: 'game', gameId: 'puzzle' })
  })

  it('меню: обычный тап по плитке открывает игру', () => {
    const router = makeRouter({ screen: 'menu' })
    renderMenuScreen(document.body, router)
    document.querySelector<HTMLButtonElement>('[data-game-id="puzzle"]')!.click()
    vi.advanceTimersByTime(1000)
    expect(router.navigate).toHaveBeenCalledWith({ screen: 'game', gameId: 'puzzle' })
  })

  it('приветствие: «Играть», затем сразу «Настройки» — меню не открывается поверх', () => {
    const router = makeRouter({ screen: 'welcome' })
    const settings = { ...DEFAULT_SETTINGS, soundEnabled: false, musicEnabled: false }
    renderWelcomeScreen(document.body, router, { audio, settings, onSettingsPatch: () => undefined })
    document.querySelector<HTMLButtonElement>('.welcome__play')!.click()
    router.current = { screen: 'parent' }
    document.body.replaceChildren()
    vi.advanceTimersByTime(1000)
    expect(router.navigate).not.toHaveBeenCalledWith({ screen: 'menu' })
  })
})
