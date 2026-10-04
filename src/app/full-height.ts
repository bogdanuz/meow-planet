/**
 * iPad «на экране Домой» с прозрачной строкой состояния: страница начинается под строкой
 * состояния, а высота окна считается без неё — снизу остаётся пустая полоса. Если окно
 * на весь экран и короче экрана на высоту строки состояния, корень растягиваем до экрана.
 */

export type ViewportSample = {
  innerWidth: number
  innerHeight: number
  screenWidth: number
  screenHeight: number
  standalone: boolean
}

/** Больше — это уже не строка состояния (клавиатура, разделённый экран). */
const MAX_GAP_PX = 64

export function fullScreenHeight(s: ViewportSample): number | null {
  if (!s.standalone) return null
  const long = Math.max(s.screenWidth, s.screenHeight)
  const short = Math.min(s.screenWidth, s.screenHeight)
  const landscape = s.innerWidth > s.innerHeight
  const fullW = landscape ? long : short
  const fullH = landscape ? short : long
  if (Math.abs(s.innerWidth - fullW) > 1) return null
  const gap = fullH - s.innerHeight
  if (gap <= 1 || gap > MAX_GAP_PX) return null
  return fullH
}

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true
}

function apply(): void {
  const h = fullScreenHeight({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    standalone: isStandalone(),
  })
  // #region agent log
  fetch('http://127.0.0.1:7263/ingest/02ef703c-68df-4e0c-a004-5e4c2bf5e471',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'38fb21'},body:JSON.stringify({sessionId:'38fb21',hypothesisId:'H4',location:'full-height.ts:apply',message:'viewport sample',data:{iw:window.innerWidth,ih:window.innerHeight,sw:window.screen.width,sh:window.screen.height,vvh:window.visualViewport?.height,standalone:isStandalone(),h},timestamp:Date.now()})}).catch(()=>{})
  // #endregion
  const style = document.documentElement.style
  if (h === null) style.removeProperty('--app-h')
  else style.setProperty('--app-h', `${h}px`)
}

export function installFullHeight(): void {
  apply()
  window.addEventListener('resize', apply)
  window.addEventListener('orientationchange', apply)
}
