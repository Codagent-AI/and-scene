import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const KIT = resolve(import.meta.dirname, '..')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (n === '__tests__') return []
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const files = walk(KIT)
const VISUAL =
  /\b(color|background\w*|font\w*|border\w*|box-?shadow|text-?shadow|outline\w*|fill|stroke\w*|filter|padding\w*|margin\w*|gap|letter-?spacing|line-?height|cursor|text-?decoration|borderRadius|boxShadow)\s*:/i
const TAILWIND_CLASS = /className=["'`][^"'`]*\b(flex|grid|p[xytblr]?-\d|m[xytblr]?-\d|text-[a-z]+|bg-[a-z]+|border(-[a-z0-9]+)?|rounded(-[a-z]+)?|shadow(-[a-z]+)?|font-[a-z]+|w-\d|h-\d|gap-\d)\b/

/** Extract the bodies of `style={{ ... }}` literals. */
function styleLiterals(src: string): string[] {
  return [...src.matchAll(/style=\{\{([\s\S]*?)\}\}/g)].map((m) => m[1])
}

describe('kit style neutrality', () => {
  it('scans a non-trivial set of kit files', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('has no css files, css imports, or tailwind', () => {
    for (const f of files) {
      expect(f.endsWith('.css'), f).toBe(false)
      const src = readFileSync(f, 'utf8')
      expect(src, f).not.toMatch(/import\s+['"][^'"]+\.(css|scss|less)['"]/)
      expect(src, f).not.toMatch(/tailwind/i)
      expect(src, f).not.toMatch(TAILWIND_CLASS)
      expect(src, f).not.toMatch(/@apply|@tailwind/)
    }
  })

  it('uses no visual inline-style properties', () => {
    for (const f of files.filter((n) => /\.tsx?$/.test(n))) {
      for (const lit of styleLiterals(readFileSync(f, 'utf8'))) {
        expect(lit, f).not.toMatch(VISUAL)
      }
    }
  })

  it('does not depend on a styling framework in package.json', () => {
    const pkg = readFileSync(resolve(KIT, '../../package.json'), 'utf8')
    expect(pkg).not.toMatch(/tailwind|styled-components|emotion|@mui|chakra/i)
  })

  it('scan detector catches violations', () => {
    expect(styleLiterals('<div style={{ color: "red", left: 1 }} />')[0]).toMatch(VISUAL)
    expect('className="flex p-4"').toMatch(TAILWIND_CLASS)
    expect(styleLiterals('<div style={{ position: "absolute", left: 0 }} />')[0]).not.toMatch(VISUAL)
  })
})
