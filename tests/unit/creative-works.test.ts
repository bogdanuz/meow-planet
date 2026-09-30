import { describe, expect, it } from 'vitest'
import {
  DRAWING_SAVE_LIMIT,
  continueDrawingDraft,
  createDrawingDraft,
  creativeDownloadKind,
  drawingHasMarks,
  galleryWorks,
  isLegacyCreativeRecord,
  parseCreativeWork,
  planNewDrawingSheet,
  sanitizeCaption,
  type CreativeWork,
} from '../../src/shared/creative-works'

function work(partial: Partial<CreativeWork> & Pick<CreativeWork, 'id'>): CreativeWork {
  return {
    kind: 'drawing',
    createdAt: 1,
    updatedAt: 1,
    caption: '',
    status: 'draft',
    strokes: [],
    background: { kind: 'solid', color: 'white' },
    ...partial,
  }
}

const mark = [{ tool: 'brush', color: 'red' as const, size: 'thick' as const, points: [{ x: 0.2, y: 0.2 }] }]

describe('creative works', () => {
  it('новый лист рисунка не стирает старые молча и останавливается на 50', () => {
    expect(DRAWING_SAVE_LIMIT).toBe(50)
    const current = work({ id: 'current', strokes: mark })
    expect(drawingHasMarks(current)).toBe(true)
    expect(planNewDrawingSheet([current], 'current')).toBe('save-then-reset')
    expect(planNewDrawingSheet([work({ id: 'blank' })], 'blank')).toBe('reset')

    const full = Array.from({ length: 50 }, (_, index) =>
      work({ id: `d-${index}`, status: 'saved', strokes: mark }),
    )
    expect(planNewDrawingSheet(full, 'd-0')).toBe('blocked')
    const withBlanks = [
      ...full.slice(0, 49),
      ...Array.from({ length: 5 }, (_, index) => work({ id: `blank-${index}` })),
    ]
    expect(planNewDrawingSheet(withBlanks, 'd-0')).toBe('save-then-reset')
    expect(continueDrawingDraft([current])?.id).toBe('current')
    expect(continueDrawingDraft([work({ id: 'blank' })])).toBeNull()
  })

  it('галерея показывает только рисунки со штрихами, свежие первыми', () => {
    const older = work({ id: 'a', updatedAt: 1, strokes: mark })
    const newer = work({ id: 'b', updatedAt: 5, strokes: mark })
    expect(galleryWorks([older, work({ id: 'empty' }), newer]).map((item) => item.id)).toEqual(['b', 'a'])
  })

  it('фон раскраски сохраняется, старые бумага и темы становятся белым листом', () => {
    const base = { id: 'x', kind: 'drawing', createdAt: 1, updatedAt: 2, strokes: [] }
    expect(parseCreativeWork({ ...base, background: { kind: 'coloring', sceneId: 'cat' } })?.background).toEqual({
      kind: 'coloring',
      sceneId: 'cat',
    })
    expect(parseCreativeWork({ ...base, background: { kind: 'paper', id: 'warm' } })?.background).toEqual({
      kind: 'solid',
      color: 'white',
    })
    expect(parseCreativeWork({ ...base, background: { kind: 'theme', id: 'night' } })?.background).toEqual({
      kind: 'solid',
      color: 'white',
    })
    expect(parseCreativeWork({ ...base, background: { kind: 'photo', photoId: 'p1' } })?.background).toEqual({
      kind: 'photo',
      photoId: 'p1',
    })
    expect(createDrawingDraft(3, { kind: 'coloring', sceneId: 'dog' }).background).toEqual({
      kind: 'coloring',
      sceneId: 'dog',
    })
  })

  it('старые работы отдельной раскраски больше не читаются', () => {
    const legacy = { id: 'c', kind: 'coloring', createdAt: 1, updatedAt: 2, fills: { a: 'red' } }
    expect(isLegacyCreativeRecord(legacy)).toBe(true)
    expect(isLegacyCreativeRecord({ id: 'd', kind: 'drawing' })).toBe(false)
    expect(parseCreativeWork(legacy)).toBeNull()
  })

  it('имя файла при скачивании зависит от фона', () => {
    expect(creativeDownloadKind(work({ id: 'a', background: { kind: 'coloring', sceneId: 'cat' } }))).toBe('coloring')
    expect(creativeDownloadKind(work({ id: 'b' }))).toBe('drawing')
  })

  it('подпись и битая запись не ломают чтение', () => {
    expect(sanitizeCaption('  Мяу\u0000  ')).toBe('Мяу')
    expect(sanitizeCaption('я'.repeat(120)).length).toBe(80)
    expect(parseCreativeWork(null)).toBeNull()
    expect(parseCreativeWork({ id: 1, kind: 'drawing' })).toBeNull()
    const parsed = parseCreativeWork({
      id: 'ok',
      kind: 'drawing',
      createdAt: 2,
      updatedAt: 3,
      caption: 'Дом',
      status: 'saved',
      strokes: [{ tool: 'fill', color: 'gold', size: 'thick', points: [{ x: 1, y: 1 }] }, ...mark],
      background: null,
    })
    expect(parsed?.strokes).toHaveLength(1)
    expect(parsed?.caption).toBe('Дом')
    expect(parsed?.background).toEqual({ kind: 'solid', color: 'white' })
  })
})
