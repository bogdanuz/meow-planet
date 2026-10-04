import { describe, expect, it } from 'vitest'
import { SandboxWorld, type GoalEvent, type ImpactEvent } from '../../src/games/shape-build/physics'

const W = 16
const FLOOR = 10
const CEIL = 0.5

function makeWorld(over: Partial<ConstructorParameters<typeof SandboxWorld>[0]> = {}): SandboxWorld {
  return new SandboxWorld({
    width: W,
    height: 11,
    floorY: FLOOR,
    ceilingY: CEIL,
    realistic: false,
    autoStraight: true,
    sticky: false,
    random: () => 0.5,
    ...over,
  })
}

function run(world: SandboxWorld, seconds: number): void {
  const frames = Math.round(seconds * 60)
  for (let i = 0; i < frames; i += 1) world.step(1 / 60)
}

function view(world: SandboxWorld, id: number) {
  const piece = world.pieces().find((p) => p.id === id)
  if (!piece) throw new Error(`no piece ${id}`)
  return piece
}

/** Ребёнок взял деталь, поднёс к точке и аккуратно отпустил. */
function placeByHand(world: SandboxWorld, id: number, x: number, y: number): void {
  const p = view(world, id)
  world.grab([id], p.x, p.y)
  const high = Math.min(p.y, y) - 1.5
  for (const [tx, ty] of [[p.x, high], [x, high], [x, y]] as const) {
    for (let i = 0; i < 40; i += 1) {
      world.moveGrab(tx, ty)
      world.step(1 / 60)
    }
  }
  world.releaseGrab()
}

describe('SandboxWorld: гравитация и пол', () => {
  it('кубик падает и лежит на полу', () => {
    const world = makeWorld()
    const id = world.add('cube', 5, 2)
    run(world, 3)
    expect(view(world, id).y).toBeCloseTo(FLOOR - 0.6, 1)
  })

  it('ровная башня из 5 кубиков стоит', () => {
    const world = makeWorld()
    const ids = [0, 1, 2, 3, 4].map((i) => world.add('cube', 6, FLOOR - 0.6 - i * 1.2))
    run(world, 5)
    for (const id of ids) expect(Math.abs(view(world, id).x - 6)).toBeLessThan(0.08)
    expect(view(world, ids[4]!).y).toBeCloseTo(FLOOR - 0.6 - 4 * 1.2, 0)
  })

  it('криво поставил — верхний падает', () => {
    const world = makeWorld()
    world.add('cube', 6, FLOOR - 0.6)
    const top = world.add('cube', 6.95, FLOOR - 1.8)
    run(world, 3)
    expect(view(world, top).y).toBeGreaterThan(FLOOR - 1.0)
  })

  it('из-за стен ничего не уезжает за экран', () => {
    const world = makeWorld()
    const id = world.add('ball', 1, 3)
    run(world, 0.1)
    world.nudge(id, { x: -80, y: 0 })
    run(world, 2)
    const p = view(world, id)
    expect(p.x).toBeGreaterThan(0)
    expect(p.x).toBeLessThan(W)
  })

  it('мячик по горке скатывается вниз', () => {
    const world = makeWorld()
    world.add('ramp', 5, FLOOR - 0.6)
    const ball = world.add('ball', 3.7, FLOOR - 2)
    run(world, 2)
    expect(view(world, ball).x).toBeGreaterThan(6.8)
  })
})

