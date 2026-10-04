/**
 * Детали «Собери что угодно!»: форма, вес, материал.
 * Единицы — «кубики»: сторона кубика 1.2. Ось Y смотрит вниз, как на экране.
 */

export type Pt = { readonly x: number; readonly y: number }

export type ShapePart =
  | { readonly type: 'poly'; readonly points: readonly Pt[] }
  | { readonly type: 'circle'; readonly r: number; readonly x?: number; readonly y?: number }

export type Material = 'wood' | 'rubber' | 'stone' | 'air' | 'toy' | 'spring'

export const BLOCK_KINDS = ['cube', 'brick', 'plank', 'triangle', 'dome', 'arch', 'column', 'ramp'] as const
export const ITEM_KINDS = [
  'ball',
  'stone',
  'balloon',
  'cart',
  'meow',
  'olli',
  'spring',
  'wrecking',
  'hoop',
  'fan',
  'seesaw',
  'conveyor',
  'mill',
  'lift',
  'cannon',
  'pin',
  'pulley',
  'rocket',
  'button',
  'gate',
  'pusher',
  'lamp',
  'shelf',
  'chute',
  'pipe',
  'trapdoor',
  'scissors',
  'launcher',
  'bucket',
] as const
export const PIECE_KINDS = [...BLOCK_KINDS, ...ITEM_KINDS] as const

export type BlockKind = (typeof BLOCK_KINDS)[number]
export type ItemKind = (typeof ITEM_KINDS)[number]
export type PieceKind = (typeof PIECE_KINDS)[number]

/** Предметов одного вида на экране не больше шести (решение владельца 02.10.2026). */
export const ITEM_MAX_PER_KIND = 6

/** Кольцо крупнее базовых размеров: малышу легко попасть (решение владельца 02.10.2026). */
export const HOOP_SCALE = 1.3

/** Петля шара-тарана над его центром (размер 1): за неё привязана верёвка. */
export const WRECKING_LOOP_Y = 0.8

/** Кнопка «Повернуть»: на 90°, зеркально (горка, кольцо) или её нет (круглые). */
export type Turn = 'quarter' | 'flip' | 'none'

/**
 * Что включает кнопка «Вкл / Выкл» у детали, «Пуск!» и провод: моторы (вентилятор, тележка,
 * лента, подъёмник), ворота (открыты), люк полки (открыт) и лампочка (горит).
 */
export type Motor = 'fan' | 'wheels' | 'belt' | 'lift' | 'gate' | 'lamp' | 'hatch'

/**
 * Подвижная часть механизма — отдельное тело на оси:
 * `pivot` — доска качелей (качается до `limit`), `axle` — колесо мельницы (крутится свободно),
 * `slider` — площадка подъёмника (ездит вверх на `travel`), `press` — шляпка кнопки (нажимается
 * вниз на `travel`), `punch` — перчатка толкателя (выезжает вбок на `travel`), `hatch` — люк полки
 * (опускается вниз на угол `limit`), `shutter` — полотно ворот (уезжает вверх на `travel`),
 * `kick` — площадка пружины-катапульты (подскакивает на `travel`). `parts` — вокруг точки `at`.
 */
export type LinkSpec = {
  readonly type: 'pivot' | 'axle' | 'slider' | 'press' | 'punch' | 'hatch' | 'shutter' | 'kick'
  readonly at: Pt
  readonly parts: readonly ShapePart[]
  readonly limit?: number
  readonly travel?: number
  readonly density: number
}

/** Ведёрки на блоке: колёса на ±`x`, `y`; ведёрки висят на верёвках длиной `rope`. */
export type PulleySpec = { readonly x: number; readonly y: number; readonly rope: number }

/** Вкладки шкафа (решение владельца 02.10.2026). */
export type ShelfTab = 'parts' | 'items' | 'machines' | 'switches'

/** Дуло пушки: откуда и куда (угол, y вниз) вылетает мячик и с какой скоростью. */
/** `at` — откуда вылетает выстрел (конец ствола), `hole` — тёмное отверстие на картинке: там сидит заряд. */
export type Muzzle = { readonly at: Pt; readonly hole: Pt; readonly angle: number; readonly speed: number }

