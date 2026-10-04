import { addSoftShadow, type SoftShadow } from '../shared/soft-shadow'
import type { BootProgress } from './pwa-boot'

export type BootLoaderHandle = {
  setProgress: (progress: BootProgress) => void
  setError: (message: string) => void
  setRetryHandler: (handler: () => void) => void
  /** Финал после 100%: сова проходит и всасывает листья. */
  finish: () => Promise<void>
  unmount: () => void
}

/** Должно совпадать с длительностью `boot-sweep` в shell.css. */
const FINALE_MS = 1100
const FINALE_REDUCED_MS = 300
const LEAVE_MS = 380
const SWIRL_LEAVES = 4

const OWL_SHADOW: SoftShadow = { x: 0, y: 5, blur: 3, color: 'rgb(68 39 24 / 22%)' }
const LEAVES_SHADOW: SoftShadow = { x: 0, y: 4, blur: 3, color: 'rgb(86 51 30 / 20%)' }

function bootAsset(name: string): string {
  return `${import.meta.env.BASE_URL}assets/shell/boot/${name}`
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Детский splash до welcome (P15-05): сова ждёт у кучи листьев, пока внизу
 * заполняется полоска; на 100% всасывает листья и экран тает поверх welcome.
 * Слой добавляется в `container` (обычно body), а не в #app: shell под ним
 * строится во время финала, и слой не пересоздаётся.
 */
export function mountBootLoader(container: HTMLElement): BootLoaderHandle {
  const layer = document.createElement('div')
  layer.className = 'boot-loader'
  layer.style.setProperty('--boot-progress', '0')
  layer.setAttribute('role', 'region')
  layer.setAttribute('aria-label', 'Установка и подготовка игр')

  const bg = document.createElement('img')
  bg.className = 'boot-loader__bg'
  bg.alt = ''
  bg.src = bootAsset('boot-forest-bg.webp')

  const shade = document.createElement('div')
  shade.className = 'boot-loader__shade'
  shade.setAttribute('aria-hidden', 'true')

  const header = document.createElement('header')
  header.className = 'boot-loader__header'

  const title = document.createElement('img')
  title.className = 'boot-loader__title'
  title.src = bootAsset('boot-title.png')
  title.alt = 'Установка и подготовка игр'

  const caption = document.createElement('p')
  caption.className = 'boot-loader__caption'
  caption.textContent = 'Скачиваем один раз — потом можно играть без интернета'
  header.append(title, caption)

  const scene = document.createElement('div')
  scene.className = 'boot-loader__meter'
  scene.setAttribute('aria-hidden', 'true')

  const pileClip = document.createElement('div')
  pileClip.className = 'boot-loader__pile-clip'
  const pile = document.createElement('div')
  pile.className = 'boot-loader__pile'
  const leavesBox = document.createElement('div')
  leavesBox.className = 'boot-loader__leaves-box'
  const leaves = document.createElement('img')
  leaves.className = 'boot-loader__leaves'
  leaves.src = bootAsset('boot-leaves.png')
  leaves.alt = ''
  leavesBox.append(leaves)
  pile.append(leavesBox)
  pileClip.append(pile)
  addSoftShadow(leaves, [LEAVES_SHADOW])

  const walker = document.createElement('div')
  walker.className = 'boot-loader__walker'

  const owlShadow = document.createElement('div')
  owlShadow.className = 'boot-loader__owl-shadow'

  const owl = document.createElement('div')
  owl.className = 'boot-loader__owl'
  const owlArt = document.createElement('img')
  owlArt.className = 'boot-loader__owl-art'
  owlArt.src = bootAsset('boot-owl-vacuum.png')
  owlArt.alt = ''
  owl.append(owlArt)
  addSoftShadow(owlArt, [OWL_SHADOW])
  for (const side of ['left', 'right']) {
    const lid = document.createElement('span')
    lid.className = `boot-loader__lid boot-loader__lid--${side}`
    owl.append(lid)
  }
  const swirl = document.createElement('div')
  swirl.className = 'boot-loader__swirl'
  for (let i = 0; i < SWIRL_LEAVES; i += 1) {
    const bit = document.createElement('img')
    bit.className = 'boot-loader__swirl-leaf'
    bit.src = bootAsset('boot-leaf.png')
    bit.alt = ''
    bit.style.setProperty('--i', String(i))
    swirl.append(bit)
  }
  owl.append(swirl)
  walker.append(owlShadow, owl)
  scene.append(pileClip, walker)

  const panel = document.createElement('div')
  panel.className = 'boot-loader__panel'

  const barRow = document.createElement('div')
  barRow.className = 'boot-loader__bar-row'

  const bar = document.createElement('div')
  bar.className = 'boot-loader__bar'
  bar.setAttribute('role', 'progressbar')
  bar.setAttribute('aria-label', 'Подготовка файлов')
  bar.setAttribute('aria-valuemin', '0')
  bar.setAttribute('aria-valuemax', '100')
  bar.setAttribute('aria-valuenow', '0')
  const track = document.createElement('span')
  track.className = 'boot-loader__bar-track'
  const fill = document.createElement('span')
  fill.className = 'boot-loader__bar-fill'
  track.append(fill)
  const run = document.createElement('span')
  run.className = 'boot-loader__bar-run'
  const barLeaf = document.createElement('img')
  barLeaf.className = 'boot-loader__bar-leaf'
  barLeaf.src = bootAsset('boot-leaf.png')
  barLeaf.alt = ''
  run.append(barLeaf)
  bar.append(track, run)

  const progress = document.createElement('p')
  progress.className = 'boot-loader__progress'
  progress.textContent = '0%'
  barRow.append(bar, progress)

  const message = document.createElement('p')
  message.className = 'boot-loader__message'
  message.textContent = 'Считаем файлы…'
  message.setAttribute('role', 'status')
  message.setAttribute('aria-live', 'polite')
  message.setAttribute('aria-atomic', 'true')

  const retry = document.createElement('button')
  retry.type = 'button'
  retry.className = 'boot-loader__retry'
  retry.textContent = 'Продолжить загрузку'
  retry.hidden = true

  panel.append(barRow, message, retry)
  layer.append(bg, shade, header, scene, panel)
  container.append(layer)

  let onRetry: (() => void) | null = null
  let displayedPercent = 0
  let maxDone = -1
  let finishing: Promise<void> | null = null

  const clearError = (): void => {
    layer.classList.remove('boot-loader--error')
    retry.hidden = true
  }
  const showPercent = (percent: number): void => {
    displayedPercent = percent
    layer.style.setProperty('--boot-progress', String(percent / 100))
    bar.setAttribute('aria-valuenow', String(percent))
    progress.textContent = `${percent}%`
  }

  retry.addEventListener('click', () => {
    clearError()
    message.textContent = 'Продолжаем загрузку…'
    onRetry?.()
  })

  return {
    setProgress({ percent: pct, message: msg, doneCount, totalCount }) {
      const clamped = Math.max(0, Math.min(100, Math.round(pct)))
      const advanced =
        doneCount != null ? doneCount > maxDone : clamped > displayedPercent
      if (doneCount != null) maxDone = Math.max(maxDone, doneCount)
      // Пока ошибка на экране, её снимает только реальный рост числа файлов.
      if (layer.classList.contains('boot-loader--error') && !advanced) return
      if (clamped >= displayedPercent) {
        showPercent(clamped)
        if (doneCount != null) bar.setAttribute('data-done', String(doneCount))
        if (totalCount != null) bar.setAttribute('data-total', String(totalCount))
      }
      message.textContent = msg
      clearError()
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
    finish() {
      finishing ??= new Promise<void>((resolve) => {
        clearError()
        showPercent(100)
        layer.classList.add('boot-loader--finale')
        window.setTimeout(
          () => {
            layer.classList.add('boot-loader--swept')
            resolve()
          },
          prefersReducedMotion() ? FINALE_REDUCED_MS : FINALE_MS,
        )
      })
      return finishing
    },
    unmount() {
      layer.classList.add('boot-loader--leave')
      window.setTimeout(() => layer.remove(), LEAVE_MS)
    },
  }
}
