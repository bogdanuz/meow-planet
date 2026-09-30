import type { BootProgress } from './pwa-boot'

export type BootLoaderHandle = {
  setProgress: (progress: BootProgress) => void
  setError: (message: string) => void
  setRetryHandler: (handler: () => void) => void
  unmount: () => void
}

/**
 * Детский splash с % — до welcome и precache (P15-05).
 */
export function mountBootLoader(container: HTMLElement): BootLoaderHandle {
  const layer = document.createElement('div')
  layer.className = 'boot-loader'
  layer.style.setProperty('--boot-leaf-clear', '0%')
  layer.style.setProperty('--boot-leaf-fade-start', '0%')
  layer.style.setProperty('--boot-leaf-fade-end', '0%')
  layer.style.setProperty('--boot-owl-left', '1%')
  layer.setAttribute('role', 'region')
  layer.setAttribute('aria-label', 'Установка и подготовка игр')

  const bg = document.createElement('img')
  bg.className = 'boot-loader__bg'
  bg.alt = ''
  bg.src = `${import.meta.env.BASE_URL}assets/shell/boot/boot-forest-bg.webp`

  const shade = document.createElement('div')
  shade.className = 'boot-loader__shade'
  shade.setAttribute('aria-hidden', 'true')

  const header = document.createElement('header')
  header.className = 'boot-loader__header'

  const title = document.createElement('img')
  title.className = 'boot-loader__title'
  title.src = `${import.meta.env.BASE_URL}assets/shell/boot/boot-title.png`
  title.alt = 'Установка и подготовка игр'

  const caption = document.createElement('p')
  caption.className = 'boot-loader__caption'
  caption.textContent = 'Скачиваем один раз — потом можно играть без интернета'
  header.append(title, caption)

  const meter = document.createElement('div')
  meter.className = 'boot-loader__meter'
  meter.setAttribute('role', 'progressbar')
  meter.setAttribute('aria-label', 'Подготовка файлов')
  meter.setAttribute('aria-valuemin', '0')
  meter.setAttribute('aria-valuemax', '100')
  meter.setAttribute('aria-valuenow', '0')

  const leaves = document.createElement('img')
  leaves.className = 'boot-loader__leaves'
  leaves.src = `${import.meta.env.BASE_URL}assets/shell/boot/boot-leaves.png`
  leaves.alt = ''

  const owlShadow = document.createElement('div')
  owlShadow.className = 'boot-loader__owl-shadow'
  owlShadow.setAttribute('aria-hidden', 'true')

  const owl = document.createElement('div')
  owl.className = 'boot-loader__owl'
  owl.style.backgroundImage = `url("${import.meta.env.BASE_URL}assets/shell/boot/boot-owl-vacuum.png")`
  owl.setAttribute('aria-hidden', 'true')
  meter.append(leaves, owlShadow, owl)

  const panel = document.createElement('div')
  panel.className = 'boot-loader__panel'

  const progress = document.createElement('p')
  progress.className = 'boot-loader__progress'
  progress.textContent = '0%'

  const message = document.createElement('p')
  message.className = 'boot-loader__message'
  message.textContent = 'Считаем файлы…'
  message.setAttribute('role', 'status')
  message.setAttribute('aria-live', 'polite')
  message.setAttribute('aria-atomic', 'true')

  const retry = document.createElement('button')
  retry.type = 'button'
  retry.className = 'boot-loader__retry'
  retry.textContent = 'Повторить'
  retry.hidden = true

  panel.append(progress, message, retry)
  layer.append(bg, shade, header, meter, panel)
  container.replaceChildren(layer)

  let onRetry: (() => void) | null = null
  let displayedPercent = 0
  retry.addEventListener('click', () => onRetry?.())

  return {
    setProgress({ percent: pct, message: msg, doneCount, totalCount }) {
      const clamped = Math.max(0, Math.min(100, Math.round(pct)))
      if (clamped >= displayedPercent) {
        displayedPercent = clamped
        const fadeStart = clamped === 100 ? 100 : Math.max(0, clamped - 4)
        const fadeEnd = clamped === 0 ? 0 : Math.min(100, clamped + 4)
        layer.style.setProperty('--boot-leaf-clear', `${clamped}%`)
        layer.style.setProperty('--boot-leaf-fade-start', `${fadeStart}%`)
        layer.style.setProperty('--boot-leaf-fade-end', `${fadeEnd}%`)
        layer.style.setProperty('--boot-owl-left', `${1 + clamped * 0.73}%`)
        meter.setAttribute('aria-valuenow', String(clamped))
        progress.textContent =
          doneCount != null && totalCount != null
            ? `${doneCount} из ${totalCount} файлов • ${clamped}%`
            : `${clamped}%`
      }
      message.textContent = msg
      layer.classList.remove('boot-loader--error')
      retry.hidden = true
    },
    setError(msg: string) {
      // Ошибка сохраняет честно достигнутую позицию: ничего не откатываем к нулю.
      message.textContent = msg
      retry.hidden = false
      layer.classList.add('boot-loader--error')
    },
    setRetryHandler(handler: () => void) {
      onRetry = handler
    },
    unmount() {
      layer.classList.add('boot-loader--leave')
      window.setTimeout(() => {
        if (layer.parentElement === container) {
          container.replaceChildren()
        }
      }, 380)
    },
  }
}
