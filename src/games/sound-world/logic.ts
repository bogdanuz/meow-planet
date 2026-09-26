import {
  catalogForMainTab,
  isLettersMainTab,
  SOUND_IDLE_HINT,
  SOUND_MAIN_TABS,
  type SoundCatalogItem,
  type SoundMainTabId,
} from './catalog'
import { pageCountBalanced, pageSliceBalanced } from './pagination'

export const ANIMALS_PER_PAGE = 6

export { SOUND_IDLE_HINT }

export type SoundCard = SoundCatalogItem

export type LetterScript = 'ru' | 'en'

export type SoundNavigation = {
  mainTab: SoundMainTabId
  /** Язык алфавита при вкладке «Буквы» (S14: pill РУ / ABC). */
  letterScript: LetterScript
}

/** Верхний ряд: без отдельной вкладки ABC — только «Буквы». */
export function visibleMainTabs(_hideEnglishAlphabet: boolean) {
  return SOUND_MAIN_TABS.filter((t) => t.id !== 'letters-en')
}

export function buildNavigation(
  hideEnglishAlphabet: boolean,
  mainTab: SoundMainTabId,
  letterScript: LetterScript = 'ru',
): SoundNavigation {
  const tabs = visibleMainTabs(hideEnglishAlphabet)
  let resolvedTab = mainTab
  let scriptIn: LetterScript = letterScript
  if (mainTab === 'letters-en') {
    resolvedTab = 'letters-ru'
    scriptIn = 'en'
  }
  const safeTab = tabs.some((t) => t.id === resolvedTab)
    ? resolvedTab
    : (tabs[0]?.id ?? 'animals')
  const script: LetterScript =
    hideEnglishAlphabet || safeTab !== 'letters-ru'
      ? 'ru'
      : scriptIn === 'en'
        ? 'en'
        : 'ru'
  return { mainTab: safeTab, letterScript: script }
}

export function cardsForTab(nav: SoundNavigation): SoundCatalogItem[] {
  if (nav.mainTab === 'letters-ru') {
    const tab = nav.letterScript === 'en' ? 'letters-en' : 'letters-ru'
    return catalogForMainTab(tab)
  }
  return catalogForMainTab(nav.mainTab)
}

export function objectPageCount(nav: SoundNavigation): number {
  if (nav.mainTab !== 'animals') return 1
  return pageCountBalanced(cardsForTab(nav).length, ANIMALS_PER_PAGE)
}

export function cardsOnScreen(nav: SoundNavigation, page: number): SoundCatalogItem[] {
  const all = cardsForTab(nav)
  if (nav.mainTab !== 'animals') return all
  return pageSliceBalanced(all, page, ANIMALS_PER_PAGE)
}

export function showLetterScriptSwitcher(
  hideEnglishAlphabet: boolean,
  nav: SoundNavigation,
): boolean {
  return !hideEnglishAlphabet && nav.mainTab === 'letters-ru'
}

export function speakLabel(card: SoundCatalogItem): string {
  return card.labelRu
}

export function buildSoundCategories(hideEnglishAlphabet: boolean) {
  return visibleMainTabs(hideEnglishAlphabet).map((tab) => {
    const cards = catalogForMainTab(tab.id)
    return {
      id: tab.id,
      titleRu: tab.labelRu,
      cards: cards.map((c) => ({
        id: c.id,
        labelRu: c.labelRu,
        category: tab.id,
      })),
    }
  })
}

export { isLettersMainTab }
