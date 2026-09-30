import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { createMascotPlaceholder, setMascotPose, type MascotPose } from '../../mascot'
import { createTimerBag } from '../../shared/timer-bag'
import {
  careActionsFor,
  CARE_ICON,
  CARE_LABEL,
  dayPropsFor,
  DAY_PROP_ICON,
  DAY_PROP_LABEL,
  formatClock24,
  mascotPoseFor,
  nightPropsFor,
  NIGHT_PROP_ICON,
  NIGHT_PROP_LABEL,
  periodFromHour,
  PERIOD_ICON,
  PERIOD_LABEL,
  sceneKindFor,
  statusBannerFor,
  type CareAction,
  type DayPeriod,
} from './logic'
import {
  pickBlanketHint,
  pickCarePraise,
  pickDayPropPraise,
  pickMeowTapPraise,
  pickNightQuietHint,
} from './praise'
import { playAmbientTap, playCareAction, playMeowTap } from './meow-home-sfx'
import { mountOutdoor } from './outdoor'
import './meow-home.css'

const POSE_MAP: Record<ReturnType<typeof mascotPoseFor>, MascotPose> = {
  idle: 'idle',
  happy: 'happy',
  sleepy: 'sleepy',
  yawn: 'sleepy',
}

export const meowHomeGame: GameModule = {
  meta: {
    id: 'meow-home',
    title: 'В гости',
    zoneId: 'meow-orbit',
    modules: ['2.13', '2.16', '2.10'],
  },

  mount(container, context) {
    unmountInternal()
    const audio = createAudioManager(context.settings)
    void audio.unlock()

    let period: DayPeriod = periodFromHour(new Date().getHours())
    let manual = false
    let covered = false
    let clockTimer: ReturnType<typeof setInterval> | null = null

    root = document.createElement('section')
    root.className = 'meow-home'
    root.dataset.gameId = 'meow-home'

    const timeRow = document.createElement('div')
    timeRow.className = 'meow-home__time game-adult-bar'
    timeRow.setAttribute('aria-label', 'Время суток')

    const status = document.createElement('p')
    status.className = 'meow-home__status'
    status.setAttribute('aria-live', 'polite')

    const stage = document.createElement('div')
    stage.className = 'meow-home__stage'

    const clockSlot = document.createElement('div')
    clockSlot.className = 'meow-home__clock-slot'
    const clockEl = document.createElement('time')
    clockEl.className = 'meow-home__clock'
    clockSlot.append(clockEl)

    const sky = document.createElement('div')
    sky.className = 'meow-home__sky'
    sky.setAttribute('aria-hidden', 'true')

    const mascotWrap = document.createElement('div')
    mascotWrap.className = 'meow-home__mascot-wrap'
    const mascot = createMascotPlaceholder('idle')
    mascot.classList.add('meow-home__mascot')
    mascot.setAttribute('role', 'button')
    mascot.setAttribute('tabindex', '0')
    mascot.setAttribute('aria-label', 'Мяu')
    mascotWrap.append(mascot)

    const actions = document.createElement('div')
    actions.className = 'meow-home__actions'

    const props = document.createElement('div')
    props.className = 'meow-home__props'

    const door = document.createElement('button')
    door.type = 'button'
    door.className = 'touch-btn meow-home__door'
    door.setAttribute('aria-label', 'На улицу')
    door.textContent = '🚪'
    door.addEventListener('click', () => goOutside())

    stage.append(sky, clockSlot, mascotWrap, props, actions, door)
    root.append(timeRow, status, stage)
    container.replaceChildren(root)

    let disposeOutdoor: (() => void) | null = null

    function goOutside(): void {
      if (disposeOutdoor || !root) return
      playAmbientTap(audio)
      timeRow.hidden = true
      status.hidden = true
      stage.hidden = true
      root.dataset.place = 'outdoor'
      disposeOutdoor = mountOutdoor(root, {
        audio,
        onSoftHint: context.onSoftHint,
        onHome: () => goHome(),
      })
    }

    function goHome(): void {
      disposeOutdoor?.()
      disposeOutdoor = null
      timeRow.hidden = false
      status.hidden = false
      stage.hidden = false
      if (root) root.dataset.place = 'home'
      render()
    }

    function tickClock(): void {
      clockEl.dateTime = new Date().toISOString()
      clockEl.textContent = formatClock24(new Date())
    }

    const timers = createTimerBag()

    function flashCare(action: CareAction): void {
      mascotWrap.dataset.careFlash = action
      timers.track(
        window.setTimeout(() => {
          delete mascotWrap.dataset.careFlash
        }, 700),
      )
    }

    function onMascotTap(): void {
      if (period === 'night') {
        context.onSoftHint?.(pickNightQuietHint())
        return
      }
      playMeowTap(audio)
      setMascotPose(mascot, 'happy')
      context.onSoftHint?.(pickMeowTapPraise())
      timers.track(
        window.setTimeout(() => setMascotPose(mascot, POSE_MAP[mascotPoseFor(period)]), 500),
      )
    }

    mascot.addEventListener('click', onMascotTap)
    mascot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onMascotTap()
      }
    })

    function render(): void {
      const scene = sceneKindFor(period)
      root!.dataset.period = period
      root!.dataset.scene = scene
      root!.dataset.manual = manual ? '1' : '0'
      stage.dataset.period = period
      stage.dataset.scene = scene
      covered = period === 'night' ? covered : false
      mascotWrap.classList.toggle('is-covered', covered)

      status.textContent = statusBannerFor(period)
      setMascotPose(mascot, POSE_MAP[mascotPoseFor(period)])

      timeRow.replaceChildren()
      for (const p of ['morning', 'day', 'evening', 'night'] as const) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'meow-home__period touch-btn'
        if (p === period) btn.classList.add('is-active')
        btn.textContent = PERIOD_ICON[p]
        btn.setAttribute('aria-label', PERIOD_LABEL[p])
        btn.addEventListener('click', () => {
          period = p
          manual = true
          covered = false
          render()
        })
        timeRow.append(btn)
      }

      const nowBtn = document.createElement('button')
      nowBtn.type = 'button'
      nowBtn.className = 'touch-btn touch-btn--quiet meow-home__now'
      nowBtn.textContent = 'Сейчас'
      nowBtn.addEventListener('click', () => {
        period = periodFromHour(new Date().getHours())
        manual = false
        covered = false
        context.onSoftHint?.(`Сейчас: ${PERIOD_LABEL[period]}.`)
        render()
      })
      timeRow.append(nowBtn)

      actions.replaceChildren()
      props.replaceChildren()
      sky.hidden = scene !== 'night'

      for (const action of careActionsFor(period)) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'meow-home__care touch-btn'
        btn.textContent = CARE_ICON[action]
        btn.setAttribute('aria-label', CARE_LABEL[action])
        btn.addEventListener('click', () => {
          playCareAction(audio, action)
          flashCare(action)
          setMascotPose(mascot, 'happy')
          context.onSoftHint?.(pickCarePraise(action))
        })
        actions.append(btn)
      }

      if (period === 'day') {
        for (const prop of dayPropsFor(period)) {
          const btn = document.createElement('button')
          btn.type = 'button'
          btn.className = 'meow-home__prop touch-btn'
          btn.textContent = DAY_PROP_ICON[prop]
          btn.setAttribute('aria-label', DAY_PROP_LABEL[prop])
          btn.addEventListener('click', () => {
            playAmbientTap(audio)
            context.onSoftHint?.(`${pickDayPropPraise()} Мяu смотрит: ${DAY_PROP_LABEL[prop]}.`)
          })
          props.append(btn)
        }
      }

      if (period === 'night') {
        for (const prop of nightPropsFor(period)) {
          const btn = document.createElement('button')
          btn.type = 'button'
          btn.className = 'meow-home__prop touch-btn meow-home__prop--night'
          if (prop === 'star-a' || prop === 'star-b') {
            btn.classList.add('meow-home__prop--big-star')
          }
          btn.textContent = NIGHT_PROP_ICON[prop]
          btn.setAttribute('aria-label', NIGHT_PROP_LABEL[prop])
          btn.addEventListener('click', () => {
            if (prop === 'blanket') {
              covered = true
              mascotWrap.classList.add('is-covered')
              context.onSoftHint?.(pickBlanketHint())
              return
            }
            btn.classList.add('is-twinkle')
            timers.track(window.setTimeout(() => btn.classList.remove('is-twinkle'), 600))
            context.onSoftHint?.(pickNightQuietHint())
          })
          props.append(btn)
        }
      }

      if (careActionsFor(period).length === 0 && period !== 'day' && period !== 'night') {
        context.onSoftHint?.(statusBannerFor(period))
      } else if (careActionsFor(period).length > 0) {
        context.onSoftHint?.(`${PERIOD_LABEL[period]}: выбери, чем помочь Мяu.`)
      } else {
        context.onSoftHint?.(statusBannerFor(period))
      }
    }

    tickClock()
    clockTimer = setInterval(tickClock, 30_000)
    render()

    cleanup = () => {
      disposeOutdoor?.()
      disposeOutdoor = null
      timers.clear()
      if (clockTimer) clearInterval(clockTimer)
      clockTimer = null
      audio.stopSfx()
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
