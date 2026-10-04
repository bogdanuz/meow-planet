import type { GameModule } from '../../shared/game-module'
import { askChoice } from '../../shared/ask-choice'
import { createAudioManager } from '../../shared/audio'
import {
  createGameChromeButton,
  createGameSettingsButton,
  createGameToolButton,
  gameToolIconUrl,
  type GameToolIcon,
} from '../../shared/game-chrome'
import { playSoftMiss } from '../../shared/hub-sounds'
import {
  deleteSandboxPhotos,
  getSandboxPhotoBlob,
  listSandboxPhotos,
  saveSandboxPhoto,
  type SandboxPhotoMeta,
} from '../../shared/sandbox-photos'
import '../../shared/select-mode.css'
import { uiIconUrl } from '../../shared/ui-icon'
import { sandboxCabinetUrl, sandboxHandUrl, sandboxRoomUrls } from './art'
import { clampCamera, edgeDirection, fitScale, growRoom, roomFrame, zoomAround } from './camera'
import { charPose, greetOffset } from './characters'
import { SandboxCoach, type HintId } from './coach'
import { drawRecipePreview } from './preview'
import { UndoStack } from './history'
import {
  BLOCK_KINDS,
  SHELF_TABS,
  STRETCH_MAX,
  STRETCH_MIN,
  getPieceSpec,
  isPowered,
  shelfTabOf,
  tapAction,
  type PieceKind,
  type ShelfTab,
} from './pieces'
import { PIECE_LAWS } from './laws'
import { RECIPES, RECIPE_LEVELS, placeRecipe, recipeRoom, type Recipe } from './recipes'
import { SandboxWorld, type PieceView, type SandboxSnapshot, type WireView } from './physics'
import { fitRoomSave, readRoomSave, writeRoomSave, type RoomBounds } from './room-save'
import {
  drawFloorShadows,
  drawFrost,
  drawGlow,
  drawPiece,
  drawRope,
  drawScene,
  drawShelfIcon,
  drawSpark,
  drawSuckGlow,
  drawTie,
  drawTrail,
  drawWire,
  paintRoomView,
  suckedView,
  viewAtOrigin,
} from './render'
import { loadPieceSprites } from './sprites'
import { chooseDropX, fingerVelocity, nextSize, shelfKinds, spawnCheck, type FingerSample } from './rules'
import {
  playBoom,
  playCannon,
  playChime,
  playChpok,
  playChute,
  playClick,
  playCut,
  playGone,
  playGravity,
  playGrow,
  playHatch,
  playHello,
  playHooray,
  playImpact,
  playKick,
  playLaunch,
  playPop,
  playPower,
  playPunch,
  playResize,
  playRide,
  playRope,
  playShutter,
  playSignal,
  playSpawn,
  playStart,
  playStick,
  playSuck,
  playTeleport,
  playTurn,
  playUndo,
  playWand,
  playWhee,
  playWhoosh,
} from './sfx'
import './shape-build.css'

/** Высота экрана в «кубиках»: «Крупные» — кубик ~80 px на iPad, «Средние» — ~65 px, «Мелкие» — ~50 px. */
const ROOM_UNITS_H = { big: 11.5, small: 14, tiny: 18 } as const
/** Линия ковра, на которой всё стоит. */
const FLOOR_FRAC = 0.9
const DRAG_START_PX = 8
const MENU_HIDE_MS = 4000
/** Удержание пальца на детали открывает меню-кольцо (решение владельца 02.10.2026). */
const HOLD_MENU_MS = 500
/** Шагов назад у «Отменить» (решение владельца 02.10.2026). */
const UNDO_STEPS = 20
const WAND_IDLE_MS = 20_000
const TOAST_MS = 1800
const FLY_MS = 480
const SHAKE_MS = 650
const SHELF_ICON_PX = 96
/** Быстрее этого (единиц/с) — бросок: пунктирный след и «ух!». */
const THROW_TRAIL_SPEED = 7
const TRAIL_MS = 900
const TRAIL_POINTS = 16
const CABINET_REACH_PX = 40
const COACH_TICK_MS = 400
/** Сколько деталей можно тащить разными пальцами сразу (решение владельца 02.10.2026). */
const MAX_FINGERS = 3
const SNAP_SHOW_MS = 700
const SNAP_FLY_MS = 650
const FALLBACK_W = 1024
const FALLBACK_H = 768
const CONFETTI_COLORS = ['#f28b7d', '#f7c95c', '#8fd19e', '#8cc8ee', '#b9a3e3'] as const
/** Палец с деталью у края экрана: полоса, задержка и скорость камеры (кубиков в секунду). */
const EDGE_ZONE_PX = 56
const EDGE_DELAY_S = 0.35
const EDGE_SPEED_U = 9
/** Щипком можно приблизить не больше чем в 1.6 раза от обычного размера. */
const ZOOM_MAX = 1.6
const ZOOM_MS = 380
/** Камера сама едет за тем, что движется быстрее этого (кубиков в секунду). */
const FOLLOW_MIN_SPEED = 2.5
const FOLLOW_EASE = 2.5
const SPARK_MS = 450
const GLOW_MS = 750
const SAVE_DELAY_MS = 1200
/** «Провод» и «Склеить»: ждём второй тап столько, потом режим сам выключается. */
const PICK_MODE_MS = 8000
/** Кнопки вокруг детали: размер обычной и главной (с подписью снизу). */
const RING_BTN_PX = 64
const RING_MAIN_PX = 80
const TAB_ICON: Record<ShelfTab, PieceKind> = { parts: 'cube', items: 'ball', machines: 'cart', switches: 'button' }

/** Подсказки инструментов показываются один раз за сессию, а не при каждом входе. */
const coachSeen = new Set<string>()

type Pt = { x: number; y: number }
/** `hold` — рука нажимает и держит, под ней растёт кружок меню. */
type HandPlan = { from: Pt; to?: Pt; hold?: boolean }

/** Механизм: тап — его действие, меню — по удержанию. */
function isLive(kind: PieceKind): boolean {
  const action = tapAction(kind)
  return action === 'press' || action === 'fire' || action === 'toggle'
}
type Cam = { x: number; y: number; k: number }

/** Один палец. Его `pointerId` — номер «руки» в физике: каждый палец тащит своё. */
type Press = {
  pointerId: number
  x: number
  y: number
  /** Деталь под пальцем на холсте; у детали из шкафа — после того, как вынесли из шкафа. */
  pieceId: number | null
  shelfKind: PieceKind | null
  dragging: boolean
  /** Шаг «достали из шкафа»: вернули деталь обратно сразу — шаг убираем. */
  freshStep: SandboxSnapshot | null
  samples: FingerSample[]
  /** Картинка детали из шкафа под пальцем, пока её не вынесли в комнату. */
  carry: HTMLCanvasElement | null
  /** Палец по пустому месту: двигает комнату (двумя — щипок). */
  pan: boolean
  lastX: number
  lastY: number
  /** Палец держат на детали: растёт кружок, заполнился — открылось меню. */
  hold?: { timer: number; ring: HTMLElement }
  /** Меню уже открыто удержанием — отпускание пальца ничего не делает. */
  held?: boolean
}

/** Второй тап выбирает деталь: куда вести провод или к чему приклеить. */
type PickMode = { type: 'wire' | 'glue'; from: number; until: number }

