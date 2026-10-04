import { createUiIconImg, type UiIconId } from './ui-icon'

/**
 * Общие кнопки шапки игры. Правила — `.cursor/rules/game-chrome-universal.mdc`
 * и `docs/games/S16-GAME-SCREEN-PATTERN.md`.
 * Слева: «Назад», «Звук». Справа: инструменты игры с подписью, крайняя — шестерёнка.
 */

/** Иконки инструментов в шапке (общий набор `assets/games/creative/icons`). */
export type GameToolIcon =
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
  | 'wand'
  | 'photo'
  | 'boom'
  | 'gravity'
  | 'howto'
  | 'rotate'
  | 'remove'
  | 'bigger'
  | 'smaller'
  | 'start'
  | 'power'
  | 'fire'
  | 'shorter'
  | 'longer'
  | 'machines'
  | 'rocket'
  | 'nail'
  | 'glue'
  | 'unglue'
  | 'cut'
  | 'kick'
  | 'wire'
  | 'room'
  | 'lift'
  | 'hint'

export function gameToolIconUrl(id: GameToolIcon): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/games/creative/icons/${id}.png`
}

/** Круглая кнопка REF-04 (назад, звук, настройки). */
export function createGameChromeButton(label: string, icon: UiIconId, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'touch-btn touch-btn--icon game-chrome-btn'
  button.setAttribute('aria-label', label)
  button.append(createUiIconImg(icon, { decorative: true }))
  button.addEventListener('click', onClick)
  return button
}

/** Шестерёнка: всегда крайняя справа. Открывает раздел этой игры в настройках хаба. */
export function createGameSettingsButton(goSettings: (() => void) | undefined): HTMLButtonElement {
  const button = createGameChromeButton('Настройки', 'settings', () => goSettings?.())
  button.dataset.role = 'game-settings'
  button.hidden = !goSettings
  return button
}

/** Инструмент в шапке: иконка + подпись под ней (как в «Рисовалке»). */
export function createGameToolButton(label: string, icon: GameToolIcon, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'touch-btn game-tool'
  button.setAttribute('aria-label', label)
  const image = document.createElement('img')
  image.className = 'game-tool__icon'
  image.src = gameToolIconUrl(icon)
  image.alt = ''
  image.decoding = 'async'
  image.setAttribute('aria-hidden', 'true')
  const caption = document.createElement('span')
  caption.className = 'game-tool__label'
  caption.textContent = label
  button.append(image, caption)
  button.addEventListener('click', onClick)
  return button
}
