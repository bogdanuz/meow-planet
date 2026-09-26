export type Pendulum = { angle: number; vel: number }

const SPRING = 22
const DAMP = 1.85
const REST_ANGLE = 0.012
const REST_VEL = 0.04
const RING_ANGLE = 0.05

export function stepPendulum(p: Pendulum, dt: number): Pendulum {
  const acc = -SPRING * p.angle - DAMP * p.vel
  const vel = p.vel + acc * dt
  const angle = p.angle + vel * dt
  return { angle, vel }
}

export function pendulumAtRest(p: Pendulum): boolean {
  return Math.abs(p.angle) < REST_ANGLE && Math.abs(p.vel) < REST_VEL
}

export function pendulumShouldRing(prevVel: number, next: Pendulum): boolean {
  if (prevVel * next.vel > 0) return false
  return Math.abs(next.angle) > RING_ANGLE
}

export function pendulumImpulse(p: Pendulum, kick = 5.2): Pendulum {
  const dir = p.vel >= 0 ? 1 : -1
  return { angle: p.angle, vel: p.vel + dir * kick }
}
