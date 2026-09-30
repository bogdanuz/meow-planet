export type PoseSlot = {
  under: HTMLImageElement
  show: (url: string) => Promise<void>
}

function samePose(img: HTMLImageElement, url: string): boolean {
  const attr = img.getAttribute('src') ?? ''
  if (attr === url) return true
  try {
    return img.src === new URL(url, window.location.href).href
  } catch {
    return false
  }
}

/**
 * Два слоя одной картинки. Новый кадр рисуется на скрытом слое
 * и показывается только когда уже загружен, без пустого промежутка.
 */
export function createPoseSlot(
  img: HTMLImageElement,
  underClass = 'is-pose-under',
): PoseSlot {
  const under = document.createElement('img')
  under.className = `${img.className} ${underClass}`.trim()
  under.alt = ''
  under.decoding = 'sync'
  under.setAttribute('aria-hidden', 'true')
  under.style.opacity = '0'
  const initial = img.getAttribute('src')
  if (initial) under.src = initial
  img.decoding = 'sync'
  img.after(under)

  let front: HTMLImageElement = img
  let back: HTMLImageElement = under
  let seq = 0

  const show = (url: string): Promise<void> => {
    if (samePose(front, url)) return Promise.resolve()
    const token = ++seq
    return new Promise((resolve) => {
      let settled = false
      const reveal = () => {
        if (settled || token !== seq) {
          resolve()
          return
        }
        settled = true
        back.style.opacity = '1'
        front.style.opacity = '0'
        const previous = front
        front = back
        back = previous
        resolve()
      }
      back.addEventListener('load', reveal, { once: true })
      back.addEventListener('error', reveal, { once: true })
      back.src = url
      if (back.complete && back.naturalWidth > 0) reveal()
    })
  }

  return { under, show }
}
