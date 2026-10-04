// @vitest-environment node
import { appendFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SandboxWorld, type ActionEvent, type PieceView } from '../../src/games/shape-build/physics'
import { PIECE_KINDS, SHELF_KINDS, type PieceKind } from '../../src/games/shape-build/pieces'
import {
  RECIPES,
  RECIPE_LEVELS,
  placeRecipe,
  recipeRoom,
  recipeWidth,
  type Recipe,
} from '../../src/games/shape-build/recipes'

/**
 * Каждая машина из «Что собрать» работает так, как написано на карточке: тест идёт по шагам
 * карточки и ждёт, что каждый шаг случится, — во всех трёх размерах деталей (комната как в игре
 * на iPad 1024×768: пол на 90% высоты, потолок под панелью кнопок, раздвигается под машину).
 */
const SIZES = [11.5, 14, 18] as const

function gameRoom(unitsH: number) {
  const k = 768 / unitsH
  return { floor: unitsH * 0.9, start: { left: 0, right: 1024 / k, top: 110 / k } }
}

type Ctx = {
  world: SandboxWorld
  ids: number[]
  floor: number
  ceiling: number
  time: number
  events: (ActionEvent & { t: number })[]
  goals: number
  start: Map<number, PieceView>
  mem: Record<string, number | boolean>
  id: (kind: PieceKind, nth?: number) => number
  v: (kind: PieceKind, nth?: number) => PieceView
  s: (kind: PieceKind, nth?: number) => PieceView
}

type Step = { wait?: number; act?: (c: Ctx) => void; ok: (c: Ctx) => boolean; within?: number }

function setup(r: Recipe, unitsH: number): Ctx {
  const { floor, start } = gameRoom(unitsH)
  const box = recipeRoom(r, start, floor)
  const world = new SandboxWorld({
    width: box.right,
    height: unitsH,
    floorY: floor,
    ceilingY: box.top,
    leftX: box.left,
    rightX: box.right,
    realistic: false,
    autoStraight: true,
    sticky: true,
    random: () => 0.5,
  })
  const ids = placeRecipe(world, r, { cx: (box.left + box.right) / 2, floor, ceiling: box.top })
  const kinds = ids.map((i) => world.kindOf(i))
  const c: Ctx = {
    world,
    ids,
    floor,
    ceiling: box.top,
    time: 0,
    events: [],
    goals: 0,
    start: new Map(),
    mem: {},
    id: (kind, nth = 0) => {
      const found = ids.filter((_, i) => kinds[i] === kind)[nth]
      if (found === undefined) throw new Error(`нет детали ${kind}#${nth}`)
      return found
    },
    v: (kind, nth = 0) => {
      const id = c.id(kind, nth)
      return world.pieces().find((p) => p.id === id) ?? { ...c.s(kind, nth), y: Infinity }
    },
    s: (kind, nth = 0) => c.start.get(c.id(kind, nth))!,
  }
  world.onAction((e) => c.events.push({ ...e, t: c.time }))
  world.onGoal(() => (c.goals += 1))
  return c
}

function tick(c: Ctx): void {
  c.world.step(1 / 60)
  c.time += 1 / 60
}

function run(c: Ctx, seconds: number): void {
  for (let i = 0; i < Math.round(seconds * 60); i += 1) tick(c)
}

function snapshot(c: Ctx): void {
  c.start = new Map(c.world.pieces().map((p) => [p.id, p]))
}

// ── Что проверяем ──

const ev = (c: Ctx, type: ActionEvent['type'], kind?: PieceKind): boolean =>
  c.events.some((e) => e.type === type && (kind === undefined || e.kind === kind))
