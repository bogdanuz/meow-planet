import {
  Circle,
  Edge,
  MouseJoint,
  Polygon,
  PrismaticJoint,
  PulleyJoint,
  RevoluteJoint,
  RopeJoint,
  Vec2,
  WeldJoint,
  World,
  type Body,
  type Contact,
  type Joint,
  type Vec2Value,
} from 'planck'
import {
  BUCKET_DENSITY,
  BUCKET_HANDLE_Y,
  BUCKET_PARTS,
  HOOP_SCALE,
  MAX_WIRES,
  MUZZLE_BORE,
  PIECE_KINDS,
  SIGNAL_SOURCES,
  SIGNAL_TARGETS,
  STRETCH_MAX,
  STRETCH_MIN,
  STRETCH_STEP,
  WRECKING_LOOP_Y,
  getPieceSpec,
  pieceColor,
  pipeColor,
  type Material,
  type PieceKind,
  type PulleySpec,
  type ShapePart,
} from './pieces'
import type { CharPose } from './characters'
import { rotateQuarter, snapRightAngle } from './rules'

/** Мир песочницы в «кубиках» (сторона кубика 1.2), ось Y вниз. */
export type WorldOptions = {
  width: number
  height: number
  /** Уровень пола (ковёр). */
  floorY: number
  /** Потолок под шапкой — шарики упираются сюда, отсюда висит шар-таран. */
  ceilingY: number
  leftX?: number
  /** Правая стенка — у края открытого шкафа; едет вместе со шкафом. */
  rightX?: number
  realistic: boolean
  autoStraight: boolean
  /** «Липучка»: аккуратно поставленная деталь прилипает к соседям. */
  sticky: boolean
  random?: () => number
}

export type PieceView = {
  id: number
  kind: PieceKind
  color: string
  x: number
  y: number
  angle: number
  size: number
  flip: boolean
  /** Мотор включён (вентилятор, тележка, лента, лифт). */
  on?: boolean
  /** Угол лопастей вентилятора; у ленты — сдвиг полотна. */
  spin?: number
  wheels?: { x: number; y: number; angle: number; r: number }[]
  /** Подвижная часть: доска качелей, колесо мельницы, площадка подъёмника, шляпка кнопки, перчатка, люк, полотно ворот. */
  link?: { x: number; y: number; angle: number }
  /** Ведёрки на блоке и их верёвки (от колеса к ручке). */
  extras?: { x: number; y: number; angle: number }[]
  cords?: { ax: number; ay: number; bx: number; by: number }[]
  /** Длина полки и жёлоба (1 — обычная). */
  len?: number
  /** Прибита к стене. */
  pinned?: boolean
  /** Груз внутри ракеты — рисуется в иллюминаторе. */
  cargo?: { kind: PieceKind; color: string }
  /** Предмет внутри этой ракеты: в комнате его не рисуют. */
  inside?: number
  /** У ракеты: Мяу или Олли надел её как рюкзак — саму ракету не рисуют, только огонь. */
  rider?: number
  /** Предмет в дуле пушки: середина отверстия, куда оно смотрит, и полуширина отверстия `r`. */
  muzzle?: { holder: number; x: number; y: number; dx: number; dy: number; r: number }
  /** Нарисован меньше своего размера (доля): сжат под жерло пушки или только что вылетел из неё. */
  shrink?: number
  /** Мяу и Олли на парашюте: сколько секунд он раскрыт. */
  chute?: number
  /** Мяу и Олли: поза, время для покачивания (с), шаг вбок и огонь ракетного рюкзака — ставит экран. */
  char?: { pose: CharPose; t: number; dx: number; flame?: boolean }
}

/** Предмет держат у пушки/ракеты: `t` 0…1 — сколько осталось до «втянуло». */
export type SuckView = { item: number; holder: number; t: number; x: number; y: number }

/** Провод от кнопки, лампочки или мельницы к механизму; `live` — механизм включён или по проводу бежит искорка. */
export type WireView = { sourceId: number; targetId: number; ax: number; ay: number; bx: number; by: number; live: boolean }

/** Что сделали механизмы сами (кнопка, кактус, провод) — для звука и искорок. */
export type ActionEvent = {
  type:
    | 'press'
    | 'power'
    | 'fire'
    | 'punch'
    | 'launch'
    | 'pop'
    | 'signal'
    | 'cut'
    | 'kick'
    | 'gone'
    | 'teleport'
    | 'ride'
    | 'load'
    | 'chute'
  id: number
  kind: PieceKind
  x: number
  y: number
  on?: boolean
  color?: string
  /** У `signal` — куда бежит искорка; у `load` — какая пушка/ракета втянула предмет. */
  target?: number
}

/** «Пуск!»: какие пушки выстрелили, толкатели толкнули, ракеты взлетели, катапульты подбросили, ножницы срезали. */
export type StartResult = { fired: number[]; punched: number[]; launched: number[]; kicked: number[]; cut: number[] }

/** Верёвка шара-тарана: крючок на потолке → шар. */
export type RopeView = { id: number; ax: number; ay: number; bx: number; by: number }

/** Верёвочка шарика: низ шарика → точка на детали. */
export type TieView = { balloonId: number; ax: number; ay: number; bx: number; by: number }

export type ImpactEvent = { id: number; kind: PieceKind; material: Material; strength: number }

export type GoalEvent = { hoopId: number; x: number; y: number }

/** Деталь прилипла: где «чмок» и искорка. */
export type StickEvent = { x: number; y: number }

export type SnapPiece = {
  kind: PieceKind
  x: number
  y: number
  angle: number
  color: string
  size: number
  flip: boolean
  on: boolean
  rope?: { ax: number; length: number }
  parked?: boolean
  loose?: boolean
  pinned?: boolean
  len?: number
  /** Подъёмник ездит сам вверх-вниз («Пуск!»). */
  auto?: boolean
  /** Верёвку ведёрок срезали ножницами. */
  ropeCut?: boolean
}

/**
 * Снимок для «Отменить» и сохранения комнаты: связи — индексы в `pieces`.
 * У склейки пятое число 1 — склеено кнопкой «Склеить» (не отрывается).
 */
export type SandboxSnapshot = {
  pieces: SnapPiece[]
  sticks: [number, number, number, number, number?][]
  ties: [number, number, number, number][]
  wires?: [number, number][]
  /** Кнопка, лампочка или мельница, у которой провода поменяли руками: сама больше не подключается. */
  manual?: number[]
  /** Ножницы срезали ниточку: шарик больше ни к чему не привяжется. */
  free?: number[]
}

export type AddExtra = {
  angle?: number
  color?: string
  size?: number
  flip?: boolean
  rope?: { ax: number; length: number }
  /** Ждёт, пока не толкнут (мяч на стартовой горке): не падает и не катится. */
  parked?: boolean
  /** Поставлена «на честном слове» (стартовая башенка): почти без трения, пока её не тронули. */
  loose?: boolean
  /** Прибита к стене: висит, где поставили. */
  pinned?: boolean
  /** Длина полки и жёлоба. */
  len?: number
}

type Piece = {
  id: number
  kind: PieceKind
  color: string
  size: number
  flip: boolean
  body: Body
  wheels: Body[]
  wheelJoints: RevoluteJoint[]
  /** Подвижная часть механизма и её ось. */
  link: Body | null
  linkJoint: RevoluteJoint | PrismaticJoint | null
  /** Ведёрки на блоке и их верёвки. */
  extras: Body[]
  extraJoints: Joint[]
  /** Ножницы срезали верёвку ведёрок: ведёрки лежат сами по себе. */
  ropeCut: boolean
  parked: boolean
  /** Шаткая: откуда начала, чтобы понять, что уже упала. */
  loose: Vec2Value | null
  pinned: boolean
  len: number
}

type Built = Pick<Piece, 'body' | 'wheels' | 'wheelJoints' | 'link' | 'linkJoint' | 'extras' | 'extraJoints'>

type PunchPhase = 'idle' | 'out' | 'hold' | 'back'

type Grab = { hand: number; body: Body; joint: MouseJoint; offset: Vec2Value }
type FixedGrab = { hand: number; piece: Piece; offset: Vec2Value }

/** `firm` — склеено кнопкой «Склеить»: не отрывается ни от удара, ни от «Бум!». */
type Stick = { a: number; b: number; joint: Joint; firm: boolean }
type Rope = { id: number; ax: number; length: number; joint: Joint | null }
type Tie = { balloon: number; piece: number; local: Vec2Value; joint: Joint }

const STEP = 1 / 60
const MAX_SUBSTEPS = 4
const G_EARTH = 30
const CUBE_MASS = 1.44
const PICK_RADIUS = 0.45
const IMPACT_MIN_SPEED = 3
const IMPACT_FULL_SPEED = 20
const IMPACT_REPEAT_S = 0.12
const BOUNCE_REPEAT_S = 0.25
const FREEZE_LIFT = 0.15
const FROZEN_DAMPING = 8
const BALLOON_DAMPING = 2.5
const BALLOON_MAX_SPEED = 5
const SPACE_DAMPING = { linear: 0.08, angular: 0.3 }
/** Мячик катится далеко и в мягкой физике: иначе он «вязнет» и ничего не сбивает. */
const BALL_DAMPING = { linear: 0.05, angular: 0.08 }
const WALL_SPEED = 9
const THROW_MIN_SPEED = 2
const SETTLE_S = 1.6
const SETTLE_SPEED = 0.25
const STICK_BREAK_FORCE = 260
const STICK_BREAK_TORQUE = 320
/** Липнет только ровно поставленное: разница углов с соседом до ~7°. */
const STICK_MAX_TILT = 0.12
/** Отпустил медленнее этого (единиц/с) — «поставил», быстрее — «бросил», не липнет. */
const STICK_MAX_RELEASE = 4
const LOOSE_FRICTION = 0.08
const LOOSE_FALLEN = 0.5
const LOOSE_REST_SPEED = 0.15
const LOOSE_KNOCK_SPEED = 1.2
const LOOSE_LEVEL = 1.2
/** Кольцо затягивает деталь, если она над ним в этом радиусе (в размерах кольца). */
const HOOP_PULL_REACH = 1.9
const HOOP_PULL_HEIGHT = 3
const HOOP_PULL = 22
const TIE_LENGTH = 0.9
const ROPE_FOLLOW = 0.8
const ROPE_LOOP_Y = WRECKING_LOOP_Y
/** Кнопки «Короче / Длиннее»: шаг верёвки и самая короткая. */
const ROPE_STEP = 1
const ROPE_MIN = 1.2
const GOAL_REPEAT_S = 0.8
/** Чем прилипают и к чему: круглое, кольцо и механизмы — никогда. */
const NOT_STICKY: ReadonlySet<PieceKind> = new Set([
  'ball',
  'balloon',
  'wrecking',
  'hoop',
  'seesaw',
  'conveyor',
  'mill',
  'lift',
  'cannon',
  'pulley',
  'rocket',
  'button',
  'gate',
  'pusher',
  'chute',
  'pipe',
  'trapdoor',
  'scissors',
  'launcher',
])
/** Кнопка — тумблер; дребезг (мячик подпрыгнул на шляпке) не считается вторым нажатием. */
const PRESS_DEBOUNCE_S = 0.5
/** Мельница даёт сигнал, пока колесо крутится быстрее `MILL_ON` (рад/с); гаснет ниже `MILL_OFF` через `MILL_OFF_S`. */
const MILL_ON = 3
const MILL_OFF = 1.2
const MILL_OFF_S = 0.6
/** Сколько секунд провод светится после искорки (пушка, толкатель, ракета, ножницы, катапульта). */
const WIRE_FLASH_S = 0.7
const SHUTTER_SPEED = 3.5
const SHUTTER_FORCE = 600
/** Полотно ворот поднялось больше чем наполовину — сквозь него можно проехать (оно в коробе). */
const SHUTTER_OPEN_FRAC = 0.5
const KICK_S = 0.15
const KICK_SPEED = 12
const KICK_FORCE = 900
const KICK_RETURN = 2
const LAUNCH_SPEED = 17
/** Ножницы дотягиваются до ниточки или верёвки на таком расстоянии (в размерах ножниц). */
const CUT_REACH = 2.4
/** «Склеить»: детали касаются или между ними не больше этого (кубиков). */
const GLUE_REACH = 0.6
/** Труба: полуширина входа и откуда считается «провалилось внутрь» (в размерах трубы). */
const PIPE_INNER = 0.66
const PIPE_MOUTH = -0.75
const PIPE_EXIT_SPEED = 4
const PIPE_COOLDOWN_S = 0.6
/** Влезает в дуло пушки и в отсек ракеты: наибольший размер предмета в размерах пушки/ракеты. */
const HOLD_MAX = 1.45
/** Ракета с грузом отпускает его, когда до потолка или стены осталось столько. */
const CARGO_RELEASE_GAP = 1.8
const CARGO_PUSH = 9
/** Предмет держат у дула пушки или у ракеты столько секунд — его втягивает внутрь (решение владельца 02.10.2026). */
const SUCK_S = 0.6
/** Мяу и Олли не прячутся в ракету, а надевают её как рюкзак; в пушке сидят головой наружу. */
const PASSENGERS: ReadonlySet<PieceKind> = new Set(['meow', 'olli'])
/** Низ ракеты (в её размерах): с ним вровень ноги героя в ракетном рюкзаке. */
const JETPACK_FEET = 0.75
/** Какая доля сжатого героя выглядывает из дула пушки — голова. */
const HEAD_OUT = 0.55
/** Сжатый предмет в дуле: на какую долю своей ширины его середина впереди среза дула. */
const MUZZLE_AHEAD = 0.12
/** Как быстро предмет сжимается в дуле и возвращается к своему размеру (1/с). */
const SHRINK_RATE = 14
/**
 * Парашют (решение владельца 03.10.2026): раскрывается, когда герой падает быстрее `CHUTE_OPEN_VY`
 * и до пола больше `CHUTE_MIN_H`; дальше скорость падения тянется к `CHUTE_VY`, складывается на земле.
 */
const CHUTE_OPEN_VY = 4
const CHUTE_MIN_H = 2
const CHUTE_VY = 5
const CHUTE_GRIP = 0.25
const CHUTE_CLOSE_VY = 1
const CHUTE_SWAY = 0.97
const CHUTE_UPRIGHT = 6
/** Ракета без груза после отпускания улетает сквозь потолок ещё столько секунд. */
const GHOST_BURN_S = 1.5
/** Мяу и Олли радуются поездке не чаще раза в столько секунд. */
const RIDE_REPEAT_S = 2.5
const RIDE_SPEED = 1.5
const RIDE_KINDS: ReadonlySet<PieceKind> = new Set(['cart', 'lift', 'conveyor', 'seesaw', 'launcher', 'spring', 'pulley', 'rocket'])
/** Пружина шляпки кнопки: мячик и кубик её нажимают, шарик — нет. */
const BUTTON_SPRING = 10
const LAMP_HOP_S = 0.4
const BUTTON_RETURN = 1.5
const BUTTON_FINGER_S = 0.35
const BUTTON_FINGER_FORCE = 120
/** Кнопка едет быстрее этого (кубиков/с) — она сама в движении; грузом нажимается, простояв `BUTTON_SETTLE_S`. */
const BUTTON_MOVING_SPEED = 0.6
const BUTTON_SETTLE_S = 0.25
const PUNCH_SPEED = 13
const PUNCH_FORCE = 700
const PUNCH_OUT_S = 0.4
const PUNCH_HOLD_S = 0.25
const PUNCH_BACK = 2.5
const PUNCH_IDLE_FORCE = 40
const HATCH_SPEED = 3
const HATCH_TORQUE = 400
/** Ведёрко не поднимается к колесу ближе этого. */
const PULLEY_MIN = 0.4
const ROCKET_SPIN_DAMP = 0.85
/** Тележка: скорость колёс (рад/с) и сила мотора — лёгкое толкает, тяжёлое нет. */
const CART_WHEEL_SPEED = 8
const CART_TORQUE = 3
/**
 * Тянет тележку сила на корпус, а не только колёса: так она не встаёт на дыбы.
 * Силы хватает на кубик, мячик, лёгкое; башню из кубиков и камень — нет.
 */
const CART_PUSH = 60
/** Выключенная тележка мягко тормозит, но рукой её всё ещё можно катать. */
const CART_BRAKE = 1.5
/** Лента: как быстро вещь на ней набирает скорость полотна (доля за шаг). */
const BELT_GRIP = 0.25
const LIFT_SPEED = 1.6
const LIFT_PAUSE_S = 0.8
const LIFT_FORCE = 900
const PIVOT_DAMPING = 0.05
/** Колесо мельницы без ветра останавливается за пару секунд — лампочка на её проводе гаснет. */
const AXLE_DAMPING = 0.6
const CANNON_RECOIL = 1.5
const LOADED_REACH = 0.8

/** Мягкая физика (по умолчанию) и «как в жизни» (включает взрослый). */
const MODE = {
  soft: { linear: 0.3, angular: 1.5, friction: 1.25, restitution: 0.5, maxSpeed: 22 },
  real: { linear: 0.02, angular: 0.05, friction: 1, restitution: 1, maxSpeed: 60 },
} as const

function clampLen(len: number): number {
  const steps = Math.round(len / STRETCH_STEP) * STRETCH_STEP
  return Math.min(STRETCH_MAX, Math.max(STRETCH_MIN, steps))
}

/** Расстояние от точки до отрезка. */
function segmentDistance(p: Vec2Value, a: Vec2Value, b: Vec2Value): { d: number; x: number; y: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l2 = dx * dx + dy * dy
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0
  const x = a.x + dx * t
  const y = a.y + dy * t
  return { d: Math.hypot(p.x - x, p.y - y), x, y }
}

