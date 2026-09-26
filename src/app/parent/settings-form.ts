import {
  DEFAULT_SETTINGS,
  loadSettings,
  resetSettings,
  sanitizeChildName,
  saveSettings,
  type AppSettings,
} from '../../shared/storage'
import type { AudioManager } from '../../shared/audio'
import { CHILD_NAME_USED_IN_RELEASED_GAMES } from '../../content/released-games'

export type SettingsFormHandlers = {
  onSaved: (settings: AppSettings) => void
  audio?: AudioManager
  appVersion: string
}

function audioSwitch(
  id: string,
  title: string,
  get: () => boolean,
  apply: (value: boolean) => void,
  persist: () => void,
): { row: HTMLElement; paint: () => void } {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.id = id
  btn.className = 'touch-btn settings-audio-btn'
  const paint = (): void => {
    const on = get()
    btn.textContent = `${title}: ${on ? 'вкл' : 'выкл'}`
    btn.setAttribute('aria-pressed', on ? 'true' : 'false')
  }
  paint()
  btn.addEventListener('click', () => {
    apply(!get())
    paint()
    persist()
  })
  return { row: btn, paint }
}

function toggleRow(
  id: string,
  label: string,
  checked: boolean,
  onChange: (value: boolean) => void,
): HTMLElement {
  const row = document.createElement('label')
  row.className = 'settings-row'
  row.htmlFor = id

  const text = document.createElement('span')
  text.textContent = label

  const input = document.createElement('input')
  input.type = 'checkbox'
  input.id = id
  input.className = 'settings-toggle'
  input.checked = checked
  input.addEventListener('change', () => onChange(input.checked))

  row.append(text, input)
  return row
}

/**
 * Форма настроек. Имя ребёнка — только через value/textContent, никогда innerHTML.
 */
export function renderSettingsForm(
  container: HTMLElement,
  handlers: SettingsFormHandlers,
): () => void {
  let settings = loadSettings()
  const showName = CHILD_NAME_USED_IN_RELEASED_GAMES
  const showReleasedGameToggles = CHILD_NAME_USED_IN_RELEASED_GAMES

  const form = document.createElement('form')
  form.className = 'settings-form'
  form.addEventListener('submit', (event) => event.preventDefault())

  const persist = (): void => {
    const saved = saveSettings(settings)
    if (!saved) return
    handlers.audio?.updateSettings(settings)
    handlers.onSaved(settings)
  }

  const soundSwitch = audioSwitch(
    'sound-enabled',
    'Звуки эффектов',
    () => settings.soundEnabled,
    (v) => {
      settings = { ...settings, soundEnabled: v }
    },
    persist,
  )
  const musicSwitch = audioSwitch(
    'music-enabled',
    'Музыка',
    () => settings.musicEnabled,
    (v) => {
      settings = { ...settings, musicEnabled: v }
    },
    persist,
  )

  form.append(musicSwitch.row, soundSwitch.row)

  let nameInput: HTMLInputElement | null = null
  let refreshGreeting: (() => void) | null = null

  if (showName) {
    const nameLabel = document.createElement('label')
    nameLabel.className = 'settings-field'
    nameLabel.htmlFor = 'child-name'
    const nameTitle = document.createElement('span')
    nameTitle.textContent = 'Имя ребёнка'
    nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.id = 'child-name'
    nameInput.className = 'settings-input'
    nameInput.maxLength = 40
    nameInput.autocomplete = 'off'
    nameInput.value = settings.childName
    nameLabel.append(nameTitle, nameInput)

    const greeting = document.createElement('p')
    greeting.className = 'settings-greeting'
    greeting.setAttribute('aria-live', 'polite')

    refreshGreeting = (): void => {
      const name = sanitizeChildName(nameInput!.value)
      greeting.replaceChildren()
      if (name) {
        const prefix = document.createTextNode('В «Лопни шарик» будет обращение: ')
        const strong = document.createElement('strong')
        strong.textContent = name
        greeting.append(prefix, strong)
      } else {
        greeting.textContent = 'Имя не задано — обращения по имени не будет.'
      }
    }
    refreshGreeting()
    nameInput.addEventListener('change', () => {
      settings = { ...settings, childName: sanitizeChildName(nameInput!.value) }
      persist()
      refreshGreeting?.()
    })
    form.append(nameLabel, greeting)
  }

  if (showReleasedGameToggles) {
    form.append(
      toggleRow(
        'hide-en',
        'Скрыть английский алфавит в «Изучаем звуки»',
        settings.hideEnglishAlphabet,
        (v) => {
          settings = { ...settings, hideEnglishAlphabet: v }
          persist()
        },
      ),
      toggleRow(
        'balloon-tasks',
        'Задания в «Лопни шарик»',
        settings.balloonTasksEnabled,
        (v) => {
          settings = { ...settings, balloonTasksEnabled: v }
          persist()
        },
      ),
    )
  }

  const actions = document.createElement('div')
  actions.className = 'settings-actions'

  const resetBtn = document.createElement('button')
  resetBtn.type = 'button'
  resetBtn.className = 'touch-btn touch-btn--quiet'
  resetBtn.textContent = 'Сбросить настройки'
  resetBtn.addEventListener('click', () => {
    settings = resetSettings()
    if (nameInput) {
      nameInput.value = ''
      refreshGreeting?.()
    }
    soundSwitch.paint()
    musicSwitch.paint()
    const hideEn = form.querySelector<HTMLInputElement>('#hide-en')
    if (hideEn) hideEn.checked = DEFAULT_SETTINGS.hideEnglishAlphabet
    const balloonTasks = form.querySelector<HTMLInputElement>('#balloon-tasks')
    if (balloonTasks) balloonTasks.checked = DEFAULT_SETTINGS.balloonTasksEnabled
    handlers.audio?.updateSettings(settings)
    handlers.onSaved(settings)
  })

  actions.append(resetBtn)

  const version = document.createElement('p')
  version.className = 'settings-version'
  version.textContent = `Версия приложения: ${handlers.appVersion}`

  form.append(actions, version)
  container.replaceChildren(form)

  return () => undefined
}
