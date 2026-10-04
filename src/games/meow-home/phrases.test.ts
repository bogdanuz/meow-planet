import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { VoiceLine } from '../../shared/voice-lines'
import type { Who } from './art'
import { phrasesFor } from './phrases'
import type { WearItem } from './weather'

const HOT_ITEMS: readonly WearItem[] = ['coat', 'hat', 'valenki', 'scarf', 'mittens']

function allLines(who: Who): VoiceLine[] {
  const out: VoiceLine[] = []
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') {
      if ('file' in v && 'text' in v) out.push(v as VoiceLine)
      else Object.values(v).forEach(walk)
    }
  }
  const p = phrasesFor(who)
  walk(p)
  for (const item of HOT_ITEMS) out.push(p.hot(item))
  return out
}

type Row = { meow: string; olli: string }

function scriptRows(): Map<string, Row> {
  const md = readFileSync(path.resolve(process.cwd(), 'docs/assets/meow-home-VOICE-SCRIPT.md'), 'utf8')
  const rows = new Map<string, Row>()
  for (const m of md.matchAll(/^\| \d+ \| `([\w-]+)` \| ([^|]+?) \|([^|]*)\|$/gm)) {
    rows.set(m[1]!, { meow: m[2]!.trim(), olli: m[3]!.trim() })
  }
  return rows
}

describe('«В гости» — фразы и VOICE-SCRIPT', () => {
  const rows = scriptRows()

  it.each(['meow', 'olli'] as const)('%s: каждая фраза есть в сценарии с тем же текстом', (who) => {
    const lines = allLines(who)
    for (const line of lines) {
      const key = line.file.replace(`${who}-`, '').replace(/\.mp3$/, '')
      const row = rows.get(key)
      expect(row, key).toBeDefined()
      const expected = who === 'olli' && row!.olli ? row!.olli : row!.meow
      expect(line.text, key).toBe(expected)
    }
    expect(new Set(lines.map((l) => l.file)).size).toBe(rows.size)
  })
})
