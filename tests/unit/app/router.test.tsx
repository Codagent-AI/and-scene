import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import AppRouter from '../../../src/AppRouter.tsx'
import Landing from '../../../src/Landing.tsx'
import { presentations, type PresentationEntry } from '../../../src/presentations/index.ts'
import { resolveRoute } from '../../../src/route.ts'

const entry = (slug: string, title = slug.toUpperCase()): PresentationEntry => ({
  slug,
  title,
  load: async () => ({ default: () => <p data-testid="talk">talk {slug}</p> }),
})
const fixture = [entry('alpha', 'Alpha Talk'), entry('beta', 'Beta Talk'), entry('gamma', 'Gamma Talk')]

describe('registry (L-41, L-43, L-76)', () => {
  it('is an explicit array of unique slugs with titles and loaders', () => {
    expect(Array.isArray(presentations)).toBe(true)
    const slugs = presentations.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const p of presentations) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title.length).toBeGreaterThan(0)
      expect(p.load).toBeTypeOf('function')
    }
  })

  it('has loaders that resolve to a component for every entry', async () => {
    for (const p of presentations) {
      const mod = await p.load()
      expect(mod.default).toBeTypeOf('function')
    }
  })

  it('registers the reference sample under its own route', () => {
    const sample = presentations.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(sample?.title).toBe('How to Use This Skill to Make a Presentation')
  })

  it('registers by explicit entries, not glob or router dependency (L-76)', () => {
    expect(readFileSync('src/presentations/index.ts', 'utf8')).not.toMatch(/import\.meta\.glob/)
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(Object.keys(pkg.dependencies).filter((d) => /router/.test(d))).toEqual([])
    expect(readFileSync('src/AppRouter.tsx', 'utf8')).toMatch(/lazy\(/)
    expect(readFileSync('src/AppRouter.tsx', 'utf8')).toMatch(/<Suspense/)
  })
})

describe('resolveRoute (L-76)', () => {
  it('maps the root to the landing page', () => {
    expect(resolveRoute('/', fixture)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', fixture)).toEqual({ kind: 'landing' })
  })

  it.each(fixture.map((e) => e.slug))('maps /%s to its presentation (also with a trailing slash)', (slug) => {
    for (const path of [`/${slug}`, `/${slug}/`]) {
      const route = resolveRoute(path, fixture)
      expect(route.kind === 'presentation' && route.entry.slug).toBe(slug)
    }
  })

  it('shows the landing page for unknown paths', () => {
    expect(resolveRoute('/nope', fixture)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/alpha/extra', fixture)).toEqual({ kind: 'landing' })
  })
})

describe('AppRouter and Landing (L-76, L-77, L-43)', () => {
  it('lazy-loads the matching presentation', async () => {
    render(<AppRouter pathname="/beta" entries={fixture} />)
    expect((await screen.findByTestId('talk')).textContent).toBe('talk beta')
  })

  it('renders the landing page for the root and for unknown paths', () => {
    for (const pathname of ['/', '/unknown']) {
      const { unmount } = render(<AppRouter pathname={pathname} entries={fixture} />)
      expect(screen.getAllByRole('link')).toHaveLength(3)
      unmount()
    }
  })

  it('lists exactly one correctly labelled link per registered presentation', () => {
    render(<Landing entries={fixture} />)
    const links = screen.getAllByRole('link') as HTMLAnchorElement[]
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Alpha Talk', '/alpha'],
      ['Beta Talk', '/beta'],
      ['Gamma Talk', '/gamma'],
    ])
  })

  it('keeps all seeded presentations reachable after adding one', async () => {
    const more = [...fixture, entry('delta')]
    for (const e of more) {
      const { unmount } = render(<AppRouter pathname={`/${e.slug}`} entries={more} />)
      expect((await screen.findByTestId('talk')).textContent).toBe(`talk ${e.slug}`)
      unmount()
    }
  })

  it('works under StrictMode', async () => {
    render(
      <StrictMode>
        <AppRouter pathname="/alpha" entries={fixture} />
      </StrictMode>,
    )
    expect(await screen.findByTestId('talk')).toBeTruthy()
  })

  it('keeps StrictMode at the application entry (L-78)', () => {
    const main = readFileSync('src/main.tsx', 'utf8')
    expect(main).toMatch(/<StrictMode>[\s\S]*<AppRouter \/>[\s\S]*<\/StrictMode>/)
  })
})
