import { HOME_SCREEN_HINT } from './home-screen-hint'
import { getShortSidePx, isSmallViewport } from './viewport-gates'

/**
 * Гейт для “слишком маленьких окон/экранов”.
 * Приоритет: если он активен, portrait gate скрывается через body.is-small-screen-blocked.
 */
export function mountSmallViewportGate(host: HTMLElement): () => void {
  const gate = document.createElement('div')
  gate.className = 'orientation-gate'
  gate.setAttribute('role', 'dialog')
  gate.setAttribute('aria-live', 'polite')
  gate.setAttribute('aria-label', 'Нужен большой экран')
  gate.hidden = true

  const card = document.createElement('div')
  card.className = 'orientation-gate__card'

  const icon = document.createElement('div')
  icon.className = 'orientation-gate__icon'
  icon.setAttribute('aria-hidden', 'true')
  icon.classList.add('orientation-gate__icon--scene')

  const img = document.createElement('img')
  img.className = 'orientation-gate__img'
  img.alt = ''
  img.src = `${import.meta.env.BASE_URL ?? '/'}assets/gates/small-screen.jpg`
  icon.append(img)

  const title = document.createElement('p')
  title.className = 'orientation-gate__title'
  title.textContent = 'Планета Мяу ждёт тебя на планшете'

  const hint = document.createElement('p')
  hint.className = 'orientation-gate__hint'
  hint.textContent =
    'Эта игра сделана для большого экрана. Открой её на iPad или другом планшете.'

  const home = document.createElement('p')
  home.className = 'orientation-gate__hint'
  home.textContent = HOME_SCREEN_HINT

  card.append(icon, title, hint, home)
  gate.append(card)
  host.append(gate)

  const sync = (): void => {
    const small = isSmallViewport()
    gate.hidden = !small
    document.documentElement.classList.toggle('is-small-screen-blocked', small)
    document.body.classList.toggle('is-small-screen-blocked', small)

    // На маленьком экране portrait-gate не должен вмешиваться.
    if (small) {
      document.documentElement.classList.remove('is-portrait-blocked')
      document.body.classList.remove('is-portrait-blocked')
    }
  }

  sync()

  const onChange = (): void => {
    // Вынуждаем синхронизацию при изменениях размеров.
    void getShortSidePx()
    sync()
  }

  const vv = window.visualViewport
  window.addEventListener('resize', onChange)
  vv?.addEventListener('resize', onChange)

  return () => {
    window.removeEventListener('resize', onChange)
    vv?.removeEventListener('resize', onChange)
    gate.remove()
    document.documentElement.classList.remove('is-small-screen-blocked')
    document.body.classList.remove('is-small-screen-blocked')
  }
}

