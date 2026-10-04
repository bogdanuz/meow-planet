import { describe, expect, it } from 'vitest'
import { SandboxWorld } from '../../src/games/shape-build/physics'
import { getPieceSpec } from '../../src/games/shape-build/pieces'
import {
  ROOM_SAVE_KEY,
  clearRoomSave,
  fitRoomSave,
  parseRoomSave,
  readRoomSave,
  writeRoomSave,
  type RoomSave,
} from '../../src/games/shape-build/room-save'

const FLOOR = 12.6

function makeWorld(): SandboxWorld {
  return new SandboxWorld({
    width: 30,
    height: 14,
    floorY: FLOOR,
    ceilingY: 1.4,
    realistic: false,
    autoStraight: true,
    sticky: true,
  })
}

function memoryStorage(): Storage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (i: number) => [...data.keys()][i] ?? null,
    removeItem: (key: string) => void data.delete(key),
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}

function sampleSave(): RoomSave {
  const world = makeWorld()
  const button = world.add('button', 4, FLOOR - getPieceSpec('button').h / 2)
  world.add('lamp', 7, FLOOR - getPieceSpec('lamp').h / 2)
  world.add('shelf', 12, 6, { len: 1.5 })
  world.add('cube', 18, FLOOR - 0.6, { pinned: true })
  world.add('balloon', 18, 9)
  expect(world.wiresOf(button)).toHaveLength(1)
  return { room: { left: -4, right: 40, top: -3 }, snap: world.snapshot() }
}

describe('Собери что угодно! — постройка сохраняется при выходе', () => {
  it('записали и прочитали: детали, провода, прибитое, длина полки и размер комнаты', () => {
    const storage = memoryStorage()
    const save = sampleSave()
    writeRoomSave(save, storage)
    expect(storage.data.has(ROOM_SAVE_KEY)).toBe(true)
    const back = readRoomSave(storage)
    expect(back).not.toBeNull()
    expect(back!.room).toEqual({ left: -4, right: 40, top: -3 })
    const world = makeWorld()
    world.restore(back!.snap)
    const views = world.pieces()
    expect(views.map((v) => v.kind).sort()).toEqual(['balloon', 'button', 'cube', 'lamp', 'shelf'])
    expect(views.find((v) => v.kind === 'shelf')!.len).toBeCloseTo(1.5)
    expect(views.find((v) => v.kind === 'cube')!.pinned).toBe(true)
    const button = views.find((v) => v.kind === 'button')!.id
    const lamp = views.find((v) => v.kind === 'lamp')!.id
    expect(world.wiresOf(button)).toEqual([lamp])
  })

  it('пустая комната после «Заново» тоже запоминается: при входе не появится первая постройка', () => {
    const storage = memoryStorage()
    writeRoomSave(sampleSave(), storage)
    writeRoomSave({ room: { left: 0, right: 30, top: 1.4 }, snap: makeWorld().snapshot() }, storage)
    const back = readRoomSave(storage)
    expect(back).not.toBeNull()
    expect(back!.snap.pieces).toEqual([])
  })

  it('сброс сохранения — как первый вход', () => {
    const storage = memoryStorage()
    writeRoomSave(sampleSave(), storage)
    clearRoomSave(storage)
    expect(readRoomSave(storage)).toBeNull()
  })

  it('испорченное или чужое сохранение не ломает игру — просто пустая комната', () => {
    expect(parseRoomSave(null)).toBeNull()
    expect(parseRoomSave('не json')).toBeNull()
    expect(parseRoomSave('{"v":99}')).toBeNull()
    const good = JSON.parse(JSON.stringify({ v: 1, ...sampleSave() }))
    const badKind = structuredClone(good)
    badKind.snap.pieces[0].kind = 'pillow'
    expect(parseRoomSave(JSON.stringify(badKind))).toBeNull()
    const badColor = structuredClone(good)
    badColor.snap.pieces[0].color = '<img src=x onerror=alert(1)>'
    expect(parseRoomSave(JSON.stringify(badColor))).toBeNull()
    const badNumber = structuredClone(good)
    badNumber.snap.pieces[0].x = 'NaN'
    expect(parseRoomSave(JSON.stringify(badNumber))).toBeNull()
    const badLink = structuredClone(good)
    badLink.snap.wires = [[0, 99]]
    expect(parseRoomSave(JSON.stringify(badLink))).toBeNull()
    expect(parseRoomSave(JSON.stringify(good))).not.toBeNull()
  })

  it('взрослый сменил «Размер деталей»: постройка стоит на новом полу, а не висит под ним', () => {
    const storage = memoryStorage()
    writeRoomSave({ ...sampleSave(), unitsH: 18 }, storage)
    const back = readRoomSave(storage)!
    expect(back.unitsH).toBe(18)
    const floorOld = 18 * 0.9
    const floorNew = 11.5 * 0.9
    const moved = fitRoomSave(back, { unitsH: 11.5, floorFrac: 0.9, startTop: 1.2 })
    const dy = floorNew - floorOld
    back.snap.pieces.forEach((p, i) => {
      expect(moved.snap.pieces[i]!.y).toBeCloseTo(p.y + dy)
      expect(moved.snap.pieces[i]!.x).toBeCloseTo(p.x)
    })
    expect(moved.room.top).toBeCloseTo(-3 + dy)
    expect(moved.unitsH).toBe(11.5)
    const bigger = fitRoomSave({ ...back, unitsH: 11.5, room: { left: 0, right: 30, top: 1 } }, { unitsH: 18, floorFrac: 0.9, startTop: 1.2 })
    expect(bigger.room.top).toBeCloseTo(1.2)
  })

  it('тот же размер деталей или старое сохранение без него — ничего не двигаем', () => {
    const save = sampleSave()
    expect(fitRoomSave(save, { unitsH: 14, floorFrac: 0.9, startTop: 1.2 })).toBe(save)
    const same = { ...save, unitsH: 14 }
    expect(fitRoomSave(same, { unitsH: 14, floorFrac: 0.9, startTop: 1.2 })).toBe(same)
  })

  it('хранилище недоступно (приватный режим) — молча без сохранения', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
      removeItem: () => {
        throw new Error('denied')
      },
    }
    expect(readRoomSave(broken)).toBeNull()
    expect(() => writeRoomSave(sampleSave(), broken)).not.toThrow()
    expect(() => clearRoomSave(broken)).not.toThrow()
  })
})
