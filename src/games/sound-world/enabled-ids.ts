/** Карточки после викторины владельца (S14, 23.09.2026). */
export const SOUND_WORLD_ENABLED_IDS = new Set<string>([
  // Животные — тур 1
  'cat',
  'dog',
  'cow',
  'horse',
  'pig',
  'hen',
  'rooster',
  'duck',
  'goose',
  'sheep',
  'bear',
  'wolf',
  'lion',
  'elephant',
  'monkey',
  'owl',
  'whale',
  'seal',
  // Транспорт — тур 2
  'car',
  'train',
  'ambulance',
  'police-car',
  'ship',
  'helicopter',
  // Инструменты — тур 2
  'drum',
  'maracas',
  'bell',
  'piano',
  'guitar',
])

/** Буквы: полный RU + EN (тур 2: all_ru, all_en). */
export function isSoundWorldItemEnabled(id: string, mainTab: string): boolean {
  if (mainTab === 'letters-ru' || mainTab === 'letters-en') return true
  return SOUND_WORLD_ENABLED_IDS.has(id)
}