export class SandboxWorld {
  private readonly world: World
  private readonly ground: Body
  private walls: Body | null = null
  private rightWallBody: Body | null = null
  private rightTarget: number
  private readonly pieceMap = new Map<number, Piece>()
  private sticks: Stick[] = []
  private readonly ropeMap = new Map<number, Rope>()
  private tieList: Tie[] = []
  private grabs: Grab[] = []
  private fixedGrabs: FixedGrab[] = []
  private readonly impactListeners: ((event: ImpactEvent) => void)[] = []
  private readonly goalListeners: ((event: GoalEvent) => void)[] = []
  private readonly stickListeners: ((event: StickEvent) => void)[] = []
  private pendingImpacts: ImpactEvent[] = []
  private pendingGoals: GoalEvent[] = []
  private pendingSticks: StickEvent[] = []
  private pendingUnpark = new Set<number>()
  private pendingKnock = 0
  private pendingBounces: { spring: Piece; body: Body }[] = []
  private pendingTies: { balloon: number; piece: number; point: Vec2Value }[] = []
  private readonly lastImpact = new Map<number, number>()
  private readonly lastBounce = new WeakMap<Body, number>()
  private readonly lastGoal = new Map<number, number>()
  private readonly prevPos = new Map<number, Vec2Value>()
  private readonly settling = new Map<number, number>()
  private readonly power = new Set<number>()
  private readonly fanSpin = new Map<number, number>()
  /** Подъёмник на «Пуск!»: куда едет (+1 вверх) и до какого времени стоит на краю. */
  private readonly liftState = new Map<number, { dir: number; until: number }>()
  private readonly liftAuto = new Set<number>()
  /** Пушка или ракета → предмет в дуле или в отсеке. */
  private readonly holds = new Map<number, number>()
  /** Когда предмет снова сталкивается с пушкой/ракетой и когда его можно зарядить снова. */
  private readonly ungroupAt = new Map<number, number>()
  private readonly reloadAt = new Map<number, number>()
  /** Предмет в пальце у пушки/ракеты: с какого времени его втягивает. */
  private readonly sucking = new Map<number, { holder: number; since: number }>()
  /** Вынули рукой из пушки/ракеты: снова втянется, только когда его унесут и поднесут опять. */
  private readonly pulledOut = new Set<number>()
  /** Предметы внутри ракеты: сквозные, в комнате не рисуются. */
  private readonly insideSet = new Set<number>()
  /** Предметы в дуле пушки: сквозные, на экране сжаты до жерла. */
  private readonly muzzleSet = new Set<number>()
  /** Во сколько раз предмет сейчас нарисован меньше (в дуле и сразу после выстрела). */
  private readonly shrinks = new Map<number, number>()
  /** Мяу и Олли на парашюте: с какого времени раскрыт. */
  private readonly chutes = new Map<number, number>()
  private readonly actionListeners: ((event: ActionEvent) => void)[] = []
  private pendingActions: ActionEvent[] = []
  private pendingPops = new Set<number>()
  /** Провода: источник → механизмы (до трёх). Провод запоминается и не перескакивает. */
  private readonly wireMap = new Map<number, number[]>()
  /** Источники, у которых провода поменяли руками: сами больше не подключаются. */
  private readonly manualWires = new Set<number>()
  /** Провод «источник>механизм» светится до этого времени. */
  private readonly wireFlash = new Map<string, number>()
  /** Лампочка горит / мельница крутится — на прошлом шаге (сигнал идёт по фронту). */
  private readonly sourceOn = new Map<number, boolean>()
  private readonly millSlowSince = new Map<number, number>()
  private readonly wasPressed = new Set<number>()
  private readonly lastPress = new Map<number, number>()
  /** С какого времени кнопка стоит спокойно (не падает и её не несут). */
  private readonly buttonRest = new Map<number, number>()
  /** Сигнал от лампочки идёт к следующему механизму с задержкой — лампочки загораются по очереди. */
  private hopQueue: { at: number; sourceId: number; targetId: number; on: boolean }[] = []
  private readonly fingerPress = new Map<number, number>()
  private readonly punchState = new Map<number, { phase: PunchPhase; until: number }>()
  private readonly kickUntil = new Map<number, number>()
  private readonly burnUntil = new Map<number, number>()
  /** Ракета отпустила груз и улетает сквозь потолок. */
  private readonly ghosts = new Set<number>()
  /** Шарики, у которых ножницы срезали ниточку. */
  private readonly freeBalloons = new Set<number>()
  private readonly teleportUntil = new Map<number, number>()
  private readonly lastRide = new Map<number, number>()
  private nextId = 1
  private readonly paintCount = new Map<PieceKind, number>()
  private acc = 0
  private time = 0
  private frozen = false
  private space = false
  private opts: WorldOptions
  private readonly random: () => number

  constructor(opts: WorldOptions) {
    this.opts = { ...opts }
    this.random = opts.random ?? Math.random
    this.rightTarget = opts.rightX ?? opts.width
    this.world = new World({ gravity: Vec2(0, G_EARTH) })
    this.ground = this.world.createBody()
    this.buildWalls()
    this.world.on('begin-contact', (contact) => this.onContact(contact))
  }

  // ── Комната ──

  resize(
    width: number,
    height: number,
    floorY: number,
    ceilingY: number,
    leftX = this.opts.leftX ?? 0,
    rightX = this.rightTarget,
  ): void {
    this.opts = { ...this.opts, width, height, floorY, ceilingY, leftX }
    this.rightTarget = Math.min(rightX, width)
    this.buildWalls()
    for (const rope of this.ropeMap.values()) {
      rope.ax = this.clampX(rope.ax)
      rope.length = Math.min(rope.length, this.maxRopeLength(rope.id))
      this.connectRope(rope)
    }
    for (const piece of this.pieceMap.values()) this.keepInside(piece)
  }

  /** Шкаф выехал или уехал: стенка плавно едет к новому краю и отодвигает детали. */
  setRightWall(x: number, instant = false): void {
    const left = this.opts.leftX ?? 0
    this.rightTarget = Math.max(left + 2, Math.min(x, this.opts.width))
    if (instant && this.rightWallBody) {
      this.rightWallBody.setTransform(Vec2(this.rightTarget, 0), 0)
      this.rightWallBody.setLinearVelocity(Vec2(0, 0))
    }
  }

  rightWall(): number {
    return this.rightWallBody?.getPosition().x ?? this.opts.width
  }

  private buildWalls(): void {
    if (this.walls) this.world.destroyBody(this.walls)
    const { width, floorY, ceilingY } = this.opts
    const left = this.opts.leftX ?? 0
    const walls = this.world.createBody()
    const edge = (body: Body, a: Vec2Value, b: Vec2Value): void => {
      body.createFixture({ shape: new Edge(Vec2(a.x, a.y), Vec2(b.x, b.y)), friction: 0.9 })
    }
    edge(walls, { x: left - 20, y: floorY }, { x: width + 20, y: floorY })
    edge(walls, { x: left, y: ceilingY - 40 }, { x: left, y: floorY + 1 })
    edge(walls, { x: left - 20, y: ceilingY }, { x: width + 20, y: ceilingY })
    walls.setUserData(-1)
    this.walls = walls

    if (this.rightWallBody) this.world.destroyBody(this.rightWallBody)
    const right = this.world.createBody({ type: 'kinematic', position: Vec2(this.rightTarget, 0) })
    edge(right, { x: 0, y: ceilingY - 40 }, { x: 0, y: floorY + 1 })
    right.setUserData(-1)
    this.rightWallBody = right
  }

  private moveRightWall(): void {
    const wall = this.rightWallBody
    if (!wall) return
    const d = this.rightTarget - wall.getPosition().x
    if (Math.abs(d) < 1e-3) {
      wall.setLinearVelocity(Vec2(0, 0))
      return
    }
    const v = Math.sign(d) * Math.min(Math.abs(d) / STEP, WALL_SPEED)
    wall.setLinearVelocity(Vec2(v, 0))
  }

  // ── Детали ──

  add(kind: PieceKind, x: number, y: number, extra: AddExtra = {}): number {
    const spec = getPieceSpec(kind)
    const id = this.nextId++
    const size = extra.size ?? 1
    const flip = extra.flip ?? false
    const pinned = (extra.pinned ?? false) && !spec.fixed
    const parked = (extra.parked ?? false) && !spec.fixed && !pinned
    const loose = extra.loose ? { x, y } : null
    const len = spec.stretch ? clampLen(extra.len ?? 1) : 1
    const built = this.build(id, kind, x, y, extra.angle ?? 0, size, flip, loose !== null, len, pinned)
    if (parked) built.body.setType('static')
    const color = extra.color ?? this.takeColor(kind)
    const piece: Piece = { id, kind, color, size, flip, ...built, ropeCut: false, parked, loose, pinned, len }
    this.pieceMap.set(id, piece)
    if (spec.startsOn) this.power.add(id)
    if (SIGNAL_SOURCES.has(kind)) this.sourceOn.set(id, false)
    this.autoWire()
    if (this.frozen) this.applyFrozen(piece)
    if (spec.rope) {
      const ax = this.clampX(extra.rope?.ax ?? x)
      const length =
        extra.rope?.length ??
        Math.min(Math.max(y - this.opts.ceilingY - ROPE_LOOP_Y * size, 1.2), this.maxRopeLength(id))
      const rope: Rope = { id, ax, length, joint: null }
      this.ropeMap.set(id, rope)
      this.connectRope(rope)
    }
    return id
  }

  /** Цвет следующей детали этого вида — его показывает иконка в шкафу. */
  nextColor(kind: PieceKind): string {
    if (kind === 'pipe') return pipeColor(Math.floor(this.kinds().filter((k) => k === 'pipe').length / 2))
    return pieceColor(kind, PIECE_KINDS.indexOf(kind) * 2 + (this.paintCount.get(kind) ?? 0))
  }

  private takeColor(kind: PieceKind): string {
    const color = this.nextColor(kind)
    this.paintCount.set(kind, (this.paintCount.get(kind) ?? 0) + 1)
    return color
  }

  private build(
    id: number,
    kind: PieceKind,
    x: number,
    y: number,
    angle: number,
    size: number,
    flip: boolean,
    loose = false,
    len = 1,
    pinned = false,
  ): Built {
    const spec = getPieceSpec(kind)
    const mode = this.mode()
    const fx = flip ? -size : size
    const body = this.world.createBody({
      type: spec.fixed || pinned ? 'static' : 'dynamic',
      position: Vec2(x, y),
      angle,
      bullet: kind === 'ball' || kind === 'wrecking',
    })
    body.setUserData(id)
    const addParts = (target: Body, parts: readonly ShapePart[], density: number): void => {
      for (const part of parts) {
        const shape =
          part.type === 'circle'
            ? new Circle(Vec2((part.x ?? 0) * fx, (part.y ?? 0) * size), part.r * size)
            : new Polygon(part.points.map((p) => Vec2(p.x * fx, p.y * size)))
        target.createFixture({
          shape,
          density,
          friction: loose ? LOOSE_FRICTION : spec.body.friction * mode.friction,
          restitution: spec.body.restitution * mode.restitution,
          // Своя группа у пушки и ракеты: предмет в дуле или в отсеке с ними не сталкивается.
          filterGroupIndex: spec.muzzle || spec.thrust ? -id : 0,
        })
      }
    }
    addParts(body, spec.stretch ? spec.stretch(len) : spec.parts, spec.body.density)
    if (kind === 'balloon') body.setGravityScale(0)

    const wheels: Body[] = []
    const wheelJoints: RevoluteJoint[] = []
    for (const w of spec.wheels ?? []) {
      const pos = body.getWorldPoint(Vec2(w.x * fx, w.y * size))
      const wheel = this.world.createBody({ type: 'dynamic', position: pos })
      wheel.setUserData(id)
      wheel.createFixture({ shape: new Circle(w.r * size), density: 1.2, friction: 1, restitution: 0.05 })
      const joint = this.world.createJoint(
        new RevoluteJoint({ enableMotor: true, motorSpeed: 0, maxMotorTorque: CART_BRAKE * size * size }, body, wheel, pos),
      )
      if (joint) wheelJoints.push(joint)
      wheels.push(wheel)
    }

    let link: Body | null = null
    let linkJoint: RevoluteJoint | PrismaticJoint | null = null
    if (spec.link) {
      const pos = body.getWorldPoint(Vec2(spec.link.at.x * fx, spec.link.at.y * size))
      link = this.world.createBody({ type: 'dynamic', position: pos, angle })
      link.setUserData(id)
      addParts(link, spec.link.parts, spec.link.density)
      const travel = (spec.link.travel ?? 1) * size
      if (spec.link.type === 'press') {
        linkJoint = this.world.createJoint(
          new PrismaticJoint(
            {
              enableLimit: true,
              lowerTranslation: -travel,
              upperTranslation: 0,
              enableMotor: true,
              maxMotorForce: BUTTON_SPRING * size * size,
              motorSpeed: BUTTON_RETURN,
            },
            body,
            link,
            pos,
            Vec2(Math.sin(angle), -Math.cos(angle)),
          ),
        )
      } else if (spec.link.type === 'punch') {
        const dir = flip ? -1 : 1
        linkJoint = this.world.createJoint(
          new PrismaticJoint(
            {
              enableLimit: true,
              lowerTranslation: 0,
              upperTranslation: travel,
              enableMotor: true,
              maxMotorForce: PUNCH_IDLE_FORCE * size * size,
              motorSpeed: -1,
            },
            body,
            link,
            pos,
            Vec2(Math.cos(angle) * dir, Math.sin(angle) * dir),
          ),
        )
      } else if (spec.link.type === 'hatch') {
        const swing = spec.link.limit ?? Math.PI / 2
        linkJoint = this.world.createJoint(
          new RevoluteJoint(
            {
              enableLimit: true,
              lowerAngle: flip ? -swing : 0,
              upperAngle: flip ? 0 : swing,
              enableMotor: true,
              maxMotorTorque: HATCH_TORQUE * size * size * size,
              motorSpeed: flip ? HATCH_SPEED : -HATCH_SPEED,
            },
            body,
            link,
            pos,
          ),
        )
      } else if (spec.link.type === 'slider' || spec.link.type === 'shutter' || spec.link.type === 'kick') {
        const type = spec.link.type
        const travel = (spec.link.travel ?? 2) * size
        const up = Vec2(Math.sin(angle), -Math.cos(angle))
        const force = type === 'slider' ? LIFT_FORCE : type === 'shutter' ? SHUTTER_FORCE : KICK_FORCE
        const speed = type === 'slider' ? -LIFT_SPEED : type === 'shutter' ? -SHUTTER_SPEED : -KICK_RETURN
        linkJoint = this.world.createJoint(
          new PrismaticJoint(
            {
              enableLimit: true,
              lowerTranslation: 0,
              upperTranslation: travel,
              enableMotor: true,
              maxMotorForce: force * size * size,
              motorSpeed: speed,
            },
            body,
            link,
            pos,
            up,
          ),
        )
      } else {
        const limit = spec.link.limit
        linkJoint = this.world.createJoint(
          new RevoluteJoint(
            limit === undefined ? {} : { enableLimit: true, lowerAngle: -limit, upperAngle: limit },
            body,
            link,
            pos,
          ),
        )
      }
    }

    const damping = this.dampingFor(kind)
    for (const b of [body, ...wheels]) {
      b.setLinearDamping(damping.linear)
      b.setAngularDamping(b === body ? damping.angular : this.frozen ? FROZEN_DAMPING : 0.2)
    }
    if (link) {
      link.setLinearDamping(damping.linear)
      link.setAngularDamping(spec.link?.type === 'axle' ? AXLE_DAMPING : PIVOT_DAMPING)
    }

    const extras: Body[] = []
    let extraJoints: Joint[] = []
    if (spec.pulley) {
      for (const side of [-1, 1]) {
        const wheel = body.getWorldPoint(Vec2(side * spec.pulley.x * size, spec.pulley.y * size))
        const bucket = this.world.createBody({
          type: 'dynamic',
          position: Vec2(wheel.x, wheel.y + (spec.pulley.rope - BUCKET_HANDLE_Y) * size),
        })
        bucket.setUserData(id)
        addParts(bucket, BUCKET_PARTS, BUCKET_DENSITY)
        bucket.setLinearDamping(0.6)
        bucket.setAngularDamping(3)
        extras.push(bucket)
      }
      extraJoints = this.pulleyJoints(body, extras, size, spec.pulley)
    }
    return { body, wheels, wheelJoints, link, linkJoint, extras, extraJoints }
  }

  /** Верёвка через два колеса: одно ведёрко вниз — другое вверх; к колесу ближе `PULLEY_MIN` не подходят. */
  private pulleyJoints(beam: Body, buckets: Body[], size: number, spec: PulleySpec): Joint[] {
    const [a, b] = buckets
    if (!a || !b) return []
    const handle = Vec2(0, BUCKET_HANDLE_Y * size)
    const ga = beam.getWorldPoint(Vec2(-spec.x * size, spec.y * size))
    const gb = beam.getWorldPoint(Vec2(spec.x * size, spec.y * size))
    const ha = a.getWorldPoint(handle)
    const hb = b.getWorldPoint(handle)
    const total = Math.hypot(ha.x - ga.x, ha.y - ga.y) + Math.hypot(hb.x - gb.x, hb.y - gb.y)
    const joints: Joint[] = []
    const pulley = this.world.createJoint(new PulleyJoint({}, a, b, ga, gb, ha, hb, 1))
    if (pulley) joints.push(pulley)
    for (const [bucket, ground] of [
      [a, ga],
      [b, gb],
    ] as const) {
      const rope = this.world.createJoint(
        new RopeJoint({
          maxLength: total - PULLEY_MIN * size,
          localAnchorA: ground,
          localAnchorB: handle,
          bodyA: this.ground,
          bodyB: bucket,
        }),
      )
      if (rope) joints.push(rope)
    }
    return joints
  }

  /** Перекладину перенесли: ведёрки едут следом, верёвки цепляются заново. */
  private moveExtras(piece: Piece, dx: number, dy: number): void {
    const spec = getPieceSpec(piece.kind).pulley
    if (!spec || piece.extras.length === 0 || piece.ropeCut) return
    for (const joint of piece.extraJoints) this.world.destroyJoint(joint)
    for (const bucket of piece.extras) {
      const p = bucket.getPosition()
      bucket.setTransform(Vec2(p.x + dx, p.y + dy), bucket.getAngle())
      bucket.setAwake(true)
    }
    piece.extraJoints = this.pulleyJoints(piece.body, piece.extras, piece.size, spec)
  }

  /** Верёвку ведёрок срезали: ведёрки становятся двумя отдельными предметами и падают. */
  private dropBuckets(piece: Piece): void {
    const falling = piece.extras.map((b) => ({
      at: b.getPosition().clone(),
      angle: b.getAngle(),
      v: b.getLinearVelocity().clone(),
      w: b.getAngularVelocity(),
    }))
    this.shedBuckets(piece)
    for (const f of falling) {
      const id = this.add('bucket', f.at.x, f.at.y, { angle: f.angle, size: piece.size })
      const body = this.pieceMap.get(id)!.body
      body.setLinearVelocity(f.v)
      body.setAngularVelocity(f.w)
      body.setAwake(true)
    }
  }

