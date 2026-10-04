import {
  DEFAULT_SETTINGS,
  loadSettings,
  resetSettings,
  sanitizeChildName,
  saveSettings,
  type AppSettings,
  COUNTING_LIMIT_CHOICES,
  COUNTING_TASK_IDS,
  type CountingLimit,
  type CountingTaskId,
  type HideSeekLevel,
  type PuzzlePieceCount,
  SANDBOX_MAX_PIECES_CHOICES,
  type SandboxMaxPieces,
  type SandboxPieceSize,
} from '../../shared/storage'
import { clearGalleryStars, type GalleryStarGame } from '../../shared/gallery-progress'
import { clearSandboxPhotos } from '../../shared/sandbox-photos'
import { SHELF_KINDS, getPieceSpec } from '../../games/shape-build/pieces'
import { type CompanionId } from '../../shared/companion'
import type { AudioManager } from '../../shared/audio'
import { askChoice } from '../../shared/ask-choice'
import { clearPuzzlePhotos } from '../../shared/puzzle-photos'
import { createUiIconImg } from '../../shared/ui-icon'
import { GAMES, type GameId } from '../../content/catalog'
import { CHILD_NAME_USED_IN_RELEASED_GAMES, isGameReleased } from '../../content/released-games'
import { menuCardPngUrl } from '../menu-cards'

export type SettingsFormHandlers = {
  onSaved: (settings: AppSettings) => void
  audio?: AudioManager
  appVersion: string
  /** Раздел, открытый сразу (id игры, из которой пришли). Нет такого раздела — «Общее». */
  initialSection?: string
}

type SectionId = 'general' | GameId

function audioSwitch(
  id: string,
  title: string,
  get: () => boolean,
  apply: (value: boolean) => void,
  persist: () => void,
): { row: HTMLElement; paint: () => void } {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.id = id
  btn.className = 'touch-btn settings-audio-btn'
  const paint = (): void => {
    const on = get()
    btn.textContent = `${title}: ${on ? 'вкл' : 'выкл'}`
    btn.setAttribute('aria-pressed', on ? 'true' : 'false')
  }
  paint()
  btn.addEventListener('click', () => {
    apply(!get())
    paint()
    persist()
  })
  return { row: btn, paint }
}

function toggleRow(
  id: string,
  label: string,
  checked: boolean,
  onChange: (value: boolean) => void,
): HTMLElement {
  const row = document.createElement('label')
  row.className = 'settings-row'
  row.htmlFor = id

  const text = document.createElement('span')
  text.textContent = label

  const input = document.createElement('input')
  input.type = 'checkbox'
  input.id = id
  input.className = 'settings-toggle'
  input.checked = checked
  input.addEventListener('change', () => onChange(input.checked))

  row.append(text, input)
  return row
}

/** Карточка пунктов внутри раздела. */
function group(title: string, ...children: HTMLElement[]): HTMLElement {
  const box = document.createElement('div')
  box.className = 'settings-group'
  if (title) {
    const heading = document.createElement('h3')
    heading.className = 'settings-group__title'
    heading.textContent = title
    box.append(heading)
  }
  box.append(...children)
  return box
}

function choiceField<T extends string | number>(
  id: string,
  legend: string,
  choices: readonly (readonly [T, string])[],
  dataKey: string,
  get: () => T,
  set: (value: T) => void,
): { field: HTMLFieldSetElement; paint: () => void } {
  const field = document.createElement('fieldset')
  if (id) field.id = id
  field.className = 'settings-companion'
  const caption = document.createElement('legend')
  caption.textContent = legend
  field.append(caption)
  const paint = (): void => {
    field.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset[dataKey] === String(get()) ? 'true' : 'false')
    })
  }
  for (const [value, label] of choices) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'touch-btn settings-companion__card'
    btn.dataset[dataKey] = String(value)
    btn.textContent = label
    btn.addEventListener('click', () => {
      set(value)
      paint()
    })
    field.append(btn)
  }
  paint()
  return { field, paint }
}

