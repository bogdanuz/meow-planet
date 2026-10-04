import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { playCelebrationTune, playSoftMiss } from '../../shared/hub-sounds'
import { softPopHaptic } from '../../shared/haptics'
import { createGameChromeButton, createGameSettingsButton, createGameToolButton } from '../../shared/game-chrome'
import { createGamePresenter } from '../../shared/game-presenter'
import { loadGalleryStars, markGalleryStar } from '../../shared/gallery-progress'
import type { PresenterPose } from '../../shared/companion'
import { uiIconUrl } from '../../shared/ui-icon'
import { hideItemUrl, hideSceneUrl, hideThumbUrl, hideVoiceUrl } from './art'
import { placementGeometry, type Box } from './geometry'
import { ITEM_ASPECT } from './item-aspect'
import {
  HINT_GLOW_MS,
  HINT_REPEAT_MS,
  LEVEL_SCALE,
  LEVEL_TINT,
  MISSES_BEFORE_PEEK,
  buildRound,
  evaluateTap,
  nextTargetId,
  nextUnstarredScene,
  type HideLevel,
  type HideRound,
  type Placement,
} from './logic'
import {
  createLinePicker,
  foundLine,
  IDLE_LINES,
  introLine,
  NEAR_LINES,
  NEXT_LINES,
  OTHER_LINES,
  PRAISE_LINES,
  ROUND_DONE_LINES,
  START_LINES,
  whereLine,
  type VoiceLine,
} from './phrases'
import { HIDE_SCENES, getHideScene, isHideSceneId, type HideItem, type HideSceneId } from './scenes'
import { playHideFly, playHideFound, playHideRustle } from './hide-seek-sfx'
import './hide-seek.css'

const INTRO_MS = 2200
const FOUND_POP_MS = 560
const FLY_MS = 520
const FOUND_NEXT_MS = 1900
/** Короткая похвала или «Ищем дальше!» между находкой и следующим заданием. */
const CONNECT_MS = 900
const MORE_DELAY_MS = 2600
const POSE_RESET_MS = 1600
const RIPPLE_MS = 650
const VOICE_WAIT_CAP_MS = 6000
/** «Иногда зеркально»: примерно каждая третья сцена. */
const MIRROR_CHANCE = 0.35

type SpotEls = {
  root: HTMLElement
  item: HTMLElement
  art: HTMLImageElement
  tint: HTMLElement
  patch: HTMLElement | null
  hit: HTMLButtonElement
  box: Box
  placement: Placement
}

