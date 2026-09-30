export type CreativeToolIcon =
  | 'undo'
  | 'sheet'
  | 'palette'
  | 'pictures'
  | 'brush'
  | 'marker'
  | 'crayon'
  | 'watercolor'
  | 'bucket'
  | 'eraser'
  | 'thin'
  | 'thick'
  | 'background'
  | 'themes'
  | 'gallery'
  | 'more'

export function creativeToolIconUrl(id: CreativeToolIcon): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/games/creative/icons/${id}.png`
}

export function createCreativeToolButton(
  label: string,
  icon: CreativeToolIcon,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'touch-btn creative-tool'
  button.setAttribute('aria-label', label)
  const image = document.createElement('img')
  image.className = 'creative-tool__icon'
  image.src = creativeToolIconUrl(icon)
  image.alt = ''
  image.decoding = 'async'
  image.setAttribute('aria-hidden', 'true')
  const caption = document.createElement('span')
  caption.className = 'creative-tool__label'
  caption.textContent = label
  button.append(image, caption)
  button.addEventListener('click', onClick)
  return button
}
