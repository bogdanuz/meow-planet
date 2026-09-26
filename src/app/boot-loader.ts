import type { BootProgress } from './pwa-boot'

const BOOT_LETTER_COLORS = ['#e07a5f', '#f2c14e', '#7eb8da', '#7dae6a', '#b7a0d4']

function paintBootWord(el: HTMLElement, word: string): void {
  el.replaceChildren()
  for (const [index, letter] of [...word].entries()) {
    const span = document.createElement('span')
    span.className = 'boot-loader__letter'
    span.style.color = BOOT_LETTER_COLORS[index % BOOT_LETTER_COLORS.length]
    span.textContent = letter
    el.append(span)
  }
}

export type BootLoaderHandle = {
  setProgress: (progress: BootProgress) => void
  unmount: () => void
}

/**
 * Детский splash с % — до welcome и precache (P15-05).
 */
export function mountBootLoader(container: HTMLElement): BootLoaderHandle {
  const layer = document.createElement('div')
  layer.className = 'boot-loader'
  layer.setAttribute('role', 'status')
  layer.setAttribute('aria-live', 'polite')
  layer.setAttribute('aria-label', 'Планета Мяу')

  const bg = document.createElement('img')
  bg.className = 'boot-loader__bg'
  bg.alt = ''
  bg.src = `${import.meta.env.BASE_URL}assets/shell/welcome-bg.webp`

  const message = document.createElement('p')
  message.className = 'boot-loader__message'
  message.textContent = 'Готовим…'

  const track = document.createElement('div')
  track.className = 'boot-loader__track'
  track.setAttribute('aria-hidden', 'true')

  const fill = document.createElement('div')
  fill.className = 'boot-loader__fill'
  fill.style.width = '0%'

  const percent = document.createElement('p')
  percent.className = 'boot-loader__percent'
  paintBootWord(percent, '0%')

  track.append(fill)
  layer.append(bg, message, track, percent)
  container.replaceChildren(layer)

  return {
    setProgress({ percent: pct, message: msg }) {
      const clamped = Math.max(0, Math.min(100, Math.round(pct)))
      fill.style.width = `${clamped}%`
      paintBootWord(percent, `${clamped}%`)
      message.textContent = msg
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