export type PieceSpec = {
  readonly kind: PieceKind
  readonly group: 'block' | 'item'
  readonly titleRu: string
  readonly material: Material
  readonly parts: readonly ShapePart[]
  /** Габарит для шкафа и места появления. */
  readonly w: number
  readonly h: number
  readonly body: { readonly density: number; readonly friction: number; readonly restitution: number }
  readonly turn: Turn
  /** Шарик тянет вверх: сила в весах кубика. */
  readonly lift?: number
  /** Батут подбрасывает: скорость вверх. */
  readonly bounce?: number
  readonly wheels?: readonly { readonly x: number; readonly y: number; readonly r: number }[]
  /** Висит на верёвке с потолка (шар-таран). */
  readonly rope?: boolean
  /** Не падает: висит там, куда поставили (кольцо на стене). */
  readonly fixed?: boolean
  /** Дует вдоль своей оси +x: длина струи и сила. */
  readonly wind?: { readonly length: number; readonly force: number }
  readonly motor?: Motor
  /** Включена при появлении (вентилятор); остальные моторы ждут кнопку. */
  readonly startsOn?: boolean
  readonly link?: LinkSpec
  /** Лента везёт со скоростью (единиц/с) вдоль своей оси +x. */
  readonly belt?: { readonly speed: number }
  readonly muzzle?: Muzzle
  readonly pulley?: PulleySpec
  /** Ракета: тяга в весах ракеты и сколько секунд горит. */
  readonly thrust?: { readonly force: number; readonly seconds: number }
  /** Колючая: шарик, который её коснулся, лопается. */
  readonly pops?: boolean
  /** Длину меняют кнопки «Короче / Длиннее»: форма для длины `len` (1 — обычная). */
  readonly stretch?: (len: number) => readonly ShapePart[]
}

/** Длина полки и жёлоба: от половины до двух с половиной обычных, шаг — четверть. */
export const STRETCH_MIN = 0.5
export const STRETCH_MAX = 2.5
export const STRETCH_STEP = 0.25

/** Жёлоб наклонён вниз вправо на этот угол (зеркально — влево). */
export const CHUTE_SLOPE = 0.3
export const CHUTE_LENGTH = 3.6
export const SHELF_LENGTH = 3.6

const MATERIAL_BODY: Record<Material, PieceSpec['body']> = {
  wood: { density: 1, friction: 0.75, restitution: 0.04 },
  rubber: { density: 0.6, friction: 0.6, restitution: 0.75 },
  stone: { density: 4, friction: 0.9, restitution: 0.02 },
  air: { density: 0.08, friction: 0.3, restitution: 0.4 },
  toy: { density: 0.7, friction: 0.85, restitution: 0.08 },
  spring: { density: 1.6, friction: 0.9, restitution: 0.05 },
}

function box(w: number, h: number, cx = 0, cy = 0): ShapePart {
  const x0 = cx - w / 2
  const x1 = cx + w / 2
  const y0 = cy - h / 2
  const y1 = cy + h / 2
  return {
    type: 'poly',
    points: [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
    ],
  }
}

/** Прямоугольник со срезанными углами (вентилятор). */
function softBox(w: number, h: number, cut: number): ShapePart {
  const x = w / 2
  const y = h / 2
  return {
    type: 'poly',
    points: [
      { x: -x + cut, y: -y },
      { x: x - cut, y: -y },
      { x, y: -y + cut },
      { x, y: y - cut },
      { x: x - cut, y },
      { x: -x + cut, y },
      { x: -x, y: y - cut },
      { x: -x, y: -y + cut },
    ],
  }
}

