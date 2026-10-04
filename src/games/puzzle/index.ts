import interact from 'interactjs'
import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { playDropSound, playPickupSound, playSoftMiss } from '../../shared/hub-sounds'
import { resolveMagnetDrop } from '../../shared/placement'
import {
  advanceSoftErrorChain,
  createSoftErrorChain,
  recordSoftSuccess,
  resetSoftErrorChain,
} from '../../shared/soft-error-chain'
import {
  createPuzzleFileInput,
  defaultPhotoTitle,
  deletePuzzlePhotos,
  getPuzzlePhotoBlob,
  listPuzzlePhotos,
  PUZZLE_PHOTO_TITLE_MAX,
  sanitizePhotoTitle,
  savePuzzlePhotoBlob,
} from '../../shared/puzzle-photos'
import { blobToImage, openPhotoCropEditor, shrinkPhoto, type PhotoCropEditor } from '../../shared/photo-crop-editor'
import { askChoice } from '../../shared/ask-choice'
import { askText } from '../../shared/ask-text'
import { createGameChromeButton, createGameSettingsButton, createGameToolButton } from '../../shared/game-chrome'
import '../../shared/select-mode.css'
import { uiIconUrl } from '../../shared/ui-icon'
import { shuffleCopy } from '../../shared/random'
import type { PuzzlePieceCount } from '../../shared/storage'
import { createTimerBag } from '../../shared/timer-bag'
import { getPuzzleScene, nextUnsolvedScene, PUZZLE_FRAME_MAGNET_PX, PUZZLE_SCENES, type PuzzleSceneId } from './logic'
import { allSlotsFilled, pieceFitsSlot, puzzleGridForCount, puzzleSlotIds, type PuzzleGrid } from './grid'
import { pieceCellBackground, puzzleSceneUrl, puzzleThumbUrl } from './scene-art'
import { findSlotHitForPieceRect } from './slot-magnet'
import { applySeamsMergedAll, applySeamsToBoard } from './seams'
import { playPuzzleComplete } from './puzzle-sfx'
import { loadSolvedScenes, markSceneSolved } from './progress'
import { scatterTraySpots, trayPieceSize, type TraySpot } from './table-layout'
import './puzzle.css'

const BASE = () => import.meta.env.BASE_URL ?? '/'
const TABLE_BG = () => `${BASE()}assets/games/creative/desk-table.webp`

const CARDS_PER_PAGE = 6
const MORE_DELAY_MS = 2600
const COMPLETE_GLOW_MS = 680
const SNAP_MS = 420
const MAX_PHOTOS = 30
const PHOTO_FALLBACK_TITLE = 'Моё фото'

type Picture = { kind: 'scene'; id: PuzzleSceneId } | { kind: 'photo'; id: string; url: string }
type Photo = { id: string; url: string; title: string }

type PickerItem = { kind: 'scene'; id: PuzzleSceneId } | ({ kind: 'photo' } & Photo)

