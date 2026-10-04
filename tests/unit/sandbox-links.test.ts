import { describe, expect, it } from 'vitest'
import { SandboxWorld, type ActionEvent } from '../../src/games/shape-build/physics'
import {
  BLOCK_KINDS,
  ITEM_MAX_PER_KIND,
  PIECE_KINDS,
  SHELF_KINDS,
  SHELF_TABS,
  getPieceSpec,
  isPowered,
  shelfTabOf,
} from '../../src/games/shape-build/pieces'

const W = 20
const FLOOR = 10
const CEIL = 0.5

function makeWorld(width = W): SandboxWorld {
  return new SandboxWorld({
    width,
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
  for (let i = 0; i < Math.round(seconds * 60); i += 1) world.step(1 / 60)
}

function view(world: SandboxWorld, id: number) {
  const piece = world.pieces().find((p) => p.id === id)
  if (!piece) throw new Error(`no piece ${id}`)
  return piece
}

function onFloor(kind: Parameters<typeof getPieceSpec>[0], size = 1): number {
  return FLOOR - (getPieceSpec(kind).h * size) / 2
}

function tap(world: SandboxWorld, button: number, after = 0.7): void {
  world.pressButton(button)
  run(world, after)
}

describe('Шкаф: вкладки', () => {
  it('каждая деталь — ровно в одной вкладке; в «Деталях» — дерево, полка, жёлоб и труба; ведёрка в шкафу нет', () => {
    expect(SHELF_TABS.map((t) => t.title)).toEqual(['Детали', 'Предметы', 'Механизмы', 'Включатели'])
    const all = SHELF_TABS.flatMap((t) => t.kinds)
    expect(new Set(all).size).toBe(all.length)
    expect([...all].sort()).toEqual([...SHELF_KINDS].sort())
    expect(SHELF_KINDS).toEqual(PIECE_KINDS.filter((k) => k !== 'bucket'))
    expect(SHELF_TABS[0]!.kinds).toEqual([...BLOCK_KINDS, 'shelf', 'chute', 'pipe'])
    expect(shelfTabOf('button')).toBe('switches')
    expect(shelfTabOf('scissors')).toBe('switches')
    expect(shelfTabOf('launcher')).toBe('machines')
    expect(shelfTabOf('pin')).toBe('items')
  })

  it('ворота, люк, подъёмник и лампочка включаются, как моторы; кнопка, кактус, толкатель, ножницы — нет', () => {
    for (const kind of ['gate', 'lamp', 'trapdoor', 'lift'] as const) expect(isPowered(kind)).toBe(true)
    for (const kind of ['button', 'pin', 'pusher', 'rocket', 'pulley', 'scissors', 'launcher'] as const) {
      expect(isPowered(kind)).toBe(false)
    }
  })

  it('предметов одного вида — до шести', () => {
    expect(ITEM_MAX_PER_KIND).toBe(6)
  })
})

describe('Кнопка-тумблер и провод', () => {
  it('мячик упал на кнопку — она нажата, тележка поехала', () => {
    const world = makeWorld()
    const button = world.add('button', 5, onFloor('button'))
    const cart = world.add('cart', 9, onFloor('cart'))
    run(world, 0.5)
    expect(world.isPressed(button)).toBe(false)
    expect(world.isOn(cart)).toBe(false)
    world.add('stone', 5, FLOOR - 3)
    run(world, 1)
    expect(world.isPressed(button)).toBe(true)
    expect(world.isOn(cart)).toBe(true)
    run(world, 1.5)
    expect(view(world, cart).x).toBeGreaterThan(10)
  })

  it('новая кнопка подключается к ближайшему механизму, и провод не перескакивает', () => {
    const world = makeWorld()
    const button = world.add('button', 5, onFloor('button'))
    const lamp = world.add('lamp', 7, onFloor('lamp'))
    world.add('cart', 15, onFloor('cart'))
    run(world, 0.2)
    expect(world.targetOf(button)).toBe(lamp)
    world.add('rocket', 5.9, onFloor('rocket'))
    world.grab([lamp], 7, onFloor('lamp'))
    world.moveGrab(16, onFloor('lamp'))
    run(world, 0.4)
    world.releaseGrab()
    run(world, 0.3)
    expect(world.wiresOf(button)).toEqual([lamp])
    const wires = world.wires().filter((w) => w.sourceId === button)
    expect(wires).toHaveLength(1)
    expect(wires[0]!.sourceId).toBe(button)
    expect(wires[0]!.targetId).toBe(lamp)
    expect(wires[0]!.live).toBe(false)
  })

  it('тап по кнопке включает лампочку и она горит; ещё тап — гаснет', () => {
    const world = makeWorld()
    const button = world.add('button', 5, onFloor('button'))
    const lamp = world.add('lamp', 7.5, onFloor('lamp'))
    run(world, 0.3)
    tap(world, button)
    expect(world.isOn(lamp)).toBe(true)
    expect(world.wires()[0]!.live).toBe(true)
    run(world, 2)
    expect(world.isOn(lamp)).toBe(true)
    tap(world, button)
    expect(world.isOn(lamp)).toBe(false)
    const cube = world.add('cube', 9, onFloor('cube'))
    expect(world.pressButton(cube)).toBe(false)
  })

  it.each([
    ['набок, мячик летит сбоку', Math.PI / 2, { x: -14, y: 0 }],
    ['набок, мячик летит сбоку', -Math.PI / 2, { x: 14, y: 0 }],
    ['вверх ногами, мячик летит снизу', Math.PI, { x: 0, y: -16 }],
  ] as const)('прибитая кнопка %s (угол %f) — включает лампочку', (_name, angle, velocity) => {
    const world = makeWorld()
    const button = world.add('button', 10, FLOOR - 4, { angle })
    world.setPinned(button, true)
    const lamp = world.add('lamp', 16, onFloor('lamp'))
    run(world, 0.8)
    expect(world.isOn(lamp)).toBe(false)
    const bx = 10 - Math.sign(velocity.x) * 2.2
    const by = velocity.y ? FLOOR - 4 + 2.2 : FLOOR - 4
    const ball = world.add('ball', bx, by)
    world.grab([ball], bx, by)
    world.releaseGrab(velocity)
    run(world, 1)
    expect(world.isOn(lamp)).toBe(true)
  })

  it('кнопку уронили из шкафа — она не нажимается сама от удара об пол', () => {
    const world = makeWorld()
    const lamp = world.add('lamp', 8, onFloor('lamp'))
    run(world, 0.3)
    const button = world.add('button', 5.5, FLOOR - 4)
    run(world, 2)
    expect(world.wiresOf(button)).toEqual([lamp])
    expect(world.isOn(lamp)).toBe(false)
  })

  it('подъёмник и кнопку уронили с высоты — подъёмник не едет сам', () => {
    const world = makeWorld()
    const lift = world.add('lift', 12, FLOOR - 8)
    run(world, 1.2)
    const button = world.add('button', 8, CEIL + 0.6)
    run(world, 2.5)
    expect(world.wiresOf(button)).toEqual([lift])
    expect(world.isOn(lift)).toBe(false)
  })

  it('камень лежит на кнопке — это одно нажатие, а не дребезг', () => {
    const world = makeWorld()
    const button = world.add('button', 5, onFloor('button'))
    const lamp = world.add('lamp', 8, onFloor('lamp'))
    run(world, 0.3)
    expect(world.wiresOf(button)).toEqual([lamp])
    world.add('ball', 5, FLOOR - 4)
    run(world, 3)
    expect(world.isOn(lamp)).toBe(true)
  })

  it('до трёх проводов от кнопки; перетянуть, снять; петлю замкнуть нельзя', () => {
    const world = makeWorld()
    const button = world.add('button', 3, onFloor('button'))
    const cart = world.add('cart', 6, onFloor('cart'))
    const lamp = world.add('lamp', 9, onFloor('lamp'))
    const fan = world.add('fan', 11, onFloor('fan'))
    const belt = world.add('conveyor', 15, onFloor('conveyor'))
    expect(world.wiresOf(button)).toEqual([cart])
    expect(world.connect(button, lamp)).toBe(true)
    expect(world.connect(button, fan)).toBe(true)
    expect(world.connect(button, belt)).toBe(false)
    expect(world.rewire(button, fan, belt)).toBe(true)
    expect(world.wiresOf(button)).toEqual([cart, lamp, belt])
    expect(world.disconnect(button, cart)).toBe(true)
    expect(world.wiresOf(button)).toEqual([lamp, belt])
    const lamp2 = world.add('lamp', 17, onFloor('lamp'))
    expect(world.connect(lamp, lamp2)).toBe(true)
    expect(world.connect(lamp2, lamp)).toBe(false)
    world.remove(belt)
    expect(world.wiresOf(button)).toEqual([lamp])
  })

  it('провод от кнопки тянется пальцем и к уже подключённому механизму второй раз не идёт', () => {
    const world = makeWorld()
    const button = world.add('button', 3, onFloor('button'))
    const cart = world.add('cart', 7, onFloor('cart'))
    expect(world.canConnect(button, cart)).toBe(false)
    expect(world.canConnect(cart, button)).toBe(false)
  })

  it('кнопка стреляет из пушки любым предметом — кубиком', () => {
    const world = makeWorld()
    const events: ActionEvent[] = []
    world.onAction((e) => events.push(e))
    const button = world.add('button', 3, onFloor('button'))
    const cannon = world.add('cannon', 6, onFloor('cannon'))
    const at = world.muzzleOf(cannon)!
    const cube = world.add('cube', at.x, at.y)
    run(world, 0.5)
    expect(world.loadedItem(cannon)).toBe(cube)
    const x0 = view(world, cube).x
    tap(world, button, 0.4)
    expect(events.some((e) => e.type === 'press' && e.id === button)).toBe(true)
    expect(events.some((e) => e.type === 'fire' && e.id === cannon)).toBe(true)
    expect(events.some((e) => e.type === 'signal' && e.id === button && e.target === cannon)).toBe(true)
    expect(view(world, cube).x - x0).toBeGreaterThan(2)
  })

  it('«Пуск!» не трогает то, к чему идёт провод: оно ждёт свой сигнал', () => {
    const world = makeWorld()
    world.add('button', 3, onFloor('button'))
    const wired = world.add('rocket', 5, onFloor('rocket'))
    const free = world.add('rocket', 15, onFloor('rocket'))
    const belt = world.add('conveyor', 10, onFloor('conveyor'))
    run(world, 0.3)
    const result = world.start(true)
    expect(result.launched).toEqual([free])
    expect(world.isOn(belt)).toBe(true)
    run(world, 0.8)
    expect(view(world, wired).y).toBeGreaterThan(onFloor('rocket') - 0.2)
    expect(view(world, free).y).toBeLessThan(onFloor('rocket') - 1.5)
  })

  it('провода сохраняются в снимке и возвращаются', () => {
    const world = makeWorld()
    const button = world.add('button', 3, onFloor('button'))
    world.add('cart', 6, onFloor('cart'))
    const lamp = world.add('lamp', 12, onFloor('lamp'))
    world.rewire(button, world.targetOf(button)!, lamp)
    const snap = world.snapshot()
    world.restore(snap)
    const ids = world.pieces().map((p) => ({ id: p.id, kind: p.kind }))
    const b = ids.find((p) => p.kind === 'button')!.id
    const l = ids.find((p) => p.kind === 'lamp')!.id
    expect(world.wiresOf(b)).toEqual([l])
  })
})

describe('Лампочка и мельница передают сигнал дальше', () => {
  it('кнопка → лампочка → тележка: тап — обе включились; ещё тап — обе выключились', () => {
    const world = makeWorld()
    const button = world.add('button', 3, onFloor('button'))
    const lamp = world.add('lamp', 5, onFloor('lamp'))
    const cart = world.add('cart', 9, onFloor('cart'))
    expect(world.wiresOf(button)).toEqual([lamp])
    expect(world.wiresOf(lamp)).toEqual([cart])
    run(world, 0.3)
    tap(world, button, 0.5)
    expect(world.isOn(lamp)).toBe(true)
    expect(world.isOn(cart)).toBe(true)
    tap(world, button, 0.5)
    expect(world.isOn(lamp)).toBe(false)
    expect(world.isOn(cart)).toBe(false)
  })

  it('«Вкл» у лампочки в меню тоже включает её провод', () => {
    const world = makeWorld()
    const lamp = world.add('lamp', 5, onFloor('lamp'))
    const gate = world.add('gate', 9, onFloor('gate'))
    expect(world.wiresOf(lamp)).toEqual([gate])
    world.togglePower(lamp)
    run(world, 0.6)
    expect(world.isOn(gate)).toBe(true)
  })

  it('лампочки на проводе загораются по очереди, а не все разом — видно, как бежит сигнал', () => {
    const world = makeWorld()
    const button = world.add('button', 2, onFloor('button'))
    const l1 = world.add('lamp', 5, onFloor('lamp'))
    const l2 = world.add('lamp', 8, onFloor('lamp'))
    const l3 = world.add('lamp', 11, onFloor('lamp'))
    world.setWires([
      [button, l1],
      [l1, l2],
      [l2, l3],
    ])
    run(world, 0.3)
    world.pressButton(button)
    run(world, 0.1)
    expect([world.isOn(l1), world.isOn(l2), world.isOn(l3)]).toEqual([true, false, false])
    run(world, 0.4)
    expect([world.isOn(l1), world.isOn(l2), world.isOn(l3)]).toEqual([true, true, false])
    run(world, 0.4)
    expect([world.isOn(l1), world.isOn(l2), world.isOn(l3)]).toEqual([true, true, true])
    run(world, 0.5)
    world.pressButton(button)
    run(world, 0.1)
    expect([world.isOn(l1), world.isOn(l2), world.isOn(l3)]).toEqual([false, true, true])
    run(world, 1)
    expect([world.isOn(l1), world.isOn(l2), world.isOn(l3)]).toEqual([false, false, false])
  })

  it('ветер крутит мельницу — горит лампочка; вентилятор выключили — погасла', () => {
    const world = makeWorld()
    const fan = world.add('fan', 3, onFloor('fan'))
    world.togglePower(fan)
    const mill = world.add('mill', 7, onFloor('mill'))
    const lamp = world.add('lamp', 11, onFloor('lamp'))
    expect(world.wiresOf(mill)).not.toContain(fan)
    world.setWires([[mill, lamp]])
    world.togglePower(fan)
    run(world, 3)
    expect(Math.abs(world.spinOf(mill))).toBeGreaterThan(3)
    expect(world.isOn(lamp)).toBe(true)
    world.togglePower(fan)
    run(world, 8)
    expect(world.isOn(lamp)).toBe(false)
  })
})

describe('Ворота-рольставня', () => {
  it('закрыты — мячик упирается; кнопка — полотно уехало вверх, мячик проехал; ещё раз — закрылись', () => {
    const world = makeWorld()
    const gate = world.add('gate', 9, onFloor('gate'))
    const button = world.add('button', 2, onFloor('button'))
    expect(world.wiresOf(button)).toEqual([gate])
    const ball = world.add('ball', 5, onFloor('ball'))
    run(world, 0.3)
    world.nudge(ball, { x: 9, y: 0 })
    run(world, 2)
    expect(view(world, ball).x).toBeLessThan(9)
    tap(world, button, 1)
    expect(world.isOn(gate)).toBe(true)
    expect(world.openness(gate)).toBeGreaterThan(0.9)
    world.nudge(ball, { x: 9, y: 0 })
    run(world, 2)
    expect(view(world, ball).x).toBeGreaterThan(10.5)
    tap(world, button, 1.2)
    expect(world.isOn(gate)).toBe(false)
    expect(world.openness(gate)).toBeLessThan(0.1)
    expect(Math.abs(view(world, gate).angle)).toBeLessThan(0.1)
  })
})

describe('Полка, полка с люком, жёлоб', () => {
  it('полка висит в воздухе и держит мячик; «Длиннее» — длиннее', () => {
    const world = makeWorld()
    const shelf = world.add('shelf', 8, 6)
    const ball = world.add('ball', 8, 4.5)
    run(world, 1.5)
    expect(view(world, ball).y).toBeLessThan(6)
    const w0 = world.boundsOf(shelf)!.x1 - world.boundsOf(shelf)!.x0
    expect(world.changeLength(shelf, 1)).toBe(true)
    expect(world.lengthOf(shelf)).toBe(1.25)
    const w1 = world.boundsOf(shelf)!.x1 - world.boundsOf(shelf)!.x0
    expect(w1).toBeGreaterThan(w0 + 0.8)
    for (let i = 0; i < 10; i += 1) world.changeLength(shelf, 1)
    expect(world.lengthOf(shelf)).toBe(2.5)
    expect(world.changeLength(shelf, 1)).toBe(false)
  })

  it('люк держит камень; кнопка — люк открылся, камень упал; ещё раз — закрылся', () => {
    const world = makeWorld()
    const hatch = world.add('trapdoor', 8, 6)
    const stone = world.add('stone', 8.1, 5.2)
    run(world, 1)
    expect(view(world, stone).y).toBeLessThan(6)
    const button = world.add('button', 2, onFloor('button'))
    expect(world.wiresOf(button)).toEqual([hatch])
    tap(world, button, 2)
    expect(view(world, stone).y).toBeGreaterThan(FLOOR - 1)
    tap(world, button, 1.5)
    expect(world.isOn(hatch)).toBe(false)
    expect(Math.abs(view(world, hatch).link!.angle)).toBeLessThan(0.15)
  })

  it('на закрытом люке мячик лежит и сам не скатывается', () => {
    const world = makeWorld()
    const hatch = world.add('trapdoor', 8, 6)
    const ball = world.add('ball', 8, 5.3)
    run(world, 4)
    expect(Math.abs(view(world, ball).x - 8)).toBeLessThan(0.15)
    expect(Math.abs(view(world, hatch).link!.angle)).toBeLessThan(0.02)
  })

  it('мячик скатывается по жёлобу вниз вправо, зеркальный — влево', () => {
    const world = makeWorld()
    world.add('chute', 7, 5)
    const ball = world.add('ball', 5.6, 3.6)
    run(world, 2.5)
    expect(view(world, ball).x).toBeGreaterThan(9)
    const world2 = makeWorld()
    world2.add('chute', 12, 5, { flip: true })
    const ball2 = world2.add('ball', 13.4, 3.6)
    run(world2, 2.5)
    expect(view(world2, ball2).x).toBeLessThan(10)
  })
})

describe('Труба-телепорт', () => {
  it('мячик упал в трубу — выпал из второй трубы той же пары', () => {
    const world = makeWorld()
    const events: ActionEvent[] = []
    world.onAction((e) => events.push(e))
    const a = world.add('pipe', 5, 6)
    const b = world.add('pipe', 15, 6)
    expect(world.pipePartner(a)).toBe(b)
    expect(view(world, a).color).toBe(view(world, b).color)
    const ball = world.add('ball', 5, 3.5)
    run(world, 2)
    expect(events.some((e) => e.type === 'teleport' && e.id === a)).toBe(true)
    expect(Math.abs(view(world, ball).x - 15)).toBeLessThan(1.5)
    expect(view(world, ball).y).toBeGreaterThan(FLOOR - 1.5)
  })

  it('одна труба без пары — просто труба', () => {
    const world = makeWorld()
    const a = world.add('pipe', 5, 6)
    expect(world.pipePartner(a)).toBeNull()
    const ball = world.add('ball', 5, 3.5)
    run(world, 2)
    expect(Math.abs(view(world, ball).x - 5)).toBeLessThan(1)
  })
})

describe('Подъёмник-домкрат', () => {
  it('кнопка — площадка поднялась и держится; ещё раз — опустилась', () => {
    const world = makeWorld()
    const lift = world.add('lift', 8, onFloor('lift'))
    const button = world.add('button', 3, onFloor('button'))
    run(world, 0.5)
    const y0 = view(world, lift).link!.y
    const ball = world.add('ball', 8, y0 - 0.8)
    run(world, 0.5)
    tap(world, button, 3)
    expect(world.isOn(lift)).toBe(true)
    expect(view(world, lift).link!.y).toBeLessThan(y0 - 2.9)
    expect(view(world, ball).y).toBeLessThan(y0 - 3)
    run(world, 2)
    expect(view(world, lift).link!.y).toBeLessThan(y0 - 2.9)
    tap(world, button, 3)
    expect(view(world, lift).link!.y).toBeGreaterThan(y0 - 0.2)
    expect(Math.abs(view(world, lift).angle)).toBeLessThan(0.05)
  })

  it('«Пуск!» — ездит сам вверх и вниз', () => {
    const world = makeWorld()
    const lift = world.add('lift', 8, onFloor('lift'))
    run(world, 0.5)
    const y0 = view(world, lift).link!.y
    world.start(true)
    expect(world.isAuto(lift)).toBe(true)
    let top = y0
    let back = false
    for (let i = 0; i < 60 * 7; i += 1) {
      world.step(1 / 60)
      const y = view(world, lift).link!.y
      top = Math.min(top, y)
      if (top < y0 - 2.9 && y > y0 - 0.3) back = true
    }
    expect(top).toBeLessThan(y0 - 2.9)
    expect(back).toBe(true)
  })
})

describe('Ракета', () => {
  it('без груза: «Полетели!» — летит вверх с огнём, упирается в потолок, потом падает', () => {
    const world = makeWorld()
    const rocket = world.add('rocket', 6, onFloor('rocket'))
    run(world, 0.3)
    expect(world.launch(rocket)).toBe(true)
    run(world, 0.1)
    expect(view(world, rocket).on).toBe(true)
    let top = view(world, rocket).y
    for (let i = 0; i < 90; i += 1) {
      world.step(1 / 60)
      top = Math.min(top, view(world, rocket).y)
    }
    expect(top).toBeLessThan(onFloor('rocket') - 4)
    run(world, 4)
    expect(world.has(rocket)).toBe(true)
    expect(view(world, rocket).on).toBe(false)
    expect(view(world, rocket).y).toBeGreaterThan(FLOOR - 2)
  })

  it('кактус на носу уходит внутрь ракеты; у потолка вылетает дальше и лопает шарик, ракета улетает сквозь потолок', () => {
    const world = makeWorld()
    const events: ActionEvent[] = []
    world.onAction((e) => events.push(e))
    const rocket = world.add('rocket', 6, onFloor('rocket'))
    const nose = world.noseOf(rocket)!
    const pin = world.add('pin', nose.x, nose.y - 0.7)
    run(world, 0.5)
    expect(world.loadedItem(rocket)).toBe(pin)
    expect(view(world, pin).inside).toBe(rocket)
    expect(view(world, rocket).cargo?.kind).toBe('pin')
    const balloon = world.add('balloon', 6, CEIL + 0.7)
    run(world, 0.5)
    world.launch(rocket)
    run(world, 3)
    expect(world.has(rocket)).toBe(false)
    expect(events.some((e) => e.type === 'gone' && e.id === rocket)).toBe(true)
    expect(world.has(pin)).toBe(true)
    expect(world.has(balloon)).toBe(false)
  })

  it('поднёс кубик к ракете и держит 0,6 с — его втянуло внутрь: виден в иллюминаторе, пальцем не берётся', () => {
    const world = makeWorld()
    const events: ActionEvent[] = []
    world.onAction((e) => events.push(e))
    const rocket = world.add('rocket', 6, onFloor('rocket'))
    run(world, 0.3)
    const cube = world.add('cube', 9.5, onFloor('cube'))
    const r = view(world, rocket)
    world.grab([cube], 9.5, onFloor('cube'), 1)
    world.moveGrab(r.x + 1.1, r.y, 1)
    run(world, 0.35)
    expect(world.loadedItem(rocket)).toBeNull()
    const sucking = world.suckState().find((s) => s.item === cube)
    expect(sucking?.holder).toBe(rocket)
    expect(sucking!.t).toBeGreaterThan(0.2)
    expect(sucking!.t).toBeLessThan(1)
    run(world, 0.5)
    expect(world.loadedItem(rocket)).toBe(cube)
    expect(world.grabbedIds(1)).not.toContain(cube)
    expect(events.some((e) => e.type === 'load' && e.id === cube && e.target === rocket)).toBe(true)
    expect(view(world, rocket).cargo).toEqual({ kind: 'cube', color: view(world, cube).color })
    expect(view(world, cube).inside).toBe(rocket)
    const rv = view(world, rocket)
    expect(world.pieceAt(rv.x, rv.y)).toBe(rocket)
    run(world, 1)
    expect(world.loadedItem(rocket)).toBe(cube)
  })

  it('отпустил раньше — кубик просто падает рядом, ракета пустая', () => {
    const world = makeWorld()
    const rocket = world.add('rocket', 6, onFloor('rocket'))
    run(world, 0.3)
    const cube = world.add('cube', 9.5, onFloor('cube'))
    const r = view(world, rocket)
    world.grab([cube], 9.5, onFloor('cube'), 1)
    world.moveGrab(r.x + 1.2, r.y, 1)
    run(world, 0.3)
    world.releaseGrab(undefined, 1)
    run(world, 1.5)
    expect(world.loadedItem(rocket)).toBeNull()
    expect(view(world, cube).inside).toBeUndefined()
    expect(world.suckState()).toHaveLength(0)
  })

  it('кубик внутри: «Полетели!» — у потолка вылетает с силой, ракета улетает', () => {
    const world = makeWorld()
    const events: ActionEvent[] = []
    world.onAction((e) => events.push(e))
    const rocket = world.add('rocket', 6, onFloor('rocket'))
    run(world, 0.3)
    const cube = world.add('cube', 9.5, onFloor('cube'))
    const r = view(world, rocket)
    world.grab([cube], 9.5, onFloor('cube'), 1)
    world.moveGrab(r.x + 1.1, r.y, 1)
    run(world, 0.8)
    world.releaseGrab(undefined, 1)
    expect(world.loadedItem(rocket)).toBe(cube)
    world.launch(rocket)
    let top = Infinity
    for (let i = 0; i < 60 * 3; i += 1) {
      world.step(1 / 60)
      if (world.has(cube)) top = Math.min(top, view(world, cube).y)
    }
    expect(world.has(rocket)).toBe(false)
    expect(events.some((e) => e.type === 'launch' && e.id === cube)).toBe(true)
    expect(view(world, cube).inside).toBeUndefined()
    expect(top).toBeLessThan(CEIL + 1.2)
  })

  it('снимок с грузом внутри: после восстановления кубик снова в ракете', () => {
    const world = makeWorld()
    const rocket = world.add('rocket', 6, onFloor('rocket'))
    run(world, 0.3)
    const cube = world.add('cube', 9.5, onFloor('cube'))
    const r = view(world, rocket)
    world.grab([cube], 9.5, onFloor('cube'), 1)
    world.moveGrab(r.x + 1.1, r.y, 1)
    run(world, 0.8)
    world.releaseGrab(undefined, 1)
    const snap = world.snapshot()
    const again = makeWorld()
    again.restore(snap)
    run(again, 0.5)
    const rocket2 = again.pieces().find((p) => p.kind === 'rocket')!
    const cube2 = again.pieces().find((p) => p.kind === 'cube')!
    expect(again.loadedItem(rocket2.id)).toBe(cube2.id)
    expect(cube2.inside ?? view(again, cube2.id).inside).toBe(rocket2.id)
  })

  it('Мяу, поднесённый к ракете, надевает её как рюкзак: стоит на её месте, ракета у него за спиной', () => {
    const world = makeWorld()
    const rocket = world.add('rocket', 6, onFloor('rocket'))
    run(world, 0.3)
    const meow = world.add('meow', 9.5, onFloor('meow'))
    const r = view(world, rocket)
    world.grab([meow], 9.5, onFloor('meow'), 1)
    world.moveGrab(r.x + 1.1, r.y, 1)
    run(world, 0.8)
    world.releaseGrab(undefined, 1)
    run(world, 0.5)
    expect(world.loadedItem(rocket)).toBe(meow)
    const m = view(world, meow)
    const rv = view(world, rocket)
    expect(m.inside).toBeUndefined()
    expect(rv.rider).toBe(meow)
    expect(Math.abs(m.x - rv.x)).toBeLessThan(0.2)
    expect(m.y + getPieceSpec('meow').h / 2).toBeCloseTo(rv.y + 0.75, 1)
  })

  it('Мяу в ракетном рюкзаке взлетает, у потолка ракета улетает, а он спускается на парашюте', () => {
    const world = makeWorld()
    const rocket = world.add('rocket', 6, onFloor('rocket'))
    const nose = world.noseOf(rocket)!
    const meow = world.add('meow', nose.x, nose.y - 0.7)
    run(world, 0.5)
    world.launch(rocket)
    let rose = view(world, meow).y
    for (let i = 0; i < 60; i += 1) {
      world.step(1 / 60)
      rose = Math.min(rose, view(world, meow).y)
      if (world.has(rocket) && world.loadedItem(rocket) === meow) {
        expect(Math.abs(view(world, meow).x - view(world, rocket).x)).toBeLessThan(0.3)
      }
    }
    expect(rose).toBeLessThan(onFloor('meow') - 4)
    let chute = false
    for (let i = 0; i < 60 * 3 && !chute; i += 1) {
      world.step(1 / 60)
      chute = view(world, meow).chute !== undefined
    }
    expect(chute).toBe(true)
    run(world, 4)
    expect(world.has(rocket)).toBe(false)
    expect(view(world, meow).y).toBeGreaterThan(onFloor('meow') - 0.3)
  })

  it('Мяу на носу ракеты — пассажир, радуется полёту', () => {
    const world = makeWorld()
    const events: ActionEvent[] = []
    world.onAction((e) => events.push(e))
    const rocket = world.add('rocket', 6, onFloor('rocket'))
    const nose = world.noseOf(rocket)!
    const meow = world.add('meow', nose.x, nose.y - 0.7)
    run(world, 0.5)
    expect(world.loadedItem(rocket)).toBe(meow)
    world.launch(rocket)
    run(world, 1.2)
    expect(events.some((e) => e.type === 'ride' && e.id === meow)).toBe(true)
  })
})

describe('Ножницы', () => {
  it('режут верёвку шара-тарана — шар падает на пол', () => {
    const world = makeWorld()
    const ball = world.add('wrecking', 8, 5, { rope: { ax: 8, length: 3.5 } })
    run(world, 1)
    const scissors = world.add('scissors', 8.8, 2.5)
    expect(world.cut(scissors)).toBe(true)
    run(world, 1.5)
    expect(world.ropes()).toHaveLength(0)
    expect(view(world, ball).y).toBeGreaterThan(FLOOR - 1.2)
  })

  it('срезанная верёвка шара-тарана не вырастает снова после «Отменить» и при новом входе', () => {
    const world = makeWorld()
    const ball = world.add('wrecking', 8, 5, { rope: { ax: 8, length: 3.5 } })
    run(world, 1)
    world.cut(world.add('scissors', 8.8, 2.5))
    run(world, 1.5)
    const snap = JSON.parse(JSON.stringify(world.snapshot()))
    world.restore(snap)
    run(world, 0.5)
    expect(world.ropes()).toHaveLength(0)
    const again = world.pieces().find((p) => p.kind === 'wrecking')!
    expect(again.y).toBeGreaterThan(FLOOR - 1.2)
    world.setSize(again.id, 1.4)
    run(world, 0.2)
    expect(world.ropes()).toHaveLength(0)
    expect(ball).toBeDefined()
  })

  it('по сигналу режут ниточку шарика — кубик падает, шарик улетает и больше не привязывается', () => {
    const world = makeWorld()
    const cube = world.add('cube', 12, onFloor('cube'))
    const balloon = world.add('balloon', 12, onFloor('cube') - 1.5)
    expect(world.attach(balloon, cube)).toBe(true)
    run(world, 3)
    const lifted = view(world, cube).y
    expect(lifted).toBeLessThan(FLOOR - 3)
    const scissors = world.add('scissors', 13, lifted - 0.9)
    const button = world.add('button', 3, onFloor('button'))
    world.setWires([[button, scissors]])
    tap(world, button, 2)
    expect(world.ties()).toHaveLength(0)
    expect(view(world, cube).y).toBeGreaterThan(FLOOR - 1)
    expect(view(world, balloon).y).toBeLessThan(CEIL + 1.5)
  })
})

describe('Пружина-катапульта', () => {
  it('по сигналу подбрасывает мячик высоко вверх', () => {
    const world = makeWorld()
    const launcher = world.add('launcher', 8, onFloor('launcher'))
    const ball = world.add('ball', 8, onFloor('launcher') - 1)
    const button = world.add('button', 3, onFloor('button'))
    expect(world.wiresOf(button)).toEqual([launcher])
    run(world, 1)
    const y0 = view(world, ball).y
    world.pressButton(button)
    let top = y0
    for (let i = 0; i < 60; i += 1) {
      world.step(1 / 60)
      top = Math.min(top, view(world, ball).y)
    }
    expect(top).toBeLessThan(y0 - 4)
  })

  it('мячик на пружине-катапульте лежит и сам не скатывается', () => {
    const world = makeWorld()
    world.add('launcher', 8, onFloor('launcher'))
    const ball = world.add('ball', 8, onFloor('launcher') - 1)
    run(world, 4)
    expect(Math.abs(view(world, ball).x - 8)).toBeLessThan(0.15)
  })
})

describe('Прибить и склеить', () => {
  it('прибитый кубик висит в воздухе; ещё раз — падает', () => {
    const world = makeWorld()
    const cube = world.add('cube', 8, 5)
    expect(world.setPinned(cube, true)).toBe(true)
    run(world, 1)
    expect(view(world, cube).y).toBeCloseTo(5, 3)
    expect(view(world, cube).pinned).toBe(true)
    expect(world.setPinned(cube, false)).toBe(false)
    run(world, 1.5)
    expect(view(world, cube).y).toBeGreaterThan(FLOOR - 1)
    const shelf = world.add('shelf', 8, 4)
    expect(world.canPin(shelf)).toBe(false)
  })

  it('прибитые качели качаются в воздухе', () => {
    const world = makeWorld()
    const seesaw = world.add('seesaw', 10, 5)
    world.setPinned(seesaw, true)
    run(world, 0.5)
    world.add('stone', 8, 3)
    run(world, 1.5)
    expect(Math.abs(view(world, seesaw).link!.angle)).toBeGreaterThan(0.25)
    expect(view(world, seesaw).y).toBeCloseTo(5, 3)
  })

  it('«Склеить» держит намертво и после «Бум!»; «Расклеить» — отдельно', () => {
    const world = makeWorld()
    const a = world.add('cube', 8, onFloor('cube'))
    const b = world.add('cube', 8, onFloor('cube') - 1.2)
    expect(world.glue(b, a)).toBe(true)
    world.shake()
    run(world, 1)
    expect(world.stickCount()).toBe(1)
    expect(world.gluedTo(a)).toEqual([b])
    expect(world.unglue(a)).toBe(true)
    expect(world.stickCount()).toBe(0)
    expect(world.unglue(a)).toBe(false)
  })

  it('склеить можно только соседей: касаются — да, далеко, сама с собой или две полки — нет', () => {
    const world = makeWorld()
    const a = world.add('cube', 8, 5)
    const near = world.add('cube', 9.2, 5)
    const far = world.add('cube', 14, 5)
    expect(world.canGlue(a, near)).toBe(true)
    expect(world.canGlue(a, far)).toBe(false)
    expect(world.canGlue(a, a)).toBe(false)
    const s1 = world.add('shelf', 4, 3)
    const s2 = world.add('shelf', 4 + getPieceSpec('shelf').w, 3)
    expect(world.canGlue(s1, s2)).toBe(false)
  })

  it('склейка и прибитость сохраняются в снимке', () => {
    const world = makeWorld()
    const a = world.add('cube', 8, 5)
    const b = world.add('cube', 9.2, 5)
    world.setPinned(a, true)
    world.glue(a, b)
    world.restore(world.snapshot())
    const [pa, pb] = world.pieces()
    expect(pa!.pinned).toBe(true)
    run(world, 1)
    expect(world.stickCount()).toBe(1)
    world.shake()
    run(world, 0.5)
    expect(world.stickCount()).toBe(1)
    expect(pb).toBeDefined()
  })
})

describe('Шарики по весу', () => {
  function lifted(kind: Parameters<typeof getPieceSpec>[0], balloons: number): boolean {
    const world = makeWorld()
    const id = world.add(kind, 10, onFloor(kind))
    run(world, 0.3)
    for (let i = 0; i < balloons; i += 1) {
      const b = world.add('balloon', 8.5 + i * 1.1, onFloor(kind) - 2.2)
      world.attach(b, id)
    }
    run(world, 4)
    return view(world, id).y < onFloor(kind) - 1
  }

  it('один шарик поднимает кубик', () => {
    expect(lifted('cube', 1)).toBe(true)
  })

  it('пушку — только три шарика, двух мало', () => {
    expect(lifted('cannon', 2)).toBe(false)
    expect(lifted('cannon', 3)).toBe(true)
  })

  it('тележку — только четыре, трёх мало', () => {
    expect(lifted('cart', 3)).toBe(false)
    expect(lifted('cart', 4)).toBe(true)
  })
})

describe('Пассажиры', () => {
  it('Мяу едет на тележке и радуется', () => {
    const world = makeWorld()
    const events: ActionEvent[] = []
    world.onAction((e) => events.push(e))
    const cart = world.add('cart', 5, onFloor('cart'))
    const meow = world.add('meow', 5, onFloor('cart') - 1.3)
    run(world, 0.8)
    world.togglePower(cart)
    run(world, 2)
    expect(events.some((e) => e.type === 'ride' && e.id === meow)).toBe(true)
  })
})

describe('Парашют', () => {
  function fall(kind: 'meow' | 'olli' | 'cube', y: number) {
    const world = makeWorld()
    const events: ActionEvent[] = []
    world.onAction((e) => events.push(e))
    const id = world.add(kind, 6, y)
    let fast = 0
    let opened = false
    let prev = y
    let landedAt = Infinity
    for (let i = 0; i < 60 * 4; i += 1) {
      world.step(1 / 60)
      const v = view(world, id)
      fast = Math.max(fast, (v.y - prev) * 60)
      prev = v.y
      if (v.chute !== undefined) opened = true
      if (landedAt === Infinity && v.y > onFloor(kind) - 0.05) landedAt = i / 60
    }
    return { world, id, events, fast, opened, landedAt }
  }

  it('Мяу и Олли с высоты раскрывают парашют и опускаются медленнее, чем падает кубик', () => {
    const cube = fall('cube', CEIL + 1.5)
    for (const kind of ['meow', 'olli'] as const) {
      const hero = fall(kind, CEIL + 1.5)
      expect(hero.opened).toBe(true)
      expect(hero.fast).toBeLessThan(cube.fast * 0.6)
      expect(hero.landedAt).toBeGreaterThan(cube.landedAt * 1.3)
      expect(hero.landedAt).toBeLessThan(3)
      expect(hero.events.some((e) => e.type === 'chute' && e.id === hero.id)).toBe(true)
      expect(view(hero.world, hero.id).chute).toBeUndefined()
    }
    expect(cube.opened).toBe(false)
  })

  it('с небольшой высоты и в пальце — без парашюта', () => {
    expect(fall('meow', onFloor('meow') - 1).opened).toBe(false)
    const world = makeWorld()
    const meow = world.add('meow', 6, CEIL + 1.5)
    world.grab([meow], 6, CEIL + 1.5)
    world.moveGrab(6, CEIL + 3)
    world.moveGrab(6, CEIL + 6)
    for (let i = 0; i < 30; i += 1) {
      world.step(1 / 60)
      expect(view(world, meow).chute).toBeUndefined()
    }
  })
})

describe('Кактус', () => {
  it('шарик коснулся кактуса — лопнул', () => {
    const world = makeWorld()
    const events: ActionEvent[] = []
    world.onAction((e) => events.push(e))
    world.add('pin', 6, onFloor('pin'))
    const balloon = world.add('balloon', 6, onFloor('pin') - 1.4)
    world.grab([balloon], 6, onFloor('pin') - 1.4)
    world.moveGrab(6, onFloor('pin') - 0.6)
    run(world, 0.6)
    expect(world.has(balloon)).toBe(false)
    expect(events.some((e) => e.type === 'pop' && e.id === balloon)).toBe(true)
  })
})

describe('Толкатель', () => {
  it('«Толкнуть» — перчатка выезжает и толкает мячик', () => {
    const world = makeWorld()
    const pusher = world.add('pusher', 4, onFloor('pusher'))
    const ball = world.add('ball', 6.3, onFloor('ball'))
    run(world, 0.5)
    const x0 = view(world, ball).x
    expect(world.punch(pusher)).toBe(true)
    run(world, 1.5)
    expect(view(world, ball).x - x0).toBeGreaterThan(2)
    run(world, 1)
    const glove = view(world, pusher).link!
    expect(glove.x - view(world, pusher).x).toBeLessThan(1.1)
    const cube = world.add('cube', 12, onFloor('cube'))
    expect(world.punch(cube)).toBe(false)
  })

  it('зеркально — толкает влево', () => {
    const world = makeWorld()
    const pusher = world.add('pusher', 12, onFloor('pusher'), { flip: true })
    const ball = world.add('ball', 9.7, onFloor('ball'))
    run(world, 0.5)
    world.punch(pusher)
    run(world, 1.5)
    expect(view(world, ball).x).toBeLessThan(7.5)
  })
})

describe('Ведёрки на блоке', () => {
  it('мячик в левое ведёрко — оно опускается, правое поднимается', () => {
    const world = makeWorld()
    const pulley = world.add('pulley', 8, 3)
    run(world, 1)
    const before = view(world, pulley).extras!
    expect(before).toHaveLength(2)
    expect(Math.abs(before[0]!.y - before[1]!.y)).toBeLessThan(0.2)
    world.add('ball', before[0]!.x, before[0]!.y - 1.6)
    run(world, 3)
    const after = view(world, pulley).extras!
    expect(after[0]!.y).toBeGreaterThan(before[0]!.y + 1)
    expect(after[1]!.y).toBeLessThan(before[1]!.y - 0.6)
    expect(view(world, pulley).cords).toHaveLength(2)
  })

  it('перекладину перетащили — ведёрки едут с ней; убрали — ничего не осталось', () => {
    const world = makeWorld()
    const pulley = world.add('pulley', 8, 3)
    run(world, 0.5)
    const b0 = view(world, pulley).extras![0]!
    world.grab([pulley], 8, 3)
    world.moveGrab(12, 3)
    run(world, 0.2)
    world.releaseGrab()
    run(world, 1)
    expect(view(world, pulley).extras![0]!.x - b0.x).toBeGreaterThan(3)
    world.remove(pulley)
    run(world, 0.2)
    expect(world.count()).toBe(0)
  })

  it('ножницы у верёвки — режут: ведёрки становятся двумя отдельными предметами и падают на пол', () => {
    const world = makeWorld()
    const events: ActionEvent[] = []
    world.onAction((e) => events.push(e))
    const pulley = world.add('pulley', 8, 3)
    run(world, 0.5)
    const cord = view(world, pulley).cords![1]!
    const scissors = world.add('scissors', cord.ax + 0.6, (cord.ay + cord.by) / 2)
    expect(world.cut(scissors)).toBe(true)
    run(world, 2)
    expect(events.some((e) => e.type === 'cut' && e.id === scissors)).toBe(true)
    const beam = view(world, pulley)
    expect(beam.cords ?? []).toHaveLength(0)
    expect(beam.extras).toBeUndefined()
    const buckets = world.pieces().filter((p) => p.kind === 'bucket')
    expect(buckets).toHaveLength(2)
    for (const bucket of buckets) expect(bucket.y).toBeGreaterThan(FLOOR - 1.2)
    expect(world.cut(scissors)).toBe(false)
  })

  it('упавшее ведёрко — обычный предмет: его можно взять пальцем и унести; мячик в нём едет вместе', () => {
    const world = makeWorld()
    const pulley = world.add('pulley', 8, 3)
    run(world, 0.5)
    const left = view(world, pulley).extras![0]!
    const ball = world.add('ball', left.x, left.y - 0.3)
    run(world, 1)
    const cord = view(world, pulley).cords![1]!
    world.cut(world.add('scissors', cord.ax + 0.6, (cord.ay + cord.by) / 2))
    run(world, 2)
    const bucket = world.pieces().filter((p) => p.kind === 'bucket').sort((a, b) => a.x - b.x)[0]!
    expect(world.pieceAt(bucket.x, bucket.y + 0.45)).toBe(bucket.id)
    world.grab([bucket.id], bucket.x, bucket.y)
    for (let i = 1; i <= 30; i += 1) {
      world.moveGrab(bucket.x + (6 * i) / 30, bucket.y - 0.2)
      run(world, 1 / 15)
    }
    run(world, 0.5)
    expect(Math.abs(view(world, bucket.id).angle)).toBeLessThan(0.3)
    world.releaseGrab()
    run(world, 1)
    const moved = view(world, bucket.id)
    expect(moved.x - bucket.x).toBeGreaterThan(4)
    expect(Math.abs(view(world, ball).x - moved.x)).toBeLessThan(0.7)
  })

  it('срезанная перекладина без ведёрок; «Отменить» и вход в игру — ведёрки лежат отдельно, верёвка не вырастает', () => {
    const world = makeWorld()
    const pulley = world.add('pulley', 8, 3)
    run(world, 0.5)
    const cord = view(world, pulley).cords![0]!
    const scissors = world.add('scissors', cord.ax - 0.6, (cord.ay + cord.by) / 2)
    world.cut(scissors)
    run(world, 2)
    world.grab([pulley], 8, 3)
    world.moveGrab(12, 3)
    run(world, 0.2)
    world.releaseGrab()
    run(world, 0.5)
    expect(view(world, pulley).extras).toBeUndefined()
    expect(world.pieces().filter((p) => p.kind === 'bucket')).toHaveLength(2)
    const again = makeWorld()
    again.restore(world.snapshot())
    run(again, 2)
    const copy = again.pieces().find((p) => p.kind === 'pulley')!
    expect(copy.cords ?? []).toHaveLength(0)
    expect(copy.extras).toBeUndefined()
    const buckets = again.pieces().filter((p) => p.kind === 'bucket')
    expect(buckets).toHaveLength(2)
    for (const bucket of buckets) expect(bucket.y).toBeGreaterThan(FLOOR - 1.2)
  })
})

describe('Лампочка', () => {
  it('«Вкл» у лампочки — горит', () => {
    const world = makeWorld()
    const lamp = world.add('lamp', 6, onFloor('lamp'))
    expect(world.isOn(lamp)).toBe(false)
    expect(world.togglePower(lamp)).toBe(true)
    expect(view(world, lamp).on).toBe(true)
  })
})

describe('Клей для готовых машин', () => {
  it('приклеенный вверх ногами кактус висит под доской', () => {
    const world = makeWorld()
    world.add('column', 6, onFloor('column'))
    world.add('column', 10, onFloor('column'))
    const plankY = FLOOR - 1.8 - 0.21
    const plank = world.add('plank', 8, plankY)
    const pin = world.add('pin', 8, plankY + 0.21 + 0.65, { angle: Math.PI })
    expect(world.glue(pin, plank)).toBe(true)
    run(world, 1.5)
    expect(view(world, pin).y).toBeLessThan(plankY + 1.2)
  })
})
