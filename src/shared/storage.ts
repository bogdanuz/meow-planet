import { COMPANION_DEFAULT, isCompanionId, type CompanionId } from './companion'

/** Версия схемы localStorage. При несовместимом изменении — bump + миграция. */
export const STORAGE_SCHEMA_VERSION = 3

export const STORAGE_KEY = 'meow-planet.settings'

/** «Считаем до»: 3, 5 или 10. */
export type CountingLimit = 3 | 5 | 10

export const COUNTING_LIMIT_CHOICES: readonly CountingLimit[] = [3, 5, 10]

/** Галочки заданий «Учимся считать»; «Добавь / убери одну» — одна галочка. */
export const COUNTING_TASK_IDS = ['give', 'count', 'addRemove', 'howMany', 'compare'] as const
export type CountingTaskId = (typeof COUNTING_TASK_IDS)[number]

export type PuzzlePieceCount = 4 | 6 | 9

/** Сколько деталей помещается на экране «Собери что угодно!». */
export type SandboxMaxPieces = 20 | 40 | 60

export const SANDBOX_MAX_PIECES_CHOICES: readonly SandboxMaxPieces[] = [20, 40, 60]

/**
 * Размер деталей: «Крупные» (на iPad кубик ~80 px), «Средние» (`small` — бывшие «Мелкие»,
 * id сохранён для старых настроек), «Мелкие» (`tiny`) — комната больше для больших построек.
 */
export type SandboxPieceSize = 'big' | 'small' | 'tiny'

export function isSandboxPieceSize(value: unknown): value is SandboxPieceSize {
  return value === 'big' || value === 'small' || value === 'tiny'
}

/** «Прятки»: сколько искать и насколько предметы прячутся. */
export type HideSeekLevel = 'easy' | 'medium' | 'hard'

export function isHideSeekLevel(value: unknown): value is HideSeekLevel {
  return value === 'easy' || value === 'medium' || value === 'hard'
}

export type AppSettings = {
  schemaVersion: number
  childName: string
  soundEnabled: boolean
  musicEnabled: boolean
  quietMode: boolean
  /** Скрыть категорию EN в «Изучаем звуки». */
  hideEnglishAlphabet: boolean
  /** «Учимся считать»: до скольких считаем. */
  countingLimit: CountingLimit
  /** Какие задания идут по кругу в режиме «Задание». */
  countingTasks: CountingTaskId[]
  /** Повтор задания через 6 с и сияние через 12 с; кнопка «Подсказка» работает всегда. */
  countingAutoHints: boolean
  /** Разрешить режим заданий (★) в «Лопни шарик». */
  balloonTasksEnabled: boolean
  /** Кто говорит в играх и стоит в меню: котёнок или сова. */
  companion: CompanionId
  /** Сколько кусочков в «Собери пазл». */
  puzzlePieceCount: PuzzlePieceCount
  /** Подсвечивать в пазле клетку, куда ложится кусочек в руке. */
  puzzleTargetHint: boolean
  /** «Собери что угодно!»: физика «как в жизни» вместо мягкой. */
  sandboxRealPhysics: boolean
  sandboxMaxPieces: SandboxMaxPieces
  /** Деталь в руке сама встаёт ровно. */
  sandboxAutoStraight: boolean
  /** Детали, которые взрослый убрал из шкафа. */
  sandboxHiddenKinds: string[]
  /** «Липучка»: аккуратно поставленная деталь прилипает. */
  sandboxSticky: boolean
  sandboxPieceSize: SandboxPieceSize
  hideSeekLevel: HideSeekLevel
  /** Иногда показывать сцену зеркально. */
  hideSeekMirror: boolean
  /** Повтор задания через 6 с и сияние через 12 с; кнопка-лупа работает всегда. */
  hideSeekAutoHints: boolean
  /** «В гости»: горшок в ванной и желание «на горшок». */
  meowHomePotty: boolean
  /** «В гости»: персонаж сам показывает, чего хочет. */
  meowHomeWishes: boolean
  /** «В гости»: день/ночь на входе по настоящим часам (выкл. — всегда день). */
  meowHomeRealTime: boolean
  /** «В гости»: сезон во дворе по настоящей дате (выкл. — лето). */
  meowHomeSeasonByDate: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: STORAGE_SCHEMA_VERSION,
  childName: '',
  soundEnabled: true,
  musicEnabled: true,
  quietMode: false,
  hideEnglishAlphabet: false,
  countingLimit: 3,
  countingTasks: ['give', 'count', 'addRemove'],
  countingAutoHints: true,
  balloonTasksEnabled: true,
  companion: COMPANION_DEFAULT,
  puzzlePieceCount: 4,
  puzzleTargetHint: true,
  sandboxRealPhysics: false,
  sandboxMaxPieces: 40,
  sandboxAutoStraight: true,
  sandboxHiddenKinds: [],
  sandboxSticky: true,
  sandboxPieceSize: 'small',
  hideSeekLevel: 'easy',
  hideSeekMirror: true,
  hideSeekAutoHints: true,
  meowHomePotty: true,
  meowHomeWishes: true,
  meowHomeRealTime: true,
  meowHomeSeasonByDate: true,
}

