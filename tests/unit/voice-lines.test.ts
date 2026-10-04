import { describe, expect, it } from 'vitest'
import { createSeededRandom } from '../../src/shared/random'
import { createLinePicker, voiceLine } from '../../src/shared/voice-lines'

describe('voice-lines', () => {
  it('voiceLine добавляет .mp3', () => {
    expect(voiceLine('praise-01', 'Так!')).toEqual({ file: 'praise-01.mp3', text: 'Так!' })
  })

  it('picker не повторяет фразу подряд, ключи независимы', () => {
    const lines = [voiceLine('a', 'A'), voiceLine('b', 'B'), voiceLine('c', 'C')]
    const pick = createLinePicker(createSeededRandom(5))
    let prev = ''
    for (let i = 0; i < 30; i += 1) {
      const line = pick('k', lines)
      expect(line.file).not.toBe(prev)
      prev = line.file
    }
    expect(pick('other', [lines[0]!]).file).toBe('a.mp3')
  })
})
