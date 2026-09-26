import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { placeholderClass } from '../../shared/placeholders'
import {
  advanceSoftErrorChain,
  createSoftErrorChain,
  recordSoftSuccess,
  resetSoftErrorChain,
} from '../../shared/soft-error-chain'
import {
  buildOrderTargets,
  evaluateGiveSelect,
  evaluateOrderTap,
  maxCount,
  numberWordRu,
  type CountingMode,
} from './logic'
import {
  COUNTER_ICON,
  COUNTER_KINDS,
  COUNTER_LABEL,
  COUNTER_PLACEHOLDER,
  type CounterKind,
} from './counter-kind'
import {
  pickCountCompletePraise,
  pickCountGivePraise,
  pickCountStepPraise,
} from './praise'
import { playCountSoft, playCountSuccess } from './counting-sfx'
import './counting.css'

export const countingGame: GameModule = {
  meta: {
    id: 'counting',
    title: 'Считаем с Мяу',
    zoneId: 'star-workshop',
    modules: ['2.18'],
  },

  mount(container, context) {
    unmountInternal()
    const audio = createAudioManager(context.settings)
    void audio.unlock()

    const limit = maxCount(context.settings.countingLimit)
    let mode: CountingMode = 'order'
    let counterKind: CounterKind = 'apple'
    let expected = 1
    let giveTarget = Math.min(3, limit)
    let selected: number[] = []
    const orderChain = createSoftErrorChain()
    const giveChain = createSoftErrorChain()

    root = document.createElement('section')
    root.className = 'counting-game'
    root.dataset.gameId = 'counting'

    const toolbar = document.createElement('div')
    toolbar.className = 'counting-game__toolbar'

    const modeRow = document.createElement('div')
    modeRow.className = 'counting-game__row counting-game__row--modes'
    modeRow.setAttribute('aria-label', 'Режим')

    const kindRow = document.createElement('div')
    kindRow.className = 'counting-game__row counting-game__row--kinds'
    kindRow.setAttribute('aria-label', 'Чем считаем')

    toolbar.append(modeRow, kindRow)

    const mission = document.createElement('p')
    mission.className = 'counting-game__mission'
    mission.setAttribute('aria-live', 'polite')

    const play = document.createElement('div')
    play.className = 'counting-game__play'

    const stage = document.createElement('div')
    stage.className = 'counting-game__stage'

    play.append(stage)
    root.append(toolbar, mission, play)
    container.replaceChildren(root)

    function setMission(text: string): void {
      mission.textContent = text
      context.onSoftHint?.(text)
    }

    function visualForKind(): string {
      const p = COUNTER_PLACEHOLDER[counterKind]
      return placeholderClass(p.shape, p.color)
    }

    function makeItem(value: number, showNumber: boolean): HTMLButtonElement {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'counting-game__item touch-btn'
      btn.dataset.value = String(value)

      const visual = document.createElement('span')
      visual.className = `counting-game__chip ${visualForKind()}`
      visual.setAttribute('aria-hidden', 'true')
      btn.append(visual)

      if (showNumber) {
        const badge = document.createElement('span')
        badge.className = 'counting-game__badge'
        badge.textContent = String(value)
        badge.setAttribute('aria-hidden', 'true')
        btn.append(badge)
      }

      btn.setAttribute(
        'aria-label',
        showNumber ? `${value}` : COUNTER_LABEL[counterKind],
      )
      return btn
    }

    function renderToolbar(): void {
      modeRow.replaceChildren()
      for (const [id, icon, label] of [
        ['order', '🔢', 'По порядку'],
        ['give', '🎁', 'Дай сколько'],
      ] as const) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'counting-game__mode touch-btn'
        if (mode === id) btn.classList.add('is-active')
        const iconEl = document.createElement('span')
        iconEl.className = 'counting-game__mode-icon'
        iconEl.textContent = icon
        iconEl.setAttribute('aria-hidden', 'true')
        const labelEl = document.createElement('span')
        labelEl.className = 'counting-game__mode-label screen__lead--adult'
        labelEl.textContent = label
        btn.append(iconEl, labelEl)
        btn.setAttribute('aria-label', label)
        btn.addEventListener('click', () => {
          mode = id as CountingMode
          expected = 1
          selected = []
          resetSoftErrorChain(orderChain)
          giveTarget = Math.min(2 + Math.floor(Math.random() * Math.min(3, limit)), limit)
          render()
        })
        modeRow.append(btn)
      }

      kindRow.replaceChildren()
      for (const kind of COUNTER_KINDS) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'counting-game__kind touch-btn'
        if (kind === counterKind) btn.classList.add('is-active')
        btn.textContent = COUNTER_ICON[kind]
        btn.setAttribute('aria-label', COUNTER_LABEL[kind])
        btn.addEventListener('click', () => {
          counterKind = kind
          render()
        })
        kindRow.append(btn)
      }
    }

    function render(): void {
      root!.dataset.mode = mode
      root!.dataset.limit = String(limit)
      root!.dataset.counter = counterKind
      renderToolbar()
      stage.replaceChildren()

      if (mode === 'order') {
        setMission(`${capWord(numberWordRu(expected))}.`)
        for (const n of buildOrderTargets(limit)) {
          const btn = makeItem(n, true)
          if (n < expected) btn.classList.add('is-done')
          btn.addEventListener('click', () => {
            const result = evaluateOrderTap(n, expected)
            if (result.ok) {
              recordSoftSuccess(orderChain)
              expected = result.nextExpected
              playCountSuccess(audio)
              if (expected > limit) {
                setMission(`${pickCountCompletePraise()} ${capWord(numberWordRu(1))}.`)
                expected = 1
              } else {
                setMission(`${pickCountStepPraise()} ${capWord(numberWordRu(expected))}.`)
              }
              render()
            } else {
              playCountSoft(audio)
              const word = numberWordRu(expected)
              const step = advanceSoftErrorChain(orderChain, {
                repeat: `${capWord(word)}.`,
                nudge: `Давай вместе: ${word}.`,
                beforeHighlight: `Давай вместе: ${word}.`,
              })
              btn.classList.add('soft-wiggle')
              window.setTimeout(() => btn.classList.remove('soft-wiggle'), 450)
              setMission(step.message)
              if (step.shouldHighlight) {
                stage
                  .querySelector(`.counting-game__item[data-value="${expected}"]`)
                  ?.classList.add('is-soft-highlight')
              }
            }
          })
          stage.append(btn)
        }
        return
      }

      setMission(`${capWord(numberWordRu(giveTarget))} ${COUNTER_LABEL[counterKind]}.`)
      root!.dataset.giveTarget = String(giveTarget)
      const poolSize = Math.min(limit + 4, 10)
      for (let i = 1; i <= poolSize; i++) {
        const btn = makeItem(i, false)
        if (selected.includes(i)) btn.classList.add('is-picked')
        btn.addEventListener('click', () => {
          if (selected.includes(i)) {
            selected = selected.filter((x) => x !== i)
          } else {
            selected = [...selected, i]
          }
          const result = evaluateGiveSelect(selected, giveTarget)
          if (result.softRecount) {
            playCountSoft(audio)
            const word = numberWordRu(giveTarget)
            const step = advanceSoftErrorChain(giveChain, {
              repeat: `Давай вместе: ${word}.`,
              nudge: `Давай вместе: ${word}.`,
              beforeHighlight: `Давай вместе: ${word}.`,
            })
            selected = []
            render()
            setMission(step.message)
            if (step.shouldHighlight) {
              const items = stage.querySelectorAll('.counting-game__item')
              items.forEach((el, index) => {
                if (index < giveTarget) el.classList.add('is-soft-highlight')
              })
            }
            return
          }
          if (result.complete) {
            recordSoftSuccess(giveChain)
            playCountSuccess(audio)
            setMission(pickCountGivePraise())
            selected = []
            giveTarget = Math.min(1 + Math.floor(Math.random() * limit), limit)
            render()
            return
          }
          render()
        })
        stage.append(btn)
      }
    }

    render()

    cleanup = () => {
      if (root?.parentElement) root.parentElement.removeChild(root)
      root = null
      cleanup = null
    }
  },

  unmount() {
    unmountInternal()
  },
}

function capWord(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1)
}

let root: HTMLElement | null = null
let cleanup: (() => void) | null = null

function unmountInternal(): void {
  cleanup?.()
  cleanup = null
  root = null
}
