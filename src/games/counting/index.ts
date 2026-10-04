import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { playCelebrationTune, playDropSound, playPickupSound, playSoftMiss } from '../../shared/hub-sounds'
import { softPopHaptic } from '../../shared/haptics'
import { createGameChromeButton, createGameSettingsButton, createGameToolButton } from '../../shared/game-chrome'
import { createGamePresenter } from '../../shared/game-presenter'
import type { PresenterPose } from '../../shared/companion'
import { uiIconUrl } from '../../shared/ui-icon'
import {
  isToyKind,
  TOY_BIN,
  TOY_KINDS,
  toyArtUrl,
  toyBinClipPath,
  toyBinUrl,
  type ToyColor,
  type ToyKind,
} from '../../shared/toys'
import { countingBgUrl, countingVoiceUrl, digitUrl } from './art'
import {
  advanceProgress,
  biggerSide,
  boxSlots,
  buildTask,
  checkAdd,
  checkGive,
  checkRemove,
  createProgress,
  enabledTaskTypes,
  mixedColors,
  nextTaskType,
  rugSlots,
  taskMax,
  type CountTask,
} from './logic'
import {
  addLine,
  allInLine,
  compareLine,
  COMPARE_YES_LINE,
  countLine,
  countTaskLine,
  createLinePicker,
  EMPTY_LINES,
  freeStartLine,
  giveLine,
  howManyLine,
  kindLine,
  lessLine,
  moreLine,
  NEXT_LINES,
  numLine,
  PRAISE_LINES,
  PUT_BACK_LINE,
  removeLine,
  TASK_START_LINE,
  TOGETHER_LINES,
  TOO_MANY_LINE,
  type VoiceLine,
} from './phrases'
import { capitalizeRu, numberWordRu, toyCountRu, toyGender, toyOneRu } from './words'
import './counting.css'

/** Последняя выбранная игрушка — встречает при следующем входе. */
const TOY_KEY = 'meow-planet.counting-toy'
const DRAG_START_PX = 10
const CLICK_AFTER_TAP_MS = 600
const POSE_RESET_MS = 1600
const VOICE_WAIT_CAP_MS = 6000
const COUNT_STEP_MS = 650
const HINT_REPEAT_MS = 6000
const HINT_GLOW_MS = 12000
const TASK_INTRO_MS = 1600
const PARTY_MS = 2400

/** Игрушка в ряду выбора и на плитке «Игрушки». */
const SHOW_COLOR: Record<ToyKind, ToyColor> = {
  ball: 'red',
  cube: 'blue',
  star: 'yellow',
  pyramid: 'green',
  heart: 'red',
  duck: 'yellow',
  ring: 'blue',
}

type Mode = 'free' | 'task'
/** box-rug — ящик и коврик; box — один ящик посередине; boxes — два ящика; rug — только коврик. */
type Layout = 'box-rug' | 'box' | 'boxes' | 'rug'

type Toy = {
  id: string
  el: HTMLButtonElement
  slot: { x: number; y: number; rot: number }
  box: number | null
  counted: number
}

type Box = { el: HTMLElement; inside: HTMLElement; hit: HTMLButtonElement; digit: HTMLImageElement; ids: string[] }

type Press = { id: string; pointerId: number; x: number; y: number; dragging: boolean }

function loadToy(): ToyKind {
  try {
    const saved = localStorage.getItem(TOY_KEY)
    return isToyKind(saved) ? saved : 'cube'
  } catch {
    return 'cube'
  }
}

function saveToy(kind: ToyKind): void {
  try {
    localStorage.setItem(TOY_KEY, kind)
  } catch {
    /* память браузера недоступна — выбор просто не запомнится */
  }
}