const rose = (c: Ctx, kind: PieceKind, d: number, nth = 0): boolean => c.s(kind, nth).y - c.v(kind, nth).y > d
const fell = (c: Ctx, kind: PieceKind, d: number, nth = 0): boolean => c.v(kind, nth).y - c.s(kind, nth).y > d
function moved(c: Ctx, kind: PieceKind, d: number, nth = 0): boolean {
  const a = c.s(kind, nth)
  const b = c.v(kind, nth)
  return Math.hypot(b.x - a.x, b.y - a.y) > d
}
/** Сколько деталей этого вида сбито (сдвинулись или наклонились). */
function knocked(c: Ctx, kind: PieceKind): number {
  return c.ids.filter((id) => {
    if (c.world.kindOf(id) !== kind) return false
    const a = c.start.get(id)!
    const b = c.world.pieces().find((p) => p.id === id)
    return !b || Math.hypot(b.x - a.x, b.y - a.y) > 0.8 || Math.abs(b.angle - a.angle) > 0.5
  }).length
}
const isOn = (c: Ctx, kind: PieceKind, nth = 0): boolean => c.world.isOn(c.id(kind, nth))
const press = (nth = 0) => (c: Ctx) => void c.world.pressButton(c.id('button', nth))
const start = (c: Ctx) => void c.world.start(true)
const push = (c: Ctx) => void c.world.push(c.id('ball'))
/** Оттянуть шар-таран пальцем влево по дуге верёвки и отпустить. */
function drag(c: Ctx): void {
  const ball = c.v('wrecking')
  const rope = c.world.ropes().find((r) => r.id === ball.id)!
  const len = Math.hypot(rope.bx - rope.ax, rope.by - rope.ay)
  const a = 0.75
  c.world.grab([ball.id], ball.x, ball.y)
  c.world.moveGrab(rope.ax - Math.sin(a) * len, rope.ay + Math.cos(a) * len)
  run(c, 0.8)
  c.world.releaseGrab()
}
/** Деталь опустилась низко (до `low` над полом), а потом подлетела выше `high`. */
function bounced(c: Ctx, kind: PieceKind, low: number, high: number): boolean {
  const y = c.v(kind).y
  const key = `low:${kind}`
  if (y > c.floor - low) c.mem[key] = true
  return c.mem[key] === true && y < c.floor - high
}
/** Время, когда условие стало верным в первый раз. */
function firstAt(c: Ctx, key: string, cond: boolean): number | null {
  if (cond && c.mem[key] === undefined) c.mem[key] = c.time
  return typeof c.mem[key] === 'number' ? (c.mem[key] as number) : null
}

