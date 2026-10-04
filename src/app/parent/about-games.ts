import {
  parentBlurbsInMenuOrder,
  PARENT_GAMES_NOTE,
  PARENT_HELPER_NOTE,
} from '../../content/parent-game-blurbs'

/** Текст рисуется внутри `host`, класс самой панели не трогаем: на нём прокрутка. */
export function renderAboutGamesPanel(host: HTMLElement): void {
  const panel = document.createElement('div')
  panel.className = 'parent-about'

  const intro = document.createElement('p')
  intro.className = 'parent-about__lead'
  intro.textContent =
    'Подробно о каждой игре: как она устроена, что практикует ребёнок и как играть вместе без давления (2–3 года).'

  const helper = document.createElement('p')
  helper.className = 'parent-about__helper'
  helper.textContent = PARENT_HELPER_NOTE

  const list = document.createElement('ul')
  list.className = 'parent-about__list'

  for (const game of parentBlurbsInMenuOrder()) {
    const wrap = document.createElement('li')
    wrap.className = 'parent-about__card'

    const item = document.createElement('article')
    item.className = 'parent-about__item'

    const title = document.createElement('h3')
    title.className = 'parent-about__title'
    title.textContent = game.title

    const introText = document.createElement('p')
    introText.className = 'parent-about__intro'
    introText.textContent = game.intro

    const block = (heading: string, text: string, extraClass = ''): HTMLElement => {
      const box = document.createElement('section')
      box.className = `parent-about__block ${extraClass}`.trim()
      const h = document.createElement('h4')
      h.className = 'parent-about__heading'
      h.textContent = heading
      const p = document.createElement('p')
      p.className = 'parent-about__text'
      p.textContent = text
      box.append(h, p)
      return box
    }

    item.append(
      title,
      introText,
      block('Что происходит для ребёнка', game.forChild),
      block('Как это перекликается с проверенными подходами', game.evidence),
      block('Как играть вместе', game.playTogether, 'parent-about__block--together'),
      block('Продолжение без экрана', game.offline, 'parent-about__block--offline'),
    )
    wrap.append(item)
    list.append(wrap)
  }

  const note = document.createElement('p')
  note.className = 'parent-about__note'
  note.textContent = PARENT_GAMES_NOTE

  panel.append(intro, helper, list, note)
  host.replaceChildren(panel)
}
