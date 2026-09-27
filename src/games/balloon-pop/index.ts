import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { playBalloonPopSound, playSoftMiss } from '../../shared/hub-sounds'
import { softPopHaptic } from '../../shared/haptics'
import { createUiIconImg, uiIconUrl } from '../../shared/ui-icon'
import {
  balloonMeowPoseForEvent,
  balloonPngUrl,
  balloonSkyUrl,
  meowPresenterUrl,
  type BalloonMeowEvent,
} from './assets'
import {
  balloonMatchesTask,
  countTargets,
  createFieldForTask,
  createFreeField,
  evaluatePop,
  hintForTask,
  pickOptionalTask,
  pickTaskCompletePraise,
  softChainMessagesForTask,
  type BalloonSpec,
  type BalloonTask,
} from './logic'
import {
  FREE_MODE_VISUAL_SCALE,
  layoutBalloonsForField,
  type BalloonPlacement,
} from './layout'
import {
  advanceSoftErrorChain,
  createSoftErrorChain,
  resetSoftErrorChain,
} from '../../shared/soft-error-chain'
import { fillSpeechElement, taskSpeechColor } from './speech'
import { balloonVoiceFileForLine, balloonVoiceUrl } from './voice'
import { runAfterCurrentVoice } from './after-voice'
import './balloon-pop.css'

const POP_MS = 420
const DRAG_POP_COOLDOWN_MS = 120
const TASK_SUCCESS_CELEBRATION_MS = 1600

