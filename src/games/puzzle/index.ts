import interact from 'interactjs'
import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { playSoftMiss } from '../../shared/hub-sounds'
import { resolveMagnetDrop } from '../../shared/placement'
import {
  advanceSoftErrorChain,
  createSoftErrorChain,
  recordSoftSuccess,
  resetSoftErrorChain,
} from '../../shared/soft-error-chain'
import {
  createPuzzleFileInput,
  deletePuzzlePhoto,
  getPuzzlePhotoBlob,
  listPuzzlePhotos,
} from '../../shared/puzzle-photos'
import { createTimerBag } from '../../shared/timer-bag'
import { loadSettings, saveSettings } from '../../shared/storage'
import { PUZZLE_FRAME_MAGNET_PX, PUZZLE_SCENES, type PuzzleSceneId } from './logic'
import { openPuzzleAdultModal } from './puzzle-adult-modal'
import { openPuzzleCropModal } from './puzzle-crop-modal'
import {
  loadPuzzleGameSettings,
  savePuzzleGameSettings,
  type PuzzleGameSettings,
} from './puzzle-settings'
import {
  allSlotsFilled,
  pieceFitsSlot,
  puzzleGridForCount,
  puzzleSlotIds,
} from './grid'
import { pickPuzzleCompletePraise, pickPuzzlePiecePraise } from './praise'
import {
  pieceCellBackground,
  puzzleSceneAssetUrl,
  scenePreviewBackground,
  sceneTintForId,
} from './scene-art'
import { findSlotHitForPieceRect } from './slot-magnet'
import { applySeamsMergedAll, applySeamsToBoard } from './seams'
import {
  playPuzzleComplete,
  playPuzzlePickup,
  playPuzzleSnap,
  playPuzzleWrong,
} from './puzzle-sfx'
import './puzzle.css'

