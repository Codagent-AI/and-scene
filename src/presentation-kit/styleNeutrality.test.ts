import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = import.meta.dirname

function walk(d: string): string[] {
  return readdirSync(d).flatMap((f) => {
    const p = join(d, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const files = walk(dir).filter((f) => !/\.test\.tsx?$/.test(f) && !f.endsWith('.md'))

const FORBIDDEN_PROPS =
  /\b(color|background(Color)?|border(Color|Width|Radius)?|boxShadow|fontFamily|fontSize|fontWeight|padding|margin|gap|textShadow|outline)\s*:/
const FORBIDDEN_IMPORTS = /from\s+['"](tailwindcss|styled-components|@emotion\/[^'"]*|@mui\/[^'"]*|@chakra-ui\/[^'"]*|bootstrap)[^'"]*['"]/

describe('style neutrality', () => {
  it('has no stylesheet files', () => {
    expect(files.filter((f) => /\.(css|scss|sass|less)$/.test(f))).toEqual([])
  })

  it('sets no visual defaults and imports no styling framework', () => {
    const source = files.filter((f) => /\.tsx?$/.test(f))
    expect(source.length).toBeGreaterThan(10)
    for (const f of source) {
      const text = readFileSync(f, 'utf8')
      expect(text, f).not.toMatch(FORBIDDEN_PROPS)
      expect(text, f).not.toMatch(FORBIDDEN_IMPORTS)
      expect(text, f).not.toMatch(/\.css['"]/)
    }
  })
})
