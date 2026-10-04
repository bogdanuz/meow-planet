/**
 * «В гости» — фразы персонажа. Текст в облачке; ключ `file` — имя будущей озвучки
 * (`docs/assets/meow-home-VOICE-SCRIPT.md`), пока mp3 нет и звучит только облачко.
 * Кот и сова говорят о себе по-своему: зубки/клювик, лапки/крылышки, шёрстка/пёрышки.
 */
import { voiceLine, type VoiceLine } from '../../shared/voice-lines'
import type { Who } from './art'
import type { CareAction, Wish } from './wishes'
import type { Season, WearItem } from './weather'

type Body = { teethShine: string; teeth: string; pawsClean: string; furDry: string; purr: string }

const BODY: Record<Who, Body> = {
  meow: {
    teethShine: 'Зубки блестят!',
    teeth: 'зубки',
    pawsClean: 'Лапки чистые!',
    furDry: 'Шёрстка сухая!',
    purr: 'Мррр… Приятно.',
  },
  olli: {
    teethShine: 'Клювик блестит!',
    teeth: 'клювик',
    pawsClean: 'Крылышки чистые!',
    furDry: 'Пёрышки сухие!',
    purr: 'Уху-у… Приятно.',
  },
}

/** Винительный падеж вещи: «Дай …», «Сними …». */
export const WEAR_ACC: Record<WearItem, string> = {
  hat: 'шапку',
  panama: 'панамку',
  glasses: 'очки',
  scarf: 'шарфик',
  mittens: 'варежки',
  coat: 'курточку',
  raincoat: 'дождевик',
  boots: 'сапожки',
  valenki: 'валенки',
  umbrella: 'зонтик',
}

export const WEAR_LABEL: Record<WearItem, string> = {
  hat: 'Шапка',
  panama: 'Панамка',
  glasses: 'Очки',
  scarf: 'Шарфик',
  mittens: 'Варежки',
  coat: 'Курточка',
  raincoat: 'Дождевик',
  boots: 'Сапожки',
  valenki: 'Валенки',
  umbrella: 'Зонтик',
}

export const SEASON_LABEL: Record<Season, string> = {
  winter: 'Зима',
  spring: 'Весна',
  summer: 'Лето',
  autumn: 'Осень',
}

