import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  migrateSettings,
  normalizeSettings,
  resetSettings,
  sanitizeChildName,
  saveSettings,
  STORAGE_KEY,
  type StorageLike,
} from '../../src/shared/storage'

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  store: Record<string, string>
} {
  const store = { ...initial }
  return {
    store,
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key]! : null
    },
    setItem(key, value) {
      store[key] = value
    },
    removeItem(key) {
      delete store[key]
    },
  }
}

describe('storage', () => {
  let storage: ReturnType<typeof memoryStorage>

  beforeEach(() => {
    storage = memoryStorage()
  })

  it('loadSettings без ключа → defaults', () => {
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS)
  })

  it('saveSettings + loadSettings — круглый путь', () => {
    saveSettings(
      {
        ...DEFAULT_SETTINGS,
        childName: 'Алиса',
        quietMode: true,
        countingLimit: 3,
      },
      storage,
    )
    const loaded = loadSettings(storage)
    expect(loaded.childName).toBe('Алиса')
    expect(loaded.quietMode).toBe(true)
    expect(loaded.countingLimit).toBe(3)
    expect(loaded.schemaVersion).toBe(DEFAULT_SETTINGS.schemaVersion)
  })

  it('битый JSON → defaults, без исключения', () => {
    storage.setItem(STORAGE_KEY, '{not-json')
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS)
  })

  it('неверные типы полей → умолчания для этих полей', () => {
    const normalized = normalizeSettings({
      childName: 123,
      soundEnabled: 'yes',
      countingLimit: 99,
      customPuzzleIds: 'oops',
      quietMode: true,
    })
    expect(normalized.childName).toBe('')
    expect(normalized.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled)
    expect(normalized.countingLimit).toBe(10)
    expect(normalized.customPuzzleIds).toEqual([])
    expect(normalized.quietMode).toBe(true)
  })

  it('sanitizeChildName режет управляющие символы и длину', () => {
    expect(sanitizeChildName('  Мяу\u0000  ')).toBe('Мяу')
    expect(sanitizeChildName('a'.repeat(100)).length).toBe(40)
    expect(sanitizeChildName(null)).toBe('')
  })

  it('resetSettings очищает ключ', () => {
    saveSettings({ ...DEFAULT_SETTINGS, childName: 'Богдан' }, storage)
    const reset = resetSettings(storage)
    expect(reset).toEqual(DEFAULT_SETTINGS)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('старая запись без схемы становится текущей версией', () => {
    const migrated = migrateSettings({ childName: 'Мяу', schemaVersion: 0 })
    expect(migrated.schemaVersion).toBe(DEFAULT_SETTINGS.schemaVersion)
    expect(migrated.childName).toBe('Мяу')
  })

  it('saveSettings возвращает false, если браузер не записал', () => {
    const failing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: () => undefined,
    }
    expect(saveSettings(DEFAULT_SETTINGS, failing)).toBe(false)
  })
})
