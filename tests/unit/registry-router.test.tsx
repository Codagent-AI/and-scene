// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import App from '../../src/App'
import Landing from '../../src/Landing'
import { presentations, type PresentationEntry } from '../../src/presentations'
import { resolveRoute } from '../../src/route'
import { parseRegistry } from '../../scripts/lib/registry.mjs'

const ROOT = join(__dirname, '..', '..')
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8')

const fake = (slug: string): PresentationEntry => ({
  slug,
  title: `Title of ${slug}`,
  load: async () => ({ default: () => <div data-testid="loaded">{slug}</div> }),
})

describe('registry', () => {
  it('is an explicit array, not glob discovery, and matches what scripts parse', () => {
    const src = read('src', 'presentations', 'index.ts')
    expect(src).not.toMatch(/import\.meta\.glob/)
    expect(src).toMatch(/export const presentations/)
    expect(parseRegistry(src).map(({ slug, title }) => ({ slug, title }))).toEqual(
      presentations.map(({ slug, title }) => ({ slug, title })),
    )
  })

  it('has unique non-empty slugs and titles, includes the sample, and every loader resolves a component', async () => {
    const slugs = presentations.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const p of presentations) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title.trim()).not.toBe('')
      expect(typeof (await p.load()).default).toBe('function')
    }
    expect(slugs).toContain('how-to-make-a-presentation')
  })
})

describe('routing', () => {
  const registry = [fake('one'), fake('two')]

  it('maps root and unknown paths to Landing and slugs to their entry', () => {
    expect(resolveRoute('/', registry).kind).toBe('landing')
    expect(resolveRoute('/nope', registry).kind).toBe('landing')
    expect(resolveRoute('/one/extra', registry).kind).toBe('landing')
    expect(resolveRoute('/two', registry)).toMatchObject({ kind: 'presentation', entry: { slug: 'two' } })
    expect(resolveRoute('/two/', registry)).toMatchObject({ kind: 'presentation', entry: { slug: 'two' } })
  })

  it('renders Landing at the root and for unknown paths', () => {
    for (const path of ['/', '/missing']) {
      const { unmount } = render(<App pathname={path} registry={registry} />)
      expect(screen.getByRole('heading', { name: 'and-scene' })).toBeTruthy()
      unmount()
    }
  })

  it('lazy-loads the matching presentation under Suspense', async () => {
    render(<App pathname="/two" registry={registry} />)
    expect((await screen.findByTestId('loaded')).textContent).toBe('two')
    expect(screen.queryByRole('heading', { name: 'and-scene' })).toBeNull()
  })

  it('wires lazy + Suspense and uses no router library', () => {
    const app = read('src', 'App.tsx')
    expect(app).toMatch(/\blazy\(/)
    expect(app).toMatch(/<Suspense/)
    const pkg = JSON.parse(read('package.json'))
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => /router/.test(d))).toEqual([])
  })

  it('keeps StrictMode around the app', () => {
    expect(read('src', 'main.tsx')).toMatch(/<StrictMode>[\s\S]*<App \/>[\s\S]*<\/StrictMode>/)
  })
})

describe('landing', () => {
  it('links every registry entry, including later additions, without disturbing earlier ones', () => {
    const before = [fake('one'), fake('two')]
    const after = [...before, fake('three')]
    const { rerender } = render(<Landing registry={before} />)
    const hrefs = () => screen.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])
    expect(hrefs()).toEqual([['Title of one', '/one'], ['Title of two', '/two']])
    rerender(<Landing registry={after} />)
    expect(hrefs()).toEqual([['Title of one', '/one'], ['Title of two', '/two'], ['Title of three', '/three']])
  })

  it('lists the real registry', () => {
    render(<Landing />)
    for (const p of presentations) expect(screen.getByRole('link', { name: p.title }).getAttribute('href')).toBe(`/${p.slug}`)
  })
})
