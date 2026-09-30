import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SOUND_WORLD_ENABLED_IDS } from './enabled-ids'
import {
  cardArtUrl,
  instrumentPlayUrl,
  letterArtFileName,
  letterArtUrl,
} from './assets'

const ROOT = path.join('public', 'assets', 'games', 'sound-world')

describe('sound-world card art', () => {
  it('карточки и экраны инструментов ведут в public PNG', () => {
    expect(cardArtUrl('cat')).toContain('cards/cat.png')
    expect(cardArtUrl('cat')).not.toContain('?v=')
    expect(instrumentPlayUrl('drum')).toContain('play/drum.png')
    expect(letterArtFileName('ru-А')).toBe('ru-01.png')
    expect(letterArtFileName('ru-Я')).toBe('ru-33.png')
    expect(letterArtFileName('en-A')).toBe('en-A.png')
    expect(letterArtUrl('en-Z')).toContain('letters/en-Z.png')
    expect(letterArtFileName('ru-?')).toBe('ru-?.png')
    expect(letterArtFileName('other')).toBe('other.png')
  })

  it('все включённые карточки и 33+26 букв лежат на диске', () => {
    for (const id of SOUND_WORLD_ENABLED_IDS) {
      expect(existsSync(path.join(ROOT, 'cards', `${id}.png`)), id).toBe(true)
    }
    for (const id of ['drum', 'maracas', 'bell', 'piano', 'guitar']) {
      expect(existsSync(path.join(ROOT, 'play', `${id}.png`)), id).toBe(true)
    }
    for (const id of [
      'drum-snare',
      'drum-kick',
      'drum-tom',
      'drum-floor',
      'maraca-left',
      'maraca-right',
      'piano-body',
      'piano-lid',
    ]) {
      expect(existsSync(path.join(ROOT, 'play', `${id}.png`)), id).toBe(true)
    }
    for (let i = 1; i <= 7; i += 1) {
      expect(existsSync(path.join(ROOT, 'play', `key-${i}.png`)), `key-${i}`).toBe(true)
    }
    for (let i = 1; i <= 33; i += 1) {
      const name = `ru-${String(i).padStart(2, '0')}.png`
      expect(existsSync(path.join(ROOT, 'letters', name)), name).toBe(true)
    }
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(existsSync(path.join(ROOT, 'letters', `en-${letter}.png`)), letter).toBe(
        true,
      )
    }
  })

  it('слои пианино лежат на одном холсте и не обрезаны по отдельности', async () => {
    const sharp = (await import('sharp')).default
    const layers = [
      'piano-body.png',
      'piano-lid.png',
      ...Array.from({ length: 7 }, (_, index) => `key-${index + 1}.png`),
    ]
    for (const name of layers) {
      const meta = await sharp(path.join(ROOT, 'play', name)).metadata()
      expect(meta.width, name).toBe(2400)
      expect(meta.height, name).toBe(1792)
    }
  })

  it('озвучка инструментов — нарезанные mp3 владельца', () => {
    const sfx = path.join(ROOT, 'sfx')
    for (const id of [
      'drum-kick',
      'drum-snare',
      'drum-tom',
      'drum-right',
      'piano-do',
      'piano-si',
      'guitar-1',
      'guitar-6',
    ]) {
      expect(existsSync(path.join(sfx, `${id}.mp3`)), id).toBe(true)
    }
  })

  it('озвучка букв и корабля — нарезанные mp3 владельца', () => {
    const sfx = path.join(ROOT, 'sfx')
    const files = JSON.parse(readFileSync(path.join(sfx, 'sfx-files.json'), 'utf8')) as Record<
      string,
      string
    >
    expect(files.ship).toBe('mp3')
    expect(existsSync(path.join(sfx, 'ship.mp3'))).toBe(true)
    expect(files['letter-ru-А']).toBe('mp3')
    expect(files['letter-en-A']).toBe('mp3')
    for (const letter of 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ') {
      expect(existsSync(path.join(sfx, `letter-ru-${letter}.mp3`)), letter).toBe(true)
    }
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(existsSync(path.join(sfx, `letter-en-${letter}.mp3`)), letter).toBe(true)
    }
  })

  it('русская нарезка: А отдельно от Б, Й не проглатывается', () => {
    const cuts = JSON.parse(
      readFileSync(path.join(ROOT, 'sfx', 'letter-ru-cuts.json'), 'utf8'),
    ) as Record<string, [number, number]>
    expect(cuts['А'][1]).toBeLessThan(0.45)
    expect(cuts['Б'][0]).toBeGreaterThan(0.3)
    expect(cuts['Б'][1]).toBeGreaterThan(0.7)
    expect(cuts['Й'][0]).toBeGreaterThan(6.4)
    expect(cuts['Й'][0]).toBeLessThan(7.3)
    expect(cuts['Й'][1] - cuts['Й'][0]).toBeGreaterThan(1.1)
    expect(cuts['Ъ'][1] - cuts['Ъ'][0]).toBeGreaterThan(1.1)
    expect(cuts['Ь'][1] - cuts['Ь'][0]).toBeGreaterThan(1.1)
    expect(Object.keys(cuts)).toHaveLength(33)
  })
})
