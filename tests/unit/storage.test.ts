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
      puzzlePieceCount: 5,
      puzzleTargetHint: 'yes',
      quietMode: true,
    })
    expect(normalized.childName).toBe('')
    expect(normalized.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled)
    expect(normalized.countingLimit).toBe(3)
    expect(normalized.puzzlePieceCount).toBe(4)
    expect(normalized.puzzleTargetHint).toBe(true)
    expect(normalized.quietMode).toBe(true)
    expect('customPuzzleIds' in normalizeSettings({ customPuzzleIds: ['a'] })).toBe(false)
    expect('coloringDragEnabled' in normalizeSettings({ coloringDragEnabled: false })).toBe(false)
  })

  it('пазл: 4 кусочка и подсказка по умолчанию, 6 и 9 сохраняются', () => {
    expect(DEFAULT_SETTINGS.puzzlePieceCount).toBe(4)
    expect(DEFAULT_SETTINGS.puzzleTargetHint).toBe(true)
    for (const count of [6, 9] as const) {
      saveSettings({ ...DEFAULT_SETTINGS, puzzlePieceCount: count, puzzleTargetHint: false }, storage)
      expect(loadSettings(storage).puzzlePieceCount).toBe(count)
      expect(loadSettings(storage).puzzleTargetHint).toBe(false)
    }
  })

  it('песочница: мягкая физика, 40 деталей, «встают ровно», шкаф полный по умолчанию', () => {
    expect(DEFAULT_SETTINGS.sandboxRealPhysics).toBe(false)
    expect(DEFAULT_SETTINGS.sandboxMaxPieces).toBe(40)
    expect(DEFAULT_SETTINGS.sandboxAutoStraight).toBe(true)
    expect(DEFAULT_SETTINGS.sandboxHiddenKinds).toEqual([])
    saveSettings(
      {
        ...DEFAULT_SETTINGS,
        sandboxRealPhysics: true,
        sandboxMaxPieces: 60,
        sandboxAutoStraight: false,
        sandboxHiddenKinds: ['stone', 'spring'],
      },
      storage,
    )
    const loaded = loadSettings(storage)
    expect(loaded.sandboxRealPhysics).toBe(true)
    expect(loaded.sandboxMaxPieces).toBe(60)
    expect(loaded.sandboxAutoStraight).toBe(false)
    expect(loaded.sandboxHiddenKinds).toEqual(['stone', 'spring'])
  })

  it('песочница: мусор → умолчания, в списке деталей только короткие латинские id', () => {
    const n = normalizeSettings({
      sandboxRealPhysics: 'yes',
      sandboxMaxPieces: 1000,
      sandboxAutoStraight: 1,
      sandboxHiddenKinds: ['stone', 'stone', '<img>', 7, 'Ball'],
    })
    expect(n.sandboxRealPhysics).toBe(false)
    expect(n.sandboxMaxPieces).toBe(40)
    expect(n.sandboxAutoStraight).toBe(true)
    expect(n.sandboxHiddenKinds).toEqual(['stone'])
    expect(normalizeSettings({ sandboxHiddenKinds: 'stone' }).sandboxHiddenKinds).toEqual([])
    expect('shapeBuildOutline' in normalizeSettings({ shapeBuildOutline: 'grey' })).toBe(false)
  })

  it('песочница: «липучка» включена, детали средние (3 размера); мусор → умолчания', () => {
    expect(DEFAULT_SETTINGS.sandboxSticky).toBe(true)
    expect(DEFAULT_SETTINGS.sandboxPieceSize).toBe('small')
    saveSettings({ ...DEFAULT_SETTINGS, sandboxSticky: false, sandboxPieceSize: 'tiny' }, storage)
    expect(loadSettings(storage).sandboxSticky).toBe(false)
    expect(loadSettings(storage).sandboxPieceSize).toBe('tiny')
    saveSettings({ ...DEFAULT_SETTINGS, sandboxPieceSize: 'big' }, storage)
    expect(loadSettings(storage).sandboxPieceSize).toBe('big')
    const n = normalizeSettings({ sandboxSticky: 'no', sandboxPieceSize: 'huge' })
    expect(n.sandboxSticky).toBe(true)
    expect(n.sandboxPieceSize).toBe('small')
  })

  it('«Учимся считать»: до 3, все задания, подсказки сами; 5 и 10 сохраняются', () => {
    expect(DEFAULT_SETTINGS.countingLimit).toBe(3)
    expect(DEFAULT_SETTINGS.countingTasks).toEqual(['give', 'count', 'addRemove'])
    expect(DEFAULT_SETTINGS.countingAutoHints).toBe(true)
    for (const limit of [5, 10] as const) {
      saveSettings({ ...DEFAULT_SETTINGS, countingLimit: limit, countingTasks: ['give', 'compare'], countingAutoHints: false }, storage)
      const loaded = loadSettings(storage)
      expect(loaded.countingLimit).toBe(limit)
      expect(loaded.countingTasks).toEqual(['give', 'compare'])
      expect(loaded.countingAutoHints).toBe(false)
    }
    const n = normalizeSettings({ countingTasks: ['give', 'give', '<b>', 7, 'compare'], countingAutoHints: 'no' })
    expect(n.countingTasks).toEqual(['give', 'compare'])
    expect(n.countingAutoHints).toBe(true)
    expect(normalizeSettings({ countingTasks: [] }).countingTasks).toEqual([])
    expect(normalizeSettings({ countingTasks: 'give' }).countingTasks).toEqual(DEFAULT_SETTINGS.countingTasks)
  })

  it('схема 3: скрытое старое «до 10» становится «до 3», выбранное взрослым после — остаётся', () => {
    expect(DEFAULT_SETTINGS.schemaVersion).toBe(3)
    expect(migrateSettings({ schemaVersion: 2, countingLimit: 10 }).countingLimit).toBe(3)
    expect(migrateSettings({ schemaVersion: 3, countingLimit: 10 }).countingLimit).toBe(10)
    saveSettings({ ...DEFAULT_SETTINGS, countingLimit: 10 }, storage)
    expect(loadSettings(storage).countingLimit).toBe(10)
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
    expect(migrated.companion).toBe('olli')
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
