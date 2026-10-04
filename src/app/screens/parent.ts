import { renderAboutGamesPanel } from '../parent/about-games'
import { renderSettingsForm } from '../parent/settings-form'
import { createUiIconImg } from '../../shared/ui-icon'
import type { RouterController } from '../router-controller'
import type { AudioManager } from '../../shared/audio'
import type { AppSettings } from '../../shared/storage'
import type { GameId } from '../../content/catalog'

export type ParentScreenOptions = {
  audio: AudioManager
  appVersion: string
  onSettingsSaved: (settings: AppSettings) => void
  /** Настройки открыты из игры — «Назад» возвращает в неё. */
  returnTo?: GameId
}

type ParentTab = 'settings' | 'about'

/** Настройки: без капчи, фон как в меню. */
export function renderParentScreen(
  container: HTMLElement,
  router: RouterController,
  options: ParentScreenOptions,
): () => void {
  let disposeForm: (() => void) | null = null
  let activeTab: ParentTab = 'settings'

  const section = document.createElement('section')
  section.className = 'screen screen--parent'
  section.setAttribute('aria-label', 'Настройки')

  const bg = document.createElement('img')
  bg.className = 'parent-bg'
  bg.alt = ''
  bg.src = `${import.meta.env.BASE_URL}assets/shell/menu-bg.webp`

  const bar = document.createElement('div')
  bar.className = 'parent-bar'

  const back = document.createElement('button')
  back.type = 'button'
  back.className = 'touch-btn parent-bar__back'
  const returnTo = options.returnTo
  back.setAttribute('aria-label', returnTo ? 'Назад в игру' : 'Назад в меню')
  back.append(createUiIconImg('back', { decorative: true }))
  back.addEventListener('click', () => {
    if (returnTo) router.navigate({ screen: 'game', gameId: returnTo })
    else router.goHome()
  })
  bar.append(back)

  const hub = document.createElement('div')
  hub.className = 'parent-hub'

  const tabRow = document.createElement('div')
  tabRow.className = 'parent-hub__tabs'
  tabRow.setAttribute('role', 'tablist')
  bar.append(tabRow)

  const settingsPanel = document.createElement('div')
  settingsPanel.className = 'parent-settings'
  settingsPanel.setAttribute('role', 'tabpanel')

  const aboutPanel = document.createElement('div')
  aboutPanel.className = 'parent-about-host'
  aboutPanel.hidden = true
  aboutPanel.setAttribute('role', 'tabpanel')

  hub.append(settingsPanel, aboutPanel)

  function mountSettingsForm(): void {
    disposeForm?.()
    disposeForm = renderSettingsForm(settingsPanel, {
      audio: options.audio,
      appVersion: options.appVersion,
      initialSection: options.returnTo,
      onSaved: (settings) => {
        options.onSettingsSaved(settings)
      },
    })
  }

  function setTab(tab: ParentTab): void {
    activeTab = tab
    settingsPanel.hidden = tab !== 'settings'
    aboutPanel.hidden = tab !== 'about'
    tabRow.querySelectorAll('.parent-hub__tab').forEach((btn) => {
      btn.classList.toggle('is-active', (btn as HTMLButtonElement).dataset.tab === tab)
      btn.setAttribute('aria-selected', (btn as HTMLButtonElement).dataset.tab === tab ? 'true' : 'false')
    })
    if (tab === 'about' && !aboutPanel.querySelector('.parent-about')) {
      renderAboutGamesPanel(aboutPanel)
    }
  }

  function renderTabs(): void {
    tabRow.replaceChildren()
    for (const [id, label] of [
      ['settings', 'Настройки'],
      ['about', 'Об играх'],
    ] as const) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'touch-btn parent-hub__tab'
      btn.dataset.tab = id
      btn.setAttribute('role', 'tab')
      btn.textContent = label
      if (id === activeTab) btn.classList.add('is-active')
      btn.addEventListener('click', () => setTab(id))
      tabRow.append(btn)
    }
  }

  renderTabs()
  mountSettingsForm()
  setTab(activeTab)

  section.append(bg, bar, hub)
  container.replaceChildren(section)

  return () => {
    disposeForm?.()
  }
}
