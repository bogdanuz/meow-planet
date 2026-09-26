import { describe, expect, it } from 'vitest'
import {
  createMathCaptcha,
  createMathCaptchaFromSeed,
} from '../../src/shared/math-captcha'

describe('math captcha (пазл)', () => {
  it('даёт 3 варианта и один верный ответ', () => {
    for (let i = 0; i < 20; i += 1) {
      const challenge = createMathCaptchaFromSeed(i + 1)
      expect(challenge.options).toHaveLength(3)
      expect(challenge.options).toContain(challenge.answer)
      expect(new Set(challenge.options).size).toBe(3)
      expect(challenge.prompt).toMatch(/^\d+ \+ \d+ = \?$/)
      const [a, b] = challenge.prompt.split(' + ').map((part) =>
        Number.parseInt(part, 10),
      )
      expect(a! + b!).toBe(challenge.answer)
    }
  })

  it('каждый вызов может дать новый пример', () => {
    const samples = new Set(
      Array.from({ length: 30 }, () => createMathCaptcha().prompt),
    )
    expect(samples.size).toBeGreaterThan(1)
  })
})
