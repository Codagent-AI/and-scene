import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..', '..')
const KIT = join(ROOT, 'src', 'presentation-kit')

function kitSources(dir = KIT): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? kitSources(path) : [path]
  })
}

/** Visual style keys and values the kit must never set. Layout keys (position, left, width, transform) are allowed. */
const VISUAL_PATTERNS: RegExp[] = [
  /\.css['"]/,
  /@import\b/,
  /tailwind/i,
  /\b(color|background|backgroundColor|border|borderColor|borderRadius|boxShadow|font|fontFamily|fontWeight|fontSize|letterSpacing|lineHeight|textDecoration|margin|gap)\s*:/,
  /#[0-9a-fA-F]{3,8}\b/,
  /\b(rgb|rgba|hsl|hsla)\(/,
]

describe('scene kit style neutrality', () => {
  it('the kit has no stylesheet imports, styling-framework references, or visual defaults', () => {
    const offences: string[] = []
    for (const file of kitSources()) {
      const text = readFileSync(file, 'utf8')
      text.split('\n').forEach((line, index) => {
        for (const pattern of VISUAL_PATTERNS) {
          if (pattern.test(line)) offences.push(`${relative(ROOT, file)}:${index + 1}: ${line.trim()}`)
        }
      })
    }
    expect(offences).toEqual([])
  })

  it('the kit does not import the sample presentation, so its primitives stay topic-agnostic', () => {
    for (const file of kitSources()) {
      expect(readFileSync(file, 'utf8'), relative(ROOT, file)).not.toMatch(/presentations\//)
    }
  })

  it('the kit ships no CSS file', () => {
    expect(kitSources().filter((file) => file.endsWith('.css'))).toEqual([])
  })
})
