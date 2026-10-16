import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const KIT = join(__dirname, '../src/presentation-kit')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}
const files = walk(KIT)

const FORBIDDEN = [
  /\b(?:color|background|backgroundColor|backgroundImage|border|borderRadius|borderColor|boxShadow|textShadow|filter|font|fontFamily|fontSize|fontWeight|outline)\s*:/,
  /\b(?:padding|margin|gap)\w*\s*:/,
  /(?:^|[\s"'`{(,;])--[a-z][\w-]*\s*:/,
  /var\(--/,
  /tailwind/i,
  /@apply\b/,
  /#[0-9a-fA-F]{3,8}\b/,
  /\b(?:rgb|hsl|oklch)a?\(/,
]

describe('style-neutral kit contract', () => {
  it('ships no CSS or style-framework files', () => {
    expect(files.filter((f) => /\.(css|scss|sass|less|styl)$/.test(f))).toEqual([])
  })
  it('declares no visual defaults', () => {
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      for (const re of FORBIDDEN) expect(src, `${f} matches ${re}`).not.toMatch(re)
    }
  })
  it('imports only react, motion, lucide-react, and itself', () => {
    const allowed = /^(?:react|react\/.*|motion|motion\/.*|lucide-react|\.{1,2}\/.*)$/
    for (const f of files.filter((f) => /\.tsx?$/.test(f))) {
      const specs = [...readFileSync(f, 'utf8').matchAll(/from\s+'([^']+)'/g)].map((m) => m[1])
      for (const s of specs) expect(s, `${f} imports ${s}`).toMatch(allowed)
    }
  })
})
