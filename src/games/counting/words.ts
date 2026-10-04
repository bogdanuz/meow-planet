/** Русские формы для счёта: «один кубик», «две звёздочки», «пять сердечек». */
import type { ToyKind } from '../../shared/toys'

export type Gender = 'm' | 'f' | 'n'
export type CountForm = 'one' | 'few' | 'many'

type ToyWords = {
  gender: Gender
  /** один кубик / одна звёздочка */
  one: string
  /** (положи) кубик / звёздочку */
  oneAcc: string
  /** два кубика */
  few: string
  /** пять кубиков */
  many: string
  /** (все) кубики */
  pl: string
  /** (считаем, посчитай) кубики / уточек */
  plAcc: string
}

const TOY_WORDS: Record<ToyKind, ToyWords> = {
  ball: { gender: 'm', one: 'мячик', oneAcc: 'мячик', few: 'мячика', many: 'мячиков', pl: 'мячики', plAcc: 'мячики' },
  cube: { gender: 'm', one: 'кубик', oneAcc: 'кубик', few: 'кубика', many: 'кубиков', pl: 'кубики', plAcc: 'кубики' },
  star: { gender: 'f', one: 'звёздочка', oneAcc: 'звёздочку', few: 'звёздочки', many: 'звёздочек', pl: 'звёздочки', plAcc: 'звёздочки' },
  pyramid: { gender: 'f', one: 'пирамидка', oneAcc: 'пирамидку', few: 'пирамидки', many: 'пирамидок', pl: 'пирамидки', plAcc: 'пирамидки' },
  heart: { gender: 'n', one: 'сердечко', oneAcc: 'сердечко', few: 'сердечка', many: 'сердечек', pl: 'сердечки', plAcc: 'сердечки' },
  duck: { gender: 'f', one: 'уточка', oneAcc: 'уточку', few: 'уточки', many: 'уточек', pl: 'уточки', plAcc: 'уточек' },
  ring: { gender: 'n', one: 'колечко', oneAcc: 'колечко', few: 'колечка', many: 'колечек', pl: 'колечки', plAcc: 'колечки' },
}

const NUMBERS = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'] as const

export function countForm(n: number): CountForm {
  if (n === 1) return 'one'
  return n >= 2 && n <= 4 ? 'few' : 'many'
}

/** «один / одна / одно / одну», «два / две», дальше без рода. */
export function numberWordRu(n: number, gender: Gender = 'm', grammarCase: 'nom' | 'acc' = 'nom'): string {
  if (n === 1) {
    if (gender === 'f') return grammarCase === 'acc' ? 'одну' : 'одна'
    return gender === 'n' ? 'одно' : 'один'
  }
  if (n === 2 && gender === 'f') return 'две'
  return NUMBERS[n] ?? String(n)
}

export const toyGender = (kind: ToyKind): Gender => TOY_WORDS[kind].gender

/** «три кубика»; винительный нужен только для «одну звёздочку». */
export function toyCountRu(kind: ToyKind, n: number, grammarCase: 'nom' | 'acc' = 'nom'): string {
  const w = TOY_WORDS[kind]
  const form = countForm(n)
  const noun = form === 'one' ? (grammarCase === 'acc' ? w.oneAcc : w.one) : form === 'few' ? w.few : w.many
  return `${numberWordRu(n, w.gender, grammarCase)} ${noun}`
}

export const toyOneRu = (kind: ToyKind): string => TOY_WORDS[kind].one
export const toyOneAccRu = (kind: ToyKind): string => TOY_WORDS[kind].oneAcc
export const toyPluralRu = (kind: ToyKind): string => TOY_WORDS[kind].pl
export const toyPluralAccRu = (kind: ToyKind): string => TOY_WORDS[kind].plAcc
/** «сколько кубиков», «где больше звёздочек». */
export const toyManyRu = (kind: ToyKind): string => TOY_WORDS[kind].many

export function capitalizeRu(text: string): string {
  return text ? text[0]!.toUpperCase() + text.slice(1) : text
}
