import { gameToolIconUrl, type GameToolIcon } from '../../shared/game-chrome'

export type CreativeToolIcon = GameToolIcon

export const creativeToolIconUrl = gameToolIconUrl

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
