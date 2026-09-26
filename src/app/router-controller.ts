import type { Route } from './router'
import { parseHash, routeToHash } from './router'

export type NavigateOptions = {
  /** Заменить текущую запись history (без лишнего шага «Назад»). */
  replace?: boolean
}

export type RouterController = {
  getRoute: () => Route
  navigate: (route: Route, options?: NavigateOptions) => void
  goHome: () => void
  start: (onChange: (route: Route) => void) => () => void
}

/**
 * Hash-роутер без внешних зависимостей.
 * Надёжен на GitHub Pages с `base: './'`.
 */
export function createRouter(
  location: Location = window.location,
  history: History = window.history,
): RouterController {
  let current = parseHash(location.hash)
  let listener: ((route: Route) => void) | null = null

  function emit(): void {
    current = parseHash(location.hash)
    listener?.(current)
  }

  function navigate(route: Route, options: NavigateOptions = {}): void {
    const nextHash = routeToHash(route)
    const now = location.hash || '#/'
    if (now === nextHash) {
      current = route
      listener?.(current)
      return
    }

    if (options.replace) {
      history.replaceState(null, '', nextHash)
      emit()
      return
    }

    // Присвоение hash добавляет history. В jsdom hashchange может не прийти —
    // поэтому всегда синхронизируем сами; в браузере лишний emit безвреден.
    location.hash = nextHash
    emit()
  }

  function goHome(): void {
    navigate({ screen: 'menu' })
  }

  function start(onChange: (route: Route) => void): () => void {
    listener = onChange

    if (!location.hash || location.hash === '#' || location.hash === '#/') {
      if (!location.hash || location.hash === '#') {
        history.replaceState(null, '', '#/')
      }
    }

    emit()
    window.addEventListener('hashchange', emit)
    return () => {
      window.removeEventListener('hashchange', emit)
      listener = null
    }
  }

  return {
    getRoute: () => current,
    navigate,
    goHome,
    start,
  }
}
