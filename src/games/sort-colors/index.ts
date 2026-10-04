import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { playSoftMiss } from '../../shared/hub-sounds'
import { softPopHaptic } from '../../shared/haptics'
import { createUiIconImg, uiIconUrl } from '../../shared/ui-icon'
import { createGamePresenter } from '../../shared/game-presenter'
import type { PresenterPose } from '../../shared/companion'
import { createSeededRandom } from '../../shared/random'
import {
  BIN_GEOMETRY,
  binArtUrl,
  binClipPath,
  sortBackgroundUrl,
  sortSfxUrl,
  stickerArtUrl,
  toyArtIsBitmap,
  toyArtUrl,
  type SortSfx,
} from './art'
import { binSlots } from './bin-fill'
import { sortBinLabelRu, sortToyLabelRu, type SortKind } from './catalog'
import {
  advanceTaskProgress,
  createFreeRound,
  createRoundState,
  createTaskProgress,
  createTaskRound,
  evaluateDrop,
  taskTargetsLeft,
  taskTypeForProgress,
  type SortRound,
  type SortRoundState,
  type SortTaskTone,
  type SortToy,
} from './logic'
import { layoutPile, pileRows, topmostAt, type PileHitItem } from './pile-layout'
import {
  createLinePicker,
  FREE_DONE_LINES,
  FREE_START_LINES,
  nameLine,
  PRAISE_LINES,
  praiseNamedLine,
  showLine,
  STEP_LINES,
  TASK_DONE_LINES,
  taskLine,
  withChildName,
  wrongLine,
  yesLine,
  type VoiceLine,
} from './phrases'
import { sortVoiceUrl } from './voice'
import './sort-colors.css'

type Mode = 'free' | 'task'

const DRAG_START_PX = 10
const POSE_RESET_MS = 1600
const FREE_CHEER_MS = 2000
const EMPTY_MS = 450
const TASK_NEXT_MS = 1200
/** Самая длинная фраза ~4,3 с; если звук не отдал конец, игра всё равно идёт дальше. */
const VOICE_WAIT_CAP_MS = 6000
const REMIND_AFTER_YES_MS = 900
const CLICK_AFTER_TAP_MS = 600

type Press = { id: string; pointerId: number; x: number; y: number; dragging: boolean }

type AlphaMask = { w: number; h: number; alpha: Uint8ClampedArray }

