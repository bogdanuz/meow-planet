import { getPieceSpec, HOOP_SCALE, SHELF_LENGTH, type PieceKind } from './pieces'
import type { AddExtra, SandboxWorld } from './physics'

/**
 * «Как играть» → «Что собрать» (решения владельца 02.10.2026): готовые машины в четырёх уровнях —
 * «Простые», «Цепочки», «Этажи», «Огромные машины». У каждой шаги по порядку и закон простыми словами.
 * «Построить» ставит машину в комнату; огромной машине комната раздвигается вширь и вверх.
 * Каждый шаг каждой машины проверен в физике во всех трёх размерах деталей
 * (`tests/unit/sandbox-recipes.test.ts`).
 */

export type RecipeRoom = {
  /** Середина комнаты. */
  cx: number
  /** Уровень пола. */
  floor: number
  /** Потолок (шарики упираются в него, верёвка шара висит от него). */
  ceiling: number
}

export type RecipePiece = { kind: PieceKind; x: number; y: number; extra?: AddExtra }

export type RecipeLevel = 1 | 2 | 3 | 4

/**
 * Что сделать после «Построить»: `start` — «Пуск!», `press` — нажать красную кнопку,
 * `push` — толкнуть мячик пальцем, `drag` — оттянуть и отпустить, `watch` — заработает само.
 */
export type RecipeAction = 'start' | 'press' | 'push' | 'drag' | 'watch'

type Pair = readonly [number, number]

export type Recipe = {
  id: string
  title: string
  accent: string
  level: RecipeLevel
  /** Картинки на карточке — иконки деталей из шкафа. */
  kinds: readonly PieceKind[]
  /** Что происходит по шагам — для взрослого. Тест проверяет каждый шаг по порядку. */
  steps: readonly string[]
  /** Какой закон работает — простыми словами. */
  law: string
  action: RecipeAction
  /** Ширина комнаты в кубиках, чтобы машина влезла. */
  minWidth?: number
  /** Высота от пола до потолка, которая нужна машине (шарики под потолком, верёвка шара). */
  minHeight?: number
  /** Склеить детали (номера в `pieces`). */
  glue?: readonly Pair[]
  /** Провода «источник → механизм» (номера в `pieces`). Других проводов нет. */
  wires?: readonly Pair[]
  /** Привязать шарик к детали: `[шарик, деталь]`. */
  ties?: readonly Pair[]
  pieces: (room: RecipeRoom) => RecipePiece[]
}

export const RECIPE_LEVELS: readonly { level: RecipeLevel; title: string; lead: string }[] = [
  { level: 1, title: 'Простые', lead: 'Одна деталь — один закон природы.' },
  { level: 2, title: 'Цепочки', lead: 'Одно движение запускает следующее.' },
  { level: 3, title: 'Этажи', lead: 'Машина работает и внизу, и наверху.' },
  { level: 4, title: 'Огромные машины', lead: 'Длинная цепочка на всю комнату.' },
]

/** Центр детали, которая стоит на `base` (по умолчанию — на полу). */
function on(kind: PieceKind, base: number, size = 1): number {
  return base - (getPieceSpec(kind).h * size) / 2
}

function tower(x: number, base: number, count: number, kind: PieceKind = 'cube', loose = false): RecipePiece[] {
  const h = getPieceSpec(kind).h
  return Array.from({ length: count }, (_, i) => ({
    kind,
    x,
    y: base - h / 2 - i * h,
    ...(loose ? { extra: { loose: true } } : {}),
  }))
}

const H = (kind: PieceKind): number => getPieceSpec(kind).h
const CUBE_H = H('cube')
const COLUMN_H = H('column')
/** Сколько площадка подъёмника проезжает вверх (внизу её верх на 0,76 над полом). */
const LIFT_TRAVEL = getPieceSpec('lift').link?.travel ?? 3.2
/** Верх подскакивающей площадки пружины-катапульты над её центром. */
const LAUNCHER_PLATE = 0.28
/** Верх тележки над полом (на неё сажают Олли и Мяу). */
const CART_DECK = 0.8

/** Мячик в дуле пушки, которая стоит в `(x, y)`. */
function cannonBall(x: number, y: number, flip = false): RecipePiece {
  const at = getPieceSpec('cannon').muzzle!.at
  return { kind: 'ball', x: x + at.x * (flip ? -1 : 1), y: y + at.y }
}

/** Груз на носу ракеты, которая стоит в `(x, y)`. */
function cargo(kind: PieceKind, x: number, y: number): RecipePiece {
  const spec = getPieceSpec(kind)
  return { kind, x, y: y - 0.8 - 0.8 * (Math.max(spec.w, spec.h) / 2) }
}

/** Центр кольца, чтобы середина его отверстия пришлась на `x`. */
function hoopAt(x: number, flip = false, size = 1): number {
  return x - (flip ? -1 : 1) * 0.075 * HOOP_SCALE * size
}