describe('SandboxWorld: стартовая сцена', () => {
  function starter() {
    const world = makeWorld()
    const ramp = world.add('ramp', 3.4, FLOOR - 0.6)
    const ball = world.add('ball', 2.49, FLOOR - 1.6, { parked: true })
    const tower = [0, 1, 2].map((i) => world.add('cube', 8.2, FLOOR - 0.6 - i * 1.2, { loose: true }))
    return { world, ramp, ball, tower }
  }

  it('мяч ждёт наверху горки, башенка стоит', () => {
    const { world, ball, tower } = starter()
    run(world, 2)
    expect(world.isParked(ball)).toBe(true)
    expect(view(world, ball).x).toBeCloseTo(2.49, 2)
    expect(view(world, tower[2]!).y).toBeCloseTo(FLOOR - 3, 1)
  })

  it('толкнули мяч — катится и роняет башенку', () => {
    const { world, ball, tower } = starter()
    run(world, 0.5)
    world.push(ball)
    expect(world.isParked(ball)).toBe(false)
    run(world, 4)
    expect(view(world, tower[2]!).y).toBeGreaterThan(FLOOR - 2.4)
  })

  it('взяли мяч рукой — он больше не ждёт', () => {
    const { world, ball } = starter()
    world.grab([ball], 2.49, FLOOR - 1.6)
    expect(world.isParked(ball)).toBe(false)
  })

  it('убрали горку — мяч падает', () => {
    const { world, ramp, ball } = starter()
    run(world, 0.3)
    world.remove(ramp)
    run(world, 1.5)
    expect(view(world, ball).y).toBeCloseTo(FLOOR - 0.55, 1)
  })

  it('шаткий кубик становится обычным, когда его взяли рукой', () => {
    const { world, tower } = starter()
    expect(world.isLoose(tower[0]!)).toBe(true)
    placeByHand(world, tower[2]!, 12, FLOOR - 0.6)
    expect(world.isLoose(tower[2]!)).toBe(false)
    expect(world.isLoose(tower[0]!)).toBe(true)
  })

  it('упавшие шаткие кубики успокоились — снова обычные', () => {
    const { world, ball, tower } = starter()
    run(world, 0.5)
    world.push(ball)
    run(world, 6)
    expect(tower.some((id) => world.isLoose(id))).toBe(false)
  })
})

describe('SandboxWorld: правая стенка едет со шкафом', () => {
  it('открыли шкаф — детали мягко отъезжают от него', () => {
    const world = makeWorld()
    const id = world.add('cube', 14.5, FLOOR - 0.6)
    run(world, 0.5)
    world.setRightWall(11)
    run(world, 2)
    expect(view(world, id).x).toBeLessThan(11)
    expect(world.rightWall()).toBeCloseTo(11, 1)
  })

  it('закрыли — место снова есть, мячик докатывается до края', () => {
    const world = makeWorld({ rightX: 11 })
    world.setRightWall(W)
    run(world, 1)
    const ball = world.add('ball', 10, FLOOR - 0.6)
    world.nudge(ball, { x: 20, y: 0 })
    run(world, 1)
    expect(view(world, ball).x).toBeGreaterThan(11.5)
  })

  it('левая стенка тоже может стоять правее края', () => {
    const world = makeWorld({ leftX: 4 })
    const id = world.add('ball', 6, 3)
    run(world, 0.1)
    world.nudge(id, { x: -80, y: 0 })
    let minX = Infinity
    for (let i = 0; i < 120; i += 1) {
      world.step(1 / 60)
      minX = Math.min(minX, view(world, id).x)
    }
    expect(minX).toBeGreaterThan(4)
  })

  it('стенку можно переставить сразу — пример из «Как играть» встаёт целиком', () => {
    const world = makeWorld({ rightX: 10 })
    world.setRightWall(16, true)
    expect(world.rightWall()).toBeCloseTo(16)
  })
})

