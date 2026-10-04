import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { countingGame } from './index'
import { EMPTY_LINES, PRAISE_LINES, TOGETHER_LINES } from './phrases'

type Opts = { limit?: 3 | 5 | 10; tasks?: string[]; hints?: boolean }

function mountContext(o: Opts = {}) {
  return {
    settings: {
      childName: '',
      soundEnabled: false,
      musicEnabled: false,
      quietMode: false,
      hideEnglishAlphabet: false,
      countingLimit: o.limit ?? 3,
      countingTasks: o.tasks ?? ['give', 'count', 'addRemove', 'howMany', 'compare'],
      countingAutoHints: o.hints ?? true,
      balloonTasksEnabled: true,
      companion: 'olli' as const,
    },
    hubNavigation: { goMenu: vi.fn(), goWelcome: vi.fn(), goSettings: vi.fn(), onSoundToggle: vi.fn() },
  }
}

const texts = (lines: readonly { text: string }[]) => lines.map((l) => l.text)
const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms)
const root = (host: HTMLElement) => host.querySelector<HTMLElement>('.counting')!
const speech = (host: HTMLElement) => host.querySelector('.game-presenter__speech')?.textContent ?? ''
const rugToys = (host: HTMLElement) => [...host.querySelectorAll<HTMLButtonElement>('.counting__rug .counting__toy')]
const boxToys = (host: HTMLElement, box = 0) => [
  ...host.querySelectorAll<HTMLElement>('.counting__box')[box]!.querySelectorAll<HTMLButtonElement>('.counting__toy'),
]
const boxHit = (host: HTMLElement, box = 0) =>
  host.querySelectorAll<HTMLElement>('.counting__box')[box]!.querySelector<HTMLButtonElement>('.counting__box-hit')!
const digit = (host: HTMLElement, n: number) =>
  host.querySelector<HTMLButtonElement>(`.counting__digit[data-n="${n}"]`)!
const tool = (host: HTMLElement, role: string) =>
  host.querySelector<HTMLButtonElement>(`.counting__bar-tools [data-role="${role}"]`)!

function mount(o: Opts = {}) {
  const host = document.createElement('div')
  document.body.append(host)
  const ctx = mountContext(o)
  countingGame.mount(host, ctx)
  return { host, ctx }
}

async function toTask(host: HTMLElement): Promise<void> {
  host.querySelector<HTMLButtonElement>('[aria-label="Задание"]')!.click()
  await wait(2500)
}

