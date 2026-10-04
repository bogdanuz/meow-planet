import {
  clampPhotoCrop,
  drawPhotoCrop,
  initialPhotoCrop,
  pinchPhotoCrop,
  rotatePhotoCrop,
  zoomPhotoCrop,
  type PhotoCrop,
  type Point,
} from './photo-crop-math'
import './photo-crop-editor.css'

export type PhotoCropEditor = {
  /** JPEG кадра под лист или null, если нажали «Отмена». */
  done: Promise<Blob | null>
  close: () => void
}

export type PhotoCropOptions = {
  image: CanvasImageSource
  width: number
  height: number
  /** Где на экране лист: рамка редактора ложится ровно на него. */
  frame: () => DOMRect
  outputWidth?: number
}

type Rect = { left: number; top: number; width: number; height: number }

/** Уменьшить большое фото с телефона до разумного размера перед кадрированием. */
export async function shrinkPhoto(file: File, maxSide = 1280): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  if (!ctx) return file
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.82))
  return blob ?? file
}

export function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob)
  const image = new Image()
  return new Promise((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('photo'))
    }
    image.src = url
  })
}

/**
 * Редактор фото-фона поверх листа: двигать пальцем, два пальца — масштаб и поворот,
 * кнопки «Повернуть», «−», «+». «Готово» отдаёт кадр как цельный фон листа.
 */
