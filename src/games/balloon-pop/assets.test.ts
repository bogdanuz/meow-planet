import path from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  balloonMeowPoseForEvent,
  balloonPngUrl,
  balloonSkyUrl,
  meowPresenterUrl,
} from './assets'
import { BALLOON_FIELD_COLORS } from './logic'

async function countStringNearWhite(color: string): Promise<number> {
  const file = path.join('public', 'assets', 'games', 'balloon-pop', `balloon-${color}.png`)
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  })
  const startY = Math.floor(info.height * 0.68)
  let leftover = 0
  for (let y = startY; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * 4
      if (data[i + 3] < 80) continue
      const minc = Math.min(data[i], data[i + 1], data[i + 2])
      const maxc = Math.max(data[i], data[i + 1], data[i + 2])
      if (minc >= 220 && maxc - minc <= 28) leftover += 1
    }
  }
  return leftover
}

describe('balloon-pop assets', () => {
  it('небо и 5 цветов шариков — публичные PNG/WebP', () => {
    expect(balloonSkyUrl()).toContain('balloon-sky-bg.webp')
    expect(balloonSkyUrl()).not.toContain('?v=')
    for (const color of BALLOON_FIELD_COLORS) {
      expect(balloonPngUrl(color)).toContain(`balloon-${color}.png`)
    }
  })

  it('позы Мяу: покой / похвала / промах', () => {
    expect(meowPresenterUrl('idle')).toContain('meow-presenter-idle.png')
    expect(meowPresenterUrl('happy')).toContain('meow-presenter-happy.png')
    expect(meowPresenterUrl('miss')).toContain('meow-presenter-miss.png')
    expect(balloonMeowPoseForEvent('idle')).toBe('idle')
    expect(balloonMeowPoseForEvent('praise')).toBe('happy')
    expect(balloonMeowPoseForEvent('task')).toBe('happy')
    expect(balloonMeowPoseForEvent('miss')).toBe('miss')
  })

  it('на нитке нет белого кусочка фона', async () => {
    for (const color of BALLOON_FIELD_COLORS) {
      expect(await countStringNearWhite(color), color).toBe(0)
    }
  })
})
