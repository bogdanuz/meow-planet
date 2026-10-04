import { describe, expect, it } from 'vitest'
import { SandboxWorld } from '../../src/games/shape-build/physics'
import { MUZZLE_BORE, getPieceSpec, isPowered } from '../../src/games/shape-build/pieces'

const W = 20
const FLOOR = 10
const CEIL = 0.5

function makeWorld(): SandboxWorld {
  return new SandboxWorld({
    width: W,
    height: 11,
    floorY: FLOOR,
    ceilingY: CEIL,
    realistic: false,
    autoStraight: true,
    sticky: false,
    random: () => 0.5,
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

/** Деталь стоит на полу: центр по её высоте. */
function onFloor(kind: Parameters<typeof getPieceSpec>[0]): number {
  return FLOOR - getPieceSpec(kind).h / 2
}

describe('Механизмы: что можно включать', () => {
  it('мотор есть у вентилятора, тележки, ленты и лифта; у кубика и пушки — нет', () => {
    for (const kind of ['fan', 'cart', 'conveyor', 'lift'] as const) expect(isPowered(kind)).toBe(true)
    for (const kind of ['cube', 'ball', 'cannon', 'seesaw', 'mill'] as const) expect(isPowered(kind)).toBe(false)
  })

  it('вентилятор появляется включённым, тележка, лента и лифт — выключенными', () => {
    const world = makeWorld()
    const fan = world.add('fan', 3, onFloor('fan'))
    const cart = world.add('cart', 8, onFloor('cart'))
    const belt = world.add('conveyor', 13, onFloor('conveyor'))
    const lift = world.add('lift', 17, onFloor('lift'))
    expect(world.isOn(fan)).toBe(true)
    expect(world.isOn(cart)).toBe(false)
    expect(world.isOn(belt)).toBe(false)
    expect(world.isOn(lift)).toBe(false)
    expect(world.togglePower(cart)).toBe(true)
    expect(world.isOn(cart)).toBe(true)
    const cube = world.add('cube', 5, onFloor('cube'))
    expect(world.togglePower(cube)).toBeNull()
  })

  it('«Пуск!» включает все моторы разом, второй раз — выключает', () => {
    const world = makeWorld()
    const fan = world.add('fan', 3, onFloor('fan'))
    const cart = world.add('cart', 8, onFloor('cart'))
    const lift = world.add('lift', 17, onFloor('lift'))
    world.togglePower(fan)
    world.setAllPower(true)
    expect([fan, cart, lift].map((id) => world.isOn(id))).toEqual([true, true, true])
    expect(world.anyOn()).toBe(true)
    world.setAllPower(false)
    expect([fan, cart, lift].map((id) => world.isOn(id))).toEqual([false, false, false])
    expect(world.anyOn()).toBe(false)
  })

  it('«Отменить» помнит, что было включено', () => {
    const world = makeWorld()
    const cart = world.add('cart', 8, onFloor('cart'))
    world.togglePower(cart)
    const snap = world.snapshot()
    world.clear()
    world.restore(snap)
    const id = world.pieces().find((p) => p.kind === 'cart')!.id
    expect(world.isOn(id)).toBe(true)
  })
})

describe('Тележка с мотором', () => {
  it('включил — едет вправо; выключил — останавливается', () => {
    const world = makeWorld()
    const cart = world.add('cart', 4, onFloor('cart'))
    run(world, 0.5)
    world.togglePower(cart)
    run(world, 2)
    const moved = view(world, cart).x
    expect(moved).toBeGreaterThan(7)
    world.togglePower(cart)
    run(world, 1.5)
    const stopped = view(world, cart).x
    run(world, 1)
    expect(Math.abs(view(world, cart).x - stopped)).toBeLessThan(0.15)
  })

  it('«Повернуть» (зеркально) — едет влево', () => {
    const world = makeWorld()
    const cart = world.add('cart', 14, onFloor('cart'))
    world.turn(cart)
    run(world, 0.5)
    world.togglePower(cart)
    run(world, 2)
    expect(view(world, cart).x).toBeLessThan(11)
  })

  it('лёгкий мячик и кубик толкает перед собой', () => {
    const world = makeWorld()
    const cart = world.add('cart', 3, onFloor('cart'))
    const cube = world.add('cube', 6, onFloor('cube'))
    run(world, 0.5)
    world.togglePower(cart)
    run(world, 3)
    expect(view(world, cube).x).toBeGreaterThan(7.5)
  })

  it('тяжёлый камень не сдвигает: стоит с включённым мотором, убрали камень — поехала дальше', () => {
    const world = makeWorld()
    const cart = world.add('cart', 3, onFloor('cart'))
    const stone = world.add('stone', 6, FLOOR - 0.5, { size: 2 })
    run(world, 0.5)
    const stoneX = view(world, stone).x
    world.togglePower(cart)
    run(world, 3)
    expect(Math.abs(view(world, stone).x - stoneX)).toBeLessThan(0.5)
    const blocked = view(world, cart).x
    expect(world.isOn(cart)).toBe(true)
    world.remove(stone)
    run(world, 2)
    expect(view(world, cart).x).toBeGreaterThan(blocked + 2)
  })
})

describe('Шар-таран: длина верёвки', () => {
  it('«Короче» поднимает шар, «Длиннее» опускает; дальше предела — нельзя', () => {
    const world = makeWorld()
    const ball = world.add('wrecking', 8, 6)
    run(world, 2)
    const start = world.ropeLength(ball)!
    const y0 = view(world, ball).y
    expect(world.changeRope(ball, -1)).toBe(true)
    run(world, 2)
    expect(world.ropeLength(ball)!).toBeLessThan(start)
    expect(view(world, ball).y).toBeLessThan(y0 - 0.5)
    expect(world.changeRope(ball, 1)).toBe(true)
    expect(world.changeRope(ball, 1)).toBe(true)
    run(world, 2)
    expect(view(world, ball).y).toBeGreaterThan(y0 + 0.5)
    while (world.changeRope(ball, 1)) {
      /* до пола */
    }
    run(world, 2)
    expect(view(world, ball).y + 0.7).toBeLessThan(FLOOR)
    while (world.changeRope(ball, -1)) {
      /* до потолка */
    }
    expect(world.ropeLength(ball)!).toBeGreaterThanOrEqual(1.2)
    expect(world.changeRope(world.add('cube', 3, onFloor('cube')), 1)).toBe(false)
  })
})

describe('Качели', () => {
  it('камень падает на один край — мячик с другого края взлетает', () => {
    const world = makeWorld()
    world.add('seesaw', 8, onFloor('seesaw'))
    run(world, 1)
    const ball = world.add('ball', 6, FLOOR - 2)
    run(world, 1)
    const restY = view(world, ball).y
    world.add('stone', 10.2, FLOOR - 6)
    let top = restY
    for (let i = 0; i < 120; i += 1) {
      world.step(1 / 60)
      top = Math.min(top, view(world, ball).y)
    }
    expect(top).toBeLessThan(restY - 2)
  })

  it('доска качается на опоре, сама опора стоит', () => {
    const world = makeWorld()
    const id = world.add('seesaw', 8, onFloor('seesaw'))
    world.add('cube', 9.8, FLOOR - 3)
    run(world, 2)
    const v = view(world, id)
    expect(v.link).toBeDefined()
    expect(Math.abs(v.link!.angle)).toBeGreaterThan(0.15)
    expect(Math.abs(v.angle)).toBeLessThan(0.1)
    expect(Math.abs(v.x - 8)).toBeLessThan(0.3)
  })
})

describe('Лента-конвейер', () => {
  it('включена — везёт кубик вправо; зеркально — влево; выключена — стоит', () => {
    for (const [flip, sign] of [
      [false, 1],
      [true, -1],
    ] as const) {
      const world = makeWorld()
      const belt = world.add('conveyor', 10, onFloor('conveyor'), { flip })
      const cube = world.add('cube', 10, FLOOR - getPieceSpec('conveyor').h - 0.7)
      run(world, 1)
      const x0 = view(world, cube).x
      world.togglePower(belt)
      run(world, 1)
      expect((view(world, cube).x - x0) * sign).toBeGreaterThan(1)
    }
    const world = makeWorld()
    world.add('conveyor', 10, onFloor('conveyor'))
    const cube = world.add('cube', 10, FLOOR - getPieceSpec('conveyor').h - 0.7)
    run(world, 1)
    const x0 = view(world, cube).x
    run(world, 1.5)
    expect(Math.abs(view(world, cube).x - x0)).toBeLessThan(0.1)
  })
})

describe('Колесо-мельница', () => {
  it('вентилятор дует — колесо крутится', () => {
    const world = makeWorld()
    world.add('fan', 4, onFloor('fan'))
    const mill = world.add('mill', 7.5, onFloor('mill'))
    run(world, 2)
    expect(Math.abs(world.spinOf(mill))).toBeGreaterThan(1)
  })

  it('без ветра стоит; мячик попал в лопасть — закрутилось', () => {
    const world = makeWorld()
    const mill = world.add('mill', 10, onFloor('mill'))
    run(world, 1)
    expect(Math.abs(world.spinOf(mill))).toBeLessThan(0.2)
    world.add('ball', 10.6, 0.8)
    let max = 0
    for (let i = 0; i < 90; i += 1) {
      world.step(1 / 60)
      max = Math.max(max, Math.abs(world.spinOf(mill)))
    }
    expect(max).toBeGreaterThan(1)
  })
})

describe('Подъёмник', () => {
  it('«Вверх» — площадка с мячиком поднимается и держится; «Вниз» — опускается', () => {
    const world = makeWorld()
    const lift = world.add('lift', 10, onFloor('lift'))
    run(world, 0.5)
    const deck = view(world, lift).link!
    const ball = world.add('ball', deck.x + 0.1, deck.y - 0.8)
    run(world, 1)
    const low = view(world, ball).y
    world.togglePower(lift)
    run(world, 3)
    expect(view(world, ball).y).toBeLessThan(low - 2.9)
    run(world, 2)
    expect(view(world, ball).y).toBeLessThan(low - 2.9)
    world.togglePower(lift)
    run(world, 3)
    expect(view(world, lift).link!.y).toBeGreaterThan(deck.y - 0.2)
  })

  it('без площадки-лесенки: узкий, не шире своей площадки', () => {
    const spec = getPieceSpec('lift')
    expect(spec.w).toBeLessThan(2)
    expect(spec.h).toBeLessThan(1)
  })
})

describe('Пушка-хлопушка', () => {
  it('«Пли!» — мячик вылетает из дула вверх-вправо (вдоль ствола) и улетает далеко', () => {
    const world = makeWorld()
    const cannon = world.add('cannon', 3, onFloor('cannon'))
    run(world, 0.5)
    const ball = world.add('ball', 15, onFloor('ball'))
    expect(world.fire(cannon, ball)).toBe(true)
    let top = FLOOR
    for (let i = 0; i < 60; i += 1) {
      world.step(1 / 60)
      top = Math.min(top, view(world, ball).y)
    }
    expect(top).toBeLessThan(FLOOR - 2)
    run(world, 2)
    expect(view(world, ball).x).toBeGreaterThan(9)
  })

  it('зеркальная стреляет влево; стрелять можно только из пушки', () => {
    const world = makeWorld()
    const cannon = world.add('cannon', 17, onFloor('cannon'), { flip: true })
    run(world, 0.5)
    const ball = world.add('ball', 2, onFloor('ball'))
    world.fire(cannon, ball)
    run(world, 1.5)
    expect(view(world, ball).x).toBeLessThan(12)
    const cube = world.add('cube', 8, onFloor('cube'))
    expect(world.fire(cube, ball)).toBe(false)
  })

  it('мячик в дуле — «заряжен»', () => {
    const world = makeWorld()
    const cannon = world.add('cannon', 5, onFloor('cannon'))
    run(world, 0.3)
    expect(world.loadedItem(cannon)).toBeNull()
    const m = world.muzzleOf(cannon)!
    const ball = world.add('ball', m.x, m.y)
    expect(world.loadedItem(cannon)).toBe(ball)
  })

  it('мячик, положенный в дуло, держится там и ждёт выстрела; рукой можно забрать', () => {
    const world = makeWorld()
    const cannon = world.add('cannon', 5, onFloor('cannon'))
    run(world, 0.3)
    const m = world.muzzleOf(cannon)!
    const ball = world.add('ball', m.x, m.y)
    run(world, 2)
    expect(world.loadedItem(cannon)).toBe(ball)
    const v = view(world, ball)
    expect(Math.hypot(v.x - m.x, v.y - m.y)).toBeLessThan(0.6)
    world.grab([ball], v.x, v.y)
    world.moveGrab(v.x - 3, v.y - 1)
    run(world, 0.5)
    world.releaseGrab()
    run(world, 1)
    expect(world.loadedItem(cannon)).toBeNull()
  })

  it('поднёс мячик к дулу и держит 0,6 с — пушка его втянула; вынутый рукой назад сам не втягивается', () => {
    const world = makeWorld()
    const cannon = world.add('cannon', 5, onFloor('cannon'))
    run(world, 0.3)
    const m = world.muzzleOf(cannon)!
    const ball = world.add('ball', 12, onFloor('ball'))
    world.grab([ball], 12, onFloor('ball'), 2)
    world.moveGrab(m.x + 0.7, m.y - 0.3, 2)
    run(world, 0.3)
    expect(world.loadedItem(cannon)).toBeNull()
    run(world, 0.6)
    expect(world.loadedItem(cannon)).toBe(ball)
    expect(world.grabbedIds(2)).not.toContain(ball)
    const v = view(world, ball)
    world.grab([ball], v.x, v.y, 3)
    run(world, 1.2)
    expect(world.loadedItem(cannon)).toBeNull()
    expect(world.grabbedIds(3)).toContain(ball)
  })

  it('мячик в дуле уменьшается до ширины дула и торчит из него; после выстрела — снова обычный', () => {
    const world = makeWorld()
    const cannon = world.add('cannon', 5, onFloor('cannon'))
    run(world, 0.3)
    const m = world.holeOf(cannon)!
    const ball = world.add('ball', m.x, m.y)
    run(world, 0.5)
    const v = view(world, ball)
    expect(v.muzzle).toBeDefined()
    const { x, y, dx, dy } = v.muzzle!
    expect(Math.hypot(x - m.x, y - m.y)).toBeLessThan(0.01)
    expect(v.shrink).toBeDefined()
    const width = getPieceSpec('ball').w * v.shrink!
    expect(width).toBeLessThanOrEqual(MUZZLE_BORE * 1.05)
    expect(width).toBeGreaterThan(MUZZLE_BORE * 0.8)
    const ahead = (v.x - x) * dx + (v.y - y) * dy
    expect(ahead).toBeGreaterThanOrEqual(0)
    expect(ahead).toBeLessThan(width / 2)
    world.fire(cannon, ball)
    run(world, 0.1)
    expect(view(world, ball).muzzle).toBeUndefined()
    run(world, 0.4)
    expect(view(world, ball).shrink).toBeUndefined()
  })

  it('дуло — это тёмное отверстие на картинке пушки: предмет сжимается до него, а не до всего жерла', () => {
    const { hole } = getPieceSpec('cannon').muzzle!
    expect(Math.hypot(hole.x - 0.84, hole.y + 0.5)).toBeLessThan(0.03)
    expect(MUZZLE_BORE).toBeGreaterThan(0.3)
    expect(MUZZLE_BORE).toBeLessThan(0.4)
  })

  it('кактус в дуле развёрнут вдоль ствола, как герой; вид знает ширину отверстия', () => {
    const world = makeWorld()
    const cannon = world.add('cannon', 5, onFloor('cannon'))
    run(world, 0.3)
    const m = world.muzzleOf(cannon)!
    const pin = world.add('pin', m.x, m.y)
    run(world, 0.5)
    expect(world.loadedItem(cannon)).toBe(pin)
    const v = view(world, pin)
    const { dx, dy, r } = v.muzzle!
    expect(Math.abs(v.angle - Math.atan2(dx, -dy))).toBeLessThan(0.05)
    expect(r).toBeCloseTo(MUZZLE_BORE / 2, 2)
  })

  it('мячик в дуле берётся тапом; после выстрела снова твёрдый и падает на пол', () => {
    const world = makeWorld()
    const cannon = world.add('cannon', 5, onFloor('cannon'))
    run(world, 0.3)
    const m = world.muzzleOf(cannon)!
    const ball = world.add('ball', m.x, m.y)
    run(world, 0.3)
    expect(world.pieceAt(m.x, m.y)).toBe(ball)
    world.fire(cannon, ball)
    run(world, 2.5)
    expect(view(world, ball).y).toBeLessThan(onFloor('ball') + 0.05)
  })

  it('мячик в дуле сделали больше — он остаётся сквозным в дуле, пушку не толкает', () => {
    const world = makeWorld()
    const cannon = world.add('cannon', 5, onFloor('cannon'))
    run(world, 0.3)
    const m = world.muzzleOf(cannon)!
    const ball = world.add('ball', m.x, m.y)
    run(world, 0.5)
    const before = view(world, cannon)
    expect(world.setSize(ball, 1.4)).toBe(true)
    run(world, 1)
    const after = view(world, cannon)
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(0.05)
    expect(Math.abs(after.angle - before.angle)).toBeLessThan(0.05)
    expect(view(world, ball).muzzle).toBeDefined()
    expect(world.fire(cannon, ball)).toBe(true)
  })

  it('Мяу в пушке — уменьшился под дуло, голова торчит наружу, тело внутри', () => {
    const world = makeWorld()
    const cannon = world.add('cannon', 5, onFloor('cannon'))
    run(world, 0.3)
    const m = world.holeOf(cannon)!
    const meow = world.add('meow', m.x, m.y)
    run(world, 0.5)
    expect(world.loadedItem(cannon)).toBe(meow)
    const v = view(world, meow)
    const { dx, dy } = v.muzzle!
    expect(Math.abs(v.angle - Math.atan2(dx, -dy))).toBeLessThan(0.05)
    expect(v.shrink).toBeDefined()
    expect(getPieceSpec('meow').w * v.shrink!).toBeLessThanOrEqual(MUZZLE_BORE * 1.1)
    const half = (getPieceSpec('meow').h / 2) * v.shrink!
    const head = { x: v.x + Math.sin(v.angle) * half, y: v.y - Math.cos(v.angle) * half }
    const feet = { x: v.x - Math.sin(v.angle) * half, y: v.y + Math.cos(v.angle) * half }
    expect((head.x - m.x) * dx + (head.y - m.y) * dy).toBeGreaterThan(0.2 * half)
    expect((feet.x - m.x) * dx + (feet.y - m.y) * dy).toBeLessThan(0)
  })

  it('«Пуск!» стреляет из заряженных пушек, пустые молчат', () => {
    const world = makeWorld()
    const loaded = world.add('cannon', 3, onFloor('cannon'))
    const empty = world.add('cannon', 14, onFloor('cannon'))
    run(world, 0.3)
    const m = world.muzzleOf(loaded)!
    const ball = world.add('ball', m.x, m.y)
    expect(world.fireLoaded()).toEqual([loaded])
    expect(empty).toBeGreaterThan(0)
    run(world, 0.4)
    expect(view(world, ball).x).toBeGreaterThan(m.x + 4)
  })
})
