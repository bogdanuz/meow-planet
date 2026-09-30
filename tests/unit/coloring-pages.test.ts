import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  COLORING_PAGES,
  COLORING_PICKER_PAGES,
  coloringLineUrl,
  coloringPageById,
  coloringThumbUrl,
} from '../../src/games/drawing/coloring-pages'

const root = path.join(process.cwd(), 'public/assets/games/coloring')

describe('coloring pages', () => {
  it('24 раскраски на 4 листах по 6, подписи по именам мастер-файлов', () => {
    expect(COLORING_PAGES).toHaveLength(24)
    expect(new Set(COLORING_PAGES.map((page) => page.id)).size).toBe(24)
    expect(COLORING_PICKER_PAGES).toHaveLength(4)
    expect(COLORING_PICKER_PAGES.every((page) => page.length === 6)).toBe(true)
    expect(coloringPageById('balloon')?.title).toBe('Шарик')
    expect(coloringPageById('sleepy-bear')?.title).toBe('Спящий мишка')
    expect(coloringPageById('nope')).toBeNull()
  })

  it('у каждой раскраски есть контур PNG и миниатюра, лишних файлов нет', () => {
    for (const page of COLORING_PAGES) {
      expect(existsSync(path.join(root, 'lines', `${page.id}.png`)), page.id).toBe(true)
      expect(existsSync(path.join(root, 'thumbs', `${page.id}.webp`)), page.id).toBe(true)
    }
    expect(readdirSync(path.join(root, 'lines'))).toHaveLength(24)
    expect(readdirSync(path.join(root, 'thumbs'))).toHaveLength(24)
    expect(existsSync(path.join(root, 'scenes'))).toBe(false)
  })

  it('порядок совпадает со скриптом сборки ассетов', () => {
    const script = readFileSync(path.join(process.cwd(), 'scripts/build-coloring-assets.mjs'), 'utf8')
    const ids = [...script.matchAll(/\['[^']+', '([a-z-]+)'\]/g)].map((match) => match[1])
    expect(ids).toEqual(COLORING_PAGES.map((page) => page.id))
  })

  it('адреса ассетов относительные к base', () => {
    expect(coloringLineUrl('cat')).toMatch(/assets\/games\/coloring\/lines\/cat\.png$/)
    expect(coloringThumbUrl('cat')).toMatch(/assets\/games\/coloring\/thumbs\/cat\.webp$/)
  })
})
