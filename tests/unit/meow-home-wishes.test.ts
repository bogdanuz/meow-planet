import { describe, expect, it } from 'vitest'
import { createWishes, WISH_GIVE_UP_MS, WISH_GAP_MS, WISH_ROOM } from '../../src/games/meow-home/wishes'

const start = (opts: { potty?: boolean; enabled?: boolean; night?: boolean } = {}) =>
  createWishes({ potty: opts.potty ?? true, enabled: opts.enabled ?? true, rng: () => 0, now: 0, night: opts.night ?? false })

describe('«В гости»: желания', () => {
  it('сразу после входа ничего не просит; первое желание — не раньше, чем через паузу', () => {
    const w = start()
    expect(w.tick(1000)).toBeNull()
    expect(w.current()).toBeNull()
    expect(w.tick(WISH_GAP_MS + 1)).not.toBeNull()
  })

  it('одно желание за раз; не помогли — через ~20 с перестаёт просить, без грусти', () => {
    const w = start()
    const first = w.tick(WISH_GAP_MS + 1)!
    expect(w.tick(WISH_GAP_MS + 2)).toBeNull()
    expect(w.current()).toBe(first)
    w.tick(WISH_GAP_MS + 1 + WISH_GIVE_UP_MS + 1)
    expect(w.current()).toBeNull()
  })

  it('помогли — желание исполнено, следующее не раньше чем через минуту', () => {
    const w = start()
    const t = WISH_GAP_MS + 1
    w.trigger('hungry', t)
    expect(w.fulfil('eat', t + 100)).toBe('hungry')
    expect(w.current()).toBeNull()
    expect(w.tick(t + 200)).toBeNull()
    expect(w.tick(t + 100 + WISH_GAP_MS + 1)).not.toBeNull()
  })

  it('любая забота принимается; не та забота — желание остаётся', () => {
    const w = start()
    w.trigger('sleepy', 0)
    expect(w.fulfil('eat', 10)).toBeNull()
    expect(w.current()).toBe('sleepy')
    expect(w.fulfil('sleep', 20)).toBe('sleepy')
  })

  it('события дома: после улицы с грязными лапками и холодом желания встают в очередь', () => {
    const w = start()
    w.trigger('dirty', 0)
    w.trigger('cold', 0)
    expect(w.current()).toBe('dirty')
    expect(w.fulfil('wash-paws', 10)).toBe('dirty')
    expect(w.tick(20)).toBe('cold')
  })

  it('событие после еды (почистить зубки) показывается без минутной паузы', () => {
    const w = start()
    w.trigger('teeth', 0)
    expect(w.current()).toBe('teeth')
  })

  it('горшок выключен в настройках — не просится на горшок', () => {
    const w = createWishes({ potty: false, enabled: true, rng: () => 0.99, now: 0, night: false })
    const seen = new Set<string>()
    let t = 0
    for (let i = 0; i < 40; i++) {
      t += WISH_GAP_MS + WISH_GIVE_UP_MS + 2
      const wish = w.tick(t)
      if (wish) seen.add(wish)
    }
    expect(seen.has('potty')).toBe(false)
    w.trigger('potty', t)
    expect(w.current()).toBeNull()
  })

  it('желания выключены в настройках — ничего не просит сам, но события после улицы тоже молчат', () => {
    const w = start({ enabled: false })
    expect(w.tick(WISH_GAP_MS * 5)).toBeNull()
    w.trigger('dirty', 0)
    expect(w.current()).toBeNull()
  })

  it('ночью сам просится спать', () => {
    const w = start({ night: true })
    expect(w.tick(WISH_GAP_MS + 1)).toBe('sleepy')
  })

  it('у каждого желания есть комната', () => {
    expect(WISH_ROOM.hungry).toBe('kitchen')
    expect(WISH_ROOM.sleepy).toBe('bedroom')
    expect(WISH_ROOM.dirty).toBe('bath')
    expect(WISH_ROOM.teeth).toBe('bath')
    expect(WISH_ROOM.potty).toBe('bath')
    expect(WISH_ROOM.messy).toBe('kitchen')
    expect(WISH_ROOM.play).toBe('bedroom')
    expect(WISH_ROOM.cold).toBe('kitchen')
  })
})