describe('SandboxWorld: вес и предметы', () => {
  it('камень на конце доски поднимает другой конец (качели)', () => {
    const world = makeWorld()
    world.add('triangle', 8, FLOOR - 0.6)
    const plank = world.add('plank', 8, FLOOR - 1.45)
    run(world, 0.5)
    world.add('stone', 6.0, FLOOR - 3)
    run(world, 2)
    expect(Math.abs(view(world, plank).angle)).toBeGreaterThan(0.15)
  })

  it('батут подбрасывает кубик', () => {
    const world = makeWorld()
    world.add('spring', 5, FLOOR - 0.4)
    const cube = world.add('cube', 5, FLOOR - 3)
    let minY = Infinity
    let landed = false
    for (let i = 0; i < 240; i += 1) {
      world.step(1 / 60)
      const y = view(world, cube).y
      if (y > FLOOR - 1.5) landed = true
      if (landed) minY = Math.min(minY, y)
    }
    expect(landed).toBe(true)
    expect(minY).toBeLessThan(FLOOR - 3)
  })
})

describe('SandboxWorld: шарик на верёвочке', () => {
  it('один улетает к потолку', () => {
    const world = makeWorld()
    const b = world.add('balloon', 5, 8)
    run(world, 3)
    expect(view(world, b).y).toBeLessThan(3)
    expect(world.ties()).toHaveLength(0)
  })

  it('коснулся кубика — сам привязался и поднимает его', () => {
    const world = makeWorld()
    const cube = world.add('cube', 5, FLOOR - 0.6)
    run(world, 0.3)
    world.add('balloon', 5, FLOOR - 1.75)
    run(world, 4)
    expect(world.ties()).toHaveLength(1)
    expect(view(world, cube).y).toBeLessThan(FLOOR - 2)
  })

  it('камень тяжёлый — шарик привязался, но не поднял', () => {
    const world = makeWorld()
    const stone = world.add('stone', 5, FLOOR - 0.5)
    run(world, 0.3)
    world.add('balloon', 5, FLOOR - 1.5)
    run(world, 3)
    expect(world.ties()).toHaveLength(1)
    expect(view(world, stone).y).toBeGreaterThan(FLOOR - 1)
  })

  it('лопнул — верёвочки нет, кубик падает', () => {
    const world = makeWorld()
    const cube = world.add('cube', 5, FLOOR - 0.6)
    run(world, 0.3)
    const balloon = world.add('balloon', 5, FLOOR - 1.75)
    run(world, 3)
    expect(world.pop(balloon)).toBe(true)
    expect(world.has(balloon)).toBe(false)
    expect(world.ties()).toHaveLength(0)
    run(world, 3)
    expect(view(world, cube).y).toBeCloseTo(FLOOR - 0.6, 1)
    expect(world.pop(cube)).toBe(false)
  })
})

describe('SandboxWorld: шар-таран', () => {
  it('висит на верёвке с потолка', () => {
    const world = makeWorld()
    const id = world.add('wrecking', 8, 6)
    run(world, 3)
    const [rope] = world.ropes()
    expect(rope).toBeDefined()
    expect(rope!.ax).toBeCloseTo(8, 1)
    expect(rope!.ay).toBeCloseTo(CEIL, 1)
    const p = view(world, id)
    expect(Math.abs(p.x - 8)).toBeLessThan(0.2)
    expect(p.y).toBeLessThan(FLOOR - 1)
  })

  it('верёвка привязана к петле сверху шара, а не к центру: петля смотрит вверх', () => {
    const world = makeWorld()
    const id = world.add('wrecking', 8, 6, { angle: 2.5 })
    run(world, 4)
    const [rope] = world.ropes()
    const p = view(world, id)
    expect(rope!.by).toBeLessThan(p.y - 0.6)
    expect(Math.abs(rope!.bx - p.x)).toBeLessThan(0.15)
    expect(Math.abs(Math.sin(p.angle))).toBeLessThan(0.2)
    expect(Math.cos(p.angle)).toBeGreaterThan(0)
  })

  it('оттянул и отпустил — качается и сбивает башню', () => {
    const world = makeWorld()
    const tower = [0, 1, 2].map((i) => world.add('cube', 10, FLOOR - 0.6 - i * 1.2))
    const ball = world.add('wrecking', 8, FLOOR - 2.4)
    run(world, 1)
    world.grab([ball], view(world, ball).x, view(world, ball).y)
    for (let i = 0; i < 60; i += 1) {
      world.moveGrab(4, 4)
      world.step(1 / 60)
    }
    world.releaseGrab()
    run(world, 3)
    const top = view(world, tower[2]!)
    expect(Math.abs(top.x - 10) > 0.6 || top.y > FLOOR - 2).toBe(true)
  })

  it('тащишь далеко вбок — крючок едет по потолку следом', () => {
    const world = makeWorld()
    const ball = world.add('wrecking', 4, 5)
    run(world, 1)
    world.grab([ball], view(world, ball).x, view(world, ball).y)
    for (let i = 0; i < 90; i += 1) {
      world.moveGrab(13, 5)
      world.step(1 / 60)
    }
    world.releaseGrab()
    expect(world.ropes()[0]!.ax).toBeGreaterThan(8)
  })
})

