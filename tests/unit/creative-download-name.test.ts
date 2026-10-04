import { describe, expect, it } from 'vitest'
import { creativeDownloadName } from '../../src/games/drawing/creative-download-name'

describe('имя скачанной картинки', () => {
  it('ставит дату и время, чтобы файлы не затирали друг друга', () => {
    const at = new Date(2026, 8, 30, 22, 15, 8).getTime()
    expect(creativeDownloadName('coloring', at)).toBe('raskraska_30.09.2026_22.15.08.png')
    expect(creativeDownloadName('drawing', at)).toBe('risunok_30.09.2026_22.15.08.png')
  })
})
