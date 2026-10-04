import { GAMES, MENU_TILE_IDS, type GameId } from '../../content/catalog'
import type { RouterController } from '../router-controller'
import { createVisualTile } from '../tile'
import {
  bindMenuMeowPet,
  bindMenuOlliPet,
  menuCardPngUrl,
  menuMeowDanceFrameUrl,
  menuOlliBlinkUrl,
  menuOlliDanceFrameUrl,
  OLLI_IDLE_FRAME,
  menuVisitBedPngUrl,
  menuVisitTreePngUrl,
} from '../menu-cards'
import { fitMenuToast, menuToastHeight, menuVisitScale } from '../menu-toast-fit'
import { loadSettings } from '../../shared/storage'
import { createUiIconImg, uiIconUrl } from '../../shared/ui-icon'
import { addSoftShadow, type SoftShadow } from '../../shared/soft-shadow'

export { MENU_TILE_IDS }

/** Тени плиток и лежанки — картинками (shared/soft-shadow.ts); нажатие меняет слой прозрачностью. */
const TILE_SHADOW: readonly SoftShadow[] = [
  { x: 0, y: 5, blur: 4, color: 'rgb(55 45 35 / 22%)' },
  { x: 0, y: 1, blur: 0, color: 'rgb(255 255 255 / 35%)' },
]
const TILE_PRESSED_SHADOW: SoftShadow = { x: 0, y: 2, blur: 2, color: 'rgb(55 45 35 / 18%)' }
const BED_SHADOW: SoftShadow = { x: 0, y: 6, blur: 5, color: 'rgb(55 45 35 / 20%)' }
const BED_PRESSED_SHADOW: SoftShadow = { x: 0, y: 2, blur: 3, color: 'rgb(55 45 35 / 16%)' }

function addPressShadows(art: HTMLImageElement, rest: readonly SoftShadow[], pressed: SoftShadow): void {
  addSoftShadow(art, rest, 'press-shadow press-shadow--rest')
  addSoftShadow(art, [pressed], 'press-shadow press-shadow--pressed')
}

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
  addPressShadows(art, TILE_SHADOW, TILE_PRESSED_SHADOW)
}

/**
 * Меню: 10 плиток 2×N (скролл) + «В гости» у Мяу. Назад и свайп → welcome.
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
  section.dataset.companion = loadSettings().companion === 'olli' ? 'olli' : 'meow'
  section.setAttribute('aria-label', 'Меню игр')

  const bg = document.createElement('img')
  bg.className = 'menu-bg'
  bg.alt = ''
  const owlMenu = section.dataset.companion === 'olli'
  bg.src = `${import.meta.env.BASE_URL}assets/shell/${owlMenu ? 'welcome-bg.webp' : 'menu-bg.webp'}`
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
        if (router.getRoute().screen === 'menu') router.navigate({ screen: 'game', gameId: game.id })
      }, 460)
    })
    attachMenuCardArt(btn, id)
    bindArtTilePress(btn, () => leaving)
    grid.append(btn)
  }

  scroll.append(grid)
  left.append(scroll)

  const owl = section.dataset.companion === 'olli'
  const presenter = document.createElement('aside')
  presenter.className = 'menu-presenter'
  presenter.setAttribute('aria-label', owl ? 'Сова' : 'Мяу')

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
    visitArt.src = owl ? menuVisitTreePngUrl() : menuVisitBedPngUrl()
    visitBtn.append(visitArt)
    addPressShadows(visitArt, [BED_SHADOW], BED_PRESSED_SHADOW)

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
    meow.src = owl ? menuOlliDanceFrameUrl(OLLI_IDLE_FRAME) : menuMeowDanceFrameUrl(1)
    const toast = document.createElement('span')
    toast.className = 'menu-visit-bed__toast'
    toast.textContent = 'Погладь меня'
    anchor.append(toast, shadow, meow)
    if (owl) {
      const blink = document.createElement('img')
      blink.className = 'menu-visit-bed__blink'
      blink.alt = ''
      blink.setAttribute('aria-hidden', 'true')
      blink.src = menuOlliBlinkUrl()
      anchor.append(blink)
    }
    catLayer.append(anchor)

    const stack = document.createElement('div')
    stack.className = 'menu-visit-stack'
    stack.append(visitBtn, catLayer)
    visitStack = stack
    startPet = () => (owl ? bindMenuOlliPet(meow, toast) : bindMenuMeowPet(meow, toast))
    bindArtTilePress(visitBtn, () => leaving)
    visitBtn.addEventListener('click', () => {
      if (leaving) return
      leaving = true
      visitBtn!.classList.add('is-pressed')
      section.classList.add('screen--menu-leave')
      options?.onTransition?.()
      options?.onEnterGame?.('meow-home')
      window.setTimeout(() => {
        if (router.getRoute().screen === 'menu') router.navigate({ screen: 'game', gameId: 'meow-home' })
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

  const anchor = section.querySelector<HTMLElement>('.menu-visit-cat__anchor')
  const toast = section.querySelector<HTMLElement>('.menu-visit-bed__toast')
  if (anchor && toast && visitStack) {
    const stack = visitStack
    const setToast = (fit: { fontPx: number; gapPx: number }): void => {
      toast.style.setProperty('--toast-font', `${fit.fontPx}px`)
      toast.style.setProperty('--toast-gap', `${fit.gapPx}px`)
    }
    // Кнопки звука и настроек мешают, только если стоят над облачком по горизонтали.
    const fitToast = (): void => {
      stack.style.removeProperty('--visit-scale')
      let char = anchor.getBoundingClientRect()
      if (char.width < 10) return
      const ideal = fitMenuToast({ charWidth: char.width, spaceAbove: Number.POSITIVE_INFINITY })
      setToast(ideal)
      const t = toast.getBoundingClientRect()
      const ceiling = Math.max(
        presenter.getBoundingClientRect().top,
        ...[soundBtn, parentBtn]
          .map((b) => b.getBoundingClientRect())
          .filter((b) => b.right + 6 > t.left && b.left - 6 < t.right)
          .map((b) => b.bottom),
      )
      const scale = menuVisitScale({
        figureTop: char.top,
        figureBottom: stack.getBoundingClientRect().bottom,
        ceiling,
        need: menuToastHeight(ideal.fontPx) + 2 * ideal.gapPx,
      })
      if (scale < 1) {
        stack.style.setProperty('--visit-scale', String(scale))
        char = anchor.getBoundingClientRect()
      }
      setToast(fitMenuToast({ charWidth: char.width, spaceAbove: char.top - ceiling }))
    }
    fitToast()
    window.requestAnimationFrame(fitToast)
    // Пока меню «въезжает» (scale), размеры искажены — финальная подгонка после анимации.
    section.addEventListener('animationend', (event) => {
      if (event.target === section) fitToast()
    })
    section.querySelector('.menu-visit-bed__meow')?.addEventListener('load', fitToast)
    section.querySelector('.menu-visit-bed__art')?.addEventListener('load', fitToast)
    void document.fonts?.ready.then(fitToast)
    if (typeof ResizeObserver === 'function') {
      const watch = new ResizeObserver(fitToast)
      for (const el of [section, stack, anchor, toast]) watch.observe(el)
    }
  }
}