describe('counting mount (S16)', () => {
  let stored: Map<string, string>

  beforeEach(() => {
    vi.useFakeTimers()
    stored = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    })
  })

  afterEach(() => {
    countingGame.unmount()
    document.body.replaceChildren()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('шапка S16: назад + звук слева; справа «Свободно» / «Задание», «Игрушки», «Заново», «Подсказка», шестерёнка крайняя', () => {
    const { host, ctx } = mount()
    host.querySelector<HTMLButtonElement>('[aria-label="Назад в меню"]')!.click()
    expect(ctx.hubNavigation.goMenu).toHaveBeenCalled()
    host.querySelector<HTMLButtonElement>('[aria-label^="Звук"]')!.click()
    expect(ctx.hubNavigation.onSoundToggle).toHaveBeenCalledWith(true)
    const tools = host.querySelector<HTMLElement>('.counting__bar-tools')!
    const roles = [...tools.children].map((el) => (el as HTMLElement).dataset.role)
    expect(roles).toEqual(['modes', 'toys', 'again', 'hint', 'game-settings'])
    expect(tool(host, 'hint').hidden).toBe(true)
    ;(tools.lastElementChild as HTMLButtonElement).click()
    expect(ctx.hubNavigation.goSettings).toHaveBeenCalled()
  })

  it('«Свободно»: на коврике игрушки одного вида разных цветов (до 3), ящик пустой, цифры 1–3', () => {
    const { host } = mount()
    expect(root(host).dataset.mode).toBe('free')
    expect(root(host).dataset.toy).toBe('cube')
    const toys = rugToys(host)
    expect(toys).toHaveLength(3)
    expect(new Set(toys.map((t) => t.dataset.kind))).toEqual(new Set(['cube']))
    expect(new Set(toys.map((t) => t.dataset.color)).size).toBe(3)
    expect(boxToys(host)).toHaveLength(0)
    expect(host.querySelectorAll('.counting__digit')).toHaveLength(3)
    expect(speech(host)).toBe('Давай считать! Положи кубик в ящик.')
    expect(host.querySelector<HTMLImageElement>('.counting__bg')!.src).toContain('counting-bg.webp')
  })

  it('положил — ведущий называет, сколько в ящике; цифра на ящике', async () => {
    const { host } = mount()
    rugToys(host)[0]!.click()
    expect(boxToys(host)).toHaveLength(1)
    expect(root(host).dataset.count).toBe('1')
    expect(speech(host)).toBe('Один кубик!')
    const sticker = host.querySelector<HTMLImageElement>('.counting__box-digit')!
    expect(sticker.hidden).toBe(false)
    expect(sticker.src).toContain('digits/1.png')
    await wait(400)
    rugToys(host)[0]!.click()
    expect(speech(host)).toBe('Два кубика!')
    expect(sticker.src).toContain('digits/2.png')
  })

  it('достал — «было — стало», последнюю — «пусто»', async () => {
    const { host } = mount()
    rugToys(host)[0]!.click()
    rugToys(host)[0]!.click()
    await wait(400)
    boxToys(host)[0]!.click()
    expect(boxToys(host)).toHaveLength(1)
    expect(rugToys(host)).toHaveLength(2)
    expect(speech(host)).toBe('Было два, остался один!')
    boxToys(host)[0]!.click()
    expect(texts(EMPTY_LINES)).toContain(speech(host))
    expect(host.querySelector<HTMLImageElement>('.counting__box-digit')!.hidden).toBe(true)
  })

  it('все в ящике — «Все кубики в ящике!», потом сколько, праздник', async () => {
    const { host } = mount()
    for (let i = 0; i < 3; i += 1) rugToys(host)[0]!.click()
    expect(speech(host)).toBe('Все кубики в ящике!')
    await wait(2500)
    expect(speech(host)).toBe('Три кубика!')
    expect(root(host).classList.contains('is-party')).toBe(true)
  })

  it('тап по ящику — пересчёт вслух: «Один, два — два кубика!»', async () => {
    const { host } = mount()
    rugToys(host)[0]!.click()
    rugToys(host)[0]!.click()
    boxHit(host).click()
    await wait(300)
    expect(speech(host)).toMatch(/^Один/)
    await wait(3000)
    expect(speech(host)).toBe('Один, два — два кубика!')
  })

  it('цифра на панели — ведущий называет', () => {
    const { host } = mount()
    digit(host, 3).click()
    expect(speech(host)).toBe('Три')
  })

  it('«Игрушки» — ряд из 7, выбрал звёздочки — на коврике звёздочки, выбор помнится', () => {
    const { host } = mount()
    tool(host, 'toys').click()
    const pop = host.querySelector<HTMLElement>('.counting__toys-pop')!
    expect(pop.hidden).toBe(false)
    const choices = [...pop.querySelectorAll<HTMLButtonElement>('.counting__toys-choice')]
    expect(choices.map((c) => c.dataset.kind)).toEqual(['ball', 'cube', 'star', 'pyramid', 'heart', 'duck', 'ring'])
    choices[2]!.click()
    expect(pop.hidden).toBe(true)
    expect(root(host).dataset.toy).toBe('star')
    expect(new Set(rugToys(host).map((t) => t.dataset.kind))).toEqual(new Set(['star']))
    expect(speech(host)).toBe('Теперь считаем звёздочки!')
    countingGame.unmount()
    const again = mount()
    expect(root(again.host).dataset.toy).toBe('star')
  })

  it('«Считаем до 10» — 10 игрушек и 10 цифр', () => {
    const { host } = mount({ limit: 10 })
    expect(rugToys(host)).toHaveLength(10)
    expect(host.querySelectorAll('.counting__digit')).toHaveLength(10)
  })

  it('«Заново» в «Свободно» — все игрушки обратно на коврик', () => {
    const { host } = mount()
    rugToys(host)[0]!.click()
    rugToys(host)[0]!.click()
    tool(host, 'again').click()
    expect(boxToys(host)).toHaveLength(0)
    expect(rugToys(host)).toHaveLength(3)
    expect(root(host).dataset.count).toBe('0')
  })

  it('«Задание»: «Положи N», положил N — похвала и следующее задание', async () => {
    const { host } = mount({ tasks: ['give'] })
    host.querySelector<HTMLButtonElement>('[aria-label="Задание"]')!.click()
    expect(speech(host)).toBe('Давай поиграем в задания!')
    await wait(2500)
    expect(root(host).dataset.task).toBe('give')
    expect(tool(host, 'hint').hidden).toBe(false)
    const target = Number(root(host).dataset.target)
    expect(speech(host)).toMatch(/^Положи в ящик /)
    expect(rugToys(host).length).toBeGreaterThan(target)
    for (let i = 0; i < target; i += 1) rugToys(host)[0]!.click()
    await wait(1200)
    expect(texts(PRAISE_LINES)).toContain(speech(host))
    const round = root(host).dataset.round
    await wait(4000)
    expect(root(host).dataset.round).not.toBe(round)
  })

  it('«Положи N»: положил больше — «Многовато!», без «нет»', async () => {
    const { host } = mount({ tasks: ['give'] })
    await toTask(host)
    const target = Number(root(host).dataset.target)
    for (let i = 0; i <= target; i += 1) rugToys(host)[0]!.click()
    await wait(1500)
    expect(speech(host)).toBe('Многовато! Давай одну достанем.')
  })

  it('«Сколько?»: цифра на ящике спрятана; ошибка — посчитаем вместе, после 2 — сияет нужная цифра', async () => {
    const { host } = mount({ tasks: ['howMany'] })
    await toTask(host)
    expect(root(host).dataset.task).toBe('howMany')
    expect(host.querySelector<HTMLImageElement>('.counting__box-digit')!.hidden).toBe(true)
    const target = Number(root(host).dataset.target)
    expect(boxToys(host)).toHaveLength(target)
    const wrong = target === 1 ? 2 : 1
    digit(host, wrong).click()
    expect(texts(TOGETHER_LINES)).toContain(speech(host))
    await wait(6000)
    digit(host, wrong).click()
    expect(digit(host, target).classList.contains('is-glow')).toBe(true)
    await wait(6000)
    digit(host, target).click()
    expect(speech(host)).toMatch(/^(Один|Одна|Одно|Два|Две|Три) /)
    await wait(1500)
    expect(texts(PRAISE_LINES)).toContain(speech(host))
  })

  it('«Где больше?»: два ящика, тап по большему — «Да! Здесь больше!»', async () => {
    const { host } = mount({ tasks: ['compare'] })
    await toTask(host)
    expect(root(host).dataset.task).toBe('compare')
    expect(host.querySelectorAll('.counting__box')).toHaveLength(2)
    const left = Number(root(host).dataset.left)
    const right = Number(root(host).dataset.right)
    expect(boxToys(host, 0)).toHaveLength(left)
    expect(boxToys(host, 1)).toHaveLength(right)
    boxHit(host, left > right ? 0 : 1).click()
    expect(speech(host)).toBe('Да! Здесь больше!')
  })

  it('«Посчитай»: тап по каждой — номер над игрушкой, в конце сколько всего', async () => {
    const { host } = mount({ tasks: ['count'] })
    await toTask(host)
    expect(root(host).dataset.task).toBe('count')
    const toys = rugToys(host)
    expect(toys).toHaveLength(Number(root(host).dataset.target))
    toys[0]!.click()
    expect(speech(host)).toBe('Один')
    expect(toys[0]!.querySelector('.counting__badge')!.textContent).toBe('1')
    toys[0]!.click()
    expect(speech(host)).toBe('Один')
    await wait(700)
    for (const t of toys.slice(1)) {
      t.click()
      await wait(700)
    }
    expect(speech(host)).toMatch(/кубик/)
    await wait(1200)
    expect(texts(PRAISE_LINES)).toContain(speech(host))
  })

  it('«Добавь одну»: в ящике уже есть, добавил одну — «было — стало»', async () => {
    const { host } = mount({ tasks: ['addRemove'] })
    await toTask(host)
    await wait(2500)
    expect(root(host).dataset.task).toBe('add')
    const start = Number(root(host).dataset.start)
    expect(boxToys(host)).toHaveLength(start)
    rugToys(host)[0]!.click()
    expect(speech(host)).toMatch(/^Был(о)? .+, стало .+!$/)
  })

  it('подсказки сами: через 6 с повтор задания, через 12 с сияние; кнопка «Подсказка» — сразу', async () => {
    const { host } = mount({ tasks: ['howMany'] })
    await toTask(host)
    const task = speech(host)
    const target = Number(root(host).dataset.target)
    await wait(6200)
    expect(speech(host)).toBe(task)
    await wait(6200)
    expect(digit(host, target).classList.contains('is-glow')).toBe(true)

    countingGame.unmount()
    const quiet = mount({ tasks: ['howMany'], hints: false })
    await toTask(quiet.host)
    await wait(13000)
    const t2 = Number(root(quiet.host).dataset.target)
    expect(digit(quiet.host, t2).classList.contains('is-glow')).toBe(false)
    tool(quiet.host, 'hint').click()
    expect(digit(quiet.host, t2).classList.contains('is-glow')).toBe(true)
  })
})
