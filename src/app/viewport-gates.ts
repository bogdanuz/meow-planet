/**
 * Единый порог “комфортного” шорт-сайда для планшетной игры.
 *
 * Почему 720px:
 * - iPad 4:3 landscape (768 CSS px шорт-сайд) должен проходить без гейта.
 * - Android-планшеты от ~1280×720 (шорт-сайд 720) считаются “минимально нормальными”.
 * - Для телефонов и узких окон шорт-сайд значительно меньше — показываем дружелюбный экран.
 */
export const MIN_COMFORT_SHORT_SIDE_PX = 720

export function getShortSidePx(): number {
  if (typeof window === 'undefined') return 0
  return Math.min(window.innerWidth, window.innerHeight)
}

export function isSmallViewport(): boolean {
  if (typeof window === 'undefined') return false
  return getShortSidePx() < MIN_COMFORT_SHORT_SIDE_PX
}

