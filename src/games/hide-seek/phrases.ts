/**
 * Фразы ведущего «Прятки» — SSOT для озвучки (тот же голос, что в «Лопни шарик» и «Куда положить?»).
 * С именем предмета — 2 фразы на предмет («Где спрятался…?», «Вот он…!»); остальное — общее.
 * Одинаковые предметы на разных сценах (улитка, ведёрко, бабочка) делят один файл.
 */
import { voiceLine as line, type VoiceLine } from '../../shared/voice-lines'
import { HIDE_SCENES, type HideItem, type HideScene } from './scenes'

export { createLinePicker, type VoiceLine } from '../../shared/voice-lines'

const HID: Record<HideItem['gender'], string> = { m: 'спрятался', f: 'спряталась', n: 'спряталось' }
const THAT: Record<HideItem['gender'], string> = { m: 'он', f: 'она', n: 'оно' }

export function introLine(scene: HideScene): VoiceLine {
  return line(`intro-${scene.id}`, scene.intro)
}

/** Задание и его повтор-подсказка. */
export function whereLine(item: HideItem): VoiceLine {
  return line(`where-${item.id}`, `Где ${HID[item.gender]} ${item.nom}?`)
}

export function foundLine(item: HideItem): VoiceLine {
  return line(`found-${item.id}`, `Вот ${THAT[item.gender]}, ${item.nom}!`)
}

/** Начало раунда на той же сцене («Заново»); новая сцена начинается с `introLine`. */
export const START_LINES: readonly VoiceLine[] = [
  line('start-01', 'Давай поиграем в прятки!'),
  line('start-02', 'Раз, два, три, четыре, пять — идём искать!'),
  line('start-03', 'Приготовились? Ищем!'),
]

/** После двух промахов подряд — без «нет». */
export const NEAR_LINES: readonly VoiceLine[] = [
  line('near-01', 'Где-то рядом…'),
  line('near-02', 'Поищи ещё!'),
  line('near-03', 'Почти! Давай поищем ещё!'),
  line('near-04', 'Тепло! Ты уже близко!'),
  line('near-05', 'Не тут. Давай заглянем в другое место!'),
  line('near-06', 'Хм, тут пусто. Ищем дальше!'),
]

/** Нашёлся другой предмет раунда — засчитали, задание остаётся. */
export const OTHER_LINES: readonly VoiceLine[] = [
  line('other-01', 'Ура, нашли! Но тут прячется кто-то ещё!'),
  line('other-02', 'Есть! Но кто-то ещё прячется!'),
  line('other-03', 'Нашли! Но кто-то ещё не нашёлся!'),
  line('other-04', 'Ура, ещё один! Кто-то всё ещё прячется!'),
]

/** Переход к следующему предмету (вместо похвалы, через раз). */
export const NEXT_LINES: readonly VoiceLine[] = [
  line('next-01', 'Ищем дальше!'),
  line('next-02', 'А теперь кто спрятался?'),
  line('next-03', 'Кого ещё поищем?'),
]

/** Короткая похвала после «Вот он…!». */
export const PRAISE_LINES: readonly VoiceLine[] = [
  line('praise-01', 'Молодец!'),
  line('praise-02', 'Ура!'),
  line('praise-03', 'Здорово!'),
  line('praise-04', 'Отлично!'),
  line('praise-05', 'Вот так!'),
]

/** Долго нет касаний — вместе с мягким сиянием-подсказкой. */
export const IDLE_LINES: readonly VoiceLine[] = [
  line('idle-01', 'Загляни куда-нибудь!'),
  line('idle-02', 'Кто-то ждёт, чтобы его нашли!'),
  line('idle-03', 'Давай поищем вместе!'),
]

export const ROUND_DONE_LINES: readonly VoiceLine[] = [
  line('done-01', 'Ура! Все нашлись!'),
  line('done-02', 'Вот это да! Мы всех нашли!'),
  line('done-03', 'Молодец! Всех нашли!'),
  line('done-04', 'Мы всех нашли! Какие мы молодцы!'),
  line('done-05', 'Все нашлись! Здорово поиграли!'),
  line('done-06', 'Вот и все! Больше никто не прячется!'),
]

/** Полный список в порядке записи трека (без повторов файлов): n-й кусок трека = n-я строка. */
export const HIDE_SEEK_VOICE_SCRIPT: readonly VoiceLine[] = (() => {
  const seen = new Set<string>()
  const out: VoiceLine[] = []
  const add = (l: VoiceLine): void => {
    if (seen.has(l.file)) return
    seen.add(l.file)
    out.push(l)
  }
  for (const scene of HIDE_SCENES) add(introLine(scene))
  for (const l of START_LINES) add(l)
  for (const scene of HIDE_SCENES) {
    for (const it of scene.items) {
      add(whereLine(it))
      add(foundLine(it))
    }
  }
  for (const l of [...NEAR_LINES, ...OTHER_LINES, ...NEXT_LINES, ...PRAISE_LINES, ...IDLE_LINES, ...ROUND_DONE_LINES]) {
    add(l)
  }
  return out
})()