function arcPoint(r: number, angle: number, cy: number): Pt {
  return { x: r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

/** Полукруг плоской стороной вниз. */
function domePart(r: number): ShapePart {
  const points: Pt[] = []
  for (let i = 0; i <= 6; i += 1) points.push(arcPoint(r, Math.PI + (i * Math.PI) / 6, r / 2))
  return { type: 'poly', points }
}

/** Арка: два столбика и перемычка над полукруглым вырезом. */
function archParts(w: number, h: number, cut: number): ShapePart[] {
  const top = -h / 2
  const bottom = h / 2
  const parts: ShapePart[] = [
    box(w / 2 - cut, h, -(w / 2 + cut) / 2, 0),
    box(w / 2 - cut, h, (w / 2 + cut) / 2, 0),
  ]
  const steps = 4
  for (let i = 0; i < steps; i += 1) {
    const p0 = arcPoint(cut, Math.PI + (i * Math.PI) / steps, bottom)
    const p1 = arcPoint(cut, Math.PI + ((i + 1) * Math.PI) / steps, bottom)
    parts.push({
      type: 'poly',
      points: [p0, { x: p0.x, y: top }, { x: p1.x, y: top }, p1],
    })
  }
  return parts
}

function rotated(part: ShapePart & { type: 'poly' }, angle: number): ShapePart {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return { type: 'poly', points: part.points.map((p) => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c })) }
}

/** Колесо мельницы: ступица и 4 лопасти вокруг оси. */
function rotorParts(r: number): ShapePart[] {
  const blade = box(0.3, r - 0.12, 0, -(r + 0.12) / 2) as ShapePart & { type: 'poly' }
  return [{ type: 'circle', r: 0.22 }, ...[0, 1, 2, 3].map((i) => rotated(blade, (i * Math.PI) / 2))]
}

/** Ствол пушки: от казённой части `pivot` вдоль угла `angle` длиной `length` — как на рисунке. */
const CANNON_PIVOT: Pt = { x: -0.5, y: 0.02 }
const CANNON_ANGLE = -0.4
const CANNON_LENGTH = 1.4

function barrelPart(): ShapePart {
  const d = { x: Math.cos(CANNON_ANGLE), y: Math.sin(CANNON_ANGLE) }
  const n = { x: -d.y, y: d.x }
  const half = 0.25
  const at = (s: number, t: number): Pt => ({
    x: CANNON_PIVOT.x + d.x * s + n.x * t,
    y: CANNON_PIVOT.y + d.y * s + n.y * t,
  })
  return { type: 'poly', points: [at(-0.25, -half), at(CANNON_LENGTH, -half), at(CANNON_LENGTH, half), at(-0.25, half)] }
}

/** Середина тёмного отверстия в жерле на картинке пушки (размер 1). */
const CANNON_HOLE: Pt = { x: 0.84, y: -0.5 }

/** Ширина тёмного отверстия в жерле (размер 1): заряженный предмет сжимается до неё и сидит внутри. */
export const MUZZLE_BORE = 0.36

/**
 * Ведёрко на блоке (центр — середина ведра): дно и две стенки, мячик ложится в горлышко.
 * Ручка — на `BUCKET_HANDLE_Y`, картинка — `BUCKET_SIZE`.
 */
export const BUCKET_PARTS: readonly ShapePart[] = [
  box(0.84, 0.12, 0, 0.5),
  {
    type: 'poly',
    points: [
      { x: -0.6, y: -0.567 },
      { x: -0.5, y: -0.567 },
      { x: -0.32, y: 0.567 },
      { x: -0.42, y: 0.567 },
    ],
  },
  {
    type: 'poly',
    points: [
      { x: 0.5, y: -0.567 },
      { x: 0.6, y: -0.567 },
      { x: 0.42, y: 0.567 },
      { x: 0.32, y: 0.567 },
    ],
  },
]
export const BUCKET_HANDLE_Y = -1.05
export const BUCKET_SIZE = { w: 1.3, h: 1.62 } as const
export const BUCKET_DENSITY = 0.5

function shelfParts(len: number): ShapePart[] {
  return [box(SHELF_LENGTH * len, 0.3)]
}

/** Жёлоб: наклонная доска и бортик у верхнего края, чтобы мячик не скатился назад. */
function chuteParts(len: number): ShapePart[] {
  const half = (CHUTE_LENGTH * len) / 2
  const board = rotated(box(half * 2, 0.2) as ShapePart & { type: 'poly' }, CHUTE_SLOPE)
  const top = { x: -half * Math.cos(CHUTE_SLOPE), y: -half * Math.sin(CHUTE_SLOPE) }
  return [board, box(0.16, 0.6, top.x + 0.05, top.y - 0.35)]
}

