import './ask-choice.css'

export type AskTextOptions = {
  message: string
  placeholder: string
  okLabel: string
  skipLabel: string
  maxLength: number
}

/**
 * Окно «подпиши» для взрослого: поле + «Готово» / «Без подписи».
 * Отдаёт введённый текст как есть (чистит вызывающий); пропуск и тап мимо — пустая строка.
 */
export function askText(host: HTMLElement, options: AskTextOptions): Promise<string> {
  host.querySelector('[data-choice-backdrop]')?.remove()
  return new Promise((resolve) => {
    let settled = false
    const finish = (value: string): void => {
      if (settled) return
      settled = true
      backdrop.remove()
      resolve(value)
    }

    const backdrop = document.createElement('div')
    backdrop.className = 'choice-dialog choice-dialog--text'
    backdrop.dataset.choiceBackdrop = ''
    backdrop.addEventListener('click', () => finish(''))

    const card = document.createElement('div')
    card.className = 'choice-dialog__card'
    card.addEventListener('click', (event) => event.stopPropagation())

    const text = document.createElement('p')
    text.className = 'choice-dialog__text screen__lead--adult'
    text.textContent = options.message

    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'choice-dialog__input'
    input.dataset.textInput = ''
    input.placeholder = options.placeholder
    input.maxLength = options.maxLength
    input.autocomplete = 'off'
    input.enterKeyHint = 'done'
    input.setAttribute('aria-label', options.message)
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        finish(input.value)
      }
    })

    const row = document.createElement('div')
    row.className = 'choice-dialog__row'
    const button = (id: string, label: string, calm: boolean, value: () => string): HTMLButtonElement => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'touch-btn choice-dialog__btn'
      if (calm) el.classList.add('choice-dialog__btn--calm')
      el.dataset.choice = id
      el.textContent = label
      el.addEventListener('click', (event) => {
        event.stopPropagation()
        finish(value())
      })
      return el
    }
    row.append(
      button('skip', options.skipLabel, false, () => ''),
      button('ok', options.okLabel, true, () => input.value),
    )

    card.append(text, input, row)
    backdrop.append(card)
    host.append(backdrop)
    input.focus()
  })
}