const SCRIPTS: Record<string, Step[]> = {
  catapult: [
    { ok: (c) => c.v('stone').y > c.floor - 2.4 },
    { ok: (c) => bounced(c, 'ball', 2, 2.6) },
    { ok: (c) => c.v('ball').y < c.floor - 4 },
  ],
  truck: [
    { act: start, ok: (c) => isOn(c, 'cart') },
    { ok: (c) => moved(c, 'cart', 2) && moved(c, 'olli', 2) && Math.abs(c.v('olli').x - c.v('cart').x) < 0.8 },
    { ok: (c) => moved(c, 'brick', 1) },
  ],
  lamp: [
    { act: press(), ok: (c) => isOn(c, 'lamp') },
    { ok: (c) => isOn(c, 'lamp') },
    { wait: 1, act: press(), ok: (c) => !isOn(c, 'lamp') },
  ],
  rocket: [
    { act: start, ok: (c) => rose(c, 'rocket', 2) && rose(c, 'meow', 2) },
    { ok: (c) => ev(c, 'launch', 'meow') && c.world.isGone(c.id('rocket')) },
    { ok: (c) => bounced(c, 'meow', 2.2, 3.2), within: 5 },
  ],
  slide: [
    { act: push, ok: (c) => !c.world.isParked(c.id('ball')) },
    { ok: (c) => c.v('ball').x > c.v('ramp').x + 1.8 },
    { ok: (c) => knocked(c, 'cube') >= 1 },
  ],
  wrecking: [
    { act: drag, ok: () => true },
    { ok: (c) => c.v('wrecking').x > c.s('wrecking').x },
    { ok: (c) => knocked(c, 'cube') + knocked(c, 'triangle') >= 2 },
  ],
  balloon: [{ ok: (c) => c.world.ties().length === 1 }, { ok: (c) => rose(c, 'cube', 1.5) }],
  needle: [
    { ok: (c) => rose(c, 'balloon', 0.5) },
    { ok: (c) => !c.world.has(c.id('balloon')) || c.v('balloon').y < c.v('pin').y + 1.6 },
    { ok: (c) => !c.world.has(c.id('balloon')) && ev(c, 'pop') },
  ],
  mill: [
    { act: start, ok: (c) => isOn(c, 'fan') },
    { ok: (c) => Math.abs(c.world.spinOf(c.id('mill'))) > 1 },
    { ok: (c) => isOn(c, 'lamp') },
  ],
  pulley: [
    { ok: (c) => fell(c, 'stone', 0.4) },
    { ok: (c) => fell(c, 'stone', 1) },
    { ok: (c) => rose(c, 'ball', 0.8) },
  ],
  scissors: [
    { ok: (c) => c.world.ties().length === 1 },
    { act: start, ok: (c) => ev(c, 'cut') },
    { ok: (c) => rose(c, 'balloon', 2) },
  ],
  cannon: [
    { ok: (c) => c.world.loadedItem(c.id('cannon')) === c.id('ball') },
    { act: start, ok: (c) => moved(c, 'ball', 1.5) },
    { ok: (c) => knocked(c, 'column') + knocked(c, 'dome') >= 1 },
  ],
  'ramp-lamp': [
    { act: push, ok: (c) => !c.world.isParked(c.id('ball')) },
    { ok: (c) => moved(c, 'ball', 1) },
    { ok: (c) => isOn(c, 'lamp') },
  ],
  'gate-cart': [
    { act: press(), ok: (c) => ev(c, 'press') },
    { ok: (c) => c.world.openness(c.id('gate')) > 0.5 && isOn(c, 'cart') },
    { ok: (c) => c.v('cart').x > c.v('gate').x + 0.5 },
    { ok: (c) => knocked(c, 'triangle') >= 1 },
  ],
  pusher: [
    { act: press(), ok: (c) => ev(c, 'press') },
    { ok: (c) => ev(c, 'punch') && moved(c, 'ball', 0.5) },
    { ok: (c) => knocked(c, 'column') + knocked(c, 'dome') >= 1 },
  ],
  trapdoor: [
    { act: press(), ok: (c) => ev(c, 'press') },
    { ok: (c) => isOn(c, 'trapdoor') && fell(c, 'stone', 0.5) },
    { ok: (c) => c.v('stone').y > c.floor - 2.6 },
    { ok: (c) => rose(c, 'ball', 3) },
  ],
  'belt-cart': [
    { act: start, ok: (c) => moved(c, 'stone', 0.5) },
    { ok: (c) => ev(c, 'press'), within: 6 },
    { ok: (c) => isOn(c, 'cart') },
    { ok: (c) => knocked(c, 'arch') + knocked(c, 'cube') + knocked(c, 'triangle') >= 1, within: 5 },
  ],
  'lamps-rocket': [
    { act: press(), ok: (c) => isOn(c, 'lamp', 0) && !isOn(c, 'lamp', 2) },
    {
      ok: (c) => {
        const t = [0, 1, 2].map((n) => firstAt(c, `lamp${n}`, isOn(c, 'lamp', n)))
        return t.every((x) => x !== null) && t[1]! > t[0]! + 0.2 && t[2]! > t[1]! + 0.2
      },
    },
    { ok: (c) => rose(c, 'rocket', 2) },
  ],
  'pipe-hoop': [
    { act: push, ok: (c) => moved(c, 'ball', 1) },
    { ok: (c) => ev(c, 'teleport') },
    { ok: (c) => Math.abs(c.v('ball').x - c.v('pipe', 1).x) < 1 && c.v('ball').y > c.v('pipe', 1).y },
    { ok: (c) => c.goals > 0 },
  ],
  'launcher-hoop': [
    { act: press(), ok: (c) => ev(c, 'press') },
    { ok: (c) => ev(c, 'kick') && rose(c, 'ball', 0.5) },
    { ok: (c) => c.v('ball').y < c.v('hoop').y - 0.5 },
    { ok: (c) => c.goals > 0 },
  ],
  domino: [
    { act: drag, ok: () => true },
    { ok: (c) => Math.abs(c.v('plank', 0).angle - Math.PI / 2) > 0.3 },
    { ok: (c) => Math.abs(c.v('plank', 3).angle - Math.PI / 2) > 0.3 },
    { ok: (c) => isOn(c, 'lamp') },
  ],
  'cannon-gate': [
    { act: press(), ok: (c) => c.world.openness(c.id('gate')) > 0.3 && !isOn(c, 'lamp', 1) && !ev(c, 'fire') },
    { ok: (c) => isOn(c, 'lamp', 0) && isOn(c, 'lamp', 1) && !ev(c, 'fire') },
    { ok: (c) => ev(c, 'fire') && c.v('ball').x > c.v('gate').x + 0.5 },
    { ok: (c) => knocked(c, 'arch') + knocked(c, 'column') + knocked(c, 'dome') >= 1 },
  ],
  'olli-bucket': [
    { act: press(), ok: (c) => ev(c, 'press') },
    { ok: (c) => ev(c, 'punch') && moved(c, 'stone', 0.5) },
    { ok: (c) => fell(c, 'stone', 1.5) },
    { ok: (c) => rose(c, 'olli', 0.8) },
  ],
  'belt-launcher': [
    { act: start, ok: (c) => moved(c, 'stone', 0.5) },
    { ok: (c) => ev(c, 'press'), within: 6 },
    {
      ok: (c) => {
        const t = [0, 1].map((n) => firstAt(c, `lamp${n}`, isOn(c, 'lamp', n)))
        return t.every((x) => x !== null) && t[1]! > t[0]! + 0.2
      },
    },
    { ok: (c) => ev(c, 'kick') && c.goals > 0 },
  ],
  floors: [
    { act: push, ok: (c) => moved(c, 'ball', 1) },
    {
      ok: (c) => {
        const b = c.v('ball')
        const t = c.v('trapdoor')
        const onHatch = ev(c, 'teleport') && Math.abs(b.x - t.x) < 0.8 && b.y < t.y && b.y > t.y - 1.3
        const since = firstAt(c, 'onHatch', onHatch)
        return onHatch && since !== null && c.time - since > 0.5
      },
      within: 6,
    },
    { act: press(), ok: (c) => isOn(c, 'trapdoor') },
    { ok: (c) => c.goals > 0 },
  ],
  'hatch-pipe': [
    { act: press(), ok: (c) => isOn(c, 'trapdoor') },
    { ok: (c) => ev(c, 'teleport') },
    { ok: (c) => c.events.filter((e) => e.type === 'press').length >= 2, within: 6 },
    { ok: (c) => isOn(c, 'lamp') && ev(c, 'kick') && c.goals > 0 },
  ],
  factory: [
    { act: push, ok: (c) => !c.world.isParked(c.id('ball')) && moved(c, 'ball', 1) },
    { ok: (c) => ev(c, 'press') && isOn(c, 'conveyor') },
    { ok: (c) => fell(c, 'stone', 1), within: 6 },
    { ok: (c) => fell(c, 'stone', 2) && rose(c, 'ball', 1, 1) },
  ],
  'scissors-cactus': [
    { act: press(), ok: (c) => ev(c, 'punch') && moved(c, 'ball', 0.5) },
    { ok: (c) => c.events.filter((e) => e.type === 'press').length >= 2 },
    { ok: (c) => ev(c, 'cut') && rose(c, 'balloon', 1) },
    { ok: (c) => !c.world.has(c.id('balloon')) && ev(c, 'pop') },
  ],
  'flying-cannon': [
    { ok: (c) => c.v('cannon').y < c.floor - 4 && c.world.ties().length === 3 },
    { act: press(0), ok: (c) => ev(c, 'fire') },
    { ok: (c) => c.goals > 0 },
    { ok: (c) => isOn(c, 'lamp'), within: 3 },
  ],
  'rocket-mail': [
    { act: start, ok: (c) => rose(c, 'rocket', 2) && rose(c, 'pin', 2) },
    { ok: (c) => ev(c, 'pop') },
    { ok: (c) => c.goals > 0 && ev(c, 'press'), within: 6 },
    { ok: (c) => isOn(c, 'lamp') },
  ],
  'cart-lift': [
    { act: start, ok: (c) => isOn(c, 'lift') },
    { ok: (c) => rose(c, 'cart', 2.5) },
    { ok: (c) => c.v('cart').x > c.v('shelf').x - 1 && c.v('cart').y < c.floor - 3.5 },
    { ok: (c) => isOn(c, 'lamp'), within: 5 },
  ],
  'mill-lift': [
    { act: start, ok: (c) => isOn(c, 'fan') },
    { ok: (c) => Math.abs(c.world.spinOf(c.id('mill'))) > 1 },
    { ok: (c) => rose(c, 'meow', 2.5), within: 6 },
  ],
  'wind-station': [
    { act: start, ok: (c) => isOn(c, 'fan') && moved(c, 'cart', 0.5) },
    { ok: (c) => isOn(c, 'lamp', 0) && c.world.openness(c.id('gate')) < 0.2, within: 6 },
    { ok: (c) => isOn(c, 'lamp', 2) },
    { ok: (c) => c.world.openness(c.id('gate')) > 0.5 },
    { ok: (c) => knocked(c, 'cube') >= 1, within: 6 },
  ],
  'meow-trip': [
    { act: start, ok: (c) => isOn(c, 'cart') && moved(c, 'cart', 1) && Math.abs(c.v('olli').x - c.v('cart').x) < 0.8 },
    { ok: (c) => ev(c, 'press') && isOn(c, 'lift'), within: 6 },
    { ok: (c) => c.events.filter((e) => e.type === 'press').length >= 2 && rose(c, 'rocket', 2) && rose(c, 'meow', 2), within: 5 },
    { ok: (c) => ev(c, 'launch', 'meow') && c.world.isGone(c.id('rocket')) },
    { ok: (c) => bounced(c, 'meow', 2.2, 3.2), within: 5 },
  ],
  'scissors-surprise': [
    { act: press(), ok: (c) => ev(c, 'press') },
    { ok: (c) => ev(c, 'cut') },
    { ok: (c) => c.v('wrecking').y > c.floor - 2.6 },
    { ok: (c) => c.goals > 0 },
  ],
}