export function openPhotoCropEditor(options: PhotoCropOptions): PhotoCropEditor {
  const { image, width: imgW, height: imgH } = options
  let close = (): void => {}
  const done = new Promise<Blob | null>((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'photo-crop'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-label', 'Подогнать фото под лист')

    const view = document.createElement('canvas')
    view.className = 'photo-crop__view'

    const bar = document.createElement('div')
    bar.className = 'photo-crop__bar'
    const button = (label: string, text: string, role: string, extra = ''): HTMLButtonElement => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = `touch-btn photo-crop__btn ${extra}`.trim()
      el.setAttribute('aria-label', label)
      el.dataset.role = role
      el.textContent = text
      return el
    }
    const cancelBtn = button('Отмена', 'Отмена', 'crop-cancel', 'touch-btn--quiet')
    const rotateBtn = button('Повернуть', '↻', 'crop-rotate', 'photo-crop__btn--icon')
    const zoomOutBtn = button('Уменьшить', '−', 'crop-zoom-out', 'photo-crop__btn--icon')
    const zoomInBtn = button('Увеличить', '+', 'crop-zoom-in', 'photo-crop__btn--icon')
    const doneBtn = button('Готово', 'Готово', 'crop-done', 'photo-crop__btn--done')
    const tools = document.createElement('div')
    tools.className = 'photo-crop__tools'
    tools.append(rotateBtn, zoomOutBtn, zoomInBtn)
    bar.append(cancelBtn, tools, doneBtn)
    overlay.append(view, bar)
    document.body.append(overlay)

    let frame: Rect = readFrame()
    let crop: PhotoCrop = initialPhotoCrop(imgW, imgH, frame.width, frame.height)
    let finished = false
    const pointers = new Map<number, Point>()
    let gesture: { crop: PhotoCrop; points: Point[] } | null = null

    function readFrame(): Rect {
      const rect = options.frame()
      return { left: rect.left, top: rect.top, width: Math.max(1, rect.width), height: Math.max(1, rect.height) }
    }

    const clamp = (next: PhotoCrop) => clampPhotoCrop(next, imgW, imgH, frame.width, frame.height)

    function draw(): void {
      const ctx = view.getContext('2d')
      if (!ctx) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = window.innerWidth
      const h = window.innerHeight
      if (view.width !== Math.round(w * dpr) || view.height !== Math.round(h * dpr)) {
        view.width = Math.round(w * dpr)
        view.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(frame.left, frame.top)
      drawPhotoCrop(ctx, image, imgW, imgH, crop, frame.width, frame.width, frame.height)
      ctx.restore()
      // Всё вне листа приглушено: видно, какая часть фото станет фоном.
      ctx.fillStyle = 'rgb(38 30 22 / 62%)'
      ctx.beginPath()
      ctx.rect(0, 0, w, h)
      ctx.rect(frame.left, frame.top, frame.width, frame.height)
      ctx.fill('evenodd')
      ctx.lineWidth = 4
      ctx.strokeStyle = '#fffdf8'
      ctx.strokeRect(frame.left - 2, frame.top - 2, frame.width + 4, frame.height + 4)
    }

    function local(event: PointerEvent): Point {
      return { x: event.clientX - frame.left, y: event.clientY - frame.top }
    }

    function restartGesture(): void {
      gesture = pointers.size > 0 ? { crop, points: [...pointers.values()].slice(0, 2) } : null
    }

    function onDown(event: PointerEvent): void {
      if (pointers.size >= 2) return
      view.setPointerCapture?.(event.pointerId)
      pointers.set(event.pointerId, local(event))
      restartGesture()
    }

    function onMove(event: PointerEvent): void {
      if (!pointers.has(event.pointerId) || !gesture) return
      pointers.set(event.pointerId, local(event))
      const now = [...pointers.values()].slice(0, 2)
      const [a0, b0] = gesture.points
      if (now.length >= 2 && a0 && b0) {
        crop = clamp(pinchPhotoCrop(gesture.crop, [a0, b0], [now[0]!, now[1]!], frame.width, frame.height))
      } else if (now[0] && a0) {
        crop = clamp({ ...gesture.crop, x: gesture.crop.x + now[0].x - a0.x, y: gesture.crop.y + now[0].y - a0.y })
      }
      draw()
    }

    function onUp(event: PointerEvent): void {
      if (!pointers.delete(event.pointerId)) return
      restartGesture()
    }

    function onWheel(event: WheelEvent): void {
      event.preventDefault()
      const anchor = { x: event.clientX - frame.left, y: event.clientY - frame.top }
      crop = zoomPhotoCrop(crop, Math.exp(-event.deltaY * 0.0015), imgW, imgH, frame.width, frame.height, anchor)
      draw()
    }

    function onResize(): void {
      const next = readFrame()
      const k = next.width / frame.width
      frame = next
      crop = clamp({ ...crop, x: crop.x * k, y: crop.y * k, scale: crop.scale * k })
      draw()
    }

    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') finish(null)
    }

    function finish(result: Blob | null): void {
      if (finished) return
      finished = true
      view.removeEventListener('pointerdown', onDown)
      view.removeEventListener('pointermove', onMove)
      view.removeEventListener('pointerup', onUp)
      view.removeEventListener('pointercancel', onUp)
      view.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
      overlay.remove()
      resolve(result)
    }

    async function exportCrop(): Promise<void> {
      const outW = options.outputWidth ?? 1600
      const outH = Math.round((outW * frame.height) / frame.width)
      const out = document.createElement('canvas')
      out.width = outW
      out.height = outH
      const ctx = out.getContext('2d')
      if (!ctx) {
        finish(null)
        return
      }
      ctx.fillStyle = '#fffdf8'
      ctx.fillRect(0, 0, outW, outH)
      drawPhotoCrop(ctx, image, imgW, imgH, crop, frame.width, outW, outH)
      const blob = await new Promise<Blob | null>((done) => {
        try {
          out.toBlob((value) => done(value), 'image/jpeg', 0.86)
        } catch {
          done(null)
        }
      })
      finish(blob)
    }

    view.addEventListener('pointerdown', onDown)
    view.addEventListener('pointermove', onMove)
    view.addEventListener('pointerup', onUp)
    view.addEventListener('pointercancel', onUp)
    view.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)

    cancelBtn.addEventListener('click', () => finish(null))
    rotateBtn.addEventListener('click', () => {
      crop = rotatePhotoCrop(crop, imgW, imgH, frame.width, frame.height)
      draw()
    })
    zoomOutBtn.addEventListener('click', () => {
      crop = zoomPhotoCrop(crop, 1 / 1.25, imgW, imgH, frame.width, frame.height)
      draw()
    })
    zoomInBtn.addEventListener('click', () => {
      crop = zoomPhotoCrop(crop, 1.25, imgW, imgH, frame.width, frame.height)
      draw()
    })
    doneBtn.addEventListener('click', () => {
      doneBtn.disabled = true
      void exportCrop()
    })

    close = () => finish(null)
    draw()
  })
  return { done, close }
}
