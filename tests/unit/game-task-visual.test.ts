import { describe, expect, it } from 'vitest'
import { renderGameTaskVisualCue } from '../../src/shared/game-task-visual'

describe('game-task-visual', () => {
  it('hide-seek: рисует placeholder цели', () => {
    const el = renderGameTaskVisualCue({
      gameId: 'hide-seek',
      kind: 'target',
      shape: 'circle',
      color: 'red',
    })
    expect(el.querySelector('.ph')).toBeTruthy()
    expect(el.className).toBe('chrome__task-cue-inner')
  })
})
