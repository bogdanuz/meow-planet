import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  truncateSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('PWA precache policy', () => {
  it('включает любой тип файла production-сборки без ручного списка расширений', () => {
    const viteConfig = readFileSync('vite.config.ts', 'utf8')

    expect(viteConfig).toContain("globPatterns: ['**/*']")
  })

  it('отклоняет manifest-запись без соответствующего файла dist', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'meow-precache-'))
    const dist = path.join(root, 'dist')
    mkdirSync(dist)
    writeFileSync(path.join(dist, 'index.html'), '<!doctype html>')
    writeFileSync(path.join(dist, 'workbox-deadbeef.js'), '')
    writeFileSync(
      path.join(dist, 'sw.js'),
      'precacheAndRoute([{url:"index.html",revision:"1"},{url:"precache-manifest.json",revision:"2"},{url:"ghost.asset",revision:"3"}],{})',
    )
    writeFileSync(
      path.join(dist, 'precache-manifest.json'),
      JSON.stringify({
        version: 1,
        urls: ['index.html', 'precache-manifest.json', 'ghost.asset'],
      }),
    )

    try {
      const verifier = path.resolve('scripts/verify-precache-manifest.mjs')
      const result = spawnSync(process.execPath, [verifier], {
        cwd: root,
        encoding: 'utf8',
      })

      expect(result.status).not.toBe(0)
      expect(`${result.stdout}\n${result.stderr}`).toContain('ghost.asset')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('отклоняет новый тип файла dist, если он отсутствует в precache', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'meow-precache-missing-'))
    const dist = path.join(root, 'dist')
    mkdirSync(dist)
    writeFileSync(path.join(dist, 'index.html'), '<!doctype html>')
    writeFileSync(path.join(dist, 'future.customasset'), 'runtime data')
    writeFileSync(path.join(dist, 'workbox-deadbeef.js'), '')
    writeFileSync(
      path.join(dist, 'sw.js'),
      'precacheAndRoute([{url:"index.html",revision:"1"},{url:"precache-manifest.json",revision:"2"}],{})',
    )
    writeFileSync(
      path.join(dist, 'precache-manifest.json'),
      JSON.stringify({
        version: 1,
        urls: ['index.html', 'precache-manifest.json'],
      }),
    )

    try {
      const verifier = path.resolve('scripts/verify-precache-manifest.mjs')
      const result = spawnSync(process.execPath, [verifier], {
        cwd: root,
        encoding: 'utf8',
      })

      expect(result.status).not.toBe(0)
      expect(`${result.stdout}\n${result.stderr}`).toContain(
        'future.customasset',
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('отклоняет случайный runtime-файл больше 64 МиБ', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'meow-precache-size-'))
    const dist = path.join(root, 'dist')
    mkdirSync(dist)
    writeFileSync(path.join(dist, 'index.html'), '<!doctype html>')
    writeFileSync(path.join(dist, 'workbox-deadbeef.js'), '')
    const largeFile = path.join(dist, 'oversized.asset')
    writeFileSync(largeFile, '')
    truncateSync(largeFile, 64 * 1024 * 1024 + 1)
    writeFileSync(
      path.join(dist, 'sw.js'),
      'precacheAndRoute([{url:"index.html",revision:"1"},{url:"precache-manifest.json",revision:"2"},{url:"oversized.asset",revision:"3"}],{})',
    )
    writeFileSync(
      path.join(dist, 'precache-manifest.json'),
      JSON.stringify({
        version: 1,
        urls: ['index.html', 'precache-manifest.json', 'oversized.asset'],
      }),
    )

    try {
      const verifier = path.resolve('scripts/verify-precache-manifest.mjs')
      const result = spawnSync(process.execPath, [verifier], {
        cwd: root,
        encoding: 'utf8',
      })

      expect(result.status).not.toBe(0)
      expect(`${result.stdout}\n${result.stderr}`).toContain('oversized.asset')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
