// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import AppRouter from '../../src/AppRouter'
import { resolveEntry } from '../../src/route'
import { presentations, type PresentationEntry } from '../../src/presentations'

afterEach(cleanup)

const make = (slug: string): PresentationEntry => ({
  slug,
  title: `Title of ${slug}`,
  load: async () => ({ default: () => <div data-testid="talk">talk {slug}</div> }),
})

const root = path.resolve(import.meta.dirname, '../..')

describe('route resolution', () => {
  const registry = [make('a'), make('b')]

  it('maps "/<slug>" to its entry and anything else to nothing', () => {
    expect(resolveEntry('/a', registry)?.slug).toBe('a')
    expect(resolveEntry('/b/', registry)?.slug).toBe('b')
    expect(resolveEntry('/', registry)).toBeUndefined()
    expect(resolveEntry('/missing', registry)).toBeUndefined()
    expect(resolveEntry('/a/extra', registry)).toBeUndefined()
  })

  it('still resolves earlier entries after another is added', () => {
    const extended = [...registry, make('c')]
    for (const entry of registry) expect(resolveEntry(`/${entry.slug}`, extended)).toBe(entry)
    expect(resolveEntry('/c', extended)?.slug).toBe('c')
  })
})

describe('AppRouter', () => {
  const registry = [make('a'), make('b')]

  it('shows Landing at the root, listing every registered presentation', () => {
    render(<AppRouter pathname="/" registry={registry} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/a', '/b'])
    expect(links.map((l) => l.textContent)).toEqual(['Title of a', 'Title of b'])
  })

  it('lazy-loads the matching presentation for a known slug', async () => {
    render(<AppRouter pathname="/b" registry={registry} />)
    expect((await screen.findByTestId('talk')).textContent).toBe('talk b')
  })

  it('falls back to Landing for an unknown path', () => {
    render(<AppRouter pathname="/nope" registry={registry} />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(screen.queryByTestId('talk')).toBeNull()
  })
})

describe('registry and entry point', () => {
  it('has unique non-empty slugs and titles and callable loaders', () => {
    expect(presentations.length).toBeGreaterThan(0)
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    for (const p of presentations) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title.length).toBeGreaterThan(0)
      expect(typeof p.load).toBe('function')
    }
  })

  it('every registered loader resolves to a default-exported component whose folder exists', async () => {
    for (const p of presentations) {
      const mod = await p.load()
      expect(typeof mod.default).toBe('function')
      expect(readFileSync(path.join(root, 'src/presentations', p.slug, 'Talk.tsx'), 'utf8')).toContain('export default')
    }
  })

  it('uses an explicit registry, a zero-dependency router, and keeps StrictMode', () => {
    const registry = readFileSync(path.join(root, 'src/presentations/index.ts'), 'utf8')
    const main = readFileSync(path.join(root, 'src/main.tsx'), 'utf8')
    expect(registry).not.toContain('import.meta.glob')
    expect(main).toContain('<StrictMode>')
    expect(main).toContain('<AppRouter')
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
    expect(Object.keys(pkg.dependencies).filter((d) => /router/i.test(d))).toEqual([])
  })
})
