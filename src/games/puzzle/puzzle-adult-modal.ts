import { createMathCaptcha, type CaptchaChallenge } from '../../shared/math-captcha'
import type { PuzzleGameSettings, PuzzlePieceCount } from './puzzle-settings'

export type PuzzleAdultModalMode = 'settings'

/** Капча + настройки игры (кусочки). */
export function openPuzzleAdultModal(
  host: HTMLElement,
  settings: PuzzleGameSettings,
  onSave: (next: PuzzleGameSettings) => void,
  onClearPhotos?: () => void,
): () => void {
  let challenge: CaptchaChallenge = createMathCaptcha()
  const overlay = document.createElement('div')
  overlay.className = 'puzzle-adult-modal'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-label', 'Настройки для взрослых')

  const panel = document.createElement('div')
  panel.className = 'puzzle-adult-modal__panel'

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'touch-btn touch-btn--quiet puzzle-adult-modal__close'
  closeBtn.setAttribute('aria-label', 'Закрыть')
  closeBtn.textContent = '×'

  const gate = document.createElement('div')
  gate.className = 'puzzle-adult-modal__gate'

  const settingsBlock = document.createElement('div')
  settingsBlock.className = 'puzzle-adult-modal__settings'
  settingsBlock.hidden = true

  function renderGate(): void {
    challenge = createMathCaptcha()
    gate.replaceChildren()
    const prompt = document.createElement('p')
    prompt.className = 'puzzle-adult-modal__prompt'
    prompt.textContent = challenge.prompt
    const hint = document.createElement('p')
    hint.className = 'screen__hint'
    hint.textContent = 'Только для взрослых.'
    const row = document.createElement('div')
    row.className = 'puzzle-adult-modal__options'
    for (const value of challenge.options) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'touch-btn'
      btn.textContent = String(value)
      btn.addEventListener('click', () => {
        if (value === challenge.answer) {
          gate.hidden = true
          settingsBlock.hidden = false
          return
        }
        renderGate()
      })
      row.append(btn)
    }
    gate.append(prompt, hint, row)
  }

  function renderSettings(): void {
    settingsBlock.replaceChildren()
    const title = document.createElement('h2')
    title.className = 'puzzle-adult-modal__title'
    title.textContent = 'Сколько кусочков'
    const counts: PuzzlePieceCount[] = [4, 6, 9]
    const row = document.createElement('div')
    row.className = 'puzzle-adult-modal__counts'
    for (const count of counts) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'touch-btn'
      if (settings.pieceCount === count) btn.classList.add('is-active')
      btn.textContent = String(count)
      btn.addEventListener('click', () => {
        onSave({ pieceCount: count })
        dispose()
      })
      row.append(btn)
    }
    settingsBlock.append(title, row)
    if (onClearPhotos) {
      const clearBtn = document.createElement('button')
      clearBtn.type = 'button'
      clearBtn.className = 'touch-btn touch-btn--quiet'
      clearBtn.textContent = 'Убрать фото'
      clearBtn.addEventListener('click', () => {
        onClearPhotos()
        dispose()
      })
      settingsBlock.append(clearBtn)
    }
  }

  function dispose(): void {
    overlay.remove()
  }

  closeBtn.addEventListener('click', dispose)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dispose()
  })

  renderGate()
  renderSettings()
  panel.append(closeBtn, gate, settingsBlock)
  overlay.append(panel)
  host.append(overlay)

  return dispose
}
