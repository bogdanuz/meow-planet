import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { placeholderClass } from '../../shared/placeholders'
import { createTimerBag } from '../../shared/timer-bag'
import {
  evaluateTap,
  findPrompt,
  getScene,
  HIDE_SEEK_HINT_IDLE_MS,
  pickTarget,
  SCENE_IDS,
  shuffleTargetPositions,
  type HideScene,
  type HideTarget,
  type SceneId,
} from './logic'
import {
  advanceSoftErrorChain,
  createSoftErrorChain,
  recordSoftSuccess,
  resetSoftErrorChain,
} from '../../shared/soft-error-chain'
import { pickHideFoundPraise, pickHideRoundPraise } from './praise'
import {
  playHideFound,
  playHideMiss,
  playHideRoundComplete,
} from './hide-seek-sfx'
import './hide-seek.css'

const PICTURE_HINT_MS = 2600

export const hideSeekGame: GameModule = {
  meta: {
    id: 'hide-seek',
    title: 'Прятки',
    zoneId: 'planet-corners',
    modules: ['2.6'],
  },

  mount(container, context) {
    unmountInternal()

    const audio = createAudioManager({
      soundEnabled: context.settings.soundEnabled,
      musicEnabled: context.settings.musicEnabled,
      quietMode: context.settings.quietMode,
    })
    void audio.unlock()

    let sceneId: SceneId = 'room'
    let activeTargets: HideTarget[] = shuffleTargetPositions(getScene(sceneId).targets)
    let wanted: HideTarget = pickTarget({ ...getScene(sceneId), targets: activeTargets })
    let foundIds = new Set<string>()
    let hintTimer: ReturnType<typeof setTimeout> | null = null
    const timers = createTimerBag()
    let pictureHintTimer: ReturnType<typeof setTimeout> | null = null
    const missChain = createSoftErrorChain()

    root = document.createElement('section')
    root.className = 'hide-seek'
    root.dataset.gameId = 'hide-seek'

    const picker = document.createElement('aside')
    picker.className = 'hide-seek__picker'
    picker.setAttribute('aria-label', 'Локации')

    const play = document.createElement('div')
    play.className = 'hide-seek__play'

    const mission = document.createElement('div')
    mission.className = 'hide-seek__mission'
    mission.setAttribute('aria-live', 'polite')

    const missionIcon = document.createElement('span')
    missionIcon.className = 'hide-seek__mission-icon'
    missionIcon.setAttribute('aria-hidden', 'true')

    const missionCopy = document.createElement('div')
    missionCopy.className = 'hide-seek__mission-copy'

    const missionText = document.createElement('span')
    missionText.className = 'hide-seek__mission-text'

    const missionSep = document.createElement('span')
    missionSep.className = 'hide-seek__mission-sep'
    missionSep.textContent = '·'
    missionSep.hidden = true
    missionSep.setAttribute('aria-hidden', 'true')

    const missionStatus = document.createElement('span')
    missionStatus.className = 'hide-seek__mission-status'

    missionCopy.append(missionText, missionSep, missionStatus)
    mission.append(missionIcon, missionCopy)

    const sceneWrap = document.createElement('div')
    sceneWrap.className = 'hide-seek__scene-wrap'

    const sceneEl = document.createElement('div')
    sceneEl.className = 'hide-seek__scene'
    sceneEl.setAttribute('role', 'img')

    sceneWrap.append(sceneEl)
    play.append(mission, sceneWrap)
    root.append(picker, play)
    container.replaceChildren(root)

    context.onTaskVisual?.(null)

    function currentScene(): HideScene {
      return { ...getScene(sceneId), targets: activeTargets }
    }

    function refreshLayout(): void {
      activeTargets = shuffleTargetPositions(getScene(sceneId).targets)
    }

    function setGameStatus(message: string): void {
      const trimmed = message.trim()
      missionStatus.textContent = trimmed
      missionSep.hidden = !trimmed
      context.onSoftHint?.('')
    }

    function updateMissionBar(): void {
      missionIcon.className = `hide-seek__mission-icon ${placeholderClass(wanted.shape, wanted.color)}`
      missionText.textContent = findPrompt(wanted)
    }

    function clearPictureHint(): void {
      if (pictureHintTimer) {
        clearTimeout(pictureHintTimer)
        pictureHintTimer = null
      }
      root?.querySelector('.hide-seek__picture-hint')?.remove()
    }

    function showPictureHint(target: HideTarget): void {
      clearPictureHint()
      const hint = document.createElement('div')
      hint.className = 'hide-seek__picture-hint'
      hint.setAttribute('role', 'status')

      const visual = document.createElement('span')
      visual.className = placeholderClass(target.shape, target.color)
      visual.setAttribute('aria-hidden', 'true')

      const text = document.createElement('p')
      text.className = 'hide-seek__picture-hint-text'
      text.textContent = findPrompt(target)

      hint.append(visual, text)
      root!.append(hint)
      requestAnimationFrame(() => hint.classList.add('is-visible'))

      pictureHintTimer = setTimeout(() => {
        hint.classList.remove('is-visible')
        pictureHintTimer = setTimeout(() => hint.remove(), 420)
      }, PICTURE_HINT_MS)
    }

    function clearHintTimer(): void {
      if (hintTimer) {
        clearTimeout(hintTimer)
        hintTimer = null
      }
      sceneEl
        .querySelectorAll('.is-hinting')
        .forEach((el) => el.classList.remove('is-hinting'))
    }

    function armHint(): void {
      clearHintTimer()
      if (context.settings.quietMode) return
      hintTimer = setTimeout(() => {
        const targetBtn = sceneEl.querySelector<HTMLElement>(
          `[data-target-id="${wanted.id}"]:not(.is-found)`,
        )
        targetBtn?.classList.add('is-hinting')
        mission.classList.add('is-pulse')
        window.setTimeout(() => mission.classList.remove('is-pulse'), 800)
        showPictureHint(wanted)
      }, HIDE_SEEK_HINT_IDLE_MS)
    }

    function clearSoftHighlights(): void {
      sceneEl
        .querySelectorAll('.is-soft-highlight')
        .forEach((el) => el.classList.remove('is-soft-highlight'))
    }

    function highlightWanted(): void {
      clearSoftHighlights()
      sceneEl
        .querySelector(`.hide-seek__target[data-target-id="${wanted.id}"]:not(.is-found)`)
        ?.classList.add('is-soft-highlight')
    }

    function setWanted(next: HideTarget): void {
      wanted = next
      root!.dataset.wanted = wanted.id
      updateMissionBar()
    }

    function askNext(): void {
      resetSoftErrorChain(missChain)
      clearSoftHighlights()
      clearPictureHint()
      const scene = currentScene()
      const remaining = scene.targets.filter((t) => !foundIds.has(t.id))
      if (remaining.length === 0) {
        foundIds = new Set()
        sceneEl.classList.add('is-round-complete')
        playHideRoundComplete(audio)
        setGameStatus(pickHideRoundPraise())
        window.setTimeout(() => {
          sceneEl.classList.remove('is-round-complete')
          refreshLayout()
          setWanted(pickTarget(currentScene()))
          setGameStatus('Новое задание!')
          renderScene()
          armHint()
        }, 1400)
        return
      }
      setWanted(pickTarget(scene, [...foundIds]))
      setGameStatus('Ищи дальше!')
      renderScene()
      armHint()
    }

    function renderPicker(): void {
      picker.replaceChildren()
      for (const id of SCENE_IDS) {
        const scene = getScene(id)
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'hide-seek__pick touch-btn'
        if (id === sceneId) btn.classList.add('is-active')
        btn.dataset.sceneId = id
        btn.setAttribute('aria-label', scene.titleRu)

        const preview = document.createElement('span')
        preview.className = 'hide-seek__pick-preview'
        preview.dataset.pattern = scene.pattern
        preview.setAttribute('aria-hidden', 'true')
        btn.append(preview)
        btn.addEventListener('click', () => {
          sceneId = id
          foundIds = new Set()
          resetSoftErrorChain(missChain)
          root!.dataset.scene = sceneId
          refreshLayout()
          setWanted(pickTarget(currentScene()))
          setGameStatus('Новая локация!')
          renderPicker()
          renderScene()
          armHint()
        })
        picker.append(btn)
      }
    }

    function syncChromeSceneLabel(): void {
      context.onChromeSceneLabel?.(getScene(sceneId).titleRu)
    }

    function renderScene(): void {
      clearHintTimer()
      const scene = currentScene()
      syncChromeSceneLabel()
      sceneEl.dataset.scene = sceneId
      sceneEl.dataset.pattern = scene.pattern
      sceneEl.setAttribute('aria-label', scene.titleRu)
      sceneEl.replaceChildren()

      const miss = document.createElement('button')
      miss.type = 'button'
      miss.className = 'hide-seek__miss'
      miss.setAttribute('aria-label', 'Сцена')
      miss.addEventListener('click', () => {
        armHint()
      })
      sceneEl.append(miss)

      for (const target of scene.targets) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'hide-seek__target'
        btn.dataset.targetId = target.id
        btn.style.left = `${target.xPct}%`
        btn.style.top = `${target.yPct}%`
        btn.setAttribute('aria-label', target.labelRu)
        if (foundIds.has(target.id)) btn.classList.add('is-found')

        const visual = document.createElement('span')
        visual.className = placeholderClass(target.shape, target.color)
        visual.setAttribute('aria-hidden', 'true')
        btn.append(visual)

        btn.addEventListener('click', (event) => {
          event.stopPropagation()
          const result = evaluateTap(target.id, wanted.id)
          if (result.found) {
            recordSoftSuccess(missChain)
            clearSoftHighlights()
            clearPictureHint()
            foundIds.add(target.id)
            btn.classList.add('is-found')
            btn.classList.remove('is-hinting', 'is-soft-highlight')
            playHideFound(audio)
            setGameStatus(`${pickHideFoundPraise()} ${target.labelRu}.`)
            window.setTimeout(() => askNext(), 520)
            return
          }
          playHideMiss(audio)
          const step = advanceSoftErrorChain(missChain, {
            repeat: findPrompt(wanted),
            nudge: findPrompt(wanted),
            beforeHighlight: findPrompt(wanted),
          })
          btn.classList.add('soft-wiggle')
          timers.track(window.setTimeout(() => btn.classList.remove('soft-wiggle'), 450))
          setGameStatus(step.message)
          mission.classList.add('is-pulse')
          timers.track(window.setTimeout(() => mission.classList.remove('is-pulse'), 700))
          if (step.shouldHighlight) highlightWanted()
          showPictureHint(wanted)
          armHint()
        })

        sceneEl.append(btn)
      }
    }

    root.dataset.scene = sceneId
    renderPicker()
    renderScene()
    setWanted(wanted)
    setGameStatus('Тапни предмет на картинке.')
    armHint()

    cleanup = () => {
      timers.clear()
      clearHintTimer()
      clearPictureHint()
      context.onTaskVisual?.(null)
      context.onChromeSceneLabel?.('')
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
