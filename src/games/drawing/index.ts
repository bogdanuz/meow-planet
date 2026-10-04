import type { GameModule } from '../../shared/game-module'
import { askChoice } from '../../shared/ask-choice'
import { createAudioManager } from '../../shared/audio'
import { createFrameBatch } from '../../shared/frame-batch'
import { renderCreativeGallery, renderWorkViewer } from './creative-gallery'
import { drawingsWord, shareOrDownload, uniqueFileNames } from './gallery-export'
import { getCreativeRepository } from './creative-repository'
import { CREATIVE_COLORS, isHexColor, strokeColorHex, type StrokeColor } from './creative-palette'
import { customColorPosition, loadCustomColor, paintRainbow, pickerColorAt, saveCustomColor } from './custom-color'
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
} from './creative-works'
import { creativeDownloadName } from './creative-download-name'
import { bindLifecycleSave } from '../../shared/lifecycle-save'
import { createCreativeToolButton, creativeToolIconUrl, type CreativeToolIcon } from './creative-tool-icon'
import { createUiIconImg, uiIconUrl, type UiIconId } from '../../shared/ui-icon'
import './creative-dock.css'
import {
  COLORING_PICKER_PAGES,
  coloringLineUrl,
  coloringPageById,
  coloringThumbUrl,
} from './coloring-pages'
import {
  DRAWING_BRUSHES,
  appendDrawingPoint,
  newStrokeSeed,
  shouldPlayStrokeSound,
  trimDrawingStrokes,
  type DrawingBrush,
  type DrawingSize,
  type DrawingStroke,
  type DrawingTool,
} from './logic'
import { createSheetRenderer, type SheetSources } from './paint'
import {
  blobToImage,
  openPhotoCropEditor,
  shrinkPhoto,
  type PhotoCropEditor,
} from '../../shared/photo-crop-editor'
import './creative-desk.css'
import './drawing.css'

const HISTORY_LIMIT = 40
const THUMB_WIDTH = 480
const BRUSH_LABEL: Record<DrawingBrush, string> = {
  brush: 'Круглая кисть',
  marker: 'Фломастер',
  crayon: 'Мелок',
  watercolor: 'Акварель',
}
const SIZE_LABEL: Record<DrawingSize, string> = {
  thin: 'Тонкий',
  thick: 'Толстый',
}

type DrawingView = 'canvas' | 'gallery' | 'picker'
type PopId = 'colors' | 'custom-color' | 'brushes' | 'sizes' | 'bg' | 'bg-colors'