const MAX_CHILD_NAME_LENGTH = 40

/** Убрать управляющие символы; имя никогда не вставлять через innerHTML. */
export function sanitizeChildName(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_CHILD_NAME_LENGTH)
}

function isCountingLimit(value: unknown): value is CountingLimit {
  return value === 3 || value === 5 || value === 10
}

/** Только известные задания, без повторов; не массив → все задания. */
function sanitizeCountingTasks(raw: unknown): CountingTaskId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SETTINGS.countingTasks]
  return COUNTING_TASK_IDS.filter((id) => raw.includes(id))
}

export function isPuzzlePieceCount(value: unknown): value is PuzzlePieceCount {
  return value === 4 || value === 6 || value === 9
}

export function isSandboxMaxPieces(value: unknown): value is SandboxMaxPieces {
  return value === 20 || value === 40 || value === 60
}

/** Только короткие латинские id; что из них настоящие детали — решает игра. */
function sanitizeKindList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const ids = raw.filter((v): v is string => typeof v === 'string' && /^[a-z]{2,16}$/.test(v))
  return [...new Set(ids)].slice(0, 32)
}

/**
 * Приводит сохранённый снимок к текущей схеме; любая старая или битая запись становится текущей.
 * Схема 3: «до 10» в старых записях — скрытое умолчание (пункта в настройках не было), становится «до 3».
 */
export function migrateSettings(raw: unknown): AppSettings {
  if (raw === null || typeof raw !== 'object') return normalizeSettings(raw)
  const data = raw as Record<string, unknown>
  const version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0
  if (version < 3) {
    const { countingLimit: _hidden, ...rest } = data
    return normalizeSettings(rest)
  }
  return normalizeSettings(data)
}

/**
 * Нормализует произвольный объект к AppSettings.
 * Битые/лишние поля не роняют приложение — берём умолчания.
 */
