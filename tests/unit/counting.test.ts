import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { COUNTING_VOICE_RECORDED, countingVoiceUrl } from '../../src/games/counting/art'
import { createSeededRandom } from '../../src/shared/random'
import { TOY_KINDS } from '../../src/shared/toys'
import {
  advanceProgress,
  biggerSide,
  boxSlots,
  buildTask,
  checkAdd,
  checkGive,
  checkRemove,
  createProgress,
  enabledTaskTypes,
  mixedColors,
  nextTaskType,
  RUG_ASPECT,
  rugSlots,
  taskMax,
  TASK_TOGGLES,
} from '../../src/games/counting/logic'
import {
  allInLine,
  ALL_VOICE_LINES,
  addLine,
  compareLine,
  countLine,
  countTaskLine,
  freeStartLine,
  giveLine,
  howManyLine,
  kindLine,
  lessLine,
  moreLine,
  numLine,
  removeLine,
} from '../../src/games/counting/phrases'
import { countForm, numberWordRu, toyCountRu, toyGender } from '../../src/games/counting/words'

describe('counting — слова', () => {
  it('форма по числу: 1 — один, 2–4 — несколько, 5–10 — много', () => {
    expect(countForm(1)).toBe('one')
    expect([2, 3, 4].map(countForm)).toEqual(['few', 'few', 'few'])
    expect([5, 6, 7, 8, 9, 10].every((n) => countForm(n) === 'many')).toBe(true)
  })

  it('числительное согласовано с родом: один / одна / одно, два / две', () => {
    expect(numberWordRu(1, 'm')).toBe('один')
    expect(numberWordRu(1, 'f')).toBe('одна')
    expect(numberWordRu(1, 'n')).toBe('одно')
    expect(numberWordRu(1, 'f', 'acc')).toBe('одну')
    expect(numberWordRu(2, 'f')).toBe('две')
    expect(numberWordRu(2, 'n')).toBe('два')
    expect(numberWordRu(10, 'm')).toBe('десять')
  })

  it('«три кубика», «пять звёздочек», «одно сердечко», «две уточки»', () => {
    expect(toyCountRu('cube', 3)).toBe('три кубика')
    expect(toyCountRu('star', 5)).toBe('пять звёздочек')
    expect(toyCountRu('heart', 1)).toBe('одно сердечко')
    expect(toyCountRu('duck', 2)).toBe('две уточки')
    expect(toyCountRu('ring', 7)).toBe('семь колечек')
    expect(toyCountRu('pyramid', 4)).toBe('четыре пирамидки')
    expect(toyCountRu('ball', 10)).toBe('десять мячиков')
    expect(toyCountRu('star', 1, 'acc')).toBe('одну звёздочку')
    expect(toyGender('ball')).toBe('m')
    expect(toyGender('duck')).toBe('f')
    expect(toyGender('ring')).toBe('n')
  })
})

describe('counting — фразы ведущего', () => {
  it('цифры и количество с игрушкой', () => {
    expect(numLine(3)).toEqual({ file: 'num-3.mp3', text: 'Три' })
    expect(countLine('cube', 3)).toEqual({ file: 'count-cube-3.mp3', text: 'Три кубика!' })
    expect(countLine('star', 1).text).toBe('Одна звёздочка!')
    expect(countLine('heart', 5).text).toBe('Пять сердечек!')
  })

  it('свободный режим: начало, смена игрушек, все в ящике, было — стало', () => {
    expect(freeStartLine('star').text).toBe('Давай считать! Положи звёздочку в ящик.')
    expect(freeStartLine('cube').file).toBe('start-cube.mp3')
    expect(kindLine('duck').text).toBe('Теперь считаем уточек!')
    expect(allInLine('ball').text).toBe('Все мячики в ящике!')
    expect(moreLine(3).text).toBe('Было два, стало три!')
    expect(moreLine(2).text).toBe('Был один, стало два!')
    expect(lessLine(2).text).toBe('Было три, стало два!')
    expect(lessLine(1).text).toBe('Было два, остался один!')
  })

  it('задания', () => {
    expect(giveLine('cube', 3)).toEqual({ file: 'give-cube-3.mp3', text: 'Положи в ящик три кубика!' })
    expect(giveLine('star', 1).text).toBe('Положи в ящик одну звёздочку!')
    expect(countTaskLine('cube').text).toBe('Посчитай кубики! Нажимай на каждый.')
    expect(countTaskLine('star').text).toBe('Посчитай звёздочки! Нажимай на каждую.')
    expect(countTaskLine('duck').text).toBe('Посчитай уточек! Нажимай на каждую.')
    expect(addLine('m').text).toBe('Добавь ещё один!')
    expect(addLine('f').text).toBe('Добавь ещё одну!')
    expect(removeLine('n').text).toBe('Убери одно!')
    expect(howManyLine('ring').text).toBe('Сколько колечек в ящике? Нажми на цифру!')
    expect(compareLine('ball').text).toBe('Где больше мячиков? Нажми на ящик!')
  })

  it('список фраз для записи: без повторов файлов, все игрушки × 10 чисел', () => {
    const files = ALL_VOICE_LINES.map((l) => l.file)
    expect(new Set(files).size).toBe(files.length)
    for (const kind of TOY_KINDS) {
      for (let n = 1; n <= 10; n += 1) {
        expect(files).toContain(`count-${kind}-${n}.mp3`)
        expect(files).toContain(`give-${kind}-${n}.mp3`)
      }
    }
    for (let n = 1; n <= 10; n += 1) expect(files).toContain(`num-${n}.mp3`)
    expect(ALL_VOICE_LINES.every((l) => /^[a-z0-9-]+\.mp3$/.test(l.file) && l.text.length > 0)).toBe(true)
  })
})

