import { GAMES, type GameId } from '../../content/catalog'
import type { RouterController } from '../router-controller'
import { createVisualTile } from '../tile'
import {
  bindMenuMeowPet,
  menuCardPngUrl,
  menuMeowDanceFrameUrl,
  menuVisitBedPngUrl,
} from '../menu-cards'
import { createUiIconImg, uiIconUrl } from '../../shared/ui-icon'

/**
 * Плитки меню: 8 игр по 2 в ряд.
 * «В гостях у Мяу» — отдельная кнопка у персонажа справа (не плитка).
 */
export const MENU_TILE_IDS = [
  'balloon-pop',
  'sound-world',
  'sort-colors',
  'puzzle',
  'shape-build',
  'hide-seek',
  'seasons',
  'counting',
] as const satisfies readonly GameId[]

/** Левый край (px): свайп вправо отсюда → приветствие (P15-03: шире для iPad). */
const SWIPE_EDGE_PX = 88
const SWIPE_MIN_DX = 64
const SWIPE_MAX_DY = 56

/**
 * Жест «назад»: свайп вправо от левого края экрана меню → welcome.
 * Кнопки «Назад» на меню нет.
 */
export function bindMenuSwipeBack(
  el: HTMLElement,
  onBack: () => void,
): () => void {
  let startX = 0
  let startY = 0
  let tracking = false

  const onDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const rect = el.getBoundingClientRect()
    if (e.clientX - rect.left > SWIPE_EDGE_PX) return
    tracking = true
    startX = e.clientX
    startY = e.clientY
  }

  const onUp = (e: PointerEvent): void => {
    if (!tracking) return
    tracking = false
    const dx = e.clientX - startX
    const dy = Math.abs(e.clientY - startY)
    if (dx >= SWIPE_MIN_DX && dy <= SWIPE_MAX_DY) onBack()
  }

  const onCancel = (): void => {
    tracking = false
  }

  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onCancel)
  return () => {
    el.removeEventListener('pointerdown', onDown)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onCancel)
  }
}

/** Визуальное «нажатие» для круглых кнопок меню (touch + мышь). */
export function bindMenuIconPress(btn: HTMLButtonElement): void {
  const press = (): void => btn.classList.add('is-pressed')
  const release = (): void => btn.classList.remove('is-pressed')
  btn.addEventListener('pointerdown', press)
  btn.addEventListener('pointerup', release)
  btn.addEventListener('pointerleave', release)
  btn.addEventListener('pointercancel', release)
}

function bindArtTilePress(btn: HTMLButtonElement, isLeaving: () => boolean): void {
  const press = (): void => btn.classList.add('is-pressed')
  const release = (): void => {
    if (isLeaving()) return
    btn.classList.remove('is-pressed')
  }
  btn.addEventListener('pointerdown', press)
  btn.addEventListener('pointerup', release)
  btn.addEventListener('pointerleave', release)
  btn.addEventListener('pointercancel', release)
}

function attachMenuCardArt(btn: HTMLButtonElement, gameId: string): void {
  const art = document.createElement('img')
  art.className = 'tile-art'
  art.alt = ''
  art.src = menuCardPngUrl(gameId)
  btn.classList.add('game-tile--art')
  btn.prepend(art)
}

/**
 * Меню: 8 плиток 2×N (скролл) + «В гости» у Мяу. Назад и свайп → welcome.
 */
