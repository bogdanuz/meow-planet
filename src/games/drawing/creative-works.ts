import { isCreativeColorId, isStrokeColor, type CreativeColorId, type StrokeColor } from './creative-palette'

export const DRAWING_SAVE_LIMIT = 50
const CAPTION_LIMIT = 80

export type CreativeKind = 'drawing'
export type WorkStatus = 'draft' | 'saved'
export type StrokeSize = 'thin' | 'thick'

export type CreativeStroke = {
  tool: string
  color: StrokeColor
  size: StrokeSize
  points: { x: number; y: number }[]
  seed?: number
}

/** Фон листа: цвет, своё фото или раскраска (контур поверх рисунка). */
export type DrawingBackground =
  | { kind: 'solid'; color: CreativeColorId }
  | { kind: 'photo'; photoId: string }
  | { kind: 'coloring'; sceneId: string }

export const WHITE_BACKGROUND: DrawingBackground = { kind: 'solid', color: 'white' }

export type CreativeWork = {
  id: string
  kind: CreativeKind
  createdAt: number
  updatedAt: number
  caption: string
  status: WorkStatus
  strokes: CreativeStroke[]
  background: DrawingBackground
}

export function sanitizeCaption(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, CAPTION_LIMIT)
}

function isPoint(value: unknown): value is { x: number; y: number } {
  if (value === null || typeof value !== 'object') return false
  const point = value as { x?: unknown; y?: unknown }
  return typeof point.x === 'number' && typeof point.y === 'number'
}

function parseStroke(value: unknown): CreativeStroke | null {
  if (value === null || typeof value !== 'object') return null
  const stroke = value as {
    tool?: unknown
    color?: unknown
    size?: unknown
    points?: unknown
    seed?: unknown
  }
  if (!isStrokeColor(stroke.color) || !Array.isArray(stroke.points)) return null
  const points = stroke.points.filter(isPoint).map((point) => ({ x: point.x, y: point.y }))
  if (points.length === 0) return null
  const parsed: CreativeStroke = {
    tool: typeof stroke.tool === 'string' ? stroke.tool : 'brush',
    color: isCreativeColorId(stroke.color) ? stroke.color : (stroke.color.toLowerCase() as StrokeColor),
    size: stroke.size === 'thin' ? 'thin' : 'thick',
    points,
  }
  if (typeof stroke.seed === 'number' && Number.isFinite(stroke.seed)) parsed.seed = stroke.seed
  return parsed
}

function parseBackground(value: unknown): DrawingBackground {
  if (value === null || typeof value !== 'object') return { ...WHITE_BACKGROUND }
  const bg = value as { kind?: unknown; color?: unknown; photoId?: unknown; sceneId?: unknown }
  if (bg.kind === 'solid' && isCreativeColorId(bg.color)) {
    return { kind: 'solid', color: bg.color }
  }
  if (bg.kind === 'photo' && typeof bg.photoId === 'string' && bg.photoId.length > 0) {
    return { kind: 'photo', photoId: bg.photoId }
  }
  if (bg.kind === 'coloring' && typeof bg.sceneId === 'string' && bg.sceneId.length > 0) {
    return { kind: 'coloring', sceneId: bg.sceneId }
  }
  return { ...WHITE_BACKGROUND }
}

/** Запись отдельной игры «Раскраска» (до 01.10.2026) — удаляется при чтении. */
export function isLegacyCreativeRecord(raw: unknown): boolean {
  if (raw === null || typeof raw !== 'object') return false
  return (raw as { kind?: unknown }).kind === 'coloring'
}

export function parseCreativeWork(raw: unknown): CreativeWork | null {
  if (raw === null || typeof raw !== 'object') return null
  const data = raw as Record<string, unknown>
  if (typeof data.id !== 'string' || data.id.length === 0) return null
  if (data.kind !== 'drawing') return null
  if (typeof data.createdAt !== 'number' || typeof data.updatedAt !== 'number') return null
  const strokes = Array.isArray(data.strokes)
    ? data.strokes.map(parseStroke).filter((stroke): stroke is CreativeStroke => stroke !== null)
    : []
  return {
    id: data.id,
    kind: 'drawing',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    caption: sanitizeCaption(data.caption),
    status: data.status === 'saved' ? 'saved' : 'draft',
    strokes,
    background: parseBackground(data.background),
  }
}

export function drawingHasMarks(work: Pick<CreativeWork, 'strokes'>): boolean {
  return work.strokes.length > 0
}

export function continueDrawingDraft(works: readonly CreativeWork[]): CreativeWork | null {
  const latest = works
    .filter((work) => work.status === 'draft')
    .sort((a, b) => b.updatedAt - a.updatedAt)[0]
  if (!latest || !drawingHasMarks(latest)) return null
  return latest
}

/** Новый лист или смена фона: непустой рисунок сначала уходит в галерею. */
export function planNewDrawingSheet(
  works: readonly CreativeWork[],
  currentId: string | null,
): 'reset' | 'save-then-reset' | 'blocked' {
  const current = works.find((work) => work.id === currentId) ?? null
  if (!current || !drawingHasMarks(current)) return 'reset'
  if (works.filter((work) => drawingHasMarks(work)).length >= DRAWING_SAVE_LIMIT) return 'blocked'
  return 'save-then-reset'
}

export function galleryWorks(works: readonly CreativeWork[]): CreativeWork[] {
  return works
    .filter((work) => drawingHasMarks(work))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function creativeDownloadKind(work: Pick<CreativeWork, 'background'>): 'coloring' | 'drawing' {
  return work.background.kind === 'coloring' ? 'coloring' : 'drawing'
}

export function createWorkId(kind: CreativeKind): string {
  return `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createDrawingDraft(
  now = Date.now(),
  background: DrawingBackground = WHITE_BACKGROUND,
): CreativeWork {
  return {
    id: createWorkId('drawing'),
    kind: 'drawing',
    createdAt: now,
    updatedAt: now,
    caption: '',
    status: 'draft',
    strokes: [],
    background: { ...background },
  }
}
