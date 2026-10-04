import './creative-gallery.css'
import type { CreativeWork } from './creative-works'
import { cardTilt } from './gallery-export'

export type GalleryOptions = {
  works: readonly CreativeWork[]
  thumbUrl: (work: CreativeWork) => string | null
  onOpen: (work: CreativeWork) => void
  onDownload: (works: CreativeWork[]) => void
  onDelete: (works: CreativeWork[]) => void
  /** Выбор изменился: игра заранее готовит файлы для «Поделиться». */
  onSelectionChange?: (works: CreativeWork[]) => void
}

/** Пробковая доска работ. Выход — кнопкой «Назад» в хедере игры. */
export function renderCreativeGallery(host: HTMLElement, options: GalleryOptions): void {
  host.replaceChildren()
  let selecting = false
  const selected = new Set<string>()

  const screen = document.createElement('section')
  screen.className = 'creative-gallery'
  screen.setAttribute('aria-label', 'Галерея')
  screen.style.setProperty('--cork', `url("${import.meta.env.BASE_URL ?? '/'}assets/games/creative/cork.webp")`)

  const toolbar = document.createElement('div')
  toolbar.className = 'creative-gallery__toolbar'
  const selectToggle = textButton('Выбрать', 'select-toggle', () => setSelecting(!selecting))
  selectToggle.hidden = options.works.length === 0
  toolbar.append(selectToggle)

  const grid = document.createElement('div')
  grid.className = 'creative-gallery__grid'
  if (options.works.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'creative-gallery__empty screen__lead--adult'
    empty.textContent = 'Пока пусто. Рисунок появится здесь сам.'
    grid.append(empty)
  }

  const cards = new Map<string, { card: HTMLElement; open: HTMLButtonElement }>()
  for (const work of options.works) {
    const card = document.createElement('article')
    card.className = 'creative-gallery__card'
    card.dataset.workId = work.id
    card.style.setProperty('--tilt', `${cardTilt(work.id)}deg`)

    const open = document.createElement('button')
    open.type = 'button'
    open.className = 'creative-gallery__open'
    const thumb = options.thumbUrl(work)
    if (thumb) {
      const image = document.createElement('img')
      image.className = 'creative-gallery__thumb'
      image.alt = ''
      image.decoding = 'async'
      image.src = thumb
      open.append(image)
    } else {
      const fallback = document.createElement('span')
      fallback.className = 'creative-gallery__fallback'
      open.append(fallback)
    }
    const check = document.createElement('span')
    check.className = 'creative-gallery__check'
    check.setAttribute('aria-hidden', 'true')
    open.append(check)
    open.addEventListener('click', () => {
      if (!selecting) {
        options.onOpen(work)
        return
      }
      if (selected.has(work.id)) selected.delete(work.id)
      else selected.add(work.id)
      syncSelection()
    })

    const date = document.createElement('p')
    date.className = 'creative-gallery__date screen__lead--adult'
    date.textContent = formatStamp(work.updatedAt)

    card.append(open, date)
    grid.append(card)
    cards.set(work.id, { card, open })
  }

  const actions = document.createElement('div')
  actions.className = 'creative-gallery__actions'
  actions.hidden = true
  const selectAll = textButton('Выбрать все', 'select-all', () => {
    for (const work of options.works) selected.add(work.id)
    syncSelection()
  })
  const clearAll = textButton('Снять все', 'clear-all', () => {
    selected.clear()
    syncSelection()
  })
  const download = textButton('Скачать (0)', 'download-selected', () => options.onDownload(selectedWorks()))
  download.classList.add('creative-gallery__action--main')
  const remove = textButton('Удалить (0)', 'delete-selected', () => options.onDelete(selectedWorks()))
  remove.classList.add('creative-gallery__action--danger')
  actions.append(selectAll, clearAll, download, remove)

  screen.append(toolbar, grid, actions)
  host.append(screen)
  syncSelection()

  function selectedWorks(): CreativeWork[] {
    return options.works.filter((work) => selected.has(work.id))
  }

  function setSelecting(next: boolean): void {
    selecting = next
    if (!next) selected.clear()
    syncSelection()
  }

  function syncSelection(): void {
    screen.dataset.selecting = selecting ? '1' : '0'
    selectToggle.textContent = selecting ? 'Готово' : 'Выбрать'
    selectToggle.classList.toggle('is-selected', selecting)
    actions.hidden = !selecting
    for (const [id, { card, open }] of cards) {
      const on = selecting && selected.has(id)
      card.classList.toggle('is-selected', on)
      open.setAttribute('aria-label', selecting ? 'Выбрать рисунок' : 'Открыть рисунок')
      if (selecting) open.setAttribute('aria-pressed', on ? 'true' : 'false')
      else open.removeAttribute('aria-pressed')
    }
    const count = selected.size
    download.textContent = `Скачать (${count})`
    remove.textContent = `Удалить (${count})`
    download.disabled = count === 0
    remove.disabled = count === 0
    selectAll.disabled = count === options.works.length
    clearAll.disabled = count === 0
    if (selecting) options.onSelectionChange?.(selectedWorks())
  }
}

export type ViewerOptions = {
  imageUrl: string | null
  updatedAt: number
  onContinue: () => void
  onDownload: () => void
  onDelete: () => void
  onBack: () => void
}

/** Крупный просмотр рисунка поверх доски. Возвращает функцию закрытия. */
export function renderWorkViewer(host: HTMLElement, options: ViewerOptions): () => void {
  host.querySelector('.creative-viewer')?.remove()
  const viewer = document.createElement('section')
  viewer.className = 'creative-viewer'
  viewer.setAttribute('aria-label', 'Рисунок')

  const frame = document.createElement('div')
  frame.className = 'creative-viewer__frame'
  if (options.imageUrl) {
    const image = document.createElement('img')
    image.className = 'creative-viewer__image'
    image.alt = ''
    image.src = options.imageUrl
    frame.append(image)
  }
  const date = document.createElement('p')
  date.className = 'creative-viewer__date screen__lead--adult'
  date.textContent = formatStamp(options.updatedAt)

  const actions = document.createElement('div')
  actions.className = 'creative-viewer__actions'
  const continueButton = textButton('Рисовать дальше', 'viewer-continue', options.onContinue)
  continueButton.classList.add('creative-gallery__action--main')
  const downloadButton = textButton('Скачать', 'viewer-download', options.onDownload)
  const deleteButton = textButton('Удалить', 'viewer-delete', options.onDelete)
  deleteButton.classList.add('creative-gallery__action--danger')
  const backButton = textButton('Назад', 'viewer-back', options.onBack)
  actions.append(continueButton, downloadButton, deleteButton, backButton)

  viewer.append(frame, date, actions)
  host.append(viewer)
  return () => viewer.remove()
}

function textButton(label: string, role: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'touch-btn creative-gallery__action'
  button.dataset.role = role
  button.textContent = label
  button.addEventListener('click', onClick)
  return button
}

function formatStamp(timestamp: number): string {
  const date = new Date(timestamp)
  const part = (value: number) => String(value).padStart(2, '0')
  return `${part(date.getDate())}.${part(date.getMonth() + 1)}.${date.getFullYear()} ${part(date.getHours())}:${part(date.getMinutes())}`
}
