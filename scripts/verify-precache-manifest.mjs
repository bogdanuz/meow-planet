import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const MAX_SINGLE_FILE_BYTES = 64 * 1024 * 1024
const MAX_TOTAL_APP_BYTES = 512 * 1024 * 1024

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path.join(directory, entry.name), relative)))
    } else {
      files.push(relative)
    }
  }
  return files
}

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

// sw.js и workbox runtime устанавливаются браузером как Service Worker scripts,
// а не как записи app precache. Каждый прочий файл dist обязан быть в manifest.
const distFiles = await listFiles('dist')
const expectedPrecacheFiles = distFiles.filter(
  (file) => file !== 'sw.js' && !/^workbox-[0-9a-f]+\.js$/.test(file),
)
const expectedPrecacheSet = new Set(expectedPrecacheFiles)
const filesMissingFromPrecache = expectedPrecacheFiles.filter(
  (file) => !workboxSet.has(file),
)
const entriesMissingFromDist = workboxUrls.filter(
  (url) => !expectedPrecacheSet.has(url),
)
if (filesMissingFromPrecache.length > 0 || entriesMissingFromDist.length > 0) {
  throw new Error(
    [
      `Файлы dist выпали из Workbox precache: ${filesMissingFromPrecache.join(', ') || '—'}.`,
      `Записи Workbox без app-файла dist: ${entriesMissingFromDist.join(', ') || '—'}.`,
    ].join(' '),
  )
}

const fileSizes = await Promise.all(
  expectedPrecacheFiles.map(async (file) => ({
    file,
    size: (await stat(path.join('dist', file))).size,
  })),
)
const oversizedFiles = fileSizes.filter(
  ({ size }) => size > MAX_SINGLE_FILE_BYTES,
)
const totalAppBytes = fileSizes.reduce((total, { size }) => total + size, 0)
if (oversizedFiles.length > 0 || totalAppBytes > MAX_TOTAL_APP_BYTES) {
  throw new Error(
    [
      `Слишком крупные runtime-файлы (>64 МиБ): ${oversizedFiles.map(({ file }) => file).join(', ') || '—'}.`,
      `Общий размер app-файлов: ${(totalAppBytes / 1024 / 1024).toFixed(2)} МиБ; лимит 512 МиБ.`,
    ].join(' '),
  )
}

console.log(
  `Precache manifest verified: ${workboxUrls.length} Workbox entries = ${runtimeUrls.length} progress entries; all ${expectedPrecacheFiles.length} app files covered; ${(totalAppBytes / 1024 / 1024).toFixed(2)} MiB`,
)
