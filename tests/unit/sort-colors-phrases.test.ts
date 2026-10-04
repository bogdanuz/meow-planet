import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createSeededRandom } from '../../src/shared/random'
import {
  createLinePicker,
  FREE_START_LINES,
  nameLine,
  praiseNamedLine,
  showLine,
  SORT_VOICE_SCRIPT,
  taskLine,
  withChildName,
  wrongLine,
  yesLine,
} from '../../src/games/sort-colors/phrases'
import { sortVoiceUrl } from '../../src/games/sort-colors/voice'

const DOC = path.resolve(__dirname, '../../docs/assets/sort-colors-VOICE-SCRIPT.md')

function docRows(): { file: string; text: string }[] {
  const md = readFileSync(DOC, 'utf8')
  return [...md.matchAll(/^\|\s*`([a-z0-9-]+\.mp3)`\s*\|\s*(.+?)\s*\|\s*$/gm)].map((m) => ({
    file: m[1]!,
    text: m[2]!,
  }))
}

describe('sort-colors phrases', () => {
  it('158 фраз, имена файлов уникальны', () => {
    expect(SORT_VOICE_SCRIPT).toHaveLength(158)
    expect(new Set(SORT_VOICE_SCRIPT.map((l) => l.file)).size).toBe(158)
  })

  it('VOICE-SCRIPT.md совпадает с кодом строка в строку', () => {
    expect(docRows()).toEqual(SORT_VOICE_SCRIPT.map(({ file, text }) => ({ file, text })))
  })

  it('задания: падежи и род', () => {
    expect(taskLine({ type: 'one', kind: 'cube', tone: 'together' })).toEqual({
      file: 'task-one-cube-together.mp3',
      text: 'Давай положим кубик в ящик с кубиками!',
    })
    expect(taskLine({ type: 'one', kind: 'star', tone: 'direct' }).text).toBe(
      'Положи звёздочку в ящик со звёздочками.',
    )
    expect(taskLine({ type: 'all', kind: 'duck', tone: 'direct' }).text).toBe('Собери всех уточек.')
    expect(taskLine({ type: 'all', kind: 'ball', tone: 'together' }).text).toBe('Давай соберём все мячики!')
    expect(taskLine({ type: 'color', kind: 'heart', color: 'blue' }).text).toBe('Положи синее сердечко.')
    expect(taskLine({ type: 'color', kind: 'pyramid', color: 'yellow' }).text).toBe('Положи жёлтую пирамидку.')
    expect(taskLine({ type: 'allColor', kind: 'duck', color: 'green' }).text).toBe(
      'Давай соберём всех зелёных уточек!',
    )
    expect(taskLine({ type: 'allColor', kind: 'ring', color: 'red' }).file).toBe('task-allcolor-red-ring.mp3')
  })

  it('имя, похвала, ошибка, подсказка, «да, это…»', () => {
    expect(nameLine('pyramid').text).toBe('Пирамидка!')
    expect(praiseNamedLine('ball', 'to').text).toBe('Мячик к мячикам!')
    expect(praiseNamedLine('star', 'home').file).toBe('praise-home-star.mp3')
    expect(wrongLine('heart', 1).text).toBe('Это сердечко. Ему нужен ящик с сердечками.')
    expect(wrongLine('star', 2).text).toBe('Это звёздочка. Давай найдём ящик со звёздочками!')
    expect(wrongLine('duck', 3).text).toBe('Уточка живёт в ящике с уточками.')
    expect(showLine('ring').text).toBe('Смотри, вот ящик с колечками!')
    expect(yesLine('cube').text).toBe('Да, это кубик!')
  })

  it('имя ребёнка только в тексте: «Маша, положи…»', () => {
    expect(withChildName('Маша', 'Положи кубик.')).toBe('Маша, положи кубик.')
    expect(withChildName('', 'Положи кубик.')).toBe('Положи кубик.')
    expect(withChildName('  ', 'Положи кубик.')).toBe('Положи кубик.')
  })

  it('picker не повторяет фразу подряд', () => {
    const pick = createLinePicker(createSeededRandom(3))
    let prev = ''
    for (let i = 0; i < 40; i += 1) {
      const line = pick('start', FREE_START_LINES)
      expect(line.file).not.toBe(prev)
      prev = line.file
    }
  })
})

describe('sort-colors voice url', () => {
  it('пока озвучки нет — null, когда готова — путь в public', () => {
    expect(sortVoiceUrl('praise-01.mp3', false)).toBeNull()
    expect(sortVoiceUrl('praise-01.mp3', true)).toMatch(/assets\/games\/sort-colors\/voice\/praise-01\.mp3$/)
  })
})