export const RECIPES: readonly Recipe[] = [
  // ── Простые ──
  {
    id: 'catapult',
    title: 'Катапульта',
    accent: '#f7c95c',
    level: 1,
    kinds: ['seesaw', 'stone', 'ball'],
    steps: ['Камень падает на край качелей', 'Другой край подскакивает', 'Мячик взлетает вверх'],
    law: 'Рычаг: один край доски идёт вниз — другой поднимается. Тяжёлый камень подбрасывает лёгкий мячик.',
    action: 'watch',
    pieces: ({ cx, floor }) => [
      { kind: 'seesaw', x: cx, y: on('seesaw', floor) },
      { kind: 'ball', x: cx - 2, y: floor - 2.2 },
      { kind: 'stone', x: cx + 2.2, y: floor - 6 },
    ],
  },
  {
    id: 'truck',
    title: 'Грузовик',
    accent: '#8cc8ee',
    level: 1,
    kinds: ['cart', 'olli', 'brick'],
    steps: ['Нажмите «Пуск!»', 'Мотор крутит колёса — тележка везёт Олли', 'Тележка толкает кирпичик'],
    law: 'Мотор крутит колёса, колёса отталкиваются от пола — и тележка едет. Всё, что на ней, едет вместе с ней.',
    action: 'start',
    pieces: ({ cx, floor }) => [
      { kind: 'cart', x: cx - 4, y: on('cart', floor) },
      { kind: 'olli', x: cx - 4, y: on('olli', floor - CART_DECK) },
      { kind: 'brick', x: cx + 1.1, y: on('brick', floor) },
    ],
  },
  {
    id: 'lamp',
    title: 'Кнопка и лампочка',
    accent: '#f7c95c',
    level: 1,
    kinds: ['button', 'lamp'],
    steps: ['Нажмите на красную кнопку', 'Лампочка загорается', 'Нажмите ещё раз — лампочка гаснет'],
    law: 'Кнопка-выключатель: нажали — включилось, нажали снова — выключилось. Сигнал бежит по проводу.',
    action: 'press',
    wires: [[0, 1]],
    pieces: ({ cx, floor }) => [
      { kind: 'button', x: cx - 1.5, y: on('button', floor) },
      { kind: 'lamp', x: cx + 0.6, y: on('lamp', floor) },
    ],
  },
  {
    id: 'rocket',
    title: 'Ракета с Мяу',
    accent: '#f28b7d',
    level: 1,
    kinds: ['rocket', 'meow', 'spring'],
    steps: [
      'Нажмите «Пуск!» — огонь толкает ракету вверх',
      'У потолка ракета отпускает Мяу и улетает',
      'Мяу падает на батут и подпрыгивает',
    ],
    law: 'Огонь бьёт вниз — ракета летит вверх. Груз летит дальше сам, а потом Земля тянет его вниз.',
    action: 'start',
    pieces: ({ cx, floor }) => {
      const ry = on('rocket', floor - H('spring'))
      return [
        { kind: 'spring', x: cx, y: on('spring', floor) },
        { kind: 'rocket', x: cx, y: ry, extra: { parked: true } },
        cargo('meow', cx, ry),
      ]
    },
  },
  {
    id: 'slide',
    title: 'Горка',
    accent: '#f6b48a',
    level: 1,
    kinds: ['brick', 'ramp', 'ball', 'cube'],
    steps: ['Нажмите на мячик', 'Мячик катится с горки всё быстрее', 'Мячик сбивает башню'],
    law: 'Земля тянет мячик вниз, и по склону он разгоняется. Чем выше горка, тем сильнее удар внизу.',
    action: 'push',
    pieces: ({ cx, floor }) => {
      const base = floor - 2 * H('brick')
      const rx = cx - 3.5
      return [
        ...tower(rx - 0.3, floor, 2, 'brick'),
        { kind: 'ramp', x: rx, y: on('ramp', base) },
        { kind: 'ball', x: rx - 0.91, y: base - 1.6, extra: { parked: true } },
        ...tower(rx + 6, floor, 3, 'cube', true),
      ]
    },
  },
  {
    id: 'wrecking',
    title: 'Шар-таран',
    accent: '#c9b8ad',
    level: 1,
    kinds: ['wrecking', 'brick', 'cube', 'triangle'],
    steps: ['Оттяните шар пальцем и отпустите', 'Шар качается на верёвке', 'Шар сбивает башню'],
    law: 'Маятник: шар на верёвке качается туда-сюда. Тяжёлый и быстрый — бьёт сильно.',
    action: 'drag',
    pieces: ({ cx, floor }) => [
      { kind: 'wrecking', x: cx - 1.5, y: floor - 3.1 },
      { kind: 'brick', x: cx + 1.2, y: on('brick', floor) },
      ...tower(cx + 0.6, floor - H('brick'), 2),
      { kind: 'triangle', x: cx + 0.6, y: on('triangle', floor - H('brick') - 2 * CUBE_H) },
    ],
  },
  {
    id: 'balloon',
    title: 'Шарик-подъёмник',
    accent: '#f2b8b5',
    level: 1,
    kinds: ['balloon', 'cube'],
    steps: ['Шарик касается кубика и привязывается', 'Кубик поднимается к потолку'],
    law: 'Шарик легче воздуха и тянет вверх. Тянет сильнее, чем Земля тянет кубик вниз, — кубик летит.',
    action: 'watch',
    pieces: ({ cx, floor }) => [
      { kind: 'cube', x: cx, y: on('cube', floor) },
      { kind: 'balloon', x: cx, y: floor - CUBE_H - 0.5 },
    ],
  },
  {
    id: 'needle',
    title: 'Иголка',
    accent: '#8fd19e',
    level: 1,
    kinds: ['balloon', 'pin', 'plank', 'column'],
    steps: ['Шарик летит вверх', 'Под мостиком его ждёт кактус', 'Пух — шарик лопнул!'],
    law: 'Шарик тянет вверх, а острая колючка протыкает тонкую резинку.',
    action: 'watch',
    glue: [
      [0, 1],
      [2, 3],
      [1, 4],
      [3, 4],
      [5, 4],
    ],
    pieces: ({ cx, floor }) => {
      const plankY = floor - 2 * COLUMN_H - 0.21
      return [
        ...tower(cx - 2.1, floor, 2, 'column'),
        ...tower(cx + 2.1, floor, 2, 'column'),
        { kind: 'plank', x: cx, y: plankY },
        { kind: 'pin', x: cx, y: plankY + 0.21 + 0.65, extra: { angle: Math.PI } },
        { kind: 'balloon', x: cx, y: floor - 0.8 },
      ]
    },
  },
  {
    id: 'mill',
    title: 'Ветряная мельница',
    accent: '#8fd19e',
    level: 1,
    kinds: ['fan', 'mill', 'lamp'],
    steps: ['Нажмите «Пуск!» — вентилятор дует', 'Ветер крутит лопасти мельницы', 'Мельница крутится — лампочка горит'],
    law: 'Ветер — это движущийся воздух, он толкает лопасти. Крутящаяся мельница даёт сигнал по проводу.',
    action: 'start',
    wires: [[1, 2]],
    pieces: ({ cx, floor }) => [
      { kind: 'fan', x: cx - 3, y: on('fan', floor) },
      { kind: 'mill', x: cx + 0.5, y: on('mill', floor) },
      { kind: 'lamp', x: cx + 2.8, y: on('lamp', floor) },
    ],
  },
  {
    id: 'pulley',
    title: 'Ведёрки',
    accent: '#8cc8ee',
    level: 1,
    kinds: ['pulley', 'stone', 'ball'],
    steps: ['Камень падает в ведро', 'Ведро с камнем опускается', 'Другое ведро с мячиком поднимается'],
    law: 'Блок: через колёсико идёт одна верёвка. Одно ведро опускается — другое поднимается.',
    action: 'watch',
    pieces: ({ cx, floor }) => {
      const y = floor - 6.2
      return [
        { kind: 'pulley', x: cx, y },
        { kind: 'stone', x: cx - 0.99, y: y + 1.7 },
        { kind: 'ball', x: cx + 0.99, y: y + 2.9 },
      ]
    },
  },
  {
    id: 'scissors',
    title: 'Ножницы',
    accent: '#b9a3e3',
    level: 1,
    kinds: ['scissors', 'balloon', 'stone'],
    steps: ['Шарик привязан ниточкой к камню', 'Нажмите «Пуск!» — ножницы режут ниточку', 'Шарик улетает к потолку'],
    law: 'Ниточка держала шарик внизу. Перерезали — его больше ничто не держит, и он летит вверх.',
    action: 'start',
    ties: [[1, 0]],
    pieces: ({ cx, floor }) => [
      { kind: 'stone', x: cx, y: on('stone', floor) },
      { kind: 'balloon', x: cx, y: floor - H('stone') - 1.5 },
      { kind: 'scissors', x: cx + 0.8, y: floor - H('stone') - 0.45 },
    ],
  },
  {
    id: 'cannon',
    title: 'Пушка',
    accent: '#f6b48a',
    level: 1,
    kinds: ['cannon', 'ball', 'column', 'dome'],
    steps: ['Мячик лежит в дуле пушки', 'Нажмите «Пуск!» — пушка стреляет', 'Мячик сбивает башню'],
    law: 'Пушка резко толкает мячик. Быстрый мячик бьёт сильно и сбивает башню.',
    action: 'start',
    pieces: ({ cx, floor }) => {
      const y = on('cannon', floor)
      return [
        { kind: 'cannon', x: cx - 5, y },
        cannonBall(cx - 5, y),
        ...tower(cx + 1.5, floor, 2, 'column'),
        { kind: 'dome', x: cx + 1.5, y: on('dome', floor - 2 * COLUMN_H) },
      ]
    },
  },

  // ── Цепочки ──
  {
    id: 'ramp-lamp',
    title: 'Горка и лампочка',
    accent: '#f7c95c',
    level: 2,
    kinds: ['brick', 'ramp', 'ball', 'button', 'lamp'],
    steps: ['Нажмите на мячик', 'Мячик скатывается с горки', 'Падает на кнопку — лампочка горит'],
    law: 'Земля тянет всё вниз, поэтому мячик сам катится с горки. Тяжёлый мячик нажимает кнопку.',
    action: 'push',
    wires: [[3, 4]],
    pieces: ({ cx, floor }) => {
      const base = floor - H('brick')
      const rx = cx - 2.2
      return [
        { kind: 'brick', x: rx - 0.3, y: on('brick', floor) },
        { kind: 'ramp', x: rx, y: on('ramp', base) },
        { kind: 'ball', x: rx - 0.91, y: base - 1.6, extra: { parked: true } },
        { kind: 'button', x: rx + 2.7, y: on('button', floor) },
        { kind: 'lamp', x: rx + 4.6, y: on('lamp', floor) },
      ]
    },
  },
  {
    id: 'gate-cart',
    title: 'Ворота и тележка',
    accent: '#e2b27a',
    level: 2,
    kinds: ['button', 'gate', 'cart', 'arch', 'triangle'],
    steps: ['Нажмите на кнопку', 'Ворота поднимаются, тележка едет', 'Тележка проезжает в ворота', 'И сбивает домик'],
    law: 'Одна кнопка — два провода: открывает ворота и включает мотор тележки сразу.',
    action: 'press',
    wires: [
      [0, 1],
      [0, 2],
    ],
    pieces: ({ cx, floor }) => [
      { kind: 'button', x: cx - 8, y: on('button', floor) },
      { kind: 'gate', x: cx - 1.5, y: on('gate', floor), extra: { pinned: true } },
      { kind: 'cart', x: cx - 5.6, y: on('cart', floor) },
      { kind: 'arch', x: cx + 2.6, y: on('arch', floor), extra: { loose: true } },
      { kind: 'triangle', x: cx + 2.6, y: on('triangle', floor - H('arch')), extra: { loose: true } },
    ],
  },
  {
    id: 'pusher',
    title: 'Толкатель',
    accent: '#f28b7d',
    level: 2,
    kinds: ['button', 'pusher', 'ball', 'column', 'dome'],
    steps: ['Нажмите на кнопку', 'Перчатка толкает мячик', 'Мячик катится и сбивает башню'],
    law: 'Толчок передаётся дальше: перчатка — мячику, мячик — башне.',
    action: 'press',
    wires: [[0, 1]],
    pieces: ({ cx, floor }) => [
      { kind: 'button', x: cx - 6, y: on('button', floor) },
      { kind: 'pusher', x: cx - 3.8, y: on('pusher', floor) },
      { kind: 'ball', x: cx - 1.75, y: on('ball', floor) },
      ...tower(cx + 2.2, floor, 2, 'column', true),
      { kind: 'dome', x: cx + 2.2, y: on('dome', floor - 2 * COLUMN_H), extra: { loose: true } },
    ],
  },
  {
    id: 'trapdoor',
    title: 'Люк и качели',
    accent: '#e2b27a',
    level: 2,
    kinds: ['button', 'trapdoor', 'stone', 'seesaw', 'ball'],
    steps: ['Нажмите на кнопку', 'Люк открывается — камень падает', 'Камень бьёт по краю качелей', 'Мячик взлетает вверх'],
    law: 'Люк держал камень. Нет опоры — камень падает, а качели-рычаг подбрасывают мячик.',
    action: 'press',
    minHeight: 7,
    wires: [[0, 1]],
    pieces: ({ cx, floor }) => {
      const ty = floor - 5.6
      return [
        { kind: 'button', x: cx - 5, y: on('button', floor) },
        { kind: 'trapdoor', x: cx - 1.1, y: ty },
        { kind: 'stone', x: cx - 1.1, y: on('stone', ty - 0.15) },
        { kind: 'seesaw', x: cx + 1, y: on('seesaw', floor) },
        { kind: 'ball', x: cx + 3, y: floor - 2.2 },
      ]
    },
  },
  {
    id: 'belt-cart',
    title: 'Лента и тележка',
    accent: '#8cc8ee',
    level: 2,
    kinds: ['column', 'conveyor', 'stone', 'button', 'cart', 'arch', 'cube', 'triangle'],
    steps: ['Нажмите «Пуск!» — лента везёт камень', 'Камень падает на кнопку', 'Кнопка включает тележку', 'Тележка сбивает башню'],
    law: 'Тяжёлый камень сам нажимает кнопку. То, к чему идёт провод, ждёт свой сигнал.',
    action: 'start',
    wires: [[4, 5]],
    pieces: ({ cx, floor }) => {
      const left = cx - 7
      const top = floor - COLUMN_H
      return [
        { kind: 'column', x: left + 0.9, y: on('column', floor) },
        { kind: 'column', x: left + 3.3, y: on('column', floor) },
        { kind: 'conveyor', x: left + 2.1, y: on('conveyor', top) },
        { kind: 'stone', x: left + 0.9, y: top - H('conveyor') - 0.5 },
        { kind: 'button', x: cx - 2.2, y: on('button', floor) },
        { kind: 'cart', x: cx - 0.1, y: on('cart', floor) },
        { kind: 'arch', x: cx + 4.6, y: on('arch', floor), extra: { loose: true } },
        { kind: 'cube', x: cx + 4.6, y: on('cube', floor - H('arch')), extra: { loose: true } },
        { kind: 'triangle', x: cx + 4.6, y: on('triangle', floor - H('arch') - CUBE_H), extra: { loose: true } },
      ]
    },
  },
  {
    id: 'lamps-rocket',
    title: 'Лампочки по очереди',
    accent: '#f7c95c',
    level: 2,
    kinds: ['button', 'lamp', 'rocket'],
    steps: ['Нажмите на кнопку', 'Лампочки загораются одна за другой', 'Последняя лампочка запускает ракету'],
    law: 'Сигнал бежит по проводам от лампочки к лампочке — как эстафета.',
    action: 'press',
    wires: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    pieces: ({ cx, floor }) => [
      { kind: 'button', x: cx - 4.5, y: on('button', floor) },
      { kind: 'lamp', x: cx - 2.6, y: on('lamp', floor) },
      { kind: 'lamp', x: cx - 1.3, y: on('lamp', floor) },
      { kind: 'lamp', x: cx, y: on('lamp', floor) },
      { kind: 'rocket', x: cx + 2, y: on('rocket', floor) },
    ],
  },
  {
    id: 'pipe-hoop',
    title: 'Труба-телепорт',
    accent: '#8fd19e',
    level: 2,
    kinds: ['chute', 'ball', 'pipe', 'hoop'],
    steps: ['Нажмите на мячик — он катится по жёлобу', 'Мячик падает в трубу', 'И выпадает из другой трубы', 'Прямо в кольцо!'],
    law: 'Две трубы одного цвета — пара: что упало в одну, выпадает из другой. Дальше мячик падает сам.',
    action: 'push',
    minHeight: 8,
    pieces: ({ cx, floor }) => {
      const cy = floor - 3.4
      return [
        { kind: 'chute', x: cx - 4.5, y: cy },
        { kind: 'ball', x: cx - 5.6, y: cy - 1.0, extra: { parked: true } },
        { kind: 'pipe', x: cx - 1.4, y: floor - 1.3 },
        { kind: 'pipe', x: cx + 3.4, y: floor - 6.6 },
        { kind: 'hoop', x: hoopAt(cx + 3.4), y: floor - 3.6 },
      ]
    },
  },
  {
    id: 'launcher-hoop',
    title: 'Пружина и кольцо',
    accent: '#f6b48a',
    level: 2,
    kinds: ['button', 'launcher', 'ball', 'hoop'],
    steps: ['Нажмите на кнопку', 'Пружина подбрасывает мячик', 'Мячик взлетает выше кольца', 'И падает прямо в кольцо'],
    law: 'Пружина резко распрямляется и толкает мячик вверх. Наверху он останавливается, и Земля тянет его вниз.',
    action: 'press',
    minHeight: 7,
    wires: [[0, 1]],
    pieces: ({ cx, floor }) => {
      const ly = on('launcher', floor)
      return [
        { kind: 'button', x: cx - 3, y: on('button', floor) },
        { kind: 'launcher', x: cx + 1, y: ly },
        { kind: 'ball', x: cx + 1, y: ly - LAUNCHER_PLATE - 0.56 },
        { kind: 'hoop', x: hoopAt(cx + 1), y: floor - 3.8 },
      ]
    },
  },
  {
    id: 'domino',
    title: 'Домино',
    accent: '#c9b8ad',
    level: 2,
    kinds: ['wrecking', 'plank', 'button', 'lamp'],
    steps: ['Оттяните шар и отпустите', 'Шар роняет первую доску', 'Доски падают друг на друга', 'Последняя нажимает кнопку — лампочка горит'],
    law: 'Цепная реакция: каждая падающая доска толкает следующую.',
    action: 'drag',
    wires: [[5, 6]],
    pieces: ({ cx, floor }) => [
      { kind: 'wrecking', x: cx - 6, y: floor - 3.9 },
      ...[0, 1, 2, 3].map((i) => ({ kind: 'plank' as const, x: cx - 4.6 + i * 2.6, y: floor - 2.4, extra: { angle: Math.PI / 2 } })),
      { kind: 'button', x: cx + 6.8, y: on('button', floor) },
      { kind: 'lamp', x: cx + 9, y: on('lamp', floor) },
    ],
  },

  {
    id: 'cannon-gate',
    title: 'Пушка и ворота',
    accent: '#f6b48a',
    level: 2,
    kinds: ['button', 'lamp', 'cannon', 'ball', 'gate', 'arch', 'column', 'dome'],
    steps: [
      'Нажмите на кнопку — ворота поднимаются',
      'Лампочки загораются: раз, два',
      'Пушка стреляет сквозь ворота',
      'Мячик сбивает башню',
    ],
    law: 'Лампочки — как часы: пока они загораются, ворота успевают открыться. Сначала одно, потом другое.',
    action: 'press',
    wires: [
      [0, 5],
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    pieces: ({ cx, floor }) => {
      const x = cx - 3
      const y = floor - 1
      const a = 0.4
      const at = getPieceSpec('cannon').muzzle!.at
      const mx = x + at.x * Math.cos(a) - at.y * Math.sin(a)
      const my = y + at.x * Math.sin(a) + at.y * Math.cos(a)
      return [
        { kind: 'button', x: cx - 7.5, y: on('button', floor) },
        { kind: 'lamp', x: cx - 5.8, y: on('lamp', floor) },
        { kind: 'lamp', x: cx - 4.7, y: on('lamp', floor) },
        { kind: 'cannon', x, y, extra: { angle: a, pinned: true } },
        { kind: 'ball', x: mx, y: my },
        { kind: 'gate', x: mx + 1.6, y: on('gate', floor), extra: { pinned: true } },
        { kind: 'arch', x: cx + 3.5, y: on('arch', floor), extra: { loose: true } },
        { kind: 'column', x: cx + 3.5, y: on('column', floor - H('arch')), extra: { loose: true } },
        { kind: 'dome', x: cx + 3.5, y: on('dome', floor - H('arch') - COLUMN_H), extra: { loose: true } },
      ]
    },
  },
  {
    id: 'olli-bucket',
    title: 'Олли на ведёрке',
    accent: '#e2b27a',
    level: 2,
    kinds: ['button', 'pusher', 'shelf', 'stone', 'pulley', 'olli'],
    steps: ['Нажмите на кнопку', 'Перчатка сталкивает камень в ведро', 'Ведро с камнем опускается', 'Ведро с Олли едет вверх'],
    law: 'Блок: одна верёвка на два ведра. Тяжёлый камень опускает своё ведро, а лёгкий Олли едет вверх.',
    action: 'press',
    wires: [[0, 1]],
    pieces: ({ cx, floor }) => {
      const px = cx + 2
      const y = floor - 6.2
      const top = y + 2.3
      const sx = px - 1.9
      return [
        { kind: 'button', x: px - 7, y: on('button', floor) },
        { kind: 'pusher', x: sx - 2.17, y: on('pusher', top) },
        { kind: 'shelf', x: px - 3.3, y: top + 0.15 },
        { kind: 'stone', x: sx, y: on('stone', top) },
        { kind: 'pulley', x: px, y },
        { kind: 'olli', x: px + 0.99, y: y + 2.8 },
      ]
    },
  },
  {
    id: 'belt-launcher',
    title: 'Лента и пружина',
    accent: '#7fb7e6',
    level: 2,
    kinds: ['column', 'conveyor', 'stone', 'button', 'lamp', 'launcher', 'ball', 'hoop'],
    steps: [
      'Нажмите «Пуск!» — лента везёт камень',
      'Камень падает на кнопку',
      'Лампочки загораются по очереди',
      'Пружина подбрасывает мячик — прямо в кольцо',
    ],
    law: 'Камень нажимает кнопку своим весом, сигнал бежит по лампочкам, а пружина резко распрямляется.',
    action: 'start',
    minHeight: 7,
    wires: [
      [4, 5],
      [5, 6],
      [6, 7],
    ],
    pieces: ({ cx, floor }) => {
      const left = cx - 8.2
      const top = floor - COLUMN_H
      const lx = left + 10.4
      const ly = on('launcher', floor)
      return [
        { kind: 'column', x: left + 0.9, y: on('column', floor) },
        { kind: 'column', x: left + 3.3, y: on('column', floor) },
        { kind: 'conveyor', x: left + 2.1, y: on('conveyor', top) },
        { kind: 'stone', x: left + 0.9, y: top - H('conveyor') - 0.5 },
        { kind: 'button', x: left + 4.8, y: on('button', floor) },
        { kind: 'lamp', x: left + 6.6, y: on('lamp', floor) },
        { kind: 'lamp', x: left + 7.8, y: on('lamp', floor) },
        { kind: 'launcher', x: lx, y: ly },
        { kind: 'ball', x: lx, y: ly - LAUNCHER_PLATE - 0.56 },
        { kind: 'hoop', x: hoopAt(lx), y: floor - 3.8 },
      ]
    },
  },

  // ── Этажи ──
  {
    id: 'floors',
    title: 'Мячик по этажам',
    accent: '#8cc8ee',
    level: 3,
    kinds: ['chute', 'pipe', 'trapdoor', 'button', 'spring', 'hoop', 'ball'],
    steps: [
      'Нажмите на мячик — он катится по жёлобу',
      'Падает в трубу и выпадает из другой — на полку с люком',
      'Нажмите на кнопку — люк открывается',
      'Мячик падает на батут и прыгает в кольцо',
    ],
    law: 'Три этажа: жёлоб, труба-телепорт, люк. Земля тянет мячик вниз, а батут подбрасывает его.',
    action: 'push',
    minHeight: 11.5,
    wires: [[5, 4]],
    pieces: ({ cx, floor }) => {
      const cy = floor - 9.4
      const tx = cx + 0.5
      const ty = floor - 6
      return [
        { kind: 'chute', x: cx - 5, y: cy },
        { kind: 'ball', x: cx - 6.1, y: cy - 1.0, extra: { parked: true } },
        { kind: 'pipe', x: cx - 2, y: floor - 7.8 },
        { kind: 'pipe', x: tx, y: ty - 2.6 },
        { kind: 'trapdoor', x: tx, y: ty },
        { kind: 'button', x: cx - 5, y: on('button', floor) },
        { kind: 'spring', x: tx, y: floor - 0.9, extra: { angle: 0.2, pinned: true } },
        { kind: 'hoop', x: hoopAt(tx + 5), y: floor - 4 },
      ]
    },
  },
  {
    id: 'hatch-pipe',
    title: 'Люк, труба и жёлоб',
    accent: '#8cc8ee',
    level: 3,
    kinds: ['button', 'trapdoor', 'ball', 'pipe', 'chute', 'launcher', 'hoop', 'lamp'],
    steps: [
      'Нажмите на кнопку — люк открывается',
      'Мячик падает в трубу и выпадает из другой',
      'Катится по жёлобу и нажимает кнопку',
      'Лампочка загорается — пружина подбрасывает второй мячик в кольцо',
    ],
    law: 'Мячик всё время падает вниз — по жёлобу, сквозь трубу, на кнопку. Земля тянет его на каждом этаже.',
    action: 'press',
    minHeight: 8,
    wires: [
      [0, 1],
      [6, 10],
      [10, 7],
    ],
    pieces: ({ cx, floor }) => {
      const tx = cx + 7.2
      const ty = floor - 5.2
      const lx = cx + 3.8
      const ly = on('launcher', floor)
      return [
        { kind: 'button', x: cx - 8.2, y: on('button', floor) },
        { kind: 'trapdoor', x: tx, y: ty },
        { kind: 'ball', x: tx, y: on('ball', ty - 0.15) },
        { kind: 'pipe', x: tx, y: ty + 2.8 },
        { kind: 'pipe', x: cx - 5.6, y: floor - 6.6 },
        { kind: 'chute', x: cx - 4.5, y: floor - 3.4 },
        { kind: 'button', x: cx + 0.7, y: on('button', floor), extra: { pinned: true } },
        { kind: 'launcher', x: lx, y: ly, extra: { pinned: true } },
        { kind: 'ball', x: lx, y: ly - LAUNCHER_PLATE - 0.56 },
        { kind: 'hoop', x: hoopAt(lx), y: floor - 3.8 },
        { kind: 'lamp', x: cx - 1.5, y: on('lamp', floor) },
      ]
    },
  },
  {
    id: 'flying-cannon',
    title: 'Летающая пушка',
    accent: '#f2b8b5',
    level: 3,
    kinds: ['balloon', 'cannon', 'ball', 'hoop', 'button', 'lamp'],
    steps: ['Пушка висит под потолком на трёх шариках', 'Нажмите на кнопку — пушка стреляет', 'Мячик пролетает сквозь кольцо', 'Падает на кнопку — лампочка горит'],
    law: 'Три шарика вместе тянут вверх сильнее, чем Земля тянет пушку вниз, — пушка летает.',
    action: 'press',
    minHeight: 8.5,
    wires: [
      [0, 1],
      [6, 8],
    ],
    ties: [
      [2, 1],
      [3, 1],
      [4, 1],
    ],
    pieces: ({ cx, floor, ceiling }) => {
      const x = cx - 5
      const y = ceiling + 2.7
      const mx = x + getPieceSpec('cannon').muzzle!.at.x
      return [
        { kind: 'button', x: x - 0.4, y: on('button', floor) },
        { kind: 'cannon', x, y },
        ...[-1.2, 0, 1.2].map((dx) => ({ kind: 'balloon' as const, x: x + dx, y: ceiling + 0.62 })),
        cannonBall(x, y),
        { kind: 'button', x: mx + 8.8, y: on('button', floor) },
        { kind: 'hoop', x: hoopAt(mx + 8.8), y: y + 0.5 },
        { kind: 'lamp', x: mx + 10.8, y: on('lamp', floor) },
      ]
    },
  },
  {
    id: 'rocket-mail',
    title: 'Ракета-почтальон',
    accent: '#f28b7d',
    level: 3,
    kinds: ['rocket', 'pin', 'balloon', 'stone', 'hoop', 'button', 'lamp'],
    steps: ['Нажмите «Пуск!» — ракета везёт кактус', 'Кактус лопает шарик', 'Камень падает сквозь кольцо на кнопку', 'Лампочка горит'],
    law: 'Три шарика держали камень в воздухе. Один лопнул — двух мало, и Земля тянет камень вниз.',
    action: 'start',
    minHeight: 9,
    wires: [[7, 8]],
    ties: [
      [1, 0],
      [2, 0],
      [3, 0],
    ],
    pieces: ({ cx, floor, ceiling }) => {
      const sx = cx
      const ry = on('rocket', floor)
      return [
        { kind: 'stone', x: sx, y: ceiling + 2.3 },
        ...[-1.2, 0, 1.2].map((dx) => ({ kind: 'balloon' as const, x: sx + dx, y: ceiling + 0.7 })),
        { kind: 'rocket', x: sx + 2, y: ry },
        cargo('pin', sx + 2, ry),
        { kind: 'hoop', x: hoopAt(sx - 0.5, true, 1.3), y: floor - 3.6, extra: { flip: true, size: 1.3 } },
        { kind: 'button', x: sx - 0.5, y: on('button', floor) },
        { kind: 'lamp', x: sx - 2.6, y: on('lamp', floor) },
      ]
    },
  },
  {
    id: 'cart-lift',
    title: 'Тележка на второй этаж',
    accent: '#b9a3e3',
    level: 3,
    kinds: ['lift', 'cart', 'column', 'shelf', 'button', 'lamp'],
    steps: ['Нажмите «Пуск!»', 'Подъёмник везёт тележку наверх', 'Наверху тележка съезжает на полку', 'Врезается в кнопку — лампочка горит'],
    law: 'Подъёмник поднимает тележку вместе с мотором. Внизу ей мешают цилиндры, а наверху путь свободен — и она съезжает на полку.',
    action: 'start',
    glue: [
      [2, 3],
      [3, 6],
      [4, 5],
      [5, 6],
    ],
    wires: [[7, 8]],
    pieces: ({ cx, floor }) => {
      const lx = cx - 4
      const deck = floor - 0.76
      const top = deck - LIFT_TRAVEL + 0.06
      const left = lx + 0.97
      const right = cx + 4.5
      const len = (right - left) / SHELF_LENGTH
      return [
        { kind: 'lift', x: lx, y: on('lift', floor) },
        { kind: 'cart', x: lx, y: on('cart', deck) },
        ...tower(left + 0.5, floor, 2, 'column'),
        ...tower(right - 1.5, floor, 2, 'column'),
        { kind: 'shelf', x: (left + right) / 2, y: top + 0.15, extra: { len } },
        { kind: 'button', x: right - 0.6, y: top - 0.8, extra: { angle: -Math.PI / 2, pinned: true } },
        { kind: 'lamp', x: right + 1.2, y: on('lamp', floor) },
      ]
    },
  },
  {
    id: 'mill-lift',
    title: 'Ветряной подъёмник',
    accent: '#8fd19e',
    level: 3,
    kinds: ['fan', 'mill', 'lift', 'meow'],
    steps: ['Нажмите «Пуск!» — вентилятор дует', 'Мельница крутится и даёт сигнал', 'Подъёмник везёт Мяу наверх'],
    law: 'Ветер крутит мельницу, мельница по проводу включает подъёмник — энергия ветра поднимает Мяу.',
    action: 'start',
    wires: [[1, 2]],
    pieces: ({ cx, floor }) => [
      { kind: 'fan', x: cx - 4.5, y: on('fan', floor) },
      { kind: 'mill', x: cx - 1.2, y: on('mill', floor) },
      { kind: 'lift', x: cx + 2.2, y: on('lift', floor) },
      { kind: 'meow', x: cx + 2.2, y: on('meow', floor - 0.76) },
    ],
  },

  // ── Огромные машины ──
  {
    id: 'meow-trip',
    title: 'Путешествие Мяу',
    accent: '#f28b7d',
    level: 4,
    kinds: ['cart', 'olli', 'button', 'lift', 'shelf', 'spring', 'rocket', 'meow'],
    steps: [
      'Нажмите «Пуск!» — тележка везёт Олли к кнопке',
      'Тележка нажимает кнопку — подъёмник едет вверх',
      'Подъёмник нажимает кнопку под полкой — ракета с Мяу взлетает',
      'У потолка Мяу отпускает ракету',
      'Мяу падает на батут и подпрыгивает',
    ],
    law: 'Каждая деталь передаёт движение дальше: тележка жмёт кнопку, подъёмник — другую кнопку, огонь толкает ракету вверх.',
    action: 'start',
    wires: [
      [2, 3],
      [4, 6],
    ],
    pieces: ({ cx, floor }) => {
      const lx = cx - 2.2
      const top = floor - 0.76 - LIFT_TRAVEL
      const by = top + 0.2 - 0.53
      const ry = on('rocket', floor - H('spring'))
      return [
        { kind: 'cart', x: cx - 7.5, y: on('cart', floor) },
        { kind: 'olli', x: cx - 7.5, y: on('olli', floor - CART_DECK) },
        { kind: 'button', x: cx - 4.3, y: floor - 0.8, extra: { angle: -Math.PI / 2, pinned: true } },
        { kind: 'lift', x: lx, y: on('lift', floor) },
        { kind: 'button', x: lx, y: by, extra: { angle: Math.PI, pinned: true } },
        { kind: 'shelf', x: lx + 0.6, y: by - 0.55 - 0.15 },
        { kind: 'rocket', x: cx + 2, y: ry, extra: { parked: true } },
        { kind: 'spring', x: cx + 2, y: on('spring', floor) },
        cargo('meow', cx + 2, ry),
      ]
    },
  },
  {
    id: 'wind-station',
    title: 'Ветряная электростанция',
    accent: '#8fd19e',
    level: 4,
    kinds: ['fan', 'mill', 'lamp', 'gate', 'cart', 'shelf', 'cube'],
    steps: [
      'Нажмите «Пуск!» — вентилятор дует, тележка едет к воротам',
      'Ветер крутит мельницу — загорается первая лампочка',
      'Лампочки загораются по очереди',
      'Последняя лампочка открывает ворота',
      'Тележка проезжает и сбивает башню',
    ],
    law: 'Мельница превращает ветер в сигнал, лампочки передают его друг другу, ворота открываются.',
    action: 'start',
    minWidth: 19,
    wires: [
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
    pieces: ({ cx, floor }) => {
      const sy = floor - 4.2
      return [
        { kind: 'shelf', x: cx - 4, y: sy, extra: { len: 2.6 } },
        { kind: 'fan', x: cx - 7.6, y: on('fan', sy - 0.15) },
        { kind: 'mill', x: cx - 4.8, y: on('mill', sy - 0.15) },
        { kind: 'lamp', x: cx - 2.6, y: on('lamp', sy - 0.15) },
        { kind: 'lamp', x: cx - 1.4, y: on('lamp', sy - 0.15) },
        { kind: 'lamp', x: cx - 0.2, y: on('lamp', sy - 0.15) },
        { kind: 'gate', x: cx + 1.8, y: on('gate', floor), extra: { pinned: true } },
        { kind: 'cart', x: cx - 6, y: on('cart', floor) },
        ...tower(cx + 6, floor, 3, 'cube', true),
      ]
    },
  },
  {
    id: 'factory',
    title: 'Фабрика',
    accent: '#e2b27a',
    level: 4,
    kinds: ['brick', 'ramp', 'ball', 'button', 'column', 'conveyor', 'stone', 'pulley'],
    steps: [
      'Нажмите на мячик — он скатывается с горки',
      'Мячик нажимает кнопку — лента едет',
      'Лента роняет камень в ведро',
      'Ведро с камнем опускается, а мячик в другом ведре едет вверх',
    ],
    law: 'Горка, кнопка, лента и блок работают по очереди. Вёдра с мячиками весят поровну, пока в одно не упадёт камень.',
    action: 'push',
    glue: [
      [4, 5],
      [6, 7],
      [5, 8],
      [7, 8],
    ],
    wires: [[3, 8]],
    pieces: ({ cx, floor }) => {
      const base = floor - H('brick')
      const rx = cx - 6
      const left = cx - 2.2
      const top = floor - 2 * COLUMN_H
      const px = left + 5.85
      const y = floor - 6.44
      return [
        { kind: 'brick', x: rx - 0.3, y: on('brick', floor) },
        { kind: 'ramp', x: rx, y: on('ramp', base) },
        { kind: 'ball', x: rx - 0.91, y: base - 1.6, extra: { parked: true } },
        { kind: 'button', x: rx + 2.7, y: on('button', floor) },
        ...tower(left + 0.9, floor, 2, 'column'),
        ...tower(left + 3, floor, 2, 'column'),
        { kind: 'conveyor', x: left + 2.1, y: on('conveyor', top) },
        { kind: 'stone', x: left + 0.9, y: top - H('conveyor') - 0.5 },
        { kind: 'pulley', x: px, y },
        { kind: 'ball', x: px + 0.99, y: y + 2.9 },
        { kind: 'ball', x: px - 0.99, y: y + 2.9 },
      ]
    },
  },
  {
    id: 'scissors-cactus',
    title: 'Ножницы и кактус',
    accent: '#8fd19e',
    level: 2,
    kinds: ['button', 'pusher', 'ball', 'column', 'plank', 'pin', 'stone', 'balloon', 'scissors'],
    steps: [
      'Нажмите на кнопку — перчатка толкает мячик',
      'Мячик бьёт по кнопке на стене',
      'Ножницы режут ниточку — шарик летит вверх',
      'Кактус лопает шарик',
    ],
    law: 'Ниточка держала шарик внизу. Перерезали — шарик летит вверх, а острая колючка протыкает резинку.',
    action: 'press',
    glue: [
      [3, 4],
      [4, 5],
      [6, 7],
      [7, 8],
      [5, 9],
      [8, 9],
      [10, 9],
    ],
    wires: [
      [0, 1],
      [13, 12],
    ],
    ties: [[11, 14]],
    pieces: ({ cx, floor }) => {
      const bx = cx + 2
      const plankY = floor - 3 * COLUMN_H - 0.21
      return [
        { kind: 'button', x: cx - 8, y: on('button', floor) },
        { kind: 'pusher', x: cx - 6, y: on('pusher', floor) },
        { kind: 'ball', x: cx - 3.95, y: on('ball', floor) },
        ...tower(bx - 2.1, floor, 3, 'column'),
        ...tower(bx + 2.1, floor, 3, 'column'),
        { kind: 'plank', x: bx, y: plankY },
        { kind: 'pin', x: bx, y: plankY + 0.21 + 0.65, extra: { angle: Math.PI } },
        { kind: 'balloon', x: bx, y: floor - H('stone') - 1.5 },
        { kind: 'scissors', x: bx + 0.8, y: floor - H('stone') - 0.45 },
        { kind: 'button', x: bx - 2.1 - 0.45 - 0.55, y: floor - 0.8, extra: { angle: -Math.PI / 2, pinned: true } },
        { kind: 'stone', x: bx, y: on('stone', floor) },
      ]
    },
  },
  {
    id: 'scissors-surprise',
    title: 'Ножницы-сюрприз',
    accent: '#b9a3e3',
    level: 4,
    kinds: ['button', 'scissors', 'wrecking', 'seesaw', 'ball', 'hoop'],
    steps: ['Нажмите на кнопку', 'Ножницы режут верёвку', 'Тяжёлый шар падает на качели', 'Мячик взлетает и падает в кольцо'],
    law: 'Верёвка держала шар. Перерезали — шар падает, а рычаг-качели подбрасывают мячик.',
    action: 'press',
    minHeight: 11.5,
    wires: [[0, 1]],
    pieces: ({ cx, floor }) => {
      const sx = cx + 3
      return [
        { kind: 'button', x: sx + 4.5, y: on('button', floor) },
        { kind: 'scissors', x: sx - 2 + 0.7, y: floor - 10.2 },
        { kind: 'wrecking', x: sx - 2, y: floor - 8.6 },
        { kind: 'seesaw', x: sx, y: on('seesaw', floor) },
        { kind: 'ball', x: sx + 2, y: floor - 2.2 },
        { kind: 'hoop', x: hoopAt(sx - 5.3, true), y: floor - 3, extra: { flip: true } },
      ]
    },
  },
]

/** Комната для машины: ширина и высота по деталям (с запасом у стен и над головой). */
function extent(recipe: Recipe): { half: number; top: number } {
  const minH = recipe.minHeight ?? 0
  let half = 0
  let top = minH
  for (const p of recipe.pieces({ cx: 0, floor: 0, ceiling: -minH })) {
    const size = p.extra?.size ?? 1
    const spec = getPieceSpec(p.kind)
    const len = spec.stretch ? (p.extra?.len ?? 1) : 1
    half = Math.max(half, Math.abs(p.x) + (spec.w * size * len) / 2)
    top = Math.max(top, -p.y + (spec.h * size) / 2)
  }
  return { half, top }
}

/** Сколько кубиков в ширину нужно машине: по деталям с запасом у стен, не меньше `minWidth`. */
export function recipeWidth(recipe: Recipe): number {
  return Math.max(recipe.minWidth ?? 0, 2 * (extent(recipe).half + 0.8))
}

/** Сколько кубиков над полом занимает машина (по верхнему краю самой высокой детали или `minHeight`). */
export function recipeHeight(recipe: Recipe): number {
  return extent(recipe).top
}

export type RecipeBox = { left: number; right: number; top: number }

/** Комната под машину: стартовая, раздвинутая вширь и вверх, если машине тесно. */
export function recipeRoom(recipe: Recipe, start: RecipeBox, floor: number): RecipeBox {
  const box = { ...start }
  const width = recipeWidth(recipe) + 2
  const height = recipeHeight(recipe) + 1
  if (width > box.right - box.left) box.right = box.left + width
  if (height > floor - box.top) box.top = floor - height
  return box
}

/** Поставить машину: моторы выключены (их включит «Пуск!» или кнопка), провода и ниточки — как в рецепте. */
export function placeRecipe(world: SandboxWorld, recipe: Recipe, room: RecipeRoom): number[] {
  const ids = recipe.pieces(room).map((p) => world.add(p.kind, p.x, p.y, p.extra))
  for (const [a, b] of recipe.glue ?? []) world.glue(ids[a]!, ids[b]!)
  for (const [balloon, piece] of recipe.ties ?? []) world.attach(ids[balloon]!, ids[piece]!)
  world.setAllPower(false)
  world.setWires((recipe.wires ?? []).map(([s, t]) => [ids[s]!, ids[t]!] as const))
  return ids
}