  /** Перекладина со срезанной верёвкой — без ведёрок (они лежат в комнате отдельными предметами). */
  private shedBuckets(piece: Piece): void {
    for (const joint of piece.extraJoints) this.world.destroyJoint(joint)
    for (const bucket of piece.extras) this.world.destroyBody(bucket)
    piece.extraJoints = []
    piece.extras = []
    piece.ropeCut = true
  }

  /** Верёвки ведёрок в мире: от колеса к ручке. */
  private cordsOf(piece: Piece): { ax: number; ay: number; bx: number; by: number }[] {
    const pulley = getPieceSpec(piece.kind).pulley
    if (!pulley || piece.ropeCut) return []
    return piece.extras.map((b, i) => {
      const wheel = piece.body.getWorldPoint(Vec2((i === 0 ? -1 : 1) * pulley.x * piece.size, pulley.y * piece.size))
      const handle = b.getWorldPoint(Vec2(0, BUCKET_HANDLE_Y * piece.size))
      return { ax: wheel.x, ay: wheel.y, bx: handle.x, by: handle.y }
    })
  }

  /** Все тела детали: корпус, колёса, подвижная часть, ведёрки. */
  private bodiesOf(piece: Piece): Body[] {
    const bodies = [piece.body, ...piece.wheels]
    if (piece.link) bodies.push(piece.link)
    bodies.push(...piece.extras)
    return bodies
  }

  private destroyBodies(piece: Piece): void {
    for (const wheel of piece.wheels) this.world.destroyBody(wheel)
    if (piece.link) this.world.destroyBody(piece.link)
    for (const bucket of piece.extras) this.world.destroyBody(bucket)
    this.world.destroyBody(piece.body)
  }

  remove(id: number): void {
    const piece = this.pieceMap.get(id)
    if (!piece) return
    this.detach(piece)
    const rope = this.ropeMap.get(id)
    if (rope?.joint) this.world.destroyJoint(rope.joint)
    this.ropeMap.delete(id)
    this.grabs = this.grabs.filter((g) => {
      if (g.body !== piece.body) return true
      this.world.destroyJoint(g.joint)
      return false
    })
    this.fixedGrabs = this.fixedGrabs.filter((g) => g.piece !== piece)
    this.destroyBodies(piece)
    this.pieceMap.delete(id)
    this.settling.delete(id)
    this.power.delete(id)
    this.fanSpin.delete(id)
    this.liftState.delete(id)
    this.liftAuto.delete(id)
    this.ungroupAt.delete(id)
    this.reloadAt.delete(id)
    this.sucking.delete(id)
    this.pulledOut.delete(id)
    this.chutes.delete(id)
    this.insideSet.delete(id)
    this.muzzleSet.delete(id)
    this.shrinks.delete(id)
    this.wasPressed.delete(id)
    this.lastPress.delete(id)
    this.buttonRest.delete(id)
    this.fingerPress.delete(id)
    this.punchState.delete(id)
    this.kickUntil.delete(id)
    this.burnUntil.delete(id)
    this.ghosts.delete(id)
    this.freeBalloons.delete(id)
    this.teleportUntil.delete(id)
    this.lastRide.delete(id)
    this.pendingPops.delete(id)
    this.sourceOn.delete(id)
    this.millSlowSince.delete(id)
    this.wireMap.delete(id)
    this.manualWires.delete(id)
    for (const [source, targets] of this.wireMap) {
      if (targets.includes(id)) this.wireMap.set(source, targets.filter((t) => t !== id))
    }
    for (const [c, b] of this.holds) if (c === id || b === id) this.holds.delete(c)
    this.prevPos.delete(id)
    this.pendingUnpark.delete(id)
    this.lastImpact.delete(id)
    this.lastGoal.delete(id)
    for (const key of this.wireFlash.keys()) {
      const [s, t] = key.split('>')
      if (Number(s) === id || Number(t) === id) this.wireFlash.delete(key)
    }
    this.unparkAll()
  }

  // ── Мяч ждёт на горке, шаткая башенка ──

  isParked(id: number): boolean {
    return this.pieceMap.get(id)?.parked ?? false
  }

  isLoose(id: number): boolean {
    return (this.pieceMap.get(id)?.loose ?? null) !== null
  }

  /** Толкнули ждущий мяч — покатился. */
  push(id: number): void {
    this.unpark(id)
    this.pieceMap.get(id)?.body.setAwake(true)
  }

  private unpark(id: number): void {
    const piece = this.pieceMap.get(id)
    if (!piece?.parked) return
    piece.parked = false
    piece.body.setType('dynamic')
    piece.body.setAwake(true)
  }

  /** Что-то поменялось рядом (убрали, перестроили, тряхнули) — ждать больше нельзя. */
  private unparkAll(): void {
    for (const piece of this.pieceMap.values()) if (piece.parked) this.unpark(piece.id)
  }

  private firm(piece: Piece): void {
    if (!piece.loose) return
    piece.loose = null
    this.applyMode(piece)
    for (let edge = piece.body.getContactList(); edge; edge = edge.next ?? null) edge.contact.resetFriction()
  }

  /**
   * В шаткую башенку врезались — она валится целиком, «ух!». Мягкая физика
   * сама только сдвигает стопку, поэтому падение задаём толчком: чем выше, тем сильнее.
   */
  private knockFrom(target: Piece, hitter: Body): void {
    const v = hitter.getLinearVelocity()
    if (this.pendingKnock !== 0 || Math.hypot(v.x, v.y) < LOOSE_KNOCK_SPEED) return
    const dir = target.body.getPosition().x >= hitter.getPosition().x ? 1 : -1
    this.pendingKnock = dir
  }

  private knockLoose(dir: number): void {
    for (const piece of this.pieceMap.values()) {
      if (!piece.loose) continue
      const level = Math.max(0, (this.opts.floorY - piece.body.getPosition().y) / LOOSE_LEVEL - 0.5)
      piece.body.setLinearVelocity(Vec2(dir * (1 + 1.8 * level), -0.6 * level))
      piece.body.setAngularVelocity(dir * (1 + level))
      piece.body.setAwake(true)
      this.firm(piece)
    }
  }

  /** Шаткие детали, которые уже упали и успокоились, становятся обычными. */
  private firmFallen(): void {
    for (const piece of this.pieceMap.values()) {
      if (!piece.loose) continue
      const p = piece.body.getPosition()
      if (Math.hypot(p.x - piece.loose.x, p.y - piece.loose.y) < LOOSE_FALLEN) continue
      const v = piece.body.getLinearVelocity()
      if (Math.hypot(v.x, v.y) < LOOSE_REST_SPEED && Math.abs(piece.body.getAngularVelocity()) < LOOSE_REST_SPEED) {
        this.firm(piece)
      }
    }
  }

  /** Убрать липучку и верёвочки шариков, связанные с деталью. */
  private detach(piece: Piece): void {
    this.sticks = this.sticks.filter((s) => {
      if (s.a !== piece.id && s.b !== piece.id) return true
      this.world.destroyJoint(s.joint)
      return false
    })
    this.tieList = this.tieList.filter((t) => {
      if (t.balloon !== piece.id && t.piece !== piece.id) return true
      this.world.destroyJoint(t.joint)
      return false
    })
  }

  clear(): void {
    this.releaseGrab()
    for (const id of [...this.pieceMap.keys()]) this.remove(id)
    this.pendingTies = []
  }

  count(): number {
    return this.pieceMap.size
  }

  kinds(): PieceKind[] {
    return [...this.pieceMap.values()].map((p) => p.kind)
  }

  has(id: number): boolean {
    return this.pieceMap.has(id)
  }

  kindOf(id: number): PieceKind | null {
    return this.pieceMap.get(id)?.kind ?? null
  }

  sizeOf(id: number): number | null {
    return this.pieceMap.get(id)?.size ?? null
  }

