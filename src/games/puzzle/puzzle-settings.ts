/** Настройки только игры «Собери пазл» (localStorage, не родительский центр). */

export type PuzzlePieceCount = 4 | 6 | 9

export type PuzzleGameSettings = {
  pieceCount: PuzzlePieceCount
}

export const PUZZLE_SETTINGS_KEY = 'meow-planet.puzzle-settings'

export const DEFAULT_PUZZLE_GAME_SETTINGS: PuzzleGameSettings = {
  pieceCount: 4,
}

export function isPuzzlePieceCount(value: unknown): value is PuzzlePieceCount {
  return value === 4 || value === 6 || value === 9
}

export function normalizePuzzleGameSettings(raw: unknown): PuzzleGameSettings {
  if (raw === null || typeof raw !== 'object') {
    return { ...DEFAULT_PUZZLE_GAME_SETTINGS }
  }
  const data = raw as Record<string, unknown>
  return {
    pieceCount: isPuzzlePieceCount(data.pieceCount)
      ? data.pieceCount
      : DEFAULT_PUZZLE_GAME_SETTINGS.pieceCount,
  }
}

export function loadPuzzleGameSettings(storage: Storage = localStorage): PuzzleGameSettings {
  try {
    const raw = storage.getItem(PUZZLE_SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_PUZZLE_GAME_SETTINGS }
    return normalizePuzzleGameSettings(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_PUZZLE_GAME_SETTINGS }
  }
}

export function savePuzzleGameSettings(
  settings: PuzzleGameSettings,
  storage: Storage = localStorage,
): void {
  storage.setItem(PUZZLE_SETTINGS_KEY, JSON.stringify(settings))
}
