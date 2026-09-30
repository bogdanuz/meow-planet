import { getGameById } from '../games/registry'
import { createAudioManager } from '../shared/audio'
import {
  gameUsesSharedMusic,
  playGameMusic,
  playHubMusic,
  playScreenTransition,
  preloadHubMusic,
  preloadScreenTransition,
} from '../shared/hub-sounds'
import { loadSettings, saveSettings, type AppSettings } from '../shared/storage'
import { createRouter } from './router-controller'
import type { Route } from './router'
import { APP_VERSION } from './version'
import { mountOrientationGate } from './orientation-gate'
import { mountSmallViewportGate } from './small-viewport-gate'
import { renderGameScreen, type ActiveGameHandle } from './screens/game'
import { renderMenuScreen } from './screens/menu'
import { renderNotFoundScreen } from './screens/not-found'
import { renderParentScreen } from './screens/parent'
import { renderWelcomeScreen } from './screens/welcome'
import { isGameReleased } from '../content/released-games'
import { createMascotPlaceholder, setMascotPose } from '../mascot'
import {
  renderGameTaskVisualCue,
  type GameTaskVisual,
} from '../shared/game-task-visual'
import { createUiIconImg } from '../shared/ui-icon'

function titleForRoute(route: Route): string {
  switch (route.screen) {
    case 'welcome':
    case 'menu':
      return 'Планета Мяу и друзья'
    case 'game': {
      const game = getGameById(route.gameId)
      return game?.meta.title ?? 'Игра'
    }
    case 'parent':
      return 'Настройки'
    case 'not-found':
      return 'Не найдено'
  }
}

function hintForRoute(route: Route): string {
  switch (route.screen) {
    case 'welcome':
      return ''
    case 'menu':
      return ''
    case 'game':
      return route.gameId === 'sound-world' ||
        route.gameId === 'sort-colors' ||
        route.gameId === 'puzzle' ||
        route.gameId === 'drawing'
        ? ''
        : 'Играй спокойно. Ошибки не страшны.'
    case 'parent':
      return ''
    case 'not-found':
      return 'Давай вернёмся в меню.'
  }
}

function poseForRoute(route: Route): 'idle' | 'happy' | 'pointing' | 'sleepy' {
  switch (route.screen) {
    case 'welcome':
      return 'happy'
    case 'menu':
      return 'pointing'
    case 'game':
      return 'happy'
    case 'parent':
      return 'idle'
    case 'not-found':
      return 'sleepy'
  }
}

function goBackSemantic(route: Route, router: ReturnType<typeof createRouter>): void {
  if (route.screen === 'menu') {
    router.navigate({ screen: 'welcome' })
    return
  }
  if (
    route.screen === 'game' ||
    route.screen === 'parent' ||
    route.screen === 'not-found'
  ) {
    router.goHome()
    return
  }
  // welcome — некуда назад внутри приложения
}

/**
 * Оболочка хаба: chrome + welcome / меню плиток / игра / родительский центр.
 */
