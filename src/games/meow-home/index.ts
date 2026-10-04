/**
 * «В гости» (S16, бриф `docs/games/S16-meow-home-BRIEF.md`): уход без наказаний.
 * Прихожая с дверями в ванную, кухню, спальню и во двор. Желания — анимация, облачко мыслей
 * с картинкой и светящаяся дверь. Во дворе — сезон, погода слоями и одежда «причина → следствие».
 */
import type { GameModule } from '../../shared/game-module'
import { createAudioManager } from '../../shared/audio'
import { playCelebrationTune, playDropSound, playPickupSound } from '../../shared/hub-sounds'
import { createGameChromeButton, createGameSettingsButton, createGameToolButton } from '../../shared/game-chrome'
import { uiIconUrl } from '../../shared/ui-icon'
import { createLinePicker, type VoiceLine } from '../../shared/voice-lines'
import { itemUrl, roomBgUrl, seasonThumbUrl, wearIconUrl, yardBgUrl, type FaceMood, type FrameAction, type Who } from './art'
import { createDoll, createFramePlayer, createHero } from './hero'
import { phrasesFor, SEASON_LABEL, WEAR_LABEL } from './phrases'
import {
  BACK_DOOR,
  BATH_SPOT,
  BED_SPOT,
  DOLL_SPOT,
  FRIDGE,
  FRIDGE_FOOD,
  HALL_DOORS,
  HERO_SPOT,
  NIGHTLIGHT,
  RACK,
  ROOM_PROPS,
  SINK,
  TUB,
  WINDOW,
  WISH_ICON,
  WISH_PROPS,
  type HomeRoom,
  type Spot,
} from './scene'
import { createSfx } from './sfx'
import { hotspot, placeSpot, propButton } from './sprites'
import {
  feelsLike,
  isNightHour,
  isRaining,
  LAYER_ORDER,
  outfitReaction,
  putOn,
  SEASONS,
  seasonForDate,
  takeOff,
  WEAR_ITEMS,
  type Reaction,
  type Season,
  type WearItem,
  type Weather,
} from './weather'
import { createWishes, WISH_ROOM, type CareAction, type Room, type Wish } from './wishes'
import { buildYard, createYardState, yardLines } from './yard'
import './meow-home.css'

const DRAG_START_PX = 12
const STROKE_PX = 44
const TICK_MS = 1000
const FADE_MS = 220
/** Столько на улице без нужной одежды — и дома последствие (замёрз, промок). */
const YARD_EFFECT_MS = 5000
/** Долгая прогулка — дома хочется есть. */
const LONG_WALK_MS = 120_000
const SLEEP_AUTO_WAKE_MS = 25_000

const COLD_MOODS = new Set(['cold', 'cold-feet', 'windy'])

