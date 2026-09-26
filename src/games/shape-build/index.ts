import interact from 'interactjs'
import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { placeholderClass } from '../../shared/placeholders'
import { createTimerBag } from '../../shared/timer-bag'
import {
  advanceSoftErrorChain,
  createSoftErrorChain,
  recordSoftSuccess,
  resetSoftErrorChain,
} from '../../shared/soft-error-chain'
import {
  asPlaceholderShape,
  getTemplate,
  softHintForShape,
  TEMPLATE_IDS,
  TEMPLATE_PICKER_TINT,
  type ShapeKind,
  type SlotSpec,
  type TemplateId,
  type TemplateSpec,
} from './logic'
import { pickShapeCompletePraise, pickShapeDropPraise } from './praise'
import { findSlotHitForShapePiece } from './slot-magnet'
import {
  playShapeComplete,
  playShapePickup,
  playShapeSnap,
  playShapeWrong,
} from './shape-build-sfx'
import './shape-build.css'

const PIECE_DRAG_SCALE = 1.14
const PIECE_SELECTED_SCALE = 1.1

export const shapeBuildGame: GameModule = {
  meta: {
    id: 'shape-build',
    title: 'Собери фигурку',
    zoneId: 'star-workshop',
    modules: ['2.5'],
  },

  mount(container, context) {
    unmountInternal()

    const audio = createAudioManager({
      soundEnabled: context.settings.soundEnabled,
      musicEnabled: context.settings.musicEnabled,
      quietMode: context.settings.quietMode,
    })
    void audio.unlock()

    let template = getTemplate('house')
    const filled = new Set<string>()
    const dragCleanups: Array<() => void> = []
    const snapChain = createSoftErrorChain()
    const timers = createTimerBag()
    let selectedPiece: HTMLElement | null = null

    root = document.createElement('section')
    root.className = 'shape-build'
    root.dataset.gameId = 'shape-build'
    root.dataset.template = template.id

    const picker = document.createElement('aside')
    picker.className = 'shape-build__picker'
    picker.setAttribute('aria-label', 'Выбор фигурки')

    const work = document.createElement('div')
    work.className = 'shape-build__work'

    const boardWrap = document.createElement('div')
    boardWrap.className = 'shape-build__board-wrap'

    const board = document.createElement('div')
    board.className = 'shape-build__board'
    board.setAttribute('aria-label', 'Образец')

    const tray = document.createElement('div')
    tray.className = 'shape-build__tray'
    tray.setAttribute('aria-label', 'Фигуры')

    const floatLayer = document.createElement('div')
    floatLayer.className = 'shape-build__float'
    floatLayer.setAttribute('aria-hidden', 'true')

    boardWrap.append(board)
    work.append(boardWrap, tray, floatLayer)
    root.append(picker, work)
    container.replaceChildren(root)

    function renderPicker(): void {
      picker.replaceChildren()
      for (const id of TEMPLATE_IDS) {
        const spec = getTemplate(id)
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'shape-build__pick touch-btn'
        if (id === template.id) btn.classList.add('is-active')
        btn.dataset.templateId = id
        btn.setAttribute('aria-label', spec.titleRu)

        const preview = document.createElement('span')
        preview.className = 'shape-build__pick-preview'
        preview.dataset.template = id
        preview.style.background = `linear-gradient(145deg, ${TEMPLATE_PICKER_TINT[id]}, #fff8f0)`
        preview.setAttribute('aria-hidden', 'true')
        btn.append(preview)
        btn.addEventListener('click', () => loadTemplate(id))
        picker.append(btn)
      }
    }

    function clearDrags(): void {
      for (const fn of dragCleanups) fn()
      dragCleanups.length = 0
    }

    function clearCelebration(): void {
      board.classList.remove('is-celebrating')
    }

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

    function showTargetHintForHomeSlot(homeSlotId: string): void {
      clearTargetHint()
      board
        .querySelector(
          `.shape-build__slot[data-slot-id="${homeSlotId}"]:not(.is-filled)`,
        )
        ?.classList.add('is-target-hint')
    }

    function highlightShapeSlots(shape: ShapeKind): void {
      board
        .querySelectorAll('.is-soft-highlight')
        .forEach((node) => node.classList.remove('is-soft-highlight'))
      for (const slot of template.slots) {
        if (filled.has(slot.id) || slot.shape !== shape) continue
        board
          .querySelector(`.shape-build__slot[data-slot-id="${slot.id}"]`)
          ?.classList.add('is-soft-highlight')
      }
    }

    function loadTemplate(id: TemplateId): void {
      template = getTemplate(id)
      filled.clear()
      resetSoftErrorChain(snapChain)
      clearSelection()
      clearCelebration()
      root!.dataset.template = id
      renderPicker()
      renderBoardAndTray()
      context.onSoftHint?.(`Собери: ${template.titleRu}.`)
    }

    function renderSlots(spec: TemplateSpec): void {
      for (const slot of spec.slots) {
        const el = document.createElement('div')
        el.className = 'shape-build__slot'
        el.dataset.slotId = slot.id
        el.dataset.shape = slot.shape
        el.dataset.color = slot.color
        el.style.left = `${slot.xPct}%`
        el.style.top = `${slot.yPct}%`
        if (filled.has(slot.id)) el.classList.add('is-filled')

        const ghost = document.createElement('span')
        ghost.className = placeholderClass(
          asPlaceholderShape(slot.shape),
          slot.color,
        )
        ghost.setAttribute('aria-hidden', 'true')
        el.append(ghost)

        el.addEventListener('click', () => onSlotTap(el))
        board.append(el)
      }
    }

    function createPiece(slot: SlotSpec): HTMLButtonElement {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'shape-build__piece'
      btn.dataset.pieceId = `piece-${slot.id}`
      btn.dataset.slotId = slot.id
      btn.dataset.homeSlotId = slot.id
      btn.dataset.shape = slot.shape
      btn.dataset.color = slot.color
      btn.setAttribute('aria-label', `Фигура ${slot.shape}`)

      const visual = document.createElement('span')
      visual.className = placeholderClass(
        asPlaceholderShape(slot.shape),
        slot.color,
      )
      visual.setAttribute('aria-hidden', 'true')
      btn.append(visual)

      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        onPieceTap(btn)
      })
      return btn
    }

    function clearDragStyle(el: HTMLElement): void {
      el.style.position = ''
      el.style.left = ''
      el.style.top = ''
      el.style.width = ''
      el.style.height = ''
      el.style.zIndex = ''
      el.dataset.x = '0'
      el.dataset.y = '0'
    }

    function returnPieceToTray(el: HTMLElement): void {
      clearDragStyle(el)
      el.classList.remove('is-dragging')
      el.style.transform = ''
      if (!el.classList.contains('is-placed') && el.parentElement !== tray) {
        tray.append(el)
      }
    }

    function bindPieceDrag(piece: HTMLElement): void {
      piece.style.touchAction = 'none'
      const interaction = interact(piece).draggable({
        inertia: false,
        listeners: {
          start(event) {
            const el = event.target as HTMLElement
            if (el.classList.contains('is-placed')) return
            playShapePickup(audio)
            clearSelection()
            el.classList.add('is-dragging')
            showTargetHintForHomeSlot(el.dataset.homeSlotId ?? el.dataset.slotId ?? '')
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
            el.classList.remove('is-dragging')
            trySnap(el)
            if (!el.classList.contains('is-placed')) {
              returnPieceToTray(el)
            } else {
              clearTargetHint()
            }
          },
        },
      })
      dragCleanups.push(() => {
        interaction.unset()
        piece.style.touchAction = ''
      })
    }

    function slotCandidatesFromDom(): Array<{
      id: string
      shape: ShapeKind
      color: string
      rect: DOMRect
    }> {
      return [...board.querySelectorAll<HTMLElement>('.shape-build__slot')].map(
        (el) => ({
          id: el.dataset.slotId!,
          shape: el.dataset.shape as ShapeKind,
          color: el.dataset.color ?? '',
          rect: el.getBoundingClientRect(),
        }),
      )
    }

    function resolveSlotSpec(slotId: string): SlotSpec | undefined {
      return template.slots.find((s) => s.id === slotId)
    }

    function trySnap(el: HTMLElement, slotOverride?: HTMLElement): void {
      const shape = el.dataset.shape as ShapeKind | undefined
      const color = el.dataset.color
      const homeSlotId = el.dataset.homeSlotId ?? el.dataset.slotId
      if (!shape || !color || !homeSlotId) return

      const pieceRect = el.getBoundingClientRect()
      let targetSlotId: string | null = null

      if (slotOverride && !slotOverride.classList.contains('is-filled')) {
        if (slotOverride.dataset.shape === shape && slotOverride.dataset.color === color) {
          targetSlotId = slotOverride.dataset.slotId ?? null
        }
      } else {
        targetSlotId = findSlotHitForShapePiece(
          pieceRect,
          slotCandidatesFromDom(),
          shape,
          color,
          filled,
        )
      }

      const softSnapMiss = (): void => {
        playShapeWrong(audio)
        const step = advanceSoftErrorChain(snapChain, {
          repeat: softHintForShape(shape),
          nudge: 'Ближе к подходящему месту.',
          beforeHighlight: 'Смотри, куда подходит эта фигура.',
        })
        if (!el.classList.contains('is-placed')) {
          returnPieceToTray(el)
        }
        el.classList.add('is-returning', 'soft-wiggle')
        timers.track(
          window.setTimeout(() => {
            el.classList.remove('is-returning', 'soft-wiggle')
          }, 420),
        )
        context.onSoftHint?.(step.message)
        if (step.shouldHighlight) highlightShapeSlots(shape)
      }

      if (!targetSlotId) {
        softSnapMiss()
        return
      }

      const slotSpec = resolveSlotSpec(targetSlotId)
      if (!slotSpec || slotSpec.shape !== shape || slotSpec.color !== color) {
        softSnapMiss()
        return
      }

      recordSoftSuccess(snapChain)
      board
        .querySelectorAll('.is-soft-highlight')
        .forEach((node) => node.classList.remove('is-soft-highlight'))
      clearTargetHint()

      el.dataset.slotId = targetSlotId
      el.dataset.homeSlotId = homeSlotId

      placePieceOnSlot(el, slotSpec)
      playShapeSnap(audio)

      if (filled.size >= template.slots.length) {
        board.classList.add('is-celebrating')
        playShapeComplete(audio)
        context.onSoftHint?.(pickShapeCompletePraise())
      } else {
        context.onSoftHint?.(pickShapeDropPraise())
      }
    }

    function placePieceOnSlot(el: HTMLElement, slot: SlotSpec): void {
      const slotId = slot.id
      filled.add(slotId)
      clearDragStyle(el)
      el.classList.remove('is-dragging', 'is-selected')
      el.style.transform = ''
      el.classList.add('is-placed')
      el.style.left = `${slot.xPct}%`
      el.style.top = `${slot.yPct}%`
      board.append(el)

      const slotEl = board.querySelector(`[data-slot-id="${slotId}"]`)
      slotEl?.classList.add('is-filled')
    }

    function onPieceTap(el: HTMLElement): void {
      if (el.classList.contains('is-placed')) return
      if (selectedPiece === el) {
        clearSelection()
        context.onSoftHint?.('Тапни место на картинке или потяни фигурку.')
        return
      }
      clearSelection()
      selectedPiece = el
      el.classList.add('is-selected')
      el.style.transform = `scale(${PIECE_SELECTED_SCALE})`
      showTargetHintForHomeSlot(el.dataset.homeSlotId ?? el.dataset.slotId ?? '')
      context.onSoftHint?.('Тапни место на картинке.')
    }

    function onSlotTap(slot: HTMLElement): void {
      if (!selectedPiece || slot.classList.contains('is-filled')) return
      const source = selectedPiece
      clearSelection()
      trySnap(source, slot)
    }

    function renderBoardAndTray(): void {
      clearDrags()
      board.replaceChildren()
      tray.replaceChildren()
      renderSlots(template)

      for (const slot of template.slots) {
        if (filled.has(slot.id)) continue
        const piece = createPiece(slot)
        tray.append(piece)
        bindPieceDrag(piece)
      }
    }

    renderPicker()
    renderBoardAndTray()
    context.onSoftHint?.(`Собери: ${template.titleRu}.`)

    cleanup = () => {
      timers.clear()
      clearDrags()
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
