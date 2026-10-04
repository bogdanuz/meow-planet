/*
 * Safari играет <audio>/<video> только по ответам 206 на Range-запросы, а Workbox precache
 * отдаёт целый файл со статусом 200 — на iPad звук из офлайн-кэша молчит.
 * Подключается через workbox.importScripts раньше Workbox и режет файл из того же
 * precache-кэша. Своего списка файлов здесь нет: что не в кэше — идёт в сеть.
 */
const MEDIA_FILE = /\.(?:mp3|m4a|aac|ogg|oga|opus|wav|mp4|webm)$/i

self.addEventListener('fetch', (event) => {
  const { request } = event
  const range = request.headers.get('range')
  if (!range || request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || !MEDIA_FILE.test(url.pathname)) return
  event.respondWith(partialFromPrecache(request, range))
})

async function precached(url) {
  for (const name of await caches.keys()) {
    if (!name.includes('precache')) continue
    // Ключи Workbox для файлов без хэша в имени: `?__WB_REVISION__=…`.
    const hit = await (await caches.open(name)).match(url, { ignoreSearch: true })
    if (hit) return hit
  }
  return null
}

async function partialFromPrecache(request, range) {
  const full = await precached(request.url)
  if (!full) return fetch(request)
  const blob = await full.blob()
  const size = blob.size
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim())
  let start = -1
  let end = size - 1
  if (match && match[1] !== '') {
    start = Number(match[1])
    if (match[2] !== '') end = Math.min(Number(match[2]), size - 1)
  } else if (match && match[2] !== '') {
    start = Math.max(0, size - Number(match[2]))
  }
  if (start < 0 || start >= size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
  }
  const part = blob.slice(start, end + 1)
  const headers = new Headers(full.headers)
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
  headers.set('Content-Length', String(part.size))
  headers.set('Accept-Ranges', 'bytes')
  return new Response(part, { status: 206, statusText: 'Partial Content', headers })
}