export const meowHomeGame: GameModule = {
  meta: {
    id: 'meow-home',
    title: 'В гости',
    zoneId: 'meow-orbit',
    modules: ['2.13', '2.16', '2.10'],
  },

  mount(container, context) {
    unmountInternal()
    const settings = context.settings
    const who: Who = settings.companion === 'olli' ? 'olli' : 'meow'
    const P = phrasesFor(who)
    const Y = yardLines(P)
    const audio = createAudioManager({
      soundEnabled: settings.soundEnabled,
      musicEnabled: settings.musicEnabled,
      quietMode: settings.quietMode,
    })
    void audio.unlock()
    const sfx = createSfx(audio)
    const still =
      settings.quietMode || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
    const pick = createLinePicker()
    const pottyOn = settings.meowHomePotty ?? true
    const realTime = settings.meowHomeRealTime ?? true
    const byDate = settings.meowHomeSeasonByDate ?? true

    const timers = new Set<ReturnType<typeof setTimeout>>()
    let alive = true
    const later = (ms: number, fn: () => void): void => {
      const t = setTimeout(() => {
        timers.delete(t)
        if (alive) fn()
      }, ms)
      timers.add(t)
    }

    // ── Состояние ──
    let night = realTime ? isNightHour(new Date().getHours()) : false
    let weather: Weather = {
      season: byDate ? seasonForDate(new Date()) : 'summer',
      sky: 'sun',
      precip: false,
      wind: false,
      night,
    }
    let room: Room = 'hall'
    let outfit: WearItem[] = []
    const st = {
      pj: night,
      messy: false,
      dirtyPaws: false,
      wet: false,
      cold: false,
      sleeping: false,
      bathing: false,
      fridgeOpen: false,
      nightlight: false,
    }
    const yardState = createYardState()
    let yard: ReturnType<typeof buildYard> | null = null
    let yardSince = 0
    let coldMs = 0
    let wetMs = 0
    let reactionKey = ''
    let joyUntil = 0
    let shownWish: Wish | null = null
    const wishes = createWishes({
      potty: pottyOn,
      enabled: settings.meowHomeWishes ?? true,
      rng: Math.random,
      now: Date.now(),
      night,
    })

    // ── Корень и сцена 4:3 (cover, низ всегда виден) ──
    const rootEl = document.createElement('section')
    rootEl.className = 'meow-home'
    rootEl.dataset.gameId = 'meow-home'
    rootEl.dataset.who = who
    if (still) rootEl.classList.add('meow-home--still')

    const scene = document.createElement('div')
    scene.className = 'mh__scene'
    const bg = document.createElement('img')
    bg.className = 'mh__bg'
    bg.alt = ''
    bg.decoding = 'async'
    bg.setAttribute('aria-hidden', 'true')
    const layer = document.createElement('div')
    layer.className = 'mh__layer'
    const dim = document.createElement('div')
    dim.className = 'mh__dim'
    dim.setAttribute('aria-hidden', 'true')

    const hero = createHero(who, still)
    const heroHit = document.createElement('button')
    heroHit.type = 'button'
    heroHit.className = 'mh__hit'
    heroHit.setAttribute('aria-label', who === 'olli' ? 'Олли' : 'Мяу')
    hero.el.append(heroHit)

    const doll = createDoll(who)
    const dollHit = document.createElement('button')
    dollHit.type = 'button'
    dollHit.className = 'mh__hit mh__hit--doll'
    dollHit.setAttribute('aria-label', who === 'olli' ? 'Олли' : 'Мяу')
    doll.el.append(dollHit)

    const bathFrames = createFramePlayer(who, still)
    bathFrames.el.classList.add('mh__bathing')
    placeSpot(bathFrames.el, BATH_SPOT, 2 / 3)

    const sayEl = document.createElement('div')
    sayEl.className = 'mh__say'
    sayEl.hidden = true
    sayEl.setAttribute('role', 'status')
    const sayText = document.createElement('p')
    sayText.className = 'mh__say-text'
    sayEl.append(sayText)

    const thinkEl = document.createElement('button')
    thinkEl.type = 'button'
    thinkEl.className = 'mh__think'
    thinkEl.hidden = true
    const thinkBg = document.createElement('img')
    thinkBg.className = 'mh__think-bg'
    thinkBg.alt = ''
    thinkBg.src = itemUrl('thought')
    const thinkIcon = document.createElement('img')
    thinkIcon.className = 'mh__think-icon'
    thinkIcon.alt = ''
    thinkEl.append(thinkBg, thinkIcon)

    scene.append(bg, layer, dim, thinkEl, sayEl)

    // ── Шапка: назад + звук слева; справа «Сезон» (во дворе) и шестерёнка ──
    const bar = document.createElement('header')
    bar.className = 'mh__bar'
    const barNav = document.createElement('div')
    barNav.className = 'mh__bar-nav'
    const backBtn = createGameChromeButton('Назад в меню', 'back', () => context.hubNavigation?.goMenu())
    const soundBtn = createGameChromeButton('Звук', 'sound-on', () => toggleSound())
    let soundOn = settings.soundEnabled || settings.musicEnabled
    const syncSound = (): void => {
      soundBtn.dataset.on = soundOn ? '1' : '0'
      soundBtn.setAttribute('aria-label', soundOn ? 'Звук включён' : 'Звук выключен')
      const icon = soundBtn.querySelector<HTMLImageElement>('img.ui-icon')
      if (icon) icon.src = uiIconUrl(soundOn ? 'sound-on' : 'sound-off')
    }
    syncSound()
    function toggleSound(): void {
      soundOn = !soundOn
      syncSound()
      audio.updateSettings({ soundEnabled: soundOn, musicEnabled: soundOn, quietMode: settings.quietMode })
      context.hubNavigation?.onSoundToggle?.(soundOn)
    }
    barNav.append(backBtn, soundBtn)

    const barTools = document.createElement('div')
    barTools.className = 'mh__bar-tools'
    const seasonBtn = createGameToolButton('Сезон', 'themes', () => toggleSeasonPop())
    seasonBtn.dataset.role = 'season'
    seasonBtn.classList.add('mh__season-btn')
    const seasonIcon = seasonBtn.querySelector<HTMLImageElement>('.game-tool__icon')!
    const goSettings = context.hubNavigation?.goSettings
    const settingsBtn = createGameSettingsButton(goSettings ? () => goSettings() : undefined)
    barTools.append(seasonBtn, settingsBtn)
    bar.append(barNav, barTools)

    const seasonPop = document.createElement('div')
    seasonPop.className = 'mh__season-pop'
    seasonPop.setAttribute('aria-label', 'Время года')
    seasonPop.hidden = true
    for (const season of SEASONS) {
      const choice = document.createElement('button')
      choice.type = 'button'
      choice.className = 'mh__season-choice'
      choice.dataset.season = season
      choice.setAttribute('aria-label', SEASON_LABEL[season])
      const img = document.createElement('img')
      img.alt = ''
      img.draggable = false
      img.src = seasonThumbUrl(season)
      const cap = document.createElement('span')
      cap.textContent = SEASON_LABEL[season]
      choice.append(img, cap)
      choice.addEventListener('click', () => setSeason(season))
      seasonPop.append(choice)
    }

    // ── Корзинка с одеждой во дворе ──
    const basketPop = document.createElement('div')
    basketPop.className = 'mh__basket-pop'
    basketPop.setAttribute('aria-label', 'Одежда')
    basketPop.hidden = true
    const basketItems = new Map<WearItem, HTMLButtonElement>()
    for (const item of WEAR_ITEMS) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'mh__wear'
      btn.dataset.wear = item
      btn.setAttribute('aria-label', WEAR_LABEL[item])
      const img = document.createElement('img')
      img.alt = ''
      img.draggable = false
      img.src = wearIconUrl(who, item)
      btn.append(img)
      bindUse(btn, () => toggleWear(item))
      basketItems.set(item, btn)
      basketPop.append(btn)
    }

    // ── Кнопки погоды во дворе: небо, осадки, ветер ──
    const weatherBox = document.createElement('div')
    weatherBox.className = 'mh__weather'
    weatherBox.setAttribute('aria-label', 'Погода')
    const weatherBtn = (role: string, label: string, onClick: () => void): HTMLButtonElement => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'mh__weather-btn'
      btn.dataset.role = role
      btn.setAttribute('aria-label', label)
      const img = document.createElement('img')
      img.alt = ''
      img.draggable = false
      btn.append(img)
      btn.addEventListener('click', onClick)
      weatherBox.append(btn)
      return btn
    }
    const skyBtn = weatherBtn('sky', 'Солнце или тучи', () => setWeather({ sky: weather.sky === 'sun' ? 'clouds' : 'sun' }))
    const precipBtn = weatherBtn('precip', 'Осадки', () => setWeather({ precip: !weather.precip }))
    const windBtn = weatherBtn('wind', 'Ветер', () => setWeather({ wind: !weather.wind }))

    rootEl.append(scene, bar, seasonPop, basketPop, weatherBox)
    container.append(rootEl)

    // ── Речь и мысли ──
    let sayTimer: ReturnType<typeof setTimeout> | undefined
    function say(line: VoiceLine): void {
      sayText.textContent = line.text
      sayEl.hidden = false
      sayEl.dataset.line = line.file
      placeBubbles()
      clearTimeout(sayTimer)
      sayTimer = setTimeout(() => {
        sayEl.hidden = true
      }, Math.max(2600, line.text.length * 80))
    }
    const sayFrom = (key: string, lines: readonly VoiceLine[]): void => {
      const pool = lines.length ? lines : Y[key]
      if (pool?.length) say(pick(key, pool))
    }

    function speakerSpot(): { x: number; head: number } {
      if (st.sleeping) return { x: BED_SPOT.x - 6, head: BED_SPOT.y - (BED_SPOT.w ?? 36) * 2 * 0.6 }
      if (st.bathing) return { x: BATH_SPOT.x, head: BATH_SPOT.y - (BATH_SPOT.w ?? 38) * 2 * 0.62 }
      if (dollShown()) {
        const s = room === 'yard' ? DOLL_SPOT.yard : DOLL_SPOT.hall
        return { x: s.x, head: s.y - (s.w ?? 40) * (4 / 3) * 0.86 }
      }
      const s = HERO_SPOT[room as HomeRoom]
      return { x: s.x, head: s.y - (s.w ?? 29) * 2 * 0.78 }
    }
    function placeBubbles(): void {
      const s = speakerSpot()
      sayEl.style.left = `${Math.min(88, Math.max(34, s.x))}%`
      sayEl.style.top = `${s.head}%`
      thinkEl.style.left = `${s.x + 7}%`
      thinkEl.style.top = `${s.head + 5}%`
    }

    // ── Персонаж ──
    const dollShown = (): boolean => room === 'yard' || (room === 'hall' && outfit.length > 0)

    function baseAction(): FrameAction {
      const wish = wishes.current()
      if (st.pj) return wish === 'sleepy' ? 'pj-yawn' : 'pj-idle'
      if (st.messy) return 'messy'
      if (st.dirtyPaws) return 'dirty-paws'
      if (st.cold || st.wet) return 'shiver'
      switch (wish) {
        case 'hungry':
          return 'hungry'
        case 'sleepy':
          return 'yawn'
        case 'potty':
          return 'potty-dance'
        case 'play':
          return 'want-play'
        case 'cold':
          return 'shiver'
        case 'dirty':
          return 'dirty-paws'
        case 'messy':
          return 'messy'
        default:
          return 'idle'
      }
    }
    const refreshHero = (): void => hero.setBase(baseAction())

    function currentReaction(): Reaction {
      if (room === 'yard') return outfitReaction(weather, outfit)
      const warm = outfit.find((i) => ['coat', 'hat', 'valenki', 'scarf', 'mittens'].includes(i))
      return warm ? { mood: 'hot', want: null, remove: warm } : { mood: 'ok', want: null }
    }
    function dollFace(r: Reaction): FaceMood | null {
      if (Date.now() < joyUntil) return 'joy'
      if (r.mood === 'wet') return 'wet'
      if (COLD_MOODS.has(r.mood)) return 'cold'
      if (r.mood === 'hot') return 'hot'
      return null
    }
    function renderDoll(): void {
      const r = currentReaction()
      doll.render(outfit, dollFace(r))
      for (const [item, btn] of basketItems) {
        btn.dataset.worn = outfit.includes(item) ? '1' : '0'
        btn.classList.toggle('is-glow', r.want === item || r.remove === item)
      }
    }
    function joy(): void {
      joyUntil = Date.now() + 1500
      if (dollShown()) {
        renderDoll()
        bounce(doll.el, 'is-hop', 700)
        later(1600, renderDoll)
      } else if (!hero.busy() && !st.sleeping) {
        hero.play('joy', 1200)
      }
    }
    function bounce(el: HTMLElement, cls: string, ms: number): void {
      el.classList.remove(cls)
      void el.offsetWidth
      el.classList.add(cls)
      later(ms, () => el.classList.remove(cls))
    }
    function sparkle(): void {
      const s = speakerSpot()
      for (const [i, art] of ['heart', 'sparkle', 'sparkle'].entries()) {
        const fx = document.createElement('img')
        fx.className = 'mh__fx'
        fx.alt = ''
        fx.src = itemUrl(art)
        fx.style.left = `${s.x - 6 + i * 6}%`
        fx.style.top = `${s.head + 4}%`
        fx.style.animationDelay = `${i * 120}ms`
        layer.append(fx)
        later(1400, () => fx.remove())
      }
    }

    // ── Желания ──
    function refreshWish(): void {
      shownWish = wishes.current()
      refreshHero()
      const r = room === 'yard' ? outfitReaction(weather, outfit) : null
      const wantIcon = r?.want ? wearIconUrl(who, r.want) : r?.remove ? wearIconUrl(who, r.remove) : null
      const wishIcon = shownWish && !st.sleeping ? itemUrl(WISH_ICON[shownWish]) : null
      const icon = wantIcon ?? wishIcon
      thinkEl.hidden = !icon
      thinkEl.dataset.wish = wantIcon ? `wear-${r?.want ?? r?.remove}` : (shownWish ?? '')
      thinkEl.classList.toggle('is-remove', Boolean(!r?.want && r?.remove))
      thinkEl.setAttribute('aria-label', wantIcon ? 'Что надеть' : 'Чего хочет')
      if (icon) thinkIcon.src = icon
      placeBubbles()
      for (const el of layer.querySelectorAll<HTMLElement>('.is-glow')) el.classList.remove('is-glow')
      if (room === 'yard') {
        layer.querySelector('[data-role="basket"]')?.classList.toggle('is-glow', Boolean(r?.want))
        if (shownWish && !r?.want) layer.querySelector('[data-role="back"]')?.classList.add('is-glow')
        return
      }
      if (!shownWish) return
      const target = WISH_ROOM[shownWish]
      if (room === 'hall') {
        layer.querySelector(`[data-role="door-${target}"]`)?.classList.add('is-glow')
      } else if (room !== target) {
        layer.querySelector('[data-role="back"]')?.classList.add('is-glow')
      } else {
        for (const id of WISH_PROPS[shownWish]) layer.querySelector(`[data-prop="${id}"]`)?.classList.add('is-glow')
      }
    }
    function showWish(wish: Wish): void {
      sfx.play('wish')
      sayFrom(`wish-${wish}`, P.wish[wish])
      refreshWish()
      refreshHero()
    }
    thinkEl.addEventListener('click', () => {
      const r = room === 'yard' ? outfitReaction(weather, outfit) : null
      if (r && (r.want || r.remove)) {
        say(lineForReaction(r))
        return
      }
      if (shownWish) sayFrom(`wish-${shownWish}`, P.wish[shownWish])
    })

    // ── Перетаскивание предмета на персонажа или тап ──
    function overCharacter(x: number, y: number): boolean {
      const target = dollShown() ? dollHit : st.sleeping ? null : heroHit
      if (!target) return false
      const r = target.getBoundingClientRect()
      const pad = 24
      return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad
    }
    function bindUse(btn: HTMLElement, use: () => void): void {
      let press: { id: number; x: number; y: number } | null = null
      let ghost: HTMLElement | null = null
      let dragged = false
      const drop = (): void => {
        ghost?.remove()
        ghost = null
        btn.classList.remove('is-lifted')
        press = null
      }
      btn.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return
        press = { id: e.pointerId, x: e.clientX, y: e.clientY }
        try {
          btn.setPointerCapture(e.pointerId)
        } catch {
          /* старый браузер — без захвата, тап всё равно сработает */
        }
      })
      btn.addEventListener('pointermove', (e) => {
        if (!press || e.pointerId !== press.id) return
        if (!ghost && Math.hypot(e.clientX - press.x, e.clientY - press.y) > DRAG_START_PX) {
          const img = btn.querySelector('img')
          if (!img) return
          const r = img.getBoundingClientRect()
          ghost = img.cloneNode() as HTMLElement
          ghost.className = 'mh__ghost'
          ghost.style.width = `${Math.max(56, r.width * 1.15)}px`
          rootEl.append(ghost)
          btn.classList.add('is-lifted')
          playPickupSound(audio)
        }
        if (ghost) {
          ghost.style.left = `${e.clientX}px`
          ghost.style.top = `${e.clientY}px`
        }
      })
      btn.addEventListener('pointerup', (e) => {
        if (!press || e.pointerId !== press.id) return
        if (ghost) {
          dragged = true
          const hit = overCharacter(e.clientX, e.clientY)
          drop()
          if (hit) {
            playDropSound(audio)
            use()
          }
          return
        }
        press = null
      })
      btn.addEventListener('pointercancel', drop)
      btn.addEventListener('click', () => {
        if (dragged) {
          dragged = false
          return
        }
        use()
      })
    }

    // ── Тап и поглаживание персонажа ──
    function bindCharacter(hit: HTMLElement, onTap: () => void, onStroke: () => void): void {
      let start: { id: number; x: number; y: number; path: number; lx: number; ly: number } | null = null
      let stroked = false
      hit.addEventListener('pointerdown', (e) => {
        start = { id: e.pointerId, x: e.clientX, y: e.clientY, path: 0, lx: e.clientX, ly: e.clientY }
      })
      hit.addEventListener('pointermove', (e) => {
        if (!start || start.id !== e.pointerId) return
        start.path += Math.hypot(e.clientX - start.lx, e.clientY - start.ly)
        start.lx = e.clientX
        start.ly = e.clientY
      })
      hit.addEventListener('pointerup', (e) => {
        if (start && start.id === e.pointerId && start.path > STROKE_PX) {
          stroked = true
          onStroke()
        }
        start = null
      })
      hit.addEventListener('click', () => {
        if (stroked) {
          stroked = false
          return
        }
        onTap()
      })
    }
    bindCharacter(
      heroHit,
      () => {
        if (hero.busy() || st.sleeping) return
        sfx.play('giggle')
        hero.play('giggle', 1500)
        sayFrom('giggle', P.giggle)
      },
      () => {
        if (hero.busy() || st.sleeping) return
        sfx.play('purr')
        hero.play('purr', 2200)
        sayFrom('purr', P.purr)
      },
    )
    bindCharacter(
      dollHit,
      () => {
        if (room === 'hall') {
          undressTop()
          return
        }
        const r = outfitReaction(weather, outfit)
        if (r.remove) {
          toggleWear(r.remove)
          return
        }
        sfx.play('giggle')
        sayFrom('giggle', P.giggle)
        joy()
      },
      () => {
        sfx.play('purr')
        sayFrom('purr', P.purr)
        joy()
      },
    )

    // ── Одежда ──
    function toggleWear(item: WearItem): void {
      sfx.play('cloth')
      outfit = outfit.includes(item) ? takeOff(outfit, item) : putOn(outfit, item)
      afterOutfit()
    }
    function undressTop(): void {
      const top = outfit.includes('umbrella') ? 'umbrella' : [...LAYER_ORDER].reverse().find((i) => outfit.includes(i))
      if (!top) return
      sfx.play('cloth')
      outfit = takeOff(outfit, top)
      afterOutfit()
    }
    function afterOutfit(): void {
      if (room === 'hall') {
        const wasDoll = layer.contains(doll.el)
        renderRoom()
        if (wasDoll && outfit.length === 0) sayFrom('undressed', P.undressed)
        else if (!wasDoll && outfit.length > 0) sayFrom('dress', P.dressNow)
        return
      }
      renderDoll()
      react(false)
    }

    function lineForReaction(r: Reaction): VoiceLine {
      const one = (lines: readonly VoiceLine[]): VoiceLine => pick(lines[0]!.file, lines)
      if (r.mood === 'wet') return one(P.wet)
      if (r.mood === 'cold-feet') return one(P.coldFeet)
      if (r.mood === 'windy') return one(P.wantScarf)
      if (r.mood === 'hot') return r.remove ? P.hot(r.remove) : one(P.wantPanama)
      if (r.want === 'hat') return one(P.wantHat)
      if (r.want === 'valenki') return one(P.wantValenki)
      if (r.want === 'coat') return feelsLike(weather) === 'cool' ? one(P.wantCoatCool) : one(P.wantCoat)
      return one(P.ok)
    }
    /** Персонаж говорит, что чувствует, когда меняется одежда или погода. */
    function react(force: boolean): void {
      if (room !== 'yard') return
      const r = outfitReaction(weather, outfit)
      const key = `${r.mood}|${r.want ?? ''}|${r.remove ?? ''}`
      renderDoll()
      refreshWish()
      if (key === reactionKey && !force) return
      const wasBad = reactionKey !== '' && !reactionKey.startsWith('ok')
      reactionKey = key
      if (r.mood === 'ok') {
        if (wasBad) {
          sayFrom('ok', P.ok)
          playCelebrationTune(audio)
          sparkle()
          joy()
        }
        return
      }
      say(lineForReaction(r))
      if (COLD_MOODS.has(r.mood)) sfx.play('shiver')
    }

    // ── Забота дома ──
    function care(action: CareAction, propId?: string): void {
      if (hero.busy() || st.sleeping || st.bathing) {
        sfx.play('pop')
        return
      }
      const fulfilled = wishes.fulfil(action, Date.now())
      const finish = (): void => {
        refreshHero()
        refreshWish()
      }
      const praise = (): void => {
        if (fulfilled) {
          playCelebrationTune(audio)
          sparkle()
        }
      }
      sayFrom(`done-${action}`, P.done[action])
      switch (action) {
        case 'eat':
          sfx.play('chew')
          hero.play('eat', 2600, () => {
            if (propId === 'porridge' || propId === 'fridge-pot') {
              st.messy = true
              wishes.trigger('messy', Date.now())
            }
            wishes.trigger('teeth', Date.now())
            praise()
            finish()
          })
          break
        case 'drink':
        case 'cocoa':
          sfx.play('gulp')
          if (action === 'cocoa') st.cold = false
          hero.play('drink', 2400, () => {
            praise()
            finish()
          })
          break
        case 'napkin':
          sfx.play('cloth')
          hero.play('napkin', 2000, () => {
            st.messy = false
            praise()
            finish()
          })
          break
        case 'teeth':
          sfx.play('brush')
          hero.play('teeth', 3200, () => {
            praise()
            hero.play('joy', 1000, finish)
          })
          break
        case 'wash-paws':
          sfx.play('splash')
          hero.play('wash-paws', 2600, () => {
            st.dirtyPaws = false
            praise()
            finish()
          })
          break
        case 'towel':
          sfx.play('cloth')
          hero.play('towel', 2200, () => {
            st.wet = false
            praise()
            finish()
          })
          break
        case 'potty': {
          const pot = layer.querySelector<HTMLElement>('[data-prop="potty"]')
          if (pot) pot.hidden = true
          hero.play('potty', 3000, () => {
            if (pot) pot.hidden = false
            praise()
            hero.play('joy', 1000, finish)
          })
          break
        }
        case 'book':
          sfx.play('page')
          hero.play('book', 4200, () => {
            praise()
            finish()
          })
          break
        case 'ball':
          sfx.play('boing')
          hero.play('ball', 3000, () => {
            praise()
            finish()
          })
          break
        case 'blocks':
          sfx.play('block')
          hero.play('blocks', 3200, () => {
            praise()
            finish()
          })
          break
        case 'pajama': {
          sfx.play('cloth')
          st.pj = true
          const pj = layer.querySelector<HTMLElement>('[data-prop="pajama"]')
          if (pj) pj.hidden = true
          hero.play('pj-wave', 1600, finish)
          break
        }
        case 'bath':
          startBath(fulfilled !== null)
          break
        case 'sleep':
          startSleep()
          break
      }
    }

    function startBath(fulfilled: boolean): void {
      st.bathing = true
      hero.el.hidden = true
      layer.append(bathFrames.el)
      bathFrames.start('bath')
      placeBubbles()
      sfx.play('bubble')
      later(1400, () => sfx.play('splash'))
      later(2600, () => sfx.play('bubble'))
      later(4200, () => {
        bathFrames.stop()
        bathFrames.el.remove()
        st.bathing = false
        hero.el.hidden = false
        st.dirtyPaws = false
        st.messy = false
        st.cold = false
        sfx.play('cloth')
        sayFrom('done-towel', P.done.towel)
        placeBubbles()
        hero.play('towel', 2200, () => {
          st.wet = false
          if (fulfilled) {
            playCelebrationTune(audio)
            sparkle()
          }
          refreshHero()
          refreshWish()
        })
      })
    }

    let sleepPlayer: ReturnType<typeof createFramePlayer> | null = null
    let lullaby: ReturnType<typeof setInterval> | undefined
    function startSleep(): void {
      const bed = layer.querySelector<HTMLElement>('[data-prop="bed"]')
      if (!bed) return
      st.sleeping = true
      st.cold = false
      hero.el.hidden = true
      sleepPlayer = createFramePlayer(who, still)
      sleepPlayer.start('sleep', 1100)
      bed.querySelector('img')!.hidden = true
      bed.append(sleepPlayer.el)
      rootEl.dataset.sleep = '1'
      sfx.play('lullaby')
      clearInterval(lullaby)
      lullaby = setInterval(() => sfx.play('lullaby'), 4200)
      thinkEl.hidden = true
      placeBubbles()
      later(SLEEP_AUTO_WAKE_MS, () => {
        if (st.sleeping) wake()
      })
    }
    function wake(): void {
      if (!st.sleeping) return
      st.sleeping = false
      clearInterval(lullaby)
      sleepPlayer?.stop()
      sleepPlayer?.el.remove()
      sleepPlayer = null
      const bed = layer.querySelector<HTMLElement>('[data-prop="bed"]')
      const bedImg = bed?.querySelector('img')
      if (bedImg) bedImg.hidden = false
      delete rootEl.dataset.sleep
      hero.el.hidden = false
      if (night) setNight(false, true)
      sfx.play('yawn')
      sayFrom('wake', P.wake)
      placeBubbles()
      hero.play('wake', 2400, () => {
        st.pj = false
        refreshHero()
        refreshWish()
      })
    }

    // ── День и ночь ──
    function setNight(value: boolean, quiet = false): void {
      night = value
      weather = { ...weather, night }
      wishes.setNight(night)
      rootEl.dataset.night = night ? '1' : '0'
      if (!quiet) {
        sfx.play(night ? 'twinkle' : 'sun')
        sayFrom(night ? 'evening' : 'morning', night ? P.evening : P.morning)
        if (night) wishes.trigger('sleepy', Date.now())
      }
      renderRoom()
    }
    function toggleNight(): void {
      if (st.sleeping && night) {
        wake()
        return
      }
      setNight(!night)
    }

    // ── Погода и сезон во дворе ──
    function setWeather(patch: Partial<Pick<Weather, 'sky' | 'precip' | 'wind'>>): void {
      const wasRaining = isRaining(weather)
      weather = { ...weather, ...patch }
      if (patch.sky !== undefined) {
        sfx.play(weather.sky === 'sun' ? 'sun' : 'wind')
        sayFrom(weather.sky === 'sun' ? 'sun' : 'clouds', weather.sky === 'sun' ? P.sun : P.clouds)
      }
      if (patch.precip !== undefined) {
        if (weather.precip) {
          sfx.play(weather.season === 'winter' ? 'snow' : 'rain')
          sayFrom(weather.season === 'winter' ? 'snow' : 'rain', weather.season === 'winter' ? P.snow : P.rain)
          if (isRaining(weather)) {
            later(2500, () => {
              if (!isRaining(weather)) return
              yardState.puddles = true
              yard?.refresh()
            })
          }
        } else if (wasRaining) {
          yardState.afterRain = true
        }
      }
      if (patch.wind !== undefined && weather.wind) {
        sfx.play('wind')
        sayFrom('wind', P.wind)
      }
      if (!wasRaining && isRaining(weather) && weather.sky === 'sun' && !night) later(1800, () => sayFrom('rainbow', P.rainbow))
      syncWeatherButtons()
      yard?.refresh()
      later(1100, () => react(false))
    }
    function syncWeatherButtons(): void {
      skyBtn.querySelector('img')!.src = itemUrl(weather.sky === 'sun' ? 'sun' : 'raincloud')
      skyBtn.dataset.on = weather.sky === 'clouds' ? '1' : '0'
      precipBtn.querySelector('img')!.src = itemUrl(weather.season === 'winter' ? 'snowflake' : 'drop')
      precipBtn.setAttribute('aria-label', weather.season === 'winter' ? 'Снег' : 'Дождик')
      precipBtn.dataset.on = weather.precip ? '1' : '0'
      windBtn.querySelector('img')!.src = itemUrl('wind')
      windBtn.dataset.on = weather.wind ? '1' : '0'
    }
    function setSeason(season: Season): void {
      seasonPop.hidden = true
      if (season === weather.season) return
      const prev = weather.season
      if (prev === 'winter' && yardState.snowman >= 3) yardState.melt = 'melting'
      if (season === 'winter') yardState.melt = 'none'
      if (prev === 'winter') {
        yardState.snowman = 0
        yardState.carrot = false
      }
      yardState.puddles = false
      yardState.afterRain = false
      yardState.castle = false
      weather = { ...weather, season, precip: false }
      sfx.play('swish')
      renderRoom()
      sayFrom(`season-${season}`, P.season[season])
      later(1800, () => react(true))
    }
    function toggleSeasonPop(): void {
      seasonPop.hidden = !seasonPop.hidden
      basketPop.hidden = true
      for (const btn of seasonPop.querySelectorAll<HTMLElement>('.mh__season-choice')) {
        btn.classList.toggle('is-active', btn.dataset.season === weather.season)
      }
    }
    function toggleBasket(): void {
      basketPop.hidden = !basketPop.hidden
      seasonPop.hidden = true
      sfx.play('cloth')
      renderDoll()
    }

    // ── Переходы ──
    let fading = false
    function go(next: Room): void {
      if (next === room || fading) return
      if (st.sleeping) wake()
      if (st.bathing) return
      hero.stop()
      sfx.play('door')
      const from = room
      fading = true
      scene.classList.add('is-fading')
      later(FADE_MS, () => {
        fading = false
        scene.classList.remove('is-fading')
        if (from === 'yard') leaveYard()
        if (next !== 'yard' && next !== 'hall') outfit = []
        st.fridgeOpen = false
        room = next
        renderRoom()
        if (next === 'yard') enterYard()
        else if (from === 'yard') returnHome()
      })
    }

    let walk = { cold: false, wet: false, hungry: false }
    function enterYard(): void {
      yardSince = Date.now()
      coldMs = 0
      wetMs = 0
      reactionKey = ''
      sayFrom(night ? 'night' : `season-${weather.season}`, night ? P.night : P.season[weather.season])
      later(1800, () => react(true))
    }
    function leaveYard(): void {
      walk = {
        cold: coldMs >= YARD_EFFECT_MS,
        wet: wetMs >= YARD_EFFECT_MS,
        hungry: Date.now() - yardSince >= LONG_WALK_MS,
      }
    }
    function returnHome(): void {
      const now = Date.now()
      if (outfit.length) sayFrom('home-dressed', P.homeDressed)
      if (walk.wet) {
        st.wet = true
        later(outfit.length ? 2800 : 200, () => sayFrom('wet-home', P.wetHome))
      }
      if (walk.cold) {
        st.cold = true
        wishes.trigger('cold', now)
      }
      if (st.dirtyPaws) wishes.trigger('dirty', now)
      if (walk.hungry) wishes.trigger('hungry', now)
      refreshHero()
      refreshWish()
    }

    // ── Отрисовка комнат ──
    function door(role: string, rect: Parameters<typeof hotspot>[0], label: string, to: Room): HTMLButtonElement {
      const btn = hotspot(rect, label, role)
      btn.classList.add('mh__door')
      btn.addEventListener('click', () => go(to))
      layer.append(btn)
      return btn
    }
    function windowSpot(r: Room): void {
      const btn = hotspot(WINDOW[r], night ? 'Сделать день' : 'Сделать ночь', 'window')
      btn.addEventListener('click', () => toggleNight())
      layer.append(btn)
    }
    function prop(art: string, spot: Spot, label: string, id: string, use: () => void): HTMLButtonElement {
      const btn = propButton(art, spot, label)
      btn.dataset.prop = id
      btn.style.zIndex = String(Math.round(spot.y))
      bindUse(btn, use)
      layer.append(btn)
      return btn
    }
    function zoneButton(rect: Parameters<typeof hotspot>[0], label: string, id: string, use: () => void): void {
      const btn = hotspot(rect, label, id)
      btn.dataset.prop = id
      btn.addEventListener('click', use)
      layer.append(btn)
    }
    function placeHero(spot: Spot): void {
      placeSpot(hero.el, spot, 2 / 3)
      hero.el.style.zIndex = '93'
      hero.el.hidden = st.sleeping || st.bathing
      layer.append(hero.el)
    }
    function placeDoll(spot: Spot): void {
      placeSpot(doll.el, spot, 1)
      doll.el.style.zIndex = '93'
      layer.append(doll.el)
      renderDoll()
    }

    function renderHall(): void {
      bg.src = roomBgUrl('hall', night)
      for (const [to, d] of Object.entries(HALL_DOORS) as [Exclude<Room, 'hall'>, (typeof HALL_DOORS)[keyof typeof HALL_DOORS]][]) {
        const btn = door(`door-${to}`, d.rect, d.label, to)
        const plaque = propButton(`plaque-${to}`, d.plaque, d.label, 'mh__plaque')
        plaque.dataset.role = `plaque-${to}`
        plaque.style.zIndex = '20'
        plaque.addEventListener('click', () => go(to))
        btn.after(plaque)
      }
      windowSpot('hall')
      for (const item of WEAR_ITEMS) {
        if (outfit.includes(item)) continue
        const art = item === 'umbrella' ? 'umbrella' : `wear-${who}-${item}`
        prop(art, RACK[item], WEAR_LABEL[item], `wear-${item}`, () => toggleWear(item)).classList.add('mh__rack-item')
      }
      if (outfit.length) placeDoll(DOLL_SPOT.hall)
      else placeHero(HERO_SPOT.hall)
    }

    function renderRoomProps(r: Exclude<HomeRoom, 'hall'>): void {
      for (const p of ROOM_PROPS[r]) {
        if (p.id === 'potty' && !pottyOn) continue
        const btn = prop(p.art, p.spot, p.label, p.id, () => care(p.action, p.id))
        if (p.id === 'pajama') {
          btn.style.zIndex = '110'
          btn.hidden = st.pj
        }
      }
    }

    function renderHome(r: Exclude<HomeRoom, 'hall'>): void {
      bg.src = roomBgUrl(r, night, st.fridgeOpen)
      door('back', BACK_DOOR[r], 'В прихожую', 'hall')
      windowSpot(r)
      if (r === 'bath') {
        zoneButton(TUB, 'Ванна', 'tub', () => care('bath'))
        zoneButton(SINK, 'Раковина', 'sink', () => care('wash-paws'))
      }
      if (r === 'kitchen') {
        zoneButton(FRIDGE, 'Холодильник', 'fridge', () => {
          if (night) {
            sfx.play('click')
            return
          }
          st.fridgeOpen = !st.fridgeOpen
          sfx.play('door')
          if (st.fridgeOpen) sayFrom('fridge', P.fridge)
          renderRoom()
        })
        if (st.fridgeOpen && !night) {
          for (const f of FRIDGE_FOOD) {
            const btn = hotspot(f.rect, f.label, f.id)
            btn.dataset.prop = f.id
            btn.classList.add('mh__food')
            bindUse(btn, () => care(f.action, f.id))
            layer.append(btn)
          }
        }
      }
      if (r === 'bedroom') {
        const bed = prop('bed', BED_SPOT, 'Кроватка', 'bed', () => {
          if (st.sleeping) wake()
          else care('sleep')
        })
        bed.classList.add('mh__bed')
        zoneButton(NIGHTLIGHT, 'Ночник', 'nightlight', () => {
          st.nightlight = !st.nightlight
          rootEl.dataset.nightlight = st.nightlight ? '1' : '0'
          sfx.play('click')
          if (st.nightlight) sayFrom('lamp', P.lamp)
        })
      }
      renderRoomProps(r)
      placeHero(HERO_SPOT[r])
    }

    function renderYard(): void {
      bg.src = yardBgUrl(weather.season, night)
      door('back', BACK_DOOR.yard, 'Домой', 'hall')
      windowSpot('yard')
      const basket = propButton('basket', { x: 22, y: 83, w: 8.5 }, 'Корзинка с одеждой', 'mh__basket')
      basket.dataset.role = 'basket'
      basket.style.zIndex = '83'
      basket.addEventListener('click', () => toggleBasket())
      layer.append(basket)
      yard = buildYard({
        layer,
        state: yardState,
        still,
        sfx,
        weather: () => weather,
        say: sayFrom,
        puddle: () => {
          if (outfit.includes('boots') || outfit.includes('valenki')) {
            sayFrom('puddle-boots', P.puddleBoots)
            joy()
          } else {
            st.dirtyPaws = true
            sayFrom('puddle-dirty', P.puddleDirty)
          }
        },
        joy,
        later,
      })
      placeDoll(DOLL_SPOT.yard)
      syncWeatherButtons()
    }

    function renderRoom(): void {
      layer.replaceChildren()
      delete layer.dataset.wind
      delete layer.dataset.sky
      layer.classList.remove('is-lamp')
      yard = null
      rootEl.dataset.room = room
      rootEl.dataset.night = night ? '1' : '0'
      rootEl.dataset.season = weather.season
      rootEl.dataset.nightlight = st.nightlight ? '1' : '0'
      const inYard = room === 'yard'
      seasonBtn.hidden = !inYard
      weatherBox.hidden = !inYard
      if (!inYard) {
        seasonPop.hidden = true
        basketPop.hidden = true
      }
      seasonIcon.src = seasonThumbUrl(weather.season)
      seasonBtn.setAttribute('aria-label', `Сезон: ${SEASON_LABEL[weather.season]}`)
      if (room === 'hall') renderHall()
      else if (room === 'yard') renderYard()
      else renderHome(room)
      refreshHero()
      refreshWish()
    }

    // ── Часы игры: желания и прогулка ──
    const tick = setInterval(() => {
      if (!alive) return
      const now = Date.now()
      if (!st.sleeping && !st.bathing && !hero.busy() && !fading) {
        const wish = wishes.tick(now)
        if (wish) showWish(wish)
      }
      if (wishes.current() !== shownWish) refreshWish()
      if (room === 'yard') {
        const r = outfitReaction(weather, outfit)
        if (COLD_MOODS.has(r.mood)) coldMs += TICK_MS
        if (r.mood === 'wet') wetMs += TICK_MS
      }
    }, TICK_MS)

    // ── Вход: каждый раз с чистого листа ──
    renderRoom()
    hero.play(night ? 'pj-wave' : 'wave', 2200)
    sfx.play('door')
    sayFrom(night ? 'hello-night' : 'hello', night ? P.helloNight : P.hello)

    cleanup = () => {
      alive = false
      clearInterval(tick)
      clearInterval(lullaby)
      clearTimeout(sayTimer)
      for (const t of timers) clearTimeout(t)
      timers.clear()
      hero.destroy()
      bathFrames.stop()
      sleepPlayer?.stop()
      sfx.stop()
      audio.stopVoice()
      audio.dispose?.()
      rootEl.remove()
      cleanup = null
    }
  },

  unmount() {
    unmountInternal()
  },
}

let cleanup: (() => void) | null = null

function unmountInternal(): void {
  cleanup?.()
  cleanup = null
}
