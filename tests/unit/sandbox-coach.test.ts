import { describe, expect, it } from 'vitest'
import { COACH_IDLE_MS, SandboxCoach } from '../../src/games/shape-build/coach'

function makeCoach(seen = new Set<string>()) {
  let now = 0
  const coach = new SandboxCoach({ now: () => now, seen })
  return {
    coach,
    at(ms: number) {
      now = ms
    },
  }
}

describe('SandboxCoach: рука-подсказка', () => {
  it('на входе со стартовой сценой сначала «толкни мяч», потом «перетащи»', () => {
    const { coach, at } = makeCoach()
    coach.start({ push: true })
    at(300)
    expect(coach.due()).toBeNull()
    at(900)
    expect(coach.due()).toBe('push')
    coach.shown()
    at(2000)
    expect(coach.due()).toBeNull()
    at(6000)
    expect(coach.due()).toBe('push')
    coach.pushed()
    expect(coach.due()).toBe('drag')
    coach.shown()
    coach.dragged()
    at(9000)
    expect(coach.due()).toBeNull()
  })

  it('без мяча на горке вводная — сразу «перетащи»', () => {
    const { coach, at } = makeCoach()
    coach.start()
    at(900)
    expect(coach.due()).toBe('drag')
  })

  it('тап по шкафу тоже значит «понял»: вводная уходит совсем', () => {
    const { coach, at } = makeCoach()
    coach.start({ push: true })
    at(900)
    coach.took()
    expect(coach.due()).toBeNull()
    at(900 + COACH_IDLE_MS - 100)
    expect(coach.due()).toBeNull()
  })

  it('просто касание без переноса не отменяет вводную', () => {
    const { coach, at } = makeCoach()
    coach.start()
    at(900)
    coach.touched()
    expect(coach.due()).toBe('drag')
  })

  it('после вводной — «приглашения» только после ~10 с без касаний, по очереди', () => {
    const { coach, at } = makeCoach()
    coach.start()
    at(500)
    coach.dragged()
    at(500 + COACH_IDLE_MS - 100)
    expect(coach.due()).toBeNull()
    const order: string[] = []
    let t = 500
    for (let i = 0; i < 5; i += 1) {
      t += COACH_IDLE_MS + 10
      at(t)
      order.push(coach.due() ?? 'none')
      coach.shown()
    }
    expect(order).toEqual(['push', 'stack', 'shelf', 'boom', 'push'])
  })

  it('приглашение нельзя показать — сразу следующее, без новой паузы', () => {
    const { coach, at } = makeCoach()
    coach.start()
    coach.dragged()
    at(COACH_IDLE_MS + 10)
    expect(coach.due()).toBe('push')
    coach.skip()
    expect(coach.due()).toBe('stack')
  })

  it('любое касание откладывает приглашение', () => {
    const { coach, at } = makeCoach()
    coach.start()
    coach.dragged()
    at(COACH_IDLE_MS - 1000)
    coach.touched()
    at(COACH_IDLE_MS + 500)
    expect(coach.due()).toBeNull()
    at(COACH_IDLE_MS * 2)
    expect(coach.due()).toBe('push')
  })

  it('первый раз инструмент или предмет — короткая подсказка сразу, второй раз — нет', () => {
    const { coach, at } = makeCoach()
    coach.start()
    coach.dragged()
    at(1000)
    coach.firstUse('wand')
    expect(coach.due()).toBe('wand')
    coach.shown()
    expect(coach.due()).toBeNull()
    coach.firstUse('wand')
    expect(coach.due()).toBeNull()
  })

  it('«подержи механизм» не нужна, если ребёнок сам открыл меню удержанием', () => {
    const { coach } = makeCoach()
    coach.start()
    coach.dragged()
    coach.firstUse('hold')
    expect(coach.due()).toBe('hold')
    coach.held()
    expect(coach.due()).toBeNull()
    coach.firstUse('hold')
    expect(coach.due()).toBeNull()
  })

  it('подсказку инструмента, которую нельзя показать, больше не ждём', () => {
    const { coach } = makeCoach()
    coach.start()
    coach.dragged()
    coach.firstUse('hoop')
    expect(coach.due()).toBe('hoop')
    coach.skip()
    expect(coach.due()).toBeNull()
    coach.firstUse('hoop')
    expect(coach.due()).toBeNull()
  })

  it('увиденные подсказки помнятся между заходами в игру', () => {
    const seen = new Set<string>()
    const first = makeCoach(seen)
    first.coach.start()
    first.coach.dragged()
    first.coach.firstUse('fan')
    first.coach.shown()
    const second = makeCoach(seen)
    second.coach.start()
    second.coach.dragged()
    second.coach.firstUse('fan')
    expect(second.coach.due()).toBeNull()
  })

  it('подсказку инструмента не перебивает вводная', () => {
    const { coach, at } = makeCoach()
    coach.start({ push: true })
    at(900)
    coach.firstUse('balloon')
    expect(coach.due()).toBe('balloon')
  })

  it('выключенный (галерея открыта) ничего не показывает', () => {
    const { coach, at } = makeCoach()
    coach.start()
    coach.setPaused(true)
    at(5000)
    expect(coach.due()).toBeNull()
    coach.setPaused(false)
    expect(coach.due()).toBe('drag')
  })
})
