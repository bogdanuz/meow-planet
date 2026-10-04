/**
 * «В гости» — двор: небо и осадки слоями, ветер, природа по сезону, игры во дворе, зверята, ночь.
 * Двор пересобирается при смене сезона и дня/ночи; погода переключает видимость без пересборки.
 */
import { itemUrl } from './art'
import type { Phrases } from './phrases'
import type { Sfx } from './sfx'
import type { Rect, Spot } from './scene'
import { decoSprite, hotspot, propButton, setArt } from './sprites'
import { hasRainbow, isRaining, precipKind, type Weather } from './weather'
import type { VoiceLine } from '../../shared/voice-lines'

export type YardState = {
  snowman: 0 | 1 | 2 | 3
  carrot: boolean
  melt: 'none' | 'melting' | 'puddle'
  puddles: boolean
  afterRain: boolean
  castle: boolean
  lamp: boolean
  icecream: boolean
}

export const createYardState = (): YardState => ({
  snowman: 0,
  carrot: false,
  melt: 'none',
  puddles: false,
  afterRain: false,
  castle: false,
  lamp: true,
  icecream: true,
})

export type YardHost = {
  readonly layer: HTMLElement
  readonly state: YardState
  readonly still: boolean
  readonly sfx: Sfx
  weather(): Weather
  say(key: string, lines: readonly VoiceLine[]): void
  /** Плюх в лужу: дом решает — весело в сапожках или лапки грязные. */
  puddle(): void
  /** Персонаж радуется (мороженое, качели, снеговик). */
  joy(): void
  later(ms: number, fn: () => void): void
}

type Toggle = { el: HTMLElement; show: (w: Weather) => boolean }

const SANDBOX: Rect = { x0: 80, y0: 51, x1: 100, y1: 63 }
const SNOWMAN: Spot = { x: 68, y: 81, w: 9 }
const STARS: readonly [string, Spot][] = [
  ['star-small', { x: 62, y: 15, w: 2.6 }],
  ['star-small', { x: 70.5, y: 23, w: 2.2 }],
  ['star', { x: 77, y: 12, w: 3.4 }],
  ['star-small', { x: 93, y: 13, w: 2.4 }],
  ['star-small', { x: 56.5, y: 25, w: 2 }],
]

