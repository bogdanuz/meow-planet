import type { PlaceholderColor, PlaceholderShape } from '../../shared/placeholders'
import { isSoundWorldItemEnabled } from './enabled-ids'

/** Главные вкладки (S14 brief). */
export const SOUND_MAIN_TABS = [
  { id: 'animals', labelRu: 'Животные' },
  { id: 'transport', labelRu: 'Транспорт' },
  { id: 'instruments', labelRu: 'Инструменты' },
  { id: 'letters-ru', labelRu: 'Буквы' },
  { id: 'letters-en', labelRu: 'ABC' },
] as const

export type SoundMainTabId = (typeof SOUND_MAIN_TABS)[number]['id']

export type SoundCatalogItem = {
  id: string
  labelRu: string
  mainTab: SoundMainTabId
  subcat: string
  subcatLabelRu: string
  shape: PlaceholderShape
  color: PlaceholderColor
  /** Базовое имя файла в `public/assets/games/sound-world/sfx/` */
  sfxBase: string
}

export const CARDS_PER_PAGE = 4

/** Раньше шла в chrome; S14 v2 — chrome без подсказки в этой игре. */
export const SOUND_IDLE_HINT = ''

const RU_ALPHABET =
  'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('')
const EN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function item(
  partial: Omit<
    SoundCatalogItem,
    'mainTab' | 'subcat' | 'subcatLabelRu' | 'sfxBase'
  > & {
    mainTab?: SoundMainTabId
    subcat: string
    subcatLabelRu: string
    sfxBase?: string
  },
): SoundCatalogItem {
  return {
    mainTab: partial.mainTab ?? 'animals',
    ...partial,
    sfxBase: partial.sfxBase ?? partial.id,
  }
}

