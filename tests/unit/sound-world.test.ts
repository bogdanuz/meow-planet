import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SOUND_CATALOG } from '../../src/games/sound-world/catalog'
import { SOUND_WORLD_ENABLED_IDS } from '../../src/games/sound-world/enabled-ids'
import {
  ANIMALS_PER_PAGE,
  buildNavigation,
  buildSoundCategories,
  cardsForTab,
  cardsOnScreen,
  objectPageCount,
  showLetterScriptSwitcher,
  speakLabel,
  visibleMainTabs,
} from '../../src/games/sound-world/logic'

describe('sound-world categories', () => {
  it('каталог: животные, транспорт, инструменты, буквы RU/EN', () => {
    const mains = new Set(SOUND_CATALOG.map((c) => c.mainTab))
    expect(mains.has('animals')).toBe(true)
    expect(mains.has('letters-ru')).toBe(true)
    expect(mains.has('letters-en')).toBe(true)
  })

  it('4 вкладки; ABC только через pill под «Буквы»', () => {
    expect(visibleMainTabs(false).map((t) => t.id)).toEqual([
      'animals',
      'transport',
      'instruments',
      'letters-ru',
    ])
    expect(visibleMainTabs(true).map((t) => t.id)).not.toContain('letters-en')
  })

  it('животные: 18 карточек, три экрана по 6', () => {
    const nav = buildNavigation(false, 'animals')
    expect(cardsForTab(nav).length).toBe(18)
    expect(ANIMALS_PER_PAGE).toBe(6)
    expect(objectPageCount(nav)).toBe(3)
    expect(cardsOnScreen(nav, 0).map((c) => c.id)).toEqual([
      'cat',
      'dog',
      'cow',
      'horse',
      'pig',
      'hen',
    ])
    expect(cardsOnScreen(nav, 1)).toHaveLength(6)
    expect(cardsOnScreen(nav, 1)[0]?.id).toBe('rooster')
    expect(cardsOnScreen(nav, 2).map((c) => c.id)).toEqual([
      'lion',
      'elephant',
      'monkey',
      'owl',
      'whale',
      'seal',
    ])
  })

  it('инструменты: без бубна, пять карточек на одном экране', () => {
    const nav = buildNavigation(false, 'instruments')
    expect(cardsForTab(nav).map((c) => c.id)).toEqual([
      'drum',
      'maracas',
      'bell',
      'piano',
      'guitar',
    ])
    expect(objectPageCount(nav)).toBe(1)
    expect(cardsOnScreen(nav, 0)).toHaveLength(5)
  })

  it('РУ/ABC только на вкладке «Буквы»', () => {
    expect(showLetterScriptSwitcher(false, buildNavigation(false, 'animals'))).toBe(false)
    expect(showLetterScriptSwitcher(false, buildNavigation(false, 'letters-ru'))).toBe(
      true,
    )
    expect(showLetterScriptSwitcher(true, buildNavigation(true, 'letters-ru'))).toBe(false)
  })

  it('буквы RU: 33 на одном экране', () => {
    const nav = buildNavigation(false, 'letters-ru', 'ru')
    expect(cardsForTab(nav).length).toBe(33)
    expect(objectPageCount(nav)).toBe(1)
    expect(cardsOnScreen(nav, 0)).toHaveLength(33)
  })

  it('транспорт: 6 карточек', () => {
    const nav = buildNavigation(false, 'transport')
    expect(cardsForTab(nav).length).toBe(6)
  })

  it('буквы EN: 26 через letterScript', () => {
    const nav = buildNavigation(false, 'letters-ru', 'en')
    expect(cardsForTab(nav).length).toBe(26)
    expect(nav.letterScript).toBe('en')
  })

  it('скрытый EN: letterScript принудительно ru', () => {
    const nav = buildNavigation(true, 'letters-ru', 'en')
    expect(nav.letterScript).toBe('ru')
    expect(cardsForTab(nav).length).toBe(33)
  })

  it('speakLabel', () => {
    const cat = SOUND_CATALOG.find((c) => c.id === 'cat')!
    expect(speakLabel(cat)).toBe('Кошка')
  })

  it('buildSoundCategories — полный список в каждой вкладке', () => {
    const cats = buildSoundCategories(false)
    expect(cats.find((c) => c.id === 'animals')!.cards.length).toBe(18)
  })

  it('inventory: у всех включённых предметных карточек есть sfx', () => {
    const invPath = join(
      process.cwd(),
      'public/assets/games/sound-world/sfx/inventory.json',
    )
    const inventory = new Set(JSON.parse(readFileSync(invPath, 'utf8')) as string[])
    for (const id of SOUND_WORLD_ENABLED_IDS) {
      expect(inventory.has(id), `missing sfx for ${id}`).toBe(true)
    }
  })
})
