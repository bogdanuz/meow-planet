import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { playSoftMiss } from '../../shared/hub-sounds'
import {
  advanceSoftErrorChain,
  createSoftErrorChain,
  recordSoftSuccess,
} from '../../shared/soft-error-chain'
import { placeholderClass } from '../../shared/placeholders'
import { createTimerBag } from '../../shared/timer-bag'
import { bindDragDrop } from '../../shared/pointer'
import {
  asPlaceholderColor,
  createBaskets,
  createBeads,
  evaluateSortDrop,
  isSortToyShape,
  softHintForShape,
  sortBasketLabelRu,
  sortShapeLabelRu,
  sortToyLabelRu,
  type SortBead,
} from './logic'
import { pickSortDropPraise, pickSortRoundPraise } from './praise'
import './sort-colors.css'


/** Пауза после «все игрушки на месте» (balloon-pop praise pool; голос — S16). */
const ROUND_COMPLETE_PAUSE_MS = 1500

export const sortColorsGame: GameModule = {
  meta: {
    id: 'sort-colors',
    title: 'Куда положить?',
    zoneId: 'star-workshop',
    modules: ['2.3'],
  },

  mount(container, context) {
    unmountInternal()

    const audio = createAudioManager({
      soundEnabled: context.settings.soundEnabled,
      musicEnabled: context.settings.musicEnabled,
      quietMode: context.settings.quietMode,
    })
    void audio.unlock()

    let beads = createBeads()
    const baskets = createBaskets()
    const placed = new Set<string>()
    let selected: HTMLElement | null = null
    let dragCtl: ReturnType<typeof bindDragDrop> | null = null
    const listeners: Array<() => void> = []
    const dropChain = createSoftErrorChain()
    let roundCompleteTimer: number | null = null
    const timers = createTimerBag()

    root = document.createElement('section')
    root.className = 'sort-colors'
    root.dataset.gameId = 'sort-colors'
    if (context.settings.quietMode) root.classList.add('sort-colors--quiet')

    if (context.settings.childName) {
      const hello = document.createElement('p')
      hello.className = 'sort-colors__hello screen__lead--adult'
      hello.textContent = `Привет, ${context.settings.childName}!`
      root.append(hello)
    }

    const basketsRow = document.createElement('div')
    basketsRow.className = 'sort-colors__baskets'

    for (const basket of baskets) {
      const el = document.createElement('div')
      el.className = 'sort-colors__basket'
      el.dataset.basketId = basket.id
      el.dataset.color = basket.color
      el.setAttribute('role', 'button')
      el.tabIndex = 0
      el.dataset.shape = basket.shape
      el.setAttribute('aria-label', `Корзинка ${sortBasketLabelRu(basket.shape)}`)

      const mark = document.createElement('span')
      mark.className = placeholderClass(
        basket.shape,
        asPlaceholderColor(basket.color),
      )
      mark.setAttribute('aria-hidden', 'true')

      const label = document.createElement('span')
      label.className = 'sort-colors__basket-label screen__lead--adult'
      label.textContent = sortBasketLabelRu(basket.shape)

      el.append(mark, label)
      basketsRow.append(el)
    }

    const tray = document.createElement('div')
    tray.className = 'sort-colors__tray'
    tray.setAttribute('aria-label', 'Игрушки')

    root.append(basketsRow, tray)
    container.replaceChildren(root)

    function clearSelection(): void {
      if (selected) selected.classList.remove('is-selected')
      selected = null
    }

    function beadElements(): HTMLElement[] {
      return [...tray.querySelectorAll<HTMLElement>('.sort-colors__bead')].filter(
        (el) => !placed.has(el.dataset.beadId ?? ''),
      )
    }

    function onBeadActivate(el: HTMLElement): void {
      if (placed.has(el.dataset.beadId ?? '')) return
      if (selected === el) {
        clearSelection()
        context.onSoftHint?.('Положи игрушку в корзинку с такой же картинкой.')
        return
      }
      clearSelection()
      selected = el
      el.classList.add('is-selected')
      context.onSoftHint?.('Теперь тапни корзинку.')
    }

    function onBasketActivate(basketEl: HTMLElement): void {
      if (!selected) {
        context.onSoftHint?.('Сначала выбери игрушку.')
        return
      }
      const source = selected
      clearSelection()
      handleDrop(source, basketEl)
    }

    function bindTapHandlers(): void {
      for (const fn of listeners) fn()
      listeners.length = 0

      for (const bead of beadElements()) {
        const onClick = (event: Event): void => {
          // Не перехватываем конец drag
          if ((event.target as HTMLElement).classList.contains('is-dragging')) return
          onBeadActivate(bead)
        }
        bead.addEventListener('click', onClick)
        listeners.push(() => bead.removeEventListener('click', onClick))
      }

      for (const basket of basketsRow.querySelectorAll<HTMLElement>('.sort-colors__basket')) {
        const onClick = (): void => onBasketActivate(basket)
        const onKey = (event: KeyboardEvent): void => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onBasketActivate(basket)
          }
        }
        basket.addEventListener('click', onClick)
        basket.addEventListener('keydown', onKey)
        listeners.push(() => {
          basket.removeEventListener('click', onClick)
          basket.removeEventListener('keydown', onKey)
        })
      }
    }

    function rebindDrag(): void {
      dragCtl?.destroy()
      dragCtl = bindDragDrop(beadElements(), {
        targetSelector: '.sort-colors__basket',
        accept: '.sort-colors__bead',
        onDrop: (source, target) => {
          clearSelection()
          handleDrop(source, target)
        },
      })
    }

    function createBeadButton(bead: SortBead): HTMLButtonElement {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'sort-colors__bead'
      btn.dataset.beadId = bead.id
      btn.dataset.color = bead.color
      btn.dataset.assetId = bead.assetId
      btn.dataset.shape = bead.shape
      btn.setAttribute('aria-label', sortToyLabelRu(bead.color, bead.shape))

      const visual = document.createElement('span')
      visual.className = placeholderClass(bead.shape, asPlaceholderColor(bead.color))
      visual.setAttribute('aria-hidden', 'true')
      btn.append(visual)
      return btn
    }

    function renderTray(): void {
      clearSelection()
      tray.replaceChildren()
      for (const bead of beads) {
        const btn = createBeadButton(bead)
        if (placed.has(bead.id)) {
          btn.classList.add('is-placed')
          btn.disabled = true
        }
        tray.append(btn)
      }
      bindTapHandlers()
      rebindDrag()
    }

    function handleDrop(source: HTMLElement, target: HTMLElement): void {
      const beadId = source.dataset.beadId
      const beadShape = source.dataset.shape
      const basketShape = target.dataset.shape
      if (!beadId || !beadShape || !basketShape) return
      if (!isSortToyShape(beadShape) || !isSortToyShape(basketShape)) return
      if (placed.has(beadId)) return

      const result = evaluateSortDrop(beadShape, basketShape)

      if (!result.ok) {
        const step = advanceSoftErrorChain(dropChain, {
          repeat: result.message,
          nudge: softHintForShape(beadShape),
          beforeHighlight: `Корзинка с ${sortShapeLabelRu(beadShape)} подсвечена.`,
        })
        context.onSoftHint?.(step.message)
        source.classList.add('soft-wiggle', 'is-returning')
        timers.track(
          window.setTimeout(() => {
            source.classList.remove('soft-wiggle', 'is-returning')
          }, 450),
        )
        basketsRow
          .querySelectorAll('.is-soft-highlight')
          .forEach((el) => el.classList.remove('is-soft-highlight'))
        if (step.shouldHighlight) {
          basketsRow
            .querySelector(`.sort-colors__basket[data-shape="${beadShape}"]`)
            ?.classList.add('is-soft-highlight')
        }
        playSoftMiss(audio)
        return
      }

      recordSoftSuccess(dropChain)
      basketsRow
        .querySelectorAll('.is-soft-highlight')
        .forEach((el) => el.classList.remove('is-soft-highlight'))

      placed.add(beadId)
      void audio.playBeep('sfx')
      if (placed.size >= beads.length) {
        context.onSoftHint?.(pickSortRoundPraise())
        if (roundCompleteTimer !== null) window.clearTimeout(roundCompleteTimer)
        roundCompleteTimer = window.setTimeout(() => {
          roundCompleteTimer = null
          placed.clear()
          beads = createBeads()
          renderTray()
          context.onSoftHint?.('Положи игрушку в корзинку с такой же картинкой.')
        }, ROUND_COMPLETE_PAUSE_MS)
        source.classList.add('is-placed')
        if (source instanceof HTMLButtonElement) source.disabled = true
        bindTapHandlers()
        rebindDrag()
        return
      }

      context.onSoftHint?.(pickSortDropPraise())

      source.classList.add('is-placed')
      if (source instanceof HTMLButtonElement) source.disabled = true
      bindTapHandlers()
      rebindDrag()
    }

    renderTray()
    context.onSoftHint?.(
      context.settings.childName
        ? `${context.settings.childName}, положи игрушку в корзинку с такой же картинкой.`
        : 'Положи игрушку в корзинку с такой же картинкой. Можно тапать или тащить.',
    )

    cleanup = () => {
      if (roundCompleteTimer !== null) window.clearTimeout(roundCompleteTimer)
      roundCompleteTimer = null
      timers.clear()
      for (const fn of listeners) fn()
      listeners.length = 0
      dragCtl?.destroy()
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

function unmountInternal(): void {
  cleanup?.()
  cleanup = null
  root = null
}
