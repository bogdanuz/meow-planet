export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  // Safari читает файл после click асинхронно: ранний revoke обрывает скачивание.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
