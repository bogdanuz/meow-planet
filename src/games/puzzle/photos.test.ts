import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Row = { id: string; createdAt: number; title: string }

const h = vi.hoisted(() => ({
  rows: [] as Row[],
  input: null as HTMLInputElement | null,
  save: null as unknown as ReturnType<typeof vi.fn>,
  remove: null as unknown as ReturnType<typeof vi.fn>,
}))

vi.mock('../../shared/puzzle-photos', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../shared/puzzle-photos')>()
  h.save = vi.fn(async (_blob: Blob, title = '') => {
    const row = { id: `p-${h.rows.length + 1}`, createdAt: 1000 + h.rows.length, title }
    h.rows = [row, ...h.rows]
    return row
  })
  h.remove = vi.fn(async (ids: readonly string[]) => {
    h.rows = h.rows.filter((r) => !ids.includes(r.id))
  })
  return {
    ...actual,
    listPuzzlePhotos: vi.fn(async () => [...h.rows]),
    getPuzzlePhotoBlob: vi.fn(async () => new Blob(['x'], { type: 'image/png' })),
    savePuzzlePhotoBlob: h.save,
    deletePuzzlePhotos: h.remove,
    createPuzzleFileInput: () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.click = vi.fn()
      h.input = input
      return input
    },
  }
})

vi.mock('../../shared/photo-crop-editor', () => ({
  shrinkPhoto: vi.fn(async (file: Blob) => file),
  blobToImage: vi.fn(async () => ({ naturalWidth: 800, naturalHeight: 600 })),
  openPhotoCropEditor: vi.fn(() => ({ done: Promise.resolve(new Blob(['crop'])), close: vi.fn() })),
}))

const { puzzleGame } = await import('./index')

function mountContext() {
  return {
    settings: {
      childName: '',
      soundEnabled: false,
      musicEnabled: false,
      quietMode: false,
      hideEnglishAlphabet: false,
      countingLimit: 10 as const,
      balloonTasksEnabled: true,
      companion: 'olli' as const,
      puzzlePieceCount: 4 as const,
      puzzleTargetHint: true,
    },
    hubNavigation: { goMenu: vi.fn(), goWelcome: vi.fn(), goSettings: vi.fn(), onSoundToggle: vi.fn() },
  }
}

const cards = (host: HTMLElement) => [...host.querySelectorAll<HTMLButtonElement>('.puzzle__card')]
const photoCards = (host: HTMLElement) => [...host.querySelectorAll<HTMLButtonElement>('.puzzle__card[data-photo-id]')]
const role = (host: HTMLElement, name: string) => host.querySelector<HTMLButtonElement>(`[data-role="${name}"]`)!

async function mountWith(rows: Row[]): Promise<HTMLElement> {
  h.rows = rows
  const host = document.createElement('div')
  document.body.append(host)
  puzzleGame.mount(host, mountContext())
  await vi.waitFor(() => expect(photoCards(host)).toHaveLength(rows.length))
  return host
}

async function pickFile(host: HTMLElement): Promise<void> {
  host.querySelector<HTMLButtonElement>('.puzzle__add-photo-btn')!.click()
  const input = h.input!
  expect(input.click).toHaveBeenCalled()
  Object.defineProperty(input, 'files', { value: [new File(['x'], 'a.png', { type: 'image/png' })] })
  input.dispatchEvent(new Event('change'))
  await vi.waitFor(() => expect(host.querySelector('[data-text-input]')).not.toBeNull())
}

