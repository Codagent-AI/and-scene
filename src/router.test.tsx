import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, within, type RenderResult } from '@testing-library/react'

// Real module loads and delayed imports are slow under parallel test load.
vi.setConfig({ testTimeout: 20000 })
import type { ComponentProps, ComponentType } from 'react'
import { Root } from './Root'
import { resolveRoute } from './router'
import { presentations, type PresentationEntry } from './presentations'
import { OUTLINE, PRESENTATION_TITLE } from './presentations/how-to-make-a-presentation/outline'

afterEach(cleanup)

// Suspending routes need the initial render inside an async act scope so the
// resolved import re-renders; a plain render() leaves the Suspense boundary pending.
async function renderRoot(props: ComponentProps<typeof Root>): Promise<RenderResult> {
  const out: RenderResult[] = []
  await act(async () => {
    out.push(render(<Root {...props} />))
  })
  return out[0]
}

const Alpha: ComponentType = () => <h2>Alpha deck</h2>
const Beta: ComponentType = () => <h2>Beta deck</h2>
const Gamma: ComponentType = () => <h2>Gamma deck</h2>

// Registry fixture: one immediate import and one delayed import (exercises Suspense).
const fixture: PresentationEntry[] = [
  { slug: 'alpha', title: 'Alpha', load: () => Promise.resolve({ default: Alpha }) },
  {
    slug: 'beta',
    title: 'Beta',
    load: () => new Promise((resolve) => setTimeout(() => resolve({ default: Beta }), 30)),
  },
]

const appended: PresentationEntry = { slug: 'gamma', title: 'Gamma', load: () => Promise.resolve({ default: Gamma }) }

describe('resolveRoute', () => {
  it('maps root and unknown paths to the landing page and slugs to their entry', () => {
    expect(resolveRoute('/', fixture)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', fixture)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/no-such-deck', fixture)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/alpha', fixture)).toEqual({ kind: 'presentation', entry: fixture[0] })
    expect(resolveRoute('/alpha/', fixture)).toEqual({ kind: 'presentation', entry: fixture[0] })
  })

  it('keeps every original mapping intact when an entry is appended to the registry', () => {
    const extended = [...fixture, appended]
    expect(resolveRoute('/alpha', extended)).toEqual({ kind: 'presentation', entry: fixture[0] })
    expect(resolveRoute('/beta', extended)).toEqual({ kind: 'presentation', entry: fixture[1] })
    expect(resolveRoute('/gamma', extended)).toEqual({ kind: 'presentation', entry: appended })
    expect(resolveRoute('/gamma', fixture)).toEqual({ kind: 'landing' })
  })
})

describe('Root and Landing with a registry fixture', () => {
  it('renders Landing at / with a link to every registry entry', () => {
    render(<Root pathname="/" registry={[...fixture, appended]} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('and-scene')
    const links = screen.getAllByRole('link')
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Alpha', '/alpha'],
      ['Beta', '/beta'],
      ['Gamma', '/gamma'],
    ])
  })

  it('renders each entry through its own slug route', async () => {
    const { unmount } = await renderRoot({ pathname: '/alpha', registry: fixture })
    expect(await screen.findByRole('heading', { name: 'Alpha deck' }, { timeout: 5000 })).toBeTruthy()
    unmount()
  })

  it('lazy-loads a delayed import under Suspense, with nothing rendered while it is pending', async () => {
    const { container } = await renderRoot({ pathname: '/beta', registry: fixture })
    expect(container.textContent).toBe('')
    expect(await screen.findByRole('heading', { name: 'Beta deck' }, { timeout: 5000 })).toBeTruthy()
  })

  it('renders Landing for an unknown route without throwing or blanking the page', async () => {
    const { container } = await renderRoot({ pathname: '/missing/deep/path', registry: fixture })
    expect(container.querySelector('main')).not.toBeNull()
    expect(within(container).getAllByRole('link')).toHaveLength(fixture.length)
  })

  it('serves an appended entry at its own route while original routes still render', async () => {
    const registry = [...fixture, appended]
    const first = await renderRoot({ pathname: '/gamma', registry })
    expect(await first.findByRole('heading', { name: 'Gamma deck' }, { timeout: 5000 })).toBeTruthy()
    first.unmount()
    const second = await renderRoot({ pathname: '/alpha', registry })
    expect(await second.findByRole('heading', { name: 'Alpha deck' }, { timeout: 5000 })).toBeTruthy()
    second.unmount()
  })
})

const registrySource = import.meta.glob('./presentations/index.ts', { query: '?raw', import: 'default', eager: true })['./presentations/index.ts']

describe('real presentation registry', () => {
  it('has unique slugs, and each entry has a slug, title and load function', () => {
    const slugs = presentations.map((e) => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(presentations.length).toBeGreaterThan(0)
    for (const entry of presentations) {
      expect(entry.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(entry.title.trim()).not.toBe('')
      expect(typeof entry.load).toBe('function')
    }
  })

  it('is an explicit array of literal entries, not auto-discovered', () => {
    const source = registrySource
    expect(source).not.toMatch(/import\.meta\.glob|require\.context|readdirSync|globSync/)
    expect(source).toMatch(/export const presentations\b[^=]*=\s*\[/)
  })

  it('lists every registry entry on the landing page', () => {
    render(<Root pathname="/" />)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(presentations.map((e) => `/${e.slug}`))
  })

  it('loads and renders each entry through its own slug route', async () => {
    for (const entry of presentations) {
      const { unmount } = await renderRoot({ pathname: `/${entry.slug}` })
      const firstTitle = OUTLINE[0].title
      expect(await screen.findByRole('heading', { level: 1, name: firstTitle }, { timeout: 15000 })).toBeTruthy()
      expect(document.title).toBe(PRESENTATION_TITLE)
      unmount()
    }
  })
})
