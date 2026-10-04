/**
 * Мяу и Олли «живые» (решение владельца 02.10.2026): одна картинка на позу
 * (у ходьбы — две), движение — кодом. Сами по комнате не ходят; тап — 2–3 шага и машут.
 */

export const CHAR_POSES = ['plush', 'blink', 'walk1', 'walk2', 'joy', 'hang', 'ride', 'fly', 'float', 'sleep', 'wave', 'jetpack'] as const
export type CharPose = (typeof CHAR_POSES)[number]

/** Что происходит с героем сейчас (скорость — кубиков/с, y вниз; время — секунды). */
export type CharState = {
  vx: number
  vy: number
  /** Держат пальцем. */
  held: boolean
  /** Привязан к шарику. */
  tied: boolean
  /** Пассажир ракеты: надел её как рюкзак. */
  onRocket: boolean
  /** Сидит в дуле пушки, голова наружу. */
  inCannon: boolean
  /** Опускается на парашюте. */
  chute: boolean
  /** «Гравитация» выключена. */
  zeroG: boolean
  /** Сколько секунд комнату никто не трогал. */
  idleS: number
  /** Сколько секунд назад по герою тапнули (null — давно). */
  sinceGreet: number | null
  /** Сколько секунд назад он прокатился на механизме (null — давно). */
  sinceRide: number | null
  now: number
}

const STEP_S = 0.25
const STEPS_S = 0.75
const WAVE_UNTIL_S = 1.8
const RIDE_POSE_S = 1.6
const FLY_SPEED = 5
const SLEEP_AFTER_S = 25
const BLINK_EVERY_S = 3.3
const BLINK_S = 0.16

export function charPose(s: CharState): CharPose {
  if (s.held || s.tied || s.chute) return 'hang'
  if (s.onRocket) return 'jetpack'
  if (s.inCannon) return 'joy'
  if (s.sinceGreet !== null && s.sinceGreet < WAVE_UNTIL_S) {
    if (s.sinceGreet < STEPS_S) return Math.floor(s.sinceGreet / STEP_S) % 2 === 0 ? 'walk1' : 'walk2'
    return 'wave'
  }
  if (s.zeroG) return 'float'
  const speed = Math.hypot(s.vx, s.vy)
  if (s.sinceRide !== null && s.sinceRide < RIDE_POSE_S) return s.vy < -2 ? 'joy' : 'ride'
  if (speed > FLY_SPEED) return 'fly'
  if (s.idleS > SLEEP_AFTER_S) return 'sleep'
  return s.now % BLINK_EVERY_S < BLINK_S ? 'blink' : 'plush'
}

/** Шаги после тапа: картинка чуть переступает вбок (кубиков), потом стоит на месте. */
export function greetOffset(sinceGreet: number): number {
  if (sinceGreet >= STEPS_S) return 0
  return Math.sin((sinceGreet / STEPS_S) * Math.PI) * 0.35
}