export function normalizeSettings(raw: unknown): AppSettings {
  if (raw === null || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS }
  }

  const data = raw as Record<string, unknown>

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    childName: sanitizeChildName(data.childName),
    soundEnabled:
      typeof data.soundEnabled === 'boolean'
        ? data.soundEnabled
        : DEFAULT_SETTINGS.soundEnabled,
    musicEnabled:
      typeof data.musicEnabled === 'boolean'
        ? data.musicEnabled
        : DEFAULT_SETTINGS.musicEnabled,
    quietMode:
      typeof data.quietMode === 'boolean'
        ? data.quietMode
        : DEFAULT_SETTINGS.quietMode,
    hideEnglishAlphabet:
      typeof data.hideEnglishAlphabet === 'boolean'
        ? data.hideEnglishAlphabet
        : DEFAULT_SETTINGS.hideEnglishAlphabet,
    countingLimit: isCountingLimit(data.countingLimit)
      ? data.countingLimit
      : DEFAULT_SETTINGS.countingLimit,
    countingTasks: sanitizeCountingTasks(data.countingTasks),
    countingAutoHints:
      typeof data.countingAutoHints === 'boolean' ? data.countingAutoHints : DEFAULT_SETTINGS.countingAutoHints,
    balloonTasksEnabled:
      typeof data.balloonTasksEnabled === 'boolean'
        ? data.balloonTasksEnabled
        : DEFAULT_SETTINGS.balloonTasksEnabled,
    companion: isCompanionId(data.companion) ? data.companion : COMPANION_DEFAULT,
    puzzlePieceCount: isPuzzlePieceCount(data.puzzlePieceCount)
      ? data.puzzlePieceCount
      : DEFAULT_SETTINGS.puzzlePieceCount,
    puzzleTargetHint:
      typeof data.puzzleTargetHint === 'boolean'
        ? data.puzzleTargetHint
        : DEFAULT_SETTINGS.puzzleTargetHint,
    sandboxRealPhysics: data.sandboxRealPhysics === true,
    sandboxMaxPieces: isSandboxMaxPieces(data.sandboxMaxPieces)
      ? data.sandboxMaxPieces
      : DEFAULT_SETTINGS.sandboxMaxPieces,
    sandboxAutoStraight:
      typeof data.sandboxAutoStraight === 'boolean'
        ? data.sandboxAutoStraight
        : DEFAULT_SETTINGS.sandboxAutoStraight,
    sandboxHiddenKinds: sanitizeKindList(data.sandboxHiddenKinds),
    sandboxSticky: typeof data.sandboxSticky === 'boolean' ? data.sandboxSticky : DEFAULT_SETTINGS.sandboxSticky,
    sandboxPieceSize: isSandboxPieceSize(data.sandboxPieceSize)
      ? data.sandboxPieceSize
      : DEFAULT_SETTINGS.sandboxPieceSize,
    hideSeekLevel: isHideSeekLevel(data.hideSeekLevel) ? data.hideSeekLevel : DEFAULT_SETTINGS.hideSeekLevel,
    hideSeekMirror:
      typeof data.hideSeekMirror === 'boolean' ? data.hideSeekMirror : DEFAULT_SETTINGS.hideSeekMirror,
    hideSeekAutoHints:
      typeof data.hideSeekAutoHints === 'boolean' ? data.hideSeekAutoHints : DEFAULT_SETTINGS.hideSeekAutoHints,
    meowHomePotty: typeof data.meowHomePotty === 'boolean' ? data.meowHomePotty : DEFAULT_SETTINGS.meowHomePotty,
    meowHomeWishes: typeof data.meowHomeWishes === 'boolean' ? data.meowHomeWishes : DEFAULT_SETTINGS.meowHomeWishes,
    meowHomeRealTime:
      typeof data.meowHomeRealTime === 'boolean' ? data.meowHomeRealTime : DEFAULT_SETTINGS.meowHomeRealTime,
    meowHomeSeasonByDate:
      typeof data.meowHomeSeasonByDate === 'boolean' ? data.meowHomeSeasonByDate : DEFAULT_SETTINGS.meowHomeSeasonByDate,
  }
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Безопасное чтение: любой сбой → DEFAULT_SETTINGS. */
export function loadSettings(storage?: StorageLike): AppSettings {
  try {
    const raw = (storage ?? localStorage).getItem(STORAGE_KEY)
    if (raw === null) return { ...DEFAULT_SETTINGS }
    return migrateSettings(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/** Запись нормализованного снимка. false — память браузера не приняла запись. */
export function saveSettings(
  settings: AppSettings,
  storage?: StorageLike,
): boolean {
  const normalized = normalizeSettings(settings)
  try {
    ;(storage ?? localStorage).setItem(STORAGE_KEY, JSON.stringify(normalized))
    return true
  } catch {
    return false
  }
}

export function resetSettings(storage?: StorageLike): AppSettings {
  const defaults = { ...DEFAULT_SETTINGS }
  try {
    ;(storage ?? localStorage).removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  return defaults
}
