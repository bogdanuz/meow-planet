/**
 * Фразы ведущего «Учимся считать»: имя файла mp3 и тот же текст для облачка.
 * Каждая фраза записывается целиком (без склейки кусочков) — решение владельца 03.10.2026.
 * Список для записи — `docs/assets/counting-VOICE-SCRIPT.md`.
 */
import { createLinePicker, voiceLine, type VoiceLine } from '../../shared/voice-lines'
import { TOY_KINDS, type ToyKind } from '../../shared/toys'
import {
  capitalizeRu,
  numberWordRu,
  toyCountRu,
  toyGender,
  toyManyRu,
  toyOneAccRu,
  toyPluralAccRu,
  toyPluralRu,
  type Gender,
} from './words'

export { createLinePicker, type VoiceLine }

const NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
const GENDERS: readonly Gender[] = ['m', 'f', 'n']

/** Цифра на панели и счёт вслух: «Три». */
export const numLine = (n: number): VoiceLine => voiceLine(`num-${n}`, capitalizeRu(numberWordRu(n)))

/** «Три кубика!» — сколько в ящике. */
export const countLine = (kind: ToyKind, n: number): VoiceLine =>
  voiceLine(`count-${kind}-${n}`, `${capitalizeRu(toyCountRu(kind, n))}!`)

export const freeStartLine = (kind: ToyKind): VoiceLine =>
  voiceLine(`start-${kind}`, `Давай считать! Положи ${toyOneAccRu(kind)} в ящик.`)

export const kindLine = (kind: ToyKind): VoiceLine => voiceLine(`kind-${kind}`, `Теперь считаем ${toyPluralAccRu(kind)}!`)

export const allInLine = (kind: ToyKind): VoiceLine => voiceLine(`all-${kind}`, `Все ${toyPluralRu(kind)} в ящике!`)

/** Положили одну: «Было два, стало три!» (n — сколько стало, 2–10). */
export const moreLine = (n: number): VoiceLine =>
  voiceLine(`more-${n}`, n === 2 ? 'Был один, стало два!' : `Было ${numberWordRu(n - 1)}, стало ${numberWordRu(n)}!`)

/** Достали одну: «Было три, стало два!» (n — сколько осталось, 1–9). */
export const lessLine = (n: number): VoiceLine =>
  voiceLine(`less-${n}`, n === 1 ? 'Было два, остался один!' : `Было ${numberWordRu(n + 1)}, стало ${numberWordRu(n)}!`)

export const EMPTY_LINES: readonly VoiceLine[] = [
  voiceLine('empty-1', 'Пусто!'),
  voiceLine('empty-2', 'Ой, пусто! В ящике ничего нет.'),
]

// ── Задания ──
export const giveLine = (kind: ToyKind, n: number): VoiceLine =>
  voiceLine(`give-${kind}-${n}`, `Положи в ящик ${toyCountRu(kind, n, 'acc')}!`)

const EACH: Record<Gender, string> = { m: 'каждый', f: 'каждую', n: 'каждое' }
export const countTaskLine = (kind: ToyKind): VoiceLine =>
  voiceLine(`task-count-${kind}`, `Посчитай ${toyPluralAccRu(kind)}! Нажимай на ${EACH[toyGender(kind)]}.`)

export const addLine = (g: Gender): VoiceLine => voiceLine(`task-add-${g}`, `Добавь ещё ${numberWordRu(1, g, 'acc')}!`)
export const removeLine = (g: Gender): VoiceLine => voiceLine(`task-remove-${g}`, `Убери ${numberWordRu(1, g, 'acc')}!`)

export const howManyLine = (kind: ToyKind): VoiceLine =>
  voiceLine(`task-howmany-${kind}`, `Сколько ${toyManyRu(kind)} в ящике? Нажми на цифру!`)

export const compareLine = (kind: ToyKind): VoiceLine =>
  voiceLine(`task-compare-${kind}`, `Где больше ${toyManyRu(kind)}? Нажми на ящик!`)

export const TASK_START_LINE = voiceLine('task-start', 'Давай поиграем в задания!')
export const COMPARE_YES_LINE = voiceLine('compare-yes', 'Да! Здесь больше!')
export const TOO_MANY_LINE = voiceLine('soft-too-many', 'Многовато! Давай одну достанем.')
export const PUT_BACK_LINE = voiceLine('soft-put-back', 'Ой, убрали много! Давай одну вернём.')

export const TOGETHER_LINES: readonly VoiceLine[] = [
  voiceLine('together-1', 'Давай посчитаем вместе!'),
  voiceLine('together-2', 'Посчитаем вместе?'),
]

export const PRAISE_LINES: readonly VoiceLine[] = [
  voiceLine('praise-1', 'Молодец!'),
  voiceLine('praise-2', 'Правильно!'),
  voiceLine('praise-3', 'Ура, получилось!'),
  voiceLine('praise-4', 'Здорово!'),
  voiceLine('praise-5', 'Умница!'),
  voiceLine('praise-6', 'Вот это да!'),
]

export const NEXT_LINES: readonly VoiceLine[] = [
  voiceLine('next-1', 'Следующее задание!'),
  voiceLine('next-2', 'А теперь вот что!'),
]

/** Все фразы по порядку записи — для сценария озвучки и проверки нарезки. */
export const ALL_VOICE_LINES: readonly VoiceLine[] = [
  ...NUMS.map(numLine),
  ...TOY_KINDS.flatMap((kind) => NUMS.map((n) => countLine(kind, n))),
  ...TOY_KINDS.map(freeStartLine),
  ...TOY_KINDS.map(kindLine),
  ...TOY_KINDS.map(allInLine),
  ...NUMS.filter((n) => n >= 2).map(moreLine),
  ...NUMS.filter((n) => n <= 9).map(lessLine),
  ...EMPTY_LINES,
  TASK_START_LINE,
  ...TOY_KINDS.flatMap((kind) => NUMS.map((n) => giveLine(kind, n))),
  ...TOY_KINDS.map(countTaskLine),
  ...GENDERS.map(addLine),
  ...GENDERS.map(removeLine),
  ...TOY_KINDS.map(howManyLine),
  ...TOY_KINDS.map(compareLine),
  COMPARE_YES_LINE,
  TOO_MANY_LINE,
  PUT_BACK_LINE,
  ...TOGETHER_LINES,
  ...PRAISE_LINES,
  ...NEXT_LINES,
]