describe('SandboxWorld: кольцо', () => {
  it('висит, где поставили, и переезжает за пальцем', () => {
    const world = makeWorld()
    const hoop = world.add('hoop', 8, 4)
    run(world, 2)
    expect(view(world, hoop).y).toBeCloseTo(4, 3)
    world.grab([hoop], 8, 4)
    world.moveGrab(10, 5)
    world.step(1 / 60)
    world.releaseGrab()
    run(world, 1)
    expect(view(world, hoop).x).toBeCloseTo(10, 1)
    expect(view(world, hoop).y).toBeCloseTo(5, 1)
  })

  it('мячик сверху в кольцо — событие «ура!»', () => {
    const world = makeWorld()
    const goals: GoalEvent[] = []
    world.onGoal((e) => goals.push(e))
    const hoop = world.add('hoop', 8, 5)
    world.add('ball', 8.05, 2)
    run(world, 2)
    expect(goals).toHaveLength(1)
    expect(goals[0]!.hoopId).toBe(hoop)
  })

  it('мячик рядом с кольцом мягко затягивает внутрь', () => {
    const world = makeWorld()
    const goals: GoalEvent[] = []
    world.onGoal((e) => goals.push(e))
    world.add('hoop', 8, 5.5)
    world.add('ball', 9.6, 3)
    run(world, 2)
    expect(goals).toHaveLength(1)
  })

  it('«ура!» не только за мячик — за кубик тоже', () => {
    const world = makeWorld()
    const goals: GoalEvent[] = []
    world.onGoal((e) => goals.push(e))
    world.add('hoop', 8, 5.5)
    world.add('cube', 8.1, 3)
    run(world, 2)
    expect(goals).toHaveLength(1)
  })

  it('мимо кольца — события нет', () => {
    const world = makeWorld()
    const goals: GoalEvent[] = []
    world.onGoal((e) => goals.push(e))
    world.add('hoop', 8, 5)
    world.add('ball', 3, 2)
    run(world, 2)
    expect(goals).toHaveLength(0)
  })
})

describe('SandboxWorld: вентилятор', () => {
  it('дует: мячик укатывается, камень стоит', () => {
    const world = makeWorld()
    world.add('fan', 3, FLOOR - 0.75)
    const stone = world.add('stone', 4.4, FLOOR - 0.5)
    const ball = world.add('ball', 6.5, FLOOR - 0.55)
    run(world, 1)
    expect(view(world, ball).x).toBeGreaterThan(8)
    expect(Math.abs(view(world, stone).x - 4.4)).toBeLessThan(0.3)
  })

  it('повёрнутый вверх — дует снизу, кубик падает медленнее', () => {
    const world = makeWorld()
    const fan = world.add('fan', 8, FLOOR - 0.75)
    world.turn(fan)
    world.turn(fan)
    world.turn(fan)
    const cube = world.add('cube', 8, FLOOR - 3)
    run(world, 0.4)
    const still = makeWorld()
    const cube2 = still.add('cube', 8, FLOOR - 3)
    run(still, 0.4)
    expect(view(world, cube).y).toBeLessThan(view(still, cube2).y)
  })

  it('тап — выключился, мячик не катится', () => {
    const world = makeWorld()
    const fan = world.add('fan', 3, FLOOR - 0.75)
    expect(world.isOn(fan)).toBe(true)
    expect(world.togglePower(fan)).toBe(false)
    const ball = world.add('ball', 5, FLOOR - 0.55)
    run(world, 1)
    expect(Math.abs(view(world, ball).x - 5)).toBeLessThan(0.2)
    expect(world.togglePower(ball)).toBeNull()
  })
})

