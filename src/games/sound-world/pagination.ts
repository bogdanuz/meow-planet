/** Размеры страниц без «хвоста» из одной карточки (кроме total === 1). */
export function pageStartIndices(count: number, maxPerPage = 4): number[] {
  if (count <= 0) return [0]
  const starts: number[] = [0]
  let i = 0
  while (i < count) {
    let remaining = count - i
    let pageSize = Math.min(maxPerPage, remaining)
    if (remaining > maxPerPage && remaining - pageSize === 1) {
      pageSize -= 1
    }
    i += pageSize
    if (i < count) starts.push(i)
  }
  return starts
}

export function pageCountBalanced(count: number, maxPerPage = 4): number {
  return pageStartIndices(count, maxPerPage).length
}

export function pageSliceBalanced<T>(
  list: readonly T[],
  page: number,
  maxPerPage = 4,
): T[] {
  const starts = pageStartIndices(list.length, maxPerPage)
  const start = starts[Math.min(page, starts.length - 1)] ?? 0
  const next = starts[page + 1] ?? list.length
  return list.slice(start, next)
}
