// Workbox precache в `dist/sw.js` матчится по URL без query-параметров.
// Поэтому в рантайм не добавляем `?v=...`, чтобы офлайн-режим не ломался.

const RU_ORDER = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'

function publicUrl(file: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  return `${base}assets/games/sound-world/${file}`
}

export function cardArtUrl(id: string): string {
  return publicUrl(`cards/${id}.png`)
}

export function instrumentPlayUrl(id: string): string {
  return publicUrl(`play/${id}.png`)
}

export function letterArtFileName(id: string): string {
  if (id.startsWith('en-')) return `en-${id.slice(3)}.png`
  if (id.startsWith('ru-')) {
    const letter = id.slice(3)
    const index = RU_ORDER.indexOf(letter)
    if (index < 0) return `ru-${letter}.png`
    return `ru-${String(index + 1).padStart(2, '0')}.png`
  }
  return `${id}.png`
}

export function letterArtUrl(id: string): string {
  return publicUrl(`letters/${letterArtFileName(id)}`)
}