function spec(
  kind: PieceKind,
  titleRu: string,
  material: Material,
  parts: readonly ShapePart[],
  w: number,
  h: number,
  extra: Partial<
    Pick<
      PieceSpec,
      | 'turn'
      | 'lift'
      | 'bounce'
      | 'wheels'
      | 'rope'
      | 'fixed'
      | 'wind'
      | 'body'
      | 'motor'
      | 'startsOn'
      | 'link'
      | 'belt'
      | 'muzzle'
      | 'pulley'
      | 'thrust'
      | 'pops'
      | 'stretch'
    >
  > = {},
): PieceSpec {
  return {
    kind,
    group: (BLOCK_KINDS as readonly string[]).includes(kind) ? 'block' : 'item',
    titleRu,
    material,
    parts,
    w,
    h,
    body: MATERIAL_BODY[material],
    turn: 'quarter',
    ...extra,
  }
}

const SPECS: Record<PieceKind, PieceSpec> = {
  cube: spec('cube', 'Кубик', 'wood', [box(1.2, 1.2)], 1.2, 1.2),
  brick: spec('brick', 'Кирпичик', 'wood', [box(2.4, 1.2)], 2.4, 1.2),
  plank: spec('plank', 'Доска', 'wood', [box(4.8, 0.42)], 4.8, 0.42),
  triangle: spec(
    'triangle',
    'Треугольник',
    'wood',
    [
      {
        type: 'poly',
        points: [
          { x: -0.75, y: 0.6 },
          { x: 0.75, y: 0.6 },
          { x: 0, y: -0.6 },
        ],
      },
    ],
    1.5,
    1.2,
  ),
  dome: spec('dome', 'Полукруг', 'wood', [domePart(0.8)], 1.6, 0.8),
  arch: spec('arch', 'Арка', 'wood', archParts(2.4, 1.2, 0.65), 2.4, 1.2),
  column: spec('column', 'Цилиндр', 'wood', [box(0.9, 1.8)], 0.9, 1.8),
  ramp: spec(
    'ramp',
    'Горка',
    'wood',
    [
      {
        type: 'poly',
        points: [
          { x: -1.8, y: 0.6 },
          { x: 1.8, y: 0.6 },
          { x: -1.8, y: -0.6 },
        ],
      },
    ],
    3.6,
    1.2,
    { turn: 'flip' },
  ),
  ball: spec('ball', 'Мячик', 'rubber', [{ type: 'circle', r: 0.55 }], 1.1, 1.1, { turn: 'none' }),
  stone: spec(
    'stone',
    'Камень',
    'stone',
    [
      {
        type: 'poly',
        points: [
          { x: -0.65, y: 0.12 },
          { x: -0.5, y: -0.32 },
          { x: -0.1, y: -0.47 },
          { x: 0.4, y: -0.42 },
          { x: 0.66, y: -0.05 },
          { x: 0.56, y: 0.34 },
          { x: 0.1, y: 0.48 },
          { x: -0.45, y: 0.42 },
        ],
      },
    ],
    1.32,
    0.96,
  ),
  balloon: spec('balloon', 'Шарик', 'air', [{ type: 'circle', r: 0.6 }], 1.2, 1.2, { lift: 1.3, turn: 'none' }),
  cart: spec(
    'cart',
    'Тележка',
    'wood',
    [box(2.2, 0.22, 0, 0.11), box(0.16, 0.55, -1.02, -0.27), box(0.16, 0.55, 1.02, -0.27)],
    2.2,
    1.25,
    {
      turn: 'flip',
      motor: 'wheels',
      // Тяжёлая: её поднимают только четыре шарика (решение владельца 02.10.2026).
      body: { density: 7.6, friction: 0.75, restitution: 0.04 },
      wheels: [
        { x: -0.66, y: 0.42, r: 0.32 },
        { x: 0.66, y: 0.42, r: 0.32 },
      ],
    },
  ),
  meow: spec(
    'meow',
    'Мяу',
    'toy',
    [
      {
        type: 'poly',
        points: [
          { x: -0.5, y: 0.65 },
          { x: 0.5, y: 0.65 },
          { x: 0.56, y: 0.12 },
          { x: 0.42, y: -0.52 },
          { x: -0.42, y: -0.52 },
          { x: -0.56, y: 0.12 },
        ],
      },
    ],
    1.12,
    1.3,
  ),
  olli: spec(
    'olli',
    'Олли',
    'toy',
    [
      {
        type: 'poly',
        points: [
          { x: -0.38, y: 0.68 },
          { x: 0.38, y: 0.68 },
          { x: 0.56, y: 0.3 },
          { x: 0.54, y: -0.25 },
          { x: 0.3, y: -0.62 },
          { x: -0.3, y: -0.62 },
          { x: -0.54, y: -0.25 },
          { x: -0.56, y: 0.3 },
        ],
      },
    ],
    1.12,
    1.36,
  ),
  spring: spec('spring', 'Батут', 'spring', [box(1.9, 0.8)], 1.9, 0.8, { bounce: 15 }),
  wrecking: spec('wrecking', 'Шар-таран', 'stone', [{ type: 'circle', r: 0.7 }], 1.4, 1.4, {
    turn: 'none',
    rope: true,
    body: { density: 3.2, friction: 0.6, restitution: 0.05 },
  }),
  hoop: spec(
    'hoop',
    'Кольцо',
    'wood',
    [
      box(0.2 * HOOP_SCALE, 1.9 * HOOP_SCALE, 0.85 * HOOP_SCALE, -0.35 * HOOP_SCALE),
      { type: 'circle', r: 0.12 * HOOP_SCALE, x: -0.72 * HOOP_SCALE, y: 0 },
    ],
    1.9 * HOOP_SCALE,
    1.9 * HOOP_SCALE,
    { turn: 'flip', fixed: true },
  ),
  fan: spec('fan', 'Вентилятор', 'toy', [softBox(1.2, 1.5, 0.3)], 1.2, 1.5, {
    wind: { length: 7, force: 26 },
    body: { density: 1.4, friction: 0.9, restitution: 0.05 },
    motor: 'fan',
    startsOn: true,
  }),
  seesaw: spec(
    'seesaw',
    'Качели',
    'wood',
    [
      {
        type: 'poly',
        points: [
          { x: -0.6, y: 0.6 },
          { x: 0.6, y: 0.6 },
          { x: 0, y: -0.3 },
        ],
      },
    ],
    4.8,
    1.2,
    {
      turn: 'none',
      body: { density: 3, friction: 0.9, restitution: 0.02 },
      link: {
        type: 'pivot',
        at: { x: 0, y: -0.45 },
        parts: [box(4.8, 0.3), box(0.16, 0.24, -2.32, -0.24), box(0.16, 0.24, 2.32, -0.24)],
        limit: 0.38,
        density: 0.8,
      },
    },
  ),
  conveyor: spec('conveyor', 'Лента', 'toy', [box(4.2, 0.56)], 4.2, 0.56, {
    turn: 'flip',
    body: { density: 2.5, friction: 1, restitution: 0.02 },
    motor: 'belt',
    belt: { speed: 2.4 },
  }),
  mill: spec('mill', 'Мельница', 'wood', [box(1.06, 0.25, 0, 1.375), box(0.24, 1.7, 0, 0.4)], 2.1, 3, {
    turn: 'none',
    body: { density: 3, friction: 0.9, restitution: 0.02 },
    link: { type: 'axle', at: { x: 0, y: -0.45 }, parts: rotorParts(1.05), density: 0.35 },
  }),
  // Подъёмник-домкрат: тяжёлое основание, площадка на одной выдвижной ноге (нога — только рисунок).
  lift: spec('lift', 'Подъёмник', 'wood', [box(1.9, 0.36, 0, 0.22)], 1.9, 0.8, {
    turn: 'none',
    body: { density: 8, friction: 0.9, restitution: 0.02 },
    motor: 'lift',
    link: { type: 'slider', at: { x: 0, y: -0.26 }, parts: [box(1.9, 0.2)], travel: 3.2, density: 1.5 },
  }),
  cannon: spec('cannon', 'Пушка', 'stone', [box(1.4, 0.6, -0.22, 0.45), barrelPart()], 1.94, 1.5, {
    turn: 'flip',
    body: { density: 2.5, friction: 0.9, restitution: 0.02 },
    muzzle: {
      at: {
        x: CANNON_PIVOT.x + Math.cos(CANNON_ANGLE) * CANNON_LENGTH,
        y: CANNON_PIVOT.y + Math.sin(CANNON_ANGLE) * CANNON_LENGTH,
      },
      hole: CANNON_HOLE,
      angle: CANNON_ANGLE,
      speed: 18,
    },
  }),
  pin: spec(
    'pin',
    'Кактус',
    'toy',
    [
      {
        type: 'poly',
        points: [
          { x: -0.36, y: -0.12 },
          { x: -0.14, y: -0.6 },
          { x: 0.14, y: -0.6 },
          { x: 0.36, y: -0.12 },
          { x: 0.2, y: 0.18 },
          { x: -0.2, y: 0.18 },
        ],
      },
      box(0.48, 0.48, 0, 0.41),
    ],
    0.9,
    1.3,
    { pops: true, body: { density: 1.5, friction: 0.9, restitution: 0.05 } },
  ),
  // Перекладина с колёсами висит где поставили; два ведёрка на одной верёвке.
  pulley: spec(
    'pulley',
    'Ведёрки',
    'wood',
    [box(3, 0.44, 0, -0.45), { type: 'circle', r: 0.29, x: -0.99, y: 0.36 }, { type: 'circle', r: 0.29, x: 0.99, y: 0.36 }],
    3,
    1.34,
    { turn: 'none', fixed: true, pulley: { x: 0.99, y: 0.36, rope: 1.8 } },
  ),
  rocket: spec(
    'rocket',
    'Ракета',
    'toy',
    [
      {
        type: 'poly',
        points: [
          { x: 0, y: -0.8 },
          { x: 0.26, y: -0.45 },
          { x: 0.26, y: 0.55 },
          { x: -0.26, y: 0.55 },
          { x: -0.26, y: -0.45 },
        ],
      },
      {
        type: 'poly',
        points: [
          { x: -0.55, y: 0.75 },
          { x: 0.55, y: 0.75 },
          { x: 0.26, y: 0.2 },
          { x: -0.26, y: 0.2 },
        ],
      },
    ],
    1.1,
    1.6,
    { thrust: { force: 2.4, seconds: 2.2 }, body: { density: 0.8, friction: 0.8, restitution: 0.05 } },
  ),
  button: spec('button', 'Кнопка', 'toy', [box(1.3, 0.5, 0, 0.3)], 1.3, 1.1, {
    turn: 'none',
    body: { density: 3, friction: 0.9, restitution: 0.02 },
    link: { type: 'press', at: { x: 0, y: -0.3 }, parts: [box(0.76, 0.46)], travel: 0.22, density: 0.3 },
  }),
  // Ворота-рольставня: короб сверху, низкий порожек снизу; полотно между ними уезжает в короб.
  gate: spec(
    'gate',
    'Ворота',
    'wood',
    [
      box(1.4, 0.5, 0, -1.05),
      {
        type: 'poly',
        points: [
          { x: -0.7, y: 1.3 },
          { x: 0.7, y: 1.3 },
          { x: 0.45, y: 1.2 },
          { x: -0.45, y: 1.2 },
        ],
      },
    ],
    1.4,
    2.6,
    {
      body: { density: 6, friction: 0.9, restitution: 0.02 },
      motor: 'gate',
      link: { type: 'shutter', at: { x: 0, y: 0.2 }, parts: [box(0.3, 2)], travel: 1.9, density: 1 },
    },
  ),
  pusher: spec('pusher', 'Толкатель', 'wood', [box(1.17, 1, 0, 0.1), box(0.35, 0.22, 0, -0.49)], 2.08, 1.2, {
    turn: 'flip',
    body: { density: 3, friction: 0.9, restitution: 0.02 },
    link: { type: 'punch', at: { x: 0.845, y: 0.06 }, parts: [box(0.85, 0.66, 0.195, 0)], travel: 1, density: 1 },
  }),
  lamp: spec(
    'lamp',
    'Лампочка',
    'toy',
    [{ type: 'circle', r: 0.33, y: -0.27 }, box(0.36, 0.3, 0, 0.15), box(0.72, 0.24, 0, 0.48)],
    0.75,
    1.2,
    { turn: 'none', motor: 'lamp', body: { density: 1.2, friction: 0.9, restitution: 0.05 } },
  ),
  // Полка на стене: висит, где поставили; длину меняют «Короче / Длиннее».
  shelf: spec('shelf', 'Полка', 'wood', shelfParts(1), SHELF_LENGTH, 0.3, { fixed: true, stretch: shelfParts }),
  chute: spec('chute', 'Жёлоб', 'wood', chuteParts(1), 3.5, 1.7, {
    turn: 'flip',
    fixed: true,
    stretch: chuteParts,
    body: { density: 1, friction: 0.35, restitution: 0.04 },
  }),
  // Труба: две стенки, вход сверху. Две трубы одного цвета — пара: упало в одну — выпало из другой.
  pipe: spec('pipe', 'Труба', 'toy', [box(0.16, 1.8, -0.74, 0), box(0.16, 1.8, 0.74, 0)], 1.64, 1.8, { fixed: true }),
  // Полка с люком: середина откидывается вниз по сигналу, и всё с неё падает.
  trapdoor: spec('trapdoor', 'Полка с люком', 'wood', [box(1.1, 0.3, -1.35, 0), box(1.1, 0.3, 1.35, 0)], 3.8, 0.3, {
    turn: 'flip',
    fixed: true,
    motor: 'hatch',
    link: { type: 'hatch', at: { x: -0.8, y: 0 }, parts: [box(1.6, 0.3, 0.8, 0)], limit: Math.PI / 2, density: 0.6 },
  }),
  // Ножницы висят, где поставили; по сигналу режут ближнюю ниточку шарика или верёвку шара.
  scissors: spec('scissors', 'Ножницы', 'toy', [box(1, 0.5)], 1, 0.5, { turn: 'flip', fixed: true }),
  // Пружина-катапульта: по сигналу площадка подскакивает и подбрасывает то, что на ней.
  launcher: spec('launcher', 'Пружина-катапульта', 'spring', [box(1.6, 0.26, 0, 0.17)], 1.6, 0.6, {
    body: { density: 4, friction: 0.9, restitution: 0.02 },
    link: { type: 'kick', at: { x: 0, y: -0.2 }, parts: [box(1.5, 0.16)], travel: 0.9, density: 1 },
  }),
  // Ведёрко с блока, у которого срезали верёвку: обычный предмет, в шкафу его нет.
  bucket: spec('bucket', 'Ведёрко', 'toy', BUCKET_PARTS, 1.2, 1.14, {
    turn: 'none',
    body: { density: BUCKET_DENSITY, friction: 0.8, restitution: 0.05 },
  }),
}

