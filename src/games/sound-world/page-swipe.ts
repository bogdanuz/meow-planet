/** Свайп страницы животных: не путать с «грязным» тапом по карточке. */
export const ANIMAL_PAGE_SWIPE_PX = 140

export function shouldTurnAnimalPage(opts: {
  dx: number
  startedOnCard: boolean
  mainTab: string
  instrumentOpen: boolean
}): boolean {
  if (opts.startedOnCard || opts.instrumentOpen) return false
  if (opts.mainTab !== 'animals') return false
  return Math.abs(opts.dx) >= ANIMAL_PAGE_SWIPE_PX
}