describe('counting — задания', () => {
  it('галочки взрослого → типы заданий; «добавь / убери» — два типа; пусто → «положи N»', () => {
    expect(TASK_TOGGLES).toEqual(['give', 'count', 'addRemove', 'howMany', 'compare'])
    expect(enabledTaskTypes(TASK_TOGGLES)).toEqual(['give', 'count', 'add', 'howMany', 'remove', 'compare'])
    expect(enabledTaskTypes(['addRemove'])).toEqual(['add', 'remove'])
    expect(enabledTaskTypes([])).toEqual(['give'])
    expect(enabledTaskTypes(['junk'])).toEqual(['give'])
  })

  it('сложность растёт: до 3, потом +1 каждые 3 задания, не выше «считаем до»', () => {
    let p = createProgress()
    expect(taskMax(p, 10)).toBe(3)
    for (let i = 0; i < 3; i += 1) p = advanceProgress(p)
    expect(taskMax(p, 10)).toBe(4)
    expect(taskMax(p, 3)).toBe(3)
    for (let i = 0; i < 30; i += 1) p = advanceProgress(p)
    expect(taskMax(p, 5)).toBe(5)
    expect(taskMax(p, 10)).toBe(10)
  })

  it('типы идут по кругу', () => {
    const types = enabledTaskTypes(['give', 'howMany'])
    let p = createProgress()
    const seen: string[] = []
    for (let i = 0; i < 4; i += 1) {
      seen.push(nextTaskType(p, types))
      p = advanceProgress(p)
    }
    expect(seen).toEqual(['give', 'howMany', 'give', 'howMany'])
  })

  it('задания в пределах сложности; на коврике есть лишние игрушки', () => {
    const rng = createSeededRandom(7)
    for (let i = 0; i < 60; i += 1) {
      const give = buildTask('give', 3, rng)
      if (give.type !== 'give') throw new Error('type')
      expect(give.target).toBeGreaterThanOrEqual(1)
      expect(give.target).toBeLessThanOrEqual(3)
      expect(give.rug).toBeGreaterThanOrEqual(give.target + 1)

      const count = buildTask('count', 5, rng)
      if (count.type !== 'count') throw new Error('type')
      expect(count.target).toBeGreaterThanOrEqual(2)
      expect(count.target).toBeLessThanOrEqual(5)

      const add = buildTask('add', 4, rng)
      if (add.type !== 'add') throw new Error('type')
      expect(add.start).toBeGreaterThanOrEqual(1)
      expect(add.start).toBeLessThanOrEqual(3)
      expect(add.rug).toBeGreaterThanOrEqual(2)

      const remove = buildTask('remove', 4, rng)
      if (remove.type !== 'remove') throw new Error('type')
      expect(remove.start).toBeGreaterThanOrEqual(2)
      expect(remove.start).toBeLessThanOrEqual(4)

      const cmp = buildTask('compare', 3, rng)
      if (cmp.type !== 'compare') throw new Error('type')
      expect(cmp.left).not.toBe(cmp.right)
      expect(Math.max(cmp.left, cmp.right)).toBeLessThanOrEqual(3)
      expect(biggerSide(cmp)).toBe(cmp.left > cmp.right ? 'left' : 'right')
    }
  })

  it('«положи N»: ждём, готово, многовато', () => {
    expect(checkGive(2, 3)).toBe('wait')
    expect(checkGive(3, 3)).toBe('done')
    expect(checkGive(4, 3)).toBe('too-many')
  })

  it('«добавь одну» и «убери одну»', () => {
    expect(checkAdd(2, 2)).toBe('wait')
    expect(checkAdd(3, 2)).toBe('done')
    expect(checkAdd(4, 2)).toBe('too-many')
    expect(checkAdd(1, 2)).toBe('wrong-way')
    expect(checkRemove(3, 3)).toBe('wait')
    expect(checkRemove(2, 3)).toBe('done')
    expect(checkRemove(1, 3)).toBe('too-many')
    expect(checkRemove(4, 3)).toBe('wrong-way')
  })
})

