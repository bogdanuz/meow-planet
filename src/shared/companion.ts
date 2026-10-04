/** Кто говорит в играх и стоит в меню. Welcome всегда показывает обоих. */
export type CompanionId = 'meow' | 'olli'

export const COMPANION_DEFAULT: CompanionId = 'olli'

/**
 * Картинки совы появятся после пакета в GENERATION-GUIDE.
 * Пока флаг выключен, сохранённый выбор совы не подменяет рабочие картинки Мяу.
 */
export const OLLI_ASSETS_READY = true

export type PresenterPose = 'idle' | 'happy' | 'miss'

export function isCompanionId(value: unknown): value is CompanionId {
  return value === 'meow' || value === 'olli'
}

/** Картинка, которую можно показать сегодня. */
export function visibleCompanion(choice: CompanionId): CompanionId {
  if (choice === 'olli' && !OLLI_ASSETS_READY) return 'meow'
  return choice
}

export function presenterPoseUrl(companion: CompanionId, pose: PresenterPose): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const who = visibleCompanion(companion)
  if (who === 'olli') return `${base}assets/mascot/presenter/olli-${pose}.png`
  return `${base}assets/games/balloon-pop/meow-presenter-${pose}.png`
}

export const PRESENTER_GAME_IDS = [
  'balloon-pop',
  'sort-colors',
  'hide-seek',
  'counting',
] as const

export type PresenterGameId = (typeof PRESENTER_GAME_IDS)[number]

export function gameUsesPresenter(gameId: string): gameId is PresenterGameId {
  return (PRESENTER_GAME_IDS as readonly string[]).includes(gameId)
}
