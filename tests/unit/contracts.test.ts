import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOST } from '../../scripts/lib/preview.mjs'
import { presentations } from '../../src/presentations/index.ts'
import { STEP_META } from '../../src/presentations/how-to-make-a-presentation/steps/meta.ts'
import { resolveRoute } from '../../src/router.ts'

const repo = path.resolve(import.meta.dirname, '../..')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

describe('style-neutral kit contract', () => {
  const kitFiles = walk(path.join(repo, 'src/presentation-kit'))
  const code = kitFiles.filter((f) => /\.(ts|tsx)$/.test(f))

  it('contains no stylesheets', () => {
    expect(kitFiles.filter((f) => /\.(css|scss|less|sass)$/.test(f))).toEqual([])
  })

  it('declares no visual defaults (colors, fonts, borders, shadows, spacing)', () => {
    const visual =
      /(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\b(color|background|backgroundColor|border|borderColor|borderRadius|boxShadow|outline|fontFamily|fontSize|fontWeight|padding|margin|gap|textDecoration)\s*:)/
    const offenders = code.filter((f) => visual.test(readFileSync(f, 'utf8')))
    expect(offenders.map((f) => path.relative(repo, f))).toEqual([])
  })

  it('imports no styling framework and no stylesheet', () => {
    for (const f of code) {
      const src = readFileSync(f, 'utf8')
      expect(src, f).not.toMatch(/tailwind|styled-components|@emotion|\.css['"]/i)
    }
  })

  it('requires no styling framework in the app dependencies', () => {
    const pkg = JSON.parse(readFileSync(path.join(repo, 'package.json'), 'utf8'))
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    expect(deps.filter((d) => /tailwind|styled|emotion/i.test(d))).toEqual([])
  })
})

describe('routing and registry', () => {
  it('"/" and unknown paths resolve to the landing page', () => {
    expect(resolveRoute('/', presentations).kind).toBe('landing')
    expect(resolveRoute('/nope', presentations).kind).toBe('landing')
  })

  it('"/<slug>" resolves to the matching registered presentation, ignoring slashes', () => {
    for (const entry of presentations) {
      for (const p of [`/${entry.slug}`, `/${entry.slug}/`]) {
        const route = resolveRoute(p, presentations)
        expect(route.kind === 'presentation' && route.entry.slug).toBe(entry.slug)
      }
    }
  })

  it('has unique slugs and lazy loaders', () => {
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    for (const p of presentations) expect(typeof p.load).toBe('function')
  })

  it('registers the reference sample', () => {
    expect(presentations.map((p) => p.slug)).toContain('how-to-make-a-presentation')
  })
})

describe('reference sample', () => {
  const reference = JSON.parse(readFileSync(path.join(repo, 'scripts/reference-sample.json'), 'utf8'))

  it('implements the nine normative steps in order', () => {
    expect(STEP_META.map(({ title, caption }) => ({ title, caption }))).toEqual(reference.steps)
    expect(STEP_META.map((s) => s.era)).toEqual([
      'the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering',
      'the build', 'the build', 'the loop', 'the reveal',
    ])
  })

  it('is a self-contained folder with entities, steps, and an entry component', () => {
    const dir = path.join(repo, 'src/presentations', reference.slug)
    for (const f of ['entities.ts', 'Talk.tsx', 'steps/index.ts', 'style.css']) {
      expect(existsSync(path.join(dir, f)), f).toBe(true)
    }
  })
})

describe('verification host', () => {
  it('uses the IPv4 loopback address and never "localhost"', () => {
    expect(HOST).toBe('127.0.0.1')
    for (const f of ['verify.mjs', 'inspect-presentation.mjs', 'lib/preview.mjs']) {
      expect(readFileSync(path.join(repo, 'scripts', f), 'utf8'), f).not.toMatch(/localhost/)
    }
  })
})
