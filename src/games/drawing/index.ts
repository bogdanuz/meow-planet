import type { GameModule } from '../../shared/game-module'
import { askChoice } from '../../shared/ask-choice'
import { createAudioManager } from '../../shared/audio'
import { renderCreativeGallery } from '../../shared/creative-gallery'
import { getCreativeRepository } from '../../shared/creative-repository'
import { CREATIVE_COLORS, creativeColorHex, type CreativeColorId } from '../../shared/creative-palette'
import {
  WHITE_BACKGROUND,
  continueDrawingDraft,
  createDrawingDraft,
  createWorkId,
  creativeDownloadKind,
  galleryWorks,
  planNewDrawingSheet,
  type CreativeWork,
  type DrawingBackground,
} from '../../shared/creative-works'
import { creativeDownloadName } from '../../shared/creative-download-name'
import { downloadBlob } from '../../shared/download-blob'
import { bindLifecycleSave } from '../../shared/lifecycle-save'
import { createCreativeToolButton, creativeToolIconUrl, type CreativeToolIcon } from '../../shared/creative-tool-icon'
import { createUiIconImg, uiIconUrl, type UiIconId } from '../../shared/ui-icon'
import '../../shared/creative-dock.css'
import {
  COLORING_PICKER_PAGES,
  coloringLineUrl,
  coloringPageById,
  coloringThumbUrl,
} from './coloring-pages'
import {
  DRAWING_BRUSHES,
  appendDrawingPoint,
  isPalmTouch,
  shouldPlayStrokeSound,
  trimDrawingStrokes,
  type DrawingBrush,
  type DrawingSize,
  type DrawingStroke,
  type DrawingTool,
} from './logic'
import { createSheetRenderer, type SheetSources } from './paint'
import '../../shared/creative-desk.css'
import './drawing.css'

const HISTORY_LIMIT = 40
const BRUSH_LABEL: Record<DrawingBrush, string> = {
  brush: 'Кисть',
  marker: 'Фломастер',
  crayon: 'Мелок',
  watercolor: 'Акварель',
}
const SIZE_LABEL: Record<DrawingSize, string> = {
  thin: 'Тонкий',
  thick: 'Толстый',
}

type DrawingView = 'canvas' | 'gallery' | 'picker'
type PopId = 'colors' | 'brushes' | 'sizes' | 'bg' | 'bg-colors'

