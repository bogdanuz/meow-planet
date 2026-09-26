/** В гостях у Мяu — периоды суток (без Tamagotchi: нет голода/смерти/шкал). */

export type DayPeriod = 'morning' | 'day' | 'evening' | 'night'

export type SceneKind = 'bathroom' | 'room' | 'night'

export const PERIOD_LABEL: Record<DayPeriod, string> = {
  morning: 'Утро',
  day: 'День',
  evening: 'Вечер',
  night: 'Ночь',
}

export type CareAction = 'wash' | 'teeth' | 'dress' | 'bath' | 'feed' | 'pet'

export function periodFromHour(hour: number): DayPeriod {
  const h = ((hour % 24) + 24) % 24
  if (h >= 6 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'day'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

export function sceneKindFor(period: DayPeriod): SceneKind {
  if (period === 'morning' || period === 'evening') return 'bathroom'
  if (period === 'night') return 'night'
  return 'room'
}

export function statusBannerFor(period: DayPeriod): string {
  switch (period) {
    case 'morning':
      return 'Утро'
    case 'evening':
      return 'Вечер'
    case 'day':
      return 'День'
    case 'night':
      return 'Ночь'
  }
}

export function formatClock24(date: Date): string {
  const h = date.getHours()
  const m = date.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function careActionsFor(period: DayPeriod): CareAction[] {
  if (period === 'morning') return ['wash', 'teeth', 'dress', 'feed']
  if (period === 'evening') return ['wash', 'bath', 'teeth', 'pet']
  return []
}

export type DayProp = 'drawing' | 'toy' | 'window'

export type NightProp = 'star-a' | 'star-b' | 'blanket'

export function dayPropsFor(_period: DayPeriod): DayProp[] {
  return ['drawing', 'toy', 'window']
}

export function nightPropsFor(_period: DayPeriod): NightProp[] {
  return ['star-a', 'star-b', 'blanket']
}

export const DAY_PROP_LABEL: Record<DayProp, string> = {
  drawing: 'рисунок',
  toy: 'игрушку',
  window: 'окошко',
}

export const DAY_PROP_ICON: Record<DayProp, string> = {
  drawing: '🖍',
  toy: '🧸',
  window: '🪟',
}

export const NIGHT_PROP_LABEL: Record<NightProp, string> = {
  'star-a': 'звезда',
  'star-b': 'звезда',
  blanket: 'одеяло',
}

export const NIGHT_PROP_ICON: Record<NightProp, string> = {
  'star-a': '⭐',
  'star-b': '✨',
  blanket: '🛏',
}

export const CARE_LABEL: Record<CareAction, string> = {
  wash: 'Умыть',
  teeth: 'Зубы',
  dress: 'Одеть',
  bath: 'Купать',
  feed: 'Покормить',
  pet: 'Погладить',
}

export const CARE_ICON: Record<CareAction, string> = {
  wash: '💧',
  teeth: '🪥',
  dress: '👕',
  bath: '🛁',
  feed: '🍽',
  pet: '🤗',
}

export const PERIOD_ICON: Record<DayPeriod, string> = {
  morning: '🌅',
  day: '☀️',
  evening: '🌆',
  night: '🌙',
}

export type MascotPoseHint = 'idle' | 'happy' | 'sleepy' | 'yawn'

export function mascotPoseFor(period: DayPeriod): MascotPoseHint {
  if (period === 'night') return 'sleepy'
  if (period === 'morning') return 'yawn'
  if (period === 'day') return 'happy'
  return 'idle'
}
