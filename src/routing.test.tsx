import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Suspense } from 'react'
import { describe, expect, it } from 'vitest'
import { Landing } from './Landing.tsx'
import type { PresentationEntry } from './presentations/index.ts'
import { presentations } from './presentations/index.ts'
import { Router } from './Router.tsx'
import { resolveRoute } from './routing.ts'

const Hello = () => <p>hello from presentation</p>
const fixture: PresentationEntry[] = [
  { slug: 'one', title: 'First', load: async () => ({ default: Hello }) },
  { slug: 'two', title: 'Second', load: async () => ({ default: () => <p>second</p> }) },
]

describe('route resolution', () => {
  it('maps / to the landing page', () => {
    expect(resolveRoute('/', fixture)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', fixture)).toEqual({ kind: 'landing' })
  })
  it('maps every registered slug to its entry', () => {
    for (const p of presentations) expect(resolveRoute(`/${p.slug}`, presentations)).toEqual({ kind: 'presentation', entry: p })
    expect(resolveRoute('/two/', fixture)).toEqual({ kind: 'presentation', entry: fixture[1] })
  })
  it('falls back to the landing page for unknown paths', () => {
    expect(resolveRoute('/nope', fixture)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/one/extra', fixture)).toEqual({ kind: 'landing' })
  })
})

describe('Landing', () => {
  it('links every registry entry by title and slug', () => {
    render(<Landing presentations={fixture} />)
    expect(screen.getByText('First').getAttribute('href')).toBe('/one')
    expect(screen.getByText('Second').getAttribute('href')).toBe('/two')
  })
})

describe('Router', () => {
  it('lazy-loads a registered presentation under Suspense', async () => {
    render(<Router pathname="/one" presentations={fixture} />)
    expect(await screen.findByText('hello from presentation')).toBeTruthy()
  })
  it('renders the landing page for / and for unknown paths', () => {
    const { unmount } = render(<Router pathname="/" presentations={fixture} />)
    expect(screen.getByText('First')).toBeTruthy()
    unmount()
    render(
      <Suspense fallback={null}>
        <Router pathname="/missing" presentations={fixture} />
      </Suspense>,
    )
    expect(screen.getByText('Second')).toBeTruthy()
  })
})

describe('registry', () => {
  it('is an explicit list of unique { slug, title, load } entries', () => {
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    for (const p of presentations) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/)
      expect(p.title).toBeTruthy()
      expect(p.load).toBeTypeOf('function')
    }
  })
  it('uses no glob registration, no router dependency, and keeps StrictMode at the root', () => {
    const here = path.dirname(new URL(import.meta.url).pathname)
    const registry = readFileSync(path.join(here, 'presentations/index.ts'), 'utf8')
    expect(registry).not.toMatch(/import\.meta\.glob/)
    const pkg = JSON.parse(readFileSync(path.join(here, '../package.json'), 'utf8'))
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => /router/.test(d))).toEqual([])
    const main = readFileSync(path.join(here, 'main.tsx'), 'utf8')
    expect(main).toMatch(/<StrictMode>[\s\S]*<Router[\s\S]*<\/StrictMode>/)
  })
})