export const drawingGame: GameModule = {
  meta: {
    id: 'drawing',
    title: 'Рисовалка',
    zoneId: 'star-workshop',
    modules: ['2.20', '2.7'],
  },

  mount(container, context) {
    unmountInternal()
    const repo = getCreativeRepository()
    const audio = createAudioManager(context.settings)
    void audio.unlock()
    let soundOn = context.settings.soundEnabled || context.settings.musicEnabled
    let works: CreativeWork[] = []
    let work = createDrawingDraft()
    let strokes: DrawingStroke[] = []
    let history: DrawingStroke[][] = []
    let background: DrawingBackground = { ...WHITE_BACKGROUND }
    let tool: DrawingTool = 'brush'
    let lastBrush: DrawingBrush = 'brush'
    let size: DrawingSize = 'thick'
    let colorId: CreativeColorId = 'red'
    let view: DrawingView = 'canvas'
    let openPop: PopId | null = null
    let pickerPage = 0
    let saveTimer = 0
    let lastSoundAt: number | null = null
    let disposed = false
    let booted = false
    let busy = false
    /** Лист, который «Заново» или смена фона унесли в галерею; «Отменить» на пустом листе вернёт его. */
    let previousSheet: CreativeWork | null = null
    const strokeCleanups = new Set<() => void>()
    const drafts = new Map<number, DrawingStroke>()
    const photos = new Map<string, HTMLImageElement>()
    const lines = new Map<string, HTMLImageElement>()
    const thumbUrls = new Map<string, string>()

    root = document.createElement('section')
    root.className = 'drawing creative-desk'
    root.dataset.gameId = 'drawing'
    if (context.settings.quietMode) root.classList.add('drawing--quiet')

    const wood = document.createElement('img')
    wood.className = 'creative-desk__wood'
    wood.alt = ''
    wood.src = `${import.meta.env.BASE_URL}assets/games/creative/desk-table.webp`

    const bar = document.createElement('header')
    bar.className = 'drawing__bar creative-desk__bar'
    const barLeft = document.createElement('div')
    barLeft.className = 'drawing__bar-group drawing__bar-group--left'
    const barCenter = document.createElement('div')
    barCenter.className = 'drawing__bar-group drawing__bar-group--center'
    const barRight = document.createElement('div')
    barRight.className = 'drawing__bar-group drawing__bar-group--right'
    bar.append(barLeft, barCenter, barRight)

    const body = document.createElement('div')
    body.className = 'creative-desk__body drawing__body'
    const dock = document.createElement('div')
    dock.className = 'creative-dock drawing__dock'
    const island = document.createElement('div')
    island.className = 'creative-dock__island drawing__island'
    const stage = document.createElement('div')
    stage.className = 'drawing__stage creative-desk__stage'
    const paper = document.createElement('div')
    paper.className = 'creative-sheet__paper'
    const canvas = document.createElement('canvas')
    canvas.className = 'drawing__canvas'
    const screenHost = document.createElement('div')
    screenHost.className = 'drawing__screen'
    screenHost.hidden = true
    paper.append(canvas)
    stage.append(paper)
    dock.append(island)
    body.append(dock, stage, screenHost)
    root.append(wood, bar, body)
    container.replaceChildren(root)

    const renderer = createSheetRenderer(canvas)

    const back = iconButton('Назад в меню', 'back', () => {
      if (view !== 'canvas') showCanvas()
      else void persist().finally(() => context.hubNavigation?.goMenu())
    })
    back.dataset.role = 'back'
    const sound = iconButton(soundOn ? 'Звук включён' : 'Звук выключен', soundOn ? 'sound-on' : 'sound-off', () => {
      soundOn = !soundOn
      sound.dataset.on = soundOn ? '1' : '0'
      sound.setAttribute('aria-label', soundOn ? 'Звук включён' : 'Звук выключен')
      const icon = sound.querySelector('img')
      if (icon) icon.src = uiIconUrl(soundOn ? 'sound-on' : 'sound-off')
      audio.updateSettings({
        soundEnabled: soundOn,
        musicEnabled: soundOn,
        quietMode: context.settings.quietMode,
      })
      context.hubNavigation?.onSoundToggle?.(soundOn)
    })
    sound.dataset.on = soundOn ? '1' : '0'
    barLeft.append(back, sound)

    const undoButton = createCreativeToolButton('Отменить', 'undo', () => undo())
    const freshButton = createCreativeToolButton('Заново', 'sheet', () => {
      void runSheetChange(freshSheet)
    })
    freshButton.classList.add('drawing__fresh')
    barCenter.append(undoButton, freshButton)

    const bgButton = createCreativeToolButton('Фон', 'background', () => togglePop('bg'))
    bgButton.dataset.pop = 'bg'
    const galleryButton = createCreativeToolButton('Галерея', 'gallery', () => {
      void openGallery()
    })
    const settingsButton = iconButton('Настройки', 'settings', () => {
      void persist().finally(() => context.hubNavigation?.goSettings?.())
    })
    settingsButton.hidden = !context.hubNavigation?.goSettings
    barRight.append(bgButton, galleryButton, settingsButton)

    const photoInput = document.createElement('input')
    photoInput.type = 'file'
    photoInput.accept = 'image/jpeg,image/png,image/webp'
    photoInput.hidden = true
    photoInput.addEventListener('change', () => {
      const file = photoInput.files?.[0]
      photoInput.value = ''
      if (file) void applyPhoto(file)
    })

    const bgPop = createPop('bg', 'drawing__pop--bg', 'Выбор фона')
    const bgColor = createCreativeToolButton('Цвет', 'themes', () => togglePop('bg-colors'))
    bgColor.dataset.bgChoice = 'color'
    const bgPhoto = createCreativeToolButton('Фото', 'background', () => {
      closePops()
      if (booted && !busy) photoInput.click()
    })
    bgPhoto.dataset.bgChoice = 'photo'
    const bgColoring = createCreativeToolButton('Раскраска', 'pictures', () => {
      closePops()
      if (booted && !busy) openPicker()
    })
    bgColoring.dataset.bgChoice = 'coloring'
    bgPop.append(bgColor, bgPhoto, bgColoring, photoInput)

    const bgColorsPop = createPop('bg-colors', 'drawing__pop--bg-colors drawing__pop--swatches', 'Цвет фона')
    for (const color of CREATIVE_COLORS) {
      const swatch = swatchButton(color.label, color.hex, () => {
        closePops()
        void runSheetChange(() => changeBackground({ kind: 'solid', color: color.id }))
      })
      swatch.classList.add('drawing__swatch--sheet')
      swatch.dataset.bgColor = color.id
      bgColorsPop.append(swatch)
    }
    barRight.append(bgPop, bgColorsPop)

    const colorsButton = createCreativeToolButton('Цвета', 'palette', () => togglePop('colors'))
    colorsButton.dataset.pop = 'colors'
    const colorDot = document.createElement('span')
    colorDot.className = 'drawing__color-dot'
    colorDot.setAttribute('aria-hidden', 'true')
    colorsButton.append(colorDot)
    const brushButton = createCreativeToolButton('Кисть', 'brush', () => {
      tool = lastBrush
      syncTools()
      togglePop('brushes')
    })
    brushButton.dataset.pop = 'brushes'
    const bucketButton = createCreativeToolButton('Заливка', 'bucket', () => {
      tool = 'bucket'
      closePops()
      syncTools()
    })
    bucketButton.dataset.tool = 'bucket'
    const eraserButton = createCreativeToolButton('Ластик', 'eraser', () => {
      tool = 'eraser'
      closePops()
      syncTools()
    })
    eraserButton.dataset.tool = 'eraser'
    const sizeButton = createCreativeToolButton('Размер', size, () => togglePop('sizes'))
    sizeButton.dataset.pop = 'sizes'
    island.append(colorsButton, brushButton, bucketButton, eraserButton, sizeButton)

    const colorsPop = createPop('colors', 'drawing__pop--colors drawing__pop--swatches', 'Цвета')
    for (const color of CREATIVE_COLORS) {
      const swatch = swatchButton(color.label, color.hex, () => {
        colorId = color.id
        if (tool === 'eraser') tool = lastBrush
        closePops()
        syncTools()
      })
      swatch.classList.add('drawing__color')
      swatch.dataset.colorId = color.id
      colorsPop.append(swatch)
    }
    const brushesPop = createPop('brushes', 'drawing__pop--tools', 'Кисти')
    for (const brush of DRAWING_BRUSHES) {
      const button = createCreativeToolButton(BRUSH_LABEL[brush], brush, () => {
        tool = brush
        lastBrush = brush
        closePops()
        syncTools()
      })
      button.dataset.brush = brush
      brushesPop.append(button)
    }
    const sizesPop = createPop('sizes', 'drawing__pop--tools', 'Размер')
    for (const choice of ['thin', 'thick'] as const) {
      const button = createCreativeToolButton(SIZE_LABEL[choice], choice, () => {
        size = choice
        closePops()
        syncTools()
      })
      button.dataset.size = choice
      sizesPop.append(button)
    }
    dock.append(colorsPop, brushesPop, sizesPop)

    const stopLifecycle = bindLifecycleSave(() => {
      void persist()
    })
    const onOutside = (event: PointerEvent): void => {
      const target = event.target
      if (!openPop || !(target instanceof Element)) return
      if (target.closest('.drawing__pop.is-open, [data-pop]')) return
      closePops()
      if (target === canvas) event.stopPropagation()
    }
    root.addEventListener('pointerdown', onOutside, true)
    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', fitCanvas)
    syncTools()
    syncView()
    syncHistoryButtons()
    void boot()

    function createPop(id: PopId, extraClass: string, label: string): HTMLElement {
      const pop = document.createElement('div')
      pop.className = `drawing__pop ${extraClass}`
      pop.dataset.popId = id
      pop.setAttribute('role', 'group')
      pop.setAttribute('aria-label', label)
      pop.setAttribute('aria-hidden', 'true')
      pop.inert = true
      return pop
    }

    function togglePop(id: PopId): void {
      let next: PopId | null = openPop === id ? (id === 'bg-colors' ? 'bg' : null) : id
      if (id === 'bg' && openPop === 'bg-colors') next = null
      openPop = next
      root?.querySelectorAll<HTMLElement>('[data-pop-id]').forEach((pop) => {
        const popId = pop.dataset.popId as PopId
        const open = popId === next || (next === 'bg-colors' && popId === 'bg')
        pop.classList.toggle('is-open', open)
        pop.setAttribute('aria-hidden', open ? 'false' : 'true')
        pop.inert = !open
      })
      root?.querySelectorAll<HTMLElement>('[data-pop]').forEach((button) => {
        button.classList.toggle('is-open', button.dataset.pop === next || (next === 'bg-colors' && button.dataset.pop === 'bg'))
      })
      bgColor.classList.toggle('is-selected', next === 'bg-colors')
      if (next) placePop(next)
    }

    function closePops(): void {
      if (openPop === null) return
      openPop = 'bg'
      togglePop('bg')
    }

    /** Панель у левого островка встаёт напротив своей кнопки и не выходит за стол. */
    function placePop(id: PopId): void {
      if (id === 'bg' || id === 'bg-colors') {
        const groupRight = barRight.getBoundingClientRect().right
        const bgRight = bgButton.getBoundingClientRect().right
        if (groupRight <= 0) return
        const offset = Math.max(0, Math.round(groupRight - bgRight))
        bgPop.style.right = `${offset}px`
        const gap = Number.parseFloat(getComputedStyle(bgPop).rowGap) || 10
        bgColorsPop.style.right = `${offset + bgPop.offsetWidth + gap}px`
        return
      }
      const pop = root?.querySelector<HTMLElement>(`[data-pop-id="${id}"]`)
      const trigger = island.querySelector<HTMLElement>(`[data-pop="${id}"]`)
      if (!pop || !trigger) return
      const dockRect = dock.getBoundingClientRect()
      const bodyRect = body.getBoundingClientRect()
      const triggerRect = trigger.getBoundingClientRect()
      const height = pop.offsetHeight
      let top = triggerRect.top + triggerRect.height / 2 - height / 2
      top = Math.min(top, bodyRect.bottom - height - 8)
      top = Math.max(top, bodyRect.top + 4)
      pop.style.top = `${Math.round(top - dockRect.top)}px`
    }

    function syncTools(): void {
      colorDot.style.background = creativeColorHex(colorId)
      colorsPop.querySelectorAll<HTMLElement>('[data-color-id]').forEach((swatch) => {
        swatch.classList.toggle('is-selected', swatch.dataset.colorId === colorId)
      })
      const isBrush = (DRAWING_BRUSHES as readonly string[]).includes(tool)
      brushButton.classList.toggle('is-selected', isBrush)
      bucketButton.classList.toggle('is-selected', tool === 'bucket')
      eraserButton.classList.toggle('is-selected', tool === 'eraser')
      setToolIcon(brushButton, lastBrush)
      setToolIcon(sizeButton, size)
      brushesPop.querySelectorAll<HTMLElement>('[data-brush]').forEach((button) => {
        button.classList.toggle('is-selected', button.dataset.brush === lastBrush)
      })
      sizesPop.querySelectorAll<HTMLElement>('[data-size]').forEach((button) => {
        button.classList.toggle('is-selected', button.dataset.size === size)
      })
      root?.style.setProperty('--drawing-color', creativeColorHex(colorId))
    }

    function syncView(): void {
      const onCanvas = view === 'canvas'
      stage.hidden = !onCanvas
      dock.hidden = !onCanvas
      screenHost.hidden = onCanvas
      undoButton.hidden = !onCanvas
      freshButton.hidden = !onCanvas
      galleryButton.classList.toggle('is-selected', view === 'gallery')
      back.setAttribute('aria-label', onCanvas ? 'Назад в меню' : 'Назад к холсту')
      if (root) root.dataset.view = view
    }

    function showCanvas(): void {
      view = 'canvas'
      screenHost.replaceChildren()
      closePops()
      syncView()
      fitCanvas()
    }

    async function boot(): Promise<void> {
      try {
        works = await repo.list()
      } catch {
        works = []
      }
      if (disposed) return
      const continued = continueDrawingDraft(works)
      const blank = works.find((item) => item.status === 'draft' && item.strokes.length === 0)
      if (continued) await openWork(continued)
      else if (blank) await openWork(blank)
      else {
        work = createDrawingDraft()
        works = [...works, work]
        fitCanvas()
      }
      if (disposed) return
      booted = true
      if (root) root.dataset.ready = '1'
    }

    async function runSheetChange(task: () => Promise<void>): Promise<void> {
      if (!booted || busy || disposed) return
      busy = true
      try {
        await task()
      } finally {
        busy = false
      }
    }

    async function openWork(next: CreativeWork): Promise<void> {
      work = next
      strokes = next.strokes.map(toDrawingStroke).filter((stroke): stroke is DrawingStroke => stroke !== null)
      background = normalizeBackground(next.background)
      history = []
      drafts.clear()
      await loadBackgroundSources()
      if (disposed) return
      showCanvas()
    }

    function normalizeBackground(bg: DrawingBackground): DrawingBackground {
      if (bg.kind === 'coloring' && !coloringPageById(bg.sceneId)) return { ...WHITE_BACKGROUND }
      return bg
    }

    async function loadBackgroundSources(): Promise<void> {
      if (background.kind === 'photo') await ensurePhoto(background.photoId)
      if (background.kind === 'coloring') ensureLine(background.sceneId)
    }

    function ensureLine(sceneId: string): void {
      if (lines.has(sceneId)) return
      const image = new Image()
      image.decoding = 'async'
      image.addEventListener('load', () => {
        if (!disposed && background.kind === 'coloring' && background.sceneId === sceneId) redraw()
      })
      image.addEventListener('error', () => {
        lines.delete(sceneId)
      })
      image.src = coloringLineUrl(sceneId)
      lines.set(sceneId, image)
    }

    function lineReady(): boolean {
      return background.kind !== 'coloring' || currentSources().line !== null
    }

    function photoInUse(photoId: string): boolean {
      if (background.kind === 'photo' && background.photoId === photoId) return true
      return works.some((item) => item.background.kind === 'photo' && item.background.photoId === photoId)
    }

    async function dropPhotoIfUnused(bg: DrawingBackground): Promise<void> {
      if (bg.kind !== 'photo' || photoInUse(bg.photoId)) return
      photos.delete(bg.photoId)
      await repo.removeBlob(bg.photoId).catch(() => undefined)
    }

    function currentSources(): SheetSources {
      const photo = background.kind === 'photo' ? photos.get(background.photoId) ?? null : null
      let line: HTMLImageElement | null = null
      if (background.kind === 'coloring') {
        const image = lines.get(background.sceneId)
        if (image?.complete && image.naturalWidth > 0) line = image
      }
      return { background, photo, line }
    }

    /** Непустой лист уходит в галерею, дальше — чистый лист. false — места нет. */
    async function prepareFreshSheet(): Promise<boolean> {
      if (!root) return false
      work = snapshot()
      upsertWork(work)
      const plan = planNewDrawingSheet(works, work.id)
      if (plan === 'blocked') {
        const answer = await askChoice(root, 'Листов уже 50. Можно убрать старые в галерее.', [
          { id: 'gallery', label: 'Открыть галерею' },
          { id: 'later', label: 'Не сейчас' },
        ])
        if (answer === 'gallery' && view !== 'gallery') await openGallery()
        return false
      }
      if (plan === 'save-then-reset') {
        work = { ...snapshot(), status: 'saved' }
        upsertWork(work)
        await persist()
        previousSheet = work
        work = createDrawingDraft(Date.now(), background)
        works = [...works, work]
      }
      strokes = []
      history = []
      drafts.clear()
      return true
    }

    async function freshSheet(): Promise<void> {
      if (!(await prepareFreshSheet())) return
      redraw()
      scheduleSave()
    }

    async function setBackground(next: DrawingBackground): Promise<void> {
      const old = background
      background = next
      upsertWork(snapshot())
      await dropPhotoIfUnused(old)
      await loadBackgroundSources()
      if (disposed) return
      if (view !== 'canvas') showCanvas()
      else redraw()
      scheduleSave()
    }

    async function changeBackground(next: DrawingBackground): Promise<void> {
      if (!(await prepareFreshSheet())) return
      await setBackground(next)
    }

    /** Лист чистится только когда фото уже готово: битый файл не съедает рисунок. */
    async function applyPhoto(file: File): Promise<void> {
      let blob: Blob
      let image: HTMLImageElement
      try {
        blob = await shrinkPhoto(file)
        image = await blobToImage(blob)
      } catch {
        return
      }
      await runSheetChange(async () => {
        if (!(await prepareFreshSheet())) return
        const photoId = `photo-${createWorkId('drawing')}`
        await repo.putBlob(photoId, blob).catch(() => undefined)
        photos.set(photoId, image)
        await setBackground({ kind: 'photo', photoId })
      })
    }

    async function restorePreviousSheet(): Promise<void> {
      const sheet = previousSheet
      previousSheet = null
      if (!sheet || !works.some((item) => item.id === sheet.id)) return
      const blank = work
      works = works.filter((item) => item.id !== blank.id)
      await repo.remove(blank.id).catch(() => undefined)
      await repo.removeBlob(`thumb-${blank.id}`).catch(() => undefined)
      const restored: CreativeWork = { ...(works.find((item) => item.id === sheet.id) ?? sheet), status: 'draft' }
      upsertWork(restored)
      await openWork(restored)
      await dropPhotoIfUnused(blank.background)
      await persist()
    }

    function openPicker(): void {
      void persist()
      view = 'picker'
      syncView()
      drawPicker()
    }

    function drawPicker(): void {
      screenHost.replaceChildren()
      const picker = document.createElement('section')
      picker.className = 'drawing__picker'
      picker.setAttribute('aria-label', 'Раскраски')
      let swipeStart: { id: number; x: number } | null = null
      let swiped = false
      const pages = COLORING_PICKER_PAGES
      pickerPage = Math.min(Math.max(0, pickerPage), pages.length - 1)

      const prev = navButton('Предыдущий лист', '‹', () => {
        pickerPage -= 1
        drawPicker()
      })
      prev.disabled = pickerPage === 0
      const next = navButton('Следующий лист', '›', () => {
        pickerPage += 1
        drawPicker()
      })
      next.disabled = pickerPage >= pages.length - 1

      const grid = document.createElement('div')
      grid.className = 'drawing__picker-grid'
      for (const page of pages[pickerPage] ?? []) {
        const card = document.createElement('button')
        card.type = 'button'
        card.className = 'drawing__card'
        card.dataset.sceneId = page.id
        card.setAttribute('aria-label', page.title)
        const thumb = document.createElement('img')
        thumb.className = 'drawing__card-thumb'
        thumb.alt = ''
        thumb.decoding = 'async'
        thumb.src = coloringThumbUrl(page.id)
        const title = document.createElement('span')
        title.className = 'drawing__card-title'
        title.textContent = page.title
        card.append(thumb, title)
        card.addEventListener('click', () => {
          if (swiped) return
          void runSheetChange(() => changeBackground({ kind: 'coloring', sceneId: page.id }))
        })
        grid.append(card)
      }

      const dots = document.createElement('div')
      dots.className = 'drawing__picker-dots'
      dots.setAttribute('aria-hidden', 'true')
      pages.forEach((_, index) => {
        const dot = document.createElement('span')
        dot.className = 'drawing__picker-dot'
        dot.classList.toggle('is-current', index === pickerPage)
        dots.append(dot)
      })

      picker.addEventListener('pointerdown', (event) => {
        swipeStart = { id: event.pointerId, x: event.clientX }
        swiped = false
      })
      picker.addEventListener('pointerup', (event) => {
        if (!swipeStart || swipeStart.id !== event.pointerId) return
        const dx = event.clientX - swipeStart.x
        swipeStart = null
        if (Math.abs(dx) < 70) return
        swiped = true
        const target = pickerPage + (dx < 0 ? 1 : -1)
        if (target < 0 || target >= pages.length) return
        pickerPage = target
        drawPicker()
      })

      picker.append(prev, grid, next, dots)
      screenHost.append(picker)
    }

    function onPointerDown(event: PointerEvent): void {
      if (!booted || busy || view !== 'canvas' || event.target !== canvas) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (isPalmTouch({ width: event.width, height: event.height })) return
      closePops()
      const point = localPoint(event)
      if (!point) return
      if (tool === 'bucket') {
        if (!lineReady()) return
        const fill: DrawingStroke = { tool: 'fill', color: colorId, size, points: [point] }
        if (!renderer.fillChangesSheet(strokes, fill, currentSources())) return
        pushHistory()
        strokes = trimDrawingStrokes([...strokes, fill])
        playStroke()
        redraw()
        scheduleSave()
        return
      }
      drafts.set(event.pointerId, { tool, color: colorId, size, points: [point] })
      try {
        canvas.setPointerCapture(event.pointerId)
      } catch {
        // Синтетические события без активного указателя.
      }
      playStroke()
      const move = (moveEvent: PointerEvent): void => {
        if (moveEvent.pointerId !== event.pointerId) return
        const nextPoint = localPoint(moveEvent)
        const draft = drafts.get(event.pointerId)
        if (!nextPoint || !draft) return
        draft.points = appendDrawingPoint(draft.points, nextPoint)
        redraw()
        if (shouldPlayStrokeSound(lastSoundAt, Date.now())) playStroke()
      }
      const detach = (): void => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
        strokeCleanups.delete(detach)
      }
      const up = (upEvent: PointerEvent): void => {
        if (upEvent.pointerId !== event.pointerId) return
        detach()
        const draft = drafts.get(event.pointerId)
        drafts.delete(event.pointerId)
        if (!draft || draft.points.length === 0) return
        pushHistory()
        strokes = trimDrawingStrokes([...strokes, draft])
        redraw()
        scheduleSave()
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
      strokeCleanups.add(detach)
      redraw()
    }

    function pushHistory(): void {
      history = [...history, [...strokes]].slice(-HISTORY_LIMIT)
    }

    function canRestoreSheet(): boolean {
      return previousSheet !== null && strokes.length === 0 && history.length === 0
    }

    function undo(): void {
      const previous = history.pop()
      if (!previous) {
        if (canRestoreSheet()) void runSheetChange(restorePreviousSheet)
        return
      }
      strokes = previous
      drafts.clear()
      redraw()
      scheduleSave()
    }

    function syncHistoryButtons(): void {
      undoButton.disabled = history.length === 0 && !canRestoreSheet()
      freshButton.disabled = strokes.length === 0
    }

    function redraw(): void {
      if (disposed) return
      syncHistoryButtons()
      renderer.render(strokes, [...drafts.values()], currentSources())
    }

    function fitCanvas(): void {
      if (view !== 'canvas') return
      const rect = paper.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round((rect.width || 800) * ratio))
      canvas.height = Math.max(1, Math.round((rect.height || 600) * ratio))
      redraw()
    }

    function localPoint(event: PointerEvent): { x: number; y: number } | null {
      const rect = canvas.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return null
      return {
        x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
      }
    }

    async function openGallery(): Promise<void> {
      if (view === 'gallery') {
        showCanvas()
        return
      }
      await persist()
      await loadThumbs()
      if (disposed) return
      view = 'gallery'
      closePops()
      syncView()
      drawGallery()
    }

    function drawGallery(): void {
      renderCreativeGallery(screenHost, {
        works: galleryWorks(works),
        thumbUrl: (item) => thumbUrls.get(item.id) ?? null,
        onOpen: (item) => {
          void showGalleryActions(item)
        },
      })
    }

    async function showGalleryActions(item: CreativeWork): Promise<void> {
      if (!root) return
      const answer = await askChoice(root, 'Что сделать с картинкой?', [
        { id: 'save', label: 'Скачать' },
        { id: 'delete', label: 'Удалить' },
        { id: 'cancel', label: 'Назад' },
      ])
      if (answer === 'save') await exportWork(item)
      if (answer === 'delete') await confirmDelete(item)
    }

    async function confirmDelete(item: CreativeWork): Promise<void> {
      if (!root) return
      const answer = await askChoice(root, 'Удалить эту работу?', [
        { id: 'no', label: 'Нет' },
        { id: 'yes', label: 'Да' },
      ])
      if (answer !== 'yes') return
      try {
        await repo.remove(item.id)
        await repo.removeBlob(`thumb-${item.id}`)
      } catch {
        // Карточка всё равно исчезает из списка.
      }
      works = works.filter((entry) => entry.id !== item.id)
      if (previousSheet?.id === item.id) previousSheet = null
      const url = thumbUrls.get(item.id)
      if (url) URL.revokeObjectURL(url)
      thumbUrls.delete(item.id)
      if (work.id === item.id) {
        work = createDrawingDraft()
        strokes = []
        history = []
        background = { ...WHITE_BACKGROUND }
        works = [...works, work]
      }
      await dropPhotoIfUnused(item.background)
      drawGallery()
    }

    function snapshot(): CreativeWork {
      return {
        ...work,
        updatedAt: Date.now(),
        strokes: strokes.map((stroke) => ({
          tool: stroke.tool,
          color: stroke.color,
          size: stroke.size,
          points: stroke.points.map((point) => ({ ...point })),
        })),
        background: { ...background },
      }
    }

    function upsertWork(next: CreativeWork): void {
      works = works.some((item) => item.id === next.id)
        ? works.map((item) => (item.id === next.id ? next : item))
        : [...works, next]
    }

    function scheduleSave(): void {
      window.clearTimeout(saveTimer)
      if (disposed) return
      saveTimer = window.setTimeout(() => void persist(), 280)
    }

    /** Запись листа всегда; картинка для галереи — только с видимого холста. */
    async function persist(): Promise<void> {
      window.clearTimeout(saveTimer)
      if (!booted) return
      work = snapshot()
      upsertWork(work)
      const saved = work
      const withThumb = view === 'canvas'
      try {
        await repo.put(saved)
        if (!withThumb) return
        const blob = await canvasBlob()
        if (blob) await repo.putBlob(`thumb-${saved.id}`, blob)
      } catch {
        // Картинка остаётся на холсте, даже если хранилище недоступно.
      }
    }

    function canvasBlob(): Promise<Blob | null> {
      return new Promise((resolve) => {
        if (!canvas.getContext('2d')) {
          resolve(null)
          return
        }
        try {
          canvas.toBlob((value) => resolve(value), 'image/png')
        } catch {
          resolve(null)
        }
      })
    }

    async function loadThumbs(): Promise<void> {
      for (const url of thumbUrls.values()) URL.revokeObjectURL(url)
      thumbUrls.clear()
      for (const item of galleryWorks(works)) {
        const blob = await repo.getBlob(`thumb-${item.id}`).catch(() => null)
        if (blob) thumbUrls.set(item.id, URL.createObjectURL(blob))
      }
    }

    async function exportWork(item: CreativeWork): Promise<void> {
      const blob = await repo.getBlob(`thumb-${item.id}`).catch(() => null)
      if (blob) downloadBlob(blob, creativeDownloadName(creativeDownloadKind(item), item.updatedAt))
    }

    async function ensurePhoto(photoId: string): Promise<void> {
      if (photos.has(photoId)) return
      try {
        const blob = await repo.getBlob(photoId)
        if (blob) photos.set(photoId, await blobToImage(blob))
      } catch {
        // Без фото лист остаётся белым.
      }
    }

    function playStroke(): void {
      const now = Date.now()
      if (!shouldPlayStrokeSound(lastSoundAt, now)) return
      lastSoundAt = now
      void audio.playTone(360, { channel: 'sfx', durationSec: 0.05, gain: 0.04 })
    }

    cleanup = () => {
      void persist()
      disposed = true
      for (const detach of [...strokeCleanups]) detach()
      stopLifecycle()
      window.clearTimeout(saveTimer)
      window.removeEventListener('resize', fitCanvas)
      for (const url of thumbUrls.values()) URL.revokeObjectURL(url)
      audio.stopSfx()
      if (root?.parentElement) root.parentElement.removeChild(root)
      root = null
      cleanup = null
    }
  },

  unmount() {
    unmountInternal()
  },
}

