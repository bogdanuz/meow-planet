/**
 * Сцены «Прятки» (S16): предметы и укрытия. Арт и порядок предметов на листах —
 * `docs/assets/hide-seek-ART.md`, нарезка — `scripts/build-hide-seek-assets.mjs`.
 *
 * Укрытие — край, за который уходит предмет. Координаты в % картинки сцены (4:3):
 * - `side: 'bottom'` — `x` центр предмета, `y` линия края (куст, бортик, подушка), предмет торчит вверх;
 * - `side: 'left' | 'right'` — с какой стороны стоит то, что закрывает; `x` — вертикальный край, `y` — центр предмета;
 * - `s` — высота предмета в % высоты картинки; `kuku` — спрятан целиком, тап — выпрыгивает.
 * Безопасная зона (тест): не под шапкой, ведущим слева внизу и полоской внизу по центру, в зеркале тоже.
 */

export const HIDE_SCENE_IDS = ['room', 'kitchen', 'garden', 'beach', 'forest', 'playground'] as const
export type HideSceneId = (typeof HIDE_SCENE_IDS)[number]

export type HideColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'brown' | 'gray' | 'white' | 'pink' | 'multi'

export type HideItem = {
  readonly id: string
  /** Кто/что: «ёжик», «божья коровка». */
  readonly nom: string
  /** Кого/что найти: «ёжика», «божью коровку». */
  readonly acc: string
  readonly gender: 'm' | 'f' | 'n'
  /** Для обманки похожего цвета на «Сложно». */
  readonly color: HideColor
}

export type Hideout = {
  readonly x: number
  readonly y: number
  readonly s: number
  readonly side: 'bottom' | 'left' | 'right'
  readonly edge: 'soft' | 'straight'
  readonly kuku?: true
  /** Укрытие — текстура (куст, трава, сено, песок, шарики): только «Сложно», как и «ку-ку». */
  readonly texture?: true
  /** Кому здесь место по смыслу (id предметов сцены); нет списка — всем. */
  readonly fits?: readonly string[]
}

export type HideScene = {
  readonly id: HideSceneId
  readonly titleRu: string
  readonly intro: string
  readonly items: readonly HideItem[]
  readonly hideouts: readonly Hideout[]
}

const item = (id: string, nom: string, acc: string, gender: HideItem['gender'], color: HideColor): HideItem => ({
  id,
  nom,
  acc,
  gender,
  color,
})

const under = (x: number, y: number, s: number, edge: Hideout['edge'] = 'soft'): Hideout => ({
  x,
  y,
  s,
  side: 'bottom',
  edge,
})
const kuku = (x: number, y: number, s: number, edge: Hideout['edge'] = 'soft'): Hideout => ({
  ...under(x, y, s, edge),
  kuku: true,
})
const behindLeft = (x: number, y: number, s: number, edge: Hideout['edge'] = 'straight'): Hideout => ({
  x,
  y,
  s,
  side: 'left',
  edge,
})
const behindRight = (x: number, y: number, s: number, edge: Hideout['edge'] = 'straight'): Hideout => ({
  x,
  y,
  s,
  side: 'right',
  edge,
})
/** `only('duck car', h)` — сюда по смыслу подходят только эти предметы. */
const only = (ids: string, h: Hideout): Hideout => ({ ...h, fits: ids.split(' ') })
const texture = (h: Hideout): Hideout => ({ ...h, texture: true })

