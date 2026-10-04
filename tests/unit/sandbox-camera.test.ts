import { describe, expect, it } from 'vitest'
import {
  ROOM_GROW_LIMIT,
  clampCamera,
  edgeDirection,
  fitScale,
  growRoom,
  roomFrame,
  zoomAround,
  type Camera,
} from '../../src/games/shape-build/camera'

const VIEW = { w: 1024, h: 768 }
/** Комната ровно в экран: 14 «кубиков» в высоту, пол на 90%. */
const UNITS_H = 14
const BASE = VIEW.h / UNITS_H
const START = { left: 0, right: VIEW.w / BASE, top: 1.8 }
const TOP_PAD = 1.8

describe('Собери что угодно! — большая комната и камера', () => {
  it('комната в экран: камера стоит на месте, отдалить нельзя', () => {
    const frame = roomFrame(START, UNITS_H, TOP_PAD)
    expect(fitScale(frame, VIEW.w, VIEW.h)).toBeCloseTo(BASE)
    const cam = clampCamera({ x: 5, y: -3, k: BASE }, frame, VIEW.w, VIEW.h)
    expect(cam.x).toBeCloseTo(0)
    expect(cam.y).toBeCloseTo(0)
  })

  it('большая комната: камера ездит в пределах комнаты, «Вся комната» помещает всё', () => {
    const room = { left: -10, right: 50, top: -6 }
    const frame = roomFrame(room, UNITS_H, TOP_PAD)
    expect(frame.x0).toBe(-10)
    expect(frame.x1).toBe(50)
    expect(frame.y0).toBeCloseTo(-7.8)
    expect(frame.y1).toBe(UNITS_H)
    const far = clampCamera({ x: 100, y: 50, k: BASE }, frame, VIEW.w, VIEW.h)
    expect(far.x + VIEW.w / BASE).toBeCloseTo(50)
    expect(far.y + VIEW.h / BASE).toBeCloseTo(UNITS_H)
    const near = clampCamera({ x: -100, y: -100, k: BASE }, frame, VIEW.w, VIEW.h)
    expect(near.x).toBeCloseTo(-10)
    expect(near.y).toBeCloseTo(-7.8)
    const fit = fitScale(frame, VIEW.w, VIEW.h)
    const whole = clampCamera({ x: 0, y: 0, k: fit }, frame, VIEW.w, VIEW.h)
    expect(whole.x).toBeLessThanOrEqual(-10 + 1e-6)
    expect(whole.x + VIEW.w / fit).toBeGreaterThanOrEqual(50 - 1e-6)
    expect(whole.y + VIEW.h / fit).toBeCloseTo(UNITS_H)
  })

  it('щипок: точка под пальцами остаётся на месте', () => {
    const cam: Camera = { x: 3, y: 1, k: 50 }
    const next = zoomAround(cam, 1.5, 400, 300)
    expect(next.k).toBeCloseTo(75)
    const before = { x: cam.x + 400 / cam.k, y: cam.y + 300 / cam.k }
    const after = { x: next.x + 400 / next.k, y: next.y + 300 / next.k }
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })

  it('деталь у края экрана — камера едет туда; в середине — стоит', () => {
    const rect = { left: 0, top: 80, right: 800, bottom: 768 }
    expect(edgeDirection(400, 400, rect, 48)).toEqual({ x: 0, y: 0 })
    expect(edgeDirection(10, 400, rect, 48).x).toBeLessThan(0)
    expect(edgeDirection(790, 400, rect, 48).x).toBeGreaterThan(0)
    expect(edgeDirection(400, 90, rect, 48).y).toBeLessThan(0)
    expect(edgeDirection(400, 760, rect, 48).y).toBe(0)
  })

  it('комната растёт влево, вправо и вверх, но не бесконечно; вниз — пол', () => {
    const grown = growRoom(START, { x: 1, y: -1 }, 3, START, UNITS_H)
    expect(grown.right).toBeCloseTo(START.right + 3)
    expect(grown.top).toBeCloseTo(START.top - 3)
    expect(grown.left).toBe(0)
    const left = growRoom(START, { x: -1, y: 0 }, 2, START, UNITS_H)
    expect(left.left).toBeCloseTo(-2)
    let huge = START
    for (let i = 0; i < 500; i += 1) huge = growRoom(huge, { x: 1, y: -1 }, 1, START, UNITS_H)
    const startW = START.right - START.left
    expect(huge.right - huge.left).toBeCloseTo(startW * ROOM_GROW_LIMIT.width)
    expect(START.top - huge.top).toBeCloseTo(UNITS_H * ROOM_GROW_LIMIT.up)
  })
})
