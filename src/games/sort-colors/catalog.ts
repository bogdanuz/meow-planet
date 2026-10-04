/** Игрушки и цвета «Куда положить?» + русские формы слов для фраз и aria. */

export const SORT_KINDS = ['ball', 'cube', 'star', 'pyramid', 'heart', 'duck', 'ring'] as const
export type SortKind = (typeof SORT_KINDS)[number]

export const SORT_COLORS = ['red', 'yellow', 'blue', 'green'] as const
export type SortColor = (typeof SORT_COLORS)[number]

export const SORT_COLOR_HEX: Record<SortColor, string> = {
  red: '#E8503F',
  yellow: '#F4C23A',
  blue: '#4A8BD6',
  green: '#55AE5C',
}

export type Gender = 'm' | 'f' | 'n'

export type KindWords = {
  /** Мячик */
  nom: string
  /** (положи) мячик / звёздочку */
  acc: string
  /** мячики */
  nomPl: string
  /** (все) мячики / (всех) уточек */
  accPl: string
  /** (к) мячикам */
  datPl: string
  /** (с) мячиками */
  insPl: string
  /** с / со */
  withPrep: 'с' | 'со'
  gender: Gender
  /** Одушевлённое: «всех уточек», «всех красных уточек». */
  animate: boolean
}

export const SORT_KIND_WORDS: Record<SortKind, KindWords> = {
  ball: { nom: 'мячик', acc: 'мячик', nomPl: 'мячики', accPl: 'мячики', datPl: 'мячикам', insPl: 'мячиками', withPrep: 'с', gender: 'm', animate: false },
  cube: { nom: 'кубик', acc: 'кубик', nomPl: 'кубики', accPl: 'кубики', datPl: 'кубикам', insPl: 'кубиками', withPrep: 'с', gender: 'm', animate: false },
  star: { nom: 'звёздочка', acc: 'звёздочку', nomPl: 'звёздочки', accPl: 'звёздочки', datPl: 'звёздочкам', insPl: 'звёздочками', withPrep: 'со', gender: 'f', animate: false },
  pyramid: { nom: 'пирамидка', acc: 'пирамидку', nomPl: 'пирамидки', accPl: 'пирамидки', datPl: 'пирамидкам', insPl: 'пирамидками', withPrep: 'с', gender: 'f', animate: false },
  heart: { nom: 'сердечко', acc: 'сердечко', nomPl: 'сердечки', accPl: 'сердечки', datPl: 'сердечкам', insPl: 'сердечками', withPrep: 'с', gender: 'n', animate: false },
  duck: { nom: 'уточка', acc: 'уточку', nomPl: 'уточки', accPl: 'уточек', datPl: 'уточкам', insPl: 'уточками', withPrep: 'с', gender: 'f', animate: true },
  ring: { nom: 'колечко', acc: 'колечко', nomPl: 'колечки', accPl: 'колечки', datPl: 'колечкам', insPl: 'колечками', withPrep: 'с', gender: 'n', animate: false },
}

type ColorWords = { m: string; f: string; n: string; accF: string; pl: string; plAnim: string }

const COLOR_WORDS: Record<SortColor, ColorWords> = {
  red: { m: 'красный', f: 'красная', n: 'красное', accF: 'красную', pl: 'красные', plAnim: 'красных' },
  yellow: { m: 'жёлтый', f: 'жёлтая', n: 'жёлтое', accF: 'жёлтую', pl: 'жёлтые', plAnim: 'жёлтых' },
  blue: { m: 'синий', f: 'синяя', n: 'синее', accF: 'синюю', pl: 'синие', plAnim: 'синих' },
  green: { m: 'зелёный', f: 'зелёная', n: 'зелёное', accF: 'зелёную', pl: 'зелёные', plAnim: 'зелёных' },
}

export function capitalizeRu(text: string): string {
  return text ? text[0]!.toUpperCase() + text.slice(1) : text
}

/** «красный» / «красная» / «красное» — согласовано с игрушкой. */
export function colorNomRu(color: SortColor, kind: SortKind): string {
  return COLOR_WORDS[color][SORT_KIND_WORDS[kind].gender]
}

/** Винительный ед.: «красный мячик», «красную звёздочку». */
export function colorAccRu(color: SortColor, kind: SortKind): string {
  const w = COLOR_WORDS[color]
  const g = SORT_KIND_WORDS[kind].gender
  return g === 'f' ? w.accF : w[g]
}

/** Винительный мн.: «красные мячики», «красных уточек». */
export function colorAccPlRu(color: SortColor, kind: SortKind): string {
  const w = COLOR_WORDS[color]
  return SORT_KIND_WORDS[kind].animate ? w.plAnim : w.pl
}

/** «с мячиками» / «со звёздочками». */
export function withKindPlRu(kind: SortKind): string {
  const w = SORT_KIND_WORDS[kind]
  return `${w.withPrep} ${w.insPl}`
}

export function sortToyLabelRu(kind: SortKind, color: SortColor): string {
  return `${colorNomRu(color, kind)} ${SORT_KIND_WORDS[kind].nom}`
}

export function sortBinLabelRu(kind: SortKind): string {
  return `Ящик ${withKindPlRu(kind)}`
}