export const HIDE_SCENES: readonly HideScene[] = [
  {
    id: 'room',
    titleRu: 'Детская',
    intro: 'Мы в детской! Тут кто-то прячется…',
    items: [
      item('duck', 'уточка', 'уточку', 'f', 'yellow'),
      item('car', 'машинка', 'машинку', 'f', 'red'),
      item('drum', 'барабан', 'барабан', 'm', 'red'),
      item('book', 'книжка', 'книжку', 'f', 'blue'),
      item('sock', 'носок', 'носок', 'm', 'pink'),
      item('top', 'юла', 'юлу', 'f', 'multi'),
      item('plane', 'самолётик', 'самолётик', 'm', 'yellow'),
      item('rattle', 'погремушка', 'погремушку', 'f', 'multi'),
      item('slipper', 'тапочек', 'тапочек', 'm', 'brown'),
      item('umbrella', 'зонтик', 'зонтик', 'm', 'blue'),
    ],
    hideouts: [
      only('duck car top rattle plane drum sock book', kuku(41, 57, 11, 'straight')),
      only('slipper sock book duck rattle', kuku(93, 62.5, 10)),
      only('duck car drum book sock top plane rattle', under(30, 37, 9)),
      only('duck car drum book sock top plane rattle', under(9.5, 39, 9)),
      only('duck car top rattle sock plane', under(48.5, 45.5, 8, 'straight')),
      only('duck car drum book top plane rattle umbrella slipper', behindLeft(71, 48, 9)),
      only('duck car plane', under(70.5, 50.5, 9)),
      only('duck car top rattle plane sock drum', under(81, 51.5, 9, 'straight')),
      only('duck car top rattle sock plane', under(74, 64.5, 9, 'straight')),
      only('slipper sock book duck umbrella rattle', under(85, 58.5, 9)),
      only('duck rattle top car', under(90, 42, 8, 'straight')),
      only('umbrella book plane drum slipper', behindLeft(45, 45, 9, 'soft')),
    ],
  },
  {
    id: 'kitchen',
    titleRu: 'Кухня',
    intro: 'Мы на кухне! Тут кто-то прячется…',
    items: [
      item('spoon', 'ложка', 'ложку', 'f', 'brown'),
      item('lemon', 'лимон', 'лимон', 'm', 'yellow'),
      item('apple', 'яблоко', 'яблоко', 'n', 'red'),
      item('banana', 'банан', 'банан', 'm', 'yellow'),
      item('carrot', 'морковка', 'морковку', 'f', 'orange'),
      item('cheese', 'сыр', 'сыр', 'm', 'yellow'),
      item('mouse', 'мышка', 'мышку', 'f', 'gray'),
      item('kettle', 'чайник', 'чайник', 'm', 'blue'),
      item('pear', 'груша', 'грушу', 'f', 'green'),
      item('cookie', 'печенье', 'печенье', 'n', 'brown'),
    ],
    hideouts: [
      only('cookie cheese mouse lemon apple pear', kuku(36, 50.5, 11)),
      only('spoon carrot lemon apple pear banana', under(60, 31, 10)),
      only('cheese cookie apple carrot lemon pear', under(71, 37, 9)),
      only('spoon apple banana pear lemon carrot kettle', under(20, 39, 9, 'straight')),
      only('mouse lemon apple pear cookie', under(17.5, 26, 8, 'straight')),
      only('apple banana pear lemon', under(22, 58.5, 9)),
      only('carrot mouse apple pear lemon', under(29, 68.5, 9)),
      only('spoon cookie banana apple pear cheese', under(92, 55, 9, 'straight')),
      only('kettle cheese mouse apple pear lemon cookie', under(49, 51, 9, 'straight')),
      only('spoon cookie kettle', under(27, 29, 8, 'straight')),
      only('cookie cheese mouse spoon lemon apple', under(50, 64, 8)),
      only('carrot apple pear lemon mouse cookie', under(10.5, 63, 8)),
    ],
  },
  {
    id: 'garden',
    titleRu: 'Сад',
    intro: 'Мы в саду! Кто тут прячется?',
    items: [
      item('snail', 'улитка', 'улитку', 'f', 'brown'),
      item('ladybug', 'божья коровка', 'божью коровку', 'f', 'red'),
      item('butterfly', 'бабочка', 'бабочку', 'f', 'blue'),
      item('strawberry', 'клубника', 'клубнику', 'f', 'red'),
      item('cucumber', 'огурец', 'огурец', 'm', 'green'),
      item('can', 'лейка', 'лейку', 'f', 'green'),
      item('pumpkin', 'тыква', 'тыкву', 'f', 'orange'),
      item('frog', 'лягушка', 'лягушку', 'f', 'green'),
      item('bird', 'птичка', 'птичку', 'f', 'blue'),
      item('spade', 'лопатка', 'лопатку', 'f', 'gray'),
    ],
    hideouts: [
      only('frog snail spade can pumpkin', kuku(89, 54, 11)),
      only('frog can snail bird ladybug butterfly', kuku(66, 32, 10, 'straight')),
      only('snail ladybug frog cucumber strawberry pumpkin butterfly', under(48.5, 58.5, 9)),
      only('snail ladybug frog cucumber strawberry pumpkin butterfly', under(66, 63, 9)),
      only('snail ladybug frog cucumber strawberry pumpkin butterfly', under(33.5, 64, 9)),
      only('snail ladybug frog cucumber strawberry pumpkin butterfly', under(75.5, 62.5, 9)),
      only('snail ladybug frog cucumber strawberry pumpkin butterfly', under(55.5, 68.5, 9)),
      texture(only('snail ladybug frog strawberry cucumber butterfly', under(24.5, 61, 9))),
      only('bird butterfly ladybug snail can', under(75, 35, 9, 'straight')),
      only('can spade bird pumpkin cucumber strawberry', under(22, 35, 9, 'straight')),
      only('spade can bird pumpkin', behindRight(90.5, 40, 9)),
      only('spade can pumpkin', behindLeft(15.4, 31, 9)),
      only('cucumber strawberry pumpkin snail', under(31, 77, 9)),
    ],
  },
  {
    id: 'beach',
    titleRu: 'Пляж',
    intro: 'Мы на пляже! Давай поищем, кто спрятался!',
    items: [
      item('shell', 'ракушка', 'ракушку', 'f', 'pink'),
      item('crab', 'краб', 'краба', 'm', 'red'),
      item('pail', 'ведёрко', 'ведёрко', 'n', 'red'),
      item('star', 'морская звезда', 'морскую звезду', 'f', 'orange'),
      item('fish', 'рыбка', 'рыбку', 'f', 'yellow'),
      item('turtle', 'черепашка', 'черепашку', 'f', 'green'),
      item('boat', 'кораблик', 'кораблик', 'm', 'blue'),
      item('hat', 'панамка', 'панамку', 'f', 'yellow'),
      item('melon', 'арбуз', 'арбуз', 'm', 'green'),
      item('gull', 'чайка', 'чайку', 'f', 'white'),
    ],
    hideouts: [
      only('crab turtle gull shell star hat', kuku(75, 47, 9)),
      only('melon fish shell hat pail boat star', kuku(44.5, 67, 9, 'straight')),
      only('shell crab pail star boat turtle', under(28, 50, 8)),
      only('crab shell star turtle gull', under(60, 45, 8)),
      only('crab shell star turtle gull', under(54, 36, 8)),
      texture(only('turtle crab gull hat shell', under(80, 66, 9))),
      only('boat pail hat melon fish shell star', under(61, 54, 8)),
      only('crab shell hat pail boat melon star turtle', under(28.5, 69, 9)),
      only('melon fish hat pail gull', under(54.5, 76.5, 9, 'straight')),
      only('gull pail hat', behindRight(88, 37, 9)),
      texture(only('gull turtle crab hat shell', under(70.5, 33.5, 8))),
    ],
  },
  {
    id: 'forest',
    titleRu: 'Лес',
    intro: 'Мы в лесу! Кто тут прячется?',
    items: [
      item('hedgehog', 'ёжик', 'ёжика', 'm', 'brown'),
      item('mushroom', 'грибочек', 'грибочек', 'm', 'red'),
      item('cone', 'шишка', 'шишку', 'f', 'brown'),
      item('squirrel', 'белка', 'белку', 'f', 'orange'),
      item('berry', 'ягодка', 'ягодку', 'f', 'red'),
      item('hare', 'зайчик', 'зайчика', 'm', 'gray'),
      item('fox', 'лисичка', 'лисичку', 'f', 'orange'),
      item('nut', 'орешек', 'орешек', 'm', 'brown'),
      item('beetle', 'жучок', 'жучка', 'm', 'green'),
      item('snail', 'улитка', 'улитку', 'f', 'yellow'),
    ],
    hideouts: [
      kuku(71, 53, 11),
      kuku(22, 55, 10),
      texture(under(35, 46, 9)),
      texture(under(50, 47, 9)),
      texture(under(38.5, 70, 9)),
      texture(under(93, 44, 9)),
      only('squirrel fox hare hedgehog', behindRight(83, 40, 10)),
      only('nut cone mushroom berry squirrel snail beetle', under(16, 42, 9, 'straight')),
      texture(under(50, 65, 9)),
      texture(under(48, 37, 8)),
      texture(under(88, 61, 10)),
      only('hedgehog snail beetle mushroom hare fox squirrel nut cone', under(38, 56.5, 9)),
      only('snail beetle nut cone mushroom berry hedgehog', under(56.5, 56, 7)),
      only('squirrel hare fox hedgehog', under(59, 41.5, 8, 'straight')),
      only('snail beetle nut cone mushroom berry hedgehog', under(68.5, 40.5, 7)),
      only('snail beetle nut cone mushroom berry hedgehog', under(77.5, 52, 7)),
    ],
  },
  {
    id: 'playground',
    titleRu: 'Площадка',
    intro: 'Мы на площадке! Давай поищем, кто спрятался!',
    items: [
      item('pail', 'ведёрко', 'ведёрко', 'n', 'blue'),
      item('scooter', 'самокат', 'самокат', 'm', 'red'),
      item('balloon', 'шарик', 'шарик', 'm', 'red'),
      item('scoop', 'совочек', 'совочек', 'm', 'yellow'),
      item('mold', 'формочка', 'формочку', 'f', 'green'),
      item('cap', 'кепка', 'кепку', 'f', 'blue'),
      item('pigeon', 'голубь', 'голубя', 'm', 'gray'),
      item('pinwheel', 'вертушка', 'вертушку', 'f', 'multi'),
      item('truck', 'грузовичок', 'грузовичок', 'm', 'yellow'),
      item('butterfly', 'бабочка', 'бабочку', 'f', 'orange'),
    ],
    hideouts: [
      only('scoop mold pail truck', kuku(73, 69.5, 9, 'straight')),
      only('butterfly pigeon cap balloon', kuku(6, 52, 9)),
      texture(only('scoop mold pail truck', under(35, 57.5, 9, 'straight'))),
      texture(only('scoop mold pail truck', under(47, 54, 8))),
      texture(only('pail scoop mold truck cap balloon', under(9, 63, 9))),
      only('cap pigeon balloon pinwheel scoop mold pail truck butterfly', under(69, 45, 9, 'straight')),
      only('cap pigeon balloon pinwheel scoop mold pail truck butterfly', under(81.5, 51, 9, 'straight')),
      only('cap pigeon butterfly pinwheel scoop balloon', under(50, 64, 8)),
      only('cap pigeon butterfly pinwheel scoop balloon', under(59, 61, 8)),
      only('balloon scooter pigeon pinwheel butterfly', behindLeft(67.5, 38, 9)),
      only('pigeon cap butterfly balloon pinwheel', under(30, 72.5, 9, 'straight')),
      texture(only('butterfly pigeon balloon pinwheel cap', under(45, 37.5, 8))),
      only('pail scoop mold truck cap balloon', under(19, 47, 8, 'straight')),
      only('pail scoop mold truck cap pigeon', under(25.6, 62.5, 8, 'straight')),
      only('truck pail scooter balloon cap pigeon pinwheel', under(55, 42.5, 8, 'straight')),
    ],
  },
]

export function isHideSceneId(value: string): value is HideSceneId {
  return (HIDE_SCENE_IDS as readonly string[]).includes(value)
}

export function getHideScene(id: HideSceneId): HideScene {
  const scene = HIDE_SCENES.find((s) => s.id === id)
  if (!scene) throw new Error(`Unknown hide-seek scene: ${id}`)
  return scene
}
