/**
 * «В гости» — разметка комнат в процентах фона 4:3 (замерено по `assets-master/games/meow-home/mh-*.jpg`).
 * Spot: x — центр, y — низ картинки (a: 't' — верх, 'c' — центр); w — ширина в % сцены, h — высота в % сцены.
 */
import type { CareAction, Room, Wish } from './wishes'
import type { WearItem } from './weather'

export type Spot = { readonly x: number; readonly y: number; readonly w?: number; readonly h?: number; readonly a?: 'b' | 't' | 'c' }
export type Rect = { readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number }

export type HomeRoom = Exclude<Room, 'yard'>

/** Персонаж дома: клетка кадра 2:3, ноги у нижнего края. */
export const HERO_SPOT: Record<HomeRoom, Spot> = {
  hall: { x: 47, y: 98, w: 29 },
  bath: { x: 46, y: 98, w: 29 },
  kitchen: { x: 50, y: 98, w: 29 },
  bedroom: { x: 47, y: 98, w: 29 },
}

/** Персонаж на улице и одетый в прихожей: холст 1:1. */
export const DOLL_SPOT: Record<'hall' | 'yard', Spot> = {
  hall: { x: 47, y: 99, w: 40 },
  yard: { x: 45, y: 99, w: 42 },
}

/** Двери прихожей в комнаты и таблички над ними. */
export const HALL_DOORS: Record<Exclude<Room, 'hall'>, { rect: Rect; plaque: Spot; label: string }> = {
  bath: { rect: { x0: 3, y0: 7, x1: 13.5, y1: 60 }, plaque: { x: 8.2, y: 22.8, w: 6, a: 'c' }, label: 'Ванная' },
  kitchen: { rect: { x0: 25, y0: 7, x1: 40, y1: 49 }, plaque: { x: 32.5, y: 20, w: 6, a: 'c' }, label: 'Кухня' },
  bedroom: { rect: { x0: 46, y0: 7, x1: 62, y1: 49 }, plaque: { x: 54, y: 20, w: 6, a: 'c' }, label: 'Спальня' },
  yard: { rect: { x0: 85, y0: 7, x1: 97, y1: 60 }, plaque: { x: 91, y: 19, w: 6, a: 'c' }, label: 'На улицу' },
}

/** Дверь из комнаты обратно в прихожую. */
export const BACK_DOOR: Record<Exclude<HomeRoom, 'hall'> | 'yard', Rect> = {
  bath: { x0: 3, y0: 7, x1: 13, y1: 60 },
  kitchen: { x0: 3, y0: 7, x1: 13, y1: 60 },
  bedroom: { x0: 2, y0: 7, x1: 13, y1: 60 },
  yard: { x0: 9, y0: 28, x1: 18, y1: 51 },
}

/** Окно: тап — день ↔ ночь. */
export const WINDOW: Record<Room, Rect> = {
  hall: { x0: 69, y0: 7, x1: 80, y1: 28 },
  bath: { x0: 70, y0: 6, x1: 85, y1: 28 },
  kitchen: { x0: 47, y0: 5, x1: 68, y1: 31 },
  bedroom: { x0: 23, y0: 4, x1: 48, y1: 37 },
  yard: { x0: 20.5, y0: 30, x1: 27.5, y1: 42 },
}

/** Вешалка и полка для обуви в прихожей. */
export const RACK: Record<WearItem, Spot> = {
  hat: { x: 66.6, y: 33.6, w: 5, a: 't' },
  scarf: { x: 70, y: 33.6, w: 4, a: 't' },
  coat: { x: 73.4, y: 33.6, w: 5.6, a: 't' },
  raincoat: { x: 76.8, y: 33.6, w: 5.6, a: 't' },
  umbrella: { x: 79.8, y: 33.6, w: 3, a: 't' },
  mittens: { x: 67.4, y: 42.2, w: 4.6 },
  panama: { x: 72.4, y: 42.2, w: 5.2 },
  glasses: { x: 77.6, y: 42.2, w: 4.6 },
  boots: { x: 69.4, y: 50.8, w: 5.4 },
  valenki: { x: 76.6, y: 50.8, w: 5.4 },
}

/** Предмет заботы: картинка, место, действие. */
export type CareProp = { readonly id: string; readonly art: string; readonly spot: Spot; readonly action: CareAction; readonly label: string }