export function buildYard(host: YardHost) {
  const { layer, state, sfx } = host
  const w0 = host.weather()
  const season = w0.season
  const night = w0.night
  const toggles: Toggle[] = []
  const add = <T extends HTMLElement>(el: T, show?: (w: Weather) => boolean, z?: number): T => {
    if (z !== undefined) el.style.zIndex = String(z)
    layer.append(el)
    if (show) toggles.push({ el, show })
    return el
  }
  const bounce = (el: HTMLElement, cls = 'is-bounce', ms = 700): void => {
    el.classList.remove(cls)
    void el.offsetWidth
    el.classList.add(cls)
    host.later(ms, () => el.classList.remove(cls))
  }

  // ── Небо ──
  if (!night) {
    const sun = add(propButton('sun', { x: 85, y: 26, w: 11 }, 'Солнышко', 'mh__sun'), (w) => w.sky === 'sun', 3)
    sun.addEventListener('click', () => {
      bounce(sun)
      sfx.play('sun')
      host.say('sun', [])
    })
    add(decoSprite('steam', { x: 63, y: 17, w: 10 }, 'mh__cloud-soft'), (w) => w.sky === 'sun', 3)
    add(decoSprite('raincloud', { x: 80, y: 24, w: 17 }, 'mh__cloud'), (w) => w.sky === 'clouds', 4)
    add(decoSprite('raincloud', { x: 62, y: 18, w: 13 }, 'mh__cloud mh__cloud--slow'), (w) => w.sky === 'clouds', 4)
    add(decoSprite('rainbow', { x: 76, y: 37, w: 36 }, 'mh__rainbow'), hasRainbow, 2)
  } else {
    const moon = add(propButton('moon', { x: 85, y: 24, w: 7.5 }, 'Луна', 'mh__moon'), undefined, 3)
    moon.addEventListener('click', () => {
      bounce(moon)
      sfx.play('twinkle')
      host.say('moon', [])
    })
    for (const [art, spot] of STARS) {
      const star = add(propButton(art, spot, 'Звёздочка', 'mh__star'), (w) => w.sky === 'sun', 3)
      star.style.animationDelay = `${Math.round(Math.random() * 1600)}ms`
      star.addEventListener('click', () => {
        bounce(star, 'is-twinkle', 900)
        sfx.play('twinkle')
        host.say('star', [])
      })
    }
    add(decoSprite('raincloud', { x: 74, y: 22, w: 17 }, 'mh__cloud mh__cloud--night'), (w) => w.sky === 'clouds', 4)
  }

  // ── Осадки: капли или снежинки, ветер наклоняет ──
  const precip = document.createElement('div')
  precip.className = 'mh__precip'
  precip.dataset.kind = precipKind(season)
  precip.setAttribute('aria-hidden', 'true')
  const count = host.still ? 10 : 26
  for (let i = 0; i < count; i += 1) {
    const p = document.createElement('img')
    p.alt = ''
    p.draggable = false
    p.src = itemUrl(precipKind(season) === 'snow' ? 'snowflake' : 'drop')
    p.style.left = `${Math.round(Math.random() * 104) - 2}%`
    p.style.animationDelay = `${-Math.round(Math.random() * 4000)}ms`
    p.style.setProperty('--size', `${(precipKind(season) === 'snow' ? 2 : 0.9) + Math.random() * 0.9}%`)
    precip.append(p)
  }
  add(precip, (w) => w.precip, 60)

  // ── Ветер ──
  if (season === 'autumn' && !night) {
    const gust = document.createElement('div')
    gust.className = 'mh__gust'
    gust.setAttribute('aria-hidden', 'true')
    for (const [i, art] of ['leaf-yellow', 'leaf-orange', 'leaf-red', 'leaf-yellow', 'leaf-red'].entries()) {
      const leaf = document.createElement('img')
      leaf.alt = ''
      leaf.src = itemUrl(art)
      leaf.style.top = `${30 + i * 11}%`
      leaf.style.animationDelay = `${i * 700}ms`
      gust.append(leaf)
    }
    add(gust, (w) => w.wind, 61)
  }
  add(decoSprite('wind', { x: 60, y: 46, w: 11 }, 'mh__wind-mark'), (w) => w.wind, 5)
  add(decoSprite('laundry', { x: 63, y: 34.2, w: 15, a: 't' }, 'mh__laundry'), undefined, 6)
  if (season !== 'winter') {
    const pin = add(propButton('pinwheel', { x: 16.5, y: 61, w: 4.6 }, 'Вертушка', 'mh__pinwheel'), undefined, 20)
    pin.addEventListener('click', () => {
      bounce(pin, 'is-spin', 1200)
      sfx.play('swish')
    })
    if (!night) {
      const kite = add(propButton('kite', { x: 67, y: 30, w: 7 }, 'Воздушный змей', 'mh__kite'), (w) => w.wind && !isRaining(w), 7)
      kite.addEventListener('click', () => {
        bounce(kite)
        sfx.play('swish')
        host.say('kite', [])
      })
    }
  }

  // ── Цветы на лужайке: открыты на солнце, закрыты в тучи и ночью ──
  if (season !== 'winter') {
    const flowerSpots: Spot[] = [
      { x: 33, y: 72, w: 3.6 },
      { x: 37.5, y: 75, w: 4 },
      { x: 29.5, y: 77.5, w: 3.6 },
    ]
    for (const spot of flowerSpots) {
      const f = add(propButton('flower-bud', spot, 'Цветочек', 'mh__flower'), undefined, Math.round(spot.y))
      toggles.push({
        el: f,
        show: (w) => {
          setArt(f, w.sky === 'sun' && !w.night ? 'flower-open' : 'flower-bud')
          return true
        },
      })
      f.addEventListener('click', () => {
        bounce(f)
        sfx.play('pop')
        host.say('flower', [])
      })
    }
  }

  // ── Лужи после дождя (не зимой), кораблик, лягушка ──
  if (season !== 'winter') {
    const puddles: [Spot, number][] = [
      [{ x: 62, y: 92, w: 16 }, 0],
      [{ x: 81, y: 96, w: 12 }, 1],
    ]
    for (const [spot] of puddles) {
      const p = add(propButton('puddle', spot, 'Лужа', 'mh__puddle'), () => state.puddles, 30)
      p.addEventListener('click', () => {
        bounce(p, 'is-splash', 600)
        sfx.play('splash')
        host.puddle()
      })
    }
    if (season === 'spring' || season === 'summer') {
      const boat = add(propButton('boat', { x: 61, y: 89, w: 5.6 }, 'Кораблик', 'mh__boat'), () => state.puddles, 31)
      boat.addEventListener('click', () => {
        bounce(boat, 'is-sail', 1600)
        sfx.play('swish')
        host.say('boat', [])
      })
    }
    if (season === 'summer') {
      const frog = add(propButton('frog', { x: 72, y: 89, w: 5.4 }, 'Лягушка', 'mh__frog'), () => state.afterRain || state.puddles, 32)
      frog.addEventListener('click', () => {
        bounce(frog, 'is-hop', 800)
        sfx.play('croak')
        host.say('frog', [])
      })
    }
  }

  // ── После дождя: грибы, улитка ──
  if (season === 'summer' || season === 'autumn') {
    for (const [art, spot] of [
      ['mushroom-red', { x: 51, y: 55.5, w: 3.2 }],
      ['mushroom-brown', { x: 54.5, y: 56.5, w: 3 }],
    ] as const) {
      const m = add(propButton(art, spot, 'Грибочек', 'mh__mushroom'), () => state.afterRain, 12)
      m.addEventListener('click', () => {
        bounce(m)
        sfx.play('pop')
        host.say('mushroom', [])
      })
    }
  }
  if (season === 'spring' || season === 'summer') {
    const snail = add(propButton('snail', { x: 16, y: 95, w: 5 }, 'Улитка', 'mh__snail'), () => state.afterRain, 40)
    snail.addEventListener('click', () => {
      bounce(snail, 'is-crawl', 1600)
      sfx.play('pop')
      host.say('snail', [])
    })
  }

  // ── Зима: снеговик в три тапа + морковка, санки, сосульки, снегирь ──
  if (season === 'winter') {
    const snowArt = (): string => `snow-${Math.max(1, state.snowman)}`
    const snowman = add(propButton(snowArt(), SNOWMAN, 'Снеговик', 'mh__snowman'), undefined, 40)
    snowman.dataset.stage = String(state.snowman)
    const nose = add(decoSprite('carrot', { x: 69.4, y: 66.6, w: 2.6, a: 'c' }, 'mh__nose'), undefined, 41)
    const carrot = add(propButton('carrot', { x: 76, y: 85, w: 5 }, 'Морковка', 'mh__carrot'), undefined, 42)
    const syncSnow = (): void => {
      snowman.dataset.stage = String(state.snowman)
      snowman.classList.toggle('is-empty', state.snowman === 0)
      setArt(snowman, snowArt())
      nose.hidden = !state.carrot
      carrot.hidden = state.snowman < 3 || state.carrot
    }
    syncSnow()
    snowman.addEventListener('click', () => {
      if (state.snowman < 3) {
        state.snowman = (state.snowman + 1) as YardState['snowman']
        syncSnow()
        bounce(snowman)
        sfx.play('snow')
        host.say(`snowman-${state.snowman}`, [])
      } else {
        bounce(snowman)
        sfx.play('giggle')
        if (state.carrot) host.joy()
      }
    })
    carrot.addEventListener('click', () => {
      state.carrot = true
      syncSnow()
      bounce(snowman)
      sfx.play('sun')
      host.say('snowman-4', [])
      host.joy()
    })
    const sled = add(propButton('sled', { x: 85, y: 86, w: 13 }, 'Санки', 'mh__sled'), undefined, 45)
    sled.addEventListener('click', () => {
      bounce(sled, 'is-ride', 1600)
      sfx.play('swish')
      host.say('sled', [])
      host.joy()
    })
    for (const spot of [{ x: 2.6, y: 27, w: 1.8, a: 't' }, { x: 30, y: 27, w: 1.8, a: 't' }] as Spot[]) {
      add(decoSprite('icicle', spot, 'mh__icicle'), undefined, 8)
    }
    if (!night) {
      const bird = add(propButton('bullfinch', { x: 36, y: 26, w: 4.6 }, 'Снегирь', 'mh__bird'), undefined, 9)
      bird.addEventListener('click', () => {
        bounce(bird, 'is-fly', 1800)
        sfx.play('chirp')
        host.say('bullfinch', [])
      })
    }
  }

  // ── Тающий снеговик весной/летом/осенью после зимы ──
  if (season !== 'winter' && state.melt !== 'none') {
    const melt = add(
      propButton(state.melt === 'melting' ? 'snowman-melt' : 'puddle-carrot', { x: 68, y: 82, w: 10 }, 'Снеговик тает', 'mh__melt'),
      undefined,
      40,
    )
    melt.addEventListener('click', () => {
      if (state.melt === 'melting') {
        state.melt = 'puddle'
        setArt(melt, 'puddle-carrot')
        sfx.play('splash')
        host.say('melt', [])
      } else {
        bounce(melt, 'is-splash', 600)
        sfx.play('splash')
      }
    })
  }

  // ── Весна и лето: птичка, бабочки ──
  if (season === 'spring' && !night) {
    const bird = add(propButton('bird', { x: 47, y: 23, w: 5 }, 'Птичка', 'mh__bird'), undefined, 9)
    bird.addEventListener('click', () => {
      setArt(bird, 'bird-fly')
      bounce(bird, 'is-fly', 1800)
      sfx.play('chirp')
      host.say('bird', [])
      host.later(1800, () => setArt(bird, 'bird'))
    })
  }
  if ((season === 'spring' || season === 'summer') && !night) {
    const fly = add(
      propButton(season === 'spring' ? 'butterfly' : 'butterfly-2', { x: 24, y: 64, w: 4.6 }, 'Бабочка', 'mh__butterfly'),
      (w) => w.sky === 'sun' && !w.precip,
      22,
    )
    fly.addEventListener('click', () => {
      bounce(fly, 'is-fly', 1800)
      sfx.play('swish')
      host.say('butterfly', [])
    })
  }

  // ── Лето: песочница, лейка, мороженое ──
  if (season === 'summer') {
    const castle = add(decoSprite('sandcastle', { x: 89, y: 61, w: 9 }, 'mh__castle'), () => state.castle, 15)
    add(decoSprite('bucket', { x: 83.5, y: 71, w: 5.4 }), undefined, 16)
    const sand = add(hotspot(SANDBOX, 'Песочница', 'sandbox'), undefined, 14)
    sand.addEventListener('click', () => {
      state.castle = true
      castle.hidden = false
      bounce(castle)
      sfx.play('block')
      host.say('castle', [])
      host.joy()
    })
    const can = add(propButton('watering-can', { x: 8, y: 87, w: 8 }, 'Лейка', 'mh__can'), undefined, 35)
    can.addEventListener('click', () => {
      bounce(can, 'is-pour', 1200)
      sfx.play('rain')
      for (const f of layer.querySelectorAll<HTMLElement>('.mh__flower')) bounce(f, 'is-drink', 1200)
      host.say('watering', [])
    })
    if (!night) {
      const ice = add(propButton('icecream', { x: 30, y: 93, w: 4.6 }, 'Мороженое', 'mh__icecream'), () => state.icecream, 50)
      ice.addEventListener('click', () => {
        if (!state.icecream) return
        state.icecream = false
        ice.hidden = true
        sfx.play('chew')
        host.say('icecream', [])
        host.joy()
        host.later(25_000, () => {
          state.icecream = true
          ice.hidden = false
        })
      })
    }
  }

  // ── Осень: куча листьев, белка ──
  if (season === 'autumn') {
    const pile = add(propButton('leaf-pile', { x: 82, y: 81, w: 15 }, 'Куча листьев', 'mh__pile'), undefined, 38)
    pile.addEventListener('click', () => {
      bounce(pile, 'is-burst', 1200)
      sfx.play('swish')
      host.say('leaves', [])
      host.joy()
    })
    if (!night) {
      const squirrel = add(propButton('squirrel', { x: 39, y: 47, w: 5 }, 'Белочка', 'mh__squirrel'), undefined, 11)
      squirrel.addEventListener('click', () => {
        bounce(squirrel, 'is-hop', 900)
        sfx.play('chirp')
        host.say('squirrel', [])
      })
    }
  }

  // ── Качели (все сезоны) ──
  const swing = add(propButton('swing', { x: 84.6, y: 31.2, h: 17, a: 't' }, 'Качели', 'mh__swing'), undefined, 13)
  swing.addEventListener('click', () => {
    bounce(swing, 'is-swing', 2400)
    sfx.play('boing')
    host.say('swing', [])
    host.joy()
  })

  // ── Фонарь: ночью горит, тап выключает и включает ──
  const lamp = add(propButton(night && state.lamp ? 'lamp-on' : 'lamp-off', { x: 19.5, y: 58, h: 19 }, 'Фонарь', 'mh__lamp'), undefined, 18)
  lamp.addEventListener('click', () => {
    sfx.play('click')
    if (!night) return
    state.lamp = !state.lamp
    setArt(lamp, state.lamp ? 'lamp-on' : 'lamp-off')
    layer.classList.toggle('is-lamp', state.lamp)
    if (state.lamp) host.say('street-lamp', [])
  })
  layer.classList.toggle('is-lamp', night && state.lamp)

  // ── Летней ночью — светлячки ──
  if (night && season === 'summer') {
    for (let i = 0; i < 5; i += 1) {
      const ff = add(
        propButton('firefly', { x: 22 + i * 13, y: 58 + (i % 2) * 12, w: 3 }, 'Светлячок', 'mh__firefly'),
        (w) => !w.precip,
        25,
      )
      ff.style.animationDelay = `${i * 600}ms`
      ff.addEventListener('click', () => {
        bounce(ff, 'is-twinkle', 900)
        sfx.play('twinkle')
        host.say('firefly', [])
      })
    }
  }

  const refresh = (): void => {
    const w = host.weather()
    layer.dataset.wind = w.wind ? '1' : '0'
    layer.dataset.sky = w.sky
    for (const t of toggles) t.el.hidden = !t.show(w)
  }
  refresh()
  return { refresh }
}

/** Ключи фраз двора → строки фраз. */
export function yardLines(P: Phrases): Record<string, readonly VoiceLine[]> {
  return {
    sun: P.sun,
    moon: P.moon,
    star: P.star,
    kite: P.kite,
    flower: P.flower,
    boat: P.boat,
    frog: P.frog,
    mushroom: P.mushroom,
    snail: P.snail,
    'snowman-1': [P.snowman[0]!],
    'snowman-2': [P.snowman[1]!],
    'snowman-3': [P.snowman[2]!],
    'snowman-4': [P.snowman[3]!],
    sled: P.sled,
    bullfinch: P.bullfinch,
    melt: P.melt,
    bird: P.bird,
    butterfly: P.butterfly,
    castle: P.castle,
    watering: P.watering,
    icecream: P.icecream,
    leaves: P.leaves,
    squirrel: P.squirrel,
    swing: P.swing,
    'street-lamp': P.streetLamp,
    firefly: P.firefly,
  }
}