export const puzzleGame: GameModule = {
  meta: {
    id: 'puzzle',
    title: 'Собери пазл',
    zoneId: 'star-workshop',
    modules: ['2.4'],
  },

  mount(container, context) {
    unmountInternal()

    const settings = context.settings
    const pieceCount: PuzzlePieceCount = settings.puzzlePieceCount ?? 4
    const hintOn = settings.puzzleTargetHint ?? true
    const audio = createAudioManager(settings)
    void audio.unlock()

    const timers = createTimerBag()
    const dragCleanups: Array<() => void> = []
    const placeChain = createSoftErrorChain()
    const filled = new Set<number>()
    const spots = new Map<HTMLElement, TraySpot>()
    let photos: Photo[] = []
    let selecting = false
    const selectedPhotos = new Set<string>()
    let picture: Picture | null = null
    let lastSceneId: PuzzleSceneId | null = null
    let selectedPiece: HTMLElement | null = null
    let pickerPage = 0
    let cropEditor: PhotoCropEditor | null = null
    let alive = true

    const rootEl = document.createElement('section')
    rootEl.className = 'puzzle'
    rootEl.dataset.gameId = 'puzzle'
    rootEl.dataset.pieces = String(pieceCount)

    const bg = document.createElement('img')
    bg.className = 'puzzle__bg'
    bg.alt = ''
    bg.decoding = 'async'
    bg.src = TABLE_BG()

    // ── Шапка: назад + звук слева; справа «Своё фото» / «Галерея» и крайняя шестерёнка ──
    const bar = document.createElement('header')
    bar.className = 'puzzle__bar'
    const barNav = document.createElement('div')
    barNav.className = 'puzzle__bar-nav'

    const backBtn = createGameChromeButton('Назад в меню', 'back', () => context.hubNavigation?.goMenu())
    const soundBtn = createGameChromeButton('Звук', 'sound-on', () => toggleSound())
    const syncSound = (on: boolean): void => {
      soundBtn.dataset.on = on ? '1' : '0'
      soundBtn.setAttribute('aria-label', on ? 'Звук включён' : 'Звук выключен')
      const icon = soundBtn.querySelector<HTMLImageElement>('img.ui-icon')
      if (icon) icon.src = uiIconUrl(on ? 'sound-on' : 'sound-off')
    }
    let soundOn = settings.soundEnabled || settings.musicEnabled
    syncSound(soundOn)
    function toggleSound(): void {
      soundOn = !soundOn
      syncSound(soundOn)
      audio.updateSettings({ soundEnabled: soundOn, musicEnabled: soundOn, quietMode: settings.quietMode })
      context.hubNavigation?.onSoundToggle?.(soundOn)
    }
    barNav.append(backBtn, soundBtn)

    const barTools = document.createElement('div')
    barTools.className = 'puzzle__bar-tools'
    const addPhotoBtn = createGameToolButton('Своё фото', 'background', () => addPhoto())
    addPhotoBtn.classList.add('puzzle__add-photo-btn')
    const galleryBtn = createGameToolButton('Галерея', 'gallery', () => showPicker())
    galleryBtn.classList.add('puzzle__gallery-btn')
    const goSettings = context.hubNavigation?.goSettings
    const settingsBtn = createGameSettingsButton(goSettings ? () => goSettings() : undefined)
    barTools.append(addPhotoBtn, galleryBtn, settingsBtn)
    bar.append(barNav, barTools)

    // ── Экран выбора ──
    const picker = document.createElement('section')
    picker.className = 'puzzle__picker'
    picker.setAttribute('aria-label', 'Выбери картинку')

    // Низ галереи: точки страниц; «Выбрать» → «Выбрать все / Снять все / Удалить (N)» (как в «Рисовалке»).
    const pickerFoot = document.createElement('div')
    pickerFoot.className = 'puzzle__picker-foot'
    const dots = document.createElement('div')
    dots.className = 'puzzle__picker-dots'
    dots.setAttribute('aria-hidden', 'true')
    const selectActions = document.createElement('div')
    selectActions.className = 'select-actions puzzle__select-actions'
    const selectAllBtn = selectButton('Выбрать все', 'select-all', () => {
      for (const p of photos) selectedPhotos.add(p.id)
      syncSelection()
    })
    const clearAllBtn = selectButton('Снять все', 'clear-all', () => {
      selectedPhotos.clear()
      syncSelection()
    })
    const deleteBtn = selectButton('Удалить (0)', 'delete-selected', () => void deleteSelected())
    deleteBtn.classList.add('select-action--danger')
    selectActions.append(selectAllBtn, clearAllBtn, deleteBtn)
    const selectToggle = selectButton('Выбрать', 'select-toggle', () => setSelecting(!selecting))
    selectToggle.classList.add('puzzle__select-toggle')
    pickerFoot.append(dots, selectActions, selectToggle)

    // ── Игра: доска слева, стол с кусочками справа ──
    const play = document.createElement('div')
    play.className = 'puzzle__play'
    const boardZone = document.createElement('div')
    boardZone.className = 'puzzle__board-zone'
    const board = document.createElement('div')
    board.className = 'puzzle__board'
    const sparkles = document.createElement('div')
    sparkles.className = 'puzzle__sparkles'
    sparkles.setAttribute('aria-hidden', 'true')
    for (let i = 0; i < 12; i += 1) {
      const star = document.createElement('span')
      star.className = 'puzzle__sparkle'
      star.style.setProperty('--i', String(i))
      sparkles.append(star)
    }
    boardZone.append(board, sparkles)

    const table = document.createElement('div')
    table.className = 'puzzle__table'

    const moreBtn = document.createElement('button')
    moreBtn.type = 'button'
    moreBtn.className = 'touch-btn puzzle__more'
    moreBtn.hidden = true
    const moreThumb = document.createElement('img')
    moreThumb.className = 'puzzle__more-thumb'
    moreThumb.alt = ''
    moreThumb.decoding = 'async'
    const moreLabel = document.createElement('span')
    moreLabel.className = 'puzzle__more-label'
    moreLabel.textContent = 'Ещё'
    moreBtn.append(moreThumb, moreLabel)
    moreBtn.addEventListener('click', () => startPicture({ kind: 'scene', id: nextSceneId() }))

    play.append(boardZone, table, moreBtn)

    const floatLayer = document.createElement('div')
    floatLayer.className = 'puzzle__float'
    floatLayer.setAttribute('aria-hidden', 'true')

    rootEl.append(bg, bar, picker, play, floatLayer)
    container.replaceChildren(rootEl)

    // ── Экран выбора ──
    function nextSceneId(): PuzzleSceneId {
      return nextUnsolvedScene(lastSceneId, loadSolvedScenes())
    }

    /** Свои фото — первыми (новые впереди), за ними картинки игры. */
    function pickerItems(): PickerItem[] {
      return [
        ...photos.map((p) => ({ kind: 'photo' as const, ...p })),
        ...PUZZLE_SCENES.map((s) => ({ kind: 'scene' as const, id: s.id })),
      ]
    }

    function selectButton(label: string, role: string, onClick: () => void): HTMLButtonElement {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'touch-btn select-action'
      btn.dataset.role = role
      btn.textContent = label
      btn.addEventListener('click', onClick)
      return btn
    }

    function navButton(label: string, text: string, onClick: () => void): HTMLButtonElement {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'touch-btn puzzle__picker-nav'
      btn.setAttribute('aria-label', label)
      btn.textContent = text
      btn.addEventListener('click', onClick)
      return btn
    }

    function pickerCard(item: PickerItem, solved: ReadonlySet<string>): HTMLButtonElement {
      const card = document.createElement('button')
      card.type = 'button'
      card.className = 'puzzle__card'
      const thumb = document.createElement('span')
      thumb.className = 'puzzle__card-thumb'
      const title = document.createElement('span')
      title.className = 'puzzle__card-title'
      if (item.kind === 'scene') {
        const scene = getPuzzleScene(item.id)
        card.dataset.sceneId = item.id
        card.setAttribute('aria-label', scene.titleRu)
        thumb.style.backgroundImage = `url("${puzzleThumbUrl(item.id)}")`
        title.textContent = scene.titleRu
        if (solved.has(item.id)) {
          card.classList.add('is-solved')
          const star = document.createElement('span')
          star.className = 'puzzle__card-star'
          star.setAttribute('aria-hidden', 'true')
          star.textContent = '★'
          card.append(star)
        }
        card.addEventListener('click', () => startPicture({ kind: 'scene', id: item.id }))
      } else {
        const label = item.title || PHOTO_FALLBACK_TITLE
        card.classList.add('puzzle__card--photo')
        card.dataset.photoId = item.id
        card.setAttribute('aria-label', label)
        thumb.style.backgroundImage = `url("${item.url}")`
        title.textContent = label
        const check = document.createElement('span')
        check.className = 'select-check'
        check.setAttribute('aria-hidden', 'true')
        card.append(check)
        card.addEventListener('click', () => {
          if (!selecting) {
            startPicture({ kind: 'photo', id: item.id, url: item.url })
            return
          }
          if (selectedPhotos.has(item.id)) selectedPhotos.delete(item.id)
          else selectedPhotos.add(item.id)
          syncSelection()
        })
      }
      card.prepend(thumb)
      card.append(title)
      return card
    }

    function drawPicker(): void {
      const items = pickerItems()
      const pages = Math.max(1, Math.ceil(items.length / CARDS_PER_PAGE))
      pickerPage = Math.min(Math.max(0, pickerPage), pages - 1)
      const solved = loadSolvedScenes()

      const prev = navButton('Предыдущие картинки', '‹', () => {
        pickerPage -= 1
        drawPicker()
      })
      prev.disabled = pickerPage === 0
      const next = navButton('Следующие картинки', '›', () => {
        pickerPage += 1
        drawPicker()
      })
      next.disabled = pickerPage >= pages - 1

      const grid = document.createElement('div')
      grid.className = 'puzzle__picker-grid'
      for (const item of items.slice(pickerPage * CARDS_PER_PAGE, (pickerPage + 1) * CARDS_PER_PAGE)) {
        grid.append(pickerCard(item, solved))
      }

      dots.replaceChildren()
      for (let i = 0; i < pages; i += 1) {
        const dot = document.createElement('span')
        dot.className = 'puzzle__picker-dot'
        dot.classList.toggle('is-current', i === pickerPage)
        dots.append(dot)
      }
      picker.replaceChildren(prev, grid, next, pickerFoot)
      syncSelection()
    }

    function setSelecting(next: boolean): void {
      selecting = next && photos.length > 0
      if (!selecting) selectedPhotos.clear()
      syncSelection()
    }

    function syncSelection(): void {
      for (const id of [...selectedPhotos]) if (!photos.some((p) => p.id === id)) selectedPhotos.delete(id)
      picker.dataset.selecting = selecting ? '1' : '0'
      selectToggle.hidden = photos.length === 0
      selectToggle.textContent = selecting ? 'Готово' : 'Выбрать'
      selectToggle.classList.toggle('is-selected', selecting)
      selectActions.hidden = !selecting
      dots.hidden = selecting
      for (const card of picker.querySelectorAll<HTMLButtonElement>('.puzzle__card')) {
        const photoId = card.dataset.photoId
        if (!photoId) {
          card.disabled = selecting
          continue
        }
        const on = selecting && selectedPhotos.has(photoId)
        card.classList.toggle('is-selected', on)
        if (selecting) card.setAttribute('aria-pressed', on ? 'true' : 'false')
        else card.removeAttribute('aria-pressed')
      }
      const count = selectedPhotos.size
      deleteBtn.textContent = `Удалить (${count})`
      deleteBtn.disabled = count === 0
      selectAllBtn.disabled = count === photos.length
      clearAllBtn.disabled = count === 0
    }

    async function deleteSelected(): Promise<void> {
      const ids = [...selectedPhotos]
      if (ids.length === 0) return
      const question = ids.length === 1 ? 'Удалить это фото?' : `Удалить фото: ${ids.length}?`
      const answer = await askChoice(rootEl, question, [
        { id: 'no', label: 'Оставить' },
        { id: 'yes', label: 'Удалить' },
      ])
      if (answer !== 'yes' || !alive) return
      try {
        await deletePuzzlePhotos(ids)
      } catch {
        return
      }
      selectedPhotos.clear()
      await loadPhotos()
      if (!alive) return
      if (photos.length === 0) selecting = false
      drawPicker()
    }

    let swipeStart: { id: number; x: number } | null = null
    picker.addEventListener('pointerdown', (event) => {
      swipeStart = { id: event.pointerId, x: event.clientX }
    })
    picker.addEventListener('pointerup', (event) => {
      if (!swipeStart || swipeStart.id !== event.pointerId) return
      const dx = event.clientX - swipeStart.x
      swipeStart = null
      if (Math.abs(dx) < 70) return
      const pages = Math.ceil(pickerItems().length / CARDS_PER_PAGE)
      const target = pickerPage + (dx < 0 ? 1 : -1)
      if (target < 0 || target >= pages) return
      pickerPage = target
      drawPicker()
    })

    function showPicker(): void {
      clearDrags()
      clearSelection()
      floatLayer.replaceChildren()
      timers.clear()
      rootEl.dataset.view = 'picker'
      selecting = false
      selectedPhotos.clear()
      addPhotoBtn.hidden = false
      galleryBtn.hidden = true
      play.hidden = true
      picker.hidden = false
      drawPicker()
    }

    async function loadPhotos(): Promise<void> {
      try {
        const metas = await listPuzzlePhotos()
        const next: Photo[] = []
        for (const meta of metas) {
          const existing = photos.find((p) => p.id === meta.id)
          if (existing) {
            next.push({ ...existing, title: meta.title })
            continue
          }
          const blob = await getPuzzlePhotoBlob(meta.id)
          if (blob) next.push({ id: meta.id, url: URL.createObjectURL(blob), title: meta.title })
        }
        for (const old of photos) if (!next.some((p) => p.url === old.url)) URL.revokeObjectURL(old.url)
        if (!alive) {
          for (const p of next) URL.revokeObjectURL(p.url)
          return
        }
        photos = next
      } catch {
        // IndexedDB недоступна — игра без своих фото.
      }
    }

    function cropFrame(): DOMRect {
      const w = Math.min(window.innerWidth * 0.82, ((window.innerHeight - 120) * 4) / 3)
      const h = (w * 3) / 4
      return new DOMRect((window.innerWidth - w) / 2, Math.max(96, (window.innerHeight - h) / 2 + 30), w, h)
    }

    function addPhoto(): void {
      if (photos.length >= MAX_PHOTOS) {
        void askChoice(rootEl, `Своих фото уже ${MAX_PHOTOS}. Лишние можно убрать: «Выбрать» → «Удалить».`, [
          { id: 'ok', label: 'Понятно' },
        ])
        return
      }
      const input = createPuzzleFileInput()
      input.addEventListener('change', () => {
        const file = input.files?.[0]
        if (file) void cropAndSavePhoto(file)
      })
      input.click()
    }

    async function cropAndSavePhoto(file: File): Promise<void> {
      let source: HTMLImageElement
      try {
        source = await blobToImage(await shrinkPhoto(file, 2400))
      } catch {
        return
      }
      if (!alive) return
      cropEditor = openPhotoCropEditor({
        image: source,
        width: source.naturalWidth,
        height: source.naturalHeight,
        frame: cropFrame,
        outputWidth: 1600,
      })
      const blob = await cropEditor.done
      cropEditor = null
      if (!blob || !alive) return
      const fallback = defaultPhotoTitle(photos.map((p) => p.title))
      const typed = await askText(rootEl, {
        message: 'Как назовём?',
        placeholder: fallback,
        okLabel: 'Готово',
        skipLabel: 'Без подписи',
        maxLength: PUZZLE_PHOTO_TITLE_MAX,
      })
      if (!alive) return
      try {
        const meta = await savePuzzlePhotoBlob(blob, sanitizePhotoTitle(typed) || fallback)
        await loadPhotos()
        pickerPage = 0
        const photo = photos.find((p) => p.id === meta.id)
        if (photo && alive) startPicture({ kind: 'photo', id: photo.id, url: photo.url })
      } catch {
        // Не сохранилось — остаёмся на экране выбора.
      }
    }

    // ── Игра ──
    function grid(): PuzzleGrid {
      return puzzleGridForCount(pieceCount)
    }

    function imageSrc(): string {
      if (!picture) return ''
      return picture.kind === 'scene' ? puzzleSceneUrl(picture.id) : picture.url
    }

    function pieceStyle(id: number): string {
      const g = grid()
      return pieceCellBackground(id, g.cols, g.rows, imageSrc())
    }

    function startPicture(next: Picture): void {
      picture = next
      if (next.kind === 'scene') lastSceneId = next.id
      rootEl.dataset.view = 'play'
      rootEl.dataset.scene = next.kind === 'scene' ? next.id : 'photo'
      picker.hidden = true
      play.hidden = false
      addPhotoBtn.hidden = true
      galleryBtn.hidden = false
      moreBtn.hidden = true
      timers.clear()
      filled.clear()
      resetSoftErrorChain(placeChain)
      renderBoard()
    }

    function clearDrags(): void {
      for (const fn of dragCleanups) fn()
      dragCleanups.length = 0
    }

    function clearTargetHint(): void {
      board.querySelectorAll('.is-target-hint').forEach((node) => node.classList.remove('is-target-hint'))
    }

    function showTargetHint(pieceId: number): void {
      clearTargetHint()
      board
        .querySelector(`.puzzle__slot[data-slot-id="${pieceId}"]:not(.is-filled)`)
        ?.classList.add('is-target-hint')
    }

    function clearSelection(): void {
      selectedPiece?.classList.remove('is-selected')
      selectedPiece = null
      clearTargetHint()
    }

    function slotSize(): { w: number; h: number } {
      const first = board.querySelector<HTMLElement>('.puzzle__slot')
      const r = first?.getBoundingClientRect()
      return { w: r?.width ?? 0, h: r?.height ?? 0 }
    }

    function placeOnTable(el: HTMLElement): void {
      const spot = spots.get(el)
      el.classList.remove('is-dragging')
      el.style.position = ''
      el.style.left = spot ? `${spot.x}px` : ''
      el.style.top = spot ? `${spot.y}px` : ''
      el.style.width = ''
      el.style.height = ''
      el.style.transform = ''
      el.style.zIndex = ''
      el.dataset.x = '0'
      el.dataset.y = '0'
      if (el.parentElement !== table) table.append(el)
    }

    /** Разложить кусочки, что ещё на столе: размер от клетки, места вразброс. */
    function layoutTable(): void {
      const free = [...table.querySelectorAll<HTMLElement>('.puzzle__piece:not(.is-placed)')]
      const zone = table.getBoundingClientRect()
      const slot = slotSize()
      if (zone.width < 10 || zone.height < 10 || slot.w < 10) return
      const size = trayPieceSize({ slotW: slot.w, slotH: slot.h, zoneW: zone.width, zoneH: zone.height, count: pieceCount })
      table.style.setProperty('--piece-w', `${size.w}px`)
      table.style.setProperty('--piece-h', `${size.h}px`)
      const places = scatterTraySpots(free.length, { w: zone.width, h: zone.height }, size, Math.random)
      free.forEach((el, i) => {
        const place = places[i]!
        spots.set(el, place)
        el.style.setProperty('--rot', `${place.rotate}deg`)
        if (!el.classList.contains('is-dragging') && el !== selectedPiece) placeOnTable(el)
      })
    }

    function bindDrag(piece: HTMLElement): void {
      piece.style.touchAction = 'none'
      const interaction = interact(piece).draggable({
        listeners: {
          start(event) {
            const el = event.target as HTMLElement
            if (el.classList.contains('is-placed')) return
            playPickupSound(audio)
            clearSelection()
            if (hintOn) showTargetHint(Number(el.dataset.pieceId))
            const r = el.getBoundingClientRect()
            const slot = slotSize()
            const w = slot.w || r.width
            const h = slot.h || r.height
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            floatLayer.append(el)
            el.classList.add('is-dragging')
            el.style.position = 'fixed'
            el.style.left = `${cx - w / 2}px`
            el.style.top = `${cy - h / 2}px`
            el.style.width = `${w}px`
            el.style.height = `${h}px`
            el.style.zIndex = '120'
            el.dataset.x = '0'
            el.dataset.y = '0'
            el.style.transform = 'translate(0px, 0px)'
          },
          move(event) {
            const el = event.target as HTMLElement
            if (el.classList.contains('is-placed')) return
            const x = (Number.parseFloat(el.dataset.x ?? '0') || 0) + event.dx
            const y = (Number.parseFloat(el.dataset.y ?? '0') || 0) + event.dy
            el.dataset.x = String(x)
            el.dataset.y = String(y)
            el.style.transform = `translate(${x}px, ${y}px)`
          },
          end(event) {
            const el = event.target as HTMLElement
            if (el.classList.contains('is-placed')) return
            tryPlace(el)
            if (!el.classList.contains('is-placed')) placeOnTable(el)
          },
        },
      })
      dragCleanups.push(() => interaction.unset())
    }

    function onPieceTap(el: HTMLElement): void {
      if (el.classList.contains('is-placed')) return
      if (selectedPiece === el) {
        clearSelection()
        return
      }
      clearSelection()
      selectedPiece = el
      el.classList.add('is-selected')
      playPickupSound(audio)
      if (hintOn) showTargetHint(Number(el.dataset.pieceId))
    }

    function onSlotTap(slot: HTMLElement): void {
      if (!selectedPiece || slot.classList.contains('is-filled')) return
      const source = selectedPiece
      clearSelection()
      tryPlace(source, slot)
    }

    function slotRects(onlyId?: number) {
      return [...board.querySelectorAll<HTMLElement>('.puzzle__slot:not(.is-filled)')]
        .filter((slot) => onlyId === undefined || Number(slot.dataset.slotId) === onlyId)
        .map((slot) => {
          const r = slot.getBoundingClientRect()
          return {
            id: Number(slot.dataset.slotId),
            rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
          }
        })
    }

    function tryPlace(el: HTMLElement, slotOverride?: HTMLElement): void {
      const pieceId = Number(el.dataset.pieceId)
      let target: { slotId: number; dist: number } | null = null
      if (slotOverride) {
        target = { slotId: Number(slotOverride.dataset.slotId), dist: 0 }
      } else {
        const pieceRect = el.getBoundingClientRect()
        // Щедро: задел свою клетку — кладём в неё, даже если соседняя накрыта больше.
        target = findSlotHitForPieceRect(pieceRect, slotRects(pieceId)) ?? findSlotHitForPieceRect(pieceRect, slotRects())
      }

      const miss = (): void => {
        const step = advanceSoftErrorChain(placeChain, { repeat: '', nudge: '' })
        playSoftMiss(audio)
        el.classList.add('soft-wiggle')
        timers.track(window.setTimeout(() => el.classList.remove('soft-wiggle'), 450))
        if (step.shouldHighlight || hintOn) showTargetHint(pieceId)
        else clearTargetHint()
        if (!slotOverride) timers.track(window.setTimeout(() => clearTargetHint(), 1400))
      }

      if (!target) {
        miss()
        return
      }
      const magnet = resolveMagnetDrop(
        String(pieceId),
        String(target.slotId),
        target.dist,
        slotOverride ? 0 : PUZZLE_FRAME_MAGNET_PX,
        '',
      )
      if (!magnet.snapped || !pieceFitsSlot(pieceId, target.slotId)) {
        miss()
        return
      }

      const slot = board.querySelector<HTMLElement>(`.puzzle__slot[data-slot-id="${target.slotId}"]`)
      if (!slot) return
      recordSoftSuccess(placeChain)
      clearTargetHint()
      filled.add(pieceId)
      spots.delete(el)
      el.classList.remove('is-dragging', 'is-selected')
      el.classList.add('is-placed', 'is-snapping')
      el.setAttribute('style', pieceStyle(pieceId))
      slot.querySelector('.puzzle__slot-ghost')?.remove()
      slot.classList.add('is-filled')
      slot.append(el)
      timers.track(window.setTimeout(() => el.classList.remove('is-snapping'), SNAP_MS))
      playDropSound(audio)

      const g = grid()
      applySeamsToBoard(board, filled, g)
      if (allSlotsFilled(filled, g)) celebrate()
    }

    function celebrate(): void {
      board.classList.add('is-celebrating')
      boardZone.classList.add('is-celebrating')
      applySeamsMergedAll(board)
      // Кусочки — отдельные блоки: на дробных пикселях между ними проступает линия.
      const full = document.createElement('div')
      full.className = 'puzzle__board-full'
      full.setAttribute('aria-hidden', 'true')
      full.style.backgroundImage = `url("${imageSrc()}")`
      board.append(full)
      playPuzzleComplete(audio)
      if (picture?.kind === 'scene') markSceneSolved(picture.id)
      timers.track(
        window.setTimeout(() => {
          board.classList.add('is-complete')
          play.classList.add('is-finale')
        }, COMPLETE_GLOW_MS),
      )
      timers.track(
        window.setTimeout(() => {
          const nextId = nextSceneId()
          moreThumb.src = puzzleThumbUrl(nextId)
          moreBtn.setAttribute('aria-label', `Ещё: ${getPuzzleScene(nextId).titleRu}`)
          moreBtn.hidden = false
        }, MORE_DELAY_MS),
      )
    }

    function renderBoard(): void {
      clearDrags()
      clearSelection()
      spots.clear()
      floatLayer.replaceChildren()
      board.replaceChildren()
      table.replaceChildren()
      board.classList.remove('is-complete', 'is-celebrating')
      boardZone.classList.remove('is-celebrating')
      play.classList.remove('is-finale')

      const g = grid()
      board.style.setProperty('--puzzle-cols', String(g.cols))
      board.style.setProperty('--puzzle-rows', String(g.rows))
      table.style.setProperty('--piece-aspect', `${(4 / 3) * (g.rows / g.cols)}`)

      const ids = puzzleSlotIds(g)
      for (const id of ids) {
        const slot = document.createElement('div')
        slot.className = 'puzzle__slot'
        slot.dataset.slotId = String(id)
        slot.setAttribute('role', 'button')
        slot.setAttribute('aria-label', 'Место для кусочка')
        slot.tabIndex = 0
        slot.addEventListener('click', () => onSlotTap(slot))
        const ghost = document.createElement('span')
        ghost.className = 'puzzle__slot-ghost'
        ghost.setAttribute('aria-hidden', 'true')
        ghost.setAttribute('style', pieceStyle(id))
        slot.append(ghost)
        board.append(slot)
      }
      applySeamsToBoard(board, filled, g)

      for (const id of shuffleCopy(ids)) {
        const piece = document.createElement('button')
        piece.type = 'button'
        piece.className = 'puzzle__piece'
        piece.dataset.pieceId = String(id)
        piece.setAttribute('aria-label', 'Кусочек пазла')
        piece.setAttribute('style', pieceStyle(id))
        piece.style.setProperty('--rot', `${(id % 2 ? -1 : 1) * 8}deg`)
        piece.addEventListener('click', () => onPieceTap(piece))
        table.append(piece)
        bindDrag(piece)
      }
      layoutTable()
    }

    const onResize = (): void => {
      if (rootEl.dataset.view === 'play') layoutTable()
    }
    window.addEventListener('resize', onResize)

    showPicker()
    void loadPhotos().then(() => {
      if (alive && rootEl.dataset.view === 'picker') drawPicker()
    })

    cleanup = () => {
      alive = false
      timers.clear()
      cropEditor?.close()
      window.removeEventListener('resize', onResize)
      clearDrags()
      for (const p of photos) URL.revokeObjectURL(p.url)
      photos = []
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
