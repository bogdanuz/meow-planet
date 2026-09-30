import { COMPANION_DEFAULT, isCompanionId, type CompanionId } from './companion'

/** Версия схемы localStorage. При несовместимом изменении — bump + миграция. */
export const STORAGE_SCHEMA_VERSION = 2

export const STORAGE_KEY = 'meow-planet.settings'

export type CountingLimit = 3 | 10

export type AppSettings = {
  schemaVersion: number
  childName: string
  soundEnabled: boolean
  musicEnabled: boolean
  quietMode: boolean
  /** Скрыть категорию EN в «Изучаем звуки». */
  hideEnglishAlphabet: boolean
  /** Лимит счёта: 1–3 или 1–10. */
  countingLimit: CountingLimit
  /** Разрешить режим заданий (★) в «Лопни шарик». */
  balloonTasksEnabled: boolean
  /** Кто говорит в играх и стоит в меню: котёнок или сова. */
  companion: CompanionId
  /** Локальные ID пользовательских пазлов (файлы — отдельно, S03/S09). */
  customPuzzleIds: string[]
}

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: STORAGE_SCHEMA_VERSION,
  childName: '',
  soundEnabled: true,
  musicEnabled: true,
  quietMode: false,
  hideEnglishAlphabet: false,
  countingLimit: 10,
  balloonTasksEnabled: true,
  companion: COMPANION_DEFAULT,
  customPuzzleIds: [],
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
  return value === 3 || value === 10
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/**
 * Приводит сохранённый снимок к текущей схеме.
 * Схема пока одна: любая старая или битая запись становится текущей.
 */
export function migrateSettings(raw: unknown): AppSettings {
  return normalizeSettings(raw)
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
    balloonTasksEnabled:
      typeof data.balloonTasksEnabled === 'boolean'
        ? data.balloonTasksEnabled
        : DEFAULT_SETTINGS.balloonTasksEnabled,
    companion: isCompanionId(data.companion) ? data.companion : COMPANION_DEFAULT,
    customPuzzleIds: isStringArray(data.customPuzzleIds)
      ? [...data.customPuzzleIds]
      : [...DEFAULT_SETTINGS.customPuzzleIds],
  }
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Безопасное чтение: любой сбой → DEFAULT_SETTINGS. */
export function loadSettings(storage: StorageLike = localStorage): AppSettings {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return { ...DEFAULT_SETTINGS }
    return migrateSettings(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/** Запись нормализованного снимка. false — память браузера не приняла запись. */
export function saveSettings(
  settings: AppSettings,
  storage: StorageLike = localStorage,
): boolean {
  const normalized = normalizeSettings(settings)
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    return true
  } catch {
    return false
  }
}

export function resetSettings(storage: StorageLike = localStorage): AppSettings {
  const defaults = { ...DEFAULT_SETTINGS }
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  return defaults
}