export const hideSeekGame: GameModule = {
  meta: {
    id: 'hide-seek',
    title: 'Прятки',
    zoneId: 'planet-corners',
    modules: ['2.6'],
  },

  mount(container, context) {
    unmountInternal()
    const settings = context.settings
    const level: HideLevel = settings.hideSeekLevel ?? 'easy'
    const mirrorOn = settings.hideSeekMirror ?? true
    const autoHints = settings.hideSeekAutoHints ?? true
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
    let sceneId: HideSceneId | null = null
    let round: HideRound | null = null
    let currentId: string | null = null
    let misses = 0
    let busy = false
    let poseReset: ReturnType<typeof setTimeout> | undefined
    let speechText = ''
    const found = new Set<string>()
    const spots = new Map<string, SpotEls>()
    const stripCards = new Map<string, HTMLElement>()
    let sampler: CanvasRenderingContext2D | null = null

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
    rootEl.className = 'hide-seek'
    rootEl.dataset.gameId = 'hide-seek'
    rootEl.dataset.level = level
    if (still) rootEl.classList.add('hide-seek--still')

    // ── Шапка: назад + звук слева; справа «Подсказка», «Заново», «Галерея» и крайняя шестерёнка ──
    const bar = document.createElement('header')
    bar.className = 'hide-seek__bar'
    const barNav = document.createElement('div')
    barNav.className = 'hide-seek__bar-nav'
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
    barTools.className = 'hide-seek__bar-tools'
    const hintBtn = createGameToolButton('Подсказка', 'hint', () => showHint(true))
    hintBtn.dataset.role = 'hint'
    const againBtn = createGameToolButton('Заново', 'sheet', () => sceneId && startScene(sceneId, 'start'))
    againBtn.dataset.role = 'again'
    const galleryBtn = createGameToolButton('Галерея', 'gallery', () => showGallery())
    galleryBtn.dataset.role = 'gallery'
    const goSettings = context.hubNavigation?.goSettings
    const settingsBtn = createGameSettingsButton(goSettings ? () => goSettings() : undefined)
    barTools.append(hintBtn, againBtn, galleryBtn, settingsBtn)
    bar.append(barNav, barTools)

    // ── Галерея сцен ──
    const gallery = document.createElement('section')
    gallery.className = 'hide-seek__gallery'
    gallery.setAttribute('aria-label', 'Выбери картинку')
    const galleryGrid = document.createElement('div')
    galleryGrid.className = 'hide-seek__gallery-grid'
    gallery.append(galleryGrid)

    // ── Игра: сцена на весь экран ──
    const play = document.createElement('div')
    play.className = 'hide-seek__play'
    const backdrop = document.createElement('img')
    backdrop.className = 'hide-seek__backdrop'
    backdrop.alt = ''
    backdrop.decoding = 'async'
    const viewport = document.createElement('div')
    viewport.className = 'hide-seek__viewport'
    const stage = document.createElement('div')
    stage.className = 'hide-seek__stage'
    const sceneImg = document.createElement('img')
    sceneImg.className = 'hide-seek__scene'
    sceneImg.alt = ''
    sceneImg.decoding = 'async'
    sceneImg.draggable = false
    const spotLayer = document.createElement('div')
    spotLayer.className = 'hide-seek__spots'
    const glow = document.createElement('div')
    glow.className = 'hide-seek__glow'
    glow.setAttribute('aria-hidden', 'true')
    stage.append(sceneImg, spotLayer, glow)
    viewport.append(stage)

    const presenter = createGamePresenter(settings.companion)
    const wanted = document.createElement('div')
    wanted.className = 'hide-seek__wanted'
    wanted.setAttribute('aria-hidden', 'true')
    const wantedImg = document.createElement('img')
    wantedImg.alt = ''
    wantedImg.decoding = 'async'
    wanted.append(wantedImg)

    const strip = document.createElement('div')
    strip.className = 'hide-seek__strip'
    strip.setAttribute('aria-label', 'Кого ищем')

    const sparkles = document.createElement('div')
    sparkles.className = 'hide-seek__sparkles'
    sparkles.setAttribute('aria-hidden', 'true')
    for (let i = 0; i < 14; i += 1) {
      const star = document.createElement('span')
      star.className = 'hide-seek__sparkle'
      star.style.setProperty('--i', String(i))
      sparkles.append(star)
    }

    const moreBtn = document.createElement('button')
    moreBtn.type = 'button'
    moreBtn.className = 'touch-btn hide-seek__more'
    moreBtn.hidden = true
    const moreThumb = document.createElement('img')
    moreThumb.className = 'hide-seek__more-thumb'
    moreThumb.alt = ''
    moreThumb.decoding = 'async'
    const moreLabel = document.createElement('span')
    moreLabel.className = 'hide-seek__more-label'
    moreLabel.textContent = 'Ещё'
    moreBtn.append(moreThumb, moreLabel)
    moreBtn.addEventListener('click', () => startScene(nextUnstarredScene(sceneId, stars())))

    play.append(backdrop, viewport, sparkles, strip, wanted, presenter.element, moreBtn)

    const flyLayer = document.createElement('div')
    flyLayer.className = 'hide-seek__fly'
    flyLayer.setAttribute('aria-hidden', 'true')

    rootEl.append(bar, gallery, play, flyLayer)
    container.replaceChildren(rootEl)

    // ── Ведущий ──
    let voicePlaying = false
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
      const url = hideVoiceUrl(line.file)
      voicePlaying = Boolean(url)
      if (url) void audio.playUrl('voice', url, { volume: 0.86 })
    }

    /** Следующий шаг — после фразы (если есть голос) и не раньше `ms`. */
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

    // ── Галерея ──
    const stars = (): Set<HideSceneId> => loadGalleryStars('hide-seek', isHideSceneId)

    function drawGallery(): void {
      const done = stars()
      galleryGrid.replaceChildren(
        ...HIDE_SCENES.map((scene) => {
          const card = document.createElement('button')
          card.type = 'button'
          card.className = 'hide-seek__card'
          card.dataset.sceneId = scene.id
          card.setAttribute('aria-label', scene.titleRu)
          const thumb = document.createElement('span')
          thumb.className = 'hide-seek__card-thumb'
          thumb.style.backgroundImage = `url("${hideThumbUrl(scene.id)}")`
          const title = document.createElement('span')
          title.className = 'hide-seek__card-title'
          title.textContent = scene.titleRu
          card.append(thumb, title)
          if (done.has(scene.id)) {
            card.classList.add('is-solved')
            const star = document.createElement('span')
            star.className = 'hide-seek__card-star'
            star.setAttribute('aria-hidden', 'true')
            star.textContent = '★'
            card.append(star)
          }
          card.addEventListener('click', () => startScene(scene.id))
          return card
        }),
      )
    }

    function showGallery(): void {
      gen += 1
      clearBag(timers)
      clearBag(hintTimers)
      audio.stopVoice()
      rootEl.dataset.view = 'gallery'
      delete rootEl.dataset.wanted
      gallery.hidden = false
      play.hidden = true
      hintBtn.hidden = true
      againBtn.hidden = true
      galleryBtn.hidden = true
      flyLayer.replaceChildren()
      drawGallery()
    }

    // ── Сцена ──
    function itemOf(id: string): HideItem | undefined {
      return round ? [...round.targets, ...round.decoys].find((p) => p.item.id === id)?.item : undefined
    }

    function sceneSampler(): CanvasRenderingContext2D | null {
      if (sampler) return sampler
      if (!sceneImg.naturalWidth) return null
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 96
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return null
        ctx.drawImage(sceneImg, 0, 0, 128, 96)
        sampler = ctx
        return ctx
      } catch {
        return null
      }
    }

    /** Средний цвет картинки под укрытием — тон, под который подгоняется предмет. */
    function tintSpots(): void {
      const strength = LEVEL_TINT[level]
      if (strength <= 0) return
      const ctx = sceneSampler()
      if (!ctx) return
      for (const spot of spots.values()) {
        const b = spot.box
        const x = Math.max(0, Math.floor((b.x / 100) * 128))
        const y = Math.max(0, Math.floor((b.y / 100) * 96))
        const w = Math.max(1, Math.min(128 - x, Math.ceil((b.w / 100) * 128)))
        const h = Math.max(1, Math.min(96 - y, Math.ceil((b.h / 100) * 96)))
        try {
          const data = ctx.getImageData(x, y, w, h).data
          let r = 0
          let g = 0
          let bl = 0
          const n = data.length / 4
          for (let i = 0; i < data.length; i += 4) {
            r += data[i]!
            g += data[i + 1]!
            bl += data[i + 2]!
          }
          spot.tint.style.backgroundColor = `rgb(${Math.round(r / n)} ${Math.round(g / n)} ${Math.round(bl / n)})`
          spot.tint.style.opacity = String(spot.placement.hideout.kuku ? strength * 0.6 : strength)
        } catch {
          return
        }
      }
    }
    sceneImg.addEventListener('load', () => {
      sampler = null
      tintSpots()
    })

    const pct = (v: number): string => `${v}%`
    const place = (el: HTMLElement, b: Box): void => {
      el.style.left = pct(b.x)
      el.style.top = pct(b.y)
      el.style.width = pct(b.w)
      el.style.height = pct(b.h)
    }

    function buildSpot(p: Placement, role: 'target' | 'decoy'): SpotEls {
      const id = sceneId!
      const aspect = ITEM_ASPECT[`${id}-${p.item.id}`] ?? 1
      const g = placementGeometry(p.hideout, aspect, p.cover, LEVEL_SCALE[level])
      const hiddenFrac = p.hideout.kuku ? 1.04 : p.cover

      const root = document.createElement('div')
      root.className = 'hide-seek__spot'
      root.dataset.itemId = p.item.id
      root.dataset.role = role
      root.dataset.pop = g.pop
      if (p.hideout.kuku) root.dataset.kuku = '1'
      root.style.setProperty('--pop', pct(hiddenFrac * 100 + 6))
      root.style.setProperty('--peek', pct(hiddenFrac * (p.hideout.kuku ? 50 : 60)))

      const item = document.createElement('span')
      item.className = 'hide-seek__item'
      place(item, g.item)
      const url = hideItemUrl(id, p.item.id)
      const art = document.createElement('img')
      art.className = 'hide-seek__item-art'
      art.alt = ''
      art.draggable = false
      art.decoding = 'async'
      art.src = url
      const tint = document.createElement('span')
      tint.className = 'hide-seek__tint'
      tint.style.setProperty('mask-image', `url("${url}")`)
      tint.style.setProperty('-webkit-mask-image', `url("${url}")`)
      item.append(art, tint)

      let patch: HTMLElement | null = null
      if (g.patch) {
        patch = document.createElement('div')
        patch.className = 'hide-seek__patch'
        place(patch, g.patch)
        if (g.fade > 0) {
          const dir = p.hideout.side === 'bottom' ? 'to bottom' : p.hideout.side === 'left' ? 'to left' : 'to right'
          const mask = `linear-gradient(${dir}, transparent 0%, #000 ${g.fade}%)`
          patch.style.setProperty('mask-image', mask)
          patch.style.setProperty('-webkit-mask-image', mask)
        }
        const patchArt = document.createElement('div')
        patchArt.className = 'hide-seek__patch-art'
        patchArt.style.left = pct((-g.patch.x / g.patch.w) * 100)
        patchArt.style.top = pct((-g.patch.y / g.patch.h) * 100)
        patchArt.style.width = pct((100 / g.patch.w) * 100)
        patchArt.style.height = pct((100 / g.patch.h) * 100)
        patchArt.style.backgroundImage = `url("${hideSceneUrl(id)}")`
        patch.append(patchArt)
      }

      const hit = document.createElement('button')
      hit.type = 'button'
      hit.className = 'hide-seek__hit'
      hit.setAttribute('aria-label', p.item.nom)
      place(hit, g.hit)
      hit.addEventListener('click', (event) => {
        event.stopPropagation()
        onTap(p.item.id)
      })

      root.append(...(patch ? [item, patch, hit] : [item, hit]))
      return { root, item, art, tint, patch, hit, box: g.item, placement: p }
    }

    function renderStrip(): void {
      stripCards.clear()
      strip.replaceChildren(
        ...(round?.targets ?? []).map((p) => {
          const card = document.createElement('span')
          card.className = 'hide-seek__strip-card'
          card.dataset.itemId = p.item.id
          const img = document.createElement('img')
          img.alt = ''
          img.decoding = 'async'
          img.src = hideItemUrl(sceneId!, p.item.id)
          card.append(img)
          stripCards.set(p.item.id, card)
          return card
        }),
      )
    }

    /** Новая сцена знакомит (`intro`), «Заново» на той же сцене — «Давай поиграем в прятки!» (`start`). */
    function startScene(id: HideSceneId, opening: 'intro' | 'start' = 'intro'): void {
      gen += 1
      clearBag(timers)
      clearBag(hintTimers)
      audio.stopVoice()
      sceneId = id
      const scene = getHideScene(id)
      const mirrored = mirrorOn && Math.random() < MIRROR_CHANCE
      round = debugRound(id) ?? buildRound(scene, level, Math.random, mirrored)
      found.clear()
      currentId = null
      misses = 0
      busy = false
      sampler = null

      rootEl.dataset.view = 'play'
      rootEl.dataset.scene = id
      rootEl.dataset.mirrored = mirrored ? '1' : '0'
      delete rootEl.dataset.wanted
      gallery.hidden = true
      play.hidden = false
      hintBtn.hidden = false
      againBtn.hidden = false
      galleryBtn.hidden = false
      moreBtn.hidden = true
      play.classList.remove('is-finale')
      sparkles.classList.remove('is-on')
      wanted.classList.remove('is-on')
      glow.classList.remove('is-on')
      flyLayer.replaceChildren()

      const url = hideSceneUrl(id)
      sceneImg.src = url
      backdrop.src = url
      stage.classList.toggle('is-mirrored', mirrored)
      stage.setAttribute('aria-label', scene.titleRu)

      spots.clear()
      const els: HTMLElement[] = []
      for (const p of round.decoys) {
        const spot = buildSpot(p, 'decoy')
        spots.set(p.item.id, spot)
        els.push(spot.root)
      }
      for (const p of round.targets) {
        const spot = buildSpot(p, 'target')
        spots.set(p.item.id, spot)
        els.push(spot.root)
      }
      spotLayer.replaceChildren(...els)
      if (sceneImg.complete && sceneImg.naturalWidth) tintSpots()
      renderStrip()

      say(opening === 'intro' ? introLine(scene) : pick('start', START_LINES))
      afterLine(INTRO_MS, () => nextTask())
    }

    function setCurrent(id: string | null): void {
      currentId = id
      if (id) rootEl.dataset.wanted = id
      else delete rootEl.dataset.wanted
      for (const [cid, card] of stripCards) card.classList.toggle('is-current', cid === id)
      if (id && sceneId) {
        wantedImg.src = hideItemUrl(sceneId, id)
        wanted.classList.add('is-on')
      } else {
        wanted.classList.remove('is-on')
      }
    }

    function nextTask(): void {
      if (!round) return
      busy = false
      const id = nextTargetId(round, found)
      if (!id) {
        celebrate()
        return
      }
      setCurrent(id)
      misses = 0
      say(whereLine(itemOf(id)!))
      armHints()
    }

    // ── Подсказки ──
    function clearPeek(): void {
      for (const spot of spots.values()) spot.root.classList.remove('is-peek')
    }

    function armHints(): void {
      clearBag(hintTimers)
      glow.classList.remove('is-on')
      if (!autoHints || !currentId) return
      later(
        HINT_REPEAT_MS,
        () => {
          if (busy || !currentId) return
          say(whereLine(itemOf(currentId)!))
          wiggle(stripCards.get(currentId), 'is-wiggle', 700)
          rustleKuku()
        },
        hintTimers,
      )
      later(
        HINT_GLOW_MS,
        () => {
          if (busy || !currentId) return
          showGlow(currentId)
          say(pick('idle', IDLE_LINES))
        },
        hintTimers,
      )
    }

    function rustleKuku(): void {
      for (const spot of spots.values()) {
        if (!spot.placement.hideout.kuku || found.has(spot.placement.item.id)) continue
        wiggle(spot.patch, 'is-rustle', 900)
        playHideRustle(audio)
      }
    }

    function showGlow(id: string): void {
      const spot = spots.get(id)
      if (!spot) return
      const b = spot.box
      const size = Math.max(b.w, b.h * 0.75) * 3
      glow.style.left = pct(b.x + b.w / 2)
      glow.style.top = pct(b.y + b.h / 2)
      glow.style.width = pct(size)
      glow.classList.add('is-on')
    }

    function peek(id: string): void {
      clearPeek()
      spots.get(id)?.root.classList.add('is-peek')
    }

    /** Кнопка-лупа (и после промахов): сияние, предмет выглядывает, ведущий спрашивает. */
    function showHint(fromButton: boolean): void {
      if (!currentId || busy) return
      showGlow(currentId)
      peek(currentId)
      if (fromButton) say(whereLine(itemOf(currentId)!))
      armHintsKeepGlow()
    }

    function armHintsKeepGlow(): void {
      const on = glow.classList.contains('is-on')
      armHints()
      if (on) glow.classList.add('is-on')
    }

    function wiggle(el: HTMLElement | null | undefined, cls: string, ms: number): void {
      if (!el) return
      el.classList.remove(cls)
      void el.offsetWidth
      el.classList.add(cls)
      later(ms, () => el.classList.remove(cls))
    }

    // ── Тапы ──
    function onTap(id: string): void {
      if (!round || busy || !currentId) return
      const result = evaluateTap(round, found, currentId, id)
      if (result === 'miss') {
        const spot = spots.get(id)
        if (spot && !found.has(id)) wiggle(spot.item, 'is-wiggle', 450)
        miss()
        return
      }
      collect(id, result === 'found')
    }

    function miss(): void {
      playSoftMiss(audio)
      misses += 1
      if (misses >= MISSES_BEFORE_PEEK && currentId) {
        misses = 0
        say(pick('near', NEAR_LINES), 'miss')
        peek(currentId)
      }
      armHintsKeepGlow()
    }

    stage.addEventListener('click', (event) => {
      if (!round || busy || !currentId) return
      if ((event.target as HTMLElement).closest('.hide-seek__hit')) return
      ripple(event.clientX, event.clientY)
      miss()
    })

    function ripple(clientX: number, clientY: number): void {
      const r = stage.getBoundingClientRect()
      let x = r.width > 0 ? ((clientX - r.left) / r.width) * 100 : 50
      const y = r.height > 0 ? ((clientY - r.top) / r.height) * 100 : 50
      if (round?.mirrored) x = 100 - x
      const el = document.createElement('span')
      el.className = 'hide-seek__ripple'
      el.style.left = pct(x)
      el.style.top = pct(y)
      stage.append(el)
      const t = setTimeout(() => {
        timers.delete(t)
        el.remove()
      }, RIPPLE_MS)
      timers.add(t)
    }

    function burst(b: Box): void {
      if (still) return
      const el = document.createElement('span')
      el.className = 'hide-seek__burst'
      el.style.left = pct(b.x + b.w / 2)
      el.style.top = pct(b.y + b.h * 0.4)
      for (let i = 0; i < 8; i += 1) {
        const s = document.createElement('i')
        s.style.setProperty('--i', String(i))
        el.append(s)
      }
      stage.append(el)
      const t = setTimeout(() => {
        timers.delete(t)
        el.remove()
      }, 900)
      timers.add(t)
    }

    function collect(id: string, isCurrent: boolean): void {
      const spot = spots.get(id)
      const item = itemOf(id)
      if (!spot || !item) return
      busy = true
      clearBag(hintTimers)
      glow.classList.remove('is-on')
      clearPeek()
      found.add(id)
      spot.root.classList.add('is-found')
      spot.hit.disabled = true
      if (spot.placement.hideout.kuku) wiggle(spot.patch, 'is-rustle', 700)
      playHideFound(audio)
      softPopHaptic(settings.quietMode)
      burst(spot.box)
      say(foundLine(item), 'happy')
      later(FOUND_POP_MS, () => flyToStrip(spot, id))

      afterLine(FOUND_NEXT_MS, () => {
        if (isCurrent || !currentId) {
          const more = round ? nextTargetId(round, found) !== null : false
          const connector = more && Math.random() < 0.5 ? pick('next', NEXT_LINES) : pick('praise', PRAISE_LINES)
          say(connector, 'happy')
          afterLine(CONNECT_MS, () => nextTask())
          return
        }
        busy = false
        say(pick('other', OTHER_LINES), 'happy')
        armHints()
      })
    }

    function flyToStrip(spot: SpotEls, id: string): void {
      const card = stripCards.get(id)
      const done = (): void => {
        spot.root.classList.add('is-gone')
        card?.classList.add('is-found')
      }
      playHideFly(audio)
      if (still || !card || typeof spot.art.animate !== 'function') {
        done()
        return
      }
      const from = spot.art.getBoundingClientRect()
      const to = card.getBoundingClientRect()
      if (from.width < 2 || to.width < 2) {
        done()
        return
      }
      const clone = document.createElement('img')
      clone.className = 'hide-seek__fly-item'
      clone.src = spot.art.currentSrc || spot.art.src
      clone.alt = ''
      clone.style.left = `${from.left}px`
      clone.style.top = `${from.top}px`
      clone.style.width = `${from.width}px`
      clone.style.height = `${from.height}px`
      flyLayer.append(clone)
      spot.root.classList.add('is-gone')
      const flip = round?.mirrored ? -1 : 1
      const dx = to.left + to.width / 2 - (from.left + from.width / 2)
      const dy = to.top + to.height / 2 - (from.top + from.height / 2)
      const s = Math.min(to.width / from.width, to.height / from.height) * 0.86
      const anim = clone.animate(
        [
          { transform: `translate(0, 0) scale(${flip}, 1)` },
          { transform: `translate(${dx}px, ${dy}px) scale(${flip * s}, ${s})` },
        ],
        { duration: FLY_MS, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'forwards' },
      )
      anim.onfinish = () => {
        clone.remove()
        done()
      }
    }

    function celebrate(): void {
      if (!sceneId) return
      busy = true
      clearBag(hintTimers)
      setCurrent(null)
      say(pick('done', ROUND_DONE_LINES), 'happy')
      playCelebrationTune(audio)
      markGalleryStar('hide-seek', sceneId, isHideSceneId)
      sparkles.classList.remove('is-on')
      void sparkles.offsetWidth
      sparkles.classList.add('is-on')
      play.classList.add('is-finale')
      later(MORE_DELAY_MS, () => {
        const nextId = nextUnstarredScene(sceneId, stars())
        moreThumb.src = hideThumbUrl(nextId)
        moreBtn.setAttribute('aria-label', `Ещё: ${getHideScene(nextId).titleRu}`)
        moreBtn.hidden = false
      })
    }

    showGallery()

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