/** Вкладки шкафа: что где лежит (решение владельца 02.10.2026). */
export const SHELF_TABS: readonly { readonly id: ShelfTab; readonly title: string; readonly kinds: readonly PieceKind[] }[] = [
  { id: 'parts', title: 'Детали', kinds: [...BLOCK_KINDS, 'shelf', 'chute', 'pipe'] },
  { id: 'items', title: 'Предметы', kinds: ['ball', 'stone', 'balloon', 'meow', 'olli', 'wrecking', 'hoop', 'pin'] },
  {
    id: 'machines',
    title: 'Механизмы',
    kinds: ['cart', 'fan', 'spring', 'launcher', 'seesaw', 'conveyor', 'mill', 'lift', 'cannon', 'pulley', 'rocket'],
  },
  { id: 'switches', title: 'Включатели', kinds: ['button', 'lamp', 'gate', 'trapdoor', 'pusher', 'scissors'] },
]

/** Что вообще бывает в шкафу: всё, кроме ведёрка — оно появляется, только когда срезали верёвку блока. */
export const SHELF_KINDS: readonly PieceKind[] = PIECE_KINDS.filter((kind) => kind !== 'bucket')

/** Дают сигнал по своим проводам: кнопка (нажали), лампочка (горит), мельница (крутится). */
export const SIGNAL_SOURCES: ReadonlySet<PieceKind> = new Set(['button', 'lamp', 'mill'])

