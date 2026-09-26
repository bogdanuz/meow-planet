import type { BalloonFieldColor, BalloonTask } from './logic'
import { colorLabelRu } from './logic'

/** Формы слова цвета в подсказках (муж. род, мн. для «оба …»). */
const COLOR_FORMS: Record<BalloonFieldColor, readonly string[]> = {
  red: ['красный', 'красных', 'красного'],
  orange: ['оранжевый', 'оранжевых', 'оранжевого'],
  yellow: ['жёлтый', 'жёлтого', 'жёлтых', 'желтый', 'желтых'],
  green: ['зелёный', 'зелёных', 'зелёного', 'зеленый', 'зеленых'],
  violet: ['фиолетовый', 'фиолетовых', 'фиолетового'],
}

export function taskSpeechColor(task: BalloonTask): BalloonFieldColor | null {
  if (task.type === 'color' || task.type === 'all_color' || task.type === 'color_size') {
    return task.color
  }
  return null
}

/** Реплика через текстовые узлы: слово цвета — отдельным span, без innerHTML. */
export function fillSpeechElement(
  el: HTMLElement,
  plain: string,
  emphasizeColor: BalloonFieldColor | null,
): void {
  el.replaceChildren()
  if (!emphasizeColor) {
    el.textContent = plain
    return
  }

  const forms = [...COLOR_FORMS[emphasizeColor]].sort((a, b) => b.length - a.length)
  const lower = plain.toLowerCase()
  for (const form of forms) {
    const idx = lower.indexOf(form.toLowerCase())
    if (idx < 0) continue
    const matched = plain.slice(idx, idx + form.length)
    const span = document.createElement('span')
    span.className = `balloon-pop__speech-color balloon-pop__speech-color--${emphasizeColor}`
    span.textContent = matched
    if (idx > 0) el.append(document.createTextNode(plain.slice(0, idx)))
    el.append(span)
    const rest = plain.slice(idx + form.length)
    if (rest) el.append(document.createTextNode(rest))
    return
  }

  const fallback = colorLabelRu(emphasizeColor)
  const idx = lower.indexOf(fallback.toLowerCase())
  if (idx < 0) {
    el.textContent = plain
    return
  }
  const span = document.createElement('span')
  span.className = `balloon-pop__speech-color balloon-pop__speech-color--${emphasizeColor}`
  span.textContent = plain.slice(idx, idx + fallback.length)
  if (idx > 0) el.append(document.createTextNode(plain.slice(0, idx)))
  el.append(span)
  const rest = plain.slice(idx + fallback.length)
  if (rest) el.append(document.createTextNode(rest))
}
