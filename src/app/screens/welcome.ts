import type { RouterController } from '../router-controller'
import type { AudioManager } from '../../shared/audio'
import { playHubMusic, playScreenTransition } from '../../shared/hub-sounds'
import type { AppSettings } from '../../shared/storage'
import { createUiIconImg, uiIconUrl } from '../../shared/ui-icon'

export type WelcomeScreenOptions = {
  audio: AudioManager
  settings: AppSettings
  onSettingsPatch: (patch: Partial<AppSettings>) => void
}

/**
 * Welcome: один фокус — бренд + крупный Play.
 * Без emoji-«персонажа»; слот под WELCOME-hero позже как фон за заголовком.
 */
export function renderWelcomeScreen(
  container: HTMLElement,
  router: RouterController,
  options: WelcomeScreenOptions,
): void {
  const section = document.createElement('section')
  section.className = 'screen screen--welcome'
  section.setAttribute('aria-label', 'Приветствие Планета Мяу и друзья')

  const atmosphere = document.createElement('div')
  atmosphere.className = 'welcome__atmosphere'
  atmosphere.setAttribute('aria-hidden', 'true')
  const bg = document.createElement('img')
  bg.className = 'welcome__bg welcome__bg--drift'
  bg.alt = ''
  bg.src = `${import.meta.env.BASE_URL}assets/shell/welcome-bg.webp`
  atmosphere.append(bg)

  const stage = document.createElement('div')
  stage.className = 'welcome__stage'

  const title = document.createElement('img')
  title.className = 'welcome__title welcome__title--breathe'
  title.alt = 'Планета Мяу и друзья'
  title.src = `${import.meta.env.BASE_URL}assets/shell/welcome-title.png`

  const titleWrap = document.createElement('h1')
  titleWrap.className = 'welcome__title-wrap'
  titleWrap.append(title)

  const cta = document.createElement('div')
  cta.className = 'welcome__cta'

  const playBtn = document.createElement('button')
  playBtn.type = 'button'
  playBtn.className = 'welcome__play'
  playBtn.setAttribute('aria-label', 'Играть')

  const playArt = document.createElement('img')
  playArt.className = 'welcome__play-art'
  playArt.alt = ''
  playArt.src = `${import.meta.env.BASE_URL}assets/shell/welcome-play.png`
  const playShine = document.createElement('span')
  playShine.className = 'welcome__play-shine'
  playShine.setAttribute('aria-hidden', 'true')
  playBtn.append(playArt, playShine)

  const meowSlot = document.createElement('div')
  meowSlot.className = 'welcome__meow-slot'
  const meowMover = document.createElement('div')
  meowMover.className = 'welcome__meow-mover'
  const meow = document.createElement('img')
  meow.className = 'welcome__meow welcome__olli-open'
  meow.alt = ''
  meow.src = `${import.meta.env.BASE_URL}assets/shell/welcome-olli-open.png`
  const blink = document.createElement('img')
  blink.className = 'welcome__meow welcome__olli-closed'
  blink.alt = ''
  blink.setAttribute('aria-hidden', 'true')
  blink.src = `${import.meta.env.BASE_URL}assets/shell/welcome-olli-closed.png`
  const meowShadow = document.createElement('span')
  meowShadow.className = 'welcome__meow-shadow'
  meowShadow.setAttribute('aria-hidden', 'true')
  meowMover.append(meow, blink)
  cta.append(playBtn)
  meowSlot.append(meowShadow, meowMover, cta)

  stage.append(meowSlot, titleWrap)

  const dock = document.createElement('div')
  dock.className = 'welcome__dock'
  dock.setAttribute('aria-label', 'Звук и настройки')

  const soundBtn = document.createElement('button')
  soundBtn.type = 'button'
  soundBtn.className = 'welcome__dock-btn welcome__dock-btn--sound'
  soundBtn.append(createUiIconImg('sound-on', { decorative: true }))

  const syncSound = (): void => {
    const on = options.settings.soundEnabled || options.settings.musicEnabled
    soundBtn.dataset.on = on ? '1' : '0'
    soundBtn.setAttribute('aria-label', on ? 'Звук включён' : 'Звук выключен')
    const icon = soundBtn.querySelector<HTMLImageElement>('img.ui-icon')
    if (icon) icon.src = uiIconUrl(on ? 'sound-on' : 'sound-off')
  }
  syncSound()

  const parentBtn = document.createElement('button')
  parentBtn.type = 'button'
  parentBtn.className = 'welcome__dock-btn welcome__dock-btn--parent'
  parentBtn.setAttribute('aria-label', 'Настройки')
  parentBtn.append(createUiIconImg('settings', { decorative: true }))

  dock.append(soundBtn, parentBtn)

  let leaving = false
  const goMenu = (): void => {
    if (leaving) return
    leaving = true
    section.classList.add('screen--welcome-leave')
    playScreenTransition(options.audio)
    void options.audio.unlock()
    if (options.settings.soundEnabled || options.settings.musicEnabled) {
      playHubMusic(options.audio)
    }
    window.setTimeout(() => {
      router.navigate({ screen: 'menu' })
    }, 420)
  }

  playBtn.addEventListener('click', goMenu)

  soundBtn.addEventListener('click', () => {
    void options.audio.unlock()
    const next = !(options.settings.soundEnabled || options.settings.musicEnabled)
    options.onSettingsPatch({ soundEnabled: next, musicEnabled: next })
    options.settings.soundEnabled = next
    options.settings.musicEnabled = next
    syncSound()
    if (next) playHubMusic(options.audio)
    else options.audio.fadeOutMusic()
  })

  parentBtn.addEventListener('click', () => {
    router.navigate({ screen: 'parent' })
  })

  section.append(atmosphere, stage, dock)
  container.replaceChildren(section)
}
