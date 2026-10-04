import { describe, expect, it } from 'vitest'
import { fullScreenHeight } from '../../src/app/full-height'

const ipad = { screenWidth: 820, screenHeight: 1180 }

describe('высота корня на iPad «на экране Домой»', () => {
  it('окно на весь экран короче на строку состояния — растягиваем до экрана', () => {
    expect(fullScreenHeight({ ...ipad, innerWidth: 1180, innerHeight: 788, standalone: true })).toBe(820)
  })

  it('в портрете тоже', () => {
    expect(fullScreenHeight({ ...ipad, innerWidth: 820, innerHeight: 1156, standalone: true })).toBe(1180)
  })

  it('высота и так полная — ничего не меняем', () => {
    expect(fullScreenHeight({ ...ipad, innerWidth: 1180, innerHeight: 820, standalone: true })).toBeNull()
  })

  it('в Safari (не на экране Домой) не трогаем', () => {
    expect(fullScreenHeight({ ...ipad, innerWidth: 1180, innerHeight: 740, standalone: false })).toBeNull()
  })

  it('окно не на всю ширину (разделённый экран) — не трогаем', () => {
    expect(fullScreenHeight({ ...ipad, innerWidth: 700, innerHeight: 788, standalone: true })).toBeNull()
  })

  it('большая разница — это клавиатура, не строка состояния', () => {
    expect(fullScreenHeight({ ...ipad, innerWidth: 1180, innerHeight: 500, standalone: true })).toBeNull()
  })
})