describe('puzzle — свои фото в галерее', () => {
  beforeEach(() => {
    const stored = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    })
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:photo') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    h.input = null
    vi.clearAllMocks()
  })

  afterEach(() => {
    puzzleGame.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
  })

  it('свои фото стоят первыми, с подписью; без подписи — «Моё фото»', async () => {
    const host = await mountWith([
      { id: 'p-2', createdAt: 2000, title: 'Бабушка' },
      { id: 'p-1', createdAt: 1000, title: '' },
    ])
    const all = cards(host)
    expect(all[0]!.dataset.photoId).toBe('p-2')
    expect(all[0]!.getAttribute('aria-label')).toBe('Бабушка')
    expect(all[0]!.querySelector('.puzzle__card-title')?.textContent).toBe('Бабушка')
    expect(all[1]!.querySelector('.puzzle__card-title')?.textContent).toBe('Моё фото')
    expect(all[2]!.dataset.sceneId).toBeTruthy()
  })

  it('своё фото: подогнал → подписал → фото сохраняется с подписью и сразу собирается', async () => {
    const host = await mountWith([])
    await pickFile(host)
    expect(host.textContent).toContain('Как назовём?')
    const input = host.querySelector<HTMLInputElement>('[data-text-input]')!
    input.value = '  Кот   Мурзик '
    host.querySelector<HTMLButtonElement>('[data-choice="ok"]')!.click()
    await vi.waitFor(() => expect(host.querySelector('.puzzle')?.getAttribute('data-view')).toBe('play'))
    expect(h.save).toHaveBeenCalledWith(expect.any(Blob), 'Кот Мурзик')
    expect(host.querySelector('.puzzle')?.getAttribute('data-scene')).toBe('photo')
  })

  it('«Без подписи» — «Моё фото N» со свободным номером', async () => {
    const host = await mountWith([{ id: 'p-1', createdAt: 1000, title: 'Моё фото 1' }])
    await pickFile(host)
    host.querySelector<HTMLButtonElement>('[data-choice="skip"]')!.click()
    await vi.waitFor(() => expect(h.save).toHaveBeenCalled())
    expect(h.save).toHaveBeenCalledWith(expect.any(Blob), 'Моё фото 2')
  })

  it('«Выбрать» есть только когда есть свои фото', async () => {
    const empty = await mountWith([])
    expect(role(empty, 'select-toggle').hidden).toBe(true)
    puzzleGame.unmount()
    const withPhoto = await mountWith([{ id: 'p-1', createdAt: 1000, title: 'Мама' }])
    expect(role(withPhoto, 'select-toggle').hidden).toBe(false)
  })

  it('«Выбрать» → отметить фото → «Удалить (1)» → подтвердить: фото уходит, картинки не трогаются', async () => {
    const host = await mountWith([
      { id: 'p-2', createdAt: 2000, title: 'Бабушка' },
      { id: 'p-1', createdAt: 1000, title: 'Мама' },
    ])
    role(host, 'select-toggle').click()
    expect(host.querySelector('.puzzle__picker')?.getAttribute('data-selecting')).toBe('1')
    expect(role(host, 'select-toggle').textContent).toBe('Готово')
    const scene = host.querySelector<HTMLButtonElement>('.puzzle__card[data-scene-id]')!
    expect(scene.disabled).toBe(true)

    const remove = role(host, 'delete-selected')
    expect(remove.disabled).toBe(true)
    photoCards(host)[0]!.click()
    expect(host.querySelector('.puzzle')?.getAttribute('data-view')).toBe('picker')
    expect(photoCards(host)[0]!.classList.contains('is-selected')).toBe(true)
    expect(photoCards(host)[0]!.getAttribute('aria-pressed')).toBe('true')
    expect(remove.textContent).toBe('Удалить (1)')

    remove.click()
    await vi.waitFor(() => expect(host.querySelector('[data-choice="yes"]')).not.toBeNull())
    host.querySelector<HTMLButtonElement>('[data-choice="yes"]')!.click()
    await vi.waitFor(() => expect(photoCards(host)).toHaveLength(1))
    expect(h.remove).toHaveBeenCalledWith(['p-2'])
    expect(photoCards(host)[0]!.dataset.photoId).toBe('p-1')
  })

  it('«Выбрать все» отмечает только свои фото; «Оставить» ничего не удаляет', async () => {
    const host = await mountWith([
      { id: 'p-2', createdAt: 2000, title: 'Бабушка' },
      { id: 'p-1', createdAt: 1000, title: 'Мама' },
    ])
    role(host, 'select-toggle').click()
    role(host, 'select-all').click()
    expect(role(host, 'delete-selected').textContent).toBe('Удалить (2)')
    role(host, 'delete-selected').click()
    await vi.waitFor(() => expect(host.querySelector('[data-choice="no"]')).not.toBeNull())
    host.querySelector<HTMLButtonElement>('[data-choice="no"]')!.click()
    await Promise.resolve()
    expect(h.remove).not.toHaveBeenCalled()
    expect(photoCards(host)).toHaveLength(2)
  })
})
