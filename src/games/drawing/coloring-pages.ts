/** Раскраски-фоны «Рисовалки». Порядок = scripts/build-coloring-assets.mjs. */
export type ColoringPage = { id: string; title: string }

export const COLORING_PAGES: readonly ColoringPage[] = [
  { id: 'balloon', title: 'Шарик' },
  { id: 'apple', title: 'Яблоко' },
  { id: 'flower', title: 'Цветок' },
  { id: 'dog', title: 'Собака' },
  { id: 'owl', title: 'Сова' },
  { id: 'fish', title: 'Рыбка' },
  { id: 'duck', title: 'Уточка' },
  { id: 'car', title: 'Машинка' },
  { id: 'bus', title: 'Автобус' },
  { id: 'boat', title: 'Лодка' },
  { id: 'plane', title: 'Самолёт' },
  { id: 'boots', title: 'Сапоги в луже' },
  { id: 'bunny', title: 'Кролик' },
  { id: 'cup', title: 'Чашка' },
  { id: 'sleepy-bear', title: 'Спящий мишка' },
  { id: 'cake', title: 'Торт' },
  { id: 'teapot', title: 'Чайник' },
  { id: 'whale', title: 'Кит' },
  { id: 'octopus', title: 'Осминожка' },
  { id: 'crab', title: 'Крабик' },
  { id: 'turtle', title: 'Черепаха' },
  { id: 'dino', title: 'Динозавр' },
  { id: 'snowman', title: 'Снеговик' },
  { id: 'gift', title: 'Подарок' },
]

const PICKER_PAGE_SIZE = 6

export const COLORING_PICKER_PAGES: readonly (readonly ColoringPage[])[] = Array.from(
  { length: Math.ceil(COLORING_PAGES.length / PICKER_PAGE_SIZE) },
  (_, index) => COLORING_PAGES.slice(index * PICKER_PAGE_SIZE, (index + 1) * PICKER_PAGE_SIZE),
)

export function coloringPageById(id: string): ColoringPage | null {
  return COLORING_PAGES.find((page) => page.id === id) ?? null
}

function asset(folder: string, file: string): string {
  return `${import.meta.env.BASE_URL ?? '/'}assets/games/coloring/${folder}/${file}`
}

/** Контур с прозрачным фоном — всегда рисуется поверх краски. */
export function coloringLineUrl(id: string): string {
  return asset('lines', `${id}.png`)
}

export function coloringThumbUrl(id: string): string {
  return asset('thumbs', `${id}.webp`)
}