export const puzzleGame: GameModule = {
  meta: {
    id: 'puzzle',
    title: 'Собери пазл',
    zoneId: 'star-workshop',
    modules: ['2.4'],
  },

  mount(container, context) {
    unmountInternal()

    const audio = createAudioManager(context.settings)
    void audio.unlock()

    let puzzleSettings: PuzzleGameSettings = loadPuzzleGameSettings()
    let sceneId: PuzzleSceneId | 'custom' = 'meadow'
    let customUrl: string | null = null
    let customPhotoId: string | null = null
    const filled = new Set<number>()
    const dragCleanups: Array<() => void> = []
    const placeChain = createSoftErrorChain()
    let selectedPiece: HTMLElement | null = null
    const customThumbUrls = new Map<string, string>()

    root = document.createElement('section')
    root.className = 'puzzle-game'
    root.dataset.gameId = 'puzzle'
    root.dataset.mode = 'frame'
    const timers = createTimerBag()
    let cancelCrop: (() => void) | null = null
    let closeAdult: (() => void) | null = null

    const gallery = document.createElement('aside')
    gallery.className = 'puzzle-game__gallery'

    const work = document.createElement('div')
    work.className = 'puzzle-game__work'

    const boardWrap = document.createElement('div')
    boardWrap.className = 'puzzle-game__board-wrap'

    const addPhotoBtn = document.createElement('button')
    addPhotoBtn.type = 'button'
    addPhotoBtn.className = 'puzzle-game__add-photo touch-btn touch-btn--icon'
    addPhotoBtn.setAttribute('aria-label', 'Добавить своё фото')
    addPhotoBtn.textContent = '+'

    const settingsBtn = document.createElement('button')
    settingsBtn.type = 'button'
    settingsBtn.className = 'puzzle-game__settings touch-btn touch-btn--icon'
    settingsBtn.setAttribute('aria-label', 'Настройки игры для взрослых')
    settingsBtn.textContent = '⚙'

    const actionsHost = context.chromeGameActions
    if (actionsHost) {
      actionsHost.replaceChildren(addPhotoBtn, settingsBtn)
    }

    const board = document.createElement('div')
    board.className = 'puzzle-game__board'

    const tray = document.createElement('div')
    tray.className = 'puzzle-game__tray'

    const floatLayer = document.createElement('div')
    floatLayer.className = 'puzzle-game__float'
    floatLayer.setAttribute('aria-hidden', 'true')

    boardWrap.append(board)
    work.append(boardWrap, tray, floatLayer)
    root.append(gallery, work)
    container.replaceChildren(root)

    function grid() {
      return puzzleGridForCount(puzzleSettings.pieceCount)
    }

    function tint(): string {
      return sceneTintForId(sceneId)
    }

    function imageSrc(): string | null {
      if (sceneId === 'custom') return customUrl
      return puzzleSceneAssetUrl(sceneId)
    }

    async function syncCustomPuzzleIds(): Promise<void> {
      try {
        const photos = await listPuzzlePhotos()
        const app = loadSettings()
        saveSettings({ ...app, customPuzzleIds: photos.map((p) => p.id) })
      } catch {
        /* ignore */
      }
    }

    addPhotoBtn.addEventListener('click', () => {
      const input = createPuzzleFileInput()
      input.addEventListener('change', async () => {
        const file = input.files?.[0]
        if (!file) return
        cancelCrop?.()
        const crop = openPuzzleCropModal(root!, file)
        cancelCrop = crop.cancel
        const result = await crop.done
        cancelCrop = null
        if (!result) return
        await syncCustomPuzzleIds()
        const blob = await getPuzzlePhotoBlob(result.id)
        if (!blob) return
        if (customUrl) URL.revokeObjectURL(customUrl)
        customUrl = URL.createObjectURL(blob)
        customPhotoId = result.id
        sceneId = 'custom'
        filled.clear()
        resetSoftErrorChain(placeChain)
        await refresh()
        context.onSoftHint?.('Своё фото готово — собери картинку!')
      })
      input.click()
    })

    settingsBtn.addEventListener('click', () => {
      closeAdult?.()
      closeAdult = openPuzzleAdultModal(
        root!,
        puzzleSettings,
        (next) => {
          puzzleSettings = next
          savePuzzleGameSettings(next)
          filled.clear()
          resetSoftErrorChain(placeChain)
          void refresh()
          context.onSoftHint?.(`Теперь ${next.pieceCount} кусочков.`)
        },
        () => {
          void (async () => {
            const photos = await listPuzzlePhotos()
            await Promise.all(photos.map((photo) => deletePuzzlePhoto(photo.id)))
            if (customUrl) URL.revokeObjectURL(customUrl)
            customUrl = null
            customPhotoId = null
            if (sceneId === 'custom') sceneId = 'meadow'
            filled.clear()
            await syncCustomPuzzleIds()
            await refresh()
            context.onSoftHint?.('Свои фото убраны.')
          })()
        },
      )
    })

    function clearDrags(): void {
      for (const fn of dragCleanups) fn()
      dragCleanups.length = 0
    }

    function revokeCustomThumbs(): void {
      for (const url of customThumbUrls.values()) URL.revokeObjectURL(url)
      customThumbUrls.clear()
    }

    async function renderGallery(): Promise<void> {
      gallery.replaceChildren()
      for (const scene of PUZZLE_SCENES) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'puzzle-game__scene-thumb touch-btn'
        if (scene.id === sceneId) btn.classList.add('is-active')
        btn.setAttribute('aria-label', scene.titleRu)
        const prev = document.createElement('span')
        prev.className = 'puzzle-game__scene-preview'
        prev.style.background = scenePreviewBackground(scene.tint, { sceneId: scene.id })
        prev.setAttribute('aria-hidden', 'true')
        btn.append(prev)
        btn.addEventListener('click', () => {
          sceneId = scene.id
          customUrl = null
          customPhotoId = null
          filled.clear()
          resetSoftErrorChain(placeChain)
          void refresh()
        })
        gallery.append(btn)
      }

      try {
        const photos = await listPuzzlePhotos()
        for (const photo of photos.slice(0, 5)) {
          let thumbUrl = customThumbUrls.get(photo.id)
          if (!thumbUrl) {
            const blob = await getPuzzlePhotoBlob(photo.id)
            if (!blob) continue
            thumbUrl = URL.createObjectURL(blob)
            customThumbUrls.set(photo.id, thumbUrl)
          }
          const btn = document.createElement('button')
          btn.type = 'button'
          btn.className = 'puzzle-game__scene-thumb touch-btn'
          btn.setAttribute('aria-label', 'Своё фото')
          if (sceneId === 'custom' && customPhotoId === photo.id) {
            btn.classList.add('is-active')
          }
          const prev = document.createElement('span')
          prev.className = 'puzzle-game__scene-preview puzzle-game__scene-preview--photo'
          prev.style.background = `url("${thumbUrl}") center/cover no-repeat`
          prev.setAttribute('aria-hidden', 'true')
          btn.append(prev)
          btn.dataset.photoId = photo.id
          btn.addEventListener('click', async () => {
            const blob = await getPuzzlePhotoBlob(photo.id)
            if (!blob) return
            if (customUrl) URL.revokeObjectURL(customUrl)
            customUrl = URL.createObjectURL(blob)
            customPhotoId = photo.id
            sceneId = 'custom'
            filled.clear()
            resetSoftErrorChain(placeChain)
            await refresh()
          })
          gallery.append(btn)
        }
      } catch {
        /* IndexedDB */
      }
    }

    function pieceStyle(id: number): string {
      const g = grid()
      return pieceCellBackground(id, g.cols, g.rows, tint(), imageSrc())
    }

    function appendSlotGhost(slot: HTMLElement, slotId: number): void {
      const ghost = document.createElement('span')
      ghost.className = 'puzzle-game__slot-ghost'
      ghost.setAttribute('aria-hidden', 'true')
      ghost.setAttribute('style', pieceStyle(slotId))
      slot.append(ghost)
    }

    const PIECE_DRAG_SCALE = 2
    const PIECE_SELECTED_SCALE = 2

    function clearSelection(): void {
      selectedPiece?.classList.remove('is-selected')
      selectedPiece?.style.removeProperty('transform')
      selectedPiece = null
      clearTargetHint()
    }

    function clearTargetHint(): void {
      board
        .querySelectorAll('.is-target-hint')
        .forEach((node) => node.classList.remove('is-target-hint'))
    }

    /** Куда положить этот кусочек (pieceId === slotId). */
    function showTargetHintForPiece(pieceId: number): void {
      clearTargetHint()
      board
        .querySelector(
          `.puzzle-game__slot[data-slot-id="${pieceId}"]:not(.is-filled)`,
        )
        ?.classList.add('is-target-hint')
    }

    function clearDragStyle(el: HTMLElement): void {
      el.style.position = ''
      el.style.left = ''
      el.style.top = ''
      el.style.width = ''
      el.style.height = ''
      el.style.zIndex = ''
      el.style.transform = ''
      el.dataset.x = '0'
      el.dataset.y = '0'
    }

    function returnPieceToTray(el: HTMLElement): void {
      clearDragStyle(el)
      el.classList.remove('is-dragging')
      clearTargetHint()
      if (!el.classList.contains('is-placed') && el.parentElement !== tray) {
        tray.append(el)
      }
    }

    function bindDrag(piece: HTMLElement): void {
      piece.style.touchAction = 'none'
      const interaction = interact(piece).draggable({
        listeners: {
          start(event) {
            const el = event.target as HTMLElement
            if (el.classList.contains('is-placed')) return
            playPuzzlePickup(audio)
            clearSelection()
            el.classList.add('is-dragging')
            showTargetHintForPiece(Number(el.dataset.pieceId))
            const r = el.getBoundingClientRect()
            floatLayer.append(el)
            el.style.position = 'fixed'
            el.style.left = `${r.left}px`
            el.style.top = `${r.top}px`
            el.style.width = `${r.width}px`
            el.style.height = `${r.height}px`
            el.style.zIndex = '120'
            el.dataset.x = '0'
            el.dataset.y = '0'
            el.style.transform = `scale(${PIECE_DRAG_SCALE})`
          },
          move(event) {
            const el = event.target as HTMLElement
            if (el.classList.contains('is-placed')) return
            const x = (Number.parseFloat(el.dataset.x ?? '0') || 0) + event.dx
            const y = (Number.parseFloat(el.dataset.y ?? '0') || 0) + event.dy
            el.dataset.x = String(x)
            el.dataset.y = String(y)
            el.style.transform = `translate(${x}px, ${y}px) scale(${PIECE_DRAG_SCALE})`
          },
          end(event) {
            const el = event.target as HTMLElement
            if (el.classList.contains('is-placed')) return
            tryPlace(el)
            if (!el.classList.contains('is-placed')) {
              returnPieceToTray(el)
            } else {
              clearTargetHint()
            }
          },
        },
      })
      dragCleanups.push(() => interaction.unset())
    }

    function onPieceTap(el: HTMLElement): void {
      if (el.classList.contains('is-placed')) return
      if (selectedPiece === el) {
        clearSelection()
        context.onSoftHint?.('Перетащи кусочек к рамке или тапни ячейку.')
        return
      }
      clearSelection()
      selectedPiece = el
      el.classList.add('is-selected')
      el.style.transform = `scale(${PIECE_SELECTED_SCALE})`
      showTargetHintForPiece(Number(el.dataset.pieceId))
      context.onSoftHint?.('Теперь тапни место на картинке.')
    }

    function onSlotTap(slot: HTMLElement): void {
      if (!selectedPiece || slot.classList.contains('is-filled')) return
      const source = selectedPiece
      clearSelection()
      tryPlace(source, slot)
    }

    function clearSlotHighlights(): void {
      board
        .querySelectorAll('.is-soft-highlight')
        .forEach((node) => node.classList.remove('is-soft-highlight'))
    }

    function highlightSlot(slotId: number): void {
      clearSlotHighlights()
      showTargetHintForPiece(slotId)
    }

    function tryPlace(el: HTMLElement, slotOverride?: HTMLElement): void {
      const pieceId = Number(el.dataset.pieceId)
      const pieceRect = el.getBoundingClientRect()

      let best: { slot: HTMLElement; id: number; dist: number } | null = null

      if (slotOverride) {
        best = {
          slot: slotOverride,
          id: Number(slotOverride.dataset.slotId),
          dist: 0,
        }
      } else {
        const candidates = [...board.querySelectorAll<HTMLElement>('.puzzle-game__slot')]
          .filter((slot) => !slot.classList.contains('is-filled'))
          .map((slot) => {
            const sr = slot.getBoundingClientRect()
            return {
              id: Number(slot.dataset.slotId),
              rect: {
                left: sr.left,
                top: sr.top,
                right: sr.right,
                bottom: sr.bottom,
                width: sr.width,
                height: sr.height,
              },
              slot,
            }
          })
        const hit = findSlotHitForPieceRect(
          pieceRect,
          candidates.map((c) => ({ id: c.id, rect: c.rect })),
        )
        if (hit) {
          const match = candidates.find((c) => c.id === hit.slotId)
          if (match) {
            best = { slot: match.slot, id: hit.slotId, dist: hit.dist }
          }
        }
      }

      const failHint = (kind: 'far' | 'wrong'): void => {
        const step = advanceSoftErrorChain(placeChain, {
          repeat:
            kind === 'far'
              ? 'Поднеси кусочек ближе к рамке.'
              : 'Этот уголок — в другое место.',
          nudge: 'Попробуй другой угол картинки.',
          beforeHighlight: 'Подсмотри, куда подходит этот кусочек.',
        })
        playSoftMiss(audio)
        el.classList.add('soft-wiggle')
        timers.track(window.setTimeout(() => el.classList.remove('soft-wiggle'), 450))
        context.onSoftHint?.(step.message)
        if (step.shouldHighlight) highlightSlot(pieceId)
        if (kind === 'wrong') playPuzzleWrong(audio)
      }

      if (!best) {
        failHint('far')
        return
      }

      const magnet = resolveMagnetDrop(
        String(pieceId),
        String(best.id),
        best.dist,
        slotOverride ? 0 : PUZZLE_FRAME_MAGNET_PX,
        'Этот кусочек сюда не подходит. Попробуй другое место.',
      )

      if (!magnet.snapped || !pieceFitsSlot(pieceId, best.id)) {
        failHint('wrong')
        return
      }

      recordSoftSuccess(placeChain)
      clearSlotHighlights()
      clearTargetHint()
      filled.add(pieceId)
      clearDragStyle(el)
      el.classList.remove('is-dragging')
      el.classList.add('is-placed', 'is-snapping')
      el.setAttribute('style', `${pieceStyle(pieceId)}; position:absolute; inset:0;`)
      best.slot.querySelector('.puzzle-game__slot-ghost')?.remove()
      best.slot.classList.add('is-filled')
      best.slot.append(el)
      timers.track(window.setTimeout(() => el.classList.remove('is-snapping'), 420))
      playPuzzleSnap(audio)

      const g = grid()
      applySeamsToBoard(board, filled, g)
      if (allSlotsFilled(filled, g)) {
        board.classList.add('is-celebrating')
        applySeamsMergedAll(board)
        playPuzzleComplete(audio)
        timers.track(window.setTimeout(() => board.classList.add('is-complete'), 680))
        context.onSoftHint?.(pickPuzzleCompletePraise())
      } else {
        context.onSoftHint?.(pickPuzzlePiecePraise())
      }
    }

    function renderBoard(): void {
      clearDrags()
      board.replaceChildren()
      tray.replaceChildren()
      board.classList.remove('is-complete', 'is-celebrating')

      const g = grid()
      root!.dataset.pieces = String(g.count)
      board.style.setProperty('--puzzle-cols', String(g.cols))
      board.style.setProperty('--puzzle-rows', String(g.rows))

      const slots = puzzleSlotIds(g)
      for (const id of slots) {
        const slot = document.createElement('div')
        slot.className = 'puzzle-game__slot'
        slot.dataset.slotId = String(id)
        slot.setAttribute('role', 'button')
        slot.tabIndex = 0
        slot.addEventListener('click', () => onSlotTap(slot))
        if (filled.has(id)) {
          slot.classList.add('is-filled')
        } else {
          appendSlotGhost(slot, id)
        }
        board.append(slot)
      }
      applySeamsToBoard(board, filled, g)

      const trayOrder = slots.filter((id) => !filled.has(id)).sort(() => Math.random() - 0.5)
      for (const id of trayOrder) {
        const piece = document.createElement('button')
        piece.type = 'button'
        piece.className = 'puzzle-game__piece'
        piece.dataset.pieceId = String(id)
        piece.setAttribute('aria-label', 'Кусочек пазла')
        piece.setAttribute('style', pieceStyle(id))
        piece.addEventListener('click', () => onPieceTap(piece))
        tray.append(piece)
        bindDrag(piece)
      }
    }

    async function refresh(): Promise<void> {
      root!.dataset.scene = sceneId
      revokeCustomThumbs()
      await renderGallery()
      renderBoard()
      const n = puzzleSettings.pieceCount
      context.onSoftHint?.(`Собери картинку из ${n} кусочков.`)
    }

    void refresh()

    cleanup = () => {
      timers.clear()
      cancelCrop?.()
      closeAdult?.()
      context.chromeGameActions?.replaceChildren()
      clearDrags()
      revokeCustomThumbs()
      if (customUrl) URL.revokeObjectURL(customUrl)
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
