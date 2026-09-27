import {
  clampCoverPan,
  initialCoverPan,
  type CoverPan,
} from '../../shared/puzzle-crop-math'
import { savePuzzlePhotoFromBitmap } from '../../shared/puzzle-photos'

export type PuzzleCropModalResult = { id: string } | null

/**
 * Полноэкранный редактор кадра 4:3 (альбом). Pan drag по фото.
 */
export function openPuzzleCropModal(
  host: HTMLElement,
  file: File,
): { done: Promise<PuzzleCropModalResult>; cancel: () => void } {
  void host
  let cancel = (): void => {}
  const done = new Promise<PuzzleCropModalResult>((resolve) => {
    let disposed = false
    let bitmap: ImageBitmap | null = null
    let pan: CoverPan = initialCoverPan(1, 1, 400, 300)
    let panReady = false

    const overlay = document.createElement('div')
    overlay.className = 'puzzle-crop-modal'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-label', 'Подогнать фото под пазл')

    const frame = document.createElement('div')
    frame.className = 'puzzle-crop-modal__frame'

    const canvas = document.createElement('canvas')
    canvas.className = 'puzzle-crop-modal__canvas'

    const actions = document.createElement('div')
    actions.className = 'puzzle-crop-modal__actions'

    const cancelBtn = document.createElement('button')
    cancelBtn.type = 'button'
    cancelBtn.className = 'touch-btn touch-btn--quiet'
    cancelBtn.textContent = 'Отмена'

    const saveBtn = document.createElement('button')
    saveBtn.type = 'button'
    saveBtn.className = 'touch-btn'
    saveBtn.textContent = 'Готово'

    actions.append(cancelBtn, saveBtn)
    overlay.append(frame, actions)
    // iOS/PWA: fixed-оверлеи иногда клипятся ближайшими контейнерами с overflow:hidden.
    // Подвешиваем к body, чтобы overlay корректно занимал весь viewport.
    document.body.append(overlay)

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      overlay.remove()
      resolve(null)
      return
    }

    function layout(): void {
      const rect = frame.getBoundingClientRect()
      const viewW = Math.max(200, Math.floor(rect.width))
      const viewH = Math.max(150, Math.floor(rect.height))
      canvas.width = viewW
      canvas.height = viewH
      if (bitmap) {
        const base = initialCoverPan(bitmap.width, bitmap.height, viewW, viewH)
        pan = panReady
          ? clampCoverPan({ ...base, panX: pan.panX, panY: pan.panY }, bitmap.width, bitmap.height)
          : base
        panReady = true
      }
      draw()
    }

    function draw(): void {
      if (!bitmap || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const dw = bitmap.width * pan.scale
      const dh = bitmap.height * pan.scale
      ctx.drawImage(bitmap, pan.panX, pan.panY, dw, dh)
    }

    let dragStart: { x: number; y: number; panX: number; panY: number } | null = null

    function onPointerDown(e: PointerEvent): void {
      if (!bitmap) return
      frame.setPointerCapture(e.pointerId)
      dragStart = { x: e.clientX, y: e.clientY, panX: pan.panX, panY: pan.panY }
    }

    function onPointerMove(e: PointerEvent): void {
      if (!dragStart || !bitmap) return
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      pan = clampCoverPan(
        { ...pan, panX: dragStart.panX + dx, panY: dragStart.panY + dy },
        bitmap.width,
        bitmap.height,
      )
      draw()
    }

    function onPointerUp(e: PointerEvent): void {
      if (dragStart) {
        try {
          frame.releasePointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }
      dragStart = null
    }

    function dispose(result: PuzzleCropModalResult): void {
      if (disposed) return
      disposed = true
      frame.removeEventListener('pointerdown', onPointerDown)
      frame.removeEventListener('pointermove', onPointerMove)
      frame.removeEventListener('pointerup', onPointerUp)
      frame.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('resize', layout)
      bitmap?.close()
      bitmap = null
      overlay.remove()
      resolve(result)
    }

    cancel = () => dispose(null)

    cancelBtn.addEventListener('click', () => dispose(null))
    saveBtn.addEventListener('click', async () => {
      if (!bitmap) {
        dispose(null)
        return
      }
      saveBtn.disabled = true
      try {
        const clone = await createImageBitmap(bitmap)
        const meta = await savePuzzlePhotoFromBitmap(clone, pan)
        dispose({ id: meta.id })
      } catch {
        saveBtn.disabled = false
      }
    })

    frame.append(canvas)
    frame.addEventListener('pointerdown', onPointerDown)
    frame.addEventListener('pointermove', onPointerMove)
    frame.addEventListener('pointerup', onPointerUp)
    frame.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('resize', layout)

    void createImageBitmap(file)
      .then((bm) => {
        bitmap = bm
        layout()
      })
      .catch(() => dispose(null))
  })
  return { done, cancel }
}