export const shapeBuildGame: GameModule = {
  meta: {
    id: 'shape-build',
    title: 'Собери что угодно!',
    zoneId: 'star-workshop',
    modules: ['2.5'],
  },

  mount(container, context) {
    unmountInternal()

    const settings = context.settings
    const audio = createAudioManager(settings)
    void audio.unlock()

    const limit = settings.sandboxMaxPieces ?? 40
    const kinds = shelfKinds(settings.sandboxHiddenKinds ?? [])
    /** Высота экрана в кубиках при обычном приближении (настройка «Размер деталей»). */
    const roomUnitsH: number = ROOM_UNITS_H[settings.sandboxPieceSize ?? 'small']
    const reduceMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const objectUrls = new Set<string>()
    const timers = new Set<number>()
    let alive = true
    const presses = new Map<number, Press>()
    let parkedBall: number | null = null
    let menuId: number | null = null
    let menuTimer: number | undefined
    const history = new UndoStack<SandboxSnapshot>(UNDO_STEPS)
    let lastStep: SandboxSnapshot | null = null
    /** Размер комнаты в момент шага. */
    const stepRooms = new WeakMap<SandboxSnapshot, RoomBounds>()
    let wandTimer: number | undefined
    let toastTimer: number | undefined
    const trails = new Map<number, { until: number; points: Pt[] }>()
    let scale = FALLBACK_H / roomUnitsH
    let dpr = 1
    let viewW = FALLBACK_W
    let viewH = FALLBACK_H
    let floorU = roomUnitsH * FLOOR_FRAC
    let ceilingPx = FALLBACK_H * 0.13
    let rafId = 0
    let lastFrame = 0
    let lastCoachTick = 0
    let handBusyUntil = 0
    let handAnim: Animation | null = null
    let shownSticks = -1

    // ── Комната и камера: `scale` — пикселей в кубике сейчас, `camX/camY` — угол экрана в комнате ──
    let baseScale = scale
    let camX = 0
    let camY = 0
    /** Место под шапкой над потолком (в кубиках при обычном приближении). */
    let topPadU = ceilingPx / scale
    let room: RoomBounds | null = null
    let startRoom: RoomBounds = { left: 0, right: FALLBACK_W / scale, top: topPadU }
    let roomDirty = true
    let camTween: { from: Cam; to: Cam; start: number } | null = null
    /** «Вся комната»: куда вернуться повторным нажатием. */
    let savedView: Cam | null = null
    /** Камера едет за движением, пока ребёнок не коснётся экрана. */
    let follow = false
    let followFocus: { x: number; y: number; until: number } | null = null
    const prevPos = new Map<number, Pt>()
    let edgeHeld = 0
    let edgeDir: { x: number; y: number } | null = null
    let grewThisDrag = false
    const sparks: { source: number; target: number; start: number }[] = []
    const glows = new Map<number, number>()
    /** Когда Мяу или Олли помахали после тапа и когда прокатились. */
    const greets = new Map<number, number>()
    const rides = new Map<number, number>()
    const charPrev = new Map<number, { x: number; y: number; at: number; vx: number; vy: number }>()
    let lastTouchAt = performance.now()
    let loadToastShown = false
    let pickMode: PickMode | null = null
    let saveTimer: number | undefined
    /** Пока картинки деталей грузятся, детали не рисуем кодом — иначе мелькают старые рисунки. */
    let spritesReady = false

    const coach = new SandboxCoach({ now: () => performance.now(), seen: coachSeen })

    // ── Мир ──
    const world = new SandboxWorld({
      width: FALLBACK_W / scale,
      height: roomUnitsH,
      floorY: floorU,
      ceilingY: 1.4,
      realistic: settings.sandboxRealPhysics ?? false,
      autoStraight: settings.sandboxAutoStraight ?? true,
      sticky: settings.sandboxSticky ?? true,
    })
    world.onImpact((event) => playImpact(audio, event.material, event.strength))
    world.onGoal((event) => {
      playHooray(audio)
      const at = toPx(event.x, event.y)
      burst(at.x, at.y, 18, null)
    })
    world.onStick((event) => {
      playStick(audio)
      const at = toPx(event.x, event.y)
      burst(at.x, at.y, 7, '#fff3b0', 26)
    })
    world.onAction((event) => {
      const { x, y } = toPx(event.x, event.y)
      switch (event.type) {
        case 'press':
          playClick(audio)
          break
        case 'power':
          if (event.kind === 'gate' || event.kind === 'trapdoor') playHatch(audio, event.on === true)
          else if (event.kind !== 'lamp' || event.on) playPower(audio, event.on === true)
          if (menuId === event.id) syncMenuButtons()
          glows.set(event.id, performance.now())
          syncStart()
          break
        case 'signal':
          if (event.target !== undefined) {
            sparks.push({ source: event.id, target: event.target, start: performance.now() })
            playSignal(audio, event.id)
            const target = world.pieces().find((v) => v.id === event.target)
            if (target) followFocus = { x: target.x, y: target.y, until: performance.now() + 1200 }
          }
          break
        case 'fire':
          playCannon(audio)
          burst(x, y, 8, '#f7c95c', 30)
          glows.set(event.id, performance.now())
          break
        case 'punch':
          playPunch(audio)
          glows.set(event.id, performance.now())
          break
        case 'launch':
          playLaunch(audio)
          // `on` — ракета у потолка выстрелила грузом: вспышка вокруг груза.
          if (event.on) burst(x, y, 14, '#fff3b0', 40)
          else burst(x, y + 0.8 * scale, 8, '#f7c95c', 26)
          break
        case 'kick':
          playKick(audio)
          burst(x, y, 6, '#8cc8ee', 24)
          glows.set(event.id, performance.now())
          break
        case 'cut':
          playCut(audio)
          burst(x, y, 6, '#fffdf8', 20)
          glows.set(event.id, performance.now())
          // Срезанные ведёрки стали отдельными деталями.
          syncCounts()
          break
        case 'gone':
          playGone(audio)
          burst(x, Math.max(y, toPx(0, currentRoom().top).y + 10), 10, null, 40)
          syncCounts()
          break
        case 'teleport':
          playTeleport(audio)
          burst(x, y, 8, event.color ?? '#8cc8ee', 24)
          break
        case 'ride':
          playRide(audio)
          hearts(x, y)
          rides.set(event.id, performance.now())
          break
        case 'chute':
          playChute(audio)
          burst(x, y - 1.2 * scale, 6, '#fffdf8', 18)
          break
        case 'load': {
          playSuck(audio)
          const holder = world.pieces().find((v) => v.id === event.target)
          const at = holder ? toPx(holder.x, holder.y) : { x, y }
          burst(at.x, at.y, 8, '#fff3b0', 22)
          if (event.target !== undefined) glows.set(event.target, performance.now())
          if (!loadToastShown) {
            loadToastShown = true
            showToast(
              holder?.kind !== 'rocket'
                ? 'Пушка заряжена! Нажмите на неё — выстрелит'
                : event.kind === 'meow' || event.kind === 'olli'
                  ? 'Ракетный рюкзак надет! Нажмите — полетит, а вниз спустится на парашюте'
                  : 'Груз в ракете! Нажмите на неё — полетит и у потолка выстрелит грузом',
            )
          }
          break
        }
        case 'pop':
          playPop(audio)
          burst(x, y, 10, event.color ?? null)
          syncCounts()
          break
      }
    })

    function later(fn: () => void, ms: number): number {
      const id = window.setTimeout(() => {
        timers.delete(id)
        if (alive) fn()
      }, ms)
      timers.add(id)
      return id
    }

    function cancel(id: number | undefined): void {
      if (id === undefined) return
      window.clearTimeout(id)
      timers.delete(id)
    }

    const rootEl = document.createElement('section')
    rootEl.className = 'shape-build'
    rootEl.dataset.gameId = 'shape-build'
    rootEl.dataset.cabinet = 'open'
    rootEl.dataset.pieces = '0'
    rootEl.dataset.frozen = '0'
    rootEl.dataset.gravity = 'on'

    // ── Комната и холст ──
    const roomCanvas = document.createElement('canvas')
    roomCanvas.className = 'shape-build__room'
    roomCanvas.setAttribute('aria-hidden', 'true')
    const roomArt = sandboxRoomUrls()
    const roomImages: { wall: HTMLImageElement | null; floor: HTMLImageElement | null } = { wall: null, floor: null }
    if (roomArt && typeof Image !== 'undefined') {
      for (const part of ['wall', 'floor'] as const) {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          roomImages[part] = img
          roomDirty = true
        }
        img.src = roomArt[part]
      }
    }
    const scene = document.createElement('canvas')
    scene.className = 'shape-build__scene'
    scene.setAttribute('role', 'img')
    scene.setAttribute('aria-label', 'Комната для постройки')
    const overlay = document.createElement('div')
    overlay.className = 'shape-build__overlay'
    overlay.setAttribute('aria-hidden', 'true')
    for (let i = 0; i < 12; i += 1) {
      const star = document.createElement('span')
      star.className = 'shape-build__spark'
      star.style.setProperty('--i', String(i))
      star.style.left = `${6 + i * 7.6}%`
      star.style.top = `${24 + ((i * 37) % 50)}%`
      overlay.append(star)
    }
    const fx = document.createElement('div')
    fx.className = 'shape-build__fx'
    fx.setAttribute('aria-hidden', 'true')
    const flash = document.createElement('div')
    flash.className = 'shape-build__flash'
    flash.setAttribute('aria-hidden', 'true')

    // ── Шапка: назад + звук; справа инструменты с подписью и шестерёнка ──
    const bar = document.createElement('header')
    bar.className = 'shape-build__bar'
    const barNav = document.createElement('div')
    barNav.className = 'shape-build__bar-nav'
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

    function tool(label: string, icon: GameToolIcon, role: string, onClick: () => void): HTMLButtonElement {
      const btn = createGameToolButton(label, icon, onClick)
      btn.dataset.role = role
      return btn
    }

    const barTools = document.createElement('div')
    barTools.className = 'shape-build__bar-tools'
    const undoBtn = tool('Отменить', 'undo', 'undo', () => undo())
    const startBtn = tool('Пуск!', 'start', 'start', () => pressStart())
    const boomBtn = tool('Бум!', 'boom', 'boom', () => boom())
    const wandBtn = tool('Замри!', 'wand', 'wand', () => setWand(!world.isFrozen()))
    const gravityBtn = tool('Гравитация', 'gravity', 'gravity', () => setGravityOff(!world.isGravityOff()))
    const photoBtn = tool('Фото', 'photo', 'photo', () => void takePhoto())
    const clearBtn = tool('Заново', 'sheet', 'clear', () => void askClear())
    const moreBtn = tool('Ещё', 'more', 'more', () => setMore(Boolean(more.hidden)))
    startBtn.setAttribute('aria-pressed', 'false')
    wandBtn.setAttribute('aria-pressed', 'false')
    gravityBtn.setAttribute('aria-pressed', 'false')
    moreBtn.setAttribute('aria-expanded', 'false')
    const goSettings = context.hubNavigation?.goSettings
    const settingsBtn = createGameSettingsButton(goSettings ? () => goSettings() : undefined)
    barTools.append(undoBtn, startBtn, boomBtn, wandBtn, gravityBtn, photoBtn, clearBtn, moreBtn, settingsBtn)
    bar.append(barNav, barTools)

    // «Ещё»: редкое — «Галерея» и «Как играть».
    const more = document.createElement('div')
    more.className = 'shape-build__more'
    more.hidden = true
    const galleryBtn = tool('Галерея', 'gallery', 'gallery', () => {
      setMore(false)
      void openGallery()
    })
    const howtoBtn = tool('Как играть', 'howto', 'howto', () => openHowto())
    more.append(galleryBtn, howtoBtn)

    // «Вся комната»: видна, когда комната больше экрана.
    const roomBtn = tool('Вся комната', 'room', 'room', () => toggleOverview())
    roomBtn.classList.add('shape-build__room-btn')
    roomBtn.setAttribute('aria-pressed', 'false')
    roomBtn.hidden = true

    // ── Шкаф: выезжает справа, ручка видна всегда ──
    const cabinet = document.createElement('aside')
    cabinet.className = 'shape-build__cabinet'
    cabinet.setAttribute('aria-label', 'Шкаф с деталями')
    const cabinetArt = sandboxCabinetUrl()
    if (cabinetArt) {
      cabinet.classList.add('has-art')
      cabinet.style.borderImageSource = `url("${cabinetArt}")`
    }
    const handle = document.createElement('button')
    handle.type = 'button'
    handle.className = 'touch-btn shape-build__handle'
    handle.setAttribute('aria-label', 'Шкаф')
    handle.addEventListener('click', () => setCabinet(rootEl.dataset.cabinet !== 'open'))
    // Вкладки «Детали / Предметы / Механизмы / Включатели»: пустые прячутся, одна — без вкладок.
    const tabs = SHELF_TABS.map((tab) => ({ ...tab, kinds: kinds.filter((k) => tab.kinds.includes(k)) })).filter(
      (tab) => tab.kinds.length > 0,
    )
    let activeTab: ShelfTab = tabs[0]?.id ?? 'parts'
    const tabBar = document.createElement('div')
    tabBar.className = 'shape-build__tabs'
    tabBar.setAttribute('role', 'tablist')
    tabBar.hidden = tabs.length < 2
    const tabButtons = new Map<ShelfTab, HTMLButtonElement>()
    for (const tab of tabs) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'touch-btn shape-build__tab'
      btn.dataset.tab = tab.id
      btn.setAttribute('role', 'tab')
      const label = document.createElement('span')
      label.className = 'shape-build__tab-label'
      label.textContent = tab.title
      btn.append(label)
      btn.addEventListener('click', () => setTab(tab.id))
      tabBar.append(btn)
      tabButtons.set(tab.id, btn)
    }
    const shelves = document.createElement('div')
    shelves.className = 'shape-build__shelves'
    const lock = document.createElement('span')
    lock.className = 'shape-build__lock'
    lock.setAttribute('aria-hidden', 'true')
    const shelfButtons = new Map<PieceKind, HTMLButtonElement>()
    /** Цвет на иконке — цвет следующей детали этого вида (решение владельца 02.10.2026). */
    const shelfColors = new Map<PieceKind, string>()
    kinds.forEach((kind) => {
      const item = document.createElement('button')
      item.type = 'button'
      item.className = 'shape-build__shelf-item'
      item.dataset.kind = kind
      item.dataset.group = getPieceSpec(kind).group
      item.dataset.tab = shelfTabOf(kind)
      item.setAttribute('aria-label', getPieceSpec(kind).titleRu)
      item.addEventListener('pointerdown', (event) => onShelfDown(event, kind))
      item.addEventListener('click', (event) => event.preventDefault())
      shelves.append(item)
      shelfButtons.set(kind, item)
    })
    cabinet.append(handle, tabBar, shelves, lock)

    function shelfIcon(kind: PieceKind, color: string): HTMLCanvasElement {
      const icon = document.createElement('canvas')
      icon.className = 'shape-build__shelf-icon'
      icon.width = SHELF_ICON_PX
      icon.height = SHELF_ICON_PX
      const ictx = icon.getContext('2d')
      if (ictx) drawShelfIcon(ictx, kind, color, SHELF_ICON_PX)
      return icon
    }

    function paintShelves(): void {
      for (const [kind, item] of shelfButtons) {
        const color = world.nextColor(kind)
        const key = spritesReady ? color : 'wait'
        if (shelfColors.get(kind) === key) continue
        shelfColors.set(kind, key)
        const label = document.createElement('span')
        label.className = 'shape-build__shelf-label'
        label.textContent = getPieceSpec(kind).titleRu
        let icon: HTMLElement
        if (spritesReady) {
          icon = shelfIcon(kind, color)
        } else {
          icon = document.createElement('span')
          icon.className = 'shape-build__shelf-icon shape-build__shelf-icon--wait'
        }
        item.replaceChildren(icon, label)
      }
      if (!spritesReady) return
      for (const tab of tabs) {
        const btn = tabButtons.get(tab.id)
        if (!btn || btn.querySelector('canvas')) continue
        const kind = tab.kinds.includes(TAB_ICON[tab.id]) ? TAB_ICON[tab.id] : tab.kinds[0]!
        const icon = shelfIcon(kind, world.nextColor(kind))
        icon.className = 'shape-build__tab-icon'
        btn.prepend(icon)
      }
    }

    function setTab(id: ShelfTab): void {
      activeTab = id
      cabinet.dataset.tab = id
      for (const [tabId, btn] of tabButtons) {
        const on = tabId === id
        btn.classList.toggle('is-selected', on)
        btn.setAttribute('aria-selected', on ? 'true' : 'false')
      }
      for (const [kind, item] of shelfButtons) item.hidden = tabs.length > 1 && shelfTabOf(kind) !== id
      fitShelves()
    }

    /** Куда «влетает» убранная деталь: её ячейка, а если она на другой вкладке — сама вкладка. */
    function shelfTarget(kind: PieceKind): HTMLElement | null {
      const item = shelfButtons.get(kind)
      if (item && !item.hidden) return item
      return tabButtons.get(shelfTabOf(kind)) ?? null
    }

    /** Колонки и ряды так, чтобы иконки вышли самыми крупными и всё влезло без прокрутки. */
    function fitShelves(): void {
      const n = [...shelfButtons.values()].filter((item) => !item.hidden).length
      const w = shelves.clientWidth || 300
      const h = shelves.clientHeight || 420
      const labelH = 22
      let best = { cols: 3, rows: Math.ceil(n / 3), cell: 0 }
      for (let cols = 2; cols <= 4; cols += 1) {
        const rows = Math.max(1, Math.ceil(n / cols))
        const cell = Math.min(w / cols, h / rows - labelH)
        if (cell > best.cell) best = { cols, rows, cell }
      }
      shelves.style.setProperty('--cols', String(best.cols))
      shelves.style.setProperty('--rows', String(best.rows))
      shelves.dataset.cols = String(best.cols)
    }

    // ── Кнопки у детали ──
    const menu = document.createElement('div')
    menu.className = 'shape-build__piece-menu'
    menu.hidden = true
    /** Кнопка кольца вокруг детали: иконка и подпись (решение владельца 02.10.2026). */
    function menuButton(label: string, icon: GameToolIcon, role: string, onClick: () => void): HTMLButtonElement {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'touch-btn shape-build__piece-btn'
      btn.dataset.role = role
      btn.setAttribute('aria-label', label)
      const img = document.createElement('img')
      img.src = gameToolIconUrl(icon)
      img.alt = ''
      img.decoding = 'async'
      const caption = document.createElement('span')
      caption.className = 'shape-build__piece-label'
      caption.textContent = label
      btn.append(img, caption)
      btn.addEventListener('click', () => {
        onClick()
        armMenuTimer()
      })
      return btn
    }

    function setMenuButton(btn: HTMLButtonElement, label: string, icon?: GameToolIcon): void {
      btn.setAttribute('aria-label', label)
      const caption = btn.querySelector('.shape-build__piece-label')
      if (caption) caption.textContent = label
      const img = btn.querySelector('img')
      if (icon && img) {
        const src = gameToolIconUrl(icon)
        if (img.getAttribute('src') !== src) img.src = src
      }
    }

    const turnBtn = menuButton('Повернуть', 'rotate', 'piece-turn', () => menuTurn())
    const smallerBtn = menuButton('Меньше', 'smaller', 'piece-smaller', () => menuResize(-1))
    const biggerBtn = menuButton('Больше', 'bigger', 'piece-bigger', () => menuResize(1))
    const removeBtn = menuButton('Убрать', 'remove', 'piece-remove', () => menuRemove())
    removeBtn.classList.add('shape-build__piece-btn--remove')
    const powerBtn = menuButton('Включить', 'power', 'piece-power', () => menuPower())
    powerBtn.classList.add('shape-build__piece-btn--power', 'shape-build__piece-btn--main')
    const fireBtn = menuButton('Пли!', 'fire', 'piece-fire', () => menuFire())
    fireBtn.classList.add('shape-build__piece-btn--main')
    const shorterBtn = menuButton('Короче', 'shorter', 'piece-shorter', () => menuLength(-1))
    const longerBtn = menuButton('Длиннее', 'longer', 'piece-longer', () => menuLength(1))
    const wireBtn = menuButton('Провод', 'wire', 'piece-wire', () => startPick('wire'))
    const pinBtn = menuButton('Прибить', 'nail', 'piece-pin', () => menuPin())
    const glueBtn = menuButton('Склеить', 'glue', 'piece-glue', () => startPick('glue'))
    const unglueBtn = menuButton('Расклеить', 'unglue', 'piece-unglue', () => menuUnglue())
    const ringButtons = [
      powerBtn,
      fireBtn,
      wireBtn,
      shorterBtn,
      longerBtn,
      turnBtn,
      smallerBtn,
      biggerBtn,
      pinBtn,
      glueBtn,
      unglueBtn,
      removeBtn,
    ]
    menu.append(...ringButtons)

    // ── Тост, рука-подсказка ──
    const toast = document.createElement('p')
    toast.className = 'shape-build__toast'
    toast.setAttribute('role', 'status')
    toast.setAttribute('aria-live', 'polite')
    toast.hidden = true
    const hand = document.createElement('img')
    hand.className = 'shape-build__hand'
    hand.src = sandboxHandUrl()
    hand.alt = ''
    hand.decoding = 'async'
    hand.setAttribute('aria-hidden', 'true')
    hand.hidden = true

    // ── «Как играть» для взрослого ──
    const howto = document.createElement('section')
    howto.className = 'shape-build__howto'
    howto.setAttribute('aria-label', 'Как играть')
    howto.hidden = true
    const howtoCard = document.createElement('div')
    howtoCard.className = 'shape-build__howto-card'
    const howtoHead = document.createElement('header')
    howtoHead.className = 'shape-build__howto-head'
    const howtoTitle = document.createElement('h2')
    howtoTitle.className = 'shape-build__howto-title'
    howtoTitle.textContent = 'Как играть'
    const howtoLead = document.createElement('p')
    howtoLead.className = 'shape-build__howto-lead'
    howtoLead.textContent =
      'Подсказки для взрослого: прочитайте, а потом играйте вместе и рассказывайте, что происходит. Правильных построек нет — всё, что получилось, уже хорошо.'
    howtoHead.append(howtoTitle, howtoLead)
    const howtoGrid = document.createElement('div')
    howtoGrid.className = 'shape-build__howto-grid'
    type HowtoItem = { title: string; accent: string; pics: () => HTMLElement[]; text: string }
    const howtoItems: HowtoItem[] = [
      {
        title: 'Достать деталь',
        accent: '#f7c95c',
        pics: () => [shelfPic('cube'), picImg(sandboxHandUrl())],
        text: 'Нажмите на деталь в шкафу — она упадёт в комнату. Или перетащите её пальцем прямо туда, где она нужна. Шкаф лежит поверх комнаты и ничего в ней не двигает.',
      },
      {
        title: 'Кнопки у детали',
        accent: '#8cc8ee',
        pics: () => [toolPic('rotate'), toolPic('bigger'), toolPic('nail'), toolPic('glue'), toolPic('remove')],
        text: 'Нажмите на кубик, доску или мячик — вокруг появятся кнопки: «Повернуть», «Больше», «Меньше», «Прибить» к стене, «Склеить» с соседней деталью, «Убрать». У шара, полки и жёлоба есть ещё «Короче» и «Длиннее».',
      },
      {
        title: 'Механизм: нажать или подержать',
        accent: '#f7c95c',
        pics: () => [shelfPic('cannon'), shelfPic('button'), shelfPic('lamp'), picImg(sandboxHandUrl())],
        text: 'Нажмите на механизм — он сразу сработает: пушка выстрелит, кнопка нажмётся, лампочка загорится, ворота откроются. Чтобы появились кнопки, подержите на нём палец: под пальцем вырастет кружок, а когда заполнится, откроется меню.',
      },
      {
        title: 'Бросить и поднять',
        accent: '#f28b7d',
        pics: () => [shelfPic('ball'), shelfPic('balloon')],
        text: 'Смахните деталь пальцем — она полетит дугой. Поднесите шарик к детали — он привяжется ниточкой. Кубик поднимает один шарик, пушку — два-три, тележку — четыре. Нажмите на шарик — он лопнет. Тащить можно до трёх деталей разными пальцами.',
      },
      {
        title: 'Механизмы и «Пуск!»',
        accent: '#b9a3e3',
        pics: () => [toolPic('start'), shelfPic('cart'), shelfPic('cannon'), shelfPic('rocket')],
        text: '«Пуск!» включает всё, к чему не идёт провод: моторы, подъёмники, ворота, люки, лампочки. Пушки стреляют, толкатели толкают, ракеты взлетают, ножницы режут. Нажмите ещё раз — всё остановится. Зарядить пушку или ракету: поднесите к ней предмет и подержите — он закружится и втянется. Груз ракеты виден в окошке, а у потолка она им выстрелит.',
      },
      {
        title: 'Кнопка и провод',
        accent: '#f28b7d',
        pics: () => [shelfPic('button'), toolPic('wire'), shelfPic('lamp'), shelfPic('gate')],
        text: 'Кнопка — выключатель: нажали — механизм включился, нажали ещё раз — выключился. Нажать может и палец, и упавший камень. Новая кнопка сама тянет провод к ближайшему механизму. Провести по-своему: «Провод», потом нажмите на механизм. От кнопки, лампочки или мельницы — до трёх проводов. То, к чему идёт провод, ждёт сигнала, а не «Пуск!».',
      },
      {
        title: 'Волшебные кнопки',
        accent: '#8fd19e',
        pics: () => [toolPic('boom'), toolPic('wand'), toolPic('gravity')],
        text: '«Бум!» — всё подпрыгивает. «Замри!» — всё застывает на месте. «Гравитация» — Земля перестаёт тянуть вниз, и детали плавают, как в космосе. Нажмите ещё раз — всё снова как было.',
      },
      {
        title: 'Большая комната',
        accent: '#8cc8ee',
        pics: () => [toolPic('room'), picImg(sandboxHandUrl())],
        text: 'Подержите деталь у края экрана — комната станет больше. Ведите пальцем по пустому месту — комната двигается, двумя пальцами — приближается и отдаляется. «Вся комната» показывает всё сразу.',
      },
      {
        title: 'Шаг назад и фото',
        accent: '#f6b48a',
        pics: () => [toolPic('undo'), toolPic('sheet'), toolPic('photo'), toolPic('gallery')],
        text: '«Отменить» — шаг назад, до 20 шагов. «Заново» — пустая комната. Постройка сохранится сама, когда вы выйдете из игры. Снимок — «Фото», посмотреть — «Ещё» → «Галерея».',
      },
    ]

    // «Хитрости»: неочевидные приёмы и связки деталей.
    const trickItems: HowtoItem[] = [
      {
        title: 'Как управлять',
        accent: '#f7c95c',
        pics: () => [picImg(sandboxHandUrl()), shelfPic('cannon'), shelfPic('cube')],
        text: 'Нажать на механизм — он срабатывает. Нажать на кубик, доску, мячик — вокруг кнопки. Подержать палец полсекунды — кнопки у любой детали. Смахнуть — деталь летит. Тащить можно до трёх деталей тремя пальцами сразу.',
      },
      {
        title: 'Зарядить ракету',
        accent: '#f28b7d',
        pics: () => [shelfPic('rocket'), shelfPic('ball'), picImg(sandboxHandUrl())],
        text: 'Возьмите мячик или другой небольшой предмет и поднесите к ракете. Не отпускайте: ракета засветится, предмет закружится и с «фьюют» втянется внутрь — его видно в окошке. Отпустили раньше — предмет просто упадёт. Нажмите на ракету — она взлетит и у потолка выстрелит грузом.',
      },
      {
        title: 'Зарядить пушку',
        accent: '#b9a3e3',
        pics: () => [shelfPic('cannon'), shelfPic('stone'), picImg(sandboxHandUrl())],
        text: 'Поднесите небольшой предмет к дулу пушки и подержите — он втянется. Нажмите на пушку — она выстрелит именно им. Пустая пушка по нажатию сама берёт мячик из шкафа. Передумали — вытащите предмет пальцем.',
      },
      {
        title: 'Хитрые провода',
        accent: '#8cc8ee',
        pics: () => [toolPic('wire'), shelfPic('lamp'), shelfPic('lamp'), shelfPic('mill')],
        text: 'Лампочки по цепочке — как часы: провод от лампочки к лампочке, и они загораются по очереди, с паузой. Мельница — выключатель от ветра: пока крутится, сигнал идёт. Положите камень на кнопку — она останется нажатой. Снять провод — утащите его пальцем в пустое место.',
      },
      {
        title: 'Кнопка набок и вверх ногами',
        accent: '#f6b48a',
        pics: () => [shelfPic('button'), toolPic('rotate'), toolPic('nail'), shelfPic('ball')],
        text: 'Поверните кнопку набок или вверх ногами и «Прибейте» к стене. Мячик, который прилетит в её красную шляпку сбоку или снизу, нажмёт её. Кнопка вверх ногами под полкой ловит мячик, подброшенный батутом.',
      },
      {
        title: 'Летающая пушка',
        accent: '#8fd19e',
        pics: () => [shelfPic('balloon'), shelfPic('balloon'), shelfPic('cannon')],
        text: 'Привяжите к пушке два-три шарика — она поднимется в воздух. Нажмите на неё — стреляет сверху. Лопните шарик — пушка опустится.',
      },
      {
        title: 'Пушка и вентилятор на колёсах',
        accent: '#f7c95c',
        pics: () => [shelfPic('cannon'), toolPic('glue'), shelfPic('cart'), shelfPic('fan')],
        text: 'Поставьте пушку или вентилятор на тележку и нажмите у детали «Склеить». Включите тележку — едет пушка-танк или машина-ветродуй.',
      },
      {
        title: 'Ножницы и шар-таран',
        accent: '#f28b7d',
        pics: () => [shelfPic('scissors'), shelfPic('wrecking')],
        text: 'Поставьте ножницы у верёвки шара-тарана и нажмите на них — верёвка перерезана, шар падает. Под шаром поставьте качели с мячиком — мячик взлетит.',
      },
      {
        title: 'Трубы между этажами',
        accent: '#8cc8ee',
        pics: () => [shelfPic('pipe'), shelfPic('shelf'), shelfPic('pipe')],
        text: 'Две трубы одного цвета — пара: что упало в одну, выпадает из другой. Поставьте одну на полку наверху, а другую внизу — мячик перескакивает с этажа на этаж.',
      },
      {
        title: 'Прибить к стене',
        accent: '#b9a3e3',
        pics: () => [toolPic('nail'), shelfPic('plank'), shelfPic('hoop')],
        text: '«Прибить» — деталь висит там, где стоит: доска становится горкой, кубик — ступенькой, кольцо — корзиной на стене. Нажмите «Прибить» ещё раз — деталь упадёт.',
      },
      {
        title: 'Большая стройка',
        accent: '#f6b48a',
        pics: () => [toolPic('room'), picImg(sandboxHandUrl())],
        text: 'Не хватает места — подержите деталь у края экрана, и комната вырастет. Потеряли деталь — «Вся комната». Постройка сохраняется сама, когда выходите из игры.',
      },
      {
        title: 'Мяу и Олли',
        accent: '#8fd19e',
        pics: () => [shelfPic('meow'), shelfPic('olli')],
        text: 'Нажмите на них — сделают пару шагов и помашут. Посадите на тележку, качели, подъёмник или ракету — поедут. На батуте радуются, на шарике висят, без гравитации плавают. Долго не трогать — уснут.',
      },
    ]

    function infoCard(item: HowtoItem, className: string): HTMLElement {
      const card = document.createElement('article')
      card.className = className
      card.style.setProperty('--accent', item.accent)
      const pics = document.createElement('div')
      pics.className = 'shape-build__howto-pics'
      pics.append(...item.pics())
      const name = document.createElement('h3')
      name.className = 'shape-build__howto-name'
      name.textContent = item.title
      const text = document.createElement('p')
      text.className = 'shape-build__howto-text'
      text.textContent = item.text
      card.append(pics, name, text)
      return card
    }

    const tricksGrid = document.createElement('div')
    tricksGrid.className = 'shape-build__howto-grid shape-build__tricks'

    function fillHowto(): void {
      howtoGrid.replaceChildren(...howtoItems.map((item) => infoCard(item, 'shape-build__howto-item')))
      tricksGrid.replaceChildren(...trickItems.map((item) => infoCard(item, 'shape-build__trick')))
    }
    fillHowto()

    // «Детали и законы»: что делает деталь и какой закон за этим стоит.
    const lawsGrid = document.createElement('div')
    lawsGrid.className = 'shape-build__howto-grid shape-build__laws'

    function fillLaws(): void {
      lawsGrid.replaceChildren(
        ...PIECE_LAWS.filter((entry) => entry.kinds.some((kind) => kinds.includes(kind))).map((entry, i) => {
          const card = document.createElement('article')
          card.className = 'shape-build__law'
          card.style.setProperty('--accent', CONFETTI_COLORS[i % CONFETTI_COLORS.length]!)
          const pics = document.createElement('div')
          pics.className = 'shape-build__howto-pics'
          pics.append(...entry.kinds.map((kind) => shelfPic(kind)))
          const name = document.createElement('h3')
          name.className = 'shape-build__howto-name'
          name.textContent = entry.title
          const law = document.createElement('p')
          law.className = 'shape-build__law-name'
          law.textContent = entry.law
          const text = document.createElement('p')
          text.className = 'shape-build__howto-text'
          text.textContent = entry.text
          const tip = (type: 'say' | 'try', label: string, body: string): HTMLElement => {
            const p = document.createElement('p')
            p.className = 'shape-build__law-tip'
            p.dataset.tip = type
            const b = document.createElement('b')
            b.textContent = label
            p.append(b, ` ${body}`)
            return p
          }
          card.append(
            pics,
            name,
            law,
            text,
            tip('say', 'Скажите ребёнку:', entry.say),
            tip('try', 'Попробуйте дома:', entry.try),
          )
          return card
        }),
      )
    }

    // «Что собрать»: машины по уровням, у каждой шаги и закон.
    const recipesBox = document.createElement('div')
    recipesBox.className = 'shape-build__recipes'

    function fillRecipes(): void {
      recipesBox.replaceChildren(
        ...RECIPE_LEVELS.map((level) => {
          const section = document.createElement('section')
          section.className = 'shape-build__recipe-level'
          section.dataset.level = String(level.level)
          const head = document.createElement('header')
          head.className = 'shape-build__recipe-level-head'
          const title = document.createElement('h3')
          title.className = 'shape-build__recipe-level-title'
          title.textContent = level.title
          const lead = document.createElement('p')
          lead.className = 'shape-build__howto-lead'
          lead.textContent = level.lead
          head.append(title, lead)
          const grid = document.createElement('div')
          grid.className = 'shape-build__howto-grid'
          grid.append(...RECIPES.filter((r) => r.level === level.level).map((recipe) => recipeCard(recipe)))
          section.append(head, grid)
          return section
        }),
      )
    }

    function recipeCard(recipe: Recipe): HTMLElement {
      const card = document.createElement('article')
      card.className = 'shape-build__recipe'
      card.dataset.recipe = recipe.id
      card.style.setProperty('--accent', recipe.accent)
      const preview = document.createElement('canvas')
      preview.className = 'shape-build__recipe-preview'
      preview.setAttribute('aria-hidden', 'true')
      const name = document.createElement('h3')
      name.className = 'shape-build__howto-name'
      name.textContent = recipe.title
      const chips = document.createElement('div')
      chips.className = 'shape-build__recipe-chips'
      chips.append(...recipe.kinds.map((kind) => shelfPic(kind)))
      if (recipe.action === 'start') chips.append(toolPic('start'))
      const steps = document.createElement('ol')
      steps.className = 'shape-build__recipe-steps'
      for (const step of recipe.steps) {
        const li = document.createElement('li')
        li.textContent = step
        steps.append(li)
      }
      const law = document.createElement('p')
      law.className = 'shape-build__recipe-law'
      const lawLabel = document.createElement('span')
      lawLabel.className = 'shape-build__recipe-law-label'
      lawLabel.textContent = 'Закон'
      law.append(lawLabel, document.createTextNode(recipe.law))
      const build = actionButton('Построить', 'recipe-build', () => buildRecipe(recipe))
      build.classList.add('shape-build__recipe-build')
      card.append(preview, name, chips, steps, law, build)
      return card
    }

    const PREVIEW_W = 300
    const PREVIEW_H = 150
    let previewFrame = 0

    /** Мини-картинки машин рисуем, когда открыта вкладка, — по несколько за кадр. */
    function paintRecipePreviews(): void {
      if (!spritesReady || previewFrame || howtoPanels.recipes.hidden) return
      const queue = [...recipesBox.querySelectorAll<HTMLCanvasElement>('.shape-build__recipe-preview:not([data-painted])')]
      const step = (): void => {
        previewFrame = 0
        if (!alive) return
        for (const canvas of queue.splice(0, 4)) {
          const recipe = RECIPES.find((r) => r.id === canvas.closest<HTMLElement>('.shape-build__recipe')?.dataset.recipe)
          if (!recipe) continue
          canvas.width = Math.round(PREVIEW_W * dpr)
          canvas.height = Math.round(PREVIEW_H * dpr)
          drawRecipePreview(canvas, recipe, dpr)
          canvas.dataset.painted = 'true'
        }
        if (queue.length) previewFrame = requestAnimationFrame(step)
      }
      previewFrame = requestAnimationFrame(step)
    }

    type HowtoTab = 'buttons' | 'tricks' | 'laws' | 'recipes'
    const howtoPanels: Record<HowtoTab, HTMLElement> = {
      buttons: howtoGrid,
      tricks: tricksGrid,
      laws: lawsGrid,
      recipes: recipesBox,
    }
    const howtoTabs = document.createElement('div')
    howtoTabs.className = 'shape-build__howto-tabs'
    howtoTabs.setAttribute('role', 'tablist')
    const howtoTabButtons = new Map<HowtoTab, HTMLButtonElement>()
    for (const [id, label] of [
      ['buttons', 'Кнопки'],
      ['tricks', 'Хитрости'],
      ['laws', 'Детали и законы'],
      ['recipes', 'Что собрать'],
    ] as const) {
      const btn = actionButton(label, `howto-tab-${id}`, () => setHowtoTab(id))
      btn.setAttribute('role', 'tab')
      btn.dataset.tab = id
      howtoTabs.append(btn)
      howtoTabButtons.set(id, btn)
    }
    const howtoBody = document.createElement('div')
    howtoBody.className = 'shape-build__howto-body'
    howtoBody.append(howtoGrid, tricksGrid, lawsGrid, recipesBox)

    function setHowtoTab(id: HowtoTab): void {
      for (const [tab, btn] of howtoTabButtons) {
        btn.classList.toggle('is-selected', tab === id)
        btn.setAttribute('aria-selected', tab === id ? 'true' : 'false')
        howtoPanels[tab].hidden = tab !== id
      }
      howto.dataset.tab = id
      howtoBody.scrollTop = 0
      if (id === 'recipes') paintRecipePreviews()
    }

    const howtoClose = actionButton('Понятно', 'howto-close', () => closeHowto())
    howtoClose.classList.add('shape-build__howto-close')
    howtoCard.append(howtoHead, howtoTabs, howtoBody, howtoClose)
    howto.append(howtoCard)
    setHowtoTab('buttons')
    howto.addEventListener('click', (event) => {
      if (event.target === howto) closeHowto()
    })

    function shelfPic(kind: PieceKind): HTMLElement {
      const pic = shelfIcon(kind, world.nextColor(kind))
      pic.className = 'shape-build__howto-pic'
      return pic
    }

    function toolPic(icon: GameToolIcon): HTMLElement {
      return picImg(gameToolIconUrl(icon))
    }

    function picImg(src: string): HTMLElement {
      const img = document.createElement('img')
      img.className = 'shape-build__howto-pic'
      img.src = src
      img.alt = ''
      return img
    }

    // ── Галерея фото построек ──
    const gallery = document.createElement('section')
    gallery.className = 'shape-build__gallery'
    gallery.setAttribute('aria-label', 'Фото построек')
    gallery.hidden = true
    const galleryGrid = document.createElement('div')
    galleryGrid.className = 'shape-build__gallery-grid'
    const galleryEmpty = document.createElement('p')
    galleryEmpty.className = 'shape-build__gallery-empty'
    galleryEmpty.textContent = 'Здесь будут фото твоих построек. Нажми «Фото»!'
    const galleryFoot = document.createElement('div')
    galleryFoot.className = 'shape-build__gallery-foot'
    const gallerySelect = document.createElement('div')
    gallerySelect.className = 'select-actions'
    const photoSelected = new Set<string>()
    let photos: SandboxPhotoMeta[] = []
    let gallerySelecting = false
    const photoSelectAll = actionButton('Выбрать все', 'photo-select-all', () => {
      for (const p of photos) photoSelected.add(p.id)
      syncGallerySelection()
    })
    const photoClearAll = actionButton('Снять все', 'photo-clear-all', () => {
      photoSelected.clear()
      syncGallerySelection()
    })
    const photoDelete = actionButton('Удалить (0)', 'photo-delete', () => void deletePhotos())
    photoDelete.classList.add('select-action--danger')
    gallerySelect.append(photoSelectAll, photoClearAll, photoDelete)
    const photoSelectToggle = actionButton('Выбрать', 'photo-select-toggle', () => setGallerySelecting(!gallerySelecting))
    const galleryClose = actionButton('Назад к постройке', 'gallery-close', () => closeGallery())
    galleryFoot.append(gallerySelect, photoSelectToggle, galleryClose)
    gallery.append(galleryGrid, galleryEmpty, galleryFoot)

    const viewer = document.createElement('div')
    viewer.className = 'shape-build__viewer'
    viewer.hidden = true
    const viewerImg = document.createElement('img')
    viewerImg.alt = 'Фото постройки'
    let viewerPhotoId: string | null = null
    let photoPressTimer = 0
    let photoPressFired = false
    const viewerActions = document.createElement('div')
    viewerActions.className = 'shape-build__viewer-actions'
    const viewerDownload = actionButton('Скачать', 'viewer-download', () => downloadViewerPhoto())
    const viewerDelete = actionButton('Удалить', 'viewer-delete', () => void deleteViewerPhoto())
    viewerDelete.classList.add('select-action--danger')
    const viewerBack = actionButton('Назад', 'viewer-back', () => closeViewer())
    viewerActions.append(viewerDownload, viewerDelete, viewerBack)
    viewer.append(viewerImg, viewerActions)
    viewer.addEventListener('click', (event) => {
      if (event.target === viewer) closeViewer()
    })

    rootEl.append(
      roomCanvas,
      scene,
      overlay,
      fx,
      flash,
      roomBtn,
      cabinet,
      menu,
      toast,
      bar,
      more,
      hand,
      howto,
      gallery,
      viewer,
    )
    container.replaceChildren(rootEl)
    paintShelves()
    setTab(activeTab)
    syncUndo()
    // Картинки в офлайн-кэше и грузятся быстро; если какая-то не пришла — через 2.5 с рисуем кодом.
    void Promise.race([loadPieceSprites(), new Promise<void>((resolve) => later(resolve, 2500))]).then(() => {
      if (!alive) return
      spritesReady = true
      rootEl.dataset.sprites = 'ready'
      shelfColors.clear()
      tabBar.querySelectorAll('canvas').forEach((icon) => icon.remove())
      paintShelves()
      paintRecipePreviews()
    })

    function actionButton(label: string, role: string, onClick: () => void): HTMLButtonElement {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'touch-btn select-action'
      btn.dataset.role = role
      btn.textContent = label
      btn.addEventListener('click', onClick)
      return btn
    }

    /** Правый край свободной части экрана (шкаф — панель поверх комнаты). */
    function freeRightPx(open = rootEl.dataset.cabinet === 'open'): number {
      if (open) return viewW - (cabinet.offsetWidth || viewW * 0.15)
      return viewW - (handle.offsetWidth || 0)
    }

    function currentRoom(): RoomBounds {
      room ??= { ...startRoom }
      return room
    }

    function frame0(): ReturnType<typeof roomFrame> {
      return roomFrame(currentRoom(), roomUnitsH, topPadU)
    }

    function minScale(): number {
      return Math.min(baseScale, fitScale(frame0(), viewW, viewH))
    }

    function setCam(next: Cam): void {
      const k = Math.min(Math.max(next.k, minScale()), baseScale * ZOOM_MAX)
      const c = clampCamera({ x: next.x, y: next.y, k }, frame0(), viewW, viewH)
      if (c.x !== camX || c.y !== camY || c.k !== scale) roomDirty = true
      camX = c.x
      camY = c.y
      scale = c.k
    }

    /** Стенки и потолок физики — по комнате; пол всегда на 90% высоты экрана. */
    function applyRoom(): void {
      const r = currentRoom()
      world.resize(r.right, roomUnitsH, floorU, r.top, r.left, r.right)
      roomDirty = true
      syncRoomButton()
    }

    function layout(): void {
      const r = rootEl.getBoundingClientRect()
      const zoomed = scale < baseScale * 0.99 || scale > baseScale * 1.01
      viewW = r.width > 10 ? r.width : FALLBACK_W
      viewH = r.height > 10 ? r.height : FALLBACK_H
      baseScale = viewH / roomUnitsH
      dpr = Math.min(2, window.devicePixelRatio || 1)
      for (const c of [roomCanvas, scene]) {
        c.width = Math.round(viewW * dpr)
        c.height = Math.round(viewH * dpr)
      }
      const barBottom = bar.getBoundingClientRect().bottom - r.top
      ceilingPx = barBottom > 10 ? barBottom + 6 : viewH * 0.13
      topPadU = ceilingPx / baseScale
      floorU = roomUnitsH * FLOOR_FRAC
      startRoom = { left: 0, right: viewW / baseScale, top: topPadU }
      const rm = currentRoom()
      rm.right = Math.max(rm.right, rm.left + startRoom.right)
      applyRoom()
      setCam({ x: camX, y: camY, k: zoomed ? scale : baseScale })
      fitShelves()
    }

    function toWorld(clientX: number, clientY: number): Pt {
      const r = rootEl.getBoundingClientRect()
      return { x: (clientX - r.left) / scale + camX, y: (clientY - r.top) / scale + camY }
    }

    /** Точка комнаты (кубики) → пиксели экрана игры. */
    function toPx(x: number, y: number): Pt {
      return { x: (x - camX) * scale, y: (y - camY) * scale }
    }

    function paintRoomLayer(): void {
      if (!roomDirty) return
      roomDirty = false
      const rctx = roomCanvas.getContext('2d')
      if (!rctx) return
      rctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paintRoomView(rctx, {
        cam: { x: camX, y: camY, k: scale },
        room: currentRoom(),
        unitsH: roomUnitsH,
        viewW,
        viewH,
        wall: roomImages.wall,
        floor: roomImages.floor,
        edge: edgeDir,
      })
    }

    function wireSelected(wire: WireView): boolean {
      if (pickMode?.type === 'wire') return wire.sourceId === pickMode.from
      return menuId !== null && (wire.sourceId === menuId || wire.targetId === menuId)
    }

    function highlightOf(view: PieceView): 'picked' | 'target' | undefined {
      if (view.id === menuId || view.id === pickMode?.from) return 'picked'
      if (!pickMode) return undefined
      if (pickMode.type === 'wire') {
        const linked = world.wiresOf(pickMode.from).includes(view.id)
        return linked || world.canConnect(pickMode.from, view.id) ? 'target' : undefined
      }
      return world.canGlue(pickMode.from, view.id) ? 'target' : undefined
    }

    /** Поза Мяу или Олли по тому, что с ними сейчас происходит. */
    function charOf(view: PieceView, now: number): NonNullable<PieceView['char']> {
      const prev = charPrev.get(view.id)
      let vx = 0
      let vy = 0
      if (prev && now > prev.at) {
        const dt = (now - prev.at) / 1000
        vx = prev.vx * 0.7 + ((view.x - prev.x) / dt) * 0.3
        vy = prev.vy * 0.7 + ((view.y - prev.y) / dt) * 0.3
      }
      charPrev.set(view.id, { x: view.x, y: view.y, at: now, vx, vy })
      const greetAt = greets.get(view.id)
      const rideAt = rides.get(view.id)
      const sinceGreet = greetAt === undefined ? null : (now - greetAt) / 1000
      const pose = charPose({
        vx,
        vy,
        held: world.isPieceHeld(view.id),
        tied: world.isTied(view.id),
        onRocket: world.isCargo(view.id) && !view.muzzle,
        inCannon: Boolean(view.muzzle),
        chute: view.chute !== undefined,
        zeroG: world.isGravityOff(),
        idleS: (now - lastTouchAt) / 1000,
        sinceGreet,
        sinceRide: rideAt === undefined ? null : (now - rideAt) / 1000,
        now: now / 1000 + view.id * 0.77,
      })
      const still = reduceMotion || sinceGreet === null
      return { pose, t: reduceMotion ? 0 : now / 1000 + view.id, dx: still ? 0 : greetOffset(sinceGreet) }
    }

    function draw(all: readonly PieceView[]): void {
      const ctx = scene.getContext('2d')
      if (!ctx) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, scene.width, scene.height)
      if (!spritesReady) return
      const k = dpr * scale
      ctx.setTransform(k, 0, 0, k, -camX * k, -camY * k)
      const now = performance.now()
      const sucks = world.suckState()
      const views = all
        .filter((v) => v.inside === undefined)
        .map((v) => {
          const s = sucks.find((e) => e.item === v.id)
          const view = s ? suckedView(v, s, s.t, reduceMotion) : v
          return view.kind === 'meow' || view.kind === 'olli' ? { ...view, char: charOf(view, now) } : view
        })
      for (const s of sucks) drawSuckGlow(ctx, s, s.t, reduceMotion ? 0 : now)
      drawFloorShadows(ctx, views, floorU)
      for (const [id, at] of glows) {
        const t = (now - at) / GLOW_MS
        const view = views.find((v) => v.id === id)
        if (t >= 1 || !view) glows.delete(id)
        else drawGlow(ctx, view, 1 - t)
      }
      for (const rope of world.ropes()) drawRope(ctx, rope)
      const ties = world.ties()
      const tied = new Set(ties.map((t) => t.balloonId))
      for (const tie of ties) drawTie(ctx, tie)
      for (const trail of trails.values()) drawTrail(ctx, trail.points)
      drawScene(ctx, views, tied, highlightOf)
      const wires = world.wires()
      for (const wire of wires) drawWire(ctx, wire, wireSelected(wire))
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const spark = sparks[i]!
        const t = (now - spark.start) / SPARK_MS
        const wire = wires.find((w) => w.sourceId === spark.source && w.targetId === spark.target)
        if (t >= 1 || !wire) sparks.splice(i, 1)
        else drawSpark(ctx, wire, reduceMotion ? 1 : t)
      }
      if (world.isFrozen()) {
        const t = reduceMotion ? 0 : now / 1000
        for (const view of views) drawFrost(ctx, view, t)
      }
    }

    const requestFrame: (cb: FrameRequestCallback) => number =
      typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (cb) => window.setTimeout(() => cb(performance.now()), 16)
    const cancelFrame: (id: number) => void =
      typeof window.cancelAnimationFrame === 'function' ? window.cancelAnimationFrame.bind(window) : window.clearTimeout

    function frame(now: number): void {
      if (!alive) return
      const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 1 / 60
      lastFrame = now
      world.step(dt)
      const views = world.pieces()
      updateTrails(views)
      runTween(now)
      edgeScroll(dt)
      followMotion(views, dt, now)
      if (pickMode && now > pickMode.until) endPick()
      if (menuId !== null) positionMenu()
      paintRoomLayer()
      draw(views)
      const sticks = world.stickCount()
      if (sticks !== shownSticks) {
        shownSticks = sticks
        rootEl.dataset.sticks = String(sticks)
      }
      if (parkedBall !== null && !world.isParked(parkedBall)) {
        parkedBall = null
        rootEl.dataset.ball = 'rolling'
        coach.pushed()
      }
      if (now - lastCoachTick > COACH_TICK_MS) {
        lastCoachTick = now
        coachTick()
      }
      rafId = requestFrame(frame)
    }

    // ── Состояние кнопок ──
    function syncCounts(): void {
      const onScreen = world.kinds()
      rootEl.dataset.pieces = String(onScreen.length)
      const full = onScreen.length >= limit
      cabinet.classList.toggle('is-full', full)
      for (const [kind, btn] of shelfButtons) {
        btn.classList.toggle('is-maxed', !full && spawnCheck(kind, onScreen, limit) === 'kind-max')
      }
      paintShelves()
      syncStart()
    }

    function setPressed(btn: HTMLButtonElement, on: boolean): void {
      btn.classList.toggle('is-selected', on)
      btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    }

    function wiggle(el: HTMLElement): void {
      el.classList.remove('soft-wiggle')
      void el.offsetWidth
      el.classList.add('soft-wiggle')
      later(() => el.classList.remove('soft-wiggle'), 460)
    }

    function showToast(text: string): void {
      toast.textContent = text
      toast.hidden = false
      cancel(toastTimer)
      toastTimer = later(() => {
        toast.hidden = true
      }, TOAST_MS)
    }

    function overlayOpen(): boolean {
      return !gallery.hidden || !howto.hidden || rootEl.querySelector('[data-choice-backdrop]') !== null
    }

    // ── Инструменты шапки ──
    function setMore(open: boolean): void {
      more.hidden = !open
      moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false')
      moreBtn.classList.toggle('is-selected', open)
      if (!open) return
      const r = rootEl.getBoundingClientRect()
      const b = moreBtn.getBoundingClientRect()
      if (b.width > 0) more.style.right = `${Math.max(8, r.right - b.right - 8)}px`
    }

    function boom(): void {
      hideMenu()
      if (world.count() > 0) remember()
      setWand(false, false)
      world.shake()
      playBoom(audio)
      if (!reduceMotion) {
        rootEl.classList.remove('is-shaking')
        void rootEl.offsetWidth
        rootEl.classList.add('is-shaking')
        later(() => rootEl.classList.remove('is-shaking'), SHAKE_MS)
      }
    }

    function setWand(on: boolean, sound = true): void {
      if (world.isFrozen() !== on) {
        world.setFrozen(on)
        rootEl.dataset.frozen = on ? '1' : '0'
        setPressed(wandBtn, on)
        if (sound) playWand(audio, on)
        if (on) coach.firstUse('wand')
      }
      armWandTimer()
    }

    /** «Замри!» сама выключается через 20 с без касаний. */
    function armWandTimer(): void {
      cancel(wandTimer)
      wandTimer = world.isFrozen() ? later(() => setWand(false), WAND_IDLE_MS) : undefined
    }

    function setGravityOff(off: boolean, announce = true): void {
      if (world.isGravityOff() === off) return
      world.setGravityOff(off)
      rootEl.dataset.gravity = off ? 'off' : 'on'
      setPressed(gravityBtn, off)
      if (!announce) return
      playGravity(audio, off)
      showToast(off ? 'Земля больше не тянет вниз — всё плавает' : 'Земля снова тянет всё вниз')
      if (off) coach.firstUse('gravity')
    }

    /** Шкаф — панель поверх комнаты: детали под ним закрыты, но работают дальше. */
    function setCabinet(open: boolean): void {
      rootEl.dataset.cabinet = open ? 'open' : 'closed'
    }

    // ── Большая комната: край, камера, «Вся комната» ──
    function animateTo(to: Cam): void {
      if (reduceMotion) {
        setCam(to)
        return
      }
      camTween = { from: { x: camX, y: camY, k: scale }, to, start: performance.now() }
    }

    function runTween(now: number): void {
      if (!camTween) return
      const t = Math.min(1, (now - camTween.start) / ZOOM_MS)
      const e = t * t * (3 - 2 * t)
      const { from, to } = camTween
      setCam({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, k: from.k + (to.k - from.k) * e })
      if (t >= 1) camTween = null
      syncRoomButton()
    }

    function isOverview(): boolean {
      return scale < baseScale * 0.97
    }

    /** Кнопка «Вся комната» видна, только когда комната больше экрана. */
    function syncRoomButton(): void {
      const big = fitScale(frame0(), viewW, viewH) < baseScale * 0.97
      roomBtn.hidden = !big && !isOverview()
      setPressed(roomBtn, isOverview())
      rootEl.dataset.zoom = isOverview() ? 'out' : 'base'
    }

    function toggleOverview(): void {
      hideMenu()
      if (isOverview()) {
        const back = savedView ?? { x: camX, y: camY, k: baseScale }
        savedView = null
        animateTo({ ...back, k: Math.max(back.k, baseScale) })
        return
      }
      savedView = { x: camX, y: camY, k: scale }
      animateTo({ x: camX, y: camY, k: minScale() })
    }

    /** «Вся комната» → тап по месту: приблизиться туда. */
    function zoomInAt(clientX: number, clientY: number): void {
      const p = toWorld(clientX, clientY)
      savedView = null
      animateTo({ x: p.x - viewW / baseScale / 2, y: p.y - viewH / baseScale / 2, k: baseScale })
    }

    /** Палец с деталью держат у края: камера едет туда, у стенки комната раздвигается. */
    function edgeScroll(dt: number): void {
      const r = rootEl.getBoundingClientRect()
      let dir: { x: number; y: number } | null = null
      for (const current of presses.values()) {
        if (!current.dragging || current.carry || current.pieceId === null) continue
        const last = current.samples[current.samples.length - 1]
        if (!last || overCabinet(last.x) || (rootEl.dataset.cabinet !== 'open' && nearHandle(last.x, last.y))) continue
        const rect = { left: 0, top: ceilingPx, right: freeRightPx(), bottom: viewH }
        const d = edgeDirection(last.x - r.left, last.y - r.top, rect, EDGE_ZONE_PX)
        if (d.x !== 0 || d.y !== 0) {
          dir = d
          break
        }
      }
      if (!dir) {
        edgeHeld = 0
        if (edgeDir) {
          edgeDir = null
          roomDirty = true
        }
        return
      }
      edgeHeld += dt
      if (edgeHeld < EDGE_DELAY_S) return
      if (!edgeDir || edgeDir.x !== dir.x || edgeDir.y !== dir.y) roomDirty = true
      edgeDir = dir
      follow = false
      camTween = null
      const step = (EDGE_SPEED_U * dt * baseScale) / scale
      const want = { x: camX + dir.x * step, y: camY + dir.y * step }
      setCam({ x: want.x, y: want.y, k: scale })
      const blockedX = dir.x !== 0 && Math.abs(camX - want.x) > 1e-4
      const blockedY = dir.y !== 0 && Math.abs(camY - want.y) > 1e-4
      if (blockedX || blockedY) {
        const before = currentRoom()
        const next = growRoom(before, { x: blockedX ? dir.x : 0, y: blockedY ? dir.y : 0 }, step, startRoom, roomUnitsH)
        if (next.left !== before.left || next.right !== before.right || next.top !== before.top) {
          room = next
          applyRoom()
          setCam({ x: want.x, y: want.y, k: scale })
          playGrow(audio)
          if (!grewThisDrag) {
            grewThisDrag = true
            showToast('Комната стала больше')
          }
        }
      }
      for (const current of presses.values()) {
        const last = current.samples[current.samples.length - 1]
        if (!current.dragging || current.carry || !last) continue
        const p = toWorld(last.x, last.y)
        world.moveGrab(p.x, p.y, current.pointerId)
      }
    }

    /**
     * Машина работает за краем экрана: камера плавно едет за искоркой и главным движением,
     * пока ребёнок не коснётся экрана (решение владельца 02.10.2026).
     */
    function followMotion(views: readonly PieceView[], dt: number, now: number): void {
      let sx = 0
      let sy = 0
      let n = 0
      for (const v of views) {
        const prev = prevPos.get(v.id)
        if (prev && dt > 0 && Math.hypot(v.x - prev.x, v.y - prev.y) / dt > FOLLOW_MIN_SPEED) {
          sx += v.x
          sy += v.y
          n += 1
        }
      }
      prevPos.clear()
      for (const v of views) prevPos.set(v.id, { x: v.x, y: v.y })
      if (!follow || presses.size > 0 || camTween) return
      let target: Pt | null = null
      if (followFocus && now < followFocus.until) target = followFocus
      else if (n > 0) target = { x: sx / n, y: sy / n }
      if (!target) return
      const seenW = freeRightPx() / scale
      const seenTop = camY + ceilingPx / scale
      const seenH = (viewH - ceilingPx) / scale
      const inside =
        target.x > camX + seenW * 0.2 &&
        target.x < camX + seenW * 0.8 &&
        target.y > seenTop + seenH * 0.15 &&
        target.y < seenTop + seenH * 0.85
      if (inside) return
      const goal = { x: target.x - seenW / 2, y: target.y - ceilingPx / scale - seenH / 2 }
      const e = Math.min(1, dt * FOLLOW_EASE)
      setCam({ x: camX + (goal.x - camX) * e, y: camY + (goal.y - camY) * e, k: scale })
    }

    /** Мяу или Олли катается — сердечки над ним. */
    function hearts(x: number, y: number): void {
      for (let i = 0; i < 3; i += 1) {
        const heart = document.createElement('span')
        heart.className = 'shape-build__heart'
        heart.textContent = '♥'
        heart.style.left = `${x + (i - 1) * 16}px`
        heart.style.top = `${y - 30}px`
        heart.style.setProperty('--d', `${i * 120}ms`)
        fx.append(heart)
        later(() => heart.remove(), 1300)
      }
    }

    // ── Сохранение постройки ──
    function persist(): void {
      cancel(saveTimer)
      saveTimer = undefined
      // Пустая комната тоже пишется: без сохранения вход считается первым и ставит стартовую постройку.
      writeRoomSave({ room: { ...currentRoom() }, snap: world.snapshot(), unitsH: roomUnitsH })
    }

    function scheduleSave(): void {
      cancel(saveTimer)
      saveTimer = later(() => persist(), SAVE_DELAY_MS)
    }

    // ── Шкаф ──
    function refuse(kind: PieceKind, check: 'full' | 'kind-max'): void {
      playSoftMiss(audio)
      if (check === 'full') wiggle(lock)
      else {
        const btn = shelfButtons.get(kind)
        if (btn) wiggle(btn)
      }
    }

    function canSpawn(kind: PieceKind): boolean {
      const check = spawnCheck(kind, world.kinds(), limit)
      if (check === 'ok') return true
      refuse(kind, check)
      return false
    }

    function spawnAt(kind: PieceKind, x: number, y: number): number | null {
      if (!canSpawn(kind)) return null
      remember()
      const id = world.add(kind, x, y)
      playSpawn(audio)
      syncCounts()
      if (kind === 'balloon' || kind === 'wrecking' || kind === 'hoop' || kind === 'fan') coach.firstUse(kind)
      if (isLive(kind)) coach.firstUse('hold')
      return id
    }

    /** Видимая часть комнаты (без шкафа): там, куда смотрит ребёнок. */
    function visibleRoom(): { left: number; right: number; top: number } {
      const rm = currentRoom()
      return {
        left: Math.max(rm.left, camX),
        right: Math.min(rm.right, camX + freeRightPx() / scale),
        top: Math.max(rm.top, camY + ceilingPx / scale),
      }
    }

    /** Тап по детали в шкафу: она падает сверху в свободное место ближе к центру видимой части. */
    function dropFromShelf(kind: PieceKind): void {
      const spec = getPieceSpec(kind)
      const seen = visibleRoom()
      const ceilingU = seen.top
      const x =
        kind === 'hoop'
          ? (seen.left + seen.right) / 2
          : chooseDropX({
              left: seen.left + 0.3,
              right: seen.right - 0.3,
              halfW: spec.w / 2,
              floorY: floorU,
              topAt: (x0, x1) => world.topAt(x0, x1),
            })
      const span = floorU - ceilingU
      let y = ceilingU + spec.h / 2 + 0.2
      if (kind === 'hoop') y = ceilingU + span * 0.42
      else if (kind === 'pulley') y = ceilingU + span * 0.3
      else if (kind === 'wrecking') y = ceilingU + span * 0.5
      else if (kind === 'balloon') y = ceilingU + span * 0.55
      // Висят, где поставили (полка, жёлоб, труба, люк, ножницы): посередине по высоте.
      else if (spec.fixed) y = ceilingU + span * 0.45
      const id = spawnAt(kind, x, y)
      if (id === null) return
      coach.took()
      if (kind === 'wrecking') world.nudge(id, { x: -6, y: 0 })
    }

    function onShelfDown(event: PointerEvent, kind: PieceKind): void {
      if (presses.size >= MAX_FINGERS || presses.has(event.pointerId) || overlayOpen()) return
      event.preventDefault()
      presses.set(event.pointerId, {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        pieceId: null,
        shelfKind: kind,
        dragging: false,
        freshStep: null,
        samples: [],
        carry: null,
        pan: false,
        lastX: event.clientX,
        lastY: event.clientY,
      })
    }

    function overCabinet(clientX: number): boolean {
      if (rootEl.dataset.cabinet !== 'open') return false
      const b = cabinet.getBoundingClientRect()
      return b.width > 0 && clientX >= b.left
    }

    /** Деталь из шкафа едет под пальцем картинкой, пока её не вынесли в комнату. */
    function startCarry(current: Press, kind: PieceKind, clientX: number, clientY: number): void {
      const ghost = shelfIcon(kind, world.nextColor(kind))
      ghost.className = 'shape-build__carry'
      rootEl.append(ghost)
      current.carry = ghost
      moveCarry(current, clientX, clientY)
    }

    function moveCarry(current: Press, clientX: number, clientY: number): void {
      if (!current.carry) return
      const r = rootEl.getBoundingClientRect()
      current.carry.style.transform = `translate(${clientX - r.left}px, ${clientY - r.top}px)`
    }

    function dropCarry(current: Press): void {
      current.carry?.remove()
      current.carry = null
    }

    /** Все пальцы отпустили сразу (окно, «Заново», «Отменить»). */
    function dropAllPresses(): void {
      for (const current of presses.values()) dropCarry(current)
      presses.clear()
      world.releaseGrab()
      cabinet.classList.remove('is-target')
    }

    // ── Убрать в шкаф ──
    function flyHome(views: readonly PieceView[]): void {
      if (reduceMotion || typeof fx.animate !== 'function') return
      const r = rootEl.getBoundingClientRect()
      const open = rootEl.dataset.cabinet === 'open'
      for (const view of views.slice(0, 40)) {
        const spec = getPieceSpec(view.kind)
        const sidePx = Math.max(spec.w, spec.h) * view.size * scale * 1.4
        const ghost = document.createElement('canvas')
        ghost.className = 'shape-build__ghost'
        ghost.width = Math.round(sidePx * dpr)
        ghost.height = Math.round(sidePx * dpr)
        ghost.style.width = `${sidePx}px`
        ghost.style.height = `${sidePx}px`
        const gctx = ghost.getContext('2d')
        if (gctx) {
          gctx.setTransform(dpr * scale, 0, 0, dpr * scale, (sidePx * dpr) / 2, (sidePx * dpr) / 2)
          drawPiece(gctx, viewAtOrigin(view))
        }
        const target = (open ? shelfTarget(view.kind) : null) ?? handle
        const t = target.getBoundingClientRect()
        const tx = t.width > 0 ? t.left + t.width / 2 - r.left : viewW - 20
        const ty = t.height > 0 ? t.top + t.height / 2 - r.top : viewH / 2
        const { x: sx, y: sy } = toPx(view.x, view.y)
        fx.append(ghost)
        const half = sidePx / 2
        const anim = ghost.animate(
          [
            { transform: `translate(${sx - half}px, ${sy - half}px) scale(1)`, opacity: 1 },
            { transform: `translate(${tx - half}px, ${ty - half}px) scale(0.25)`, opacity: 0.4 },
          ],
          { duration: FLY_MS, easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)' },
        )
        anim.onfinish = () => ghost.remove()
        anim.oncancel = () => ghost.remove()
      }
      cabinet.classList.remove('is-gulp')
      void cabinet.offsetWidth
      cabinet.classList.add('is-gulp')
      later(() => cabinet.classList.remove('is-gulp'), FLY_MS + 360)
    }

    /** `asStep` — убрали кнопкой ✕; унесли пальцем в шкаф — шаг записан, когда деталь взяли. */
    function removeToCabinet(ids: readonly number[], asStep: boolean): void {
      const live = ids.filter((id) => world.has(id))
      if (live.length === 0) return
      if (asStep) remember()
      flyHome(world.pieces().filter((v) => live.includes(v.id)))
      for (const id of live) {
        world.remove(id)
        trails.delete(id)
      }
      if (menuId !== null && !world.has(menuId)) hideMenu()
      playChpok(audio)
      syncCounts()
    }

    // ── «Отменить»: шаг назад, до 20 шагов ──
    function remember(): SandboxSnapshot {
      const step = world.snapshot()
      stepRooms.set(step, { ...currentRoom() })
      history.push(step)
      lastStep = step
      syncUndo()
      scheduleSave()
      return step
    }

    function forget(step: SandboxSnapshot): void {
      history.dropLast(step)
      syncUndo()
    }

    function syncUndo(): void {
      undoBtn.setAttribute('aria-disabled', history.canUndo() ? 'false' : 'true')
    }

    function undo(): void {
      const snap = history.pop()
      if (!snap) {
        playSoftMiss(audio)
        wiggle(undoBtn)
        return
      }
      dropAllPresses()
      hideMenu()
      endPick()
      trails.clear()
      // «Заново» и «Построить» меняют комнату: старые детали должны снова влезть в стены.
      const was = stepRooms.get(snap)
      if (was) {
        const now = currentRoom()
        room = { left: Math.min(now.left, was.left), right: Math.max(now.right, was.right), top: Math.min(now.top, was.top) }
        applyRoom()
        setCam({ x: camX, y: camY, k: scale })
      }
      world.restore(snap)
      scheduleSave()
      parkedBall = world.pieces().find((v) => v.kind === 'ball' && world.isParked(v.id))?.id ?? null
      rootEl.dataset.ball = parkedBall === null ? 'rolling' : 'parked'
      playUndo(audio)
      syncCounts()
      syncUndo()
    }

    // ── Кнопки у детали ──
    function showMenu(id: number): void {
      menuId = id
      menu.hidden = false
      rootEl.dataset.menu = String(id)
      syncMenuButtons()
      positionMenu()
      armMenuTimer()
    }

    function hideMenu(): void {
      menuId = null
      menu.hidden = true
      delete rootEl.dataset.menu
      cancel(menuTimer)
      menuTimer = undefined
    }

    function armMenuTimer(): void {
      cancel(menuTimer)
      menuTimer = menuId === null ? undefined : later(() => hideMenu(), MENU_HIDE_MS)
    }

    function syncMenuButtons(): void {
      if (menuId === null) return
      const id = menuId
      const kind = world.kindOf(id)
      const size = world.sizeOf(id) ?? 1
      const spec = kind ? getPieceSpec(kind) : null
      turnBtn.hidden = !spec || spec.turn === 'none'
      biggerBtn.disabled = nextSize(size, 1) === null
      smallerBtn.disabled = nextSize(size, -1) === null
      const powered = kind !== null && isPowered(kind)
      powerBtn.hidden = !powered
      if (powered) syncPowerButton(world.isOn(id), kind)
      const act = kind ? actionOf(kind) : null
      fireBtn.hidden = act === null
      if (act) setMenuButton(fireBtn, act.label, act.icon)
      const rope = world.ropeLength(id) !== null
      const len = world.lengthOf(id)
      shorterBtn.hidden = !rope && len === null
      longerBtn.hidden = !rope && len === null
      if (len !== null) {
        shorterBtn.disabled = len <= STRETCH_MIN + 1e-6
        longerBtn.disabled = len >= STRETCH_MAX - 1e-6
      } else {
        shorterBtn.disabled = false
        longerBtn.disabled = false
      }
      wireBtn.hidden = !world.isSource(id)
      pinBtn.hidden = !world.canPin(id)
      setMenuButton(pinBtn, world.isPinned(id) ? 'Отпустить' : 'Прибить')
      pinBtn.classList.toggle('is-selected', world.isPinned(id))
      glueBtn.hidden = kind === 'balloon' || kind === 'wrecking'
      unglueBtn.hidden = world.gluedTo(id).length === 0
    }

    /** Главное действие у детали: подпись и иконка. */
    function actionOf(kind: PieceKind): { label: string; icon: GameToolIcon } | null {
      const spec = getPieceSpec(kind)
      if (spec.muzzle) return { label: 'Пли!', icon: 'fire' }
      if (spec.link?.type === 'punch') return { label: 'Толкнуть!', icon: 'fire' }
      if (spec.link?.type === 'kick') return { label: 'Подбросить!', icon: 'kick' }
      if (spec.thrust) return { label: 'Полетели!', icon: 'rocket' }
      if (kind === 'scissors') return { label: 'Резать!', icon: 'cut' }
      return null
    }

    function powerLabel(kind: PieceKind | null, on: boolean): { label: string; icon: GameToolIcon } {
      if (kind === 'gate' || kind === 'trapdoor') return { label: on ? 'Закрыть' : 'Открыть', icon: 'power' }
      if (kind === 'lift') return { label: on ? 'Вниз' : 'Вверх', icon: 'lift' }
      return { label: on ? 'Выключить' : 'Включить', icon: 'power' }
    }

    function syncPowerButton(on: boolean, kind: PieceKind | null): void {
      const { label, icon } = powerLabel(kind, on)
      setMenuButton(powerBtn, label, icon)
      powerBtn.setAttribute('aria-pressed', on ? 'true' : 'false')
      powerBtn.classList.toggle('is-off', !on)
    }

    function menuPower(): void {
      if (menuId !== null) togglePiece(menuId)
    }

    function togglePiece(id: number): void {
      const kind = world.kindOf(id)
      const step = remember()
      const on = world.togglePower(id)
      if (on === null) {
        forget(step)
        return
      }
      if (kind === 'gate' || kind === 'trapdoor') playHatch(audio, on)
      else playPower(audio, on)
      glows.set(id, performance.now())
      follow = true
      if (menuId === id) syncPowerButton(on, kind)
      syncStart()
    }

    function menuFire(): void {
      if (menuId !== null) firePiece(menuId)
    }

    /** «Пли!», «Толкнуть!», «Полетели!», «Подбросить!», «Резать!». */
    function firePiece(id: number): void {
      const kind = world.kindOf(id)
      if (!kind) return
      const spec = getPieceSpec(kind)
      if (spec.muzzle) {
        fireCannon(id)
        follow = true
        return
      }
      const step = remember()
      let ok = false
      if (spec.thrust) ok = world.launch(id)
      else if (spec.link?.type === 'punch') ok = world.punch(id)
      else if (spec.link?.type === 'kick') ok = world.kick(id)
      else if (kind === 'scissors') ok = world.cut(id)
      if (!ok) {
        forget(step)
        playSoftMiss(audio)
        if (kind === 'scissors') showToast('Ножницам нечего резать — поднесите их к ниточке шарика или к верёвке шара')
        return
      }
      follow = true
      if (spec.thrust) {
        if (menuId === id) hideMenu()
        playLaunch(audio)
      } else if (spec.link?.type === 'punch') playPunch(audio)
    }

    // ── «Провод» и «Склеить»: второй тап выбирает деталь ──
    function startPick(type: PickMode['type']): void {
      if (menuId === null) return
      pickMode = { type, from: menuId, until: performance.now() + PICK_MODE_MS }
      rootEl.dataset.pick = type
      cancel(menuTimer)
      menuTimer = undefined
      menu.hidden = true
      showToast(type === 'wire' ? 'Теперь нажмите на механизм — к нему пойдёт провод' : 'Теперь нажмите на соседнюю деталь — склеим')
    }

    function endPick(): void {
      if (!pickMode) return
      pickMode = null
      delete rootEl.dataset.pick
      if (menuId !== null) hideMenu()
    }

    /** Второй тап в режиме «Провод» / «Склеить». true — тап съеден режимом. */
    function finishPick(id: number | null): boolean {
      const mode = pickMode
      if (!mode) return false
      endPick()
      if (id === null || id === mode.from) return true
      if (mode.type === 'wire') {
        const linked = world.wiresOf(mode.from).includes(id)
        const step = remember()
        const ok = linked ? world.disconnect(mode.from, id) : world.connect(mode.from, id)
        if (!ok) {
          forget(step)
          playSoftMiss(audio)
          showToast(wireRefusal(mode.from, id))
          return true
        }
        playShutter(audio)
        if (!linked) sparks.push({ source: mode.from, target: id, start: performance.now() })
        showToast(linked ? 'Провод снят' : 'Провод подключён')
        return true
      }
      if (!world.canGlue(mode.from, id)) {
        playSoftMiss(audio)
        showToast('Склеиваются только детали, которые касаются друг друга')
        return true
      }
      remember()
      world.glue(mode.from, id)
      playStick(audio)
      const view = world.pieces().find((v) => v.id === id)
      if (view) {
        const at = toPx(view.x, view.y)
        burst(at.x, at.y, 7, '#fff3b0', 26)
      }
      showToast('Склеили — теперь они двигаются вместе')
      return true
    }

    function wireRefusal(source: number, target: number): string {
      if (!world.isTarget(target)) return 'Провод ведут к механизму: тележке, воротам, лампочке, пушке…'
      if (world.wiresOf(source).length >= 3) return 'Отсюда уже идут три провода — больше нельзя'
      return 'Так нельзя: сигнал побежал бы по кругу без конца'
    }

    function menuPin(): void {
      if (menuId === null) return
      const step = remember()
      const on = world.setPinned(menuId, !world.isPinned(menuId))
      if (on === null) {
        forget(step)
        playSoftMiss(audio)
        return
      }
      playStick(audio)
      showToast(on ? 'Прибили к стене — теперь не упадёт' : 'Деталь снова свободна')
      syncMenuButtons()
    }

    function menuUnglue(): void {
      if (menuId === null) return
      const step = remember()
      if (!world.unglue(menuId)) {
        forget(step)
        playSoftMiss(audio)
        return
      }
      playChpok(audio)
      syncMenuButtons()
    }

    /** Мячик в дуле, иначе новый из шкафа, иначе самый первый мячик в комнате. */
    function fireCannon(cannon: number): void {
      const at = world.muzzleOf(cannon)
      if (!at) return
      const step = remember()
      let fired = false
      const loaded = world.loadedItem(cannon)
      if (loaded !== null) fired = world.fire(cannon, loaded)
      else if (spawnCheck('ball', world.kinds(), limit) === 'ok') {
        // Маленькой пушке — маленький мячик: обычный в её дуло не влезает.
        const ball = world.add('ball', at.x, at.y, { size: Math.min(1, world.sizeOf(cannon) ?? 1) })
        fired = world.fire(cannon, ball)
        if (!fired) world.remove(ball)
        syncCounts()
      } else {
        fired = world.pieces().some((v) => v.kind === 'ball' && world.fire(cannon, v.id))
      }
      if (!fired) {
        forget(step)
        playSoftMiss(audio)
        return
      }
      playCannon(audio)
      const px0 = toPx(at.x, at.y)
      burst(px0.x, px0.y, 8, '#f7c95c', 30)
    }

    /** «Короче / Длиннее»: верёвка шара-тарана или длина полки и жёлоба. */
    function menuLength(dir: 1 | -1): void {
      if (menuId === null) return
      const step = remember()
      const stretch = world.lengthOf(menuId) !== null
      const ok = stretch ? world.changeLength(menuId, dir) : world.changeRope(menuId, dir)
      if (!ok) {
        forget(step)
        playSoftMiss(audio)
        return
      }
      if (stretch) playResize(audio, dir > 0)
      else playRope(audio, dir < 0)
      syncMenuButtons()
    }

    /**
     * «Пуск!»: моторы, ворота, люки и лампочки разом; заряженные пушки, толкатели, ракеты,
     * катапульты и ножницы срабатывают. То, к чему идёт провод, ждёт свой сигнал. Второй раз — всё стоп.
     */
    function pressStart(): void {
      const on = !world.anyOn()
      const result = world.start(on)
      const acted =
        result.fired.length + result.punched.length + result.launched.length + result.kicked.length + result.cut.length
      if (on && !world.anyOn() && acted === 0) {
        const wired = world.wires().length > 0
        playSoftMiss(audio)
        wiggle(startBtn)
        showToast(
          wired
            ? 'Механизмы на проводах ждут сигнала — нажмите на красную кнопку'
            : 'Здесь нечего запускать — поставьте тележку, ленту, подъёмник, пушку или ракету',
        )
        syncStart()
        return
      }
      playStart(audio, on)
      if (on) follow = true
      if (result.fired.length) playCannon(audio)
      if (result.punched.length) playPunch(audio)
      if (result.launched.length) playLaunch(audio)
      if (result.kicked.length) playKick(audio)
      if (result.cut.length) playCut(audio)
      for (const id of result.fired) {
        const at = world.muzzleOf(id)
        if (!at) continue
        const p = toPx(at.x, at.y)
        burst(p.x, p.y, 8, '#f7c95c', 30)
      }
      if (menuId !== null) syncMenuButtons()
      syncStart()
    }

    function syncStart(): void {
      setPressed(startBtn, world.anyOn())
    }

    function positionMenu(): void {
      if (menuId === null) return
      const b = world.boundsOf(menuId)
      if (!b) {
        hideMenu()
        return
      }
      const p0 = toPx(b.x0, b.y0)
      const p1 = toPx(b.x1, b.y1)
      const cx = (p0.x + p1.x) / 2
      const cy = (p0.y + p1.y) / 2
      const shown = ringButtons.filter((btn) => !btn.hidden)
      const n = shown.length
      if (n === 0) return
      // Кольцо вокруг детали: радиус — чтобы не закрыть деталь и кнопки не налезали друг на друга.
      const half = Math.hypot(p1.x - p0.x, p1.y - p0.y) / 2
      const byGap = ((RING_BTN_PX + 22) * n) / (2 * Math.PI)
      const radius = Math.max(half + RING_BTN_PX / 2 + 10, byGap, 78)
      const minX = 8
      const maxX = freeRightPx() - 8
      const minY = ceilingPx + 4
      const maxY = viewH - 8
      // Главное действие — сверху, остальные по кругу по часовой стрелке.
      shown.forEach((btn, i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2
        const size = btn.classList.contains('shape-build__piece-btn--main') ? RING_MAIN_PX : RING_BTN_PX
        const labelH = 20
        const x = Math.min(Math.max(cx + Math.cos(a) * radius - size / 2, minX), maxX - size)
        const y = Math.min(Math.max(cy + Math.sin(a) * radius - size / 2, minY), maxY - size - labelH)
        btn.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`
      })
    }

    function menuTurn(): void {
      if (menuId === null) return
      const step = remember()
      if (world.turn(menuId)) playTurn(audio)
      else forget(step)
      syncMenuButtons()
    }

    function menuResize(dir: 1 | -1): void {
      if (menuId === null) return
      const next = nextSize(world.sizeOf(menuId) ?? 1, dir)
      const step = remember()
      if (next === null || !world.setSize(menuId, next)) {
        forget(step)
        playSoftMiss(audio)
        return
      }
      playResize(audio, dir === 1)
      syncMenuButtons()
    }

    function menuRemove(): void {
      if (menuId === null) return
      const id = menuId
      hideMenu()
      removeToCabinet([id], true)
    }

    // ── Касания по комнате ──
    function onRootDownCapture(event: PointerEvent): void {
      coach.touched()
      lastTouchAt = performance.now()
      hideHand()
      armWandTimer()
      const target = event.target as Node | null
      if (!more.hidden && target && !more.contains(target) && !moreBtn.contains(target)) setMore(false)
    }

    function sample(event: PointerEvent): FingerSample {
      return { x: event.clientX, y: event.clientY, at: performance.now() }
    }

    function onSceneDown(event: PointerEvent): void {
      if (overlayOpen() || presses.size >= MAX_FINGERS || presses.has(event.pointerId)) return
      event.preventDefault()
      follow = false
      camTween = null
      grewThisDrag = false
      const p = toWorld(event.clientX, event.clientY)
      const pieceId = world.pieceAt(p.x, p.y)
      if (pieceId !== null && world.isFrozen()) playChime(audio)
      presses.set(event.pointerId, {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        pieceId,
        shelfKind: null,
        dragging: false,
        freshStep: null,
        samples: [sample(event)],
        carry: null,
        pan: pieceId === null,
        lastX: event.clientX,
        lastY: event.clientY,
      })
      const current = presses.get(event.pointerId)
      if (current && pieceId !== null && !pickMode) startHold(current)
    }

    function startHold(current: Press): void {
      const r = rootEl.getBoundingClientRect()
      const ring = document.createElement('div')
      ring.className = 'shape-build__hold'
      ring.setAttribute('aria-hidden', 'true')
      ring.style.left = `${current.x - r.left}px`
      ring.style.top = `${current.y - r.top}px`
      ring.style.setProperty('--hold-ms', `${HOLD_MENU_MS}ms`)
      rootEl.append(ring)
      const timer = later(() => {
        endHold(current)
        if (presses.get(current.pointerId) !== current || current.dragging || current.pieceId === null) return
        if (!world.has(current.pieceId)) return
        current.held = true
        playClick(audio)
        showMenu(current.pieceId)
        coach.held()
      }, HOLD_MENU_MS)
      current.hold = { timer, ring }
    }

    function endHold(current: Press): void {
      if (!current.hold) return
      cancel(current.hold.timer)
      current.hold.ring.remove()
      current.hold = undefined
    }

    function beginDrag(current: Press, clientX: number, clientY: number): void {
      endHold(current)
      hideMenu()
      if (current.shelfKind) {
        if (!canSpawn(current.shelfKind)) {
          presses.delete(current.pointerId)
          return
        }
        current.dragging = true
        startCarry(current, current.shelfKind, clientX, clientY)
        return
      }
      if (current.pieceId === null) return
      const start = toWorld(current.x, current.y)
      const step = remember()
      if (!world.grab([current.pieceId], start.x, start.y, current.pointerId)) {
        forget(step)
        current.pieceId = null
        return
      }
      current.dragging = true
      coach.dragged()
    }

    function onWindowMove(event: PointerEvent): void {
      const current = presses.get(event.pointerId)
      if (!current) return
      current.samples.push(sample(event))
      if (current.samples.length > 10) current.samples.shift()
      if (current.pan) {
        panMove(current, event.clientX, event.clientY)
        return
      }
      if (!current.dragging) {
        if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < DRAG_START_PX) return
        if (current.pieceId === null && !current.shelfKind) return
        beginDrag(current, event.clientX, event.clientY)
        if (!current.dragging) return
      }
      if (current.carry) {
        moveCarry(current, event.clientX, event.clientY)
        if (overCabinet(event.clientX) || !current.shelfKind) return
        const p = toWorld(event.clientX, event.clientY)
        // Над шапкой деталь застряла бы за потолком: пока несём картинку.
        if (p.y < currentRoom().top + getPieceSpec(current.shelfKind).h / 2) return
        const id = spawnAt(current.shelfKind, p.x, p.y)
        dropCarry(current)
        if (id === null) {
          presses.delete(current.pointerId)
          return
        }
        world.grab([id], p.x, p.y, current.pointerId)
        current.pieceId = id
        current.freshStep = lastStep
        coach.dragged()
        return
      }
      const p = toWorld(event.clientX, event.clientY)
      world.moveGrab(p.x, p.y, current.pointerId)
      if (rootEl.dataset.cabinet !== 'open' && nearHandle(event.clientX, event.clientY)) setCabinet(true)
      syncCabinetTarget()
    }

    /** Деталь поднесли к ручке закрытого шкафа — он открывается; у остального края растёт комната. */
    function nearHandle(clientX: number, clientY: number): boolean {
      const b = handle.getBoundingClientRect()
      if (b.width <= 0) return false
      return (
        clientX > b.left - CABINET_REACH_PX &&
        clientY > b.top - CABINET_REACH_PX &&
        clientY < b.bottom + CABINET_REACH_PX
      )
    }

    /** Палец по пустому месту двигает комнату; два пальца — щипок, приблизить или отдалить. */
    function panMove(current: Press, clientX: number, clientY: number): void {
      if (!current.dragging) {
        if (Math.hypot(clientX - current.x, clientY - current.y) < DRAG_START_PX) return
        current.dragging = true
        hideMenu()
      }
      const pans = [...presses.values()].filter((p) => p.pan && p.dragging)
      if (pans.length >= 2) {
        const [a, b] = pans as [Press, Press]
        const other = a === current ? b : a
        const before = Math.hypot(current.lastX - other.lastX, current.lastY - other.lastY)
        const after = Math.hypot(clientX - other.lastX, clientY - other.lastY)
        const r = rootEl.getBoundingClientRect()
        const midX = (clientX + other.lastX) / 2 - r.left
        const midY = (clientY + other.lastY) / 2 - r.top
        if (before > 10) {
          const next = zoomAround({ x: camX, y: camY, k: scale }, after / before, midX, midY)
          setCam(next)
          savedView = null
          syncRoomButton()
        }
        const shift = { x: (clientX - current.lastX) / 2, y: (clientY - current.lastY) / 2 }
        setCam({ x: camX - shift.x / scale, y: camY - shift.y / scale, k: scale })
      } else {
        setCam({ x: camX - (clientX - current.lastX) / scale, y: camY - (clientY - current.lastY) / scale, k: scale })
      }
      current.lastX = clientX
      current.lastY = clientY
    }

    /** Шкаф светится, пока над ним держат хоть одну деталь. */
    function syncCabinetTarget(): void {
      let over = false
      for (const current of presses.values()) {
        const last = current.samples[current.samples.length - 1]
        if (current.dragging && !current.carry && last && overCabinet(last.x)) over = true
      }
      cabinet.classList.toggle('is-target', over)
    }

    function onWindowUp(event: PointerEvent): void {
      const current = presses.get(event.pointerId)
      if (!current) return
      presses.delete(event.pointerId)
      endHold(current)
      syncCabinetTarget()
      if (current.held && !current.dragging) return
      if (current.pan) {
        if (current.dragging) return
        if (pickMode) finishPick(null)
        else if (isOverview()) zoomInAt(event.clientX, event.clientY)
        else hideMenu()
        return
      }
      if (current.dragging) {
        if (current.carry) {
          dropCarry(current)
          return
        }
        if (overCabinet(event.clientX)) {
          const ids = world.releaseGrab(undefined, current.pointerId)
          // Шаг уже записан, когда деталь взяли; только что достали — шаг пустой.
          if (current.freshStep) forget(current.freshStep)
          removeToCabinet(ids, false)
          return
        }
        current.samples.push(sample(event))
        const v = fingerVelocity(current.samples)
        const velocity = { x: v.x / scale, y: v.y / scale }
        const ids = world.releaseGrab(velocity, current.pointerId)
        if (Math.hypot(velocity.x, velocity.y) >= THROW_TRAIL_SPEED) {
          const until = performance.now() + TRAIL_MS
          for (const id of ids) trails.set(id, { until, points: [] })
          playWhee(audio)
        }
        if (current.shelfKind) setCabinet(false)
        return
      }
      if (current.shelfKind) {
        dropFromShelf(current.shelfKind)
        return
      }
      onSceneTap(current.pieceId)
    }

    /** iPadOS отменил касание (жест системы, ладонь): просто отпустить — без тапа, броска и новой детали. */
    function onWindowCancel(event: PointerEvent): void {
      const current = presses.get(event.pointerId)
      if (!current) return
      presses.delete(event.pointerId)
      endHold(current)
      dropCarry(current)
      if (current.dragging && !current.pan) world.releaseGrab(undefined, current.pointerId)
      syncCabinetTarget()
    }

    function onSceneTap(id: number | null): void {
      if (finishPick(id)) return
      if (id === null) {
        hideMenu()
        return
      }
      const kind = world.kindOf(id)
      if (!kind) return
      if (world.isParked(id) && kind === 'ball') {
        hideMenu()
        remember()
        world.push(id)
        playWhee(audio)
        return
      }
      const action = tapAction(kind)
      if (action === 'menu') {
        if (menuId === id) hideMenu()
        else {
          showMenu(id)
        }
        return
      }
      if (menuId === id) armMenuTimer()
      else hideMenu()
      if (action === 'pop') popBalloon(id)
      else if (action === 'press') {
        world.pressButton(id)
        follow = true
      } else if (action === 'fire') firePiece(id)
      else if (action === 'toggle') togglePiece(id)
      else {
        const holder = world.cargoHolder(id)
        if (holder !== null) firePiece(holder)
        else greetPassenger(id)
      }
    }

    /** Тап по Мяу или Олли: подпрыгивает и здоровается. */
    function greetPassenger(id: number): void {
      world.nudge(id, { x: 0, y: -7 })
      greets.set(id, performance.now())
      playHello(audio)
    }

    function popBalloon(id: number): void {
      const view = world.pieces().find((v) => v.id === id)
      if (!view) return
      const step = remember()
      if (!world.pop(id)) {
        forget(step)
        return
      }
      if (menuId === id) hideMenu()
      playPop(audio)
      const at = toPx(view.x, view.y)
      burst(at.x, at.y, 10, view.color)
      syncCounts()
    }

    function updateTrails(views: readonly PieceView[]): void {
      if (trails.size === 0) return
      const now = performance.now()
      for (const [id, trail] of trails) {
        const view = views.find((v) => v.id === id)
        if (!view || now > trail.until) {
          trails.delete(id)
          continue
        }
        trail.points.push({ x: view.x, y: view.y })
        if (trail.points.length > TRAIL_POINTS) trail.points.shift()
      }
    }

    /** Конфетти «ура!» или клочки лопнувшего шарика (в пикселях комнаты). */
    function burst(x: number, y: number, count: number, color: string | null, spread = 60): void {
      for (let i = 0; i < count; i += 1) {
        const bit = document.createElement('span')
        bit.className = 'shape-build__confetti'
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.4
        const dist = spread * (1 + Math.random() * 1.15)
        bit.style.left = `${x}px`
        bit.style.top = `${y}px`
        bit.style.setProperty('--dx', `${Math.cos(a) * dist}px`)
        bit.style.setProperty('--dy', `${Math.sin(a) * dist - 30}px`)
        bit.style.setProperty('--rot', `${Math.round(Math.random() * 540 - 270)}deg`)
        bit.style.setProperty('--c', color ?? CONFETTI_COLORS[i % CONFETTI_COLORS.length]!)
        fx.append(bit)
        later(() => bit.remove(), 1100)
      }
    }

    // ── Рука-подсказка ──
    function coachTick(): void {
      if (presses.size > 0 || overlayOpen() || performance.now() < handBusyUntil) return
      const hint = coach.due()
      if (!hint) return
      const plan = hintPlan(hint)
      if (!plan) {
        coach.skip()
        return
      }
      coach.shown()
      playHand(plan)
    }

    function centerOf(el: HTMLElement): Pt | null {
      const r = rootEl.getBoundingClientRect()
      const b = el.getBoundingClientRect()
      if (b.width <= 0) return null
      return { x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top }
    }

    function findPiece(prefer: readonly PieceKind[]): PieceView | null {
      const views = world.pieces()
      for (const kind of prefer) {
        const found = views.find((v) => v.kind === kind)
        if (found) return found
      }
      return views.find((v) => !getPieceSpec(v.kind).fixed) ?? null
    }

    function px(view: PieceView): Pt {
      return toPx(view.x, view.y)
    }

    function shelfPlan(): HandPlan | null {
      const visible = [...shelfButtons.values()].filter((item) => !item.hidden)
      const target =
        rootEl.dataset.cabinet === 'open' ? visible.find((item) => item.dataset.kind === 'cube') ?? visible[0] : handle
      const at = target instanceof HTMLElement ? centerOf(target) : null
      return at ? { from: at } : null
    }

    function dragPlan(view: PieceView | null, dx: number, dy: number): HandPlan | null {
      if (!view) return shelfPlan()
      const from = px(view)
      const to = {
        x: Math.min(Math.max(from.x + dx, 40), freeRightPx() - 40),
        y: Math.min(Math.max(from.y + dy, ceilingPx + 40), viewH - 40),
      }
      return { from, to }
    }

    /** «Толкни мяч»: ждёт на горке — тап по нему; иначе — затащить мяч на верх горки. */
    function pushPlan(): HandPlan | null {
      const views = world.pieces()
      const waiting = parkedBall !== null ? views.find((v) => v.id === parkedBall) : undefined
      if (waiting) return { from: px(waiting) }
      const ramp = views.find((v) => v.kind === 'ramp')
      const ball = views.find((v) => v.kind === 'ball')
      if (!ramp || !ball) return null
      const b = world.boundsOf(ramp.id)
      if (!b) return null
      const highX = ramp.flip ? b.x1 - 0.5 : b.x0 + 0.5
      return { from: px(ball), to: toPx(highX, b.y0 - 0.7) }
    }

    /** «Поставь кубик на башню»: самый низкий блок — на верх самого высокого. */
    function stackPlan(): HandPlan | null {
      const blocks = world
        .pieces()
        .filter((v) => (BLOCK_KINDS as readonly string[]).includes(v.kind) && v.kind !== 'ramp')
        .map((v) => ({ v, b: world.boundsOf(v.id) }))
        .filter((e): e is { v: PieceView; b: NonNullable<typeof e.b> } => e.b !== null)
      if (blocks.length < 2) return null
      const top = blocks.reduce((a, c) => (c.b.y0 < a.b.y0 ? c : a))
      const low = blocks.filter((e) => e !== top).reduce((a, c) => (c.b.y1 > a.b.y1 || (c.b.y1 === a.b.y1 && c.b.y0 > a.b.y0) ? c : a))
      const to = toPx(top.v.x, top.b.y0 - 0.7)
      return { from: px(low.v), to: { x: to.x, y: Math.max(ceilingPx + 40, to.y) } }
    }

    /** «Перетащи шарик на деталь»: к ближайшей детали. */
    function balloonPlan(): HandPlan | null {
      const views = world.pieces()
      const balloon = views.find((v) => v.kind === 'balloon')
      if (!balloon) return null
      let best: PieceView | null = null
      for (const v of views) {
        if (v.kind === 'balloon' || getPieceSpec(v.kind).fixed || v.kind === 'wrecking') continue
        if (!best || Math.hypot(v.x - balloon.x, v.y - balloon.y) < Math.hypot(best.x - balloon.x, best.y - balloon.y)) best = v
      }
      if (!best) return null
      const b = world.boundsOf(best.id)
      return { from: px(balloon), to: toPx(best.x, (b?.y0 ?? best.y) - 0.2) }
    }

    function hintPlan(hint: HintId): HandPlan | null {
      switch (hint) {
        case 'push':
          return pushPlan()
        case 'drag':
          return dragPlan(findPiece(['ball', 'cube']), -150, -90)
        case 'stack':
          return stackPlan()
        case 'shelf':
          return shelfPlan()
        case 'boom': {
          const at = centerOf(boomBtn)
          return at ? { from: at } : null
        }
        case 'wand':
          return dragPlan(findPiece(['cube', 'ball']), 0, -170)
        case 'gravity':
          return dragPlan(findPiece(['ball', 'cube']), 170, -130)
        case 'photo': {
          const at = centerOf(moreBtn)
          return at ? { from: at } : null
        }
        case 'wrecking':
          return dragPlan(findPiece(['wrecking']), -190, -30)
        case 'hoop': {
          const hoop = findPiece(['hoop'])
          const ball = world.pieces().find((v) => v.kind === 'ball')
          if (!hoop || hoop.kind !== 'hoop') return null
          const rim = px(hoop)
          if (!ball) return { from: rim }
          return { from: px(ball), to: { x: rim.x, y: rim.y - 70 } }
        }
        case 'balloon':
          return balloonPlan()
        case 'fan': {
          const view = world.pieces().find((v) => v.kind === 'fan')
          return view ? { from: px(view) } : null
        }
        case 'hold': {
          const views = world.pieces().filter((v) => isLive(v.kind))
          const view = views[views.length - 1]
          return view ? { from: px(view), hold: true } : null
        }
        default:
          return null
      }
    }

    function playHand(plan: HandPlan): void {
      if (plan.hold) {
        playHoldHand(plan.from)
        return
      }
      const duration = plan.to ? 1900 : 1500
      handBusyUntil = performance.now() + duration + 200
      if (typeof hand.animate !== 'function') return
      handAnim?.cancel()
      hand.hidden = false
      const at = (p: Pt, s = 1): string => `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) scale(${s})`
      const { from, to } = plan
      let frames: Keyframe[]
      if (reduceMotion) {
        frames = [
          { transform: at(from), opacity: 0 },
          { transform: at(from), opacity: 1, offset: 0.2 },
          { transform: at(from), opacity: 1, offset: 0.8 },
          { transform: at(from), opacity: 0 },
        ]
      } else if (to) {
        frames = [
          { transform: at(from), opacity: 0 },
          { transform: at(from), opacity: 1, offset: 0.15 },
          { transform: at(from, 0.88), opacity: 1, offset: 0.25 },
          { transform: at(to, 0.88), opacity: 1, offset: 0.75 },
          { transform: at(to), opacity: 1, offset: 0.85 },
          { transform: at(to), opacity: 0 },
        ]
      } else {
        const lift = { x: from.x + 18, y: from.y + 18 }
        frames = [
          { transform: at(lift), opacity: 0 },
          { transform: at(lift), opacity: 1, offset: 0.2 },
          { transform: at(from, 0.85), opacity: 1, offset: 0.4 },
          { transform: at(lift), opacity: 1, offset: 0.55 },
          { transform: at(from, 0.85), opacity: 1, offset: 0.7 },
          { transform: at(lift), opacity: 0 },
        ]
      }
      handAnim = hand.animate(frames, { duration, easing: 'ease-in-out' })
      handAnim.onfinish = () => {
        hand.hidden = true
        handAnim = null
      }
    }

    /** «Подержи механизм»: рука нажала и держит, под пальцем растёт кружок. */
    function playHoldHand(from: Pt): void {
      const duration = 2200
      handBusyUntil = performance.now() + duration + 200
      if (typeof hand.animate !== 'function') return
      handAnim?.cancel()
      hand.hidden = false
      const at = (p: Pt, s = 1): string => `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) scale(${s})`
      const lift = { x: from.x + 18, y: from.y + 18 }
      handAnim = hand.animate(
        [
          { transform: at(lift), opacity: 0 },
          { transform: at(lift), opacity: 1, offset: 0.15 },
          { transform: at(from, 0.85), opacity: 1, offset: 0.28 },
          { transform: at(from, 0.85), opacity: 1, offset: 0.8 },
          { transform: at(lift), opacity: 0 },
        ],
        { duration, easing: 'ease-in-out' },
      )
      handAnim.onfinish = () => {
        hand.hidden = true
        handAnim = null
      }
      later(() => {
        if (hand.hidden) return
        const ring = document.createElement('div')
        ring.className = 'shape-build__hold is-demo'
        ring.setAttribute('aria-hidden', 'true')
        ring.style.left = `${from.x}px`
        ring.style.top = `${from.y}px`
        ring.style.setProperty('--hold-ms', '1000ms')
        rootEl.append(ring)
        later(() => ring.remove(), 1150)
      }, duration * 0.28)
    }

    function hideHand(): void {
      handAnim?.cancel()
      handAnim = null
      hand.hidden = true
      handBusyUntil = 0
      rootEl.querySelectorAll('.shape-build__hold.is-demo').forEach((ring) => ring.remove())
    }

    // ── Стартовая сцена: мяч ждёт на горке, рядом шаткая башенка ──
    /** Первый вход (пустая комната): мяч ждёт на горке, рядом шаткая башенка. */
    function buildStarter(): void {
      const seen = visibleRoom()
      const width = seen.right - seen.left
      const rampX = seen.left + width * 0.26
      world.add('ramp', rampX, floorU - 0.6)
      parkedBall = world.add('ball', rampX - 0.91, floorU - 1.6, { parked: true })
      rootEl.dataset.ball = 'parked'
      const towerX = Math.max(seen.left + width * 0.6, rampX + 4)
      for (let i = 0; i < 3; i += 1) world.add('cube', towerX, floorU - 0.6 - i * 1.2, { loose: true })
      syncCounts()
    }

    /** Комната снова начального размера, камера — как при входе. */
    function resetRoom(): void {
      room = { ...startRoom }
      applyRoom()
      camTween = null
      savedView = null
      setCam({ x: startRoom.left, y: 0, k: baseScale })
      syncRoomButton()
    }

    /** «Заново»: комната пустеет дочиста, первая постройка больше не появляется (решение владельца 02.10.2026). */
    async function askClear(): Promise<void> {
      if (world.count() === 0) {
        resetRoom()
        persist()
        return
      }
      coach.setPaused(true)
      const choice = await askChoice(rootEl, 'Убрать всё?', [
        { id: 'yes', label: 'Убрать' },
        { id: 'no', label: 'Оставить' },
      ])
      coach.setPaused(false)
      if (choice !== 'yes' || !alive) return
      dropAllPresses()
      endPick()
      remember()
      flyHome(world.pieces())
      world.clear()
      parkedBall = null
      rootEl.dataset.ball = 'rolling'
      resetRoom()
      hideMenu()
      trails.clear()
      setWand(false, false)
      setGravityOff(false, false)
      playWhoosh(audio)
      syncCounts()
      persist()
    }

    // ── Фото и галерея ──
    async function takePhoto(): Promise<void> {
      const shot = document.createElement('canvas')
      const w = Math.min(1600, Math.round(viewW * dpr))
      const k = w / (viewW * dpr)
      shot.width = w
      shot.height = Math.round(viewH * dpr * k)
      const ctx = shot.getContext('2d')
      if (!ctx) return
      ctx.drawImage(roomCanvas, 0, 0, shot.width, shot.height)
      ctx.drawImage(scene, 0, 0, shot.width, shot.height)
      playShutter(audio)
      flash.classList.remove('is-on')
      void flash.offsetWidth
      flash.classList.add('is-on')
      const blob = await new Promise<Blob | null>((resolve) => shot.toBlob(resolve, 'image/jpeg', 0.86))
      if (!blob || !alive) return
      try {
        await saveSandboxPhoto(blob)
      } catch {
        playSoftMiss(audio)
        return
      }
      if (!alive) return
      flySnap(shot)
      coach.firstUse('photo')
    }

    /** Снимок появляется по центру и улетает в «Ещё»; тап по нему — сразу «Галерея». */
    function flySnap(shot: HTMLCanvasElement): void {
      const total = SNAP_SHOW_MS + SNAP_FLY_MS
      if (typeof shot.animate !== 'function') {
        wiggle(moreBtn)
        return
      }
      shot.className = 'shape-build__snap'
      shot.setAttribute('role', 'button')
      shot.setAttribute('aria-label', 'Открыть галерею')
      rootEl.append(shot)
      const w = Math.min(viewW * 0.36, 360)
      const h = (w * shot.height) / Math.max(1, shot.width)
      shot.style.width = `${w}px`
      shot.style.height = `${h}px`
      const cx = viewW / 2 - w / 2
      const cy = viewH / 2 - h / 2
      const target = centerOf(moreBtn) ?? { x: viewW - 60, y: 40 }
      const at = (x: number, y: number, s: number): string => `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${s})`
      const keep = SNAP_SHOW_MS / total
      const frames: Keyframe[] = reduceMotion
        ? [
            { transform: at(cx, cy, 1), opacity: 1 },
            { transform: at(cx, cy, 1), opacity: 1, offset: keep },
            { transform: at(cx, cy, 1), opacity: 0 },
          ]
        : [
            { transform: at(cx, cy, 0.6), opacity: 0 },
            { transform: at(cx, cy, 1), opacity: 1, offset: 0.12 },
            { transform: at(cx, cy, 1), opacity: 1, offset: keep },
            { transform: at(target.x - w / 2, target.y - h / 2, 0.12), opacity: 0.7 },
          ]
      const anim = shot.animate(frames, { duration: total, easing: 'ease-in-out' })
      const done = (): void => {
        shot.remove()
        if (alive) wiggle(moreBtn)
      }
      anim.onfinish = done
      shot.addEventListener('pointerdown', (event) => {
        event.stopPropagation()
        anim.onfinish = null
        anim.cancel()
        shot.remove()
        void openGallery()
      })
    }

    function clearPhotoUrls(): void {
      for (const url of objectUrls) URL.revokeObjectURL(url)
      objectUrls.clear()
    }

    /** «Построить» из «Как играть»: комната очищается (шаг в «Отменить»), ставится пример. */
    function buildRecipe(recipe: Recipe): void {
      closeHowto()
      dropAllPresses()
      remember()
      flyHome(world.pieces())
      world.clear()
      hideMenu()
      trails.clear()
      setWand(false, false)
      setGravityOff(false, false)
      endPick()
      setCabinet(false)
      // Огромная машина раздвигает комнату вширь и вверх; камера показывает её целиком.
      const base = recipeRoom(recipe, startRoom, floorU)
      room = base
      applyRoom()
      const ids = placeRecipe(world, recipe, { cx: (base.left + base.right) / 2, floor: floorU, ceiling: base.top })
      parkedBall = ids.find((id) => world.isParked(id) && world.kindOf(id) === 'ball') ?? null
      rootEl.dataset.ball = parkedBall === null ? 'rolling' : 'parked'
      camTween = null
      savedView = null
      const fit = Math.min(baseScale, fitScale(frame0(), freeRightPx(false), viewH))
      setCam({ x: base.left, y: 0, k: fit })
      syncRoomButton()
      follow = true
      playSpawn(audio)
      syncCounts()
      recipeHint(recipe, ids)
    }

    /** Что делать дальше: «Пуск!», кнопка, мячик или шар — тост и рука. */
    function recipeHint(recipe: Recipe, ids: readonly number[]): void {
      const pieceOf = (kind: PieceKind): PieceView | undefined => {
        const id = ids.find((i) => world.kindOf(i) === kind)
        return id === undefined ? undefined : world.pieces().find((v) => v.id === id)
      }
      let text: string | null = null
      let target: (() => Pt | null) | null = null
      if (recipe.action === 'start') {
        text = 'Нажмите «Пуск!»'
        target = () => centerOf(startBtn)
        later(() => wiggle(startBtn), 600)
      } else if (recipe.action === 'press') {
        text = 'Нажмите на красную кнопку'
        target = () => {
          const v = pieceOf('button')
          return v ? px(v) : null
        }
      } else if (recipe.action === 'push') {
        text = 'Нажмите на мячик'
        target = () => {
          const v = parkedBall === null ? undefined : world.pieces().find((p) => p.id === parkedBall)
          return v ? px(v) : null
        }
      } else if (recipe.action === 'drag') {
        text = 'Оттяните шар и отпустите'
      }
      if (text) showToast(text)
      if (!target) return
      const at = target
      later(() => {
        const from = at()
        if (from && presses.size === 0 && !overlayOpen()) playHand({ from })
      }, 900)
    }

    function openHowto(): void {
      setMore(false)
      hideMenu()
      hideHand()
      fillHowto()
      fillLaws()
      fillRecipes()
      howto.hidden = false
      rootEl.dataset.view = 'howto'
      coach.setPaused(true)
    }

    function closeHowto(): void {
      howto.hidden = true
      delete rootEl.dataset.view
      coach.setPaused(false)
    }

    async function openGallery(): Promise<void> {
      dropAllPresses()
      hideMenu()
      hideHand()
      gallery.hidden = false
      rootEl.dataset.view = 'gallery'
      coach.setPaused(true)
      setGallerySelecting(false)
      await drawGallery()
    }

    function closeGallery(): void {
      gallery.hidden = true
      cancelPhotoPress()
      closeViewer()
      delete rootEl.dataset.view
      coach.setPaused(false)
      clearPhotoUrls()
      galleryGrid.replaceChildren()
    }

    async function drawGallery(): Promise<void> {
      try {
        photos = await listSandboxPhotos()
      } catch {
        photos = []
      }
      if (!alive || gallery.hidden) return
      clearPhotoUrls()
      galleryGrid.replaceChildren()
      galleryEmpty.hidden = photos.length > 0
      photoSelectToggle.hidden = photos.length === 0
      for (const photo of photos) {
        const card = document.createElement('button')
        card.type = 'button'
        card.className = 'shape-build__photo'
        card.dataset.photoId = photo.id
        card.setAttribute('aria-label', 'Фото постройки')
        const img = document.createElement('img')
        img.alt = ''
        img.decoding = 'async'
        const check = document.createElement('span')
        check.className = 'select-check'
        const date = document.createElement('span')
        date.className = 'shape-build__photo-date'
        date.textContent = photoStamp(photo.createdAt)
        card.append(img, check, date)
        card.classList.toggle('is-selected', photoSelected.has(photo.id))
        card.addEventListener('pointerdown', () => startPhotoPress(photo.id))
        card.addEventListener('pointerup', cancelPhotoPress)
        card.addEventListener('pointerleave', cancelPhotoPress)
        card.addEventListener('pointercancel', cancelPhotoPress)
        card.addEventListener('contextmenu', (event) => event.preventDefault())
        card.addEventListener('click', () => {
          if (photoPressFired) {
            photoPressFired = false
            return
          }
          onPhotoTap(photo.id, img.src)
        })
        galleryGrid.append(card)
        void getSandboxPhotoBlob(photo.id)
          .then((blob) => {
            if (!blob || !alive || gallery.hidden) return
            const url = URL.createObjectURL(blob)
            objectUrls.add(url)
            img.src = url
          })
          .catch(() => undefined)
      }
      syncGallerySelection()
    }

    function photoStamp(at: number): string {
      const d = new Date(at)
      const two = (n: number): string => String(n).padStart(2, '0')
      return `${two(d.getDate())}.${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`
    }

    /** Долгое нажатие на фото — сразу режим «Выбрать» с этим фото. */
    function startPhotoPress(id: string): void {
      cancelPhotoPress()
      photoPressFired = false
      if (gallerySelecting) return
      photoPressTimer = later(() => {
        photoPressTimer = 0
        photoPressFired = true
        setGallerySelecting(true)
        photoSelected.add(id)
        syncGallerySelection()
        playClick(audio)
      }, HOLD_MENU_MS)
    }

    function cancelPhotoPress(): void {
      if (!photoPressTimer) return
      window.clearTimeout(photoPressTimer)
      timers.delete(photoPressTimer)
      photoPressTimer = 0
    }

    function onPhotoTap(id: string, src: string): void {
      if (gallerySelecting) {
        if (photoSelected.has(id)) photoSelected.delete(id)
        else photoSelected.add(id)
        syncGallerySelection()
        return
      }
      if (!src) return
      viewerPhotoId = id
      viewerImg.src = src
      viewer.hidden = false
    }

    function closeViewer(): void {
      viewer.hidden = true
      viewerPhotoId = null
    }

    function downloadViewerPhoto(): void {
      const photo = photos.find((p) => p.id === viewerPhotoId)
      if (!photo || !viewerImg.src) return
      const link = document.createElement('a')
      link.href = viewerImg.src
      link.download = `postroyka-${photoStamp(photo.createdAt).replace(/[.: ]/g, '-')}.jpg`
      link.click()
    }

    async function deleteViewerPhoto(): Promise<void> {
      const id = viewerPhotoId
      if (!id) return
      const choice = await askChoice(rootEl, 'Удалить это фото?', [
        { id: 'yes', label: 'Удалить' },
        { id: 'no', label: 'Оставить' },
      ])
      if (choice !== 'yes' || !alive) return
      try {
        await deleteSandboxPhotos([id])
      } catch {
        playSoftMiss(audio)
      }
      closeViewer()
      await drawGallery()
    }

    function setGallerySelecting(on: boolean): void {
      gallerySelecting = on
      gallery.dataset.selecting = on ? '1' : '0'
      photoSelected.clear()
      photoSelectToggle.textContent = on ? 'Готово' : 'Выбрать'
      photoSelectToggle.classList.toggle('is-selected', on)
      gallerySelect.hidden = !on
      syncGallerySelection()
    }

    function syncGallerySelection(): void {
      galleryGrid.querySelectorAll<HTMLElement>('.shape-build__photo').forEach((card) => {
        const on = photoSelected.has(card.dataset.photoId ?? '')
        card.classList.toggle('is-selected', on)
        card.setAttribute('aria-label', gallerySelecting ? 'Выбрать фото' : 'Открыть фото постройки')
        if (gallerySelecting) card.setAttribute('aria-pressed', on ? 'true' : 'false')
        else card.removeAttribute('aria-pressed')
      })
      const count = photoSelected.size
      photoDelete.textContent = `Удалить (${count})`
      photoDelete.disabled = count === 0
      photoSelectAll.disabled = count === photos.length
      photoClearAll.disabled = count === 0
    }

    async function deletePhotos(): Promise<void> {
      const ids = [...photoSelected]
      if (ids.length === 0) return
      const word = ids.length === 1 ? 'это фото' : `фото: ${ids.length}`
      const choice = await askChoice(rootEl, `Удалить ${word}?`, [
        { id: 'yes', label: 'Удалить' },
        { id: 'no', label: 'Оставить' },
      ])
      if (choice !== 'yes' || !alive) return
      try {
        await deleteSandboxPhotos(ids)
      } catch {
        playSoftMiss(audio)
      }
      setGallerySelecting(false)
      await drawGallery()
    }

    // ── Подписки ──
    rootEl.addEventListener('pointerdown', onRootDownCapture, true)
    scene.addEventListener('pointerdown', onSceneDown)
    window.addEventListener('pointermove', onWindowMove)
    window.addEventListener('pointerup', onWindowUp)
    window.addEventListener('pointercancel', onWindowCancel)
    const onResize = (): void => layout()
    window.addEventListener('resize', onResize)
    const onHide = (): void => {
      if (document.visibilityState === 'hidden') persist()
    }
    window.addEventListener('pagehide', persist)
    document.addEventListener('visibilitychange', onHide)

    // Вход: своя постройка (и пустая после «Заново»); только самый первый вход — сцена с горкой и мячом.
    const stored = readRoomSave()
    if (stored) {
      layout()
      const saved = fitRoomSave(stored, { unitsH: roomUnitsH, floorFrac: FLOOR_FRAC, startTop: startRoom.top })
      room = { ...saved.room }
      layout()
      world.restore(saved.snap)
      parkedBall = world.pieces().find((v) => v.kind === 'ball' && world.isParked(v.id))?.id ?? null
      rootEl.dataset.ball = parkedBall === null ? 'rolling' : 'parked'
      syncCounts()
      coach.start({ push: parkedBall !== null })
    } else {
      layout()
      buildStarter()
      coach.start({ push: true })
    }
    rafId = requestFrame(frame)

    cleanup = () => {
      if (alive) persist()
      alive = false
      cancelFrame(rafId)
      for (const id of timers) window.clearTimeout(id)
      timers.clear()
      handAnim?.cancel()
      window.removeEventListener('pointermove', onWindowMove)
      window.removeEventListener('pointerup', onWindowUp)
      window.removeEventListener('pointercancel', onWindowCancel)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pagehide', persist)
      document.removeEventListener('visibilitychange', onHide)
      world.clear()
      clearPhotoUrls()
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
