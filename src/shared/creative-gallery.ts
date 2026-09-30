import './creative-gallery.css'
import type { CreativeWork } from './creative-works'

/** Пробковая доска работ. Выход — кнопкой «Назад» в хедере игры. */
export function renderCreativeGallery(
  host: HTMLElement,
  options: {
    works: readonly CreativeWork[]
    thumbUrl: (work: CreativeWork) => string | null
    onOpen: (work: CreativeWork) => void
  },
): void {
  host.replaceChildren()
  const screen = document.createElement('section')
  screen.className = 'creative-gallery'
  screen.setAttribute('aria-label', 'Галерея')

  const grid = document.createElement('div')
  grid.className = 'creative-gallery__grid'
  if (options.works.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'creative-gallery__empty screen__lead--adult'
    empty.textContent = 'Пока пусто. Рисунок появится здесь сам.'
    grid.append(empty)
  }

  for (const work of options.works) {
    const card = document.createElement('article')
    card.className = 'creative-gallery__card'
    card.dataset.workId = work.id

    const open = document.createElement('button')
    open.type = 'button'
    open.className = 'creative-gallery__open'
    open.setAttribute('aria-label', 'Действия с рисунком')
    const thumb = options.thumbUrl(work)
    if (thumb) {
      const image = document.createElement('img')
      image.className = 'creative-gallery__thumb'
      image.alt = ''
      image.src = thumb
      open.append(image)
    } else {
      const fallback = document.createElement('span')
      fallback.className = 'creative-gallery__fallback'
      open.append(fallback)
    }
    open.addEventListener('click', () => options.onOpen(work))

    const date = document.createElement('p')
    date.className = 'creative-gallery__date screen__lead--adult'
    date.textContent = formatStamp(work.updatedAt)

    card.append(open, date)
    grid.append(card)
  }

  screen.append(grid)
  host.append(screen)
}

function formatStamp(timestamp: number): string {
  const date = new Date(timestamp)
  const part = (value: number) => String(value).padStart(2, '0')
  return `${part(date.getDate())}.${part(date.getMonth() + 1)}.${date.getFullYear()} ${part(date.getHours())}:${part(date.getMinutes())}`
}
