import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const KIT = 'src/presentation-kit'

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? files(full) : [full]
  })
}
const kitFiles = files(KIT)
const kitSources = kitFiles.map((f) => [f, readFileSync(f, 'utf8')] as const)

describe('style-neutral kit', () => {
  it('ships no stylesheet and imports none', () => {
    expect(kitFiles.filter((f) => /\.(css|scss|sass|less|styl)$/.test(f))).toEqual([])
    for (const [f, src] of kitSources) expect(src, f).not.toMatch(/import[^;\n]*\.(css|scss|sass|less)['"]/)
  })

  it('declares no colour, font, border, radius, shadow, spacing or theme values', () => {
    const forbiddenProp =
      /\b(color|background\w*|font\w*|border\w*|boxShadow|textShadow|dropShadow|filter|backdropFilter|padding\w*|margin\w*|gap|rowGap|columnGap|outline\w*|cursor|letterSpacing|lineHeight|textTransform|textDecoration\w*)\s*:/
    for (const [f, src] of kitSources) {
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      expect(code, f).not.toMatch(forbiddenProp)
      expect(code, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/)
      expect(code, f).not.toMatch(/--[a-z][\w-]*\s*:|var\(--/)
      expect(code, f).not.toMatch(/\bstroke\s*=|\bfill\s*=\s*["'](?!none)/)
    }
  })

  it('sets no class names of its own, so no styling system can hook in by default', () => {
    for (const [f, src] of kitSources) expect(src, f).not.toMatch(/className\s*=\s*["'{]\s*["'`]/)
  })

  it('limits inline styles to geometry and layout plumbing', () => {
    const allowed = new Set([
      'position', 'left', 'top', 'right', 'bottom', 'inset', 'width', 'height', 'minWidth', 'minHeight', 'maxHeight',
      'display', 'flex', 'flexDirection', 'alignItems', 'justifyContent', 'listStyle', 'overflow', 'overflowY',
      'whiteSpace', 'textOverflow', 'originX', 'originY', 'scale',
    ])
    const used = new Set<string>()
    for (const [, src] of kitSources) {
      for (const block of src.matchAll(/style=\{\{([^}]*)\}\}/g)) {
        for (const key of block[1].matchAll(/(?:^|,)\s*([a-zA-Z]+)\s*(?::|(?=,|$))/g)) used.add(key[1])
      }
    }
    expect([...used].filter((k) => !allowed.has(k))).toEqual([])
    expect(used.size).toBeGreaterThan(5)
  })

  it('depends on no styling framework, in the kit, host manifest or Vite config', () => {
    const banned = /tailwind|styled-components|@emotion|bootstrap|@mui|chakra|bulma|@stitches|vanilla-extract|unocss|windicss/i
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => banned.test(d))).toEqual([])
    expect(readFileSync('vite.config.ts', 'utf8')).not.toMatch(banned)
    for (const [f, src] of kitSources) expect(src, f).not.toMatch(banned)
    expect(readFileSync('package-lock.json', 'utf8')).not.toMatch(/node_modules\/(@?tailwindcss|styled-components|@emotion)/)
  })
})

describe('topic-agnostic kit', () => {
  it('imports only react, motion, lucide-react and its own files', () => {
    for (const [f, src] of kitSources) {
      for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        expect(m[1], f).toMatch(/^(react|motion\/react|lucide-react|\.\.?\/)/)
      }
    }
  })

  it('knows nothing about the reference sample or any presentation', () => {
    for (const [f, src] of kitSources) {
      expect(src, f).not.toMatch(/presentations\/|how-to-make|card-1|verify-pass|Talk\b/)
    }
  })

  it('exposes stable data-presentation hooks across primitives and chrome', () => {
    const joined = kitSources.map(([, s]) => s).join('\n')
    for (const hook of [
      'data-presentation-root', 'data-presentation-stage', 'data-presentation-canvas', 'data-presentation-node',
      'data-presentation-entity', 'data-presentation-title', 'data-presentation-caption', 'data-presentation-marker',
      'data-presentation-progress-item', 'data-presentation-toc-item', 'data-presentation-active',
      'data-presentation-attribution', 'data-presentation-brand-slot', 'data-presentation-mode',
    ]) {
      expect(joined, hook).toContain(hook)
    }
  })
})