/** Позиции деталей — для понятного сообщения, если шаг не случился. */
function where(c: Ctx): string {
  return c.world
    .pieces()
    .map((p) => `${p.kind}(${p.x.toFixed(1)},${p.y.toFixed(1)}${p.on ? ' вкл' : ''})`)
    .join(' ')
}

/** `TRACE=id@размер npx vitest run …` — позиции деталей каждые 0,1 с в файл `TRACE_FILE`. */
const TRACE = process.env.TRACE ?? ''
const TRACE_FILE = process.env.TRACE_FILE ?? ''

function play(r: Recipe, unitsH: number): string | null {
  const c = setup(r, unitsH)
  if (TRACE === `${r.id}@${unitsH}` && TRACE_FILE) {
    writeFileSync(TRACE_FILE, '')
    const step = c.world.step.bind(c.world)
    let n = 0
    c.world.step = (dt: number) => {
      step(dt)
      if (++n % 6 === 0) {
        const links = c.world
          .pieces()
          .filter((p) => p.link || p.extras)
          .map((p) =>
            [p.link, ...(p.extras ?? [])]
              .filter((q) => q)
              .map((q) => `${p.kind}~${q!.x.toFixed(2)},${q!.y.toFixed(2)}`)
              .join(' '),
          )
          .join(' ')
        appendFileSync(TRACE_FILE, `${(n / 60).toFixed(1)}: ${where(c)} | ${links}\n`)
      }
    }
  }
  snapshot(c)
  if (r.action !== 'watch') {
    run(c, 1)
    snapshot(c)
    run(c, 1)
    const early = c.events.find((e) => ['press', 'fire', 'launch', 'cut', 'pop', 'kick', 'punch', 'teleport'].includes(e.type))
    if (early) return `${r.id} @${unitsH}: до первого действия само случилось «${early.type}» (${early.kind})`
    snapshot(c)
  }
  const script = SCRIPTS[r.id]!
  for (const [i, step] of script.entries()) {
    if (step.wait) run(c, step.wait)
    step.act?.(c)
    const until = c.time + (step.within ?? 4)
    let done = step.ok(c)
    while (!done && c.time < until) {
      tick(c)
      done = step.ok(c)
    }
    if (!done) return `${r.id} @${unitsH}: шаг ${i + 1} «${r.steps[i]}» не случился. ${where(c)}`
  }
  return null
}

