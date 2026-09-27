/**
 * Единый порог “комфортного” шорт-сайда для планшетной игры.
 *
 * Почему 720px:
 * - iPad 4:3 landscape (768 CSS px шорт-сайд) должен проходить без гейта.
 * - Android-планшеты от ~1280×720 (шорт-сайд 720) считаются “минимально нормальными”.
 * - Для телефонов и узких окон шорт-сайд значительно меньше — показываем дружелюбный экран.
 */
export const MIN_COMFORT_SHORT_SIDE_PX = 720

function getViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  const vv = window.visualViewport
  if (vv && typeof vv.width === 'number' && typeof vv.height === 'number') {
    return { width: vv.width, height: vv.height }
  }
  return { width: window.innerWidth, height: window.innerHeight }
}

export function getShortSidePx(): number {
  const { width, height } = getViewportSize()
  return Math.min(width, height)
}

export function isSmallViewport(): boolean {
  if (typeof window === 'undefined') return false
  return getShortSidePx() < MIN_COMFORT_SHORT_SIDE_PX
}

