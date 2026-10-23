import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const KIT = join(ROOT, 'src', 'presentation-kit')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

// Kit source excluding test fixtures.
const kitSources = walk(KIT).filter((file) => /\.(ts|tsx)$/.test(file) && !relative(KIT, file).startsWith('tests'))

describe('style-neutral kit contract', () => {
  it('has no stylesheet files and no stylesheet imports', () => {
    expect(walk(KIT).filter((file) => file.endsWith('.css'))).toEqual([])
    for (const file of kitSources) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/import\s[^;]*\.css['"]/)
    }
  })

  it('imports no styling framework', () => {
    for (const file of kitSources) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/tailwind|styled-components|@emotion|@mui|bootstrap/i)
    }
  })

  it('declares no inline visual value in source: colors, fonts, borders, shadows, radii, gaps, or spacing', () => {
    const pattern = /\b(color|background(?:-?\w*)?|font(?:-?\w*)?|border(?:-?\w*)?|outline\w*|boxShadow|borderRadius|gap|letterSpacing|lineHeight|textTransform|textDecoration|margin\w*|padding\w*)\s*:\s*([^,}\n]+)/g
    const offenders: string[] = []
    for (const file of kitSources) {
      for (const match of readFileSync(file, 'utf8').matchAll(pattern)) {
        const value = match[2].trim()
        if (!/^(0|0px|'0'|"0"|'none'|'0px'|"0px"|'static'|'absolute'|'relative'|'flex'|'none')$/.test(value)) {
          offenders.push(`${relative(ROOT, file)}: ${match[0]}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('keeps the root and bootstrap packages free of styling frameworks', () => {
    for (const manifest of ['package.json', join('skills', 'presentation', 'templates', 'bootstrap', 'package.json')]) {
      const text = readFileSync(join(ROOT, manifest), 'utf8')
      expect(text).not.toMatch(/tailwind|@tailwindcss|styled-components|bootstrap/i)
    }
    expect(readFileSync(join(ROOT, 'vite.config.ts'), 'utf8')).not.toMatch(/tailwind/i)
  })
})
