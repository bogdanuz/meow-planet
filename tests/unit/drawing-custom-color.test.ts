import { describe, expect, it } from 'vitest'
import {
  CUSTOM_COLOR_KEY,
  customColorPosition,
  hslToHex,
  loadCustomColor,
  pickerColorAt,
  saveCustomColor,
} from '../../src/games/drawing/custom-color'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    data,
  }
}

describe('свой цвет', () => {
  it('переводит HSL в #rrggbb', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000')
    expect(hslToHex(120, 100, 50)).toBe('#00ff00')
    expect(hslToHex(240, 100, 50)).toBe('#0000ff')
    expect(hslToHex(0, 0, 100)).toBe('#ffffff')
  })

  it('радужное окошко: по горизонтали оттенок, по вертикали светлота', () => {
    const left = pickerColorAt(0, 0.5)
    const right = pickerColorAt(0.99, 0.5)
    expect(left).toMatch(/^#[0-9a-f]{6}$/)
    expect(left).not.toBe(pickerColorAt(0.33, 0.5))
    expect(lightness(pickerColorAt(0.5, 0))).toBeGreaterThan(lightness(pickerColorAt(0.5, 1)))
    expect(right).toMatch(/^#[0-9a-f]{6}$/)
    expect(pickerColorAt(-1, 2)).toBe(pickerColorAt(0, 1))
  })

  it('позиция маркера возвращает тот же цвет', () => {
    const hex = pickerColorAt(0.42, 0.3)
    const position = customColorPosition(hex)
    expect(pickerColorAt(position.x, position.y)).toBe(hex)
  })

  it('запоминает последний свой цвет и не верит мусору в хранилище', () => {
    const storage = memoryStorage()
    expect(loadCustomColor(storage)).toBeNull()
    saveCustomColor('#12AB9F', storage)
    expect(storage.data.get(CUSTOM_COLOR_KEY)).toBe('#12ab9f')
    expect(loadCustomColor(storage)).toBe('#12ab9f')
    expect(loadCustomColor(memoryStorage({ [CUSTOM_COLOR_KEY]: 'javascript:alert(1)' }))).toBeNull()
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadCustomColor(broken)).toBeNull()
    expect(() => saveCustomColor('#000000', broken)).not.toThrow()
  })
})

function lightness(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16)
  return ((value >> 16) & 255) + ((value >> 8) & 255) + (value & 255)
}