describe('SandboxWorld: липучка', () => {
  function stackByHand(world: SandboxWorld): { a: number; b: number } {
    const a = world.add('cube', 5, FLOOR - 0.6)
    const b = world.add('cube', 9, FLOOR - 0.6)
    run(world, 0.5)
    placeByHand(world, b, 5, FLOOR - 1.85)
    run(world, 1.5)
    return { a, b }
  }

  it('рукой поставил кубик на кубик — прилип, «чмок»; толкнули нижний — верхний едет вместе', () => {
    const world = makeWorld({ sticky: true })
    const sticks: { x: number; y: number }[] = []
    world.onStick((e) => sticks.push(e))
    const { a, b } = stackByHand(world)
    expect(world.stickCount()).toBe(1)
    expect(sticks).toHaveLength(1)
    expect(sticks[0]!.y).toBeCloseTo(FLOOR - 1.2, 0)
    world.nudge(a, { x: 6, y: 0 })
    run(world, 0.5)
    expect(Math.abs(view(world, b).x - view(world, a).x)).toBeLessThan(0.1)
  })

  it('упавшее из шкафа не липнет', () => {
    const world = makeWorld({ sticky: true })
    world.add('cube', 5, FLOOR - 0.6)
    world.add('cube', 5, FLOOR - 1.8)
    run(world, 1.5)
    expect(world.stickCount()).toBe(0)
  })

  it('брошенное не липнет', () => {
    const world = makeWorld({ sticky: true })
    world.add('cube', 5, FLOOR - 0.6)
    const b = world.add('cube', 9, FLOOR - 0.6)
    run(world, 0.5)
    world.grab([b], 9, FLOOR - 0.6)
    for (let i = 0; i < 40; i += 1) {
      world.moveGrab(6.5, FLOOR - 3)
      world.step(1 / 60)
    }
    world.releaseGrab({ x: -4, y: 2 })
    run(world, 2)
    expect(world.stickCount()).toBe(0)
  })

  it('криво поставленное не липнет', () => {
    const world = makeWorld({ sticky: true, autoStraight: false })
    world.add('brick', 5, FLOOR - 0.6)
    const b = world.add('cube', 10, FLOOR - 3, { angle: 0.45 })
    world.setFrozen(true)
    run(world, 0.1)
    world.setFrozen(false)
    world.grab([b], 10, FLOOR - 3)
    for (let i = 0; i < 40; i += 1) {
      world.moveGrab(4.8, FLOOR - 2.05)
      world.step(1 / 60)
    }
    world.releaseGrab()
    run(world, 1.5)
    expect(world.stickCount()).toBe(0)
  })

  it('мячик и шарик не прилипают', () => {
    const world = makeWorld({ sticky: true })
    world.add('cube', 5, FLOOR - 0.6)
    const ball = world.add('ball', 9, FLOOR - 0.55)
    run(world, 0.5)
    placeByHand(world, ball, 5, FLOOR - 1.8)
    run(world, 1.5)
    expect(world.stickCount()).toBe(0)
  })

  it('без липучки ничего не клеится', () => {
    const world = makeWorld()
    stackByHand(world)
    expect(world.stickCount()).toBe(0)
  })

  it('в невесомости ничего не липнет', () => {
    const world = makeWorld({ sticky: true })
    world.setGravityOff(true)
    const a = world.add('cube', 5, 5)
    const b = world.add('cube', 9, 5)
    run(world, 0.3)
    placeByHand(world, b, view(world, a).x + 1.25, view(world, a).y)
    run(world, 1.5)
    expect(world.stickCount()).toBe(0)
  })

  it('«Гравитация» расклеивает всё', () => {
    const world = makeWorld({ sticky: true })
    stackByHand(world)
    expect(world.stickCount()).toBe(1)
    world.setGravityOff(true)
    expect(world.stickCount()).toBe(0)
  })

  it('«Бум!» отрывает и подбрасывает', () => {
    const world = makeWorld({ sticky: true })
    const { a } = stackByHand(world)
    expect(world.stickCount()).toBe(1)
    world.shake()
    expect(world.stickCount()).toBe(0)
    let minY = Infinity
    for (let i = 0; i < 30; i += 1) {
      world.step(1 / 60)
      minY = Math.min(minY, view(world, a).y)
    }
    expect(minY).toBeLessThan(FLOOR - 1)
  })
})

