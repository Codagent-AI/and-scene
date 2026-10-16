import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PRESENTATIONS } from '../../src/presentations/index.ts'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps.ts'
import { resolvePresentation } from '../../src/routes.ts'

const ROOT = join(import.meta.dirname, '..', '..')
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]))

describe('routing and registry', () => {
  it('registers unique slugs with lazy loaders', () => {
    const slugs = PRESENTATIONS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const p of PRESENTATIONS) expect(typeof p.load).toBe('function')
    expect(slugs).toContain('how-to-make-a-presentation')
  })

  it('maps "/<slug>" to its entry and everything else to the landing page', () => {
    expect(resolvePresentation('/how-to-make-a-presentation', PRESENTATIONS)?.slug).toBe('how-to-make-a-presentation')
    expect(resolvePresentation('/how-to-make-a-presentation/', PRESENTATIONS)?.slug).toBe('how-to-make-a-presentation')
    expect(resolvePresentation('/', PRESENTATIONS)).toBeNull()
    expect(resolvePresentation('/nope', PRESENTATIONS)).toBeNull()
  })

  it('registry is explicit: no glob auto-registration', () => {
    expect(read('src/presentations/index.ts')).not.toContain('import.meta.glob')
  })
})

describe('committed reference sample', () => {
  // Rows of the normative table: | n | era | "title" | caption | scene content |
  const spec = read('openspec/changes/create-and-scene/specs/presentation-verification/spec.md')
  const rows = [...spec.matchAll(/^\| (\d) \| ([^|]+) \| "([^"]+)" \| ([^|]+) \|/gm)].map((m) => ({
    era: m[2].trim(),
    title: m[3],
    caption: m[4].trim(),
  }))

  it('implements the nine normative steps in order', () => {
    expect(rows).toHaveLength(9)
    expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(rows)
  })

  it('has stable unique step ids and one shared scene group', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
  })

  it('verify.config.json carries the same titles and captions the verify script asserts', () => {
    const { reference } = JSON.parse(read('scripts/verify.config.json'))
    expect(reference.slug).toBe('how-to-make-a-presentation')
    expect(reference.steps).toEqual(rows.map(({ title, caption }) => ({ title, caption })))
  })

  it('is registered and opens in browse mode', () => {
    expect(PRESENTATIONS.some((p) => p.slug === 'how-to-make-a-presentation')).toBe(true)
    expect(read('src/presentations/how-to-make-a-presentation/Talk.tsx')).toContain('initialMode="browse"')
  })

  it('composes the kit only through its public entry point', () => {
    const dir = join(ROOT, 'src/presentations/how-to-make-a-presentation')
    for (const file of walk(dir).filter((f) => /\.tsx?$/.test(f))) {
      const imports = [...readFileSync(file, 'utf8').matchAll(/from '([^']*presentation-kit[^']*)'/g)].map((m) => m[1])
      for (const spec of imports) expect(spec, relative(ROOT, file)).toMatch(/presentation-kit\/index\.ts$/)
    }
  })

  it('keeps presentation visuals in presentation-owned CSS', () => {
    expect(read('src/presentations/how-to-make-a-presentation/styles.css')).toContain('[data-presentation-attribution]')
  })
})

describe('app shell', () => {
  it('declares the required scripts', () => {
    const scripts = JSON.parse(read('package.json')).scripts
    for (const name of ['test', 'lint', 'build', 'verify', 'inspect']) expect(scripts[name]).toBeTruthy()
    expect(scripts.build).toBe('tsc -b && vite build')
  })

  it('has no CI configuration and git-ignores inspection output', () => {
    expect(() => statSync(join(ROOT, '.github/workflows'))).toThrow()
    expect(read('.gitignore')).toContain('.presentation-inspect')
  })
})
