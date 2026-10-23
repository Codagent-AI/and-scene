import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectAnchors } from '../../skills/presentation/scripts/detect-target.mjs'

const ROOT = join(__dirname, '..', '..')
const SKILL = join(ROOT, 'skills', 'presentation')
const BOOTSTRAP = join(SKILL, 'templates', 'bootstrap')
const PRESENTATION = join(SKILL, 'templates', 'presentation')

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
const rel = (base: string) => (files: string[]) => files.map((f) => relative(base, f)).sort()
const json = (...p: string[]) => JSON.parse(readFileSync(join(...p), 'utf8'))

function expectAligned(canonical: string, copy: string) {
  const a = rel(canonical)(walk(canonical))
  const b = rel(copy)(walk(copy))
  expect(b, `file set of ${relative(ROOT, copy)}`).toEqual(a)
  for (const file of a) {
    expect(readFileSync(join(copy, file)).equals(readFileSync(join(canonical, file))), `${file} differs`).toBe(true)
  }
}

describe('template alignment with canonical sources', () => {
  it('keeps the bootstrap scene kit byte-aligned with src/presentation-kit', () => {
    expectAligned(join(ROOT, 'src', 'presentation-kit'), join(BOOTSTRAP, 'src', 'presentation-kit'))
  })

  it('keeps the verification and inspection scripts (and their shared modules) aligned', () => {
    expectAligned(join(ROOT, 'scripts'), join(BOOTSTRAP, 'scripts'))
  })
})

describe('bootstrap template completeness', () => {
  const pkg = json(BOOTSTRAP, 'package.json')

  it('provides all three contract anchors', () => {
    expect(detectAnchors(BOOTSTRAP)).toEqual({ build: true, kit: true, index: true })
  })

  it('declares the complete runtime and tooling dependency set, with a matching lock file', () => {
    const runtime = ['react', 'react-dom', 'motion', 'lucide-react']
    const dev = [
      'vite', '@vitejs/plugin-react', 'typescript', '@types/react', '@types/react-dom', '@types/node', 'eslint', '@eslint/js',
      'typescript-eslint', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'playwright',
    ]
    for (const d of runtime) expect(pkg.dependencies, d).toHaveProperty(d)
    for (const d of dev) expect(pkg.devDependencies, d).toHaveProperty(d)
    const lock = json(BOOTSTRAP, 'package-lock.json')
    expect(Object.keys(lock.packages[''].dependencies)).toEqual(expect.arrayContaining(runtime))
    expect(Object.keys(lock.packages[''].devDependencies)).toEqual(expect.arrayContaining(dev))
    for (const d of [...runtime, ...dev]) expect(lock.packages, d).toHaveProperty(`node_modules/${d}`)
  })

  it('exposes build, lint, verify and inspect scripts and a clean verify config', () => {
    expect(pkg.scripts).toMatchObject({
      build: 'tsc -b && vite build', lint: 'eslint .', verify: 'node scripts/verify.mjs', inspect: 'node scripts/inspect-presentation.mjs',
    })
    expect(json(BOOTSTRAP, 'verify.config.json')).toEqual({ requiredSample: null })
    expect(json(ROOT, 'verify.config.json')).toEqual({ requiredSample: 'how-to-make-a-presentation' })
  })

  it('starts with an empty registry so no presentation is assumed', () => {
    expect(readFileSync(join(BOOTSTRAP, 'src', 'presentations', 'index.ts'), 'utf8')).toMatch(/presentations: readonly PresentationEntry\[\] = \[\s*(\/\/[^\n]*\s*)?\]/)
  })
})

describe('scaffold is style-neutral', () => {
  const all = [...walk(BOOTSTRAP), ...walk(PRESENTATION)].filter((f) => !f.endsWith('package-lock.json'))

  it('requires no Tailwind or other styling framework anywhere', () => {
    for (const file of all) expect(readFileSync(file, 'utf8'), relative(ROOT, file)).not.toMatch(/tailwind|styled-components|@emotion/i)
    const lock = json(BOOTSTRAP, 'package-lock.json')
    expect(Object.keys(lock.packages).filter((k) => /tailwind/.test(k))).toEqual([])
    expect(existsSync(join(BOOTSTRAP, 'tailwind.config.js'))).toBe(false)
  })

  it('ships no default presentation styling in the bootstrap (colors, fonts, cards, buttons, tokens)', () => {
    const css = all.filter((f) => f.startsWith(BOOTSTRAP) && f.endsWith('.css'))
    for (const file of css) {
      const src = readFileSync(file, 'utf8')
      expect(src, file).not.toMatch(/(^|[\s;{])(color|background\w*|font[\w-]*|border[\w-]*|box-shadow|text-shadow|filter|padding[\w-]*|gap)\s*:/m)
      expect(src, file).not.toMatch(/--[a-z]/)
      expect(src, file).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i)
    }
    expect(all.filter((f) => f.startsWith(join(BOOTSTRAP, 'src', 'presentation-kit')) && f.endsWith('.css'))).toEqual([])
  })
})

describe('presentation template', () => {
  it('provides the per-presentation files and keeps all styling in the presentation folder', () => {
    const files = rel(PRESENTATION)(walk(PRESENTATION))
    expect(files).toEqual(['Talk.tsx', 'entities.ts', 'steps/index.ts', 'steps/scene.tsx', 'talk.css'])
    expect(readFileSync(join(PRESENTATION, 'Talk.tsx'), 'utf8')).toMatch(/import '\.\/talk\.css'/)
    expect(readFileSync(join(PRESENTATION, 'Talk.tsx'), 'utf8')).toMatch(/\{\{TITLE\}\}[\s\S]*\{\{SLUG\}\}/)
  })

  it('styles the active chrome and the attribution locally', () => {
    const css = readFileSync(join(PRESENTATION, 'talk.css'), 'utf8')
    expect(css).toMatch(/\[data-presentation-progress-item\]\[data-presentation-active='true'\]\s*\{[^}]*background/)
    expect(css).toMatch(/\[data-presentation-toc-entry\]\[data-presentation-active='true'\]\s*\{[^}]*background/)
    expect(css).toMatch(/\[data-presentation-attribution\]\s*\{[^}]*font-size:\s*1[2-9]px/)
  })
})
