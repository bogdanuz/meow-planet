/**
 * Все фразы совы «Куда положить?» — SSOT для mp3 (docs/assets/sort-colors-VOICE-SCRIPT.md
 * сверяется unit-тестом строка в строку, порядок = порядок записи трека).
 */
import { voiceLine as line, type VoiceLine } from '../../shared/voice-lines'
import {
  capitalizeRu,
  colorAccPlRu,
  colorAccRu,
  SORT_COLORS,
  SORT_KIND_WORDS,
  SORT_KINDS,
  withKindPlRu,
  type SortKind,
} from './catalog'
import type { SortTask } from './logic'

export { createLinePicker, type VoiceLine } from '../../shared/voice-lines'

export const FREE_START_LINES: readonly VoiceLine[] = [
  line('free-start-01', 'Ой, всё перепуталось! Давай разложим игрушки по местам!'),
  line('free-start-02', 'Давай наведём порядок!'),
  line('free-start-03', 'Игрушки ждут. Каждой нужен свой домик!'),
  line('free-start-04', 'Помоги мне собрать игрушки!'),
]

export const PRAISE_LINES: readonly VoiceLine[] = [
  line('praise-01', 'Отлично!'),
  line('praise-02', 'Ура!'),
  line('praise-03', 'Здорово!'),
  line('praise-04', 'Класс!'),
  line('praise-05', 'Вот так!'),
]

export const FREE_DONE_LINES: readonly VoiceLine[] = [
  line('free-done-01', 'Ура! Все игрушки на местах!'),
  line('free-done-02', 'Здорово! Всё разложено!'),
  line('free-done-03', 'Какой порядок! Все игрушки дома!'),
  line('free-done-04', 'Класс! Все игрушки на местах!'),
]

export const TASK_DONE_LINES: readonly VoiceLine[] = [
  line('task-done-01', 'Супер! Всё получилось!'),
  line('task-done-02', 'Здорово! Всё получилось!'),
  line('task-done-03', 'Класс! Всё получилось!'),
]

export const STEP_LINES: readonly VoiceLine[] = [
  line('step-01', 'Есть! Ищем дальше!'),
  line('step-02', 'Отлично! Ещё!'),
]

const Nom = (kind: SortKind) => capitalizeRu(SORT_KIND_WORDS[kind].nom)

export function nameLine(kind: SortKind): VoiceLine {
  return line(`name-${kind}`, `${Nom(kind)}!`)
}

export function praiseNamedLine(kind: SortKind, variant: 'home' | 'to'): VoiceLine {
  const text = variant === 'home' ? `${Nom(kind)} дома!` : `${Nom(kind)} к ${SORT_KIND_WORDS[kind].datPl}!`
  return line(`praise-${variant}-${kind}`, text)
}

export function wrongLine(kind: SortKind, variant: 1 | 2 | 3): VoiceLine {
  const w = SORT_KIND_WORDS[kind]
  const bin = `ящик ${withKindPlRu(kind)}`
  const pronoun = w.gender === 'f' ? 'Ей' : 'Ему'
  const text =
    variant === 1
      ? `Это ${w.nom}. ${pronoun} нужен ${bin}.`
      : variant === 2
        ? `Это ${w.nom}. Давай найдём ${bin}!`
        : `${Nom(kind)} живёт в ящике ${withKindPlRu(kind)}.`
  return line(`wrong-${kind}-${variant}`, text)
}

export function showLine(kind: SortKind): VoiceLine {
  return line(`show-${kind}`, `Смотри, вот ящик ${withKindPlRu(kind)}!`)
}

export function yesLine(kind: SortKind): VoiceLine {
  return line(`yes-${kind}`, `Да, это ${SORT_KIND_WORDS[kind].nom}!`)
}

export function taskLine(task: SortTask): VoiceLine {
  const w = SORT_KIND_WORDS[task.kind]
  const k = task.kind
  switch (task.type) {
    case 'one': {
      const tail = `${w.acc} в ящик ${withKindPlRu(k)}`
      return task.tone === 'direct'
        ? line(`task-one-${k}-direct`, `Положи ${tail}.`)
        : line(`task-one-${k}-together`, `Давай положим ${tail}!`)
    }
    case 'all': {
      const all = `${w.animate ? 'всех' : 'все'} ${w.accPl}`
      return task.tone === 'direct'
        ? line(`task-all-${k}-direct`, `Собери ${all}.`)
        : line(`task-all-${k}-together`, `Давай соберём ${all}!`)
    }
    case 'color':
      return line(`task-color-${task.color}-${k}`, `Положи ${colorAccRu(task.color, k)} ${w.acc}.`)
    case 'allColor':
      return line(
        `task-allcolor-${task.color}-${k}`,
        `Давай соберём ${w.animate ? 'всех' : 'все'} ${colorAccPlRu(task.color, k)} ${w.accPl}!`,
      )
  }
}

/** Полный список в порядке записи трека. */
export const SORT_VOICE_SCRIPT: readonly VoiceLine[] = [
  ...FREE_START_LINES,
  ...SORT_KINDS.map(nameLine),
  ...PRAISE_LINES,
  ...SORT_KINDS.flatMap((k) => [praiseNamedLine(k, 'home'), praiseNamedLine(k, 'to')]),
  ...SORT_KINDS.flatMap((k) => [wrongLine(k, 1), wrongLine(k, 2), wrongLine(k, 3)]),
  ...SORT_KINDS.map(showLine),
  ...SORT_KINDS.map(yesLine),
  ...FREE_DONE_LINES,
  ...TASK_DONE_LINES,
  ...STEP_LINES,
  ...SORT_KINDS.flatMap((kind) => [
    taskLine({ type: 'one', kind, tone: 'direct' }),
    taskLine({ type: 'one', kind, tone: 'together' }),
  ]),
  ...SORT_KINDS.flatMap((kind) => [
    taskLine({ type: 'all', kind, tone: 'direct' }),
    taskLine({ type: 'all', kind, tone: 'together' }),
  ]),
  ...SORT_COLORS.flatMap((color) => SORT_KINDS.map((kind) => taskLine({ type: 'color', kind, color }))),
  ...SORT_COLORS.flatMap((color) => SORT_KINDS.map((kind) => taskLine({ type: 'allColor', kind, color }))),
]

/** Имя ребёнка — только в тексте пузыря: «Маша, положи кубик…». */
export function withChildName(name: string, text: string): string {
  const n = name.trim()
  if (!n || !text) return text
  return `${n}, ${text[0]!.toLowerCase()}${text.slice(1)}`
}