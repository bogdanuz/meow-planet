import { readFile } from 'node:fs/promises'

const swSource = await readFile('dist/sw.js', 'utf8')
const manifestMatch = swSource.match(
  /precacheAndRoute\((\[.*?\]),\{\}\)/,
)
if (!manifestMatch) {
  throw new Error('Не найден Workbox precacheAndRoute в dist/sw.js')
}

const workboxEntries = Function(
  `"use strict"; return (${manifestMatch[1]})`,
)()
const workboxUrls = workboxEntries.map(
  /** @param {{ url: string }} entry */ (entry) => entry.url,
)
const uniqueWorkboxUrls = [...new Set(workboxUrls)]
if (uniqueWorkboxUrls.length !== workboxUrls.length) {
  throw new Error(
    `Workbox manifest содержит дубликаты: ${workboxUrls.length} записей, ${uniqueWorkboxUrls.length} уникальных URL`,
  )
}

const runtimeManifest = JSON.parse(
  await readFile('dist/precache-manifest.json', 'utf8'),
)
if (runtimeManifest.version !== 1) {
  throw new Error(
    `Неподдерживаемая версия runtime precache manifest: ${runtimeManifest.version}`,
  )
}
const runtimeUrls = runtimeManifest.urls
if (!Array.isArray(runtimeUrls)) {
  throw new Error('dist/precache-manifest.json не содержит массив urls')
}

const workboxSet = new Set(workboxUrls)
const runtimeSet = new Set(runtimeUrls)
const missingAtRuntime = workboxUrls.filter((url) => !runtimeSet.has(url))
const extraAtRuntime = runtimeUrls.filter((url) => !workboxSet.has(url))
if (
  runtimeSet.size !== runtimeUrls.length ||
  missingAtRuntime.length > 0 ||
  extraAtRuntime.length > 0
) {
  throw new Error(
    [
      'Runtime precache manifest не совпадает с Workbox manifest.',
      `Workbox: ${workboxUrls.length}, runtime: ${runtimeUrls.length}.`,
      `Нет в runtime: ${missingAtRuntime.join(', ') || '—'}.`,
      `Лишние в runtime: ${extraAtRuntime.join(', ') || '—'}.`,
    ].join(' '),
  )
}

console.log(
  `Precache manifest verified: ${workboxUrls.length} Workbox entries = ${runtimeUrls.length} progress entries`,
)
