import {
  expect,
  test,
  type BrowserContext,
  type Page,
} from '@playwright/test'

type BootProbe = {
  failureMode: FailureMode
  loaderUnmounted: boolean
  manifestEntries: number
  manifestLoads: number
  manifestUrls: string[]
  pageAssetFetches: number
  saw100Percent: boolean
  verifiedTextAt100: string | null
}

type FailureMode = 'none' | 'first-manifest' | 'always-manifest'

async function installBootProbe(
  context: BrowserContext,
  failureMode: FailureMode = 'none',
): Promise<void> {
  await context.addInitScript((mode: FailureMode) => {
    const probe: BootProbe = {
      failureMode: mode,
      loaderUnmounted: false,
      manifestEntries: 0,
      manifestLoads: 0,
      manifestUrls: [],
      pageAssetFetches: 0,
      saw100Percent: false,
      verifiedTextAt100: null,
    }
    Object.defineProperty(window, '__MEOW_BOOT_PROBE__', {
      value: probe,
      configurable: false,
    })

    let precacheUrls = new Set<string>()
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
        const shouldFail =
          probe.failureMode === 'always-manifest' ||
          (probe.failureMode === 'first-manifest' &&
            probe.manifestLoads === 1)
        if (shouldFail) return new Response('', { status: 503 })

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
        probe.manifestUrls = [...precacheUrls]
        return response
      }

      if (precacheUrls.has(absoluteUrl)) {
        probe.pageAssetFetches += 1
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
      const progressText =
        document.querySelector('.boot-loader__progress')?.textContent ?? ''
      if (progressText.includes('100%')) {
        probe.saw100Percent = true
        probe.verifiedTextAt100 = progressText
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

async function countManifestUrlsInWorkboxCache(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const probe = (
      window as typeof window & {
        __MEOW_BOOT_PROBE__: BootProbe
      }
    ).__MEOW_BOOT_PROBE__
    const normalize = (value: string) => {
      const url = new URL(value)
      url.searchParams.delete('__WB_REVISION__')
      url.hash = ''
      return url.href
    }
    const cached = new Set<string>()
    for (const name of await caches.keys()) {
      if (!name.includes('workbox-precache')) continue
      const cache = await caches.open(name)
      for (const request of await cache.keys()) {
        cached.add(normalize(request.url))
      }
    }
    return probe.manifestUrls.filter((url) => cached.has(normalize(url))).length
  })
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
  expect(probe.pageAssetFetches).toBe(0)
  expect(await countManifestUrlsInWorkboxCache(page)).toBe(
    probe.manifestEntries,
  )
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
  expect(probe.saw100Percent).toBe(false)
  expect(probe.loaderUnmounted).toBe(false)
  expect(probe.manifestLoads).toBe(0)
  expect(probe.pageAssetFetches).toBe(0)
})

test('cold production boot тихо повторяет нулевой сетевой провал', async ({
  context,
  page,
}) => {
  await installBootProbe(context, 'first-manifest')
  await page.goto('./')

  await expect(page.locator('.screen--welcome')).toBeVisible({
    timeout: 90_000,
  })

  const probe = await readProbe(page)
  expect(probe.manifestLoads).toBe(2)
  expect(probe.pageAssetFetches).toBe(0)
  expect(probe.saw100Percent).toBe(true)
})

test('reduced motion оставляет сову и листья статичными', async ({
  context,
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await installBootProbe(context)
  await page.goto('./')

  const loader = page.locator('.boot-loader')
  await expect(loader).toBeVisible({ timeout: 10_000 })
  const motion = await page.evaluate(() => {
    const title = document.querySelector<HTMLElement>('.boot-loader__title')!
    const caption = document.querySelector<HTMLElement>(
      '.boot-loader__caption',
    )!
    const owl = getComputedStyle(
      document.querySelector<HTMLElement>('.boot-loader__owl')!,
    )
    const leaves = getComputedStyle(
      document.querySelector<HTMLElement>('.boot-loader__leaves')!,
    )
    return {
      owlAnimation: owl.animationName,
      owlBackground: owl.backgroundImage,
      owlTransition: owl.transitionDuration,
      leavesClipPath: leaves.clipPath,
      leavesMask: leaves.maskImage || leaves.webkitMaskImage,
      leavesTransition: leaves.transitionDuration,
      captionGap:
        caption.getBoundingClientRect().top - title.getBoundingClientRect().bottom,
    }
  })
  expect(motion).toEqual({
    owlAnimation: 'none',
    owlBackground: expect.stringContaining('boot-owl-vacuum.png'),
    owlTransition: '0s',
    leavesClipPath: 'none',
    leavesMask: expect.stringContaining('linear-gradient'),
    leavesTransition: '0s',
    captionGap: expect.any(Number),
  })
  expect(motion.captionGap).toBeGreaterThanOrEqual(22)

  await expect(page.locator('.screen--welcome')).toBeVisible({
    timeout: 90_000,
  })
})

test('два cold production провала показывают контролируемую ошибку', async ({
  context,
  page,
}) => {
  await installBootProbe(context, 'always-manifest')
  await page.goto('./')

  await expect(page.getByRole('button', { name: 'Продолжить загрузку' })).toBeVisible({
    timeout: 90_000,
  })
  await expect(page.locator('.boot-loader__message')).toContainText(
    'Связь прервалась',
  )

  const probe = await readProbe(page)
  expect(probe.manifestLoads).toBe(2)
  expect(probe.saw100Percent).toBe(false)

  await page.evaluate(() => {
    (
      window as typeof window & {
        __MEOW_BOOT_PROBE__: BootProbe
      }
    ).__MEOW_BOOT_PROBE__.failureMode = 'none'
  })
  await page.getByRole('button', { name: 'Продолжить загрузку' }).click()
  await expect(page.locator('.screen--welcome')).toBeVisible({
    timeout: 90_000,
  })
})
