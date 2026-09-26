export const BALLOON_VOICE_FILES = [
  'free-idle.mp3',
  'praise-free-01.mp3',
  'praise-free-02.mp3',
  'praise-free-03.mp3',
  'praise-free-04.mp3',
  'praise-task-done-01.mp3',
  'praise-task-done-02.mp3',
  'praise-task-done-03.mp3',
  'praise-step-01.mp3',
  'praise-step-02.mp3',
  'nudge-wrong-balloon.mp3',
  'task-color-red-direct.mp3',
  'task-color-orange-direct.mp3',
  'task-color-yellow-direct.mp3',
  'task-color-green-direct.mp3',
  'task-color-violet-direct.mp3',
  'task-color-red-together.mp3',
  'task-color-orange-together.mp3',
  'task-color-yellow-together.mp3',
  'task-color-green-together.mp3',
  'task-color-violet-together.mp3',
  'task-both-red.mp3',
  'task-both-orange.mp3',
  'task-both-yellow.mp3',
  'task-both-green.mp3',
  'task-both-violet.mp3',
  'task-big-red.mp3',
  'task-small-red.mp3',
  'task-big-orange.mp3',
  'task-small-orange.mp3',
  'task-big-yellow.mp3',
  'task-small-yellow.mp3',
  'task-big-green.mp3',
  'task-small-green.mp3',
  'task-big-violet.mp3',
  'task-small-violet.mp3',
  'task-big-any.mp3',
  'task-small-any.mp3',
  'task-two-big.mp3',
] as const

export type BalloonVoiceFile = (typeof BALLOON_VOICE_FILES)[number]

const LINE_TO_FILE: readonly [string, BalloonVoiceFile][] = [
  ['Шарики ждут. Выбирай любой!', 'free-idle.mp3'],
  ['Шарики ждут — выбирай любой!', 'free-idle.mp3'],
  ['Отлично!', 'praise-free-01.mp3'],
  ['Ура! Давай ещё!', 'praise-free-02.mp3'],
  ['Здорово!', 'praise-free-03.mp3'],
  ['Продолжай!', 'praise-free-04.mp3'],
  ['Супер! Всё получилось!', 'praise-task-done-01.mp3'],
  ['Здорово! Всё получилось!', 'praise-task-done-02.mp3'],
  ['Класс! Всё получилось!', 'praise-task-done-03.mp3'],
  ['Ещё один!', 'praise-step-01.mp3'],
  ['Ещё шарик!', 'praise-step-02.mp3'],
  ['Это другой шарик. Давай найдём нужный!', 'nudge-wrong-balloon.mp3'],
  ['Это другой шарик, давай найдём нужный!', 'nudge-wrong-balloon.mp3'],
  ['Лопни красный шарик.', 'task-color-red-direct.mp3'],
  ['Лопни оранжевый шарик.', 'task-color-orange-direct.mp3'],
  ['Лопни жёлтый шарик.', 'task-color-yellow-direct.mp3'],
  ['Лопни зелёный шарик.', 'task-color-green-direct.mp3'],
  ['Лопни фиолетовый шарик.', 'task-color-violet-direct.mp3'],
  ['Давай лопнем красный шарик!', 'task-color-red-together.mp3'],
  ['Давай лопнем оранжевый шарик!', 'task-color-orange-together.mp3'],
  ['Давай лопнем жёлтый шарик!', 'task-color-yellow-together.mp3'],
  ['Давай лопнем зелёный шарик!', 'task-color-green-together.mp3'],
  ['Давай лопнем фиолетовый шарик!', 'task-color-violet-together.mp3'],
  ['Давай лопнем оба красных шарика!', 'task-both-red.mp3'],
  ['Давай лопнем оба оранжевых шарика!', 'task-both-orange.mp3'],
  ['Давай лопнем оба жёлтых шарика!', 'task-both-yellow.mp3'],
  ['Давай лопнем оба зелёных шарика!', 'task-both-green.mp3'],
  ['Давай лопнем оба фиолетовых шарика!', 'task-both-violet.mp3'],
  ['Лопни большой красный шарик.', 'task-big-red.mp3'],
  ['Лопни маленький красный шарик.', 'task-small-red.mp3'],
  ['Лопни большой оранжевый шарик.', 'task-big-orange.mp3'],
  ['Лопни маленький оранжевый шарик.', 'task-small-orange.mp3'],
  ['Лопни большой жёлтый шарик.', 'task-big-yellow.mp3'],
  ['Лопни маленький жёлтый шарик.', 'task-small-yellow.mp3'],
  ['Лопни большой зелёный шарик.', 'task-big-green.mp3'],
  ['Лопни маленький зелёный шарик.', 'task-small-green.mp3'],
  ['Лопни большой фиолетовый шарик.', 'task-big-violet.mp3'],
  ['Лопни маленький фиолетовый шарик.', 'task-small-violet.mp3'],
  ['Лопни большой шарик.', 'task-big-any.mp3'],
  ['Лопни маленький шарик.', 'task-small-any.mp3'],
  ['Лопни два больших шарика.', 'task-two-big.mp3'],
]

export function balloonVoiceUrl(file: BalloonVoiceFile | string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/games/balloon-pop/voice/${file}`
}

export function balloonVoiceFileForLine(message: string): BalloonVoiceFile | null {
  const text = message.trim()
  if (!text) return null
  let best: { file: BalloonVoiceFile; len: number } | null = null
  for (const [line, file] of LINE_TO_FILE) {
    if (text === line || text.endsWith(line) || text.includes(line)) {
      if (!best || line.length > best.len) best = { file, len: line.length }
    }
  }
  return best?.file ?? null
}
