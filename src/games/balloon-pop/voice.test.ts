import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BALLOON_VOICE_FILES,
  balloonVoiceFileForLine,
  balloonVoiceUrl,
} from './voice'
import {
  BALLOON_FREE_IDLE_LINE,
  BALLOON_WRONG_BALLOON_NUDGE,
  FREE_POP_PRAISES,
  MULTI_STEP_PRAISES,
  TASK_COMPLETE_PRAISES,
  hintForTask,
} from './logic'

describe('balloon-pop voice', () => {
  it('39 mp3 лежат в public/assets/games/balloon-pop/voice/', () => {
    expect(BALLOON_VOICE_FILES).toHaveLength(39)
    for (const file of BALLOON_VOICE_FILES) {
      const full = path.join('public', 'assets', 'games', 'balloon-pop', 'voice', file)
      expect(existsSync(full), file).toBe(true)
    }
  })

  it('каждая реплика Мяу знает свой файл', () => {
    expect(balloonVoiceFileForLine(BALLOON_FREE_IDLE_LINE)).toBe('free-idle.mp3')
    expect(balloonVoiceFileForLine(BALLOON_WRONG_BALLOON_NUDGE)).toBe(
      'nudge-wrong-balloon.mp3',
    )
    expect(balloonVoiceFileForLine(FREE_POP_PRAISES[0])).toBe('praise-free-01.mp3')
    expect(balloonVoiceFileForLine(FREE_POP_PRAISES[1])).toBe('praise-free-02.mp3')
    expect(balloonVoiceFileForLine(FREE_POP_PRAISES[2])).toBe('praise-free-03.mp3')
    expect(balloonVoiceFileForLine(FREE_POP_PRAISES[3])).toBe('praise-free-04.mp3')
    expect(balloonVoiceFileForLine(TASK_COMPLETE_PRAISES[0])).toBe(
      'praise-task-done-01.mp3',
    )
    expect(balloonVoiceFileForLine(MULTI_STEP_PRAISES[0])).toBe('praise-step-01.mp3')
    expect(balloonVoiceFileForLine(hintForTask({ type: 'color', color: 'red' }))).toBe(
      'task-color-red-direct.mp3',
    )
    expect(
      balloonVoiceFileForLine(hintForTask({ type: 'color', color: 'green', tone: 'together' })),
    ).toBe('task-color-green-together.mp3')
    expect(balloonVoiceFileForLine(hintForTask({ type: 'all_color', color: 'violet' }))).toBe(
      'task-both-violet.mp3',
    )
    expect(
      balloonVoiceFileForLine(
        hintForTask({ type: 'color_size', color: 'yellow', size: 'sm' }),
      ),
    ).toBe('task-small-yellow.mp3')
    expect(balloonVoiceFileForLine(hintForTask({ type: 'two_big' }))).toBe('task-two-big.mp3')
    expect(balloonVoiceFileForLine('Миша, Шарики ждут. Выбирай любой!')).toBe(
      'free-idle.mp3',
    )
    expect(balloonVoiceUrl('free-idle.mp3')).toContain('voice/free-idle.mp3')
  })
})