export const balloonPopGame: GameModule = {
  meta: {
    id: 'balloon-pop',
    title: 'Лопни шарик',
    zoneId: 'rainbow-meadow',
    modules: ['2.1'],
  },

  mount(container, context) {
    unmountInternal()
    root = document.createElement('section')
    root.className = 'balloon-pop'
    root.dataset.gameId = 'balloon-pop'
    root.dataset.mode = 'free'

    const audio = createAudioManager({
      soundEnabled: context.settings.soundEnabled,
      musicEnabled: context.settings.musicEnabled,
      quietMode: context.settings.quietMode,
    })
    void audio.unlock()

    let task: BalloonTask = { type: 'none' }
    let taskSessionEngaged = false
    let targetsRemaining = 0
    let balloons = createFreeField()
    const placementById = new Map<string, BalloonPlacement>()
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const taskChain = createSoftErrorChain()
    let lastDragPopId: string | null = null
    let lastDragPopAt = 0
    let holdGen = 0
    let speechGen = 0

    function cancelHeldRespawn(): void {
      holdGen += 1
    }

    function afterPhraseThen(action: () => void): void {
      const gen = holdGen
      const speechAtSchedule = speechGen
      void runAfterCurrentVoice(
        () => audio.waitUntilVoiceEnded(),
        action,
        () =>
          holdGen === gen &&
          Boolean(root?.isConnected) &&
          speechGen === speechAtSchedule,
      )
    }

    function syncModeDataset(): void {
      root!.dataset.mode = task.type === 'none' ? 'free' : 'task'
      root!.dataset.taskSession = taskSessionEngaged ? '1' : '0'
    }

    function syncModeButtons(): void {
      const inTask = taskSessionEngaged && task.type !== 'none'
      freeBtn.classList.toggle('is-active', !inTask)
      freeBtn.setAttribute('aria-pressed', inTask ? 'false' : 'true')
      taskBtn.classList.toggle('is-active', inTask)
      taskBtn.setAttribute('aria-pressed', inTask ? 'true' : 'false')
    }

    function refreshTargets(): void {
      targetsRemaining = task.type === 'none' ? 0 : countTargets(task, balloons)
    }

    const meowSpeech = document.createElement('p')
    meowSpeech.className = 'balloon-pop__speech'
    meowSpeech.setAttribute('aria-live', 'polite')

    const meowImg = document.createElement('img')
    meowImg.className = 'balloon-pop__meow meow-idle'
    meowImg.alt = ''
    meowImg.setAttribute('aria-hidden', 'true')
    meowImg.decoding = 'async'
    meowImg.src = meowPresenterUrl('idle')
    let poseReset: ReturnType<typeof setTimeout> | undefined

    function setMeowLine(
      message: string,
      event: BalloonMeowEvent = 'idle',
      speechTask: BalloonTask | null = null,
      options?: { playVoice?: boolean },
    ): void {
      speechGen += 1
      fillSpeechElement(meowSpeech, message, taskSpeechColor(speechTask ?? task))
      const voiceFile = balloonVoiceFileForLine(message)
      if (options?.playVoice !== false && voiceFile) {
        void audio.playUrl('voice', balloonVoiceUrl(voiceFile), { volume: 0.86 })
      }
      const pose = balloonMeowPoseForEvent(event)
      meowImg.src = meowPresenterUrl(pose)
      meowImg.classList.toggle('meow-idle', pose === 'idle')
      if (poseReset !== undefined) {
        clearTimeout(poseReset)
        timers.delete(poseReset)
        poseReset = undefined
      }
      if (event === 'praise' || event === 'miss') {
        const reset = setTimeout(() => {
          timers.delete(reset)
          poseReset = undefined
          if (!meowImg.isConnected) return
          meowImg.src = meowPresenterUrl('idle')
          meowImg.classList.add('meow-idle')
        }, TASK_SUCCESS_CELEBRATION_MS)
        poseReset = reset
        timers.add(reset)
      }
    }

    function bindPlacements(nextBalloons: BalloonSpec[], forTask: BalloonTask): void {
      placementById.clear()
      const isFree = forTask.type === 'none'
      const modeScale = isFree ? 1 : 1.25
      const plan = layoutBalloonsForField(nextBalloons, Math.random, {
        modeScale,
        fieldProfile: isFree ? 'free' : 'task',
      })
      field.style.setProperty('--balloon-layout-scale', String(plan.layoutScale))
      field.style.setProperty('--balloon-task-scale', String(modeScale))
      field.style.setProperty(
        '--balloon-free-scale',
        isFree ? String(FREE_MODE_VISUAL_SCALE) : '1',
      )
      for (const [id, place] of plan.placementsById) {
        placementById.set(id, place)
      }
    }

    function loadField(forTask: BalloonTask): void {
      balloons =
        forTask.type === 'none' ? createFreeField() : createFieldForTask(forTask)
      bindPlacements(balloons, forTask)
      task = forTask
      refreshTargets()
      syncModeDataset()
      syncModeButtons()
      renderField()
    }

    const gameBar = document.createElement('header')
    gameBar.className = 'balloon-pop__game-bar'

    const barNav = document.createElement('div')
    barNav.className = 'balloon-pop__bar-nav'

    const backBtn = document.createElement('button')
    backBtn.type = 'button'
    backBtn.className = 'touch-btn touch-btn--icon balloon-pop__bar-btn'
    backBtn.setAttribute('aria-label', 'Назад в меню')
    backBtn.append(createUiIconImg('back', { decorative: true }))
    backBtn.addEventListener('click', () => context.hubNavigation?.goMenu())

    const soundBtn = document.createElement('button')
    soundBtn.type = 'button'
    soundBtn.className = 'touch-btn touch-btn--icon balloon-pop__bar-btn'
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

    const modes = document.createElement('div')
    modes.className = 'balloon-pop__modes'

    const freeBtn = document.createElement('button')
    freeBtn.type = 'button'
    freeBtn.className = 'touch-btn balloon-pop__mode-btn'
    freeBtn.textContent = 'Свободно'
    freeBtn.setAttribute('aria-label', 'Свободный режим')

    const taskBtn = document.createElement('button')
    taskBtn.type = 'button'
    taskBtn.className = 'touch-btn balloon-pop__mode-btn'
    taskBtn.textContent = 'Задание'
    taskBtn.setAttribute('aria-label', 'Задание — режим с подсказкой Мяу')
    taskBtn.hidden = !context.settings.balloonTasksEnabled

    modes.append(freeBtn, taskBtn)
    gameBar.append(barNav, modes)

    function clearTaskHighlights(): void {
      field
        .querySelectorAll('.is-soft-highlight')
        .forEach((el) => el.classList.remove('is-soft-highlight'))
    }

    function highlightTaskBalloons(): void {
      clearTaskHighlights()
      if (task.type === 'none') return
      for (const balloon of balloons) {
        if (!balloonMatchesTask(balloon, task)) continue
        field
          .querySelector(`[data-balloon-id="${balloon.id}"]`)
          ?.classList.add('is-soft-highlight')
      }
    }

    function enterFreeMode(message?: string): void {
      const alreadyFree = task.type === 'none'
      cancelHeldRespawn()
      taskSessionEngaged = false
      resetSoftErrorChain(taskChain)
      clearTaskHighlights()
      loadField({ type: 'none' })
      setMeowLine(message ?? hintForTask({ type: 'none' }), 'idle', null, {
        playVoice: !alreadyFree,
      })
    }

    freeBtn.addEventListener('click', () => enterFreeMode())

    taskBtn.addEventListener('click', () => {
      cancelHeldRespawn()
      taskSessionEngaged = true
      resetSoftErrorChain(taskChain)
      clearTaskHighlights()
      const next = pickOptionalTask()
      loadField(next)
      setMeowLine(hintForTask(next), 'task', next)
    })

    const sky = document.createElement('div')
    sky.className = 'balloon-pop__sky'

    const skyArt = document.createElement('img')
    skyArt.className = 'balloon-pop__sky-art'
    skyArt.alt = ''
    skyArt.setAttribute('aria-hidden', 'true')
    skyArt.decoding = 'async'
    skyArt.src = balloonSkyUrl()
    const still =
      context.settings.quietMode ||
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
    if (!still) skyArt.classList.add('balloon-pop__sky-art--drift')
    sky.append(skyArt)

    const aside = document.createElement('div')
    aside.className = 'balloon-pop__aside'

    aside.append(meowImg, meowSpeech)

    const field = document.createElement('div')
    field.className = 'balloon-pop__field'
    field.setAttribute('aria-label', 'Небо с шариками')

    sky.append(aside, field)
    root.append(gameBar, sky)

    function renderField(): void {
      field.replaceChildren()
      const drawOrder = [...balloons].sort((a, b) => {
        if (a.size !== b.size) return a.size === 'lg' ? -1 : 1
        const ya = placementById.get(a.id)?.yPct ?? 0
        const yb = placementById.get(b.id)?.yPct ?? 0
        return ya - yb
      })
      for (const balloon of drawOrder) {
        const place = placementById.get(balloon.id) ?? { xPct: 50, yPct: 40 }
        field.append(createBalloonButton(balloon, place))
      }
    }

    function createBalloonButton(
      balloon: BalloonSpec,
      place: BalloonPlacement,
    ): HTMLButtonElement {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = `balloon-pop__balloon balloon-pop__balloon--${balloon.size}`
      btn.dataset.balloonId = balloon.id
      btn.dataset.color = balloon.color
      btn.dataset.size = balloon.size
      btn.style.left = `${place.xPct}%`
      btn.style.top = `${place.yPct}%`
      btn.setAttribute('aria-label', `Шарик ${balloon.color} ${balloon.size}`)

      const glow = document.createElement('span')
      glow.className = 'balloon-pop__glow'
      glow.setAttribute('aria-hidden', 'true')

      const motion = document.createElement('span')
      motion.className = 'balloon-pop__balloon-motion'
      motion.style.setProperty('--balloon-bob', `${(balloon.id.charCodeAt(0) % 4) + 2}s`)
      motion.style.setProperty('--balloon-drift', `${(balloon.id.length % 5) + 4}s`)
      motion.setAttribute('aria-hidden', 'true')

      const visual = document.createElement('img')
      visual.className = 'balloon-pop__balloon-art'
      visual.src = balloonPngUrl(balloon.color)
      visual.alt = ''
      visual.decoding = 'async'
      visual.draggable = false
      motion.append(visual)
      btn.append(glow, motion)

      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-popping')) return
        popBalloon(balloon, btn)
      })

      return btn
    }

    function canDragPop(): boolean {
      return task.type === 'none' && !taskSessionEngaged
    }

    function popUnderPointer(clientX: number, clientY: number): void {
      if (!canDragPop()) return
      const now = Date.now()
      const el = document.elementFromPoint(clientX, clientY)
      const btn = el?.closest?.('.balloon-pop__balloon') as HTMLButtonElement | null
      if (!btn || btn.classList.contains('is-popping')) return
      const id = btn.dataset.balloonId
      if (!id) return
      if (lastDragPopId === id && now - lastDragPopAt < DRAG_POP_COOLDOWN_MS) return
      const spec = balloons.find((b) => b.id === id)
      if (!spec) return
      lastDragPopId = id
      lastDragPopAt = now
      popBalloon(spec, btn)
    }

    field.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      popUnderPointer(event.clientX, event.clientY)
    })

    field.addEventListener('pointermove', (event) => {
      if ((event.buttons & 1) === 0) return
      popUnderPointer(event.clientX, event.clientY)
    })

    function playPopFeedback(): void {
      softPopHaptic(context.settings.quietMode)
      playBalloonPopSound(audio)
    }

    function onSkyEmpty(): void {
      afterPhraseThen(() => {
        loadField({ type: 'none' })
        setMeowLine(hintForTask({ type: 'none' }))
      })
    }

    function startNextTaskAfterSuccess(): void {
      const next = pickOptionalTask()
      loadField(next)
      setMeowLine(hintForTask(next), 'task', next)
    }

    function popBalloon(balloon: BalloonSpec, btn: HTMLButtonElement): void {
      const beforeTargets = targetsRemaining
      const result = evaluatePop(balloon, task, beforeTargets)

      if (!result.matchedTask && task.type !== 'none') {
        const chainMsgs = softChainMessagesForTask(task)
        let hint = result.hint
        if (chainMsgs) {
          const step = advanceSoftErrorChain(taskChain, chainMsgs)
          hint = step.message
          if (step.shouldHighlight) highlightTaskBalloons()
        }
        playSoftMiss(audio)
        btn.classList.add('soft-wiggle')
        const wiggle = setTimeout(() => btn.classList.remove('soft-wiggle'), 450)
        timers.add(wiggle)
        setMeowLine(hint, 'miss', task)
        return
      }

      let hint = result.hint
      let taskJustCompleted = false
      if (result.matchedTask && task.type !== 'none') {
        targetsRemaining = Math.max(0, beforeTargets - 1)
        if (result.taskCompleted) {
          taskJustCompleted = true
          hint = pickTaskCompletePraise()
        }
      }

      setMeowLine(hint, result.matchedTask ? 'praise' : 'miss', task)
      playPopFeedback()

      btn.classList.add('is-popping')
      const delay = context.settings.quietMode ? 280 : POP_MS
      const timer = setTimeout(() => {
        timers.delete(timer)
        placementById.delete(balloon.id)
        balloons = balloons.filter((b) => b.id !== balloon.id)
        btn.remove()

        if (taskJustCompleted && taskSessionEngaged) {
          resetSoftErrorChain(taskChain)
          clearTaskHighlights()
          afterPhraseThen(() => startNextTaskAfterSuccess())
          return
        }

        if (balloons.length === 0) {
          onSkyEmpty()
        }
      }, delay)
      timers.add(timer)
    }

    if (context.settings.quietMode) {
      root.classList.add('balloon-pop--quiet')
    }
    container.replaceChildren(root)
    bindPlacements(balloons, task)
    refreshTargets()
    syncModeDataset()
    syncModeButtons()
    renderField()
    const intro = context.settings.childName
      ? `${context.settings.childName}, ${hintForTask(task)}`
      : hintForTask(task)
    setMeowLine(intro, task.type === 'none' ? 'idle' : 'task', task)

    cleanup = () => {
      cancelHeldRespawn()
      for (const timer of timers) clearTimeout(timer)
      timers.clear()
      context.onTaskVisual?.(null)
      if (root?.parentElement) {
        root.parentElement.removeChild(root)
      }
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
