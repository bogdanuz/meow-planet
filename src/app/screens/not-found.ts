import type { RouterController } from '../router-controller'

export function renderNotFoundScreen(
  container: HTMLElement,
  router: RouterController,
): void {
  const section = document.createElement('section')
  section.className = 'screen screen--not-found'
  section.setAttribute('aria-label', 'Страница не найдена')

  const lead = document.createElement('p')
  lead.className = 'screen__lead'
  lead.textContent = 'Такой страницы нет'

  const hint = document.createElement('p')
  hint.className = 'screen__hint'
  hint.textContent = 'Вернёмся в меню Планеты Мяу.'

  const home = document.createElement('button')
  home.type = 'button'
  home.className = 'touch-btn'
  home.textContent = 'В меню'
  home.addEventListener('click', () => {
    router.goHome()
  })

  section.append(lead, hint, home)
  container.replaceChildren(section)
}
