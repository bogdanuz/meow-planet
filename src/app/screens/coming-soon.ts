import { createUiIconImg } from '../../shared/ui-icon'
import type { GameMountContext } from '../../shared/game-module'
import type { ActiveGameHandle } from './game'

/**
 * Полноэкранная заглушка для игр, которые ещё не в релизе.
 */
export function renderComingSoonScreen(
  container: HTMLElement,
  hubNavigation: GameMountContext['hubNavigation'],
): ActiveGameHandle {
  const root = document.createElement('section')
  root.className = 'coming-soon'
  root.setAttribute('aria-label', 'Игра в разработке')

  const bg = document.createElement('img')
  bg.className = 'coming-soon__bg'
  bg.alt = ''
  bg.src = `${import.meta.env.BASE_URL}assets/shell/coming-soon.jpg`

  const bar = document.createElement('div')
  bar.className = 'coming-soon__bar'

  const back = document.createElement('button')
  back.type = 'button'
  back.className = 'touch-btn coming-soon__back'
  back.setAttribute('aria-label', 'Назад в меню')
  back.append(createUiIconImg('back', { decorative: true }))
  back.addEventListener('click', () => hubNavigation?.goMenu())

  bar.append(back)
  root.append(bg, bar)
  container.replaceChildren(root)

  return { unmount: () => undefined }
}