describe('SandboxWorld: рука, бросок, «Замри!», гравитация', () => {
  it('деталь едет за пальцем и в руке встаёт ровно', () => {
    const world = makeWorld()
    const id = world.add('brick', 5, FLOOR - 0.6, { angle: 0.5 })
    run(world, 0.2)
    world.grab([id], 5, FLOOR - 0.6)
    for (let i = 0; i < 90; i += 1) {
      world.moveGrab(9, 5)
      world.step(1 / 60)
    }
    const p = view(world, id)
    expect(Math.hypot(p.x - 9, p.y - 5)).toBeLessThan(0.6)
    expect(Math.abs(p.angle % (Math.PI / 2))).toBeLessThan(0.08)
    world.releaseGrab()
    expect(world.isGrabbing()).toBe(false)
  })

  it('каждый палец тащит свою деталь', () => {
    const world = makeWorld()
    const a = world.add('cube', 4, FLOOR - 0.6)
    const b = world.add('cube', 10, FLOOR - 0.6)
    run(world, 0.2)
    expect(world.grab([a], 4, FLOOR - 0.6, 1)).toBe(true)
    expect(world.grab([b], 10, FLOOR - 0.6, 2)).toBe(true)
    for (let i = 0; i < 90; i += 1) {
      world.moveGrab(2, 4, 1)
      world.moveGrab(13, 5, 2)
      world.step(1 / 60)
    }
    expect(Math.hypot(view(world, a).x - 2, view(world, a).y - 4)).toBeLessThan(0.6)
    expect(Math.hypot(view(world, b).x - 13, view(world, b).y - 5)).toBeLessThan(0.6)
    expect(world.releaseGrab(undefined, 1)).toEqual([a])
    expect(world.isGrabbing()).toBe(true)
    expect(world.grabbedIds(2)).toEqual([b])
    world.releaseGrab(undefined, 2)
    expect(world.isGrabbing()).toBe(false)
  })

  it('деталь в одной руке другая рука не перехватывает', () => {
    const world = makeWorld()
    const a = world.add('cube', 4, FLOOR - 0.6)
    run(world, 0.2)
    expect(world.grab([a], 4, FLOOR - 0.6, 1)).toBe(true)
    expect(world.grab([a], 4, FLOOR - 0.6, 2)).toBe(false)
    expect(world.grabbedIds(2)).toEqual([])
  })

  it('смахнул — деталь полетела со скоростью пальца', () => {
    const world = makeWorld()
    const id = world.add('ball', 4, FLOOR - 0.55)
    run(world, 0.2)
    world.grab([id], 4, FLOOR - 0.55)
    world.moveGrab(4, 6)
    run(world, 0.5)
    world.releaseGrab({ x: 14, y: -6 })
    run(world, 0.3)
    expect(view(world, id).x).toBeGreaterThan(6)
  })

  it('«Замри!»: всё висит в воздухе; выключил — падает', () => {
    const world = makeWorld()
    const id = world.add('cube', 5, 4)
    world.setFrozen(true)
    run(world, 1)
    expect(view(world, id).y).toBeLessThan(4.2)
    world.setFrozen(false)
    run(world, 2)
    expect(view(world, id).y).toBeCloseTo(FLOOR - 0.6, 1)
  })

  it('«Замри!» выравнивает наклонённые детали', () => {
    const world = makeWorld()
    const id = world.add('brick', 5, 4, { angle: 0.4 })
    world.setFrozen(true)
    run(world, 0.5)
    expect(Math.abs(view(world, id).angle)).toBeLessThan(0.05)
  })

  it('гравитация выключена — детали плавают и не падают на пол', () => {
    const world = makeWorld()
    const id = world.add('cube', 5, 4)
    world.setGravityOff(true)
    expect(world.isGravityOff()).toBe(true)
    run(world, 2)
    expect(view(world, id).y).toBeLessThan(FLOOR - 2)
    world.setGravityOff(false)
    run(world, 3)
    expect(view(world, id).y).toBeCloseTo(FLOOR - 0.6, 1)
  })
})