let root: HTMLElement | null = null
let cleanup: (() => void) | null = null

function unmountInternal(): void {
  cleanup?.()
  cleanup = null
  root = null
}

function iconButton(label: string, icon: UiIconId, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'touch-btn drawing__bar-btn game-chrome-btn'
  button.setAttribute('aria-label', label)
  button.append(createUiIconImg(icon, { decorative: true }))
  button.addEventListener('click', onClick)
  return button
}

function swatchButton(label: string, hex: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'drawing__swatch'
  button.setAttribute('aria-label', label)
  button.style.background = hex
  button.addEventListener('click', onClick)
  return button
}

function navButton(label: string, glyph: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'touch-btn drawing__picker-nav'
  button.setAttribute('aria-label', label)
  button.textContent = glyph
  button.addEventListener('click', onClick)
  return button
}

function setToolIcon(button: HTMLElement, icon: CreativeToolIcon): void {
  const image = button.querySelector<HTMLImageElement>('.creative-tool__icon')
  const url = creativeToolIconUrl(icon)
  if (image && image.getAttribute('src') !== url) image.src = url
}

function toDrawingStroke(stroke: CreativeWork['strokes'][number]): DrawingStroke | null {
  const tool = stroke.tool
  if (tool !== 'brush' && tool !== 'marker' && tool !== 'crayon' && tool !== 'watercolor' && tool !== 'eraser' && tool !== 'fill') {
    return null
  }
  return {
    tool,
    color: stroke.color,
    size: stroke.size,
    points: stroke.points.map((point) => ({ ...point })),
  }
}

async function shrinkPhoto(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  if (!ctx) return file
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.82))
  return blob ?? file
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob)
  const image = new Image()
  return new Promise((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('photo'))
    }
    image.src = url
  })
}