export const sortColorsGame: GameModule = {
  meta: {
    id: 'sort-colors',
    title: 'Куда положить?',
    zoneId: 'star-workshop',
    modules: ['2.3'],
  },

  mount(container, context) {
    unmountInternal()
    const settings = context.settings
    const audio = createAudioManager({
      soundEnabled: settings.soundEnabled,
      musicEnabled: settings.musicEnabled,
      quietMode: settings.quietMode,
    })
    void audio.unlock()
    const sfxUrls = (['pickup', 'drop', 'pile'] as const).map(sortSfxUrl).filter((u): u is string => Boolean(u))
    void audio.preload(sfxUrls)

    const pick = createLinePicker()
    const timers = new Set<ReturnType<typeof setTimeout>>()
    let alive = true
    let mode: Mode = 'free'
    let state: SortRoundState = createRoundState({ kinds: [], toys: [], task: null })
    let progress = createTaskProgress()
    let tone: SortTaskTone = 'together'
    let roundNo = 0
    let gen = 0
    let pileSeed = 1
    let selectedId: string | null = null
    let misses = 0
    let wrongVariant = 0
    let press: Press | null = null
    let lastPointerTapAt = 0
    let speechText = ''
    let poseReset: ReturnType<typeof setTimeout> | undefined
    const toyEls = new Map<string, HTMLButtonElement>()
    const binEls = new Map<SortKind, { el: HTMLButtonElement; inside: HTMLElement }>()
    const binContents = new Map<SortKind, string[]>()
    const pileZ = new Map<string, number>()
    const pileHit = new Map<string, PileHitItem>()
    const masks = new Map<string, AlphaMask>()

    const still =
      settings.quietMode || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)

    const later = (ms: number, fn: () => void): void => {
      const t = setTimeout(() => {
        timers.delete(t)
        if (alive) fn()
      }, ms)
      timers.add(t)
    }

    /** Действие после текущей фразы (и не раньше minMs); отменяется сменой раунда или режима. */
    function afterVoice(minMs: number, action: () => void): void {
      const g = gen
      const minDelay = new Promise<void>((resolve) => later(minMs, resolve))
      const voiceCap = new Promise<void>((resolve) => later(VOICE_WAIT_CAP_MS, resolve))
      const voiceDone = Promise.race([audio.waitUntilVoiceEnded(), voiceCap])
      void Promise.all([voiceDone, minDelay]).then(() => {
        if (alive && g === gen) action()
      })
    }

    root = document.createElement('section')
    root.className = 'sort-colors'
    root.dataset.gameId = 'sort-colors'
    root.dataset.mode = 'free'
    if (settings.quietMode) root.classList.add('sort-colors--quiet')
    const rootEl = root

    const bg = document.createElement('img')
    bg.className = 'sort-colors__bg'
    bg.alt = ''
    bg.setAttribute('aria-hidden', 'true')
    bg.decoding = 'async'
    bg.src = sortBackgroundUrl()

    const presenter = createGamePresenter(settings.companion)

    function say(
      line: VoiceLine,
      pose: PresenterPose,
      opts: { withName?: boolean; showText?: boolean; voice?: boolean } = {},
    ): void {
      if (opts.showText !== false) {
        speechText = opts.withName ? withChildName(settings.childName, line.text) : line.text
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
      }
      const url = opts.voice === false ? null : sortVoiceUrl(line.file)
      if (url) void audio.playUrl('voice', url, { volume: 0.86 })
    }

    function playSfx(id: SortSfx): void {
      const url = sortSfxUrl(id)
      if (url) void audio.playUrl('sfx', url, { volume: 0.7 })
    }

    // ── Верхняя полоса: назад + звук (REF-04) и режимы ──
    const gameBar = document.createElement('header')
    gameBar.className = 'sort-colors__game-bar'
    const barNav = document.createElement('div')
    barNav.className = 'sort-colors__bar-nav'

    const backBtn = document.createElement('button')
    backBtn.type = 'button'
    backBtn.className = 'touch-btn touch-btn--icon game-chrome-btn'
    backBtn.setAttribute('aria-label', 'Назад в меню')
    backBtn.append(createUiIconImg('back', { decorative: true }))
    backBtn.addEventListener('click', () => context.hubNavigation?.goMenu())

    const soundBtn = document.createElement('button')
    soundBtn.type = 'button'
    soundBtn.className = 'touch-btn touch-btn--icon game-chrome-btn'
    soundBtn.append(createUiIconImg('sound-on', { decorative: true }))
    const syncSound = (on: boolean): void => {
      soundBtn.dataset.on = on ? '1' : '0'
      soundBtn.setAttribute('aria-label', on ? 'Звук включён' : 'Звук выключен')
      const icon = soundBtn.querySelector<HTMLImageElement>('img.ui-icon')
      if (icon) icon.src = uiIconUrl(on ? 'sound-on' : 'sound-off')
    }
    let soundOn = settings.soundEnabled || settings.musicEnabled
    syncSound(soundOn)
    soundBtn.addEventListener('click', () => {
      soundOn = !soundOn
      syncSound(soundOn)
      audio.updateSettings({ soundEnabled: soundOn, musicEnabled: soundOn, quietMode: settings.quietMode })
      context.hubNavigation?.onSoundToggle?.(soundOn)
    })
    barNav.append(backBtn, soundBtn)

    const modes = document.createElement('div')
    modes.className = 'sort-colors__modes'
    const freeBtn = document.createElement('button')
    freeBtn.type = 'button'
    freeBtn.className = 'touch-btn sort-colors__mode-btn'
    freeBtn.textContent = 'Свободно'
    freeBtn.setAttribute('aria-label', 'Свободный режим')
    const taskBtn = document.createElement('button')
    taskBtn.type = 'button'
    taskBtn.className = 'touch-btn sort-colors__mode-btn'
    taskBtn.textContent = 'Задание'
    taskBtn.setAttribute('aria-label', 'Задание — режим с подсказкой')
    modes.append(freeBtn, taskBtn)
    gameBar.append(barNav, modes)

    function syncModeButtons(): void {
      const inTask = mode === 'task'
      freeBtn.classList.toggle('is-active', !inTask)
      freeBtn.setAttribute('aria-pressed', inTask ? 'false' : 'true')
      taskBtn.classList.toggle('is-active', inTask)
      taskBtn.setAttribute('aria-pressed', inTask ? 'true' : 'false')
      rootEl.dataset.mode = mode
    }

    // ── Сцена: ящики посередине, куча внизу ──
    const stage = document.createElement('div')
    stage.className = 'sort-colors__stage'
    const binsRow = document.createElement('div')
    binsRow.className = 'sort-colors__bins'
    const pile = document.createElement('div')
    pile.className = 'sort-colors__pile'
    pile.setAttribute('aria-label', 'Куча игрушек')
    const dragLayer = document.createElement('div')
    dragLayer.className = 'sort-colors__drag-layer'
    dragLayer.setAttribute('aria-hidden', 'true')
    stage.append(binsRow, pile)
    rootEl.append(bg, stage, presenter.element, gameBar, dragLayer)

    const clip = binClipPath()
    const g = BIN_GEOMETRY

    function toyById(id: string): SortToy | undefined {
      return state.toys.find((t) => t.id === id)
    }

    function buildMask(url: string, img: HTMLImageElement): void {
      if (masks.has(url)) return
      try {
        const size = 64
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data
        const alpha = new Uint8ClampedArray(size * size)
        for (let i = 0; i < alpha.length; i += 1) alpha[i] = data[i * 4 + 3]!
        masks.set(url, { w: size, h: size, alpha })
      } catch {
        /* нет canvas — остаётся эллипс */
      }
    }

    function opaqueAt(id: string, u: number, v: number): boolean {
      const toy = toyById(id)
      const mask = toy ? masks.get(toyArtUrl(toy.kind, toy.color)) : undefined
      if (!mask) return (u - 0.5) ** 2 + (v - 0.5) ** 2 <= 0.23
      const x = Math.min(mask.w - 1, Math.max(0, Math.floor(u * mask.w)))
      const y = Math.min(mask.h - 1, Math.max(0, Math.floor(v * mask.h)))
      return mask.alpha[y * mask.w + x]! > 40
    }

    function createToyButton(toy: SortToy): HTMLButtonElement {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'sort-colors__toy'
      btn.dataset.toyId = toy.id
      btn.dataset.kind = toy.kind
      btn.dataset.color = toy.color
      btn.setAttribute('aria-label', sortToyLabelRu(toy.kind, toy.color))
      const img = document.createElement('img')
      img.className = 'sort-colors__toy-art'
      img.alt = ''
      img.draggable = false
      img.decoding = 'async'
      const url = toyArtUrl(toy.kind, toy.color)
      if (toyArtIsBitmap(toy.kind, toy.color)) {
        img.addEventListener('load', () => buildMask(url, img), { once: true })
      }
      img.src = url
      btn.append(img)
      btn.addEventListener('click', (event) => {
        const afterPointerTap = lastPointerTapAt > 0 && performance.now() - lastPointerTapAt < CLICK_AFTER_TAP_MS
        if (event.detail !== 0 && afterPointerTap) return
        onToyTap(toy.id)
      })
      return btn
    }

    function createBin(kind: SortKind): HTMLButtonElement {
      const bin = document.createElement('button')
      bin.type = 'button'
      bin.className = 'sort-colors__bin'
      bin.dataset.kind = kind
      bin.setAttribute('aria-label', sortBinLabelRu(kind))
      bin.style.setProperty('--bin-aspect', String(g.aspect))

      const art = document.createElement('img')
      art.className = 'sort-colors__bin-art'
      art.alt = ''
      art.draggable = false
      art.src = binArtUrl()

      const inside = document.createElement('span')
      inside.className = 'sort-colors__bin-inside'
      inside.style.clipPath = clip

      const sticker = document.createElement('img')
      sticker.className = 'sort-colors__sticker'
      sticker.alt = ''
      sticker.draggable = false
      sticker.src = stickerArtUrl(kind)
      sticker.style.left = `${g.sticker.x * 100}%`
      sticker.style.top = `${g.sticker.y * 100}%`
      sticker.style.width = `${g.sticker.w * 100}%`

      bin.append(art, inside, sticker)
      bin.addEventListener('click', () => onBinActivate(kind))
      binEls.set(kind, { el: bin, inside })
      binContents.set(kind, [])
      return bin
    }

    function pileBox(): { width: number; height: number; item: number } {
      const width = pile.clientWidth || 1000
      const height = pile.clientHeight || 300
      const rows = pileRows(Math.max(1, pileZ.size))
      const widest = rows[0] ?? 1
      const item = Math.min(
        height / (1 + 0.62 * (rows.length - 1)),
        width / (1 + 0.92 * (widest - 1)),
        height * 0.5,
      )
      return { width, height, item }
    }

    function applyPileSlot(id: string): void {
      const el = toyEls.get(id)
      const hit = pileHit.get(id)
      if (!el || !hit) return
      const box = pileBox()
      el.style.left = `${(hit.x / box.width) * 100}%`
      el.style.top = `${(hit.y / box.height) * 100}%`
      el.style.zIndex = String(hit.z)
      el.style.setProperty('--rot', `${hit.rot}deg`)
    }

    /** Горка из того, что осталось; верхние остаются верхними. */
    function layoutPileNow(): void {
      const ids = [...pileZ.keys()].sort((a, b) => pileZ.get(a)! - pileZ.get(b)!)
      const box = pileBox()
      pile.style.setProperty('--toy', `${Math.round(box.item)}px`)
      const slots = layoutPile(ids.length, box, createSeededRandom(pileSeed + ids.length)).sort(
        (a, b) => a.z - b.z,
      )
      pileHit.clear()
      ids.forEach((id, i) => {
        const s = slots[i]!
        pileZ.set(id, s.z)
        pileHit.set(id, { id, x: s.x, y: s.y, size: box.item, rot: s.rot, z: s.z })
        applyPileSlot(id)
      })
    }

    function renderBin(kind: SortKind, flyFrom?: { id: string; rect: DOMRect }): void {
      const entry = binEls.get(kind)
      const ids = binContents.get(kind)
      if (!entry || !ids) return
      const slots = binSlots(ids.length)
      ids.forEach((id, i) => {
        let el = entry.inside.querySelector<HTMLElement>(`[data-toy-id="${id}"]`)
        if (!el) {
          const toy = toyById(id)!
          el = document.createElement('span')
          el.className = 'sort-colors__bin-toy'
          el.dataset.toyId = id
          el.dataset.kind = toy.kind
          el.dataset.color = toy.color
          const img = document.createElement('img')
          img.alt = ''
          img.draggable = false
          img.src = toyArtUrl(toy.kind, toy.color)
          el.append(img)
          entry.inside.append(el)
        }
        const s = slots[i]!
        el.style.left = `${(g.opening.x + s.x * g.opening.w) * 100}%`
        el.style.top = `${(g.opening.y + s.y * g.opening.h) * 100}%`
        el.style.width = `${s.scale * g.opening.w * 100}%`
        el.style.setProperty('--rot', `${s.rot}deg`)
        if (flyFrom && flyFrom.id === id) fly(el, flyFrom.rect)
      })
    }

    /** FLIP: элемент «прилетает» из старого места в новое. */
    function fly(el: HTMLElement, from: DOMRect): void {
      if (still || typeof el.animate !== 'function') return
      const to = el.getBoundingClientRect()
      const dx = from.left + from.width / 2 - (to.left + to.width / 2)
      const dy = from.top + from.height / 2 - (to.top + to.height / 2)
      if (!dx && !dy) return
      el.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], {
        duration: 320,
        easing: 'cubic-bezier(.25,.9,.35,1.15)',
      })
    }

    function pulse(el: HTMLElement, cls: string, ms: number): void {
      el.classList.remove(cls)
      void el.offsetWidth
      el.classList.add(cls)
      later(ms, () => el.classList.remove(cls))
    }

    function clearHighlights(): void {
      for (const { el } of binEls.values()) el.classList.remove('is-soft-highlight')
    }

    function deselect(): void {
      if (selectedId) toyEls.get(selectedId)?.classList.remove('is-selected')
      selectedId = null
    }

    function renderRound(round: SortRound, falling: boolean): void {
      gen += 1
      roundNo += 1
      rootEl.dataset.round = String(roundNo)
      state = createRoundState(round)
      selectedId = null
      press = null
      misses = 0
      pileSeed = Math.floor(Math.random() * 1e9)
      const task = round.task
      if (task) {
        rootEl.dataset.taskType = task.type
        rootEl.dataset.taskKind = task.kind
        if ('color' in task) rootEl.dataset.taskColor = task.color
        else delete rootEl.dataset.taskColor
      } else {
        delete rootEl.dataset.taskType
        delete rootEl.dataset.taskKind
        delete rootEl.dataset.taskColor
      }

      binEls.clear()
      binContents.clear()
      binsRow.replaceChildren(...round.kinds.map(createBin))
      binsRow.style.setProperty('--bin-count', String(round.kinds.length))

      toyEls.clear()
      pileZ.clear()
      dragLayer.replaceChildren()
      pile.replaceChildren()
      round.toys.forEach((toy, i) => {
        const btn = createToyButton(toy)
        toyEls.set(toy.id, btn)
        pileZ.set(toy.id, i)
        pile.append(btn)
      })
      layoutPileNow()
      if (falling && !still) {
        for (const [id, el] of toyEls) {
          el.style.setProperty('--fall-delay', `${(pileZ.get(id) ?? 0) * 45}ms`)
          el.classList.add('is-falling')
          later(1400, () => el.classList.remove('is-falling'))
        }
      }
    }

    function startFree(intro: boolean): void {
      renderRound(createFreeRound(Math.random, state.task ? [] : state.kinds), !intro)
      if (!intro) playSfx('pile')
      say(pick('free-start', FREE_START_LINES), 'idle', { withName: intro })
    }

    function startTask(withName: boolean): void {
      tone = tone === 'direct' ? 'together' : 'direct'
      const round = createTaskRound(taskTypeForProgress(progress), Math.random, tone)
      renderRound(round, !withName)
      playSfx('pile')
      say(taskLine(round.task!), 'idle', { withName })
    }

    function setMode(next: Mode): void {
      if (mode === next) return
      mode = next
      syncModeButtons()
      audio.stopVoice()
      if (mode === 'free') startFree(false)
      else startTask(true)
    }

    freeBtn.addEventListener('click', () => setMode('free'))
    taskBtn.addEventListener('click', () => setMode('task'))

    function announcePickup(toy: SortToy): void {
      playSfx('pickup')
      say(nameLine(toy.kind), 'idle', { showText: mode === 'free' })
    }

    function onToyTap(id: string): void {
      if (state.placed.has(id) || !toyEls.has(id)) return
      if (selectedId === id) {
        deselect()
        return
      }
      deselect()
      selectedId = id
      toyEls.get(id)!.classList.add('is-selected')
      const toy = toyById(id)
      if (toy) announcePickup(toy)
    }

    function onBinActivate(kind: SortKind): void {
      if (!selectedId) {
        const bin = binEls.get(kind)?.el
        if (bin) pulse(bin, 'is-bump', 380)
        return
      }
      const id = selectedId
      deselect()
      drop(id, kind)
    }

    function returnToPile(id: string): void {
      const el = toyEls.get(id)
      if (!el) return
      el.classList.remove('is-selected', 'is-dragging')
      if (el.parentElement !== pile) {
        const from = el.getBoundingClientRect()
        el.style.removeProperty('position')
        pile.append(el)
        applyPileSlot(id)
        fly(el, from)
      }
    }

    function drop(id: string, kind: SortKind): void {
      const toy = toyById(id)
      if (!toy) return
      const result = evaluateDrop(state, id, kind)
      if (result.type === 'ignored') return
      if (result.type === 'wrong') {
        playSoftMiss(audio)
        const bin = binEls.get(kind)?.el
        if (bin) pulse(bin, 'is-shake', 480)
        returnToPile(id)
        misses += 1
        if (misses >= 2) {
          clearHighlights()
          binEls.get(toy.kind)?.el.classList.add('is-soft-highlight')
          say(showLine(toy.kind), 'miss')
        } else {
          wrongVariant = (wrongVariant % 3) + 1
          say(wrongLine(toy.kind, wrongVariant as 1 | 2 | 3), 'miss')
        }
        return
      }

      misses = 0
      clearHighlights()
      playSfx('drop')
      softPopHaptic(settings.quietMode)
      const el = toyEls.get(id)
      const rect = el?.getBoundingClientRect()
      el?.remove()
      toyEls.delete(id)
      pileZ.delete(id)
      binContents.get(kind)?.push(id)
      renderBin(kind, rect ? { id, rect } : undefined)
      const bin = binEls.get(kind)?.el
      if (bin) pulse(bin, 'is-bump', 380)
      layoutPileNow()

      const task = state.task
      if (!task) {
        if (result.roundDone) celebrateFree()
        else {
          const line =
            Math.random() < 0.5
              ? pick('praise', PRAISE_LINES)
              : praiseNamedLine(toy.kind, Math.random() < 0.5 ? 'home' : 'to')
          say(line, 'happy')
        }
        return
      }
      if (result.taskDone) celebrateTask()
      else if (result.matchedTask) say(pick('step', STEP_LINES), 'happy')
      else {
        say(yesLine(toy.kind), 'happy')
        afterVoice(REMIND_AFTER_YES_MS, () => {
          if (taskTargetsLeft(state) > 0) say(taskLine(task), 'idle')
        })
      }
    }

    function cheerBins(): void {
      for (const { el } of binEls.values()) pulse(el, 'is-cheer', 900)
    }

    function celebrateFree(): void {
      say(pick('free-done', FREE_DONE_LINES), 'happy')
      cheerBins()
      afterVoice(FREE_CHEER_MS, () => {
        for (const { el } of binEls.values()) el.classList.add('is-emptying')
        const g0 = gen
        later(EMPTY_MS, () => {
          if (g0 === gen) startFree(false)
        })
      })
    }

    function celebrateTask(): void {
      say(pick('task-done', TASK_DONE_LINES), 'happy')
      progress = advanceTaskProgress(progress)
      cheerBins()
      afterVoice(TASK_NEXT_MS, () => startTask(false))
    }

    // ── Жесты: берём верхнюю игрушку под пальцем, тащим или тап → тап ──
    function binAt(x: number, y: number): SortKind | null {
      let best: { kind: SortKind; d: number } | null = null
      for (const [kind, { el }] of binEls) {
        const r = el.getBoundingClientRect()
        const padX = r.width * 0.12
        const padTop = r.height * 0.45
        const padBottom = r.height * 0.1
        if (x < r.left - padX || x > r.right + padX || y < r.top - padTop || y > r.bottom + padBottom) continue
        const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2))
        if (!best || d < best.d) best = { kind, d }
      }
      return best?.kind ?? null
    }

    function moveDragged(el: HTMLElement, clientX: number, clientY: number): void {
      const r = rootEl.getBoundingClientRect()
      el.style.left = `${clientX - r.left}px`
      el.style.top = `${clientY - r.top}px`
      const hover = binAt(clientX, clientY)
      for (const [kind, { el: bin }] of binEls) bin.classList.toggle('is-drop-hover', kind === hover)
    }

    function startDrag(p: Press, clientX: number, clientY: number): void {
      const el = toyEls.get(p.id)
      if (!el) return
      const wasSelected = selectedId === p.id
      deselect()
      p.dragging = true
      el.classList.add('is-dragging')
      el.style.zIndex = ''
      dragLayer.style.setProperty('--toy', pile.style.getPropertyValue('--toy'))
      dragLayer.append(el)
      moveDragged(el, clientX, clientY)
      const toy = toyById(p.id)
      if (toy && !wasSelected) announcePickup(toy)
    }

    function endPress(clientX: number, clientY: number, cancelled: boolean): void {
      const p = press
      press = null
      if (!p) return
      for (const { el } of binEls.values()) el.classList.remove('is-drop-hover')
      if (!p.dragging) {
        if (cancelled) return
        lastPointerTapAt = performance.now()
        onToyTap(p.id)
        return
      }
      const kind = cancelled ? null : binAt(clientX, clientY)
      if (kind) drop(p.id, kind)
      else returnToPile(p.id)
      if (toyEls.has(p.id)) applyPileSlot(p.id)
    }

    pile.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (press) return
      const r = pile.getBoundingClientRect()
      const items = [...pileHit.values()].filter((h) => toyEls.get(h.id)?.parentElement === pile)
      const id = topmostAt(event.clientX - r.left, event.clientY - r.top, items, opaqueAt)
      if (!id) return
      event.preventDefault()
      press = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, dragging: false }
      try {
        pile.setPointerCapture(event.pointerId)
      } catch {
        /* старый WebKit без capture */
      }
    })

    pile.addEventListener('pointermove', (event) => {
      if (!press || event.pointerId !== press.pointerId) return
      if (!press.dragging) {
        if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < DRAG_START_PX) return
        startDrag(press, event.clientX, event.clientY)
      }
      const el = toyEls.get(press.id)
      if (el) moveDragged(el, event.clientX, event.clientY)
    })

    pile.addEventListener('pointerup', (event) => {
      if (press && event.pointerId === press.pointerId) endPress(event.clientX, event.clientY, false)
    })
    pile.addEventListener('pointercancel', (event) => {
      if (press && event.pointerId === press.pointerId) endPress(event.clientX, event.clientY, true)
    })

    const resizeObserver =
      typeof ResizeObserver === 'function' ? new ResizeObserver(() => !press && layoutPileNow()) : null
    resizeObserver?.observe(pile)

    container.replaceChildren(rootEl)
    syncModeButtons()
    startFree(true)

    cleanup = () => {
      alive = false
      gen += 1
      audio.stopVoice()
      for (const t of timers) clearTimeout(t)
      timers.clear()
      resizeObserver?.disconnect()
      context.onTaskVisual?.(null)
      audio.dispose?.()
      rootEl.remove()
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