/** Объекты с «Звук в 2.2 = да» (ASSET-MANIFEST §13). */
export const SOUND_CATALOG: readonly SoundCatalogItem[] = [
  // 13.1 Домашние
  item({ id: 'cat', labelRu: 'Кошка', subcat: 'pet', subcatLabelRu: 'Домашние', shape: 'circle', color: 'orange' }),
  item({ id: 'dog', labelRu: 'Собака', subcat: 'pet', subcatLabelRu: 'Домашние', shape: 'circle', color: 'yellow' }),
  item({ id: 'rabbit', labelRu: 'Кролик', subcat: 'pet', subcatLabelRu: 'Домашние', shape: 'circle', color: 'violet' }),
  item({ id: 'hamster', labelRu: 'Хомяк', subcat: 'pet', subcatLabelRu: 'Домашние', shape: 'circle', color: 'orange' }),
  item({ id: 'parrot', labelRu: 'Попугай', subcat: 'pet', subcatLabelRu: 'Домашние', shape: 'triangle', color: 'green' }),
  // 13.2 Ферма
  item({ id: 'cow', labelRu: 'Корова', subcat: 'farm', subcatLabelRu: 'Ферма', shape: 'rect', color: 'red' }),
  item({ id: 'horse', labelRu: 'Лошадь', subcat: 'farm', subcatLabelRu: 'Ферма', shape: 'rect', color: 'orange' }),
  item({ id: 'pig', labelRu: 'Свинья', subcat: 'farm', subcatLabelRu: 'Ферма', shape: 'circle', color: 'violet' }),
  item({ id: 'goat', labelRu: 'Коза', subcat: 'farm', subcatLabelRu: 'Ферма', shape: 'triangle', color: 'yellow' }),
  item({ id: 'hen', labelRu: 'Курица', subcat: 'farm', subcatLabelRu: 'Ферма', shape: 'circle', color: 'red' }),
  item({ id: 'rooster', labelRu: 'Петух', subcat: 'farm', subcatLabelRu: 'Ферма', shape: 'triangle', color: 'orange' }),
  item({ id: 'duck', labelRu: 'Утка', subcat: 'farm', subcatLabelRu: 'Ферма', shape: 'circle', color: 'yellow' }),
  item({ id: 'goose', labelRu: 'Гусь', subcat: 'farm', subcatLabelRu: 'Ферма', shape: 'rect', color: 'green' }),
  item({ id: 'sheep', labelRu: 'Овца', subcat: 'farm', subcatLabelRu: 'Ферма', shape: 'circle', color: 'green' }),
  // 13.3 Лес
  item({ id: 'fox', labelRu: 'Лиса', subcat: 'wild', subcatLabelRu: 'В лесу', shape: 'triangle', color: 'orange' }),
  item({ id: 'bear', labelRu: 'Медведь', subcat: 'wild', subcatLabelRu: 'В лесу', shape: 'circle', color: 'orange' }),
  item({ id: 'squirrel', labelRu: 'Белка', subcat: 'wild', subcatLabelRu: 'В лесу', shape: 'circle', color: 'yellow' }),
  item({ id: 'wolf', labelRu: 'Волк', subcat: 'wild', subcatLabelRu: 'В лесу', shape: 'triangle', color: 'violet' }),
  // 13.4 Экзотика
  item({ id: 'lion', labelRu: 'Лев', subcat: 'exot', subcatLabelRu: 'Экзотика', shape: 'circle', color: 'yellow' }),
  item({ id: 'elephant', labelRu: 'Слон', subcat: 'exot', subcatLabelRu: 'Экзотика', shape: 'rect', color: 'green' }),
  item({ id: 'zebra', labelRu: 'Зебра', subcat: 'exot', subcatLabelRu: 'Экзотика', shape: 'rect', color: 'violet' }),
  item({ id: 'monkey', labelRu: 'Обезьяна', subcat: 'exot', subcatLabelRu: 'Экзотика', shape: 'circle', color: 'orange' }),
  item({ id: 'crocodile', labelRu: 'Крокодил', subcat: 'exot', subcatLabelRu: 'Экзотика', shape: 'rect', color: 'green' }),
  // 13.5 Птицы
  item({ id: 'sparrow', labelRu: 'Воробей', subcat: 'bird', subcatLabelRu: 'Птицы', shape: 'triangle', color: 'yellow' }),
  item({ id: 'owl', labelRu: 'Сова', subcat: 'bird', subcatLabelRu: 'Птицы', shape: 'circle', color: 'orange' }),
  item({ id: 'peacock', labelRu: 'Павлин', subcat: 'bird', subcatLabelRu: 'Птицы', shape: 'star', color: 'green' }),
  item({ id: 'penguin', labelRu: 'Пингвин', subcat: 'bird', subcatLabelRu: 'Птицы', shape: 'circle', color: 'violet' }),
  // 13.6 Море
  item({ id: 'dolphin', labelRu: 'Дельфин', subcat: 'sea', subcatLabelRu: 'Море', shape: 'circle', color: 'green' }),
  item({ id: 'whale', labelRu: 'Кит', subcat: 'sea', subcatLabelRu: 'Море', shape: 'rect', color: 'violet' }),
  item({ id: 'seal', labelRu: 'Тюлень', subcat: 'sea', subcatLabelRu: 'Море', shape: 'circle', color: 'orange' }),
  // 13.11 Транспорт
  ...(
    [
      ['ground', 'Наземный', 'car', 'Машина'],
      ['ground', 'Наземный', 'bus', 'Автобус'],
      ['ground', 'Наземный', 'truck', 'Грузовик'],
      ['ground', 'Наземный', 'train', 'Поезд'],
      ['ground', 'Наземный', 'tractor', 'Трактор'],
      ['ground', 'Наземный', 'ambulance', 'Скорая'],
      ['ground', 'Наземный', 'fire-truck', 'Пожарная'],
      ['ground', 'Наземный', 'police-car', 'Полиция'],
      ['water', 'Вода', 'ship', 'Корабль'],
      ['air', 'Небо', 'airplane', 'Самолёт'],
      ['air', 'Небо', 'helicopter', 'Вертолёт'],
    ] as const
  ).map(([subcat, subcatLabelRu, id, labelRu]) =>
    item({
      id,
      labelRu,
      mainTab: 'transport',
      subcat,
      subcatLabelRu,
      shape: 'rect',
      color: 'blue',
    }),
  ),
  // 13.13 Инструменты
  ...(
    [
      ['music', 'Музыка', 'drum', 'Барабан'],
      ['music', 'Музыка', 'tambourine', 'Бубен'],
      ['music', 'Музыка', 'maracas', 'Маракасы'],
      ['music', 'Музыка', 'bell', 'Колокольчик'],
      ['music', 'Музыка', 'xylophone', 'Ксилофон'],
      ['music', 'Музыка', 'piano', 'Пианино'],
      ['music', 'Музыка', 'guitar', 'Гитара'],
    ] as const
  ).map(([subcat, subcatLabelRu, id, labelRu]) =>
    item({
      id,
      labelRu,
      mainTab: 'instruments',
      subcat,
      subcatLabelRu,
      shape: 'circle',
      color: 'orange',
    }),
  ),
  // Буквы
  ...RU_ALPHABET.map((letter) =>
    item({
      id: `ru-${letter}`,
      labelRu: letter,
      mainTab: 'letters-ru',
      subcat: 'ru',
      subcatLabelRu: 'Русский язык',
      shape: 'square',
      color: 'red',
      sfxBase: `letter-ru-${letter}`,
    }),
  ),
  ...EN_ALPHABET.map((letter) =>
    item({
      id: `en-${letter}`,
      labelRu: letter,
      mainTab: 'letters-en',
      subcat: 'en',
      subcatLabelRu: 'English',
      shape: 'square',
      color: 'blue',
      sfxBase: `letter-en-${letter}`,
    }),
  ),
]

export function catalogForMainTab(mainTab: SoundMainTabId): SoundCatalogItem[] {
  return SOUND_CATALOG.filter(
    (i) => i.mainTab === mainTab && isSoundWorldItemEnabled(i.id, i.mainTab),
  )
}

export function isLettersMainTab(mainTab: SoundMainTabId): boolean {
  return mainTab === 'letters-ru' || mainTab === 'letters-en'
}

export function subcatsForMainTab(
  items: readonly SoundCatalogItem[],
): { id: string; labelRu: string }[] {
  const seen = new Map<string, string>()
  for (const i of items) {
    if (!seen.has(i.subcat)) seen.set(i.subcat, i.subcatLabelRu)
  }
  return [...seen.entries()].map(([id, labelRu]) => ({ id, labelRu }))
}

export function itemsInSubcat(
  items: readonly SoundCatalogItem[],
  subcat: string,
): SoundCatalogItem[] {
  return items.filter((i) => i.subcat === subcat)
}

export { pageCountBalanced as pageCount, pageSliceBalanced as pageSlice } from './pagination'