/** Принимают сигнал по проводу. */
export const SIGNAL_TARGETS: ReadonlySet<PieceKind> = new Set([
  'cart',
  'fan',
  'conveyor',
  'lift',
  'gate',
  'lamp',
  'cannon',
  'pusher',
  'rocket',
  'trapdoor',
  'scissors',
  'launcher',
])

/** Проводов от одной кнопки, лампочки или мельницы — не больше трёх (решение владельца). */
export const MAX_WIRES = 3

export function shelfTabOf(kind: PieceKind): ShelfTab {
  return SHELF_TABS.find((tab) => tab.kinds.includes(kind))?.id ?? 'items'
}

/** У детали есть мотор: кнопка «Вкл / Выкл» и «Пуск!». */
export function isPowered(kind: PieceKind): boolean {
  return getPieceSpec(kind).motor !== undefined
}

/** Что делает тап: у «живых» деталей — их действие; меню-кольцо у них — по удержанию. */
export type TapAction = 'press' | 'fire' | 'toggle' | 'pop' | 'greet' | 'menu'

export function tapAction(kind: PieceKind): TapAction {
  if (kind === 'button') return 'press'
  if (kind === 'balloon') return 'pop'
  if (kind === 'meow' || kind === 'olli') return 'greet'
  const spec = getPieceSpec(kind)
  if (spec.muzzle || spec.thrust || spec.link?.type === 'punch' || spec.link?.type === 'kick' || kind === 'scissors') {
    return 'fire'
  }
  if (isPowered(kind)) return 'toggle'
  return 'menu'
}

