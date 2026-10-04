import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { createUiIconImg, uiIconUrl } from '../../shared/ui-icon'
import { cardArtUrl, letterArtUrl } from './assets'
import { isLettersMainTab, type SoundCatalogItem } from './catalog'
import {
  buildNavigation,
  cardsOnScreen,
  objectPageCount,
  showLetterScriptSwitcher,
  visibleMainTabs,
  type LetterScript,
  type SoundNavigation,
} from './logic'
import { letterGridColumn1Based, letterGridLayout } from './letter-grid-layout'
import { INSTRUMENT_IDS, mountInstrumentView, unmountInstrumentView } from './instrument-view'
import { INSTRUMENT_SFX_IDS } from './instrument-sfx'
import { loadSfxExtensions, loadSfxInventory } from './sfx-inventory'
import { playCatalogSfx } from './sfx'
import { buildKnownSfxUrls } from './sfx-url'
import { shouldTurnAnimalPage } from './page-swipe'
import './sound-world.css'

export const soundWorldGame: GameModule = {
  meta: {
    id: 'sound-world',
    title: 'Изучаем звуки',
    zoneId: 'sound-grove',
    modules: ['2.2', '2.8', '2.14'],
  },

  mount(container, context) {
    unmountInternal()
    const epoch = mountEpoch

    const hideEn = context.settings.hideEnglishAlphabet
    const audio = createAudioManager({
      soundEnabled: context.settings.soundEnabled,
      musicEnabled: context.settings.musicEnabled,
      quietMode: context.settings.quietMode,
    })
    void audio.unlock()

    let sfxReady = new Set<string>()
    let sfxUrls = new Map<string, string>()
    let nav: SoundNavigation = buildNavigation(hideEn, 'animals', 'ru')
    let activeInstrumentId: string | null = null
    let animalPage = 0
    let swipeStartX: number | null = null
    let swipeStartedOnCard = false

    root = document.createElement('section')
    root.className = 'sound-world'
    root.dataset.gameId = 'sound-world'

    const bg = document.createElement('img')
    bg.className = 'sound-world__bg'
    bg.src = `${import.meta.env.BASE_URL}assets/shell/menu-bg.webp`
    bg.alt = ''
    bg.setAttribute('aria-hidden', 'true')

    const gameBar = document.createElement('header')
    gameBar.className = 'sound-world__game-bar'

    const barNav = document.createElement('div')
    barNav.className = 'sound-world__bar-nav'

    const backBtn = document.createElement('button')
    backBtn.type = 'button'
    backBtn.className = 'touch-btn touch-btn--icon sound-world__bar-btn'
    backBtn.setAttribute('aria-label', 'Назад в меню')
    backBtn.append(createUiIconImg('back', { decorative: true }))
    const syncBackLabel = (): void => {
      backBtn.setAttribute(
        'aria-label',
        activeInstrumentId ? 'К инструментам' : 'Назад в меню',
      )
    }
    backBtn.addEventListener('click', () => {
      if (activeInstrumentId) {
        activeInstrumentId = null
        render()
        return
      }
      context.hubNavigation?.goMenu()
    })

    const soundBtn = document.createElement('button')
    soundBtn.type = 'button'
    soundBtn.className = 'touch-btn touch-btn--icon sound-world__bar-btn'
    soundBtn.append(createUiIconImg('sound-on', { decorative: true }))
    const syncSound = (on: boolean): void => {
      soundBtn.dataset.on = on ? '1' : '0'
      soundBtn.setAttribute('aria-label', on ? 'Звук включён' : 'Звук выключен')
      const icon = soundBtn.querySelector<HTMLImageElement>('img.ui-icon')
      if (icon) icon.src = uiIconUrl(on ? 'sound-on' : 'sound-off')
    }
    let soundOn = context.settings.soundEnabled || context.settings.musicEnabled
    syncSound(soundOn)
    soundBtn.addEventListener('click', () => {
      soundOn = !soundOn
      syncSound(soundOn)
      audio.updateSettings({
        soundEnabled: soundOn,
        musicEnabled: soundOn,
        quietMode: context.settings.quietMode,
      })
      context.hubNavigation?.onSoundToggle?.(soundOn)
    })

    barNav.append(backBtn, soundBtn)

    const mainTabs = document.createElement('div')
    mainTabs.className = 'sound-world__main-tabs'
    mainTabs.setAttribute('role', 'tablist')

    const pager = document.createElement('nav')
    pager.className = 'sound-world__pager'
    pager.setAttribute('aria-label', 'Страницы животных')

    const letterLang = document.createElement('div')
    letterLang.className = 'sound-world__letter-lang'
    letterLang.setAttribute('role', 'group')
    letterLang.setAttribute('aria-label', 'Язык букв')

    const barStart = document.createElement('div')
    barStart.className = 'sound-world__bar-start'
    barStart.append(barNav, pager)

    const barEnd = document.createElement('div')
    barEnd.className = 'sound-world__bar-end'
    barEnd.append(mainTabs, letterLang)

    gameBar.append(barStart, barEnd)

    const stage = document.createElement('div')
    stage.className = 'sound-world__stage'

    const grid = document.createElement('div')
    grid.className = 'sound-world__grid'

    stage.append(grid)
    root.append(bg, gameBar, stage)
    container.replaceChildren(root)

    let instrumentSfxPreloaded = false
    function preloadInstrumentSfx(): void {
      if (instrumentSfxPreloaded || sfxUrls.size === 0) return
      instrumentSfxPreloaded = true
      const urls = INSTRUMENT_SFX_IDS.map((sfxId) => sfxUrls.get(sfxId)).filter(
        (url): url is string => Boolean(url),
      )
      void audio.preload(urls)
    }

    function hasSfxFile(sfxBase: string): boolean {
      if (sfxUrls.size > 0) return sfxUrls.has(sfxBase)
      if (sfxReady.size === 0) return true
      return sfxReady.has(sfxBase)
    }

    function renderMainTabs(): void {
      mainTabs.replaceChildren()
      nav = buildNavigation(hideEn, nav.mainTab, nav.letterScript)
      for (const tab of visibleMainTabs(hideEn)) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'sound-world__main-tab touch-btn'
        btn.setAttribute('role', 'tab')
        btn.dataset.mainTab = tab.id
        btn.textContent = tab.labelRu
        if (tab.id === nav.mainTab) btn.classList.add('is-active')
        btn.addEventListener('click', () => {
          activeInstrumentId = null
          animalPage = 0
          nav = buildNavigation(hideEn, tab.id, tab.id === 'letters-ru' ? nav.letterScript : 'ru')
          render()
        })
        mainTabs.append(btn)
      }
    }

    function renderLetterCard(card: SoundCatalogItem): HTMLElement {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'sound-world__card sound-world__card--letter touch-btn'
      btn.dataset.cardId = card.id
      if (!hasSfxFile(card.sfxBase)) btn.classList.add('sound-world__card--no-sfx')

      const art = document.createElement('img')
      art.className = 'sound-world__art sound-world__art--letter'
      art.src = letterArtUrl(card.id)
      art.alt = ''
      art.setAttribute('aria-hidden', 'true')
      art.draggable = false

      btn.append(art)
      btn.setAttribute('aria-label', card.labelRu)
      btn.addEventListener('click', () => onCardTap(btn, card))
      return btn
    }

    function renderObjectCard(card: SoundCatalogItem): HTMLElement {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'sound-world__card touch-btn'
      btn.dataset.cardId = card.id
      if (card.mainTab === 'instruments') btn.classList.add('sound-world__card--titled-art')
      if (!hasSfxFile(card.sfxBase)) btn.classList.add('sound-world__card--no-sfx')

      const art = document.createElement('img')
      art.className = 'sound-world__art'
      art.src = cardArtUrl(card.id)
      art.alt = ''
      art.setAttribute('aria-hidden', 'true')
      art.draggable = false

      btn.setAttribute('aria-label', card.labelRu)
      btn.append(art)
      if (card.mainTab !== 'instruments') {
        const label = document.createElement('span')
        label.className = 'sound-world__label screen__lead--adult'
        label.textContent = card.labelRu
        btn.append(label)
      }
      btn.addEventListener('click', () => onCardTap(btn, card))
      return btn
    }

    function onCardTap(btn: HTMLButtonElement, card: SoundCatalogItem): void {
      if (nav.mainTab === 'instruments' && INSTRUMENT_IDS.has(card.id)) {
        activeInstrumentId = card.id
        render()
        return
      }
      void playCatalogSfx(audio, card.sfxBase, sfxUrls).then((played) => {
        if (!played) {
          btn.classList.add('sound-world__card--tap-miss')
          window.setTimeout(() => btn.classList.remove('sound-world__card--tap-miss'), 400)
          return
        }
        grid.querySelectorAll('.is-playing').forEach((el) => el.classList.remove('is-playing'))
        btn.classList.add('is-playing')
      })
    }

    function renderLetterLang(): void {
      letterLang.replaceChildren()
      const show = showLetterScriptSwitcher(hideEn, nav)
      letterLang.hidden = !show
      if (!show) return

      for (const opt of [
        { id: 'ru' as LetterScript, label: 'РУ' },
        { id: 'en' as LetterScript, label: 'ABC' },
      ]) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'sound-world__letter-lang-btn touch-btn'
        btn.textContent = opt.label
        btn.dataset.letterScript = opt.id
        if (nav.letterScript === opt.id) btn.classList.add('is-active')
        btn.addEventListener('click', () => {
          nav = buildNavigation(hideEn, 'letters-ru', opt.id)
          render()
        })
        letterLang.append(btn)
      }
    }

    function renderGrid(): void {
      grid.replaceChildren()
      unmountInstrumentView(stage)
      nav = buildNavigation(hideEn, nav.mainTab, nav.letterScript)
      root!.dataset.mainTab = nav.mainTab
      root!.dataset.letterScript = nav.letterScript
      root!.classList.toggle('sound-world--instrument-open', activeInstrumentId != null)
      if (activeInstrumentId) root!.dataset.instrumentId = activeInstrumentId
      else delete root!.dataset.instrumentId

      // Внутри инструмента фоновая музыка уходит в тишину, у списка — возвращается.
      if (activeInstrumentId) audio.duckMusic(400)
      else audio.restoreMusic(400)
      if (nav.mainTab === 'instruments') preloadInstrumentSfx()

      if (activeInstrumentId) {
        grid.hidden = true
        pager.hidden = true
        pager.replaceChildren()
        mountInstrumentView(stage, {
          instrumentId: activeInstrumentId,
          audio,
          sfxUrls,
        })
        return
      }
      grid.hidden = false

      const pages = objectPageCount(nav)
      animalPage = Math.min(animalPage, Math.max(0, pages - 1))
      const cards = cardsOnScreen(nav, animalPage)
      const letters = isLettersMainTab(nav.mainTab) || nav.mainTab === 'letters-ru'
      root!.dataset.page = String(animalPage)

      pager.hidden = pages <= 1 || activeInstrumentId != null
      pager.replaceChildren()
      if (!pager.hidden) {
        for (let i = 0; i < pages; i += 1) {
          const dot = document.createElement('button')
          dot.type = 'button'
          dot.className = 'sound-world__page-dot touch-btn'
          dot.setAttribute('aria-label', `Страница ${i + 1}`)
          if (i === animalPage) {
            dot.classList.add('is-active')
            dot.setAttribute('aria-current', 'page')
          }
          dot.addEventListener('click', () => {
            animalPage = i
            render()
          })
          pager.append(dot)
        }
      }
      root!.classList.toggle('sound-world--letters', letters)

      grid.classList.toggle('sound-world__grid--alphabet', letters)
      grid.classList.toggle('sound-world__grid--objects', !letters)
      grid.classList.toggle('sound-world__grid--instruments', nav.mainTab === 'instruments')
      grid.dataset.count = String(cards.length)
      grid.dataset.alphabet = nav.letterScript === 'en' ? 'en' : letters ? 'ru' : ''

      if (letters) {
        const { cols, rows } = letterGridLayout(cards.length)
        grid.style.setProperty('--cols', String(cols))
        grid.style.setProperty('--rows', String(rows))
      } else {
        grid.style.removeProperty('--cols')
        grid.style.removeProperty('--rows')
      }

      let letterLayout: { cols: number; rows: number } | null = null
      if (letters) letterLayout = letterGridLayout(cards.length)

      cards.forEach((card, index) => {
        const el = letters ? renderLetterCard(card) : renderObjectCard(card)
        if (letterLayout) {
          el.style.gridColumn = String(
            letterGridColumn1Based(index, cards.length, letterLayout.cols, letterLayout.rows),
          )
        }
        grid.append(el)
      })
    }

    function render(): void {
      renderMainTabs()
      renderLetterLang()
      renderGrid()
      syncBackLabel()
    }

    render()

    const onSwipeStart = (event: PointerEvent): void => {
      swipeStartX = event.clientX
      const target = event.target
      swipeStartedOnCard =
        target instanceof Element && Boolean(target.closest('.sound-world__card'))
    }
    const onSwipeEnd = (event: PointerEvent): void => {
      if (swipeStartX == null) return
      const dx = event.clientX - swipeStartX
      const startedOnCard = swipeStartedOnCard
      swipeStartX = null
      swipeStartedOnCard = false
      if (
        !shouldTurnAnimalPage({
          dx,
          startedOnCard,
          mainTab: nav.mainTab,
          instrumentOpen: activeInstrumentId != null,
        })
      ) {
        return
      }
      const pages = objectPageCount(nav)
      if (dx < 0) animalPage = Math.min(pages - 1, animalPage + 1)
      else animalPage = Math.max(0, animalPage - 1)
      render()
    }
    stage.addEventListener('pointerdown', onSwipeStart)
    stage.addEventListener('pointerup', onSwipeEnd)

    void Promise.all([loadSfxInventory(), loadSfxExtensions()]).then(([set, exts]) => {
      if (epoch !== mountEpoch) return
      sfxReady = set
      sfxUrls = buildKnownSfxUrls(set, exts)
      if (epoch !== mountEpoch) return
      render()
    })

    cleanup = () => {
      stage.removeEventListener('pointerdown', onSwipeStart)
      stage.removeEventListener('pointerup', onSwipeEnd)
      unmountInstrumentView(stage)
      audio.stopSfx()
      audio.restoreMusic(0)
      audio.dispose?.()
      if (root?.parentElement) root.parentElement.removeChild(root)
      root = null
      cleanup = null
    }
  },

  unmount() {
    unmountInternal()
  },
}

let root: HTMLElement | null = null
let cleanup: (() => void) | null = null
let mountEpoch = 0

function unmountInternal(): void {
  mountEpoch += 1
  cleanup?.()
  cleanup = null
  root = null
}