export function renderShell(root: HTMLElement): () => void {
  const router = createRouter()
  let settings: AppSettings = loadSettings()
  const audio = createAudioManager(settings)
  let activeGame: ActiveGameHandle | null = null
  let disposeParent: (() => void) | null = null
  let bootedWelcome = false
  preloadScreenTransition()
  preloadHubMusic()

  root.replaceChildren()
  root.className = 'app-shell'
  root.classList.toggle('app-shell--quiet', settings.quietMode)

  const unlockOnce = (): void => {
    window.removeEventListener('pointerdown', unlockOnce)
    const route = router.getRoute()
    const musicOn = settings.musicEnabled
    void audio.unlock()
    if (musicOn && (route.screen === 'welcome' || route.screen === 'menu')) {
      playHubMusic(audio)
    }
  }
  window.addEventListener('pointerdown', unlockOnce, { once: true, capture: true })

  const chrome = document.createElement('header')
  chrome.className = 'chrome'
  chrome.setAttribute('role', 'banner')

  const nav = document.createElement('div')
  nav.className = 'chrome__nav'

  const backBtn = document.createElement('button')
  backBtn.type = 'button'
  backBtn.className = 'touch-btn touch-btn--icon'
  backBtn.setAttribute('aria-label', 'Назад')
  backBtn.append(createUiIconImg('back', { decorative: true }))
  backBtn.addEventListener('click', () => {
    playScreenTransition(audio)
    goBackSemantic(router.getRoute(), router)
  })

  const homeBtn = document.createElement('button')
  homeBtn.type = 'button'
  homeBtn.className = 'touch-btn touch-btn--icon'
  homeBtn.setAttribute('aria-label', 'Домой')
  homeBtn.append(createUiIconImg('home', { decorative: true }))
  homeBtn.addEventListener('click', () => {
    playScreenTransition(audio)
    router.goHome()
  })

  nav.append(backBtn, homeBtn)

  const title = document.createElement('h1')
  title.className = 'chrome__title'
  title.textContent = 'Планета Мяу и друзья'

  const gameActions = document.createElement('div')
  gameActions.className = 'chrome__game-actions'
  gameActions.hidden = true

  const sceneLabel = document.createElement('span')
  sceneLabel.className = 'chrome__scene-label screen__lead--adult'
  sceneLabel.hidden = true

  chrome.append(nav, title, sceneLabel, gameActions)

  const mascotRow = document.createElement('div')
  mascotRow.className = 'chrome__mascot'
  const mascot = createMascotPlaceholder('idle')
  const hint = document.createElement('p')
  hint.className = 'chrome__hint'
  hint.setAttribute('aria-live', 'polite')
  hint.textContent = ''

  const taskCue = document.createElement('div')
  taskCue.className = 'chrome__task-cue'
  taskCue.hidden = true

  mascotRow.append(mascot, taskCue, hint)

  const main = document.createElement('main')
  main.className = 'chrome__main'
  main.setAttribute('role', 'main')

  root.append(chrome, mascotRow, main)

  const stopSmallGate = mountSmallViewportGate(document.body)
  const stopOrientation = mountOrientationGate(document.body)

  function setSoftHint(message: string): void {
    hint.textContent = message
  }

  function setChromeSceneLabel(label: string): void {
    sceneLabel.textContent = label
    sceneLabel.hidden = !label.trim()
  }

  function setTaskVisual(cue: GameTaskVisual | null): void {
    taskCue.replaceChildren()
    if (!cue) {
      taskCue.hidden = true
      return
    }
    taskCue.hidden = false
    taskCue.append(renderGameTaskVisualCue(cue))
  }

  function applySettings(next: AppSettings): void {
    settings = next
    saveSettings(next)
    audio.updateSettings(next)
    root.classList.toggle('app-shell--quiet', next.quietMode)
  }

  function patchSettings(patch: Partial<AppSettings>): void {
    applySettings({ ...settings, ...patch })
  }

  function unmountActiveGame(): void {
    if (activeGame) {
      activeGame.unmount()
      activeGame = null
    }
  }

  function unmountParent(): void {
    disposeParent?.()
    disposeParent = null
  }

  function renderRoute(route: Route): void {
    unmountActiveGame()
    unmountParent()

    settings = loadSettings()
    audio.updateSettings(settings)
    root.classList.toggle('app-shell--quiet', settings.quietMode)

    title.textContent = titleForRoute(route)
    hint.textContent = hintForRoute(route)
    setTaskVisual(null)
    setChromeSceneLabel('')
    setMascotPose(mascot, poseForRoute(route))

    const onWelcome = route.screen === 'welcome'
    const onMenu = route.screen === 'menu'
    const onParent = route.screen === 'parent'
    const onComingSoon =
      route.screen === 'game' && !isGameReleased(route.gameId)
    if (onWelcome || onMenu || onParent || onComingSoon) playHubMusic(audio)
    else if (route.screen === 'game' && gameUsesSharedMusic(route.gameId))
      playGameMusic(audio, route.gameId)
    else audio.fadeOutMusic(280)
    const onBalloonGame =
      route.screen === 'game' && route.gameId === 'balloon-pop'
    const onSoundWorldGame =
      route.screen === 'game' && route.gameId === 'sound-world'
    const onReleasedGame = route.screen === 'game' && isGameReleased(route.gameId)
    const onSortColorsGame =
      onReleasedGame && route.gameId === 'sort-colors'
    const onPuzzleGame = onReleasedGame && route.gameId === 'puzzle'
    const onShapeBuildGame =
      onReleasedGame && route.gameId === 'shape-build'
    const onHideSeekGame =
      onReleasedGame && route.gameId === 'hide-seek'
    const onMeowHomeGame =
      onReleasedGame && route.gameId === 'meow-home'
    const onCountingGame =
      onReleasedGame && route.gameId === 'counting'
    const onDrawingGame =
      onReleasedGame && route.gameId === 'drawing'
    // Welcome, меню, настройки, готовые игры со своей полоской и заглушка — без app chrome.
    chrome.hidden =
      onWelcome ||
      onMenu ||
      onParent ||
      onComingSoon ||
      onBalloonGame ||
      onSoundWorldGame ||
      onDrawingGame
    mascotRow.hidden =
      onWelcome ||
      onMenu ||
      onParent ||
      onComingSoon ||
      onBalloonGame ||
      onSoundWorldGame ||
      onSortColorsGame ||
      onPuzzleGame ||
      onShapeBuildGame ||
      onHideSeekGame ||
      onDrawingGame
    root.classList.toggle('app-shell--balloon-game', onBalloonGame)
    root.classList.toggle('app-shell--sound-world', onSoundWorldGame)
    root.classList.toggle('app-shell--sort-colors', onSortColorsGame)
    root.classList.toggle('app-shell--puzzle', onPuzzleGame)
    root.classList.toggle('app-shell--shape-build', onShapeBuildGame)
    root.classList.toggle('app-shell--hide-seek', onHideSeekGame)
    root.classList.toggle('app-shell--meow-home', onMeowHomeGame)
    root.classList.toggle('app-shell--counting', onCountingGame)
    root.classList.toggle('app-shell--drawing', onDrawingGame)
    root.classList.toggle('app-shell--parent', onParent)
    root.classList.toggle('app-shell--coming-soon', onComingSoon)
    gameActions.hidden = !onPuzzleGame
    if (!onPuzzleGame) gameActions.replaceChildren()
    backBtn.hidden = onWelcome || onMenu
    homeBtn.hidden = onWelcome || onMenu
    title.hidden = onMenu
    backBtn.classList.remove('touch-btn--back-float')
    root.classList.toggle('app-shell--welcome', onWelcome)
    root.classList.toggle('app-shell--menu', onMenu)

    switch (route.screen) {
      case 'welcome':
        renderWelcomeScreen(main, router, {
          audio,
          settings,
          onSettingsPatch: patchSettings,
        })
        break
      case 'menu':
        renderMenuScreen(main, router, {
          onTransition: () => playScreenTransition(audio),
          onEnterGame: (gameId) => {
            if (!settings.musicEnabled) return
            if (isGameReleased(gameId)) playGameMusic(audio, gameId)
            else playHubMusic(audio)
          },
          soundOn: settings.soundEnabled || settings.musicEnabled,
          onSoundToggle: (on) => {
            patchSettings({ soundEnabled: on, musicEnabled: on })
            if (on) playHubMusic(audio)
            else audio.fadeOutMusic()
          },
        })
        break
      case 'game': {
        const gameId = route.gameId
        activeGame = renderGameScreen(
          main,
          gameId,
          setSoftHint,
          setTaskVisual,
          {
            goMenu: () => router.goHome(),
            goWelcome: () => router.navigate({ screen: 'welcome' }),
            goSettings: () => router.navigate({ screen: 'parent', returnTo: gameId }),
            onSoundToggle: (on) => {
              patchSettings({ soundEnabled: on, musicEnabled: on })
              const current = router.getRoute()
              if (on && current.screen === 'game' && gameUsesSharedMusic(current.gameId)) {
                playGameMusic(audio, current.gameId)
              } else if (!on) {
                audio.fadeOutMusic()
              }
            },
          },
          onPuzzleGame ? gameActions : undefined,
          onHideSeekGame ? setChromeSceneLabel : undefined,
        )
        break
      }
      case 'parent':
        disposeParent = renderParentScreen(main, router, {
          audio,
          appVersion: APP_VERSION,
          onSettingsSaved: applySettings,
          returnTo: route.returnTo,
        })
        break
      case 'not-found':
        renderNotFoundScreen(main, router)
        break
    }
  }

  const stop = router.start((route) => {
    if (
      !bootedWelcome &&
      route.screen === 'menu' &&
      (window.location.hash === '#/' || window.location.hash === '')
    ) {
      bootedWelcome = true
      router.navigate({ screen: 'welcome' }, { replace: true })
      return
    }
    if (route.screen !== 'menu') {
      bootedWelcome = true
    }
    renderRoute(route)
  })

  return () => {
    window.removeEventListener('pointerdown', unlockOnce)
    stopSmallGate()
    stopOrientation()
    unmountActiveGame()
    unmountParent()
    audio.stopMusic()
    stop()
  }
}
