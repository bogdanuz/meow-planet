export function bindLifecycleSave(save: () => void): () => void {
  const onVisibility = (): void => {
    if (document.hidden) save()
  }
  const onHide = (): void => {
    save()
  }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', onHide)
  return () => {
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', onHide)
  }
}
