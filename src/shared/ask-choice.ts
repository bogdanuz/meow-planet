import './ask-choice.css'

const openDialogs = new WeakMap<HTMLElement, () => void>()

export function askChoice(
  host: HTMLElement,
  message: string,
  choices: readonly { id: string; label: string }[],
): Promise<string | null> {
  openDialogs.get(host)?.()
  host.querySelector('[data-choice-backdrop]')?.remove()
  return new Promise((resolve) => {
    let settled = false
    const finish = (id: string | null): void => {
      if (settled) return
      settled = true
      if (openDialogs.get(host) === dismiss) openDialogs.delete(host)
      backdrop.remove()
      resolve(id)
    }
    const dismiss = (): void => finish(null)
    openDialogs.set(host, dismiss)

    const backdrop = document.createElement('div')
    backdrop.className = 'choice-dialog'
    backdrop.dataset.choiceBackdrop = ''
    backdrop.addEventListener('click', () => finish(null))

    const card = document.createElement('div')
    card.className = 'choice-dialog__card'
    card.addEventListener('click', (event) => event.stopPropagation())

    const text = document.createElement('p')
    text.className = 'choice-dialog__text screen__lead--adult'
    text.textContent = message

    const row = document.createElement('div')
    row.className = 'choice-dialog__row'
    for (const choice of choices) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'touch-btn choice-dialog__btn'
      button.dataset.choice = choice.id
      button.textContent = choice.label
      if (choice.id === 'no') button.classList.add('choice-dialog__btn--calm')
      button.addEventListener('click', (event) => {
        event.stopPropagation()
        finish(choice.id)
      })
      row.append(button)
    }

    card.append(text, row)
    backdrop.append(card)
    host.append(backdrop)
  })
}
