import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const KIT = join(import.meta.dirname, '../../src/presentation-kit')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(KIT)
const read = (f: string) => readFileSync(f, 'utf8')

describe('style-neutral kit contract', () => {
  it('ships no stylesheets', () => {
    expect(files.filter((f) => /\.(css|scss|sass|less|styl)$/.test(f))).toEqual([])
  })

  it('has no styling-framework or CSS imports', () => {
    for (const f of files) {
      expect(read(f), f).not.toMatch(/tailwind|styled-components|@emotion|\.css['"]/i)
    }
  })

  it('declares no color, font, border, shadow, or theme values', () => {
    const visual = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|font(Family|Size|Weight)|border(Color|Width|Style|Radius)?\s*:|boxShadow|textShadow|background(Color)?\s*:|--[a-z-]+\s*:|\b(gap|padding\w*|margin\w*|listStyle\w*|flexWrap|alignItems)\s*:/i
    for (const f of files) {
      const text = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      expect(text, f).not.toMatch(visual)
    }
  })

  it('uses only inherited colors for strokes', () => {
    const arrow = read(join(KIT, 'nodes/Arrow.tsx'))
    expect(arrow).toContain('currentColor')
  })

  it('exposes stable data-presentation hooks across chrome and nodes', () => {
    const all = files.map(read).join('\n')
    for (const hook of [
      'data-presentation-root', 'data-presentation-header', 'data-presentation-footer', 'data-presentation-toc',
      'data-presentation-toc-entry', 'data-presentation-dot', 'data-presentation-active', 'data-presentation-attribution',
      'data-presentation-node', 'data-presentation-entity', 'data-presentation-canvas', 'data-step-count', 'data-step-index',
    ]) {
      expect(all, hook).toContain(hook)
    }
  })
})

describe('package scripts', () => {
  const pkg = JSON.parse(readFileSync(join(KIT, '../../package.json'), 'utf8')) as { scripts: Record<string, string> }
  it('keeps npm test to the fast unit suite and puts browser suites in separate scripts', () => {
    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts['test:integration']).toContain('tests/integration')
    expect(pkg.scripts['test:e2e']).toContain('tests/e2e')
    expect(pkg.scripts.verify).toContain('scripts/verify.mjs')
    expect(pkg.scripts.inspect).toContain('scripts/inspect-presentation.mjs')
  })
})
