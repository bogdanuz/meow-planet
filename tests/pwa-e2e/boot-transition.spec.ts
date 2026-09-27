import {
  expect,
  test,
  type BrowserContext,
  type Page,
} from '@playwright/test'

type BootProbe = {
  assetAttempts: number
  failedAssetAttempts: number
  failureMode: FailureMode
  loaderUnmounted: boolean
  manifestEntries: number
  manifestLoads: number
  saw100Percent: boolean
  successfulAssetAttempts: number
  verifiedTextAt100: string | null
}

type FailureMode = 'none' | 'first-per-url' | 'always'

async function installBootProbe(
  context: BrowserContext,
  failureMode: FailureMode = 'none',
): Promise<void> {
  await context.addInitScript((mode: FailureMode) => {
    const probe: BootProbe = {
      assetAttempts: 0,
      failedAssetAttempts: 0,
      failureMode: mode,
      loaderUnmounted: false,
      manifestEntries: 0,
      manifestLoads: 0,
      saw100Percent: false,
      successfulAssetAttempts: 0,
      verifiedTextAt100: null,
    }
    Object.defineProperty(window, '__MEOW_BOOT_PROBE__', {
      value: probe,
      configurable: false,
    })

    let precacheUrls = new Set<string>()
    const attemptsByUrl = new Map<string, number>()
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args): Promise<Response> => {
      const input = args[0]
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url
      const absoluteUrl = new URL(url, window.location.href).href
      const requestCache = args[1]?.cache

      if (
        absoluteUrl.endsWith('/precache-manifest.json') &&
        requestCache === 'no-store'
      ) {
        probe.manifestLoads += 1
        const response = await originalFetch(...args)
        const manifest = (await response.clone().json()) as {
          urls: string[]
        }
        precacheUrls = new Set(
          manifest.urls.map(
            (entry) => new URL(entry, window.location.href).href,
          ),
        )
        probe.manifestEntries = precacheUrls.size
        return response
      }

      if (precacheUrls.has(absoluteUrl)) {
        probe.assetAttempts += 1
        const attempt = (attemptsByUrl.get(absoluteUrl) ?? 0) + 1
        attemptsByUrl.set(absoluteUrl, attempt)
        const shouldFail =
          probe.failureMode === 'always' ||
          (probe.failureMode === 'first-per-url' && attempt === 1)
        if (shouldFail) {
          probe.failedAssetAttempts += 1
          return new Response('', { status: 503 })
        }
        const response = await originalFetch(...args)
        if (response.ok) probe.successfulAssetAttempts += 1
        return response
      }

      return originalFetch(...args)
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const removedNode of mutation.removedNodes) {
          if (
            removedNode instanceof HTMLElement &&
            removedNode.classList.contains('boot-loader--leave')
          ) {
            probe.loaderUnmounted = true
          }
        }
      }
      if (
        document.querySelector('.boot-loader__percent')?.textContent === '100%'
      ) {
        probe.saw100Percent = true
        probe.verifiedTextAt100 =
          document.querySelector('.boot-loader__message')?.textContent ?? null
      }
    })
    observer.observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }, failureMode)
}

async function readProbe(page: Page): Promise<BootProbe> {
  return page.evaluate(
    () =>
      (
        window as typeof window & {
          __MEOW_BOOT_PROBE__: BootProbe
        }
      ).__MEOW_BOOT_PROBE__,
  )
}

test('cold production boot после полного 100% показывает welcome', async ({
  context,
  page,
}) => {
  await installBootProbe(context)

  await page.goto('./')

  await expect(page.locator('.screen--welcome')).toBeVisible({
    timeout: 90_000,
  })

  const probe = await readProbe(page)
  expect(probe.saw100Percent).toBe(true)
  expect(probe.loaderUnmounted).toBe(true)
  expect(probe.manifestEntries).toBeGreaterThan(0)
  expect(probe.successfulAssetAttempts).toBe(probe.manifestEntries)
  expect(probe.verifiedTextAt100).toContain(
    `${probe.manifestEntries} из ${probe.manifestEntries}`,
  )
})

test('warm production boot с активным controller не блокирует welcome', async ({
  context,
  page,
}) => {
  await installBootProbe(context)
  await page.goto('./')
  await expect(page.locator('.screen--welcome')).toBeVisible({
    timeout: 90_000,
  })
  await page.evaluate(() => navigator.serviceWorker.ready)

  await page.reload()
  await expect(page.locator('.screen--welcome')).toBeVisible({
    timeout: 15_000,
  })

  expect(
    await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
  ).toBe(true)
  const probe = await readProbe(page)
  expect(probe.saw100Percent).toBe(true)
  expect(probe.loaderUnmounted).toBe(true)
  expect(probe.manifestLoads).toBe(0)
  expect(probe.assetAttempts).toBe(0)
})

test('cold production boot тихо повторяет нулевой сетевой провал', async ({
  context,
  page,
}) => {
  await installBootProbe(context, 'first-per-url')
  await page.goto('./')

  await expect(page.locator('.screen--welcome')).toBeVisible({
    timeout: 90_000,
  })

  const probe = await readProbe(page)
  expect(probe.manifestLoads).toBe(2)
  expect(probe.failedAssetAttempts).toBe(probe.manifestEntries)
  expect(probe.successfulAssetAttempts).toBe(probe.manifestEntries)
  expect(probe.saw100Percent).toBe(true)
})

test('два cold production провала показывают контролируемую ошибку', async ({
  context,
  page,
}) => {
  await installBootProbe(context, 'always')
  await page.goto('./')

  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible({
    timeout: 90_000,
  })
  await expect(page.locator('.boot-loader__message')).toContainText(
    'Не удалось скачать игру',
  )

  const probe = await readProbe(page)
  expect(probe.manifestLoads).toBe(2)
  expect(probe.failedAssetAttempts).toBe(probe.manifestEntries * 2)
  expect(probe.saw100Percent).toBe(false)

  await page.evaluate(() => {
    (
      window as typeof window & {
        __MEOW_BOOT_PROBE__: BootProbe
      }
    ).__MEOW_BOOT_PROBE__.failureMode = 'none'
  })
  await page.getByRole('button', { name: 'Повторить' }).click()
  await expect(page.locator('.screen--welcome')).toBeVisible({
    timeout: 90_000,
  })
})
