import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const PRECACHE_MANIFEST_FILE = 'precache-manifest.json'
const PWA_PLUGIN_ENTRIES = [
  'manifest.webmanifest',
  'pwa-icon-192.png',
  'pwa-icon-512.png',
] as const

type WorkboxManifestEntry = {
  revision: string | null
  size: number
  url: string
}

async function emitRuntimePrecacheManifest(
  entries: WorkboxManifestEntry[],
): Promise<{ manifest: WorkboxManifestEntry[]; warnings: string[] }> {
  const uniqueEntries = [
    ...new Map(entries.map((entry) => [entry.url, entry])).values(),
  ]
  const urls = [
    ...new Set([
      ...uniqueEntries.map((entry) => entry.url),
      ...PWA_PLUGIN_ENTRIES,
      PRECACHE_MANIFEST_FILE,
    ]),
  ].sort()
  const contents = `${JSON.stringify({ version: 1, urls }, null, 2)}\n`
  const outputPath = path.resolve('dist', PRECACHE_MANIFEST_FILE)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, contents, 'utf8')

  return {
    manifest: [
      ...uniqueEntries,
      {
        url: PRECACHE_MANIFEST_FILE,
        revision: createHash('sha256').update(contents).digest('hex'),
        size: Buffer.byteLength(contents),
      },
    ],
    warnings: [],
  }
}

function serveDevelopmentPrecacheManifest(): Plugin {
  return {
    name: 'meow-development-precache-manifest',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(
          request.url ?? '/',
          'http://localhost',
        ).pathname
        if (pathname !== '/meow-planet/precache-manifest.json') {
          next()
          return
        }

        // Dev/обычные UI e2e мокают только медленную precache-операцию.
        // Весь boot orchestration остаётся тем же, production boot e2e
        // отдельно использует полный manifest из Workbox build.
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(
          JSON.stringify({
            version: 1,
            urls: ['assets/shell/welcome-bg.webp'],
          }),
        )
      })
    },
  }
}

export default defineConfig({
  // GitHub Pages запускает сайт в подпапке: https://<user>.github.io/<repo>/
  // Поэтому все runtime-пути (SW scope, assets, routes) должны быть base-aware.
  base: '/meow-planet/',
  plugins: [
    serveDevelopmentPrecacheManifest(),
    VitePWA({
      // Без ручных диалогов: пользователи всегда получают свежую версию.
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'Планета Мяу',
        short_name: 'Планета Мяу',
        description: 'Игровой хаб для детей 2–3 лет',
        theme_color: '#7eb8da',
        background_color: '#f7fbff',
        display: 'standalone',
        orientation: 'landscape',
        lang: 'ru',
        // Hash-роутер приложения использует `/#/...`, поэтому старт должен включать hash.
        start_url: './#/',
        // Scope должен соответствовать подпапке GitHub Pages, чтобы SW регистрировался корректно.
        scope: './',
        icons: [
          {
            src: 'pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: [
          // Прекашируем всё, что реально используется в игре (включая ассеты из public/assets).
          // Для offline-first нам важно покрыть не только JS/CSS/HTML, но и медиа/шрифты/JSON.
          '**/*.{js,css,html,svg,png,webp,jpg,jpeg,mp3,wav,ogg,woff,woff2,ttf,json,txt,webmanifest}',
        ],
        // manifest.webmanifest vite-plugin-pwa добавляет отдельно. Исключение
        // предотвращает дубликат той же записи в precacheAndRoute.
        globIgnores: [
          ...PWA_PLUGIN_ENTRIES,
          PRECACHE_MANIFEST_FILE,
        ],
        // Этот JSON — runtime-представление того же списка, который Workbox
        // получает в precacheAndRoute. Boot больше не поддерживает второй,
        // вручную составленный список ассетов.
        manifestTransforms: [emitRuntimePrecacheManifest],
        cleanupOutdatedCaches: true,
        // Offline-режим для игровых ассетов без исключений по размеру.
        // Ставим заведомо большой лимит вместо текущего 6 МБ.
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
})
