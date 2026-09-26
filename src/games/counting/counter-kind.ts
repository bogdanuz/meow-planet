import type { PlaceholderColor, PlaceholderShape } from '../../shared/placeholders'

export const COUNTER_KINDS = ['apple', 'star', 'fish'] as const
export type CounterKind = (typeof COUNTER_KINDS)[number]

export const COUNTER_LABEL: Record<CounterKind, string> = {
  apple: 'яблоки',
  star: 'звёзды',
  fish: 'рыбки',
}

export const COUNTER_ICON: Record<CounterKind, string> = {
  apple: '🍎',
  star: '⭐',
  fish: '🐟',
}

export const COUNTER_PLACEHOLDER: Record<
  CounterKind,
  { shape: PlaceholderShape; color: PlaceholderColor }
> = {
  apple: { shape: 'circle', color: 'red' },
  star: { shape: 'star', color: 'yellow' },
  fish: { shape: 'triangle', color: 'green' },
}