export const ROOM_PROPS: Record<Exclude<HomeRoom, 'hall'>, readonly CareProp[]> = {
  bath: [
    { id: 'toothbrush', art: 'toothbrush', spot: { x: 21.5, y: 36.5, w: 5.5 }, action: 'teeth', label: 'Зубная щётка' },
    { id: 'cup', art: 'cup', spot: { x: 37, y: 21.4, w: 3.6 }, action: 'teeth', label: 'Стаканчик' },
    { id: 'paste', art: 'paste', spot: { x: 41.2, y: 21.4, w: 2.6 }, action: 'teeth', label: 'Зубная паста' },
    { id: 'soap', art: 'soap', spot: { x: 29, y: 36.5, w: 4.6 }, action: 'wash-paws', label: 'Мыло' },
    { id: 'sponge', art: 'sponge', spot: { x: 65, y: 38.5, w: 5 }, action: 'bath', label: 'Губка' },
    { id: 'duck', art: 'duck', spot: { x: 88.5, y: 38.5, w: 5 }, action: 'bath', label: 'Уточка' },
    { id: 'towel', art: 'towel', spot: { x: 93, y: 78, w: 9 }, action: 'towel', label: 'Полотенце' },
    { id: 'potty', art: 'potty', spot: { x: 26, y: 80, w: 9 }, action: 'potty', label: 'Горшок' },
  ],
  kitchen: [
    { id: 'porridge', art: 'porridge', spot: { x: 69, y: 43, w: 6.5 }, action: 'eat', label: 'Каша' },
    { id: 'milk', art: 'milk', spot: { x: 75, y: 42.5, w: 3.8 }, action: 'drink', label: 'Молоко' },
    { id: 'apple', art: 'apple', spot: { x: 79.6, y: 43, w: 4 }, action: 'eat', label: 'Яблоко' },
    { id: 'cookie', art: 'cookie', spot: { x: 84.6, y: 44, w: 4.6 }, action: 'eat', label: 'Печенье' },
    { id: 'napkin', art: 'napkin', spot: { x: 87, y: 49, w: 4.4 }, action: 'napkin', label: 'Салфетка' },
    { id: 'cocoa', art: 'cocoa', spot: { x: 43.5, y: 34, w: 4.6 }, action: 'cocoa', label: 'Какао' },
  ],
  bedroom: [
    { id: 'book', art: 'book', spot: { x: 57.5, y: 38.6, w: 4.6 }, action: 'book', label: 'Книжка' },
    { id: 'blocks', art: 'blocks', spot: { x: 20, y: 89, w: 8 }, action: 'blocks', label: 'Кубики' },
    { id: 'ball', art: 'ball', spot: { x: 31, y: 93, w: 6.5 }, action: 'ball', label: 'Мячик' },
    { id: 'pajama', art: 'pajama', spot: { x: 74, y: 80, w: 9 }, action: 'pajama', label: 'Пижамка' },
  ],
}

/** Еда в открытом холодильнике (днём фон меняется на открытый). */
export const FRIDGE: Rect = { x0: 16, y0: 14, x1: 32, y1: 51 }
export const FRIDGE_FOOD: readonly { id: string; rect: Rect; action: CareAction; label: string }[] = [
  { id: 'fridge-milk', rect: { x0: 20, y0: 19, x1: 24, y1: 28 }, action: 'drink', label: 'Молоко' },
  { id: 'fridge-cheese', rect: { x0: 23.5, y0: 22, x1: 29, y1: 28 }, action: 'eat', label: 'Сыр' },
  { id: 'fridge-pot', rect: { x0: 22.5, y0: 31, x1: 29.5, y1: 38.5 }, action: 'eat', label: 'Кастрюлька' },
  { id: 'fridge-apple', rect: { x0: 19.5, y0: 32, x1: 23, y1: 38 }, action: 'eat', label: 'Яблоко' },
  { id: 'fridge-fish', rect: { x0: 20, y0: 40, x1: 29, y1: 46 }, action: 'eat', label: 'Рыбка' },
  { id: 'fridge-berries', rect: { x0: 13.5, y0: 39, x1: 18, y1: 47 }, action: 'eat', label: 'Ягодки' },
]

/** Ванна (кадры купания) и кровать (кадры сна) — одна клетка 2:3, совпадает с кадрами. */
export const TUB: Rect = { x0: 60, y0: 36, x1: 93, y1: 56 }
export const SINK: Rect = { x0: 17, y0: 26, x1: 34, y1: 40 }
export const BATH_SPOT: Spot = { x: 76.5, y: 66, w: 38 }
export const BED_SPOT: Spot = { x: 80, y: 104, w: 36 }
export const NIGHTLIGHT: Rect = { x0: 77, y0: 28, x1: 86, y1: 42 }

/** Картинка желания в облачке мыслей и предметы, которые его исполняют. */
export const WISH_ICON: Record<Wish, string> = {
  hungry: 'porridge',
  sleepy: 'pillow',
  dirty: 'soap',
  messy: 'napkin',
  teeth: 'toothbrush',
  potty: 'potty',
  play: 'ball',
  cold: 'cocoa',
}

export const WISH_PROPS: Record<Wish, readonly string[]> = {
  hungry: ['porridge', 'milk', 'apple', 'cookie', 'fridge'],
  sleepy: ['bed'],
  dirty: ['soap', 'sink', 'sponge', 'duck', 'tub'],
  messy: ['napkin'],
  teeth: ['toothbrush', 'cup', 'paste'],
  potty: ['potty'],
  play: ['ball', 'blocks', 'book'],
  cold: ['cocoa'],
}