/**
 * Настройки как на iPad: слева разделы («Общее» + выпущенные игры со своими пунктами),
 * справа пункты выбранного. Имя ребёнка — только через value/textContent, никогда innerHTML.
 */
export function renderSettingsForm(
  container: HTMLElement,
  handlers: SettingsFormHandlers,
): () => void {
  let settings = loadSettings()
  const showName = CHILD_NAME_USED_IN_RELEASED_GAMES

  const form = document.createElement('form')
  form.className = 'settings-form'
  form.addEventListener('submit', (event) => event.preventDefault())

  const nav = document.createElement('nav')
  nav.className = 'settings-nav'
  nav.setAttribute('role', 'tablist')
  nav.setAttribute('aria-label', 'Разделы настроек')
  const pages = document.createElement('div')
  pages.className = 'settings-pages'
  form.append(nav, pages)

  const sections: SectionId[] = []
  function addSection(id: SectionId, title: string, ...content: HTMLElement[]): void {
    sections.push(id)
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'settings-nav__item'
    item.dataset.section = id
    item.setAttribute('role', 'tab')
    const icon =
      id === 'general'
        ? createUiIconImg('settings', { decorative: true })
        : Object.assign(document.createElement('img'), { src: menuCardPngUrl(id), alt: '', decoding: 'async' })
    icon.classList.add('settings-nav__icon')
    const label = document.createElement('span')
    label.className = 'settings-nav__label'
    label.textContent = title
    item.append(icon, label)
    item.addEventListener('click', () => openSection(id))
    nav.append(item)

    const page = document.createElement('section')
    page.className = 'settings-page'
    page.dataset.section = id
    page.setAttribute('role', 'tabpanel')
    page.setAttribute('aria-label', title)
    const heading = document.createElement('h2')
    heading.className = 'settings-page__title'
    heading.textContent = title
    page.append(heading, ...content)
    pages.append(page)
  }

  function openSection(id: SectionId): void {
    nav.querySelectorAll<HTMLButtonElement>('.settings-nav__item').forEach((item) => {
      const on = item.dataset.section === id
      item.classList.toggle('is-active', on)
      item.setAttribute('aria-selected', on ? 'true' : 'false')
    })
    pages.querySelectorAll<HTMLElement>('.settings-page').forEach((page) => {
      page.hidden = page.dataset.section !== id
    })
    form.dataset.section = id
    pages.scrollTop = 0
  }

  const persist = (): void => {
    const saved = saveSettings(settings)
    if (!saved) return
    handlers.audio?.updateSettings(settings)
    handlers.onSaved(settings)
  }
  const patch = (next: Partial<AppSettings>): void => {
    settings = { ...settings, ...next }
    persist()
  }

  // ── Общее ──
  const musicSwitch = audioSwitch(
    'music-enabled',
    'Музыка',
    () => settings.musicEnabled,
    (v) => {
      settings = { ...settings, musicEnabled: v }
    },
    persist,
  )
  const soundSwitch = audioSwitch(
    'sound-enabled',
    'Звуки эффектов',
    () => settings.soundEnabled,
    (v) => {
      settings = { ...settings, soundEnabled: v }
    },
    persist,
  )
  const audioRow = document.createElement('div')
  audioRow.className = 'settings-pair'
  audioRow.append(musicSwitch.row, soundSwitch.row)

  const companion = choiceField<CompanionId>(
    '',
    'Кто помогает в играх',
    [
      ['meow', 'Котёнок Мяу'],
      ['olli', 'Сова'],
    ],
    'companion',
    () => settings.companion,
    (v) => patch({ companion: v }),
  )

  let nameInput: HTMLInputElement | null = null
  let refreshGreeting: (() => void) | null = null
  const childGroup: HTMLElement[] = []
  if (showName) {
    const nameLabel = document.createElement('label')
    nameLabel.className = 'settings-field'
    nameLabel.htmlFor = 'child-name'
    const nameTitle = document.createElement('span')
    nameTitle.textContent = 'Имя ребёнка'
    nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.id = 'child-name'
    nameInput.className = 'settings-input'
    nameInput.maxLength = 40
    nameInput.autocomplete = 'off'
    nameInput.value = settings.childName
    nameLabel.append(nameTitle, nameInput)

    const greeting = document.createElement('p')
    greeting.className = 'settings-greeting'
    greeting.setAttribute('aria-live', 'polite')
    refreshGreeting = (): void => {
      const name = sanitizeChildName(nameInput!.value)
      greeting.replaceChildren()
      if (name) {
        const prefix = document.createTextNode('В «Лопни шарик» будет обращение: ')
        const strong = document.createElement('strong')
        strong.textContent = name
        greeting.append(prefix, strong)
      } else {
        greeting.textContent = 'Имя не задано — обращения по имени не будет.'
      }
    }
    refreshGreeting()
    // На iPad «Назад» при открытой клавиатуре убирает поле без события change.
    const saveName = (): void => {
      const name = sanitizeChildName(nameInput!.value)
      if (name !== settings.childName) patch({ childName: name })
      refreshGreeting?.()
    }
    nameInput.addEventListener('input', saveName)
    nameInput.addEventListener('change', saveName)
    childGroup.push(nameLabel, greeting)
  }

  const resetBtn = document.createElement('button')
  resetBtn.type = 'button'
  resetBtn.className = 'touch-btn touch-btn--quiet'
  resetBtn.textContent = 'Сбросить настройки'
  const version = document.createElement('p')
  version.className = 'settings-version'
  version.textContent = `Версия приложения: ${handlers.appVersion}`
  const actions = document.createElement('div')
  actions.className = 'settings-actions'
  actions.append(resetBtn, version)

  addSection(
    'general',
    'Общее',
    group('Звук', audioRow),
    group('Помощник', companion.field),
    ...(childGroup.length ? [group('Ребёнок', ...childGroup)] : []),
    group('', actions),
  )

  // ── Игры: только выпущенные и только те, где есть что настраивать ──
  const gameTitle = (id: GameId): string => GAMES.find((g) => g.id === id)?.title ?? id

  /** Одинаковый во всех играх с галереей: стереть звёздочки «собрано». */
  const resetStarsGroup = (game: GalleryStarGame & GameId): HTMLElement => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.id = `${game}-reset-stars`
    btn.className = 'touch-btn touch-btn--quiet'
    btn.textContent = 'Начать заново'
    btn.addEventListener('click', () => {
      void askChoice(container, `Стереть все звёздочки в «${gameTitle(game)}»?`, [
        { id: 'yes', label: 'Стереть' },
        { id: 'no', label: 'Оставить' },
      ]).then((choice) => {
        if (choice === 'yes') clearGalleryStars(game)
      })
    })
    const note = document.createElement('p')
    note.className = 'settings-greeting'
    note.textContent = 'Звёздочки на собранных картинках в галерее пропадут, можно собирать с начала.'
    return group('Звёздочки', btn, note)
  }

  if (isGameReleased('balloon-pop')) {
    addSection(
      'balloon-pop',
      gameTitle('balloon-pop'),
      group(
        'Игра',
        toggleRow('balloon-tasks', 'Задания: найди шарик нужного цвета или размера', settings.balloonTasksEnabled, (v) =>
          patch({ balloonTasksEnabled: v }),
        ),
      ),
    )
  }

  if (isGameReleased('sound-world')) {
    addSection(
      'sound-world',
      gameTitle('sound-world'),
      group(
        'Буквы',
        toggleRow('hide-en', 'Скрыть английский алфавит', settings.hideEnglishAlphabet, (v) =>
          patch({ hideEnglishAlphabet: v }),
        ),
      ),
    )
  }

  let paintPuzzlePieces: (() => void) | null = null
  if (isGameReleased('puzzle')) {
    const pieces = choiceField<PuzzlePieceCount>(
      'puzzle-pieces',
      'Сколько кусочков',
      [
        [4, '4'],
        [6, '6'],
        [9, '9'],
      ],
      'count',
      () => settings.puzzlePieceCount,
      (v) => patch({ puzzlePieceCount: v }),
    )
    paintPuzzlePieces = pieces.paint

    const clearPhotos = document.createElement('button')
    clearPhotos.type = 'button'
    clearPhotos.id = 'puzzle-clear-photos'
    clearPhotos.className = 'touch-btn touch-btn--quiet'
    clearPhotos.textContent = 'Убрать все свои фото'
    clearPhotos.addEventListener('click', () => {
      void askChoice(container, 'Убрать все свои фото из «Собери пазл»?', [
        { id: 'yes', label: 'Убрать' },
        { id: 'no', label: 'Оставить' },
      ]).then((choice) => {
        if (choice === 'yes') void clearPuzzlePhotos().catch(() => undefined)
      })
    })
    const photoNote = document.createElement('p')
    photoNote.className = 'settings-greeting'
    photoNote.textContent = 'По одному фото можно удалить прямо в галерее пазла: «Выбрать» → «Удалить».'

    addSection(
      'puzzle',
      gameTitle('puzzle'),
      group('Сложность', pieces.field),
      group(
        'Подсказка',
        toggleRow('puzzle-hint', 'Подсвечивать, куда положить кусочек', settings.puzzleTargetHint, (v) =>
          patch({ puzzleTargetHint: v }),
        ),
      ),
      group('Свои фото', clearPhotos, photoNote),
      resetStarsGroup('puzzle'),
    )
  }

  let paintSandbox: (() => void) | null = null
  if (isGameReleased('shape-build')) {
    const realRow = toggleRow('sandbox-real', 'Физика «как в жизни»', settings.sandboxRealPhysics, (v) =>
      patch({ sandboxRealPhysics: v }),
    )
    const realNote = document.createElement('p')
    realNote.className = 'settings-greeting'
    realNote.textContent =
      'Выключено — спокойная физика: детали меньше скользят и не разлетаются далеко, малышу проще строить. Включено — всё скользит, прыгает и падает, как в жизни.'
    const straightRow = toggleRow(
      'sandbox-straight',
      'Деталь в руке сама встаёт ровно',
      settings.sandboxAutoStraight,
      (v) => patch({ sandboxAutoStraight: v }),
    )
    const stickyRow = toggleRow('sandbox-sticky', '«Липучка»: поставленная деталь прилипает', settings.sandboxSticky, (v) =>
      patch({ sandboxSticky: v }),
    )
    const stickyNote = document.createElement('p')
    stickyNote.className = 'settings-greeting'
    stickyNote.textContent =
      'Деталь, аккуратно поставленная рукой, чуть прилипает к соседям, как в конструкторе. Сильный удар или «Бум!» её отрывает. Скрепить крепко — кнопка «Склеить» у детали.'
    const maxPieces = choiceField<SandboxMaxPieces>(
      'sandbox-max',
      'Сколько деталей на экране',
      SANDBOX_MAX_PIECES_CHOICES.map((n) => [n, String(n)] as const),
      'max',
      () => settings.sandboxMaxPieces,
      (v) => patch({ sandboxMaxPieces: v }),
    )
    const pieceSize = choiceField<SandboxPieceSize>(
      'sandbox-size',
      'Размер деталей',
      [
        ['big', 'Крупные'],
        ['small', 'Средние'],
        ['tiny', 'Мелкие'],
      ],
      'size',
      () => settings.sandboxPieceSize,
      (v) => patch({ sandboxPieceSize: v }),
    )

    const kinds = document.createElement('div')
    kinds.id = 'sandbox-kinds'
    kinds.className = 'settings-kinds'
    const kindInputs: HTMLInputElement[] = []
    for (const kind of SHELF_KINDS) {
      const row = toggleRow(`sandbox-kind-${kind}`, getPieceSpec(kind).titleRu, !settings.sandboxHiddenKinds.includes(kind), (on) => {
        const hidden = new Set(settings.sandboxHiddenKinds)
        if (on) hidden.delete(kind)
        else hidden.add(kind)
        patch({ sandboxHiddenKinds: SHELF_KINDS.filter((k) => hidden.has(k)) })
      })
      const input = row.querySelector('input')!
      input.dataset.kind = kind
      kindInputs.push(input)
      kinds.append(row)
    }
    const kindsNote = document.createElement('p')
    kindsNote.className = 'settings-greeting'
    kindsNote.textContent = 'Снятые детали не появятся в шкафу. Кубик остаётся всегда.'

    const clearPhotos = document.createElement('button')
    clearPhotos.type = 'button'
    clearPhotos.id = 'sandbox-clear-photos'
    clearPhotos.className = 'touch-btn touch-btn--quiet'
    clearPhotos.textContent = 'Убрать все фото построек'
    clearPhotos.addEventListener('click', () => {
      void askChoice(container, `Убрать все фото построек из «${gameTitle('shape-build')}»?`, [
        { id: 'yes', label: 'Убрать' },
        { id: 'no', label: 'Оставить' },
      ]).then((choice) => {
        if (choice === 'yes') void clearSandboxPhotos().catch(() => undefined)
      })
    })
    const photoNote = document.createElement('p')
    photoNote.className = 'settings-greeting'
    photoNote.textContent = 'По одному фото можно удалить в галерее игры: «Выбрать» → «Удалить».'

    const cheats = document.createElement('ul')
    cheats.id = 'sandbox-cheats'
    cheats.className = 'settings-cheats'
    for (const [gesture, text] of [
      ['Нажать', 'на механизм — он срабатывает (пушка стреляет, кнопка жмётся, лампочка горит). На кубик или доску — кнопки вокруг детали.'],
      ['Подержать палец', 'на любой детали полсекунды — под пальцем растёт кружок, потом открываются кнопки.'],
      ['Смахнуть', 'деталь — она летит дугой. Тащить можно до трёх деталей разными пальцами.'],
      ['Зарядить', 'ракету или пушку: поднести к ней предмет и подержать — он втянется. Нажать на ракету — полетит и у потолка выстрелит грузом.'],
      ['Мяу и Олли', '— нажмите на них: сделают пару шагов и помашут. Возят, катаются и засыпают, если их долго не трогать.'],
      ['Ещё', '— в игре «Ещё» → «Как играть» → «Хитрости»: провода, кнопка набок, пушка на шариках и тележке.'],
    ] as const) {
      const li = document.createElement('li')
      const b = document.createElement('b')
      b.textContent = gesture
      li.append(b, ` ${text}`)
      cheats.append(li)
    }

    paintSandbox = (): void => {
      maxPieces.paint()
      pieceSize.paint()
      realRow.querySelector('input')!.checked = settings.sandboxRealPhysics
      straightRow.querySelector('input')!.checked = settings.sandboxAutoStraight
      stickyRow.querySelector('input')!.checked = settings.sandboxSticky
      for (const input of kindInputs) input.checked = !settings.sandboxHiddenKinds.includes(input.dataset.kind ?? '')
    }

    addSection(
      'shape-build',
      gameTitle('shape-build'),
      group('Как управлять', cheats),
      group('Физика', realRow, realNote, straightRow, stickyRow, stickyNote),
      group('Детали', pieceSize.field, maxPieces.field),
      group('Что лежит в шкафу', kinds, kindsNote),
      group('Фото построек', clearPhotos, photoNote),
    )
  }

  let paintHideSeek: (() => void) | null = null
  if (isGameReleased('hide-seek')) {
    const level = choiceField<HideSeekLevel>(
      'hide-seek-level',
      'Как спрятаны предметы',
      [
        ['easy', 'Легко'],
        ['medium', 'Средне'],
        ['hard', 'Сложно'],
      ],
      'level',
      () => settings.hideSeekLevel,
      (v) => patch({ hideSeekLevel: v }),
    )
    const levelNote = document.createElement('p')
    levelNote.className = 'settings-greeting'
    levelNote.textContent =
      'Легко — 3 предмета, видны почти целиком. Средне — 4, выглядывают наполовину. Сложно — 5, сливаются с картинкой, рядом бывает похожий предмет-обманка.'
    const mirrorRow = toggleRow('hide-seek-mirror', 'Иногда показывать картинку зеркально', settings.hideSeekMirror, (v) =>
      patch({ hideSeekMirror: v }),
    )
    const hintsRow = toggleRow('hide-seek-hints', 'Подсказки сами', settings.hideSeekAutoHints, (v) =>
      patch({ hideSeekAutoHints: v }),
    )
    const hintsNote = document.createElement('p')
    hintsNote.className = 'settings-greeting'
    hintsNote.textContent =
      'Через 6 секунд ведущий повторяет задание, через 12 — мягко подсвечивает место. Кнопка «Подсказка» в игре работает всегда.'

    paintHideSeek = (): void => {
      level.paint()
      mirrorRow.querySelector('input')!.checked = settings.hideSeekMirror
      hintsRow.querySelector('input')!.checked = settings.hideSeekAutoHints
    }

    addSection(
      'hide-seek',
      gameTitle('hide-seek'),
      group('Сложность', level.field, levelNote),
      group('Картинки', mirrorRow),
      group('Подсказки', hintsRow, hintsNote),
      resetStarsGroup('hide-seek'),
    )
  }

  let paintCounting: (() => void) | null = null
  if (isGameReleased('counting')) {
    const limit = choiceField<CountingLimit>(
      'counting-limit',
      'Считаем до',
      COUNTING_LIMIT_CHOICES.map((n) => [n, `до ${n}`] as const),
      'limit',
      () => settings.countingLimit,
      (v) => patch({ countingLimit: v }),
    )
    const limitNote = document.createElement('p')
    limitNote.className = 'settings-greeting'
    limitNote.textContent =
      'Столько игрушек лежит на коврике и столько цифр внизу. В заданиях числа растут понемногу: с трёх, и только до этого предела.'

    const taskLabels: Record<CountingTaskId, string> = {
      give: 'Положи в ящик несколько игрушек',
      count: 'Посчитай по одной — нажимай на каждую',
      addRemove: 'Добавь одну / убери одну',
      howMany: 'Сколько в ящике? — нажми на цифру',
      compare: 'Где больше? — два ящика',
    }
    const taskRows = COUNTING_TASK_IDS.map((id) =>
      toggleRow(`counting-task-${id}`, taskLabels[id], settings.countingTasks.includes(id), (on) => {
        const next = COUNTING_TASK_IDS.filter((t) => (t === id ? on : settings.countingTasks.includes(t)))
        patch({ countingTasks: next })
      }),
    )
    const tasksNote = document.createElement('p')
    tasksNote.className = 'settings-greeting'
    tasksNote.textContent = 'Задания идут по кругу. Если выключить все, останется «Положи в ящик».'

    const hintsRow = toggleRow('counting-hints', 'Подсказки сами', settings.countingAutoHints, (v) =>
      patch({ countingAutoHints: v }),
    )
    const hintsNote = document.createElement('p')
    hintsNote.className = 'settings-greeting'
    hintsNote.textContent =
      'Через 6 секунд ведущий повторяет задание, через 12 — мягко подсвечивает, что нажать. Кнопка «Подсказка» в игре работает всегда.'

    paintCounting = (): void => {
      limit.paint()
      COUNTING_TASK_IDS.forEach((id, i) => {
        taskRows[i]!.querySelector('input')!.checked = settings.countingTasks.includes(id)
      })
      hintsRow.querySelector('input')!.checked = settings.countingAutoHints
    }

    addSection(
      'counting',
      gameTitle('counting'),
      group('Сколько считаем', limit.field, limitNote),
      group('Какие задания', ...taskRows, tasksNote),
      group('Подсказки', hintsRow, hintsNote),
    )
  }

  let paintMeowHome: (() => void) | null = null
  if (isGameReleased('meow-home')) {
    const note = (text: string): HTMLParagraphElement => {
      const p = document.createElement('p')
      p.className = 'settings-greeting'
      p.textContent = text
      return p
    }
    const pottyRow = toggleRow('meow-home-potty', 'Горшок в ванной', settings.meowHomePotty, (v) => patch({ meowHomePotty: v }))
    const wishesRow = toggleRow('meow-home-wishes', 'Персонаж сам показывает, чего хочет', settings.meowHomeWishes, (v) =>
      patch({ meowHomeWishes: v }),
    )
    const timeRow = toggleRow('meow-home-realtime', 'День и ночь по настоящим часам', settings.meowHomeRealTime, (v) =>
      patch({ meowHomeRealTime: v }),
    )
    const seasonRow = toggleRow('meow-home-season-date', 'Сезон во дворе по настоящей дате', settings.meowHomeSeasonByDate, (v) =>
      patch({ meowHomeSeasonByDate: v }),
    )

    paintMeowHome = (): void => {
      pottyRow.querySelector('input')!.checked = settings.meowHomePotty
      wishesRow.querySelector('input')!.checked = settings.meowHomeWishes
      timeRow.querySelector('input')!.checked = settings.meowHomeRealTime
      seasonRow.querySelector('input')!.checked = settings.meowHomeSeasonByDate
    }

    addSection(
      'meow-home',
      gameTitle('meow-home'),
      group('Уход', pottyRow, wishesRow, note('Желание видно по движению и облачку-мысли с картинкой; дверь нужной комнаты светится. Не помогли — через 20 секунд персонаж просто играет дальше.')),
      group('Время', timeRow, note('Выключено — игра всегда начинается днём. Ночь можно включить в игре: нажать на окно.'), seasonRow, note('Выключено — во дворе лето. Сезон меняется плиткой «Сезон» в игре.')),
    )
  }

  resetBtn.addEventListener('click', () => {
    settings = resetSettings()
    if (nameInput) {
      nameInput.value = ''
      refreshGreeting?.()
    }
    soundSwitch.paint()
    musicSwitch.paint()
    companion.paint()
    const hideEn = form.querySelector<HTMLInputElement>('#hide-en')
    if (hideEn) hideEn.checked = DEFAULT_SETTINGS.hideEnglishAlphabet
    const balloonTasks = form.querySelector<HTMLInputElement>('#balloon-tasks')
    if (balloonTasks) balloonTasks.checked = DEFAULT_SETTINGS.balloonTasksEnabled
    const puzzleHint = form.querySelector<HTMLInputElement>('#puzzle-hint')
    if (puzzleHint) puzzleHint.checked = DEFAULT_SETTINGS.puzzleTargetHint
    paintPuzzlePieces?.()
    paintSandbox?.()
    paintHideSeek?.()
    paintCounting?.()
    paintMeowHome?.()
    handlers.audio?.updateSettings(settings)
    handlers.onSaved(settings)
  })

  const wanted = handlers.initialSection as SectionId | undefined
  openSection(wanted && sections.includes(wanted) ? wanted : 'general')
  container.replaceChildren(form)

  return () => undefined
}