  /** Деталь под пальцем: сверху — самая новая; тонкую можно взять чуть мимо. */
  pieceAt(x: number, y: number): number | null {
    const exact = this.idsAtPoint(x, y)
    if (exact.length) return Math.max(...exact)
    const near = new Set<number>()
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4
      for (const id of this.idsAtPoint(x + Math.cos(a) * PICK_RADIUS, y + Math.sin(a) * PICK_RADIUS)) near.add(id)
    }
    return near.size ? Math.max(...near) : null
  }

  private idsAtPoint(x: number, y: number): number[] {
    const p = Vec2(x, y)
    const ids: number[] = []
    this.world.queryAABB({ lowerBound: Vec2(x - 0.01, y - 0.01), upperBound: Vec2(x + 0.01, y + 0.01) }, (fixture) => {
      const id = fixture.getBody().getUserData()
      if (typeof id === 'number' && id > 0 && !this.insideSet.has(id) && fixture.testPoint(p)) ids.push(id)
      return true
    })
    return ids
  }

  /** Габарит детали в мире — куда поставить кнопки рядом с ней. */
  boundsOf(id: number): { x0: number; y0: number; x1: number; y1: number } | null {
    const piece = this.pieceMap.get(id)
    return piece ? this.bounds(piece) : null
  }

  /** Верх самой высокой детали в полосе x0..x1 (null — пусто). */
  topAt(x0: number, x1: number): number | null {
    let top: number | null = null
    for (const piece of this.pieceMap.values()) {
      const b = this.bounds(piece)
      if (b.x1 < x0 || b.x0 > x1) continue
      top = top === null ? b.y0 : Math.min(top, b.y0)
    }
    return top
  }

  nudge(id: number, velocity: Vec2Value): void {
    this.unpark(id)
    const body = this.pieceMap.get(id)?.body
    if (!body || body.isStatic()) return
    body.setLinearVelocity(Vec2(velocity.x, velocity.y))
    body.setAwake(true)
  }

  /** Кнопка «Повернуть»: +90° (вместе с прилипшими) или зеркально. false — круглая деталь. */
  turn(id: number): boolean {
    const piece = this.pieceMap.get(id)
    if (!piece) return false
    const kind = getPieceSpec(piece.kind).turn
    if (kind === 'none') return false
    this.firm(piece)
    this.unparkAll()
    if (kind === 'flip') {
      this.rebuild(piece, piece.size, !piece.flip)
      return true
    }
    const angle = piece.body.getAngle()
    const delta = rotateQuarter(angle) - angle
    const pivot = piece.body.getPosition().clone()
    const cos = Math.cos(delta)
    const sin = Math.sin(delta)
    for (const body of this.clusterBodies(id)) {
      const p = body.getPosition()
      const dx = p.x - pivot.x
      const dy = p.y - pivot.y
      body.setTransform(Vec2(pivot.x + dx * cos - dy * sin, pivot.y + dx * sin + dy * cos), body.getAngle() + delta)
      body.setAngularVelocity(0)
      body.setAwake(true)
    }
    return true
  }

  /** Кнопки «Больше / Меньше»: деталь пересоздаётся, низ остаётся на месте. */
  setSize(id: number, size: number): boolean {
    const piece = this.pieceMap.get(id)
    if (!piece || size === piece.size) return false
    this.rebuild(piece, size, piece.flip)
    return true
  }

  /** Длина полки и жёлоба; null — у детали длина не меняется. */
  lengthOf(id: number): number | null {
    const piece = this.pieceMap.get(id)
    return piece && getPieceSpec(piece.kind).stretch ? piece.len : null
  }

  /** Кнопки «Короче / Длиннее» у полки и жёлоба. false — уже самая короткая/длинная или не полка. */
  changeLength(id: number, dir: 1 | -1): boolean {
    const piece = this.pieceMap.get(id)
    if (!piece || !getPieceSpec(piece.kind).stretch) return false
    const next = clampLen(piece.len + dir * STRETCH_STEP)
    if (Math.abs(next - piece.len) < 1e-6) return false
    piece.len = next
    this.rebuild(piece, piece.size, piece.flip)
    return true
  }

  /** Висит, где поставили: полка, кольцо, ведёрки — всегда; остальное — если прибили. */
  private isFixedPiece(piece: Piece): boolean {
    return Boolean(getPieceSpec(piece.kind).fixed) || piece.pinned
  }

  isPinned(id: number): boolean {
    return this.pieceMap.get(id)?.pinned ?? false
  }

  /** Можно прибить: не полка/кольцо (они и так висят) и не шарик. */
  canPin(id: number): boolean {
    const piece = this.pieceMap.get(id)
    return piece !== undefined && !getPieceSpec(piece.kind).fixed && piece.kind !== 'balloon'
  }

  /** «Прибить»: деталь висит на стене, где стоит; ещё раз — падает. Возвращает новое состояние. */
  setPinned(id: number, on: boolean): boolean | null {
    const piece = this.pieceMap.get(id)
    if (!piece || !this.canPin(id)) return null
    if (piece.pinned === on) return on
    piece.pinned = on
    piece.parked = false
    this.firm(piece)
    this.grabs = this.grabs.filter((g) => {
      if (g.body !== piece.body) return true
      this.world.destroyJoint(g.joint)
      return false
    })
    piece.body.setType(on ? 'static' : 'dynamic')
    if (!on) {
      this.applyMode(piece)
      if (this.frozen) this.applyFrozen(piece)
    }
    for (const body of this.bodiesOf(piece)) body.setAwake(true)
    return on
  }

  private rebuild(piece: Piece, size: number, flip: boolean): void {
    const oldBottom = this.bounds(piece).y1
    const pos = piece.body.getPosition().clone()
    const angle = piece.body.getAngle()
    this.detach(piece)
    this.grabs = this.grabs.filter((g) => {
      if (g.body !== piece.body) return true
      this.world.destroyJoint(g.joint)
      return false
    })
    const rope = this.ropeMap.get(piece.id)
    if (rope?.joint) {
      this.world.destroyJoint(rope.joint)
      rope.joint = null
    }
    this.destroyBodies(piece)
    const built = this.build(piece.id, piece.kind, pos.x, pos.y, angle, size, flip, false, piece.len, piece.pinned)
    Object.assign(piece, built)
    if (piece.ropeCut) this.shedBuckets(piece)
    this.liftState.delete(piece.id)
    this.punchState.delete(piece.id)
    this.kickUntil.delete(piece.id)
    piece.size = size
    piece.flip = flip
    piece.parked = false
    piece.loose = null
    this.unparkAll()
    const shift = oldBottom - this.bounds(piece).y1
    if (!this.isFixedPiece(piece)) {
      for (const body of this.bodiesOf(piece)) {
        const p = body.getPosition()
        body.setTransform(Vec2(p.x, p.y + shift), body.getAngle())
      }
    }
    if (this.frozen) this.applyFrozen(piece)
    if (rope) {
      rope.length = Math.min(rope.length, this.maxRopeLength(piece.id))
      this.connectRope(rope)
    }
    // Новые фигуры твёрдые: предмет в пушке или ракете снова сквозной для своего держателя.
    const holder = this.holderOf(piece.id)
    if (holder) {
      this.setGroup(piece, -holder.id)
      if (this.muzzleSet.has(piece.id) || this.insideSet.has(piece.id)) this.setSensor(piece, true)
    }
  }

  // ── Шар-таран ──

  ropes(): RopeView[] {
    return [...this.ropeMap.values()].map((rope) => {
      const piece = this.pieceMap.get(rope.id)!
      const loop = piece.body.getWorldPoint(Vec2(0, -ROPE_LOOP_Y * piece.size))
      return { id: rope.id, ax: rope.ax, ay: this.opts.ceilingY, bx: loop.x, by: loop.y }
    })
  }

  private connectRope(rope: Rope): void {
    const piece = this.pieceMap.get(rope.id)
    if (!piece) return
    if (rope.joint) this.world.destroyJoint(rope.joint)
    rope.joint = this.world.createJoint(
      new RopeJoint({
        maxLength: rope.length,
        localAnchorA: Vec2(rope.ax, this.opts.ceilingY),
        localAnchorB: Vec2(0, -ROPE_LOOP_Y * piece.size),
        bodyA: this.ground,
        bodyB: piece.body,
      }),
    )
  }

  /** Длина верёвки до петли: шар висит не ниже чем на 0,1 над полом. */
  private maxRopeLength(id: number): number {
    const size = this.pieceMap.get(id)?.size ?? 1
    const r = 0.7 * size
    return Math.max(ROPE_MIN, this.opts.floorY - this.opts.ceilingY - r - ROPE_LOOP_Y * size - 0.1)
  }

  ropeLength(id: number): number | null {
    return this.ropeMap.get(id)?.length ?? null
  }

  /** Кнопки «Короче / Длиннее». false — верёвки нет или уже край. */
  changeRope(id: number, dir: 1 | -1): boolean {
    const rope = this.ropeMap.get(id)
    const piece = this.pieceMap.get(id)
    if (!rope || !piece) return false
    const next = Math.min(Math.max(rope.length + dir * ROPE_STEP, ROPE_MIN), this.maxRopeLength(id))
    if (Math.abs(next - rope.length) < 0.01) return false
    rope.length = next
    this.connectRope(rope)
    piece.body.setAwake(true)
    return true
  }

  // ── Шарик на верёвочке ──

  ties(): TieView[] {
    return this.tieList.map((tie) => {
      const balloon = this.pieceMap.get(tie.balloon)!
      const target = this.pieceMap.get(tie.piece)!
      const a = balloon.body.getWorldPoint(Vec2(0, 0.6 * balloon.size))
      const b = target.body.getWorldPoint(Vec2(tie.local.x, tie.local.y))
      return { balloonId: tie.balloon, ax: a.x, ay: a.y, bx: b.x, by: b.y }
    })
  }

  /** Тап по шарику — лопнул. false — это не шарик. */
  pop(id: number): boolean {
    if (this.pieceMap.get(id)?.kind !== 'balloon') return false
    this.remove(id)
    return true
  }

  /** Привязать шарик к верху детали (готовые машины). false — не шарик или привязать нельзя. */
  attach(balloonId: number, pieceId: number): boolean {
    const target = this.pieceMap.get(pieceId)
    if (this.pieceMap.get(balloonId)?.kind !== 'balloon' || !target) return false
    const b = this.bounds(target)
    this.tie(balloonId, pieceId, target.body.getLocalPoint(Vec2((b.x0 + b.x1) / 2, b.y0 + 0.05)))
    return this.tieList.some((t) => t.balloon === balloonId && t.piece === pieceId)
  }

  private tie(balloonId: number, pieceId: number, local: Vec2Value): void {
    const balloon = this.pieceMap.get(balloonId)
    const target = this.pieceMap.get(pieceId)
    if (!balloon || !target || this.freeBalloons.has(balloonId) || this.tieList.some((t) => t.balloon === balloonId)) return
    if (this.ghosts.has(pieceId) || getPieceSpec(target.kind).fixed) return
    const joint = this.world.createJoint(
      new RopeJoint({
        maxLength: TIE_LENGTH * balloon.size,
        localAnchorA: Vec2(0, 0.6 * balloon.size),
        localAnchorB: Vec2(local.x, local.y),
        bodyA: balloon.body,
        bodyB: target.body,
      }),
    )
    if (joint) this.tieList.push({ balloon: balloonId, piece: pieceId, local, joint })
  }

  // ── Моторы: вентилятор, тележка, лента, лифт ──

  isOn(id: number): boolean {
    return this.power.has(id)
  }

  /** Кнопка «Вкл/Выкл» (у подъёмника — «Вверх/Вниз»): новое состояние; null — у детали нет мотора. */
  togglePower(id: number): boolean | null {
    const piece = this.pieceMap.get(id)
    if (!piece || !getPieceSpec(piece.kind).motor) return null
    this.liftAuto.delete(id)
    this.setPower(piece, !this.power.has(id))
    return this.power.has(id)
  }

  /** Подъёмник ездит сам вверх-вниз («Пуск!»). */
  isAuto(id: number): boolean {
    return this.liftAuto.has(id)
  }

  /**
   * Кнопка «Пуск!»: моторы, ворота, люки и лампочки, заряженные пушки, толкатели, ракеты,
   * катапульты и ножницы. То, к чему идёт провод, ждёт свой сигнал. Второй раз (`on = false`) — всё стоп.
   */
  start(on: boolean): StartResult {
    const wired = this.wiredTargets()
    const result: StartResult = { fired: [], punched: [], launched: [], kicked: [], cut: [] }
    for (const piece of this.pieceMap.values()) {
      const motor = getPieceSpec(piece.kind).motor
      if (!motor || (on && wired.has(piece.id))) continue
      if (motor === 'lift' && on) this.liftAuto.add(piece.id)
      else this.liftAuto.delete(piece.id)
      this.setPower(piece, on)
    }
    if (!on) return result
    for (const piece of [...this.pieceMap.values()]) {
      if (wired.has(piece.id) || !this.pieceMap.has(piece.id)) continue
      const spec = getPieceSpec(piece.kind)
      if (spec.muzzle) {
        const item = this.loadedItem(piece.id)
        if (item !== null && this.fire(piece.id, item)) result.fired.push(piece.id)
      } else if (spec.link?.type === 'punch') {
        if (this.punch(piece.id)) result.punched.push(piece.id)
      } else if (spec.thrust) {
        if (this.launch(piece.id)) result.launched.push(piece.id)
      } else if (spec.link?.type === 'kick') {
        if (this.kick(piece.id)) result.kicked.push(piece.id)
      } else if (piece.kind === 'scissors') {
        if (this.cut(piece.id)) result.cut.push(piece.id)
      }
    }
    return result
  }

  onAction(listener: (event: ActionEvent) => void): void {
    this.actionListeners.push(listener)
  }

  private action(type: ActionEvent['type'], piece: Piece, extra: Partial<ActionEvent> = {}): void {
    const p = piece.body.getPosition()
    this.pendingActions.push({ type, id: piece.id, kind: piece.kind, x: p.x, y: p.y, ...extra })
  }

  // ── Кнопка-включатель ──

  /** Нажата: на шляпку давит что-то тяжёлое или её только что нажали пальцем. */
  isPressed(id: number): boolean {
    const piece = this.pieceMap.get(id)
    const joint = piece?.linkJoint
    if (!piece || getPieceSpec(piece.kind).link?.type !== 'press' || !(joint instanceof PrismaticJoint)) return false
    if ((this.fingerPress.get(id) ?? 0) > this.time) return true
    // Кнопка сама падает, её несут или она только что приземлилась: шляпку прижимает по инерции.
    if (this.time - (this.buttonRest.get(id) ?? -Infinity) < BUTTON_SETTLE_S) return false
    return joint.getJointTranslation() <= joint.getLowerLimit() * 0.5
  }

  /** Тап по кнопке. false — это не кнопка. */
  pressButton(id: number): boolean {
    const piece = this.pieceMap.get(id)
    if (!piece || getPieceSpec(piece.kind).link?.type !== 'press') return false
    if (!this.isPressed(id)) this.lastPress.delete(id)
    this.fingerPress.set(id, this.time + BUTTON_FINGER_S)
    for (const body of this.bodiesOf(piece)) body.setAwake(true)
    return true
  }

  // ── Провода ──

  /** Первый механизм на проводах источника (null — проводов нет). */
  targetOf(sourceId: number): number | null {
    return this.wireMap.get(sourceId)?.[0] ?? null
  }

  wiresOf(sourceId: number): number[] {
    return [...(this.wireMap.get(sourceId) ?? [])]
  }

  isSource(id: number): boolean {
    const kind = this.pieceMap.get(id)?.kind
    return kind !== undefined && SIGNAL_SOURCES.has(kind)
  }

  isTarget(id: number): boolean {
    const kind = this.pieceMap.get(id)?.kind
    return kind !== undefined && SIGNAL_TARGETS.has(kind)
  }

  /** Можно протянуть провод: источник → механизм, без петли, не больше трёх. */
  canConnect(sourceId: number, targetId: number): boolean {
    if (sourceId === targetId || !this.isSource(sourceId) || !this.isTarget(targetId)) return false
    const list = this.wireMap.get(sourceId) ?? []
    if (list.includes(targetId) || list.length >= MAX_WIRES) return false
    return !this.reaches(targetId, sourceId)
  }

  /** Провод протянули пальцем. false — нельзя (см. `canConnect`). */
  connect(sourceId: number, targetId: number): boolean {
    if (!this.canConnect(sourceId, targetId)) return false
    this.link(sourceId, targetId)
    this.manualWires.add(sourceId)
    return true
  }

  /** Провод сняли пальцем (утащили в пустое место). */
  disconnect(sourceId: number, targetId: number): boolean {
    const list = this.wireMap.get(sourceId)
    if (!list?.includes(targetId)) return false
    this.wireMap.set(
      sourceId,
      list.filter((t) => t !== targetId),
    )
    this.manualWires.add(sourceId)
    return true
  }

  /** Перетянули конец провода на другой механизм. */
  rewire(sourceId: number, fromId: number, toId: number): boolean {
    const list = this.wireMap.get(sourceId)
    if (!list?.includes(fromId)) return false
    if (fromId === toId) return true
    const without = list.filter((t) => t !== fromId)
    this.wireMap.set(sourceId, without)
    if (!this.canConnect(sourceId, toId)) {
      this.wireMap.set(sourceId, list)
      return false
    }
    this.wireMap.set(sourceId, list.map((t) => (t === fromId ? toId : t)))
    this.manualWires.add(sourceId)
    return true
  }

  /** Готовые машины: провода ровно такие (пары «источник → механизм»), сами не подключаются. */
  setWires(pairs: readonly (readonly [number, number])[]): void {
    for (const id of this.pieceMap.keys()) {
      if (!this.isSource(id)) continue
      this.wireMap.set(id, [])
      this.manualWires.add(id)
    }
    for (const [s, t] of pairs) if (this.canConnect(s, t)) this.link(s, t)
  }

  wires(): WireView[] {
    const out: WireView[] = []
    for (const [sourceId, targets] of this.wireMap) {
      const source = this.pieceMap.get(sourceId)
      if (!source) continue
      const a = this.wireAnchor(source)
      for (const targetId of targets) {
        const target = this.pieceMap.get(targetId)
        if (!target) continue
        const b = target.body.getPosition()
        const live =
          (getPieceSpec(target.kind).motor !== undefined && this.power.has(targetId)) ||
          (this.wireFlash.get(`${sourceId}>${targetId}`) ?? 0) > this.time
        out.push({ sourceId, targetId, ax: a.x, ay: a.y, bx: b.x, by: b.y, live })
      }
    }
    return out
  }

  /** Откуда выходит провод: верх кнопки, колба лампочки, ось мельницы. */
  private wireAnchor(source: Piece): Vec2Value {
    if (source.kind === 'mill' && source.link) return source.link.getPosition()
    const local = source.kind === 'lamp' ? Vec2(0, -0.27 * source.size) : Vec2(0, 0.3 * source.size)
    return source.body.getWorldPoint(local)
  }

  private link(sourceId: number, targetId: number): void {
    const list = this.wireMap.get(sourceId) ?? []
    if (!list.includes(targetId)) this.wireMap.set(sourceId, [...list, targetId])
  }

  private wiredTargets(): Set<number> {
    const set = new Set<number>()
    for (const targets of this.wireMap.values()) for (const t of targets) set.add(t)
    return set
  }

  /** От `fromId` по проводам можно дойти до `toId` (тогда новый провод замкнул бы петлю). */
  private reaches(fromId: number, toId: number): boolean {
    const seen = new Set<number>([fromId])
    const queue = [fromId]
    while (queue.length) {
      const cur = queue.shift()!
      if (cur === toId) return true
      for (const next of this.wireMap.get(cur) ?? []) {
        if (seen.has(next)) continue
        seen.add(next)
        queue.push(next)
      }
    }
    return false
  }

  /** Источник без проводов (и его не трогали руками) подключается к ближайшему механизму. */
  private autoWire(): void {
    for (const source of this.pieceMap.values()) {
      if (!SIGNAL_SOURCES.has(source.kind) || this.manualWires.has(source.id)) continue
      if ((this.wireMap.get(source.id)?.length ?? 0) > 0) continue
      const sp = source.body.getPosition()
      let best: Piece | null = null
      let bestD = Infinity
      for (const target of this.pieceMap.values()) {
        if (!SIGNAL_TARGETS.has(target.kind) || !this.canConnect(source.id, target.id)) continue
        // Мельница не включает сама себе ветер.
        if (source.kind === 'mill' && target.kind === 'fan') continue
        const tp = target.body.getPosition()
        const d = Math.hypot(tp.x - sp.x, tp.y - sp.y)
        if (d < bestD) {
          best = target
          bestD = d
        }
      }
      if (best) this.link(source.id, best.id)
    }
  }

  /**
   * Каждый шаг: шляпки на пружинках; нажатие кнопки переключает её механизмы (тумблер);
   * лампочка загорелась/погасла, мельница раскрутилась/встала — механизмы на их проводах
   * включаются/выключаются следом.
   */
  private updateSignals(): void {
    for (const button of [...this.pieceMap.values()]) {
      if (button.kind !== 'button') continue
      const v = button.body.getLinearVelocity()
      if (Math.hypot(v.x, v.y) > BUTTON_MOVING_SPEED || !this.buttonRest.has(button.id)) {
        this.buttonRest.set(button.id, this.time)
      }
      const pressed = this.isPressed(button.id)
      const was = this.wasPressed.has(button.id)
      if (pressed) this.wasPressed.add(button.id)
      else this.wasPressed.delete(button.id)
      if (!pressed || was) continue
      if (this.time - (this.lastPress.get(button.id) ?? -Infinity) < PRESS_DEBOUNCE_S) continue
      this.lastPress.set(button.id, this.time)
      this.action('press', button)
      if (this.frozen) continue
      for (const targetId of this.wiresOf(button.id)) {
        const target = this.pieceMap.get(targetId)
        if (target) this.signal(button, target, 'toggle')
      }
    }
    const due = this.hopQueue.filter((hop) => hop.at <= this.time)
    this.hopQueue = this.hopQueue.filter((hop) => hop.at > this.time)
    for (const hop of due) {
      const source = this.pieceMap.get(hop.sourceId)
      const target = this.pieceMap.get(hop.targetId)
      if (source && target && !this.frozen) this.signal(source, target, hop.on ? 'on' : 'off')
    }
    for (let round = 0; round < 4; round += 1) {
      let changed = false
      for (const source of [...this.pieceMap.values()]) {
        if (source.kind !== 'lamp' && source.kind !== 'mill') continue
        const on = this.sourceState(source)
        if (on === (this.sourceOn.get(source.id) ?? false)) continue
        this.sourceOn.set(source.id, on)
        if (this.frozen) continue
        for (const targetId of this.wiresOf(source.id)) {
          const target = this.pieceMap.get(targetId)
          if (!target) continue
          if (source.kind === 'lamp') {
            this.hopQueue.push({ at: this.time + LAMP_HOP_S, sourceId: source.id, targetId, on })
            continue
          }
          this.signal(source, target, on ? 'on' : 'off')
          changed = true
        }
      }
      if (!changed) break
    }
  }

  private sourceState(source: Piece): boolean {
    if (source.kind === 'lamp') return this.power.has(source.id)
    const spin = Math.abs(source.link?.getAngularVelocity() ?? 0)
    const was = this.sourceOn.get(source.id) ?? false
    if (spin >= MILL_ON || (was && spin > MILL_OFF)) {
      this.millSlowSince.delete(source.id)
      return true
    }
    if (!was) return false
    const since = this.millSlowSince.get(source.id) ?? this.time
    this.millSlowSince.set(source.id, since)
    if (this.time - since < MILL_OFF_S) return true
    this.millSlowSince.delete(source.id)
    return false
  }

  /** Лампочки и мельницы без фронта после восстановления снимка: ничего не срабатывает само. */
  private syncSources(): void {
    this.hopQueue = []
    for (const piece of this.pieceMap.values()) {
      if (piece.kind === 'lamp') this.sourceOn.set(piece.id, this.power.has(piece.id))
    }
  }

  /**
   * Сигнал по проводу. Мотор, ворота, люк, лампочка: `toggle` — переключить, `on`/`off` — как источник.
   * Пушка, толкатель, ракета, ножницы, катапульта срабатывают на `toggle` и `on`.
   */
  private signal(source: Piece, target: Piece, mode: 'toggle' | 'on' | 'off'): void {
    const spec = getPieceSpec(target.kind)
    this.action('signal', source, { target: target.id, on: mode !== 'off' })
    this.wireFlash.set(`${source.id}>${target.id}`, this.time + WIRE_FLASH_S)
    if (spec.motor) {
      const on = mode === 'toggle' ? !this.power.has(target.id) : mode === 'on'
      this.liftAuto.delete(target.id)
      if (on === this.power.has(target.id)) return
      this.setPower(target, on)
      this.action('power', target, { on })
      return
    }
    if (mode !== 'off') this.trigger(target)
  }

  /** Механизм сработал по сигналу: пушка стреляет, толкатель толкает, ракета взлетает, ножницы режут, катапульта подбрасывает. */
  private trigger(target: Piece): void {
    const spec = getPieceSpec(target.kind)
    if (spec.muzzle) {
      const item = this.loadedItem(target.id)
      if (item !== null && this.fire(target.id, item)) {
        const at = this.muzzleOf(target.id)
        this.action('fire', target, at ?? {})
      }
    } else if (spec.link?.type === 'punch') {
      if (this.punch(target.id)) this.action('punch', target)
    } else if (spec.thrust) {
      if (this.launch(target.id)) this.action('launch', target)
    } else if (spec.link?.type === 'kick') {
      if (this.kick(target.id)) this.action('kick', target)
    } else if (target.kind === 'scissors') {
      this.cut(target.id)
    }
  }

  // ── Толкатель и ракета ──

  /** «Толкнуть»: перчатка выезжает, стоит и возвращается. false — это не толкатель. */
  punch(id: number): boolean {
    const piece = this.pieceMap.get(id)
    if (!piece || getPieceSpec(piece.kind).link?.type !== 'punch') return false
    const state = this.punchState.get(id)
    if (state && (state.phase === 'out' || state.phase === 'hold')) return false
    this.punchState.set(id, { phase: 'out', until: this.time + PUNCH_OUT_S })
    for (const body of this.bodiesOf(piece)) body.setAwake(true)
    return true
  }

  private drivePunch(piece: Piece): void {
    const joint = piece.linkJoint
    if (!(joint instanceof PrismaticJoint)) return
    const s2 = piece.size * piece.size
    const state = this.punchState.get(piece.id) ?? { phase: 'idle' as PunchPhase, until: 0 }
    const t = joint.getJointTranslation()
    if (state.phase === 'out' && (t >= joint.getUpperLimit() - 0.03 || this.time >= state.until)) {
      state.phase = 'hold'
      state.until = this.time + PUNCH_HOLD_S
    } else if (state.phase === 'hold' && this.time >= state.until) {
      state.phase = 'back'
    } else if (state.phase === 'back' && t <= 0.02) {
      state.phase = 'idle'
    }
    this.punchState.set(piece.id, state)
    const speed = { out: PUNCH_SPEED * piece.size, hold: 0, back: -PUNCH_BACK * piece.size, idle: -1 }[state.phase]
    const force = state.phase === 'idle' ? PUNCH_IDLE_FORCE : PUNCH_FORCE
    joint.setMaxMotorForce(force * s2)
    joint.setMotorSpeed(speed)
    if (state.phase !== 'idle') piece.link?.setAwake(true)
  }

  /** «Полетели!»: ракета горит и летит туда, куда смотрит нос. false — не ракета или уже летит. */
  launch(id: number): boolean {
    const piece = this.pieceMap.get(id)
    const thrust = piece && getPieceSpec(piece.kind).thrust
    if (!piece || !thrust || (this.burnUntil.get(id) ?? 0) > this.time) return false
    this.unpark(id)
    this.firm(piece)
    this.burnUntil.set(id, this.time + thrust.seconds)
    piece.body.setAwake(true)
    return true
  }

  isBurning(id: number): boolean {
    return (this.burnUntil.get(id) ?? 0) > this.time
  }

  /** Ракета отпустила груз и улетает сквозь потолок. */
  isGone(id: number): boolean {
    return this.ghosts.has(id)
  }

  /** Пружина-катапульта: площадка подскакивает, всё, что на ней, летит вверх. false — не катапульта или уже скачет. */
  kick(id: number): boolean {
    const piece = this.pieceMap.get(id)
    const plate = piece?.link
    if (!piece || !plate || getPieceSpec(piece.kind).link?.type !== 'kick') return false
    if ((this.kickUntil.get(id) ?? 0) > this.time) return false
    this.kickUntil.set(id, this.time + KICK_S)
    const a = piece.body.getAngle()
    const up = { x: Math.sin(a), y: -Math.cos(a) }
    const speed = LAUNCH_SPEED * Math.sqrt(piece.size)
    const pp = plate.getPosition()
    const riders = new Set<Piece>()
    for (let edge = plate.getContactList(); edge; edge = edge.next ?? null) {
      if (!edge.contact.isTouching() || !edge.other || edge.other.isStatic()) continue
      const other = this.pieceMap.get(edge.other.getUserData() as number)
      if (!other || other === piece) continue
      const op = edge.other.getPosition()
      if ((op.x - pp.x) * up.x + (op.y - pp.y) * up.y <= 0) continue
      riders.add(other)
    }
    for (const rider of riders) {
      this.unpark(rider.id)
      this.firm(rider)
      for (const body of this.bodiesOf(rider)) {
        const v = body.getLinearVelocity()
        const along = v.x * up.x + v.y * up.y
        body.setLinearVelocity(Vec2(v.x - along * up.x + up.x * speed, v.y - along * up.y + up.y * speed))
        body.setAwake(true)
      }
    }
    for (const body of this.bodiesOf(piece)) body.setAwake(true)
    return true
  }

  private driveKick(piece: Piece): void {
    const joint = piece.linkJoint
    if (!(joint instanceof PrismaticJoint)) return
    const s2 = piece.size * piece.size
    const kicking = (this.kickUntil.get(piece.id) ?? 0) > this.time && !this.frozen
    joint.setMaxMotorForce(KICK_FORCE * s2)
    joint.setMotorSpeed(kicking ? KICK_SPEED * piece.size : -KICK_RETURN * piece.size)
    if (kicking) piece.link?.setAwake(true)
  }

  /** Ножницы режут ближнюю ниточку шарика, верёвку шара-тарана или ведёрок. false — резать нечего. */
  cut(id: number): boolean {
    const scissors = this.pieceMap.get(id)
    if (!scissors || scissors.kind !== 'scissors') return false
    const p = scissors.body.getPosition()
    let best: { d: number; x: number; y: number; tie?: Tie; rope?: Rope; pulley?: Piece } | null = null
    const reach = CUT_REACH * scissors.size
    for (const tie of this.tieList) {
      const view = this.ties().find((t) => t.balloonId === tie.balloon)
      if (!view) continue
      const hit = segmentDistance(p, { x: view.ax, y: view.ay }, { x: view.bx, y: view.by })
      if (hit.d <= reach && (!best || hit.d < best.d)) best = { ...hit, tie }
    }
    for (const rope of this.ropeMap.values()) {
      const view = this.ropes().find((r) => r.id === rope.id)
      if (!view || !rope.joint) continue
      const hit = segmentDistance(p, { x: view.ax, y: view.ay }, { x: view.bx, y: view.by })
      if (hit.d <= reach && (!best || hit.d < best.d)) best = { ...hit, rope }
    }
    for (const pulley of this.pieceMap.values()) {
      for (const cord of this.cordsOf(pulley)) {
        const hit = segmentDistance(p, { x: cord.ax, y: cord.ay }, { x: cord.bx, y: cord.by })
        if (hit.d <= reach && (!best || hit.d < best.d)) best = { ...hit, pulley }
      }
    }
    if (!best) return false
    if (best.pulley) {
      this.dropBuckets(best.pulley)
    } else if (best.tie) {
      const tie = best.tie
      this.world.destroyJoint(tie.joint)
      this.tieList = this.tieList.filter((t) => t !== tie)
      this.freeBalloons.add(tie.balloon)
      for (const body of [this.pieceMap.get(tie.balloon)?.body, this.pieceMap.get(tie.piece)?.body]) body?.setAwake(true)
    } else if (best.rope) {
      this.dropRope(best.rope.id)
    }
    this.action('cut', scissors, { x: best.x, y: best.y })
    return true
  }

  /** Верёвка шара-тарана срезана навсегда: флаг уходит в снимок, «Отменить» и вход её не вернут. */
  private dropRope(id: number): void {
    const rope = this.ropeMap.get(id)
    if (rope?.joint) this.world.destroyJoint(rope.joint)
    this.ropeMap.delete(id)
    const piece = this.pieceMap.get(id)
    if (!piece) return
    piece.ropeCut = true
    piece.body.setAwake(true)
  }

  private applyThrust(): void {
    for (const [id, until] of this.burnUntil) {
      const rocket = this.pieceMap.get(id)
      if (!rocket || until <= this.time) {
        this.burnUntil.delete(id)
        continue
      }
      if (this.frozen || this.isGrabbed(rocket.body)) continue
      const thrust = getPieceSpec(rocket.kind).thrust!
      const a = rocket.body.getAngle()
      const f = thrust.force * rocket.body.getMass() * G_EARTH
      rocket.body.applyForceToCenter(Vec2(Math.sin(a) * f, -Math.cos(a) * f), true)
      rocket.body.setAngularVelocity(rocket.body.getAngularVelocity() * ROCKET_SPIN_DAMP)
    }
  }

  private driveButtonCap(piece: Piece): void {
    const joint = piece.linkJoint
    if (!(joint instanceof PrismaticJoint)) return
    const s2 = piece.size * piece.size
    if ((this.fingerPress.get(piece.id) ?? 0) > this.time) {
      joint.setMaxMotorForce(BUTTON_FINGER_FORCE * s2)
      joint.setMotorSpeed(-3)
      piece.link?.setAwake(true)
      return
    }
    joint.setMaxMotorForce(BUTTON_SPRING * s2)
    joint.setMotorSpeed(BUTTON_RETURN)
  }

  /** Ворота: включены — полотно уезжает вверх в короб (проезд открыт); выключены — опускается стеной. */
  private driveShutter(piece: Piece): void {
    const joint = piece.linkJoint
    if (!(joint instanceof PrismaticJoint) || !piece.link) return
    const open = this.power.has(piece.id)
    joint.setMotorSpeed(this.frozen ? 0 : (open ? 1 : -1) * SHUTTER_SPEED * piece.size)
    const upper = joint.getUpperLimit()
    const sensor = upper > 0 && joint.getJointTranslation() / upper > SHUTTER_OPEN_FRAC
    for (let f = piece.link.getFixtureList(); f; f = f.getNext()) if (f.isSensor() !== sensor) f.setSensor(sensor)
    piece.link.setAwake(true)
  }

  /** Насколько открыты ворота: 0 — закрыты, 1 — полотно в коробе. */
  openness(id: number): number {
    const piece = this.pieceMap.get(id)
    const joint = piece?.linkJoint
    if (!(joint instanceof PrismaticJoint)) return 0
    const upper = joint.getUpperLimit()
    return upper > 0 ? Math.max(0, Math.min(1, joint.getJointTranslation() / upper)) : 0
  }

  /** Люк полки: включён — откидывается вниз и всё с него падает; выключен — поднимается и держит. */
  private driveHatch(piece: Piece): void {
    const joint = piece.linkJoint
    if (!(joint instanceof RevoluteJoint)) return
    if (this.frozen) {
      joint.setMotorSpeed(0)
      return
    }
    const open = this.power.has(piece.id)
    const dir = piece.flip ? -1 : 1
    // Закрытая крышка заперта ровно: если мотор давит в упор, она перекашивается и мячик сам скатывается.
    const shut = !open && Math.abs(joint.getJointAngle()) < 0.03
    const swing = getPieceSpec(piece.kind).link?.limit ?? Math.PI / 2
    if (shut) joint.setLimits(0, 0)
    else joint.setLimits(piece.flip ? -swing : 0, piece.flip ? 0 : swing)
    joint.setMotorSpeed(shut ? 0 : (open ? 1 : -1) * dir * HATCH_SPEED)
    piece.link?.setAwake(true)
  }

  /** Склеить можно соседей (касаются или почти), не две прибитые и не улетающую ракету. */
  canGlue(a: number, b: number): boolean {
    const pa = this.pieceMap.get(a)
    const pb = this.pieceMap.get(b)
    if (!pa || !pb || a === b || this.ghosts.has(a) || this.ghosts.has(b)) return false
    if (this.isFixedPiece(pa) && this.isFixedPiece(pb)) return false
    const ba = this.bounds(pa)
    const bb = this.bounds(pb)
    const gapX = Math.max(0, Math.max(ba.x0, bb.x0) - Math.min(ba.x1, bb.x1))
    const gapY = Math.max(0, Math.max(ba.y0, bb.y0) - Math.min(ba.y1, bb.y1))
    return Math.hypot(gapX, gapY) <= GLUE_REACH
  }

  /** «Склеить»: две детали намертво (не отрываются ни от удара, ни от «Бум!»). */
  glue(a: number, b: number): boolean {
    const pa = this.pieceMap.get(a)
    const pb = this.pieceMap.get(b)
    if (!pa || !pb || a === b) return false
    const existing = this.sticks.find((s) => (s.a === a && s.b === b) || (s.a === b && s.b === a))
    if (existing) {
      existing.firm = true
      return true
    }
    const before = this.sticks.length
    const p = pa.body.getPosition()
    const q = pb.body.getPosition()
    this.stick(a, b, { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, true)
    return this.sticks.length > before
  }

  /** «Расклеить»: деталь отклеивается от всех. false — она ни к чему не приклеена. */
  unglue(id: number): boolean {
    const before = this.sticks.length
    this.sticks = this.sticks.filter((s) => {
      if (s.a !== id && s.b !== id) return true
      this.world.destroyJoint(s.joint)
      return false
    })
    const piece = this.pieceMap.get(id)
    if (piece) for (const body of this.bodiesOf(piece)) body.setAwake(true)
    return this.sticks.length < before
  }

  /** С кем склеена (кнопкой или липучкой). */
  gluedTo(id: number): number[] {
    return this.sticks.filter((s) => s.a === id || s.b === id).map((s) => (s.a === id ? s.b : s.a))
  }

  /** Кнопка «Пуск!»: все моторы разом. */
  setAllPower(on: boolean): void {
    for (const piece of this.pieceMap.values()) {
      if (getPieceSpec(piece.kind).motor) this.setPower(piece, on)
    }
  }

  anyOn(): boolean {
    return this.power.size > 0
  }

  private setPower(piece: Piece, on: boolean): void {
    if (on) this.power.add(piece.id)
    else this.power.delete(piece.id)
    for (const body of this.bodiesOf(piece)) body.setAwake(true)
  }

  /** Каждый шаг: колёса тележки, лента, подъёмник, ворота, люк, шляпка кнопки, перчатка, катапульта. */
  private applyMotors(): void {
    for (const piece of this.pieceMap.values()) {
      const spec = getPieceSpec(piece.kind)
      const linkType = spec.link?.type
      if (linkType === 'press') this.driveButtonCap(piece)
      else if (linkType === 'punch') this.drivePunch(piece)
      else if (linkType === 'kick') this.driveKick(piece)
      if (!spec.motor) continue
      const on = this.power.has(piece.id) && !this.frozen
      if (spec.motor === 'wheels') this.driveWheels(piece, on)
      else if (spec.motor === 'belt' && on) this.driveBelt(piece, spec.belt?.speed ?? 2)
      else if (spec.motor === 'lift') this.driveLift(piece)
      else if (spec.motor === 'gate') this.driveShutter(piece)
      else if (spec.motor === 'hatch') this.driveHatch(piece)
    }
  }

  private driveWheels(piece: Piece, on: boolean): void {
    const dir = piece.flip ? -1 : 1
    const s2 = piece.size * piece.size
    let grounded = false
    for (const joint of piece.wheelJoints) {
      joint.enableMotor(true)
      joint.setMaxMotorTorque((on ? CART_TORQUE : CART_BRAKE) * s2)
      joint.setMotorSpeed(on ? dir * CART_WHEEL_SPEED : 0)
      if (on) joint.getBodyB().setAwake(true)
      for (let edge = joint.getBodyB().getContactList(); edge; edge = edge.next ?? null) {
        if (edge.contact.isTouching() && edge.other?.getUserData() !== piece.id) grounded = true
      }
    }
    if (!on || !grounded) return
    const a = piece.body.getAngle()
    const along = { x: Math.cos(a) * dir, y: Math.sin(a) * dir }
    const v = piece.body.getLinearVelocity()
    const target = CART_WHEEL_SPEED * (getPieceSpec(piece.kind).wheels?.[0]?.r ?? 0.3) * piece.size
    if (v.x * along.x + v.y * along.y >= target) return
    const f = CART_PUSH * s2
    piece.body.applyForceToCenter(Vec2(along.x * f, along.y * f), true)
  }

  /** Что лежит на ленте сверху, едет со скоростью полотна. */
  private driveBelt(belt: Piece, speed: number): void {
    const a = belt.body.getAngle()
    const dir = belt.flip ? -1 : 1
    const along = { x: Math.cos(a) * dir, y: Math.sin(a) * dir }
    const up = { x: Math.sin(a), y: -Math.cos(a) }
    const bp = belt.body.getPosition()
    const touched = new Set<Body>()
    for (let edge = belt.body.getContactList(); edge; edge = edge.next ?? null) {
      if (!edge.contact.isTouching()) continue
      const other = edge.other
      if (!other || other.isStatic() || touched.has(other)) continue
      const op = other.getPosition()
      if ((op.x - bp.x) * up.x + (op.y - bp.y) * up.y <= 0) continue
      touched.add(other)
      const v = other.getLinearVelocity()
      const dv = speed * belt.size - (v.x * along.x + v.y * along.y)
      const k = other.getMass() * dv * BELT_GRIP
      other.applyLinearImpulse(Vec2(along.x * k, along.y * k), other.getWorldCenter(), true)
    }
    this.fanSpin.set(belt.id, (this.fanSpin.get(belt.id) ?? 0) + speed * STEP)
  }

  /**
   * Подъёмник: включён — площадка едет вверх и держится там, выключен — опускается вниз.
   * На «Пуск!» ездит сам вверх-вниз и чуть стоит на краях.
   */
  private driveLift(lift: Piece): void {
    const joint = lift.linkJoint
    if (!(joint instanceof PrismaticJoint)) return
    if (this.frozen) {
      joint.setMotorSpeed(0)
      return
    }
    const on = this.power.has(lift.id)
    if (!on || !this.liftAuto.has(lift.id)) {
      joint.setMotorSpeed((on ? 1 : -1) * LIFT_SPEED * lift.size)
      lift.link?.setAwake(true)
      return
    }
    const state = this.liftState.get(lift.id) ?? { dir: 1, until: 0 }
    this.liftState.set(lift.id, state)
    const t = joint.getJointTranslation()
    const top = joint.getUpperLimit()
    if (state.until > this.time) {
      joint.setMotorSpeed(0)
      return
    }
    if (state.dir > 0 && t >= top - 0.03) {
      state.dir = -1
      state.until = this.time + LIFT_PAUSE_S
    } else if (state.dir < 0 && t <= 0.03) {
      state.dir = 1
      state.until = this.time + LIFT_PAUSE_S
    }
    joint.setMotorSpeed(state.until > this.time ? 0 : state.dir * LIFT_SPEED * lift.size)
    lift.link?.setAwake(true)
  }

  // ── Мельница и пушка ──

  /** Как быстро крутится колесо мельницы. */
  spinOf(id: number): number {
    return this.pieceMap.get(id)?.link?.getAngularVelocity() ?? 0
  }

  muzzleOf(id: number): Vec2Value | null {
    return this.muzzlePoint(id, 'at')
  }

  /** Середина отверстия дула в мире: там сидит заряд. */
  holeOf(id: number): Vec2Value | null {
    return this.muzzlePoint(id, 'hole')
  }

  private muzzlePoint(id: number, which: 'at' | 'hole'): Vec2Value | null {
    const piece = this.pieceMap.get(id)
    const muzzle = piece && getPieceSpec(piece.kind).muzzle
    if (!piece || !muzzle) return null
    const local = muzzle[which]
    const p = piece.body.getWorldPoint(Vec2(local.x * (piece.flip ? -piece.size : piece.size), local.y * piece.size))
    return { x: p.x, y: p.y }
  }

  /** Нос ракеты в мире: на него кладут груз. */
  noseOf(id: number): Vec2Value | null {
    const piece = this.pieceMap.get(id)
    if (!piece || !getPieceSpec(piece.kind).thrust) return null
    const p = piece.body.getWorldPoint(Vec2(0, -0.8 * piece.size))
    return { x: p.x, y: p.y }
  }

  /** Половина наибольшего размера предмета. */
  private halfOf(piece: Piece): number {
    const spec = getPieceSpec(piece.kind)
    return (Math.max(spec.w, spec.h) * piece.size) / 2
  }

  /** Влезает в дуло пушки / отсек ракеты: мелкий свободный предмет без мотора и подвижных частей. */
  private canHold(item: Piece, holder: Piece, inHand = false): boolean {
    if (item === holder || this.isFixedPiece(item) || item.parked || item.loose || this.ghosts.has(item.id)) return false
    const spec = getPieceSpec(item.kind)
    if (spec.motor || spec.link || spec.wheels || spec.rope || spec.pulley || spec.thrust || spec.muzzle) return false
    if (this.isHeld(item) !== inHand || this.isStuck(item.id) || (this.reloadAt.get(item.id) ?? 0) > this.time) return false
    if (this.tieList.some((t) => t.piece === item.id || t.balloon === item.id)) return false
    if ([...this.holds.values()].includes(item.id)) return false
    return this.halfOf(item) * 2 <= HOLD_MAX * holder.size
  }

  /** Предмет в дуле пушки или в отсеке ракеты (null — пусто). */
  loadedItem(id: number): number | null {
    const held = this.holds.get(id)
    if (held !== undefined && this.pieceMap.has(held)) return held
    const holder = this.pieceMap.get(id)
    if (!holder) return null
    const spec = getPieceSpec(holder.kind)
    const at = spec.muzzle ? this.muzzleOf(id) : spec.thrust && !this.ghosts.has(id) ? this.noseOf(id) : null
    if (!at) return null
    let best: number | null = null
    let bestD = Infinity
    const center = holder.body.getPosition()
    for (const piece of this.pieceMap.values()) {
      if (!this.canHold(piece, holder)) continue
      const p = piece.body.getPosition()
      const d = Math.hypot(p.x - at.x, p.y - at.y)
      const reach = spec.muzzle ? LOADED_REACH * holder.size : 0.55 * holder.size + this.halfOf(piece)
      // Груз внутри ракеты (после «Отменить» или входа в игру) лежит в её середине.
      const inside = spec.thrust && Math.hypot(p.x - center.x, p.y - center.y) <= 0.35 * holder.size
      if ((d <= reach || inside) && d < bestD) {
        best = piece.id
        bestD = d
      }
    }
    return best
  }

  /** Куда втягивается предмет в пальце: ближайшая свободная пушка (у дула) или ракета (у корпуса). */
  private suckTarget(item: Piece): Piece | null {
    const ip = item.body.getPosition()
    let best: Piece | null = null
    let bestD = Infinity
    for (const holder of this.pieceMap.values()) {
      const spec = getPieceSpec(holder.kind)
      if (!spec.muzzle && !spec.thrust) continue
      if (this.ghosts.has(holder.id) || this.isBurning(holder.id) || this.isHeld(holder)) continue
      const held = this.holds.get(holder.id)
      if (held !== undefined && this.pieceMap.has(held)) continue
      if (!this.canHold(item, holder, true)) continue
      const at = spec.muzzle ? this.muzzleOf(holder.id)! : holder.body.getPosition()
      const reach = (spec.muzzle ? LOADED_REACH : 0.8) * holder.size + this.halfOf(item)
      const d = Math.hypot(ip.x - at.x, ip.y - at.y)
      if (d <= reach && d < bestD) {
        best = holder
        bestD = d
      }
    }
    return best
  }

  /** Предмет держат пальцем у пушки или ракеты: через `SUCK_S` его втягивает, палец его отпускает. */
  private suckItems(): void {
    const seen = new Set<number>()
    const taken = new Set<Grab>()
    for (const g of this.grabs) {
      const itemId = g.body.getUserData() as number
      const item = this.pieceMap.get(itemId)
      if (!item) continue
      const holder = this.suckTarget(item)
      if (this.pulledOut.has(itemId)) {
        if (!holder) this.pulledOut.delete(itemId)
        continue
      }
      if (!holder) continue
      seen.add(itemId)
      const cur = this.sucking.get(itemId)
      if (!cur || cur.holder !== holder.id) {
        this.sucking.set(itemId, { holder: holder.id, since: this.time })
        continue
      }
      if (this.time - cur.since < SUCK_S) continue
      seen.delete(itemId)
      this.world.destroyJoint(g.joint)
      taken.add(g)
      this.holds.set(holder.id, itemId)
      this.ungroupAt.delete(itemId)
      this.setGroup(item, -holder.id)
      if (getPieceSpec(holder.kind).thrust && !PASSENGERS.has(item.kind)) this.putInside(item)
      this.action('load', item, { target: holder.id })
    }
    if (taken.size) this.grabs = this.grabs.filter((g) => !taken.has(g))
    for (const id of [...this.sucking.keys()]) if (!seen.has(id)) this.sucking.delete(id)
  }

  /** Какие предметы сейчас втягиваются (для свечения и «засасывания» на экране). */
  suckState(): SuckView[] {
    const list: SuckView[] = []
    for (const [item, s] of this.sucking) {
      const holder = this.pieceMap.get(s.holder)
      if (!holder || !this.pieceMap.has(item)) continue
      const at = getPieceSpec(holder.kind).muzzle ? this.muzzleOf(holder.id)! : holder.body.getPosition()
      list.push({ item, holder: s.holder, t: Math.min(1, (this.time - s.since) / SUCK_S), x: at.x, y: at.y })
    }
    return list
  }

  /** Груз в ракете: внутри корпуса, сквозной, виден только в иллюминаторе. */
  private putInside(item: Piece): void {
    if (this.insideSet.has(item.id)) return
    this.insideSet.add(item.id)
    this.setSensor(item, true)
  }

  private setSensor(item: Piece, on: boolean): void {
    for (const body of this.bodiesOf(item)) for (let f = body.getFixtureList(); f; f = f.getNext()) f.setSensor(on)
  }

  /** Предмет внутри ракеты (не пассажир снаружи). */
  private holderOf(itemId: number): Piece | null {
    for (const [h, i] of this.holds) if (i === itemId) return this.pieceMap.get(h) ?? null
    return null
  }

  /** Во сколько раз сжать предмет, чтобы он влез в жерло пушки (1 — и так влезает). */
  private muzzleFit(cannon: Piece, item: Piece): number {
    const spec = getPieceSpec(item.kind)
    const across = PASSENGERS.has(item.kind) ? spec.w * item.size : 2 * this.halfOf(item)
    return Math.min(1, (MUZZLE_BORE * cannon.size) / across)
  }

  /** Сжатие на экране плавно идёт к цели: в дуле — под жерло, иначе — обратно к своему размеру. */
  private updateShrinks(dt: number): void {
    const k = 1 - Math.exp(-SHRINK_RATE * dt)
    for (const piece of this.pieceMap.values()) {
      const holder = this.muzzleSet.has(piece.id) ? this.holderOf(piece.id) : null
      const target = holder ? this.muzzleFit(holder, piece) : 1
      const cur = this.shrinks.get(piece.id) ?? 1
      if (target === 1 && cur === 1) continue
      const next = cur + (target - cur) * k
      if (target === 1 && next > 0.99) this.shrinks.delete(piece.id)
      else this.shrinks.set(piece.id, next)
    }
  }

  /** Куда смотрит дуло в мире (единичный вектор). */
  private muzzleDir(cannon: Piece): Vec2Value {
    const local = getPieceSpec(cannon.kind).muzzle?.angle ?? 0
    const a = cannon.body.getAngle()
    const lx = Math.cos(local) * (cannon.flip ? -1 : 1)
    const ly = Math.sin(local)
    return { x: lx * Math.cos(a) - ly * Math.sin(a), y: lx * Math.sin(a) + ly * Math.cos(a) }
  }

  /** Предмет не сталкивается со своей пушкой/ракетой, пока лежит в ней и чуть после выстрела. */
  private setGroup(item: Piece, group: number): void {
    for (let f = item.body.getFixtureList(); f; f = f.getNext()) f.setFilterGroupIndex(group)
  }

  /** Каждый шаг: предмет у дула пушки или на носу ракеты «заряжается» и держится там; рукой — забрали. */
  private holdItems(): void {
    for (const [itemId, until] of this.ungroupAt) {
      if (until > this.time) continue
      const item = this.pieceMap.get(itemId)
      if (item) this.setGroup(item, 0)
      this.ungroupAt.delete(itemId)
    }
    for (const id of [...this.insideSet]) {
      const holder = this.holderOf(id)
      if (holder && getPieceSpec(holder.kind).thrust) continue
      const item = this.pieceMap.get(id)
      if (item) this.setSensor(item, false)
      this.insideSet.delete(id)
    }
    for (const id of [...this.muzzleSet]) {
      const holder = this.holderOf(id)
      if (holder && getPieceSpec(holder.kind).muzzle) continue
      const item = this.pieceMap.get(id)
      if (item) this.setSensor(item, false)
      this.muzzleSet.delete(id)
    }
    for (const holder of this.pieceMap.values()) {
      const spec = getPieceSpec(holder.kind)
      if (!spec.muzzle && !spec.thrust) continue
      let itemId = this.holds.get(holder.id)
      let item = itemId === undefined ? undefined : this.pieceMap.get(itemId)
      if (item && this.isHeld(item)) {
        this.holds.delete(holder.id)
        this.ungroupAt.set(item.id, this.time + 0.2)
        this.pulledOut.add(item.id)
        continue
      }
      if (!item) {
        this.holds.delete(holder.id)
        if (this.ghosts.has(holder.id) || (spec.thrust && this.isBurning(holder.id))) continue
        itemId = this.loadedItem(holder.id) ?? undefined
        item = itemId === undefined ? undefined : this.pieceMap.get(itemId)
        if (!item) continue
        this.holds.set(holder.id, item.id)
        this.ungroupAt.delete(item.id)
        this.setGroup(item, -holder.id)
        if (spec.thrust && !PASSENGERS.has(item.kind)) this.putInside(item)
      }
      if (spec.muzzle) {
        const at = this.holeOf(holder.id)!
        const dir = this.muzzleDir(holder)
        const fit = this.muzzleFit(holder, item)
        if (!this.muzzleSet.has(item.id)) {
          this.muzzleSet.add(item.id)
          this.setSensor(item, true)
        }
        const ahead = PASSENGERS.has(item.kind)
          ? (HEAD_OUT - 0.5) * getPieceSpec(item.kind).h * item.size * fit
          : MUZZLE_AHEAD * 2 * this.halfOf(item) * fit
        item.body.setTransform(Vec2(at.x + dir.x * ahead, at.y + dir.y * ahead), Math.atan2(dir.x, -dir.y))
      } else if (this.insideSet.has(item.id)) {
        item.body.setTransform(holder.body.getPosition(), holder.body.getAngle())
      } else {
        const feet = JETPACK_FEET * holder.size - (getPieceSpec(item.kind).h / 2) * item.size
        item.body.setTransform(holder.body.getWorldPoint(Vec2(0, feet)), holder.body.getAngle())
      }
      item.body.setLinearVelocity(holder.body.getLinearVelocity())
      item.body.setAngularVelocity(0)
    }
  }

  /** Ракета с грузом у потолка или стены (или огонь гаснет): груз летит дальше, ракета улетает сквозь потолок. */
  private releaseCargo(): void {
    for (const [rocketId, itemId] of this.holds) {
      const rocket = this.pieceMap.get(rocketId)
      const item = this.pieceMap.get(itemId)
      if (!rocket || !item || !getPieceSpec(rocket.kind).thrust || !this.isBurning(rocketId)) continue
      const nose = this.noseOf(rocketId)!
      const left = this.opts.leftX ?? 0
      const right = this.rightWall()
      const gap = CARGO_RELEASE_GAP * rocket.size
      const near =
        nose.y - this.opts.ceilingY < gap || nose.x - left < gap * 0.6 || right - nose.x < gap * 0.6 || this.opts.floorY - nose.y < 0.3
      const ending = (this.burnUntil.get(rocketId) ?? 0) - this.time < 0.25
      if (!near && !ending) continue
      const a = rocket.body.getAngle()
      const dir = { x: Math.sin(a), y: -Math.cos(a) }
      const v = rocket.body.getLinearVelocity()
      this.holds.delete(rocketId)
      this.ungroupAt.set(itemId, this.time + 0.4)
      this.reloadAt.set(itemId, this.time + 1.5)
      if (this.insideSet.delete(itemId)) {
        this.setSensor(item, false)
        const out = 0.8 * this.halfOf(item)
        item.body.setTransform(Vec2(nose.x + dir.x * out, nose.y + dir.y * out), a)
      }
      item.body.setLinearVelocity(Vec2(v.x + dir.x * CARGO_PUSH, v.y + dir.y * CARGO_PUSH))
      item.body.setAwake(true)
      this.ghosts.add(rocketId)
      for (let f = rocket.body.getFixtureList(); f; f = f.getNext()) f.setSensor(true)
      this.burnUntil.set(rocketId, this.time + GHOST_BURN_S)
      this.action('launch', item, { on: true })
    }
  }

  /** Мяу и Олли падают с высоты — раскрывают парашют и опускаются медленнее; на земле или в руке он складывается. */
  private updateChutes(): void {
    const g = this.gravity()
    for (const piece of this.pieceMap.values()) {
      if (!PASSENGERS.has(piece.kind)) continue
      const body = piece.body
      const v = body.getLinearVelocity()
      const free =
        g > 0 &&
        !body.isStatic() &&
        !this.isHeld(piece) &&
        !this.isCargo(piece.id) &&
        !this.isStuck(piece.id) &&
        !this.tieList.some((t) => t.piece === piece.id)
      const open = this.chutes.has(piece.id)
      if (!free || this.touching(body) || (open && v.y < CHUTE_CLOSE_VY)) {
        this.chutes.delete(piece.id)
        continue
      }
      if (!open) {
        if (v.y < CHUTE_OPEN_VY || this.opts.floorY - this.bounds(piece).y1 < CHUTE_MIN_H * piece.size) continue
        this.chutes.set(piece.id, this.time)
        this.action('chute', piece)
      }
      const vy = v.y > CHUTE_VY ? v.y + (CHUTE_VY - v.y) * CHUTE_GRIP : v.y
      body.setLinearVelocity(Vec2(v.x * CHUTE_SWAY, vy))
      const a = body.getAngle()
      body.setAngularVelocity(-Math.atan2(Math.sin(a), Math.cos(a)) * CHUTE_UPRIGHT)
    }
  }

  /** Тело на что-то опирается (касается не сквозной детали). */
  private touching(body: Body): boolean {
    for (let edge = body.getContactList(); edge; edge = edge.next ?? null) {
      const c = edge.contact
      if (c.isTouching() && !c.getFixtureA().isSensor() && !c.getFixtureB().isSensor()) return true
    }
    return false
  }

  /** Улетевшая ракета скрылась за потолком или стеной — её больше нет. */
  private removeGhosts(): void {
    for (const id of [...this.ghosts]) {
      const rocket = this.pieceMap.get(id)
      if (!rocket) {
        this.ghosts.delete(id)
        continue
      }
      const p = rocket.body.getPosition()
      const left = this.opts.leftX ?? 0
      const out =
        p.y < this.opts.ceilingY - 2 ||
        p.x < left - 2 ||
        p.x > this.rightWall() + 2 ||
        (!this.isBurning(id) && p.y > this.opts.floorY + 2)
      if (!out && this.isBurning(id)) continue
      this.action('gone', rocket)
      this.remove(id)
    }
  }

  /** «Пли!»: предмет вылетает из жерла. false — это не пушка или предмет не влезает. */
  fire(cannonId: number, itemId: number): boolean {
    const cannon = this.pieceMap.get(cannonId)
    const item = this.pieceMap.get(itemId)
    const muzzle = cannon && getPieceSpec(cannon.kind).muzzle
    const at = this.muzzleOf(cannonId)
    if (!cannon || !item || !muzzle || !at) return false
    if (this.holds.get(cannonId) !== itemId && !this.canHold(item, cannon)) return false
    const dir = this.muzzleDir(cannon)
    this.unpark(itemId)
    this.firm(item)
    this.detach(item)
    for (const [c, b] of this.holds) if (b === itemId) this.holds.delete(c)
    if (this.muzzleSet.delete(itemId)) this.setSensor(item, false)
    this.setGroup(item, -cannonId)
    this.ungroupAt.set(itemId, this.time + 0.25)
    this.reloadAt.set(itemId, this.time + 0.8)
    const r = 0.55 * this.halfOf(item)
    item.body.setTransform(Vec2(at.x + dir.x * r, at.y + dir.y * r), item.body.getAngle())
    const speed = muzzle.speed * Math.sqrt(cannon.size)
    item.body.setLinearVelocity(Vec2(dir.x * speed, dir.y * speed))
    item.body.setAwake(true)
    if (!cannon.body.isStatic()) {
      const v = cannon.body.getLinearVelocity()
      cannon.body.setLinearVelocity(Vec2(v.x - dir.x * CANNON_RECOIL, v.y))
      cannon.body.setAwake(true)
    }
    return true
  }

  /** Каждая пушка с предметом в дуле стреляет. Возвращает, какие выстрелили. */
  fireLoaded(): number[] {
    const fired: number[] = []
    for (const piece of [...this.pieceMap.values()]) {
      if (!getPieceSpec(piece.kind).muzzle) continue
      const item = this.loadedItem(piece.id)
      if (item !== null && this.fire(piece.id, item)) fired.push(piece.id)
    }
    return fired
  }

  private applyWind(): void {
    for (const fan of this.pieceMap.values()) {
      if (fan.kind !== 'fan' || !this.power.has(fan.id)) continue
      const wind = getPieceSpec('fan').wind!
      const a = fan.body.getAngle()
      const dir = { x: Math.cos(a), y: Math.sin(a) }
      const fp = fan.body.getPosition()
      const ox = fp.x + dir.x * 0.6 * fan.size
      const oy = fp.y + dir.y * 0.6 * fan.size
      const length = wind.length * fan.size
      for (const piece of this.pieceMap.values()) {
        if (piece === fan || piece.body.isStatic()) continue
        const p = piece.body.getPosition()
        const rx = p.x - ox
        const ry = p.y - oy
        const along = rx * dir.x + ry * dir.y
        const across = Math.abs(rx * dir.y - ry * dir.x)
        if (along <= 0 || along >= length || across > (0.9 + along * 0.12) * fan.size) continue
        const f = wind.force * fan.size * (1 - along / length)
        piece.body.applyForceToCenter(Vec2(dir.x * f, dir.y * f), true)
      }
      this.windOnRotors(fan, { x: ox, y: oy }, dir, length, wind.force * fan.size)
      this.fanSpin.set(fan.id, (this.fanSpin.get(fan.id) ?? 0) + 14 * STEP)
    }
  }

  /** Ветер давит на лопасть мельницы с той стороны, где проходит струя, — колесо крутится. */
  private windOnRotors(fan: Piece, o: Vec2Value, dir: Vec2Value, length: number, force: number): void {
    const n = { x: -dir.y, y: dir.x }
    for (const piece of this.pieceMap.values()) {
      const rotor = piece.link
      const spec = getPieceSpec(piece.kind).link
      if (!rotor || spec?.type !== 'axle') continue
      const R = 1.05 * piece.size
      const p = rotor.getPosition()
      const along = (p.x - o.x) * dir.x + (p.y - o.y) * dir.y
      const s = (p.x - o.x) * n.x + (p.y - o.y) * n.y
      if (along <= 0 || along >= length || Math.abs(s) - 0.8 * R > (0.9 + along * 0.12) * fan.size) continue
      const reach = Math.abs(s) < 0.25 ? -0.5 * R : Math.max(-0.6 * R, Math.min(0.6 * R, s))
      const r = { x: -n.x * reach, y: -n.y * reach }
      const f = force * (1 - along / length)
      rotor.applyTorque((r.x * dir.y - r.y * dir.x) * f, true)
    }
  }

  // ── Липучка ──

  stickCount(): number {
    return this.sticks.length
  }

  setSticky(on: boolean): void {
    this.opts = { ...this.opts, sticky: on }
    if (!on) this.unstickAll()
  }

  private stick(a: number, b: number, anchor: Vec2Value, firm = false): void {
    const pa = this.pieceMap.get(a)
    const pb = this.pieceMap.get(b)
    if (!pa || !pb || a === b) return
    if (pa.body.isStatic() && pb.body.isStatic()) return
    if (this.sticks.some((s) => (s.a === a && s.b === b) || (s.a === b && s.b === a))) return
    const joint = this.world.createJoint(new WeldJoint({}, pa.body, pb.body, Vec2(anchor.x, anchor.y)))
    if (joint) this.sticks.push({ a, b, joint, firm })
  }

  onStick(listener: (event: StickEvent) => void): void {
    this.stickListeners.push(listener)
  }

  /** Стоит ровно относительно соседа (кратно 90°) — можно прилипнуть. */
  private alignedWith(a: Piece, b: Piece): boolean {
    const rel = a.body.getAngle() - b.body.getAngle()
    return Math.abs(rel - snapRightAngle(rel)) <= STICK_MAX_TILT
  }

  /** Липучка отрывается; склеенное кнопкой «Склеить» остаётся. */
  private unstickAll(): void {
    this.sticks = this.sticks.filter((s) => {
      if (s.firm) return true
      this.world.destroyJoint(s.joint)
      return false
    })
  }

  /**
   * Ребёнок сам поставил деталь рукой и она успокоилась — прилипает к тем,
   * кого касается ровно. Упавшее из шкафа, брошенное и всё в невесомости не липнет.
   */
  private settle(): void {
    for (const [id, until] of this.settling) {
      const piece = this.pieceMap.get(id)
      if (!piece || this.time > until || !this.opts.sticky || this.space || this.frozen) {
        this.settling.delete(id)
        continue
      }
      if (NOT_STICKY.has(piece.kind) || this.isGrabbed(piece.body)) continue
      const v = piece.body.getLinearVelocity()
      if (Math.hypot(v.x, v.y) > SETTLE_SPEED || Math.abs(piece.body.getAngularVelocity()) > SETTLE_SPEED) continue
      let touching = false
      for (let edge = piece.body.getContactList(); edge; edge = edge.next ?? null) {
        const contact = edge.contact
        if (!contact.isTouching()) continue
        touching = true
        const otherId = edge.other?.getUserData()
        if (typeof otherId !== 'number' || otherId <= 0 || otherId === id) continue
        const other = this.pieceMap.get(otherId)
        if (!other || NOT_STICKY.has(other.kind) || this.isGrabbed(other.body) || !this.alignedWith(piece, other)) continue
        const point = contact.getWorldManifold(null)?.points[0] ?? piece.body.getPosition()
        const before = this.sticks.length
        this.stick(id, otherId, point)
        if (this.sticks.length > before) this.pendingSticks.push({ x: point.x, y: point.y })
      }
      if (touching) this.settling.delete(id)
    }
  }

  private breakSticks(): void {
    this.sticks = this.sticks.filter((s) => {
      if (s.firm) return true
      const force = s.joint.getReactionForce(1 / STEP)
      const torque = Math.abs(s.joint.getReactionTorque(1 / STEP))
      if (Math.hypot(force.x, force.y) <= STICK_BREAK_FORCE && torque <= STICK_BREAK_TORQUE) return true
      this.world.destroyJoint(s.joint)
      return false
    })
  }

  // ── Рука ──

  /** Палец `hand` взял детали. false — их уже держит другой палец. */
  grab(ids: readonly number[], x: number, y: number, hand = 0): boolean {
    this.releaseGrab(undefined, hand)
    const free = ids.filter((id) => {
      const piece = this.pieceMap.get(id)
      return piece !== undefined && !this.isHeld(piece)
    })
    if (free.length === 0) return false
    free.forEach((id, index) => {
      const piece = this.pieceMap.get(id)!
      this.firm(piece)
      this.unpark(id)
      const body = piece.body
      if (this.isFixedPiece(piece)) {
        const p = body.getPosition()
        this.fixedGrabs.push({ hand, piece, offset: { x: p.x - x, y: p.y - y } })
        return
      }
      const anchor = index === 0 ? Vec2(x, y) : body.getWorldCenter().clone()
      const joint = this.world.createJoint(
        new MouseJoint(
          { maxForce: (body.getMass() + 2) * G_EARTH * 25, frequencyHz: 6, dampingRatio: 0.9 },
          this.ground,
          body,
          anchor,
        ),
      )
      if (!joint) return
      body.setAwake(true)
      this.grabs.push({ hand, body, joint, offset: { x: anchor.x - x, y: anchor.y - y } })
    })
    return true
  }

  moveGrab(x: number, y: number, hand = 0): void {
    for (const g of this.grabs) {
      if (g.hand !== hand) continue
      g.joint.setTarget(Vec2(x + g.offset.x, y + g.offset.y))
      const rope = this.ropeMap.get(g.body.getUserData() as number)
      if (rope) this.followRope(rope, x)
    }
    for (const g of this.fixedGrabs) {
      if (g.hand !== hand) continue
      const tx = this.clampX(x + g.offset.x)
      const ty = Math.min(Math.max(y + g.offset.y, this.opts.ceilingY + 0.5), this.opts.floorY - 0.5)
      const before = g.piece.body.getPosition().clone()
      g.piece.body.setTransform(Vec2(tx, ty), g.piece.body.getAngle())
      const dx = tx - before.x
      const dy = ty - before.y
      for (const body of [...g.piece.wheels, ...(g.piece.link ? [g.piece.link] : [])]) {
        const p = body.getPosition()
        body.setTransform(Vec2(p.x + dx, p.y + dy), body.getAngle())
        body.setAwake(true)
      }
      this.moveExtras(g.piece, dx, dy)
    }
  }

  /** Тащат шар далеко вбок — крючок едет по потолку следом. */
  private followRope(rope: Rope, fingerX: number): void {
    const reach = rope.length * ROPE_FOLLOW
    const dx = fingerX - rope.ax
    if (Math.abs(dx) <= reach) return
    const ax = this.clampX(fingerX - Math.sign(dx) * reach)
    if (Math.abs(ax - rope.ax) < 0.02) return
    rope.ax = ax
    this.connectRope(rope)
  }

  /**
   * Палец `hand` отпустил (без `hand` — все пальцы). С `velocity` (единиц/с) —
   * смахнул, деталь летит и не липнет; аккуратно поставленная — может прилипнуть.
   */
  releaseGrab(velocity?: Vec2Value, hand?: number): number[] {
    const mine = (g: { hand: number }): boolean => hand === undefined || g.hand === hand
    const ids = this.grabbedIds(hand)
    const speed = velocity ? Math.hypot(velocity.x, velocity.y) : 0
    const thrown = velocity !== undefined && speed >= THROW_MIN_SPEED
    const cap = this.mode().maxSpeed
    for (const g of this.grabs) {
      if (!mine(g)) continue
      this.world.destroyJoint(g.joint)
      if (thrown) {
        const k = Math.min(1, cap / speed)
        g.body.setLinearVelocity(Vec2(velocity.x * k, velocity.y * k))
      }
    }
    this.grabs = this.grabs.filter((g) => !mine(g))
    this.fixedGrabs = this.fixedGrabs.filter((g) => !mine(g))
    if (speed < STICK_MAX_RELEASE) for (const id of ids) this.settling.set(id, this.time + SETTLE_S)
    return ids
  }

  isGrabbing(): boolean {
    return this.grabs.length > 0 || this.fixedGrabs.length > 0
  }

  grabbedIds(hand?: number): number[] {
    const mine = (g: { hand: number }): boolean => hand === undefined || g.hand === hand
    return [
      ...this.grabs.filter(mine).map((g) => g.body.getUserData() as number),
      ...this.fixedGrabs.filter(mine).map((g) => g.piece.id),
    ]
  }

  private isGrabbed(body: Body): boolean {
    return this.grabs.some((g) => g.body === body)
  }

  private isHeld(piece: Piece): boolean {
    return this.isGrabbed(piece.body) || this.fixedGrabs.some((g) => g.piece === piece)
  }

  // ── Режимы ──

  setFrozen(on: boolean): void {
    if (this.frozen === on) return
    this.frozen = on
    this.unparkAll()
    this.applyGravity()
    for (const piece of this.pieceMap.values()) {
      if (piece.body.isStatic()) continue
      if (on) {
        for (const body of this.bodiesOf(piece)) {
          const p = body.getPosition()
          body.setTransform(Vec2(p.x, p.y - FREEZE_LIFT), body.getAngle())
        }
        if (!this.isStuck(piece.id) && piece.wheels.length === 0 && !piece.link) {
          piece.body.setTransform(piece.body.getPosition(), snapRightAngle(piece.body.getAngle()))
        }
        this.applyFrozen(piece)
      } else {
        this.applyMode(piece)
        for (const body of this.bodiesOf(piece)) body.setAwake(true)
      }
    }
  }

  isFrozen(): boolean {
    return this.frozen
  }

  /** К детали привязан шарик. */
  isTied(id: number): boolean {
    return this.tieList.some((t) => t.piece === id)
  }

  /** Лежит в пушке или едет на/в ракете. */
  isCargo(id: number): boolean {
    return [...this.holds.values()].includes(id)
  }

  /** Чья это ноша: пушка или ракета, в которой лежит предмет (null — ничья). */
  cargoHolder(id: number): number | null {
    return this.holderOf(id)?.id ?? null
  }

  /** Деталь сейчас держат пальцем. */
  isPieceHeld(id: number): boolean {
    const piece = this.pieceMap.get(id)
    return piece !== undefined && this.isHeld(piece)
  }

  /** Кнопка «Гравитация»: выключена — всё плавает, как в космосе; липучка отрывается. */
  setGravityOff(on: boolean): void {
    if (this.space === on) return
    this.space = on
    this.unstickAll()
    this.unparkAll()
    this.applyGravity()
    for (const piece of this.pieceMap.values()) {
      if (piece.body.isStatic()) continue
      this.applyMode(piece)
      if (on && !this.frozen) {
        const v = piece.body.getLinearVelocity()
        piece.body.setLinearVelocity(Vec2(v.x + (this.random() - 0.5) * 1.2, v.y - (0.3 + this.random() * 0.5)))
        piece.body.setAngularVelocity(piece.body.getAngularVelocity() + (this.random() - 0.5) * 0.8)
      }
      for (const body of this.bodiesOf(piece)) body.setAwake(true)
    }
  }

  isGravityOff(): boolean {
    return this.space
  }

  /** «Бум!»: липучка отрывается, всё подпрыгивает и рассыпается. */
  shake(): void {
    this.unstickAll()
    this.unparkAll()
    for (const piece of this.pieceMap.values()) {
      if (piece.body.isStatic()) continue
      const vx = (this.random() - 0.5) * 6
      const vy = -(7 + this.random() * 4)
      for (const body of this.bodiesOf(piece)) {
        const v = body.getLinearVelocity()
        body.setLinearVelocity(Vec2(v.x + vx, v.y + vy))
        body.setAwake(true)
      }
      piece.body.setAngularVelocity((this.random() - 0.5) * 5)
    }
  }

  setRealistic(on: boolean): void {
    this.opts = { ...this.opts, realistic: on }
    for (const piece of this.pieceMap.values()) this.applyMode(piece)
  }

  setAutoStraight(on: boolean): void {
    this.opts = { ...this.opts, autoStraight: on }
  }

  onImpact(listener: (event: ImpactEvent) => void): void {
    this.impactListeners.push(listener)
  }

  onGoal(listener: (event: GoalEvent) => void): void {
    this.goalListeners.push(listener)
  }

  // ── «Отменить» ──

  snapshot(): SandboxSnapshot {
    const list = [...this.pieceMap.values()]
    const index = new Map(list.map((p, i) => [p.id, i]))
    return {
      pieces: list.map((p) => {
        const pos = p.body.getPosition()
        const rope = this.ropeMap.get(p.id)
        const snap: SnapPiece = {
          kind: p.kind,
          x: pos.x,
          y: pos.y,
          angle: p.body.getAngle(),
          color: p.color,
          size: p.size,
          flip: p.flip,
          on: this.power.has(p.id),
        }
        if (rope) snap.rope = { ax: rope.ax, length: rope.length }
        if (p.parked) snap.parked = true
        if (p.loose) snap.loose = true
        if (p.pinned) snap.pinned = true
        if (p.len !== 1) snap.len = p.len
        if (this.liftAuto.has(p.id)) snap.auto = true
        if (p.ropeCut) snap.ropeCut = true
        return snap
      }),
      sticks: this.sticks.map((s) => {
        const anchor = s.joint.getAnchorA()
        const entry: [number, number, number, number, number?] = [index.get(s.a)!, index.get(s.b)!, anchor.x, anchor.y]
        if (s.firm) entry.push(1)
        return entry
      }),
      ties: this.tieList.map((t) => [index.get(t.balloon)!, index.get(t.piece)!, t.local.x, t.local.y]),
      wires: [...this.wireMap].flatMap(([s, targets]) =>
        targets.filter((t) => index.has(t)).map((t): [number, number] => [index.get(s)!, index.get(t)!]),
      ),
      manual: [...this.manualWires].filter((id) => index.has(id)).map((id) => index.get(id)!),
      free: [...this.freeBalloons].filter((id) => index.has(id)).map((id) => index.get(id)!),
    }
  }

  /** Вернуть снимок. Снимок без проводов (старое сохранение) — кнопки подключатся сами. */
  restore(snap: SandboxSnapshot): void {
    this.clear()
    const ids: number[] = []
    for (const p of snap.pieces) {
      const id = this.add(p.kind, p.x, p.y, {
        angle: p.angle,
        color: p.color,
        size: p.size,
        flip: p.flip,
        rope: p.rope,
        parked: p.parked,
        loose: p.loose,
        pinned: p.pinned,
        len: p.len,
      })
      if (p.on) this.power.add(id)
      else this.power.delete(id)
      if (p.auto) this.liftAuto.add(id)
      const piece = this.pieceMap.get(id)
      if (p.ropeCut && piece) {
        if (getPieceSpec(p.kind).rope) this.dropRope(id)
        else this.shedBuckets(piece)
      }
      ids.push(id)
    }
    for (const [a, b, x, y, firm] of snap.sticks) this.stick(ids[a]!, ids[b]!, { x, y }, firm === 1)
    for (const [a, b, x, y] of snap.ties) this.tie(ids[a]!, ids[b]!, { x, y })
    if (snap.wires) {
      for (const id of ids) if (this.isSource(id)) this.wireMap.set(id, [])
      for (const [s, t] of snap.wires) {
        const sid = ids[s]
        const tid = ids[t]
        if (sid !== undefined && tid !== undefined && this.canConnect(sid, tid)) this.link(sid, tid)
      }
      this.manualWires.clear()
      for (const i of snap.manual ?? []) if (ids[i] !== undefined) this.manualWires.add(ids[i]!)
    }
    for (const i of snap.free ?? []) if (ids[i] !== undefined) this.freeBalloons.add(ids[i]!)
    this.syncSources()
  }

  // ── Шаг ──

  step(dt: number): void {
    this.acc = Math.min(this.acc + dt, STEP * MAX_SUBSTEPS)
    while (this.acc >= STEP) {
      this.acc -= STEP
      this.substep()
    }
    if (this.pendingImpacts.length) {
      const events = this.pendingImpacts
      this.pendingImpacts = []
      for (const e of events) for (const l of this.impactListeners) l(e)
    }
    if (this.pendingGoals.length) {
      const events = this.pendingGoals
      this.pendingGoals = []
      for (const e of events) for (const l of this.goalListeners) l(e)
    }
    if (this.pendingSticks.length) {
      const events = this.pendingSticks
      this.pendingSticks = []
      for (const e of events) for (const l of this.stickListeners) l(e)
    }
    if (this.pendingActions.length) {
      const events = this.pendingActions
      this.pendingActions = []
      for (const e of events) for (const l of this.actionListeners) l(e)
    }
  }

  private substep(): void {
    const g = this.gravity()
    for (const piece of this.pieceMap.values()) {
      const lift = getPieceSpec(piece.kind).lift
      if (lift && g > 0) piece.body.applyForceToCenter(Vec2(0, -lift * CUBE_MASS * g * piece.size * piece.size), true)
    }
    if (this.pendingKnock !== 0) {
      this.knockLoose(this.pendingKnock)
      this.pendingKnock = 0
    }
    if (this.pendingUnpark.size) {
      for (const id of this.pendingUnpark) this.unpark(id)
      this.pendingUnpark.clear()
    }
    if (!this.frozen) {
      this.applyWind()
      this.applyHoopPull()
    }
    this.applyMotors()
    this.applyThrust()
    this.updateSignals()
    this.suckItems()
    this.holdItems()
    this.updateChutes()
    this.moveRightWall()
    const straighten = this.frozen || this.opts.autoStraight
    for (const grab of this.grabs) {
      const angle = grab.body.getAngle()
      if (this.pieceMap.get(grab.body.getUserData() as number)?.kind === 'bucket') {
        // Ведёрко в руке висит ровно, как за ручку: груз не высыпается.
        grab.body.setAngularVelocity(-Math.atan2(Math.sin(angle), Math.cos(angle)) * 10)
        continue
      }
      if (!straighten || this.isRound(grab.body)) continue
      grab.body.setAngularVelocity((snapRightAngle(angle) - angle) * 10)
    }
    if (this.frozen) {
      for (const piece of this.pieceMap.values()) {
        if (this.isStuck(piece.id) || piece.wheels.length || piece.link || piece.body.isStatic()) continue
        const angle = piece.body.getAngle()
        piece.body.setAngularVelocity((snapRightAngle(angle) - angle) * 8)
      }
    }
    this.world.step(STEP, 8, 3)
    this.time += STEP
    this.holdItems()
    this.releaseCargo()
    this.applyBounces()
    this.applyPops()
    this.applyTies()
    this.breakSticks()
    this.settle()
    this.applyPipes()
    this.checkGoals()
    this.firmFallen()
    this.checkRides()
    this.removeGhosts()
    this.updateShrinks(STEP)
    const maxSpeed = this.mode().maxSpeed
    for (const piece of this.pieceMap.values()) {
      const grabbed = this.isGrabbed(piece.body)
      const cap = piece.kind === 'balloon' && !grabbed ? BALLOON_MAX_SPEED : maxSpeed
      for (const body of this.bodiesOf(piece)) {
        const v = body.getLinearVelocity()
        const speed = Math.hypot(v.x, v.y)
        if (speed > cap) body.setLinearVelocity(Vec2((v.x / speed) * cap, (v.y / speed) * cap))
      }
      if (!this.ghosts.has(piece.id)) this.keepInside(piece)
    }
  }

  /** Пара труб одного цвета: трубы по порядку постановки — 1 и 2, 3 и 4, 5 и 6. */
  pipePartner(id: number): number | null {
    const pipes = [...this.pieceMap.values()].filter((p) => p.kind === 'pipe').map((p) => p.id)
    const i = pipes.indexOf(id)
    if (i < 0) return null
    return pipes[i ^ 1] ?? null
  }

  /** Номер пары трубы (для цвета). */
  private pipePair(id: number): number {
    const pipes = [...this.pieceMap.values()].filter((p) => p.kind === 'pipe').map((p) => p.id)
    return Math.max(0, Math.floor(pipes.indexOf(id) / 2))
  }

  /** Предмет провалился в трубу сверху — выпадает из нижнего конца трубы-пары. */
  private applyPipes(): void {
    const pipes = [...this.pieceMap.values()].filter((p) => p.kind === 'pipe')
    if (pipes.length < 2) return
    for (const pipe of pipes) {
      const partnerId = this.pipePartner(pipe.id)
      const partner = partnerId === null ? undefined : this.pieceMap.get(partnerId)
      if (!partner) continue
      const k = pipe.size
      for (const piece of this.pieceMap.values()) {
        if (piece.kind === 'pipe' || this.isFixedPiece(piece) || piece.body.isStatic() || this.isHeld(piece)) continue
        if (this.ghosts.has(piece.id) || (this.teleportUntil.get(piece.id) ?? 0) > this.time) continue
        if ([...this.holds.values()].includes(piece.id) || this.ropeMap.has(piece.id)) continue
        const prev = this.prevPos.get(piece.id)
        if (!prev) continue
        const cur = piece.body.getPosition()
        const was = pipe.body.getLocalPoint(Vec2(prev.x, prev.y))
        const now = pipe.body.getLocalPoint(cur)
        if (Math.abs(now.x) > PIPE_INNER * k || was.y >= PIPE_MOUTH * k || now.y < PIPE_MOUTH * k) continue
        if (now.y > 0.9 * k || was.y < -3 * k) continue
        this.teleport(piece, pipe, partner)
      }
    }
  }

  private teleport(piece: Piece, from: Piece, to: Piece): void {
    const v = piece.body.getLinearVelocity()
    const speed = Math.max(Math.hypot(v.x, v.y), PIPE_EXIT_SPEED)
    const a = to.body.getAngle()
    const out = { x: -Math.sin(a), y: Math.cos(a) }
    const exit = to.body.getWorldPoint(Vec2(0, 0.35 * to.size))
    const p = piece.body.getPosition()
    const dx = exit.x - p.x
    const dy = exit.y - p.y
    this.detach(piece)
    for (const body of this.bodiesOf(piece)) {
      const bp = body.getPosition()
      body.setTransform(Vec2(bp.x + dx, bp.y + dy), body.getAngle())
      body.setLinearVelocity(Vec2(out.x * speed, out.y * speed))
      body.setAwake(true)
    }
    this.prevPos.set(piece.id, { x: exit.x, y: exit.y })
    this.teleportUntil.set(piece.id, this.time + PIPE_COOLDOWN_S)
    this.action('teleport', from, { x: exit.x, y: exit.y, color: piece.color, target: to.id })
  }

  /** Мяу и Олли едут на тележке, подъёмнике, ленте, качелях, в ракете — «ура!». */
  private checkRides(): void {
    for (const piece of this.pieceMap.values()) {
      if (piece.kind !== 'meow' && piece.kind !== 'olli') continue
      if (this.isHeld(piece) || this.time - (this.lastRide.get(piece.id) ?? -Infinity) < RIDE_REPEAT_S) continue
      const v = piece.body.getLinearVelocity()
      if (Math.hypot(v.x, v.y) < RIDE_SPEED) continue
      let riding = [...this.holds.values()].includes(piece.id)
      for (let edge = piece.body.getContactList(); edge && !riding; edge = edge.next ?? null) {
        if (!edge.contact.isTouching()) continue
        const other = this.pieceMap.get(edge.other?.getUserData() as number)
        if (other && other !== piece && RIDE_KINDS.has(other.kind)) riding = true
      }
      if (!riding) continue
      this.lastRide.set(piece.id, this.time)
      this.action('ride', piece)
    }
  }

  private onContact(contact: Contact): void {
    const fa = contact.getFixtureA()
    const fb = contact.getFixtureB()
    const ba = fa.getBody()
    const bb = fb.getBody()
    const ida = ba.getUserData() as number
    const idb = bb.getUserData() as number
    const pa = this.pieceMap.get(ida)
    const pb = this.pieceMap.get(idb)
    if (this.insideSet.has(ida) || this.insideSet.has(idb)) return

    if (pa?.parked && !bb.isStatic()) this.pendingUnpark.add(pa.id)
    if (pb?.parked && !ba.isStatic()) this.pendingUnpark.add(pb.id)
    if (pa?.loose && pb && !pb.loose) this.knockFrom(pa, bb)
    if (pb?.loose && pa && !pa.loose) this.knockFrom(pb, ba)

    if (pa?.kind === 'spring' && bb !== pa.body && ida !== idb) this.pendingBounces.push({ spring: pa, body: bb })
    if (pb?.kind === 'spring' && ba !== pb.body && ida !== idb) this.pendingBounces.push({ spring: pb, body: ba })

    if (pa && pb && ida !== idb) {
      if (pa.kind === 'balloon' && getPieceSpec(pb.kind).pops) this.pendingPops.add(ida)
      if (pb.kind === 'balloon' && getPieceSpec(pa.kind).pops) this.pendingPops.add(idb)
      const point = contact.getWorldManifold(null)?.points[0]
      if (pa.kind === 'balloon' && pb.kind !== 'balloon') {
        this.pendingTies.push({ balloon: ida, piece: idb, point: point ?? bb.getPosition().clone() })
      } else if (pb.kind === 'balloon' && pa.kind !== 'balloon') {
        this.pendingTies.push({ balloon: idb, piece: ida, point: point ?? ba.getPosition().clone() })
      }
    }

    const va = ba.getLinearVelocity()
    const vb = bb.getLinearVelocity()
    const rel = Math.hypot(va.x - vb.x, va.y - vb.y)
    if (rel < IMPACT_MIN_SPEED) return
    const sa = Math.hypot(va.x, va.y)
    const sb = Math.hypot(vb.x, vb.y)
    const mover = sa >= sb ? pa : pb
    if (!mover) return
    const last = this.lastImpact.get(mover.id) ?? -Infinity
    if (this.time - last < IMPACT_REPEAT_S) return
    this.lastImpact.set(mover.id, this.time)
    this.pendingImpacts.push({
      id: mover.id,
      kind: mover.kind,
      material: getPieceSpec(mover.kind).material,
      strength: Math.min(1, rel / IMPACT_FULL_SPEED),
    })
  }

  /** Шарик коснулся кактуса — лопнул (после шага: тела во время шага убирать нельзя). */
  private applyPops(): void {
    if (!this.pendingPops.size) return
    const pops = [...this.pendingPops]
    this.pendingPops.clear()
    for (const id of pops) {
      const balloon = this.pieceMap.get(id)
      if (!balloon) continue
      this.action('pop', balloon, { color: balloon.color })
      this.remove(id)
    }
  }

  private applyTies(): void {
    if (!this.pendingTies.length) return
    const pending = this.pendingTies
    this.pendingTies = []
    for (const { balloon, piece, point } of pending) {
      const target = this.pieceMap.get(piece)
      if (!target || !this.pieceMap.has(balloon)) continue
      this.tie(balloon, piece, target.body.getLocalPoint(Vec2(point.x, point.y)))
    }
  }

  private applyBounces(): void {
    if (!this.pendingBounces.length) return
    const bounces = this.pendingBounces
    this.pendingBounces = []
    if (this.frozen) return
    for (const { spring, body } of bounces) {
      if (!this.pieceMap.has(spring.id) || body.isStatic()) continue
      const last = this.lastBounce.get(body) ?? -Infinity
      if (this.time - last < BOUNCE_REPEAT_S) continue
      const a = spring.body.getAngle()
      const up = { x: Math.sin(a), y: -Math.cos(a) }
      const sp = spring.body.getPosition()
      const bp = body.getPosition()
      if ((bp.x - sp.x) * up.x + (bp.y - sp.y) * up.y < 0.1) continue
      const v = body.getLinearVelocity()
      const along = v.x * up.x + v.y * up.y
      const power = getPieceSpec('spring').bounce ?? 0
      body.setLinearVelocity(Vec2(v.x - along * up.x + up.x * power, v.y - along * up.y + up.y * power))
      this.lastBounce.set(body, this.time)
      this.pendingImpacts.push({ id: spring.id, kind: 'spring', material: 'spring', strength: 0.8 })
    }
  }

  /** Отверстие кольца: от края обода до щита. */
  private hoopMouth(hoop: Piece): { x0: number; x1: number } {
    const hp = hoop.body.getPosition()
    const side = hoop.flip ? -1 : 1
    const k = HOOP_SCALE * hoop.size
    const lip = hp.x - side * 0.6 * k
    const board = hp.x + side * 0.75 * k
    return { x0: Math.min(lip, board), x1: Math.max(lip, board) }
  }

  /** Деталь над кольцом мягко тянется к его середине — попасть легко. */
  private applyHoopPull(): void {
    for (const hoop of this.pieceMap.values()) {
      if (hoop.kind !== 'hoop') continue
      const hp = hoop.body.getPosition()
      const { x0, x1 } = this.hoopMouth(hoop)
      const cx = (x0 + x1) / 2
      const k = HOOP_SCALE * hoop.size
      for (const piece of this.pieceMap.values()) {
        if (piece === hoop || piece.body.isStatic() || this.isGrabbed(piece.body)) continue
        if (piece.kind === 'balloon' || piece.kind === 'wrecking') continue
        const p = piece.body.getPosition()
        const dx = cx - p.x
        const above = hp.y - p.y
        if (above <= 0.05 || above > HOOP_PULL_HEIGHT * k || Math.abs(dx) > HOOP_PULL_REACH * k) continue
        const f = piece.body.getMass() * HOOP_PULL * Math.max(-1, Math.min(1, dx / k))
        piece.body.applyForceToCenter(Vec2(f, 0), true)
      }
    }
  }

  /** Деталь пролетела через кольцо сверху вниз — «ура!». */
  private checkGoals(): void {
    const hoops = [...this.pieceMap.values()].filter((p) => p.kind === 'hoop')
    for (const piece of this.pieceMap.values()) {
      const cur = piece.body.getPosition()
      const prev = this.prevPos.get(piece.id)
      this.prevPos.set(piece.id, { x: cur.x, y: cur.y })
      if (!prev || piece.kind === 'hoop' || piece.body.getLinearVelocity().y <= 0) continue
      for (const hoop of hoops) {
        const hp = hoop.body.getPosition()
        const { x0, x1 } = this.hoopMouth(hoop)
        if (prev.y >= hp.y || cur.y < hp.y || cur.x < x0 || cur.x > x1) continue
        const last = this.lastGoal.get(hoop.id) ?? -Infinity
        if (this.time - last < GOAL_REPEAT_S) continue
        this.lastGoal.set(hoop.id, this.time)
        this.pendingGoals.push({ hoopId: hoop.id, x: hp.x, y: hp.y })
      }
    }
  }

  // ── Снимок для рисования ──

  pieces(): PieceView[] {
    return [...this.pieceMap.values()].map((piece) => {
      const p = piece.body.getPosition()
      const view: PieceView = {
        id: piece.id,
        kind: piece.kind,
        color: piece.kind === 'pipe' ? pipeColor(this.pipePair(piece.id)) : piece.color,
        x: p.x,
        y: p.y,
        angle: piece.body.getAngle(),
        size: piece.size,
        flip: piece.flip,
      }
      const spec = getPieceSpec(piece.kind)
      if (spec.stretch) view.len = piece.len
      if (piece.pinned) view.pinned = true
      if (spec.motor) {
        view.on = this.power.has(piece.id)
        view.spin = this.fanSpin.get(piece.id) ?? 0
      }
      if (spec.thrust) {
        view.on = this.isBurning(piece.id)
        const held = this.holds.get(piece.id)
        const cargo = held === undefined ? undefined : this.pieceMap.get(held)
        if (cargo && this.insideSet.has(cargo.id)) view.cargo = { kind: cargo.kind, color: cargo.color }
        else if (cargo && PASSENGERS.has(cargo.kind)) view.rider = cargo.id
      }
      if (this.insideSet.has(piece.id)) view.inside = this.holderOf(piece.id)?.id
      const shrink = this.shrinks.get(piece.id)
      if (shrink !== undefined) view.shrink = shrink
      const holder = this.holderOf(piece.id)
      if (holder && getPieceSpec(holder.kind).muzzle) {
        const at = this.holeOf(holder.id)!
        const dir = this.muzzleDir(holder)
        view.muzzle = { holder: holder.id, x: at.x, y: at.y, dx: dir.x, dy: dir.y, r: (MUZZLE_BORE / 2) * holder.size }
      }
      const opened = this.chutes.get(piece.id)
      if (opened !== undefined) view.chute = this.time - opened
      if (piece.link) {
        const lp = piece.link.getPosition()
        view.link = { x: lp.x, y: lp.y, angle: piece.link.getAngle() }
      }
      if (piece.extras.length && spec.pulley) {
        view.extras = piece.extras.map((b) => {
          const bp = b.getPosition()
          return { x: bp.x, y: bp.y, angle: b.getAngle() }
        })
        view.cords = this.cordsOf(piece)
      }
      if (piece.wheels.length) {
        const radii = getPieceSpec(piece.kind).wheels ?? []
        view.wheels = piece.wheels.map((wheel, i) => {
          const wp = wheel.getPosition()
          return { x: wp.x, y: wp.y, angle: wheel.getAngle(), r: (radii[i]?.r ?? 0.3) * piece.size }
        })
      }
      return view
    })
  }

  // ── Внутреннее ──

  private mode(): (typeof MODE)['soft'] | (typeof MODE)['real'] {
    return this.opts.realistic ? MODE.real : MODE.soft
  }

  private gravity(): number {
    return this.frozen || this.space ? 0 : G_EARTH
  }

  private applyGravity(): void {
    this.world.setGravity(Vec2(0, this.gravity()))
  }

  private dampingFor(kind: PieceKind): { linear: number; angular: number } {
    if (this.frozen) return { linear: FROZEN_DAMPING, angular: FROZEN_DAMPING }
    if (this.space) return SPACE_DAMPING
    const mode = this.mode()
    if (kind === 'ball') return BALL_DAMPING
    return { linear: kind === 'balloon' ? BALLOON_DAMPING : mode.linear, angular: mode.angular }
  }

  private applyFrozen(piece: Piece): void {
    if (piece.body.isStatic()) return
    for (const body of this.bodiesOf(piece)) {
      body.setLinearVelocity(Vec2(0, 0))
      body.setAngularVelocity(0)
      body.setLinearDamping(FROZEN_DAMPING)
      body.setAngularDamping(FROZEN_DAMPING)
      body.setAwake(true)
    }
  }

  private applyMode(piece: Piece): void {
    const mode = this.mode()
    const spec = getPieceSpec(piece.kind)
    const damping = this.dampingFor(piece.kind)
    piece.body.setLinearDamping(damping.linear)
    piece.body.setAngularDamping(damping.angular)
    for (let f = piece.body.getFixtureList(); f; f = f.getNext()) {
      f.setFriction(piece.loose ? LOOSE_FRICTION : spec.body.friction * mode.friction)
      f.setRestitution(spec.body.restitution * mode.restitution)
    }
    for (const wheel of piece.wheels) {
      wheel.setLinearDamping(damping.linear)
      wheel.setAngularDamping(this.frozen ? FROZEN_DAMPING : 0.2)
    }
    if (piece.link) {
      piece.link.setLinearDamping(damping.linear)
      const free = spec.link?.type === 'axle' ? AXLE_DAMPING : PIVOT_DAMPING
      piece.link.setAngularDamping(this.frozen ? FROZEN_DAMPING : free)
      for (let f = piece.link.getFixtureList(); f; f = f.getNext()) {
        f.setFriction(spec.body.friction * mode.friction)
        f.setRestitution(spec.body.restitution * mode.restitution)
      }
    }
  }

  private isRound(body: Body): boolean {
    const kind = this.pieceMap.get(body.getUserData() as number)?.kind
    return kind !== undefined && getPieceSpec(kind).turn === 'none'
  }

  private isStuck(id: number): boolean {
    return this.sticks.some((s) => s.a === id || s.b === id)
  }

  /** Все тела, связанные липучкой с деталью (и колёса тележек). */
  private clusterBodies(id: number): Body[] {
    const seen = new Set<number>([id])
    const queue = [id]
    while (queue.length) {
      const cur = queue.shift()!
      for (const s of this.sticks) {
        const other = s.a === cur ? s.b : s.b === cur ? s.a : null
        if (other !== null && !seen.has(other)) {
          seen.add(other)
          queue.push(other)
        }
      }
    }
    const bodies: Body[] = []
    for (const pid of seen) {
      const piece = this.pieceMap.get(pid)
      if (piece && !piece.body.isStatic()) bodies.push(...this.bodiesOf(piece))
    }
    return bodies
  }

  private bounds(piece: Piece): { x0: number; y0: number; x1: number; y1: number } {
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const body of this.bodiesOf(piece)) {
      const xf = body.getTransform()
      for (let f = body.getFixtureList(); f; f = f.getNext()) {
        const shape = f.getShape()
        for (let child = 0; child < shape.getChildCount(); child += 1) {
          const box = { lowerBound: Vec2(0, 0), upperBound: Vec2(0, 0) }
          shape.computeAABB(box, xf, child)
          x0 = Math.min(x0, box.lowerBound.x)
          y0 = Math.min(y0, box.lowerBound.y)
          x1 = Math.max(x1, box.upperBound.x)
          y1 = Math.max(y1, box.upperBound.y)
        }
      }
    }
    return { x0, y0, x1, y1 }
  }

  private clampX(x: number): number {
    const left = (this.opts.leftX ?? 0) + 0.5
    const right = Math.max(left, this.rightWall() - 0.5)
    return Math.min(Math.max(x, left), right)
  }

  private keepInside(piece: Piece): void {
    const body = piece.body
    if (body.isStatic()) return
    const { floorY, ceilingY } = this.opts
    const left = this.opts.leftX ?? 0
    const right = this.rightWall()
    const p = body.getPosition()
    const outside = p.x < left - 0.5 || p.x > right + 0.5 || p.y > floorY + 0.5 || p.y < ceilingY - 3
    if (!outside) return
    const x = Math.min(Math.max(p.x, left + 1), right - 1)
    const y = Math.min(Math.max(p.y, ceilingY + 1), floorY - 1)
    body.setTransform(Vec2(x, y), body.getAngle())
    body.setLinearVelocity(Vec2(0, 0))
    body.setAngularVelocity(0)
  }
}