describe('SandboxWorld: кнопки у детали', () => {
  it('«Повернуть» — на 90°', () => {
    const world = makeWorld()
    const id = world.add('plank', 8, FLOOR - 0.3)
    run(world, 0.2)
    expect(world.turn(id)).toBe(true)
    expect(Math.abs(view(world, id).angle)).toBeCloseTo(Math.PI / 2, 1)
  })

  it('горку и кольцо — зеркально; мячик не поворачивается', () => {
    const world = makeWorld()
    const ramp = world.add('ramp', 6, FLOOR - 0.6)
    expect(view(world, ramp).flip).toBe(false)
    expect(world.turn(ramp)).toBe(true)
    expect(view(world, ramp).flip).toBe(true)
    expect(view(world, ramp).angle).toBeCloseTo(0, 3)
    const ball = world.add('ball', 10, FLOOR - 0.55)
    expect(world.turn(ball)).toBe(false)
  })

  it('«Больше / Меньше» меняет размер и вес', () => {
    const world = makeWorld()
    const id = world.add('cube', 6, FLOOR - 0.6)
    run(world, 0.5)
    expect(world.setSize(id, 2)).toBe(true)
    run(world, 1)
    expect(view(world, id).size).toBe(2)
    expect(view(world, id).y).toBeCloseTo(FLOOR - 1.2, 1)
    expect(world.setSize(id, 0.6)).toBe(true)
    run(world, 1)
    expect(view(world, id).y).toBeCloseTo(FLOOR - 0.36, 1)
  })
})

