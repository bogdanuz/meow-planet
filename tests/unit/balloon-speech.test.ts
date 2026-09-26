import { describe, expect, it } from 'vitest'
import { fillSpeechElement, taskSpeechColor } from '../../src/games/balloon-pop/speech'

describe('balloon-pop speech', () => {
  it('taskSpeechColor для цветовых заданий', () => {
    expect(taskSpeechColor({ type: 'color', color: 'red' })).toBe('red')
    expect(taskSpeechColor({ type: 'all_color', color: 'green' })).toBe('green')
    expect(taskSpeechColor({ type: 'color_size', color: 'yellow', size: 'lg' })).toBe(
      'yellow',
    )
    expect(taskSpeechColor({ type: 'one_size', size: 'lg' })).toBeNull()
  })

  it('fillSpeechElement подсвечивает красный без HTML-вставки', () => {
    const el = document.createElement('p')
    fillSpeechElement(el, 'Лопни красный шарик.', 'red')
    const span = el.querySelector('span')
    expect(span?.className).toContain('balloon-pop__speech-color--red')
    expect(span?.textContent).toBe('красный')
    expect(el.innerHTML).not.toContain('<script')
    expect(el.textContent).toBe('Лопни красный шарик.')
  })

  it('fillSpeechElement: оба красных', () => {
    const el = document.createElement('p')
    fillSpeechElement(el, 'Давай лопнем оба красных шарика!', 'red')
    expect(el.querySelector('span')?.textContent).toBe('красных')
  })
})
