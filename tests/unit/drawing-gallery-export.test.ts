import { describe, expect, it, vi } from 'vitest'
import {
  cardTilt,
  drawingsWord,
  shareOrDownload,
  uniqueFileNames,
} from '../../src/games/drawing/gallery-export'

function file(name: string): File {
  return new File(['x'], name, { type: 'image/png' })
}

describe('галерея: выбор и скачивание', () => {
  it('склоняет «рисунок» по числу', () => {
    expect(drawingsWord(1)).toBe('рисунок')
    expect(drawingsWord(2)).toBe('рисунка')
    expect(drawingsWord(4)).toBe('рисунка')
    expect(drawingsWord(5)).toBe('рисунков')
    expect(drawingsWord(11)).toBe('рисунков')
    expect(drawingsWord(21)).toBe('рисунок')
    expect(drawingsWord(22)).toBe('рисунка')
  })

  it('одинаковые имена файлов получают номер', () => {
    expect(uniqueFileNames(['a.png', 'b.png', 'a.png', 'a.png'])).toEqual(['a.png', 'b.png', 'a_2.png', 'a_3.png'])
  })

  it('плитка чуть наклонена, всегда одинаково для одного рисунка', () => {
    expect(cardTilt('drawing-1')).toBe(cardTilt('drawing-1'))
    for (const id of ['a', 'b', 'drawing-99', 'x-y-z']) {
      expect(Math.abs(cardTilt(id))).toBeLessThanOrEqual(2.5)
    }
  })

  it('на iPad — одно окно «Поделиться» со всеми файлами', async () => {
    const share = vi.fn(async () => undefined)
    const download = vi.fn()
    const files = [file('a.png'), file('b.png')]
    const result = await shareOrDownload(files, { canShare: () => true, share, download, wait: async () => undefined })
    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledWith({ files })
    expect(download).not.toHaveBeenCalled()
  })

  it('без «Поделиться» — отдельные файлы по очереди', async () => {
    const download = vi.fn()
    const files = [file('a.png'), file('b.png')]
    const result = await shareOrDownload(files, { canShare: () => false, download, wait: async () => undefined })
    expect(result).toBe('downloaded')
    expect(download.mock.calls.map((call) => (call[0] as File).name)).toEqual(['a.png', 'b.png'])
  })

  it('отмена «Поделиться» не скачивает файлы, а сбой — скачивает', async () => {
    const download = vi.fn()
    const abort = Object.assign(new Error('cancel'), { name: 'AbortError' })
    const cancelled = await shareOrDownload([file('a.png')], {
      canShare: () => true,
      share: async () => Promise.reject(abort),
      download,
      wait: async () => undefined,
    })
    expect(cancelled).toBe('cancelled')
    expect(download).not.toHaveBeenCalled()

    const failed = await shareOrDownload([file('a.png')], {
      canShare: () => true,
      share: async () => Promise.reject(new Error('NotAllowed')),
      download,
      wait: async () => undefined,
    })
    expect(failed).toBe('downloaded')
    expect(download).toHaveBeenCalledTimes(1)
  })

  it('пустой выбор ничего не делает', async () => {
    const download = vi.fn()
    expect(await shareOrDownload([], { canShare: () => true, download, wait: async () => undefined })).toBe('cancelled')
    expect(download).not.toHaveBeenCalled()
  })
})