export const countingGame: GameModule = {
  meta: {
    id: 'counting',
    title: 'Учимся считать',
    zoneId: 'star-workshop',
    modules: ['2.18'],
  },

  mount(container, context) {
    unmountInternal()
    const settings = context.settings
    const limit = settings.countingLimit
    const types = enabledTaskTypes(settings.countingTasks ?? ['give', 'count', 'addRemove', 'howMany', 'compare'])
    const autoHints = settings.countingAutoHints ?? true
    const audio = createAudioManager({
      soundEnabled: settings.soundEnabled,
      musicEnabled: settings.musicEnabled,
      quietMode: settings.quietMode,
    })
    void audio.unlock()

    const still =
      settings.quietMode || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
    const pick = createLinePicker()
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const hintTimers = new Set<ReturnType<typeof setTimeout>>()
    let alive = true
    let gen = 0
    let step = 0
    let roundNo = 0
    let mode: Mode = 'free'
    let kind: ToyKind = loadToy()
    let task: CountTask | null = null
    let progress = createProgress()
    let busy = false
    let doneStep = -1
    let misses = 0
    let counted = 0
    let press: Press | null = null
    let lastPointerTapAt = 0
    let speechText = ''
    let poseReset: ReturnType<typeof setTimeout> | undefined
    let voicePlaying = false
    const toys = new Map<string, Toy>()
    let boxes: Box[] = []

    const later = (ms: number, fn: () => void, bag = timers): void => {
      const g = gen
      const t = setTimeout(() => {
        bag.delete(t)
        if (alive && g === gen) fn()
      }, ms)
      bag.add(t)
    }
    const clearBag = (bag: Set<ReturnType<typeof setTimeout>>): void => {
      for (const t of bag) clearTimeout(t)
      bag.clear()
    }

    const rootEl = document.createElement('section')
    rootEl.className = 'counting'
    rootEl.dataset.gameId = 'counting'
    rootEl.dataset.mode = 'free'
    rootEl.dataset.toy = kind
    if (still) rootEl.classList.add('counting--still')

    const bg = document.createElement('img')
    bg.className = 'counting__bg'
    bg.alt = ''
    bg.setAttribute('aria-hidden', 'true')
    bg.decoding = 'async'
    bg.src = countingBgUrl()

    // ── Шапка: назад + звук слева; справа режимы, «Игрушки», «Заново», «Подсказка», шестерёнка ──
    const bar = document.createElement('header')
    bar.className = 'counting__bar'
    const barNav = document.createElement('div')
    barNav.className = 'counting__bar-nav'
    const backBtn = createGameChromeButton('Назад в меню', 'back', () => context.hubNavigation?.goMenu())
    const soundBtn = createGameChromeButton('Звук', 'sound-on', () => toggleSound())
    let soundOn = settings.soundEnabled || settings.musicEnabled
    const syncSound = (): void => {
      soundBtn.dataset.on = soundOn ? '1' : '0'
      soundBtn.setAttribute('aria-label', soundOn ? 'Звук включён' : 'Звук выключен')
      const icon = soundBtn.querySelector<HTMLImageElement>('img.ui-icon')
      if (icon) icon.src = uiIconUrl(soundOn ? 'sound-on' : 'sound-off')
    }
    syncSound()
    function toggleSound(): void {
      soundOn = !soundOn
      syncSound()
      audio.updateSettings({ soundEnabled: soundOn, musicEnabled: soundOn, quietMode: settings.quietMode })
      context.hubNavigation?.onSoundToggle?.(soundOn)
    }
    barNav.append(backBtn, soundBtn)

    const barTools = document.createElement('div')
    barTools.className = 'counting__bar-tools'
    const modes = document.createElement('div')
    modes.className = 'counting__modes'
    modes.dataset.role = 'modes'
    const modeBtn = (label: string, next: Mode): HTMLButtonElement => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'touch-btn counting__mode-btn'
      btn.textContent = label
      btn.setAttribute('aria-label', label)
      btn.addEventListener('click', () => setMode(next))
      return btn
    }
    const freeBtn = modeBtn('Свободно', 'free')
    const taskBtn = modeBtn('Задание', 'task')
    modes.append(freeBtn, taskBtn)

    const toysBtn = createGameToolButton('Игрушки', 'hint', () => toggleToysPop())
    toysBtn.dataset.role = 'toys'
    toysBtn.classList.add('counting__toys-btn')
    const toysIcon = toysBtn.querySelector<HTMLImageElement>('.game-tool__icon')!
    const againBtn = createGameToolButton('Заново', 'sheet', () => again())
    againBtn.dataset.role = 'again'
    const hintBtn = createGameToolButton('Подсказка', 'hint', () => showHint())
    hintBtn.dataset.role = 'hint'
    hintBtn.hidden = true
    const goSettings = context.hubNavigation?.goSettings
    const settingsBtn = createGameSettingsButton(goSettings ? () => goSettings() : undefined)
    barTools.append(modes, toysBtn, againBtn, hintBtn, settingsBtn)
    bar.append(barNav, barTools)

    const toysPop = document.createElement('div')
    toysPop.className = 'counting__toys-pop'
    toysPop.setAttribute('aria-label', 'Чем считаем')
    toysPop.hidden = true
    for (const k of TOY_KINDS) {
      const choice = document.createElement('button')
      choice.type = 'button'
      choice.className = 'counting__toys-choice'
      choice.dataset.kind = k
      choice.setAttribute('aria-label', capitalizeRu(toyOneRu(k)))
      const img = document.createElement('img')
      img.alt = ''
      img.draggable = false
      img.decoding = 'async'
      img.src = toyArtUrl(k, SHOW_COLOR[k])
      choice.append(img)
      choice.addEventListener('click', () => chooseToy(k))
      toysPop.append(choice)
    }

    // ── Сцена: ящики и коврик, внизу цифры ──
    const stage = document.createElement('div')
    stage.className = 'counting__stage'
    const scene = document.createElement('div')
    scene.className = 'counting__scene'
    const boxesWrap = document.createElement('div')
    boxesWrap.className = 'counting__boxes'
    const rug = document.createElement('div')
    rug.className = 'counting__rug'
    rug.setAttribute('aria-label', 'Коврик с игрушками')
    scene.append(boxesWrap, rug)
    stage.append(scene)

    const digits = document.createElement('div')
    digits.className = 'counting__digits'
    digits.setAttribute('aria-label', 'Цифры')
    const digitEls = new Map<number, HTMLButtonElement>()
    for (let n = 1; n <= limit; n += 1) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'counting__digit'
      btn.dataset.n = String(n)
      btn.setAttribute('aria-label', capitalizeRu(numberWordRu(n)))
      const img = document.createElement('img')
      img.alt = ''
      img.draggable = false
      img.decoding = 'async'
      img.src = digitUrl(n)
      btn.append(img)
      btn.addEventListener('click', () => onDigit(n))
      digitEls.set(n, btn)
      digits.append(btn)
    }
    digits.style.setProperty('--digits', String(limit))

    const presenter = createGamePresenter(settings.companion)
    const dragLayer = document.createElement('div')
    dragLayer.className = 'counting__drag-layer'
    dragLayer.setAttribute('aria-hidden', 'true')
    const sparkles = document.createElement('div')
    sparkles.className = 'counting__sparkles'
    sparkles.setAttribute('aria-hidden', 'true')
    for (let i = 0; i < 14; i += 1) {
      const s = document.createElement('span')
      s.className = 'counting__sparkle'
      s.style.setProperty('--i', String(i))
      sparkles.append(s)
    }

    rootEl.append(bg, stage, digits, presenter.element, sparkles, bar, toysPop, dragLayer)
    container.replaceChildren(rootEl)

    // ── Ведущий ──
    function say(line: VoiceLine, pose: PresenterPose = 'idle'): void {
      speechText = line.text
      presenter.setLine(speechText, pose)
      if (poseReset !== undefined) {
        clearTimeout(poseReset)
        timers.delete(poseReset)
        poseReset = undefined
      }
      if (pose !== 'idle') {
        const t = setTimeout(() => {
          timers.delete(t)
          poseReset = undefined
          if (alive) presenter.setLine(speechText, 'idle')
        }, POSE_RESET_MS)
        poseReset = t
        timers.add(t)
      }
      const url = countingVoiceUrl(line.file)
      voicePlaying = Boolean(url)
      if (url) void audio.playUrl('voice', url, { volume: 0.86 })
    }

    /** Следующий шаг — после фразы (если есть голос) и не раньше `ms`; смена раунда отменяет. */
    function afterLine(ms: number, fn: () => void): void {
      if (!voicePlaying) {
        later(ms, fn)
        return
      }
      const g = gen
      const minDelay = new Promise<void>((resolve) => later(ms, resolve))
      const cap = new Promise<void>((resolve) => later(VOICE_WAIT_CAP_MS, resolve))
      void Promise.all([Promise.race([audio.waitUntilVoiceEnded(), cap]), minDelay]).then(() => {
        if (alive && g === gen) fn()
      })
    }

    /** Пауза в цепочке; если раунд сменился — цепочка просто не продолжается. */
    const pause = (ms: number): Promise<void> => new Promise((resolve) => afterLine(ms, resolve))

    // ── Ящики и коврик ──
    const clip = toyBinClipPath()
    const g = TOY_BIN
    const showBoxDigits = (): boolean => rootEl.dataset.layout === 'box-rug'
    const pct = (v: number): string => `${(v * 100).toFixed(2)}%`

    function createBox(index: number): Box {
      const el = document.createElement('div')
      el.className = 'counting__box'
      el.dataset.box = String(index)
      el.style.setProperty('--bin-aspect', String(g.aspect))
      const art = document.createElement('img')
      art.className = 'counting__box-art'
      art.alt = ''
      art.draggable = false
      art.src = toyBinUrl()
      const hit = document.createElement('button')
      hit.type = 'button'
      hit.className = 'counting__box-hit'
      hit.setAttribute('aria-label', 'Ящик — посчитать')
      hit.addEventListener('click', () => onBoxTap(index))
      const digit = document.createElement('img')
      digit.className = 'counting__box-digit'
      digit.alt = ''
      digit.draggable = false
      digit.hidden = true
      digit.style.left = pct(g.sticker.x)
      digit.style.top = pct(g.sticker.y)
      const inside = document.createElement('div')
      inside.className = 'counting__box-inside'
      inside.style.clipPath = clip
      el.append(art, hit, digit, inside)
      return { el, inside, hit, digit, ids: [] }
    }

    function createToy(id: string, color: ToyColor, slot: Toy['slot']): Toy {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'counting__toy'
      el.dataset.toyId = id
      el.dataset.kind = kind
      el.dataset.color = color
      el.setAttribute('aria-label', capitalizeRu(toyOneRu(kind)))
      const img = document.createElement('img')
      img.className = 'counting__toy-art'
      img.alt = ''
      img.draggable = false
      img.decoding = 'async'
      img.src = toyArtUrl(kind, color)
      el.append(img)
      el.addEventListener('click', (event) => {
        const afterPointerTap = lastPointerTapAt > 0 && performance.now() - lastPointerTapAt < CLICK_AFTER_TAP_MS
        if (event.detail !== 0 && afterPointerTap) return
        onToyTap(id)
      })
      return { id, el, slot, box: null, counted: 0 }
    }

    function placeOnRug(toy: Toy): void {
      const el = toy.el
      el.classList.remove('is-dragging')
      el.style.removeProperty('width')
      el.style.removeProperty('z-index')
      el.style.left = pct(toy.slot.x)
      el.style.top = pct(toy.slot.y)
      el.style.setProperty('--rot', `${toy.slot.rot}deg`)
      if (el.parentElement !== rug) rug.append(el)
    }

    function renderBox(index: number): void {
      const box = boxes[index]
      if (!box) return
      const slots = boxSlots(box.ids.length)
      box.ids.forEach((id, i) => {
        const toy = toys.get(id)
        const s = slots[i]
        if (!toy || !s) return
        const el = toy.el
        el.classList.remove('is-dragging')
        el.style.left = pct(g.opening.x + s.x * g.opening.w)
        el.style.top = pct(g.opening.y + s.y * g.opening.h)
        el.style.width = pct(s.scale * g.opening.w)
        el.style.zIndex = String(Math.round(s.y * 10))
        el.style.setProperty('--rot', `${s.rot}deg`)
        if (el.parentElement !== box.inside) box.inside.append(el)
      })
      const n = box.ids.length
      box.el.dataset.count = String(n)
      box.digit.hidden = !(showBoxDigits() && n > 0)
      if (!box.digit.hidden) box.digit.src = digitUrl(n)
      if (index === 0) rootEl.dataset.count = String(n)
    }

    /** FLIP: элемент «прилетает» из старого места в новое. */
    function moveWithFlight(el: HTMLElement, move: () => void): void {
      const from = el.getBoundingClientRect()
      move()
      if (still || typeof el.animate !== 'function') return
      const to = el.getBoundingClientRect()
      const dx = from.left + from.width / 2 - (to.left + to.width / 2)
      const dy = from.top + from.height / 2 - (to.top + to.height / 2)
      if (!dx && !dy) return
      el.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], {
        duration: 340,
        easing: 'cubic-bezier(.25,.9,.35,1.15)',
      })
    }

    function wiggle(el: HTMLElement | null | undefined, cls: string, ms: number): void {
      if (!el) return
      el.classList.remove(cls)
      void el.offsetWidth
      el.classList.add(cls)
      later(ms, () => el.classList.remove(cls))
    }

    function buildRound(layout: Layout, onRug: number, inBoxes: readonly number[]): void {
      toys.clear()
      rug.replaceChildren()
      dragLayer.replaceChildren()
      boxesWrap.replaceChildren()
      rootEl.dataset.layout = layout
      rootEl.dataset.toy = kind
      boxes = inBoxes.map((_, i) => createBox(i))
      boxesWrap.append(...boxes.map((b) => b.el))
      const total = onRug + inBoxes.reduce((a, b) => a + b, 0)
      const colors = mixedColors(total, Math.random)
      const layoutRug = rugSlots(total, Math.random)
      rug.style.setProperty('--toy-w', layoutRug.toyW.toFixed(3))
      let i = 0
      const make = (): Toy => {
        const toy = createToy(`t${i}`, colors[i]!, layoutRug.slots[i]!)
        toys.set(toy.id, toy)
        i += 1
        return toy
      }
      for (let k = 0; k < onRug; k += 1) placeOnRug(make())
      inBoxes.forEach((count, b) => {
        for (let k = 0; k < count; k += 1) {
          const toy = make()
          toy.box = b
          boxes[b]!.ids.push(toy.id)
        }
      })
      boxes.forEach((_, b) => renderBox(b))
      if (!boxes.length) rootEl.dataset.count = '0'
    }

    const rugCount = (): number => [...toys.values()].filter((t) => t.box === null).length
    const boxCount = (index = 0): number => boxes[index]?.ids.length ?? 0

    function newRound(): void {
      gen += 1
      step += 1
      roundNo += 1
      rootEl.dataset.round = String(roundNo)
      clearBag(timers)
      clearBag(hintTimers)
      audio.stopVoice()
      busy = false
      misses = 0
      counted = 0
      press = null
      clearGlow()
      rootEl.classList.remove('is-party')
      sparkles.classList.remove('is-on')
    }

    // ── Свободно ──
    function startFree(opening: 'start' | 'kind'): void {
      newRound()
      task = null
      for (const key of ['task', 'target', 'start', 'left', 'right'] as const) delete rootEl.dataset[key]
      buildRound('box-rug', limit, [0])
      say(opening === 'kind' ? kindLine(kind) : freeStartLine(kind))
    }

    function party(): void {
      rootEl.classList.add('is-party')
      sparkles.classList.remove('is-on')
      void sparkles.offsetWidth
      sparkles.classList.add('is-on')
      later(PARTY_MS, () => {
        rootEl.classList.remove('is-party')
        sparkles.classList.remove('is-on')
      })
    }

    function putIn(id: string): void {
      const toy = toys.get(id)
      const box = boxes[0]
      if (!toy || !box || toy.box !== null) return
      toy.box = 0
      box.ids.push(id)
      moveWithFlight(toy.el, () => renderBox(0))
      wiggle(box.el, 'is-bump', 380)
      playDropSound(audio)
      softPopHaptic(settings.quietMode)
      step += 1
      const n = box.ids.length
      if (task) {
        onTaskChange()
        return
      }
      if (rugCount() === 0) {
        say(allInLine(kind), 'happy')
        const s = step
        afterLine(1500, () => {
          if (s !== step) return
          say(countLine(kind, n), 'happy')
          playCelebrationTune(audio)
          party()
        })
        return
      }
      say(countLine(kind, n), 'happy')
    }

    function takeOut(id: string): void {
      const toy = toys.get(id)
      if (!toy || toy.box === null) return
      const box = boxes[toy.box]!
      box.ids = box.ids.filter((x) => x !== id)
      toy.box = null
      moveWithFlight(toy.el, () => {
        placeOnRug(toy)
        renderBox(boxes.indexOf(box))
      })
      playPickupSound(audio)
      step += 1
      rootEl.classList.remove('is-party')
      if (task) {
        onTaskChange()
        return
      }
      const n = box.ids.length
      say(n === 0 ? pick('empty', EMPTY_LINES) : lessLine(n))
    }

    async function recount(index: number): Promise<void> {
      const box = boxes[index]
      if (!box) return
      const ids = [...box.ids]
      if (!ids.length) {
        say(pick('empty', EMPTY_LINES))
        return
      }
      busy = true
      const words: string[] = []
      for (const [i, id] of ids.entries()) {
        wiggle(toys.get(id)?.el, 'is-bounce', 480)
        words.push(i === 0 ? capitalizeRu(numberWordRu(1)) : numberWordRu(i + 1))
        say({ file: numLine(i + 1).file, text: words.join(', ') })
        await pause(COUNT_STEP_MS)
      }
      const final = countLine(kind, ids.length)
      say({ file: final.file, text: `${words.join(', ')} — ${toyCountRu(kind, ids.length)}!` }, 'happy')
      await pause(900)
      busy = false
    }

    function again(): void {
      closeToysPop()
      if (mode === 'task') {
        startTask(false)
        return
      }
      newRound()
      for (const box of boxes) {
        for (const id of [...box.ids]) {
          const toy = toys.get(id)
          if (!toy) continue
          toy.box = null
          moveWithFlight(toy.el, () => placeOnRug(toy))
        }
        box.ids = []
      }
      boxes.forEach((_, i) => renderBox(i))
      playPickupSound(audio)
      say(freeStartLine(kind))
    }

    // ── Задание ──
    function taskLine(): VoiceLine | null {
      if (!task) return null
      switch (task.type) {
        case 'give':
          return giveLine(kind, task.target)
        case 'count':
          return countTaskLine(kind)
        case 'add':
          return addLine(toyGender(kind))
        case 'remove':
          return removeLine(toyGender(kind))
        case 'howMany':
          return howManyLine(kind)
        case 'compare':
          return compareLine(kind)
      }
    }

    function startTask(intro: boolean): void {
      newRound()
      const type = nextTaskType(progress, types)
      const t = buildTask(type, taskMax(progress, limit), Math.random)
      task = t
      for (const key of ['target', 'start', 'left', 'right'] as const) delete rootEl.dataset[key]
      rootEl.dataset.task = t.type
      switch (t.type) {
        case 'give':
          rootEl.dataset.target = String(t.target)
          buildRound('box-rug', t.rug, [0])
          break
        case 'count':
          rootEl.dataset.target = String(t.target)
          buildRound('rug', t.target, [])
          break
        case 'add':
          rootEl.dataset.start = String(t.start)
          buildRound('box-rug', t.rug, [t.start])
          break
        case 'remove':
          rootEl.dataset.start = String(t.start)
          buildRound('box-rug', 0, [t.start])
          break
        case 'howMany':
          rootEl.dataset.target = String(t.target)
          buildRound('box', 0, [t.target])
          break
        case 'compare':
          rootEl.dataset.left = String(t.left)
          rootEl.dataset.right = String(t.right)
          buildRound('boxes', 0, [t.left, t.right])
          break
      }
      if (intro) {
        say(TASK_START_LINE)
        afterLine(TASK_INTRO_MS, announceTask)
      } else {
        announceTask()
      }
    }

    function announceTask(): void {
      if (!task) return
      if (task.type === 'add' || task.type === 'remove') {
        say(countLine(kind, task.start))
        afterLine(1400, () => {
          const line = taskLine()
          if (line) say(line)
          armHints()
        })
        return
      }
      const line = taskLine()
      if (line) say(line)
      armHints()
    }

    function soft(line: VoiceLine): void {
      playSoftMiss(audio)
      misses += 1
      say(line, 'miss')
      if (misses >= 2) showGlow()
      armHints()
    }

    function onTaskChange(): void {
      if (!task) return
      clearGlow()
      const n = boxCount()
      if (task.type === 'give') {
        const result = checkGive(n, task.target)
        if (result === 'too-many') {
          soft(TOO_MANY_LINE)
          return
        }
        say(n === 0 ? pick('empty', EMPTY_LINES) : countLine(kind, n), result === 'done' ? 'happy' : 'idle')
        if (result === 'done') {
          const s = step
          const target = task.target
          doneStep = s
          clearBag(hintTimers)
          afterLine(900, () => {
            if (s === step && boxCount() === target) void success(null)
          })
          return
        }
        armHints()
        return
      }
      if (task.type === 'add' || task.type === 'remove') {
        const adding = task.type === 'add'
        const result = adding ? checkAdd(n, task.start) : checkRemove(n, task.start)
        const again = adding ? addLine(toyGender(kind)) : removeLine(toyGender(kind))
        if (result === 'done') void success(adding ? moreLine(n) : lessLine(n))
        else if (result === 'too-many') soft(adding ? TOO_MANY_LINE : PUT_BACK_LINE)
        else if (result === 'wrong-way') soft(again)
        else {
          say(again)
          armHints()
        }
      }
    }

    async function success(first: VoiceLine | null): Promise<void> {
      busy = true
      clearBag(hintTimers)
      clearGlow()
      if (first) {
        say(first, 'happy')
        await pause(900)
      }
      playCelebrationTune(audio)
      party()
      say(pick('praise', PRAISE_LINES), 'happy')
      progress = advanceProgress(progress)
      await pause(1400)
      if (Math.random() < 0.5) {
        say(pick('next', NEXT_LINES))
        await pause(900)
      }
      startTask(false)
    }

    function countToy(toy: Toy): void {
      if (!task || task.type !== 'count') return
      if (toy.counted) {
        wiggle(toy.el, 'is-wiggle', 450)
        return
      }
      clearGlow()
      counted += 1
      toy.counted = counted
      const badge = document.createElement('span')
      badge.className = 'counting__badge'
      badge.textContent = String(counted)
      toy.el.append(badge)
      toy.el.classList.add('is-counted')
      wiggle(toy.el, 'is-bounce', 480)
      say(numLine(counted))
      if (counted >= task.target) {
        busy = true
        clearBag(hintTimers)
        const total = task.target
        afterLine(600, () => void success(countLine(kind, total)))
        return
      }
      armHints()
    }

    /** Ошибка в «Сколько?» и «Где больше?»: мягкий звук, посчитаем вместе, после 2 — сияние. */
    function wrongAnswer(): void {
      playSoftMiss(audio)
      misses += 1
      if (misses >= 2) showGlow()
      say(pick('together', TOGETHER_LINES), 'miss')
      busy = true
      clearBag(hintTimers)
      const g0 = gen
      afterLine(1200, () => {
        void (async () => {
          for (let i = 0; i < boxes.length; i += 1) await recount(i)
          if (g0 !== gen) return
          busy = false
          const line = taskLine()
          if (line) say(line)
          armHints()
        })()
      })
    }

    // ── Подсказки ──
    function clearGlow(): void {
      for (const el of rootEl.querySelectorAll('.is-glow')) el.classList.remove('is-glow')
    }

    function showGlow(): void {
      if (!task) return
      clearGlow()
      const firstRug = [...toys.values()].find((t) => t.box === null)?.el
      const lastInBox = (): HTMLElement | undefined => {
        const id = boxes[0]?.ids[boxes[0].ids.length - 1]
        return id ? toys.get(id)?.el : undefined
      }
      let el: HTMLElement | undefined
      switch (task.type) {
        case 'give': {
          const n = boxCount()
          el = n < task.target ? firstRug : n > task.target ? lastInBox() : boxes[0]?.el
          break
        }
        case 'count':
          el = [...toys.values()].find((t) => !t.counted)?.el
          break
        case 'add':
          el = firstRug
          break
        case 'remove':
          el = lastInBox()
          break
        case 'howMany':
          el = digitEls.get(task.target)
          break
        case 'compare':
          el = boxes[biggerSide(task) === 'left' ? 0 : 1]?.el
          break
      }
      el?.classList.add('is-glow')
    }

    function armHints(): void {
      clearBag(hintTimers)
      if (!autoHints || !task) return
      later(
        HINT_REPEAT_MS,
        () => {
          const line = taskLine()
          if (!busy && line) say(line)
        },
        hintTimers,
      )
      later(HINT_GLOW_MS, () => !busy && showGlow(), hintTimers)
    }

    function showHint(): void {
      if (!task || busy) return
      showGlow()
      const line = taskLine()
      if (line) say(line)
      armHints()
    }

    // ── Тапы ──
    const canMoveToys = (): boolean =>
      !task || task.type === 'give' || task.type === 'add' || task.type === 'remove'

    function onToyTap(id: string): void {
      const toy = toys.get(id)
      if (!toy || busy) return
      closeToysPop()
      if (task?.type === 'count') {
        countToy(toy)
        return
      }
      if (toy.box !== null && !canMoveToys()) {
        onBoxTap(toy.box)
        return
      }
      if (!canMoveToys()) return
      if (toy.box === null) putIn(id)
      else takeOut(id)
    }

    function onBoxTap(index: number): void {
      // «Положи N» уже выполнено — ждём похвалу, пересчёт её перебил бы.
      if (busy || doneStep === step) return
      closeToysPop()
      if (task?.type === 'compare') {
        clearGlow()
        if ((index === 0 ? 'left' : 'right') === biggerSide(task)) void success(COMPARE_YES_LINE)
        else wrongAnswer()
        return
      }
      clearBag(hintTimers)
      const g0 = gen
      void recount(index).then(() => {
        if (g0 !== gen || !task) return
        const line = taskLine()
        if (line) say(line)
        armHints()
      })
    }

    function onDigit(n: number): void {
      if (busy) return
      closeToysPop()
      wiggle(digitEls.get(n), 'is-bounce', 480)
      if (task?.type === 'howMany') {
        clearGlow()
        if (n === task.target) void success(countLine(kind, n))
        else wrongAnswer()
        return
      }
      say(numLine(n))
      if (task) armHints()
    }

    // ── Режимы и игрушки ──
    function syncModeButtons(): void {
      const inTask = mode === 'task'
      freeBtn.classList.toggle('is-active', !inTask)
      freeBtn.setAttribute('aria-pressed', inTask ? 'false' : 'true')
      taskBtn.classList.toggle('is-active', inTask)
      taskBtn.setAttribute('aria-pressed', inTask ? 'true' : 'false')
      hintBtn.hidden = !inTask
      rootEl.dataset.mode = mode
    }

    function setMode(next: Mode): void {
      closeToysPop()
      if (mode === next) return
      mode = next
      syncModeButtons()
      if (mode === 'free') startFree('start')
      else startTask(true)
    }

    function syncToysButton(): void {
      toysIcon.src = toyArtUrl(kind, SHOW_COLOR[kind])
      for (const choice of toysPop.querySelectorAll<HTMLElement>('.counting__toys-choice')) {
        const on = choice.dataset.kind === kind
        choice.classList.toggle('is-active', on)
        choice.setAttribute('aria-pressed', on ? 'true' : 'false')
      }
    }

    function closeToysPop(): void {
      toysPop.hidden = true
      toysBtn.classList.remove('is-selected')
    }

    function toggleToysPop(): void {
      const open = toysPop.hidden === true
      toysPop.hidden = !open
      toysBtn.classList.toggle('is-selected', open)
    }

    function chooseToy(next: ToyKind): void {
      closeToysPop()
      if (next === kind) return
      kind = next
      saveToy(kind)
      syncToysButton()
      if (mode === 'free') startFree('kind')
      else startTask(false)
    }

    rootEl.addEventListener('pointerdown', (event) => {
      if (toysPop.hidden) return
      const target = event.target as HTMLElement
      if (toysPop.contains(target) || toysBtn.contains(target)) return
      closeToysPop()
    })

    // ── Перетаскивание: с коврика в ящик и из ящика обратно ──
    function boxAt(x: number, y: number): number | null {
      for (const [i, box] of boxes.entries()) {
        const r = box.el.getBoundingClientRect()
        const padX = r.width * 0.12
        if (x >= r.left - padX && x <= r.right + padX && y >= r.top - r.height * 0.5 && y <= r.bottom + r.height * 0.1) {
          return i
        }
      }
      return null
    }

    function moveDragged(el: HTMLElement, clientX: number, clientY: number): void {
      const r = rootEl.getBoundingClientRect()
      el.style.left = `${clientX - r.left}px`
      el.style.top = `${clientY - r.top}px`
      const over = boxAt(clientX, clientY)
      boxes.forEach((box, i) => box.el.classList.toggle('is-drop-hover', i === over))
    }

    function startDrag(p: Press, toy: Toy, clientX: number, clientY: number): void {
      p.dragging = true
      const w = toy.el.getBoundingClientRect().width
      toy.el.style.width = `${w || 96}px`
      toy.el.classList.add('is-dragging')
      dragLayer.append(toy.el)
      moveDragged(toy.el, clientX, clientY)
      playPickupSound(audio)
    }

    function restore(toy: Toy): void {
      moveWithFlight(toy.el, () => {
        if (toy.box === null) placeOnRug(toy)
        else renderBox(toy.box)
      })
    }

    function endPress(clientX: number, clientY: number, cancelled: boolean): void {
      const p = press
      press = null
      if (!p) return
      for (const box of boxes) box.el.classList.remove('is-drop-hover')
      const toy = toys.get(p.id)
      if (!toy) return
      if (!p.dragging) {
        if (cancelled) return
        lastPointerTapAt = performance.now()
        onToyTap(p.id)
        return
      }
      const over = cancelled ? null : boxAt(clientX, clientY)
      if (busy) restore(toy)
      else if (toy.box === null && over === 0) putIn(p.id)
      else if (toy.box !== null && over !== toy.box) takeOut(p.id)
      else restore(toy)
    }

    stage.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (press) return
      const el = (event.target as HTMLElement).closest<HTMLElement>('.counting__toy')
      const id = el?.dataset.toyId
      if (!id || !toys.has(id)) return
      event.preventDefault()
      press = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, dragging: false }
      try {
        stage.setPointerCapture(event.pointerId)
      } catch {
        /* старый WebKit без capture */
      }
    })

    stage.addEventListener('pointermove', (event) => {
      if (!press || event.pointerId !== press.pointerId) return
      const toy = toys.get(press.id)
      if (!toy) return
      if (!press.dragging) {
        if (busy || !canMoveToys()) return
        if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < DRAG_START_PX) return
        startDrag(press, toy, event.clientX, event.clientY)
      }
      moveDragged(toy.el, event.clientX, event.clientY)
    })

    stage.addEventListener('pointerup', (event) => {
      if (press && event.pointerId === press.pointerId) endPress(event.clientX, event.clientY, false)
    })
    stage.addEventListener('pointercancel', (event) => {
      if (press && event.pointerId === press.pointerId) endPress(event.clientX, event.clientY, true)
    })

    syncModeButtons()
    syncToysButton()
    startFree('start')

    cleanup = () => {
      alive = false
      gen += 1
      clearBag(timers)
      clearBag(hintTimers)
      audio.stopVoice()
      audio.dispose?.()
      rootEl.remove()
      cleanup = null
    }
  },

  unmount() {
    unmountInternal()
  },
}

let cleanup: (() => void) | null = null

function unmountInternal(): void {
  cleanup?.()
  cleanup = null
}