describe('SandboxWorld: поиск, удаление, «Отменить»', () => {
  it('pieceAt находит деталь под пальцем, верхнюю', () => {
    const world = makeWorld()
    const a = world.add('cube', 5, FLOOR - 0.6)
    expect(world.pieceAt(5, FLOOR - 0.6)).toBe(a)
    expect(world.pieceAt(12, 3)).toBeNull()
  })

  it('тонкую доску можно взять чуть мимо', () => {
    const world = makeWorld()
    const plank = world.add('plank', 8, FLOOR - 0.21)
    run(world, 0.2)
    expect(world.pieceAt(8, FLOOR - 0.6)).toBe(plank)
  })

  it('topAt — верх постройки в полосе', () => {
    const world = makeWorld()
    world.add('cube', 5, FLOOR - 0.6)
    world.add('cube', 5, FLOOR - 1.8)
    run(world, 1)
    expect(world.topAt(4.5, 5.5)).toBeCloseTo(FLOOR - 2.4, 1)
    expect(world.topAt(9, 10)).toBeNull()
  })

  it('clear убирает всё; kinds для лимита', () => {
    const world = makeWorld()
    world.add('cube', 3, 5)
    world.add('spring', 6, 5)
    world.add('cart', 10, 5)
    expect(world.kinds().sort()).toEqual(['cart', 'cube', 'spring'])
    world.clear()
    expect(world.count()).toBe(0)
    expect(world.ropes()).toHaveLength(0)
  })

  it('снимок и «Отменить»: детали, размер, верёвки, липучка — как были', () => {
    const world = makeWorld({ sticky: true })
    world.add('cube', 5, FLOOR - 0.6)
    const top = world.add('cube', 3, FLOOR - 0.6)
    const big = world.add('brick', 10, FLOOR - 1)
    world.setSize(big, 1.5)
    world.add('wrecking', 13, 5)
    run(world, 0.5)
    placeByHand(world, top, 5, FLOOR - 1.85)
    run(world, 1.5)
    const snap = world.snapshot()
    const before = world.pieces().map((p) => ({ kind: p.kind, x: p.x, y: p.y, size: p.size }))
    world.clear()
    expect(world.count()).toBe(0)
    world.restore(snap)
    const after = world.pieces().map((p) => ({ kind: p.kind, x: p.x, y: p.y, size: p.size }))
    expect(after).toHaveLength(before.length)
    after.forEach((p, i) => {
      expect(p.kind).toBe(before[i]!.kind)
      expect(p.size).toBe(before[i]!.size)
      expect(p.x).toBeCloseTo(before[i]!.x, 3)
      expect(p.y).toBeCloseTo(before[i]!.y, 3)
    })
    expect(world.stickCount()).toBe(1)
    expect(world.ropes()).toHaveLength(1)
  })

  it('«Отменить» до самого начала: мяч снова ждёт на горке, башенка снова шаткая', () => {
    const world = makeWorld()
    world.add('ramp', 3.4, FLOOR - 0.6)
    world.add('ball', 2.49, FLOOR - 1.6, { parked: true })
    world.add('cube', 8.2, FLOOR - 0.6, { loose: true })
    const snap = world.snapshot()
    world.clear()
    world.restore(snap)
    const ball = world.pieces().find((p) => p.kind === 'ball')!
    expect(world.isParked(ball.id)).toBe(true)
    run(world, 1)
    expect(world.pieces().find((p) => p.kind === 'ball')!.x).toBeCloseTo(2.49, 2)
    expect(world.snapshot().pieces.find((p) => p.kind === 'cube')!.loose).toBe(true)
  })

  it('удар о пол — событие для звука с материалом', () => {
    const world = makeWorld()
    const events: ImpactEvent[] = []
    world.onImpact((e) => events.push(e))
    world.add('stone', 5, 3)
    run(world, 2)
    expect(events.some((e) => e.material === 'stone' && e.strength > 0)).toBe(true)
  })

  it('у тележки колёса в снимке для рисования', () => {
    const world = makeWorld()
    const cart = world.add('cart', 6, FLOOR - 1)
    run(world, 1)
    expect(view(world, cart).wheels).toHaveLength(2)
  })

  it('цвет в шкафу — цвет следующей детали этого вида', () => {
    const world = makeWorld()
    const next = world.nextColor('cube')
    const id = world.add('cube', 5, 5)
    expect(view(world, id).color).toBe(next)
    expect(world.nextColor('cube')).not.toBe(next)
    expect(world.nextColor('brick')).not.toBe(world.nextColor('cube'))
    const stone = world.nextColor('stone')
    world.add('stone', 9, 5)
    expect(world.nextColor('stone')).toBe(stone)
  })

  it('мягкая физика и «как в жизни» переключаются на лету', () => {
    const world = makeWorld()
    world.add('cube', 5, 5)
    world.setRealistic(true)
    run(world, 0.5)
    world.setRealistic(false)
    run(world, 0.5)
    expect(world.count()).toBe(1)
  })
})
