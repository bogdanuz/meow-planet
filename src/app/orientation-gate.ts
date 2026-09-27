/**
 * Хаб только в альбомной ориентации.
 * В книжной — оверлей «поверни устройство» (iPad/Safari не даёт жёсткий lock).
 */
export function isLandscape(): boolean {
  if (typeof window === 'undefined') return true
  if (typeof window.matchMedia === 'function') {
    try {
      if (window.matchMedia('(orientation: landscape)').matches) return true
      if (window.matchMedia('(orientation: portrait)').matches) return false
    } catch {
      // jsdom / старые среды — fallback ниже
    }
  }
  const vv = window.visualViewport
  const width = vv && typeof vv.width === 'number' ? vv.width : window.innerWidth
  const height =
    vv && typeof vv.height === 'number' ? vv.height : window.innerHeight
  return width >= height
}

export function mountOrientationGate(host: HTMLElement): () => void {
  const gate = document.createElement('div')
  gate.className = 'orientation-gate'
  gate.setAttribute('role', 'dialog')
  gate.setAttribute('aria-live', 'polite')
  gate.setAttribute('aria-label', 'Нужна альбомная ориентация')
  gate.hidden = true

  const card = document.createElement('div')
  card.className = 'orientation-gate__card'

  const icon = document.createElement('div')
  icon.className = 'orientation-gate__icon'
  icon.setAttribute('aria-hidden', 'true')
  icon.classList.add('orientation-gate__icon--scene')
  const img = document.createElement('img')
  img.className = 'orientation-gate__img'
  img.alt = ''
  img.src = `${import.meta.env.BASE_URL ?? '/'}assets/gates/rotate-device.jpg`
  icon.append(img)

  const title = document.createElement('p')
  title.className = 'orientation-gate__title'
  title.textContent = 'Поверни планшет'

  const hint = document.createElement('p')
  hint.className = 'orientation-gate__hint'
  hint.textContent = 'Планета Мяу открывается только горизонтально — так удобнее играть.'

  card.append(icon, title, hint)
  gate.append(card)
  host.append(gate)

  const sync = (): void => {
    // Приоритет: small-screen gate должен перекрывать portrait gate.
    if (document.body.classList.contains('is-small-screen-blocked')) {
      gate.hidden = true
      document.documentElement.classList.remove('is-portrait-blocked')
      document.body.classList.remove('is-portrait-blocked')
      return
    }
    const ok = isLandscape()
    gate.hidden = ok
    document.documentElement.classList.toggle('is-portrait-blocked', !ok)
    document.body.classList.toggle('is-portrait-blocked', !ok)
  }

  sync()
  const mq =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(orientation: landscape)')
      : null
  const onChange = (): void => {
    sync()
  }
  mq?.addEventListener('change', onChange)
  const vv = window.visualViewport
  vv?.addEventListener('resize', onChange)
  window.addEventListener('resize', onChange)

  return () => {
    mq?.removeEventListener('change', onChange)
    vv?.removeEventListener('resize', onChange)
    window.removeEventListener('resize', onChange)
    gate.remove()
    document.documentElement.classList.remove('is-portrait-blocked')
    document.body.classList.remove('is-portrait-blocked')
  }
}