export function renderMenuScreen(
  container: HTMLElement,
  router: RouterController,
  options?: {
    onTransition?: () => void
    /** Музыку игры стартовать в том же жесте, что тап по плитке (не после timeout). */
    onEnterGame?: (gameId: GameId) => void
    soundOn?: boolean
    onSoundToggle?: (on: boolean) => void
  },
): void {
  const section = document.createElement('section')
  section.className = 'screen screen--menu screen--menu-enter'
  section.setAttribute('aria-label', 'Меню игр')

  const bg = document.createElement('img')
  bg.className = 'menu-bg'
  bg.alt = ''
  bg.src = `${import.meta.env.BASE_URL}assets/shell/menu-bg.webp`
  section.append(bg)

  const layout = document.createElement('div')
  layout.className = 'menu-layout'

  const left = document.createElement('div')
  left.className = 'menu-layout__games'

  const scroll = document.createElement('div')
  scroll.className = 'menu-scroll'
  scroll.setAttribute('aria-label', 'Игры')

  const grid = document.createElement('div')
  grid.className = 'menu-grid'

  const byId = new Map(GAMES.map((g) => [g.id, g]))

  let leaving = false
  for (const id of MENU_TILE_IDS) {
    const game = byId.get(id)
    if (!game) continue
    const btn = createVisualTile({
      className: `game-tile game-tile--${game.id}`,
      label: game.title,
      dataset: { gameId: game.id },
    })
    btn.addEventListener('click', () => {
      if (leaving) return
      leaving = true
      btn.classList.add('is-pressed')
      section.classList.add('screen--menu-leave')
      options?.onTransition?.()
      options?.onEnterGame?.(game.id)
      window.setTimeout(() => {
        router.navigate({ screen: 'game', gameId: game.id })
      }, 460)
    })
    attachMenuCardArt(btn, id)
    bindArtTilePress(btn, () => leaving)
    grid.append(btn)
  }

  scroll.append(grid)
  left.append(scroll)

  const presenter = document.createElement('aside')
  presenter.className = 'menu-presenter'
  presenter.setAttribute('aria-label', 'Мяу')

  const visitGame = byId.get('meow-home')
  let visitBtn: HTMLButtonElement | null = null
  let visitStack: HTMLElement | null = null
  let startPet: (() => void) | null = null
  if (visitGame) {
    visitBtn = document.createElement('button')
    visitBtn.type = 'button'
    visitBtn.className = 'menu-visit-bed touch-btn'
    visitBtn.dataset.gameId = 'meow-home'
    visitBtn.setAttribute('aria-label', visitGame.title)
    const visitArt = document.createElement('img')
    visitArt.className = 'menu-visit-bed__art'
    visitArt.alt = ''
    visitArt.src = menuVisitBedPngUrl()
    visitBtn.append(visitArt)

    const catLayer = document.createElement('div')
    catLayer.className = 'menu-visit-cat'
    const anchor = document.createElement('div')
    anchor.className = 'menu-visit-cat__anchor'
    const shadow = document.createElement('span')
    shadow.className = 'menu-visit-bed__shadow'
    shadow.setAttribute('aria-hidden', 'true')
    const meow = document.createElement('img')
    meow.className = 'menu-visit-bed__meow'
    meow.alt = ''
    meow.src = menuMeowDanceFrameUrl(1)
    const toast = document.createElement('span')
    toast.className = 'menu-visit-bed__toast'
    toast.textContent = 'Погладь меня'
    anchor.append(toast, shadow, meow)
    catLayer.append(anchor)

    const stack = document.createElement('div')
    stack.className = 'menu-visit-stack'
    stack.append(visitBtn, catLayer)
    visitStack = stack
    startPet = () => bindMenuMeowPet(meow, toast)
    bindArtTilePress(visitBtn, () => leaving)
    visitBtn.addEventListener('click', () => {
      if (leaving) return
      leaving = true
      visitBtn!.classList.add('is-pressed')
      section.classList.add('screen--menu-leave')
      options?.onTransition?.()
      options?.onEnterGame?.('meow-home')
      window.setTimeout(() => {
        router.navigate({ screen: 'game', gameId: 'meow-home' })
      }, 460)
    })
  }

  if (visitStack) presenter.append(visitStack)

  const backBtn = document.createElement('button')
  backBtn.type = 'button'
  backBtn.className = 'menu-back'
  backBtn.setAttribute('aria-label', 'Назад')
  backBtn.append(createUiIconImg('back', { decorative: true }))
  backBtn.addEventListener('click', () => {
    options?.onTransition?.()
    router.navigate({ screen: 'welcome' })
  })
  bindMenuIconPress(backBtn)

  const soundBtn = document.createElement('button')
  soundBtn.type = 'button'
  soundBtn.className = 'menu-sound'
  soundBtn.append(createUiIconImg('sound-on', { decorative: true }))
  const syncSound = (on: boolean): void => {
    soundBtn.dataset.on = on ? '1' : '0'
    soundBtn.setAttribute('aria-label', on ? 'Звук включён' : 'Звук выключен')
    const icon = soundBtn.querySelector<HTMLImageElement>('img.ui-icon')
    if (icon) icon.src = uiIconUrl(on ? 'sound-on' : 'sound-off')
  }
  syncSound(options?.soundOn !== false)
  soundBtn.addEventListener('click', () => {
    const next = soundBtn.dataset.on !== '1'
    syncSound(next)
    options?.onSoundToggle?.(next)
  })
  bindMenuIconPress(soundBtn)

  const parentBtn = document.createElement('button')
  parentBtn.type = 'button'
  parentBtn.className = 'menu-settings'
  parentBtn.setAttribute('aria-label', 'Настройки')
  parentBtn.append(createUiIconImg('settings', { decorative: true }))
  parentBtn.addEventListener('click', () => {
    router.navigate({ screen: 'parent' })
  })
  bindMenuIconPress(parentBtn)

  layout.append(left, presenter)
  section.append(layout, backBtn, soundBtn, parentBtn)

  bindMenuSwipeBack(section, () => {
    options?.onTransition?.()
    router.navigate({ screen: 'welcome' })
  })

  container.replaceChildren(section)
  startPet?.()
}