describe('«Что собрать»: карточки', () => {
  it('четыре уровня, около 30 машин; у каждой шаги, закон и детали из шкафа', () => {
    expect(RECIPE_LEVELS.map((l) => l.title)).toEqual(['Простые', 'Цепочки', 'Этажи', 'Огромные машины'])
    expect(RECIPES.length).toBeGreaterThanOrEqual(28)
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length)
    for (const level of [1, 2, 3, 4] as const) {
      expect(RECIPES.filter((r) => r.level === level).length).toBeGreaterThanOrEqual(3)
    }
    for (const r of RECIPES) {
      expect(r.title.length).toBeGreaterThan(2)
      expect(r.steps.length).toBeGreaterThanOrEqual(2)
      for (const step of r.steps) expect(step.length).toBeGreaterThan(5)
      expect(r.law.length).toBeGreaterThan(30)
      const pieces = r.pieces({ cx: 20, floor: 12, ceiling: 1 })
      expect(new Set(r.kinds), r.id).toEqual(new Set(pieces.map((p) => p.kind)))
      for (const kind of r.kinds) expect(PIECE_KINDS).toContain(kind)
      for (const [a, b] of [...(r.glue ?? []), ...(r.wires ?? []), ...(r.ties ?? [])]) {
        expect(pieces[a], `${r.id}: нет детали ${a}`).toBeDefined()
        expect(pieces[b], `${r.id}: нет детали ${b}`).toBeDefined()
      }
      for (const [balloon] of r.ties ?? []) expect(pieces[balloon]!.kind).toBe('balloon')
    }
  })

  it('шесть машин, которые выбрал владелец, на месте', () => {
    const titles = RECIPES.map((r) => r.title)
    for (const title of ['Летающая пушка', 'Ракета-почтальон', 'Мячик по этажам', 'Путешествие Мяу', 'Ветряная электростанция', 'Ножницы-сюрприз']) {
      expect(titles).toContain(title)
    }
  })

  it('каждая деталь из шкафа работает хотя бы в трёх машинах', () => {
    for (const kind of SHELF_KINDS) {
      const count = RECIPES.filter((r) => r.kinds.includes(kind)).length
      expect(count, kind).toBeGreaterThanOrEqual(3)
    }
  })

  it('у каждой машины тест знает каждый её шаг', () => {
    for (const r of RECIPES) {
      expect(SCRIPTS[r.id], r.id).toBeDefined()
      expect(SCRIPTS[r.id]!.length, r.id).toBe(r.steps.length)
    }
  })

  it('провода ровно как в рецепте: лишних не появляется', () => {
    for (const r of RECIPES) {
      const c = setup(r, 14)
      const want = new Map<number, number[]>()
      for (const [s, t] of r.wires ?? []) want.set(c.ids[s]!, [...(want.get(c.ids[s]!) ?? []), c.ids[t]!])
      for (const id of c.ids) {
        if (!c.world.isSource(id)) continue
        expect(c.world.wiresOf(id), `${r.id}: провода у ${c.world.kindOf(id)}`).toEqual(want.get(id) ?? [])
      }
    }
  })

  it('комната раздвигается под машину: огромной — шире и выше', () => {
    const { floor, start } = gameRoom(11.5)
    for (const r of RECIPES) {
      const box = recipeRoom(r, start, floor)
      expect(box.right - box.left).toBeGreaterThanOrEqual(recipeWidth(r))
      const pieces = r.pieces({ cx: (box.left + box.right) / 2, floor, ceiling: box.top })
      for (const p of pieces) {
        expect(p.x, `${r.id}: ${p.kind}`).toBeGreaterThan(box.left + 0.3)
        expect(p.x, `${r.id}: ${p.kind}`).toBeLessThan(box.right - 0.3)
        expect(p.y, `${r.id}: ${p.kind}`).toBeGreaterThan(box.top)
      }
    }
  })
})

describe('«Что собрать»: каждая машина работает по шагам карточки', () => {
  it.each(RECIPES.flatMap((r) => SIZES.map((h) => [r.id, h] as const)))('%s, размер %s', (id, h) => {
    const r = RECIPES.find((x) => x.id === id)!
    const failure = play(r, h)
    if (failure) throw new Error(failure)
  })
})
