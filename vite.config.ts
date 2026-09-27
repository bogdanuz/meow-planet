import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages запускает сайт в подпапке: https://<user>.github.io/<repo>/
  // Поэтому все runtime-пути (SW scope, assets, routes) должны быть base-aware.
  base: '/meow-planet/',
  plugins: [
    VitePWA({
      // Без ручных диалогов: пользователи всегда получают свежую версию.
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: [
        'favicon.png',
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-icon-192.png',
        'pwa-icon-512.png',
      ],
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
