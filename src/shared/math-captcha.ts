import { randomInt, shuffleCopy, createSeededRandom, type Rng } from './random'

export type CaptchaChallenge = {
  prompt: string
  answer: number
  options: readonly number[]
}

export function createMathCaptcha(rng: Rng = Math.random): CaptchaChallenge {
  const a = randomInt(1, 9, rng)
  const b = randomInt(1, 9, rng)
  const answer = a + b

  const distractors = new Set<number>()
  let guard = 0
  while (distractors.size < 2 && guard < 40) {
    guard += 1
    const wrong = randomInt(2, 18, rng)
    if (wrong !== answer) distractors.add(wrong)
  }
  while (distractors.size < 2) {
    distractors.add(answer === 10 ? 11 + distractors.size : 10 + distractors.size)
  }

  const options = shuffleCopy([answer, ...distractors], rng)
  return {
    prompt: `${a} + ${b} = ?`,
    answer,
    options,
  }
}

export function createMathCaptchaFromSeed(seed: number): CaptchaChallenge {
  return createMathCaptcha(createSeededRandom(seed))
}