export function phrasesFor(who: Who) {
  const b = BODY[who]
  const l = (key: string, text: string): VoiceLine => voiceLine(`${who}-${key}`, text)
  const wish: Record<Wish, readonly VoiceLine[]> = {
    hungry: [l('wish-hungry-1', 'Я проголодался… Пойдём на кухню?'), l('wish-hungry-2', 'Животик урчит. Покушаем?')],
    sleepy: [l('wish-sleepy-1', 'Ой, глазки закрываются… Пора в кроватку.'), l('wish-sleepy-2', 'Я устал. Пойдём спать?')],
    dirty: [l('wish-dirty-1', 'Ой, я грязный. Пойдём в ванную?')],
    messy: [l('wish-messy-1', 'Ой, я весь в каше! Где салфетка?')],
    teeth: [l('wish-teeth-1', `Покушал — теперь почистим ${b.teeth}!`)],
    potty: [l('wish-potty-1', 'Ой-ой! Мне надо на горшок!')],
    play: [l('wish-play-1', 'Давай поиграем! Пойдём в спальню?'), l('wish-play-2', 'Мне скучно… Где мои игрушки?')],
    cold: [l('wish-cold-1', 'Бррр, я замёрз… Сделаем тёплое какао?')],
  }
  const done: Record<CareAction, readonly VoiceLine[]> = {
    eat: [l('eat-1', 'Мммм, вкусно!'), l('eat-2', 'Ням-ням! Спасибо!')],
    drink: [l('drink-1', 'Глоть-глоть! Вкусно!')],
    cocoa: [l('cocoa-1', 'Тёплое какао! Сразу согрелся.')],
    napkin: [l('napkin-1', 'Вот и чисто! Спасибо!')],
    teeth: [l('teeth-1', `Шурх-шурх! ${b.teethShine}`)],
    'wash-paws': [l('wash-1', `Плюх-плюх! ${b.pawsClean}`)],
    bath: [l('bath-1', 'Буль-буль! Пузырьки!'), l('bath-2', 'Тёплая водичка! Плюх!')],
    towel: [l('towel-1', `Вытираемся… ${b.furDry}`)],
    potty: [l('potty-1', 'Успел! Ура!')],
    sleep: [l('sleep-1', 'Спокойной ночи…')],
    book: [l('book-1', 'Какая интересная книжка!')],
    ball: [l('ball-1', 'Лови мячик! Хи-хи!')],
    blocks: [l('blocks-1', 'Строим башню! Вот какая высокая!')],
    pajama: [l('pajama-1', 'Пижамка! Мягкая, тёплая.')],
  }
  return {
    wish,
    done,
    hello: [l('hello-1', 'Привет! Заходи в гости!'), l('hello-2', 'Ура, ты пришёл! Заходи!')],
    helloNight: [l('hello-night-1', 'Тсс… Уже ночь. Заходи тихонько.')],
    giggle: [l('giggle-1', 'Хи-хи! Щекотно!'), l('giggle-2', 'Ой, хи-хи!')],
    purr: [l('purr-1', b.purr)],
    wake: [l('wake-1', 'Доброе утро! Я выспался!')],
    morning: [l('morning-1', 'Утро! Солнышко встало.')],
    evening: [l('evening-1', 'Вечер. Скоро спать.')],
    fridge: [l('fridge-1', 'Ого, сколько еды!')],
    lamp: [l('lamp-1', 'Ночник светит. Уютно.')],
    goOut: [l('go-out-1', 'Пойдём гулять!')],
    homeDressed: [l('home-dressed-1', 'Дома тепло. Помоги раздеться!')],
    undressed: [l('undressed-1', 'Вот так. Повесим на вешалку.')],
    wetHome: [l('wet-home-1', 'Я промок… Где полотенце?')],
    dressNow: [l('dress-1', 'Надень на меня!')],
    ok: [l('ok-1', 'Вот теперь хорошо!'), l('ok-2', 'Тепло и уютно!'), l('ok-3', 'Красота!')],
    wet: [l('wet-1', 'Ой, дождик! Я промокаю… Дай зонтик!')],
    wantHat: [l('want-hat-1', 'Бррр, холодно! Дай шапку.')],
    wantCoat: [l('want-coat-1', 'Всё равно холодно… Дай курточку!')],
    wantCoatCool: [l('want-coat-cool-1', 'Прохладно. Надену курточку.')],
    wantValenki: [l('want-valenki-1', 'Лапки мёрзнут! Где валенки?')],
    coldFeet: [l('cold-feet-1', 'В сапожках холодно! Дай валенки.')],
    wantScarf: [l('want-scarf-1', 'Ветер дует! Дай шарфик.')],
    wantPanama: [l('want-panama-1', 'Солнце печёт! Дай панамку.')],
    hot: (item: WearItem): VoiceLine => l(`hot-${item}`, `Уф, жарко! Сними ${WEAR_ACC[item]}.`),
    season: {
      winter: [l('season-winter', 'Зима! Сколько снега!')],
      spring: [l('season-spring', 'Весна! Птички поют.')],
      summer: [l('season-summer', 'Лето! Тепло и солнышко.')],
      autumn: [l('season-autumn', 'Осень! Листики падают.')],
    } satisfies Record<Season, readonly VoiceLine[]>,
    night: [l('night-1', 'Смотри, луна и звёзды!')],
    rain: [l('rain-1', 'Кап-кап! Дождик пошёл.')],
    snow: [l('snow-1', 'Снежок падает!')],
    wind: [l('wind-1', 'Ух, какой ветер!')],
    sun: [l('sun-1', 'Солнышко!')],
    clouds: [l('clouds-1', 'Тучки набежали.')],
    rainbow: [l('rainbow-1', 'Радуга! Какая красивая!')],
    puddleBoots: [l('puddle-boots-1', 'Плюх! В сапожках весело!')],
    puddleDirty: [l('puddle-dirty-1', 'Ой! Лапки испачкались.')],
    snowman: [
      l('snowman-1', 'Катаем ком…'),
      l('snowman-2', 'Ещё один!'),
      l('snowman-3', 'Голова! Нужна морковка.'),
      l('snowman-4', 'Снеговик готов!'),
    ],
    melt: [l('melt-1', 'Снеговик растаял… Будет лужица.')],
    sled: [l('sled-1', 'Ух ты! Поехали!')],
    leaves: [l('leaves-1', 'Шурх! Листики полетели!')],
    castle: [l('castle-1', 'Песочный замок!')],
    watering: [l('watering-1', 'Цветочки пьют водичку.')],
    icecream: [l('icecream-1', 'Мороженое! Холодненькое!')],
    icecreamMelt: [l('icecream-melt-1', 'Ой, мороженое тает!')],
    swing: [l('swing-1', 'Качели! Выше-выше!')],
    boat: [l('boat-1', 'Кораблик плывёт!')],
    bird: [l('bird-1', 'Птичка полетела!')],
    butterfly: [l('butterfly-1', 'Бабочка!')],
    squirrel: [l('squirrel-1', 'Белочка!')],
    bullfinch: [l('bullfinch-1', 'Снегирь! Красная грудка.')],
    frog: [l('frog-1', 'Ква-ква!')],
    snail: [l('snail-1', 'Улитка ползёт.')],
    mushroom: [l('mushroom-1', 'Грибочек вырос!')],
    flower: [l('flower-1', 'Цветочек!')],
    firefly: [l('firefly-1', 'Светлячки!')],
    star: [l('star-1', 'Звёздочка!')],
    moon: [l('moon-1', 'Луна светит.')],
    streetLamp: [l('street-lamp-1', 'Фонарик горит.')],
    kite: [l('kite-1', 'Воздушный змей летит!')],
  }
}

export type Phrases = ReturnType<typeof phrasesFor>