export function getPieceSpec(kind: PieceKind): PieceSpec {
  return SPECS[kind]
}

export function isPieceKind(value: string): value is PieceKind {
  return (PIECE_KINDS as readonly string[]).includes(value)
}

/** Крашеное дерево — пастель бренда (`BRANDBOOK.md`). */
export const PAINT_COLORS = ['#f28b7d', '#f7c95c', '#8fd19e', '#8cc8ee', '#b9a3e3', '#f6b48a'] as const

const ITEM_COLORS: Record<ItemKind, string> = {
  ball: '#f2786b',
  stone: '#a9a39b',
  balloon: '#e9686a',
  cart: '#d9a066',
  meow: '#f7efe3',
  olli: '#a88466',
  spring: '#7fb7e6',
  wrecking: '#6f6a74',
  hoop: '#f3a35c',
  fan: '#8cc8ee',
  seesaw: '#f7c95c',
  conveyor: '#7f8fa3',
  mill: '#f28b7d',
  lift: '#8fd19e',
  cannon: '#6f6a74',
  pin: '#8fd19e',
  pulley: '#e2b27a',
  rocket: '#f28b7d',
  button: '#e9686a',
  gate: '#e2b27a',
  pusher: '#e2b27a',
  lamp: '#f7c95c',
  shelf: '#e2b27a',
  chute: '#e2b27a',
  pipe: '#8cc8ee',
  trapdoor: '#e2b27a',
  scissors: '#f28b7d',
  launcher: '#7fb7e6',
  bucket: '#7cc4e8',
}

/** Пара труб одного цвета: трубы по порядку — 1 и 2, 3 и 4, 5 и 6. */
export function pipeColor(pairIndex: number): string {
  return PAINT_COLORS[((pairIndex % PAINT_COLORS.length) + PAINT_COLORS.length) % PAINT_COLORS.length]!
}

/** Деревянные детали и шарики по очереди красятся в цвета палитры. */
export function pieceColor(kind: PieceKind, index: number): string {
  if (kind === 'balloon' || getPieceSpec(kind).group === 'block') {
    return PAINT_COLORS[((index % PAINT_COLORS.length) + PAINT_COLORS.length) % PAINT_COLORS.length]!
  }
  return ITEM_COLORS[kind as ItemKind]
}
