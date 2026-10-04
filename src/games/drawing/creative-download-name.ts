export function creativeDownloadName(kind: 'coloring' | 'drawing', at: number): string {
  const date = new Date(at)
  const part = (value: number) => String(value).padStart(2, '0')
  const stamp = `${part(date.getDate())}.${part(date.getMonth() + 1)}.${date.getFullYear()}_${part(date.getHours())}.${part(date.getMinutes())}.${part(date.getSeconds())}`
  const prefix = kind === 'coloring' ? 'raskraska' : 'risunok'
  return `${prefix}_${stamp}.png`
}