describe('counting — раскладка', () => {
  it('цвета вперемешку: соседние разные', () => {
    const colors = mixedColors(10, createSeededRandom(3))
    expect(colors).toHaveLength(10)
    for (let i = 1; i < colors.length; i += 1) expect(colors[i]).not.toBe(colors[i - 1])
  })

  it('в ящике каждую игрушку видно: до 5 — один ряд, больше — два ряда', () => {
    expect(boxSlots(0)).toEqual([])
    const three = boxSlots(3)
    expect(new Set(three.map((s) => s.y)).size).toBe(1)
    const ten = boxSlots(10)
    expect(new Set(ten.map((s) => s.y)).size).toBe(2)
    for (const slots of [boxSlots(5), ten]) {
      const rows = new Map<number, number[]>()
      for (const s of slots) rows.set(s.y, [...(rows.get(s.y) ?? []), s.x])
      for (const xs of rows.values()) {
        xs.sort((a, b) => a - b)
        for (let i = 1; i < xs.length; i += 1) expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(slots[0]!.scale * 0.95)
      }
    }
    expect(boxSlots(3)[0]!.scale).toBeGreaterThan(boxSlots(8)[0]!.scale)
  })

  it('задний ряд в ящике выглядывает из-за переднего, а не висит над ящиком', () => {
    const slots = boxSlots(8)
    const front = slots.slice(0, 5)
    const back = slots.slice(5)
    expect(back.every((s) => s.y < front[0]!.y)).toBe(true)
    expect(front[0]!.y - back[0]!.y).toBeLessThanOrEqual(0.3)
    expect(back.every((s) => s.y >= 0.45)).toBe(true)
  })

  /** Ряды коврика: соседние по высоте игрушки дальше трети высоты игрушки — уже другой ряд. */
  const rowsOf = ({ toyW, slots }: ReturnType<typeof rugSlots>) => {
    const sorted = [...slots].sort((a, b) => a.y - b.y)
    const rows: (typeof slots)[] = []
    for (const s of sorted) {
      const last = rows.at(-1)
      if (last && s.y - last.at(-1)!.y < toyW * RUG_ASPECT * 0.3) last.push(s)
      else rows.push([s])
    }
    return rows
  }

  it('на коврике до 4 — один ряд, больше — два (задний ряд выше)', () => {
    expect(rugSlots(4, createSeededRandom(1)).rows).toBe(1)
    const ten = rugSlots(10, createSeededRandom(1))
    expect(ten.rows).toBe(2)
    expect(ten.slots).toHaveLength(10)
    expect(rowsOf(ten)).toHaveLength(2)
  })

  it('игрушки стоят только на нарисованном коврике: низ каждой — внутри овала, при любом числе и разбросе', () => {
    for (let n = 1; n <= 10; n += 1) {
      for (let seed = 1; seed <= 12; seed += 1) {
        const { toyW, slots } = rugSlots(n, createSeededRandom(seed))
        const toyH = toyW * RUG_ASPECT
        for (const s of slots) {
          const footX = (s.x - 0.5) / 0.5
          const footY = (s.y + toyH * 0.35 - 0.5) / 0.5
          expect(footX ** 2 + footY ** 2, `n=${n} seed=${seed}`).toBeLessThanOrEqual(1)
          expect(s.x - toyW * 0.4).toBeGreaterThanOrEqual(0)
          expect(s.x + toyW * 0.4).toBeLessThanOrEqual(1)
          expect(s.y + toyH / 2).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('на коврике игрушки крупные и не налезают друг на друга в ряду', () => {
    expect(rugSlots(3, createSeededRandom(1)).toyW).toBeGreaterThanOrEqual(0.18)
    const ten = rugSlots(10, createSeededRandom(1))
    expect(ten.toyW).toBeGreaterThanOrEqual(0.13)
    for (const row of rowsOf(ten)) {
      const xs = row.map((s) => s.x).sort((a, b) => a - b)
      for (let i = 1; i < xs.length; i += 1) expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(ten.toyW * 0.95)
    }
  })
})

describe('counting — озвучка', () => {
  it('на диске ровно mp3 первых COUNTING_VOICE_RECORDED строк скрипта; голос — только у них', () => {
    const dir = path.resolve(__dirname, '../../public/assets/games/counting/voice')
    const onDisk = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.mp3')).sort() : []
    const recorded = ALL_VOICE_LINES.slice(0, COUNTING_VOICE_RECORDED)
    const pending = ALL_VOICE_LINES.slice(COUNTING_VOICE_RECORDED)
    expect(onDisk).toEqual(recorded.map((l) => l.file).sort())
    for (const l of recorded) expect(countingVoiceUrl(l.file)).toMatch(new RegExp(`assets/games/counting/voice/${l.file}$`))
    for (const l of pending) expect(countingVoiceUrl(l.file)).toBeNull()
  })

  it('counting-VOICE-SCRIPT.md совпадает с кодом строка в строку', () => {
    const md = readFileSync(path.resolve(__dirname, '../../docs/assets/counting-VOICE-SCRIPT.md'), 'utf8')
    const rows = [...md.matchAll(/^\|\s*`([a-z0-9-]+\.mp3)`\s*\|\s*(.+?)\s*\|\s*$/gm)].map((m) => ({
      file: m[1]!,
      text: m[2]!,
    }))
    expect(rows).toEqual(ALL_VOICE_LINES.map(({ file, text }) => ({ file, text })))
  })
})
