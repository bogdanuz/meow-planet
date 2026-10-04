import { describe, expect, it } from 'vitest'
import { askText } from '../../src/shared/ask-text'

function setup(maxLength = 24) {
  const host = document.createElement('div')
  document.body.append(host)
  const pending = askText(host, {
    message: 'Как назовём?',
    placeholder: 'Моё фото 1',
    okLabel: 'Готово',
    skipLabel: 'Без подписи',
    maxLength,
  })
  const input = host.querySelector<HTMLInputElement>('[data-text-input]')!
  return { host, pending, input }
}

describe('ask text', () => {
  it('показывает вопрос и поле, «Готово» отдаёт введённый текст', async () => {
    const { host, pending, input } = setup()
    expect(host.textContent).toContain('Как назовём?')
    expect(input.placeholder).toBe('Моё фото 1')
    expect(input.maxLength).toBe(24)
    input.value = '  Бабушка  '
    host.querySelector<HTMLButtonElement>('[data-choice="ok"]')!.click()
    await expect(pending).resolves.toBe('  Бабушка  ')
    expect(host.querySelector('[data-choice-backdrop]')).toBeNull()
    host.remove()
  })

  it('«Без подписи» и тап мимо окна отдают пустую строку', async () => {
    const first = setup()
    first.input.value = 'Мама'
    first.host.querySelector<HTMLButtonElement>('[data-choice="skip"]')!.click()
    await expect(first.pending).resolves.toBe('')
    first.host.remove()

    const second = setup()
    second.host.querySelector<HTMLElement>('[data-choice-backdrop]')!.click()
    await expect(second.pending).resolves.toBe('')
    second.host.remove()
  })

  it('Enter в поле — как «Готово»', async () => {
    const { host, pending, input } = setup()
    input.value = 'Кот'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await expect(pending).resolves.toBe('Кот')
    host.remove()
  })
})
