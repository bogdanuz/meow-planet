import { describe, expect, it } from 'vitest'
import {
  loadPuzzleGameSettings,
  normalizePuzzleGameSettings,
  savePuzzleGameSettings,
} from '../../src/games/puzzle/puzzle-settings'

describe('puzzle game settings', () => {
  it('normalize pieceCount', () => {
    expect(normalizePuzzleGameSettings({ pieceCount: 6 }).pieceCount).toBe(6)
    expect(normalizePuzzleGameSettings({ pieceCount: 99 }).pieceCount).toBe(4)
  })

  it('save/load in memory storage', () => {
    const mem = {
      store: {} as Record<string, string>,
      getItem(k: string) {
        return this.store[k] ?? null
      },
      setItem(k: string, v: string) {
        this.store[k] = v
      },
      removeItem(k: string) {
        delete this.store[k]
      },
      clear() {
        this.store = {}
      },
      key: () => null,
      length: 0,
    } as Storage
    savePuzzleGameSettings({ pieceCount: 9 }, mem)
    expect(loadPuzzleGameSettings(mem).pieceCount).toBe(9)
  })
})