/**
 * Только dev-сервер: `?hs-debug=0` — первые 10 укрытий сцены заняты предметами, `?hs-debug=1` — остальные;
 * `&hs-cover=0.5` — сколько закрыто (по умолчанию 0). Для проверки разметки укрытий глазами.
 */
function debugRound(sceneId: HideSceneId): HideRound | null {
  if (!import.meta.env.DEV || typeof location === 'undefined') return null
  const params = new URLSearchParams(location.search)
  const page = params.get('hs-debug')
  if (page === null) return null
  const cover = Number(params.get('hs-cover') ?? 0)
  const scene = getHideScene(sceneId)
  const from = Number(page) === 1 ? 10 : 0
  const used = new Set<string>()
  const targets = scene.hideouts.slice(from, from + 10).map((hideout, i) => {
    const fitting = scene.items.filter((it) => !hideout.fits || hideout.fits.includes(it.id))
    const item = fitting.find((it) => !used.has(it.id)) ?? fitting[i % fitting.length] ?? scene.items[0]!
    used.add(item.id)
    return { item, hideout, cover }
  })
  return { sceneId, level: 'easy', mirrored: false, targets, decoys: [] }
}

let cleanup: (() => void) | null = null

function unmountInternal(): void {
  cleanup?.()
  cleanup = null
}
