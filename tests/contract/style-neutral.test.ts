import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..', '..')
const KIT = join(ROOT, 'src/presentation-kit')
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]))
const kitFiles = () => walk(KIT).filter((f) => !/\.test\.tsx?$/.test(f))

const FORBIDDEN: Array<[string, RegExp]> = [
  ['hex/rgb/hsl color', /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(/i],
  ['named color property', /\b(?:color|background|backgroundColor|borderColor|fill|stroke)\s*:\s*['"`]?(?!currentColor|none|transparent|inherit)[a-z]/],
  ['font', /\bfont(?:Family|Size|Weight)?\s*:/],
  ['border/shadow/radius', /\b(?:border|boxShadow|borderRadius|textShadow|outline)\w*\s*:/],
  ['css theme token', /var\(--/],
  ['styling framework', /tailwind|@apply|styled-components|emotion|\.css['"]/i],
]

describe('style-neutral kit', () => {
  it('contains no palette, font, border, shadow, token, or framework usage', () => {
    for (const file of kitFiles()) {
      const text = readFileSync(file, 'utf8')
      for (const [what, pattern] of FORBIDDEN) expect(text, `${what} in ${relative(ROOT, file)}`).not.toMatch(pattern)
    }
  })

  it('imports no stylesheet and ships no CSS files', () => {
    expect(walk(KIT).filter((f) => f.endsWith('.css'))).toEqual([])
  })

  it('exposes stable data-presentation hooks', () => {
    const all = kitFiles().map((f) => readFileSync(f, 'utf8')).join('\n')
    for (const hook of ['root', 'stage', 'canvas', 'scene', 'layer', 'marker', 'title', 'caption', 'toc', 'toc-entry', 'dot', 'prev', 'next', 'attribution', 'node']) {
      expect(all, hook).toContain(`data-presentation-${hook}`)
    }
  })

  it('app and kit depend on no styling framework', () => {
    for (const rel of ['package.json', 'skills/presentation/templates/bootstrap/package.json']) {
      const pkg = JSON.parse(readFileSync(join(ROOT, rel), 'utf8'))
      const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
      expect(names.filter((n) => /tailwind|styled|emotion|bootstrap$/.test(n)), rel).toEqual([])
    }
  })
})
