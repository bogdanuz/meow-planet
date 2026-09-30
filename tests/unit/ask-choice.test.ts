import { describe, expect, it } from 'vitest'
import { askChoice } from '../../src/shared/ask-choice'

describe('ask choice', () => {
  it('возвращает выбранный ответ и не удаляет работу по касанию фона', async () => {
    const host = document.createElement('div')
    const pending = askChoice(host, 'Удалить эту работу?', [
      { id: 'yes', label: 'Да' },
      { id: 'no', label: 'Нет' },
    ])
    expect(host.textContent).toContain('Удалить эту работу?')
    host.querySelector<HTMLButtonElement>('[data-choice="no"]')!.click()
    await expect(pending).resolves.toBe('no')

    const dismissed = askChoice(host, 'Открыть галерею?', [
      { id: 'gallery', label: 'Открыть галерею' },
      { id: 'later', label: 'Не сейчас' },
    ])
    host.querySelector<HTMLElement>('[data-choice-backdrop]')!.click()
    await expect(dismissed).resolves.toBeNull()
    expect(host.querySelector('[data-choice-backdrop]')).toBeNull()
  })

  it('кнопка «Нет» крупнее и спокойнее, чем «Да»', () => {
    const host = document.createElement('div')
    void askChoice(host, 'Удалить эту работу?', [
      { id: 'no', label: 'Нет' },
      { id: 'yes', label: 'Да' },
    ])
    expect(host.querySelector('[data-choice="no"]')?.classList.contains('choice-dialog__btn--calm')).toBe(true)
    expect(host.querySelector('[data-choice="yes"]')?.classList.contains('choice-dialog__btn--calm')).toBe(false)
  })
})