const SVG_NS = 'http://www.w3.org/2000/svg'
const DROP_PATH = 'M12 1.8C12 1.8 3.2 12.4 3.2 19.2a8.8 8.8 0 0 0 17.6 0C20.8 12.4 12 1.8 12 1.8Z'

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
    let colorId: StrokeColor = 'red'
    let customColor = loadCustomColor()
    let customDraft = customColor ?? pickerColorAt(0.5, 0.35)
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
    const exportBlobs = new Map<string, Blob>()
    let viewerClose: (() => void) | null = null
    let cropEditor: PhotoCropEditor | null = null

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
      if (viewerClose) closeViewer()
      else if (view !== 'canvas') showCanvas()
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
    colorsButton.querySelector('.creative-tool__icon')?.replaceWith(colorDot)
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
      playSelect()
    })
    bucketButton.dataset.tool = 'bucket'
    const eraserButton = createCreativeToolButton('Ластик', 'eraser', () => {
      tool = 'eraser'
      closePops()
      syncTools()
      playSelect()
    })
    eraserButton.dataset.tool = 'eraser'
    const sizeButton = createCreativeToolButton('Размер', size, () => togglePop('sizes'))
    sizeButton.dataset.pop = 'sizes'
    island.append(colorsButton, brushButton, bucketButton, eraserButton, sizeButton)

    const colorsPop = createPop('colors', 'drawing__pop--colors drawing__pop--swatches', 'Цвета')
    for (const color of CREATIVE_COLORS) {
      const swatch = swatchButton(color.label, color.hex, () => pickColor(color.id))
      swatch.classList.add('drawing__color')
      swatch.dataset.colorId = color.id
      colorsPop.append(swatch)
    }
    const customCell = swatchButton('Свой цвет', '', () => openCustomColor())
    customCell.classList.add('drawing__color', 'drawing__swatch--custom')
    customCell.style.removeProperty('background')
    customCell.dataset.colorId = 'custom'
    customCell.dataset.pop = 'custom-color'
    colorsPop.append(customCell)

    const customPop = createPop('custom-color', 'drawing__pop--custom', 'Свой цвет')
    const rainbow = document.createElement('div')
    rainbow.className = 'drawing__rainbow'
    const rainbowCanvas = document.createElement('canvas')
    rainbowCanvas.className = 'drawing__rainbow-canvas'
    rainbowCanvas.width = 180
    rainbowCanvas.height = 120
    paintRainbow(rainbowCanvas)
    const rainbowMarker = document.createElement('span')
    rainbowMarker.className = 'drawing__rainbow-marker'
    rainbowMarker.setAttribute('aria-hidden', 'true')
    rainbow.append(rainbowCanvas, rainbowMarker)
    const customSide = document.createElement('div')
    customSide.className = 'drawing__custom-side'
    const customPreview = createDrop('drawing__custom-preview')
    const customDone = document.createElement('button')
    customDone.type = 'button'
    customDone.className = 'touch-btn drawing__custom-done'
    customDone.dataset.role = 'custom-done'
    customDone.textContent = 'Готово'
    customDone.addEventListener('click', () => {
      customColor = customDraft
      saveCustomColor(customDraft)
      pickColor(customDraft as StrokeColor)
    })
    customSide.append(customPreview, customDone)
    customPop.append(rainbow, customSide)
    let rainbowPointer: number | null = null
    rainbow.addEventListener('pointerdown', (event) => {
      rainbowPointer = event.pointerId
      try {
        rainbow.setPointerCapture(event.pointerId)
      } catch {
        // Синтетические события без активного указателя.
      }
      pickOnRainbow(event)
    })
    rainbow.addEventListener('pointermove', (event) => {
      if (event.pointerId === rainbowPointer) pickOnRainbow(event)
    })
    const releaseRainbow = (event: PointerEvent): void => {
      if (event.pointerId === rainbowPointer) rainbowPointer = null
    }
    rainbow.addEventListener('pointerup', releaseRainbow)
    rainbow.addEventListener('pointercancel', releaseRainbow)

    const brushesPop = createPop('brushes', 'drawing__pop--tools', 'Кисти')
    for (const brush of DRAWING_BRUSHES) {
      const button = createCreativeToolButton(BRUSH_LABEL[brush], brush, () => {
        tool = brush
        lastBrush = brush
        closePops()
        syncTools()
        playSelect()
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
        playSelect()
      })
      button.dataset.size = choice
      sizesPop.append(button)
    }
    dock.append(colorsPop, customPop, brushesPop, sizesPop)

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
        const parent = (next === 'bg-colors' && button.dataset.pop === 'bg') || (next === 'custom-color' && button.dataset.pop === 'colors')
        button.classList.toggle('is-open', button.dataset.pop === next || parent)
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
      const trigger = island.querySelector<HTMLElement>(`[data-pop="${id === 'custom-color' ? 'colors' : id}"]`)
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

    function pickColor(next: StrokeColor): void {
      colorId = next
      if (tool === 'eraser') tool = lastBrush
      closePops()
      syncTools()
      playSelect()
    }

    function openCustomColor(): void {
      customDraft = customColor ?? customDraft
      showCustomDraft()
      togglePop('custom-color')
    }

    function pickOnRainbow(event: PointerEvent): void {
      const rect = rainbow.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      customDraft = pickerColorAt((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height)
      showCustomDraft()
    }

    function showCustomDraft(): void {
      const position = customColorPosition(customDraft)
      rainbowMarker.style.left = `${(position.x * 100).toFixed(2)}%`
      rainbowMarker.style.top = `${(position.y * 100).toFixed(2)}%`
      rainbowMarker.style.background = customDraft
      setDropColor(customPreview, customDraft)
    }

    function syncTools(): void {
      const hex = strokeColorHex(colorId)
      colorDot.style.setProperty('--dot-color', hex)
      colorDot.dataset.color = hex
      if (customColor) customCell.style.setProperty('--custom-color', customColor)
      customCell.classList.toggle('has-color', customColor !== null)
      colorsPop.querySelectorAll<HTMLElement>('[data-color-id]').forEach((swatch) => {
        const custom = swatch.dataset.colorId === 'custom' && isHexColor(colorId)
        swatch.classList.toggle('is-selected', swatch.dataset.colorId === colorId || custom)
      })
      const isBrush = (DRAWING_BRUSHES as readonly string[]).includes(tool)
      brushButton.classList.toggle('is-selected', isBrush)
      bucketButton.classList.toggle('is-selected', tool === 'bucket')
      eraserButton.classList.toggle('is-selected', tool === 'eraser')
      setToolIcon(brushButton, lastBrush)
      const brushCaption = brushButton.querySelector('.creative-tool__label')
      if (brushCaption) brushCaption.textContent = BRUSH_LABEL[lastBrush]
      setToolIcon(sizeButton, size)
      brushesPop.querySelectorAll<HTMLElement>('[data-brush]').forEach((button) => {
        button.classList.toggle('is-selected', button.dataset.brush === lastBrush)
      })
      sizesPop.querySelectorAll<HTMLElement>('[data-size]').forEach((button) => {
        button.classList.toggle('is-selected', button.dataset.size === size)
      })
      root?.style.setProperty('--drawing-color', strokeColorHex(colorId))
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
      closeViewer()
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

    /**
     * Сначала редактор кадра поверх листа; лист чистится только после «Готово»,
     * битый файл или «Отмена» рисунок не трогают.
     */
    async function applyPhoto(file: File): Promise<void> {
      let source: HTMLImageElement
      try {
        source = await blobToImage(await shrinkPhoto(file, 2400))
      } catch {
        return
      }
      if (disposed) return
      closePops()
      cropEditor = openPhotoCropEditor({
        image: source,
        width: source.naturalWidth,
        height: source.naturalHeight,
        frame: () => canvas.getBoundingClientRect(),
      })
      const blob = await cropEditor.done
      cropEditor = null
      if (!blob || disposed) return
      let image: HTMLImageElement
      try {
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
      await removeWorkData(blank.id)
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

    const strokeFrame = createFrameBatch(redraw)
    // #region agent log
    let dbgPerf = { renders: 0, totalMs: 0, maxMs: 0, moves: 0, startedAt: 0 }
    // #endregion

    function onPointerDown(event: PointerEvent): void {
      if (!booted || busy || view !== 'canvas' || event.target !== canvas) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
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
      const draft: DrawingStroke = { tool, color: colorId, size, points: [point] }
      // #region agent log
      dbgPerf = { renders: 0, totalMs: 0, maxMs: 0, moves: 0, startedAt: performance.now() }
      // #endregion
      if (tool === 'watercolor') draft.seed = newStrokeSeed()
      drafts.set(event.pointerId, draft)
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
        // #region agent log
        dbgPerf.moves += 1
        // #endregion
        strokeFrame.request()
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
        strokeFrame.cancel()
        const draft = drafts.get(event.pointerId)
        drafts.delete(event.pointerId)
        // #region agent log
        fetch('http://127.0.0.1:7263/ingest/02ef703c-68df-4e0c-a004-5e4c2bf5e471',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'38fb21'},body:JSON.stringify({sessionId:'38fb21',runId:'perf',hypothesisId:'P1',location:'drawing/index.ts:up',message:'stroke render cost',data:{tool:draft?.tool,points:draft?.points.length,moves:dbgPerf.moves,renders:dbgPerf.renders,totalMs:Math.round(dbgPerf.totalMs),avgMs:+(dbgPerf.totalMs/Math.max(1,dbgPerf.renders)).toFixed(2),maxMs:Math.round(dbgPerf.maxMs),strokeMs:Math.round(performance.now()-dbgPerf.startedAt),canvas:`${canvas.width}x${canvas.height}`},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
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
      // #region agent log
      const dbgT0 = performance.now()
      // #endregion
      syncHistoryButtons()
      renderer.render(strokes, [...drafts.values()], currentSources())
      // #region agent log
      const dbgMs = performance.now() - dbgT0
      dbgPerf.renders += 1
      dbgPerf.totalMs += dbgMs
      dbgPerf.maxMs = Math.max(dbgPerf.maxMs, dbgMs)
      // #endregion
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
      closeViewer()
      renderCreativeGallery(screenHost, {
        works: galleryWorks(works),
        thumbUrl: (item) => thumbUrls.get(item.id) ?? null,
        onOpen: (item) => {
          void showViewer(item)
        },
        onDownload: (items) => {
          void downloadWorks(items)
        },
        onDelete: (items) => {
          void confirmDelete(items)
        },
        onSelectionChange: (items) => {
          void prepareExport(items)
        },
      })
    }

    async function showViewer(item: CreativeWork): Promise<void> {
      const blob = await exportBlob(item)
      if (disposed || view !== 'gallery') return
      closeViewer()
      const url = blob ? URL.createObjectURL(blob) : null
      const close = renderWorkViewer(screenHost, {
        imageUrl: url,
        updatedAt: item.updatedAt,
        onContinue: () => {
          void runSheetChange(() => continueWork(item))
        },
        onDownload: () => {
          void downloadWorks([item])
        },
        onDelete: () => {
          void confirmDelete([item])
        },
        onBack: () => closeViewer(),
      })
      viewerClose = () => {
        close()
        if (url) URL.revokeObjectURL(url)
      }
    }

    function closeViewer(): void {
      const close = viewerClose
      viewerClose = null
      close?.()
    }

    /** Рисунок из галереи становится текущим листом; прежний непустой лист уходит в галерею. */
    async function continueWork(item: CreativeWork): Promise<void> {
      const target = works.find((entry) => entry.id === item.id)
      if (!target) return
      if (target.id !== work.id) {
        const current = snapshot()
        if (current.strokes.length > 0) {
          const saved: CreativeWork = { ...current, status: 'saved' }
          upsertWork(saved)
          await repo.put(saved).catch(() => undefined)
        } else {
          works = works.filter((entry) => entry.id !== current.id)
          await removeWorkData(current.id)
        }
      }
      previousSheet = null
      const next: CreativeWork = { ...target, status: 'draft', updatedAt: Date.now() }
      upsertWork(next)
      await repo.put(next).catch(() => undefined)
      await openWork(next)
    }

    async function removeWorkData(id: string): Promise<void> {
      await repo.remove(id).catch(() => undefined)
      await repo.removeBlob(`thumb-${id}`).catch(() => undefined)
      await repo.removeBlob(`full-${id}`).catch(() => undefined)
      exportBlobs.delete(id)
    }

    async function confirmDelete(items: readonly CreativeWork[]): Promise<void> {
      if (!root || items.length === 0) return
      const message = items.length === 1 ? 'Удалить этот рисунок?' : `Удалить ${items.length} ${drawingsWord(items.length)}?`
      const answer = await askChoice(root, message, [
        { id: 'no', label: 'Нет' },
        { id: 'yes', label: 'Да' },
      ])
      if (answer !== 'yes') return
      for (const item of items) {
        await removeWorkData(item.id)
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
      }
      for (const item of items) await dropPhotoIfUnused(item.background)
      drawGallery()
    }

    /** Полная картинка для скачивания; у старых работ — только миниатюра. */
    async function exportBlob(item: CreativeWork): Promise<Blob | null> {
      const cached = exportBlobs.get(item.id)
      if (cached) return cached
      const full = await repo.getBlob(`full-${item.id}`).catch(() => null)
      const blob = full ?? (await repo.getBlob(`thumb-${item.id}`).catch(() => null))
      if (blob) exportBlobs.set(item.id, blob)
      return blob
    }

    async function prepareExport(items: readonly CreativeWork[]): Promise<void> {
      for (const item of items) await exportBlob(item)
    }

    async function downloadWorks(items: readonly CreativeWork[]): Promise<void> {
      const ready = items.every((item) => exportBlobs.has(item.id))
      if (!ready) await prepareExport(items)
      const picked = items.filter((item) => exportBlobs.has(item.id))
      const names = uniqueFileNames(picked.map((item) => creativeDownloadName(creativeDownloadKind(item), item.updatedAt)))
      const files = picked.map((item, index) => {
        const blob = exportBlobs.get(item.id)!
        return new File([blob], names[index]!, { type: blob.type || 'image/png' })
      })
      await shareOrDownload(files)
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
          ...(stroke.seed === undefined ? {} : { seed: stroke.seed }),
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
        const full = await canvasBlob(canvas, 'image/png')
        if (!full) return
        await repo.putBlob(`full-${saved.id}`, full)
        exportBlobs.set(saved.id, full)
        const thumb = await thumbBlob()
        if (thumb) await repo.putBlob(`thumb-${saved.id}`, thumb)
      } catch {
        // Картинка остаётся на холсте, даже если хранилище недоступно.
      }
    }

    /** Миниатюра для доски: ~480 px по ширине, WebP (Safari без WebP-кодека отдаст PNG). */
    function thumbBlob(): Promise<Blob | null> {
      const scale = Math.min(1, THUMB_WIDTH / Math.max(1, canvas.width))
      const small = document.createElement('canvas')
      small.width = Math.max(1, Math.round(canvas.width * scale))
      small.height = Math.max(1, Math.round(canvas.height * scale))
      const ctx = small.getContext('2d')
      if (!ctx) return Promise.resolve(null)
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(canvas, 0, 0, small.width, small.height)
      return canvasBlob(small, 'image/webp', 0.82)
    }

    async function loadThumbs(): Promise<void> {
      for (const url of thumbUrls.values()) URL.revokeObjectURL(url)
      thumbUrls.clear()
      for (const item of galleryWorks(works)) {
        const blob = await repo.getBlob(`thumb-${item.id}`).catch(() => null)
        if (disposed) return
        if (blob) thumbUrls.set(item.id, URL.createObjectURL(blob))
      }
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

    function playSelect(): void {
      void audio.playTone(660, { channel: 'sfx', durationSec: 0.08, gain: 0.045 })
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
      strokeFrame.cancel()
      for (const detach of [...strokeCleanups]) detach()
      stopLifecycle()
      window.clearTimeout(saveTimer)
      window.removeEventListener('resize', fitCanvas)
      for (const url of thumbUrls.values()) URL.revokeObjectURL(url)
      closeViewer()
      cropEditor?.close()
      exportBlobs.clear()
      audio.stopSfx()
      audio.dispose?.()
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
  if (hex) button.style.background = hex
  button.addEventListener('click', onClick)
  return button
}

function createDrop(className: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', className)
  svg.setAttribute('viewBox', '0 0 24 30')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', DROP_PATH)
  path.setAttribute('stroke', '#fffdf8')
  path.setAttribute('stroke-width', '2.4')
  path.setAttribute('stroke-linejoin', 'round')
  svg.append(path)
  return svg
}

function setDropColor(drop: SVGSVGElement, hex: string): void {
  drop.querySelector('path')?.setAttribute('fill', hex)
  drop.dataset.color = hex
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
    ...(stroke.seed === undefined ? {} : { seed: stroke.seed }),
  }
}

function canvasBlob(source: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!source.getContext('2d')) {
      resolve(null)
      return
    }
    try {
      source.toBlob((value) => resolve(value), type, quality)
    } catch {
      resolve(null)
    }
  })
}