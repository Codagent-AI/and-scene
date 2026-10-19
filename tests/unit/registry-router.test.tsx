/// <reference lib="dom" />
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { createElement as h } from 'react'
import type { ComponentType } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Landing } from '../../src/Landing'
import { Router } from '../../src/router'
import { resolveEntry } from '../../src/routes'
import { presentations } from '../../src/presentations'
import type { PresentationEntry } from '../../src/presentations/registry'
import TalkDefault from '../../src/presentations/how-to-make-a-presentation/Talk'
import { REPO_ROOT } from './helpers/kit-scan'

afterEach(() => cleanup())

const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), 'utf8')

/** Fixture page components with unique, asserted-on markers. */
const Alpha: ComponentType = () => h('p', { 'data-testid': 'alpha-page' }, 'ALPHA PAGE')
const Beta: ComponentType = () => h('p', { 'data-testid': 'beta-page' }, 'BETA PAGE')
const Gamma: ComponentType = () => h('p', { 'data-testid': 'gamma-page' }, 'GAMMA PAGE')

function seedRegistry(): PresentationEntry[] {
  return [
    { slug: 'alpha-deck', title: 'Alpha Deck', load: vi.fn(() => Promise.resolve({ default: Alpha })) },
    { slug: 'beta-deck', title: 'Beta Deck', load: vi.fn(() => Promise.resolve({ default: Beta })) },
  ]
}

const MARKER: Record<string, string> = { 'alpha-deck': 'alpha-page', 'beta-deck': 'beta-page', 'delta-deck': 'delta-page' }

describe('registry contract', () => {
  it('real registry: unique slugs and titles, url-safe slugs, non-empty titles', () => {
    const slugs = presentations.map((e) => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(new Set(presentations.map((e) => e.title)).size).toBe(presentations.length)
    for (const e of presentations) {
      expect(e.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(e.title.trim().length).toBeGreaterThan(0)
    }
  })

  it('real registry: each lazy loader is distinct and resolves to a component module', async () => {
    expect(new Set(presentations.map((e) => e.load)).size).toBe(presentations.length)
    for (const e of presentations) {
      const mod = await e.load()
      expect(typeof mod.default).toBe('function')
    }
  })

  it('real registry: the sample loader resolves to the sample Talk component', async () => {
    const sample = presentations.find((e) => e.slug === 'how-to-make-a-presentation')
    expect(sample).toBeDefined()
    const mod = await sample!.load()
    expect(mod.default).toBe(TalkDefault)
  })

  it('registry is an explicit array with no glob discovery in the routing/registry sources', () => {
    const files = [
      'src/presentations/index.ts',
      'src/presentations/registry.ts',
      'src/router.tsx',
      'src/Landing.tsx',
      'src/main.tsx',
    ]
    for (const f of files) expect(read(f)).not.toMatch(/import\.meta\.glob|require\.context/)
    expect(read('src/presentations/index.ts')).toMatch(/export const presentations\b[^=]*=\s*\[/)
  })

  it('main.tsx mounts Router with the explicit registry', () => {
    const src = read('src/main.tsx')
    expect(src).toMatch(/import \{ presentations \} from '\.\/presentations'/)
    expect(src).toMatch(/<Router [^>]*registry=\{presentations\}/)
  })
})

describe('resolveEntry', () => {
  const registry = seedRegistry()

  it('returns the entry for its slug, tolerating surrounding slashes', () => {
    expect(resolveEntry('/alpha-deck', registry)).toBe(registry[0])
    expect(resolveEntry('/alpha-deck/', registry)).toBe(registry[0])
    expect(resolveEntry('beta-deck', registry)).toBe(registry[1])
  })

  it('returns undefined for root, unknown and nested paths without throwing', () => {
    expect(resolveEntry('/', registry)).toBeUndefined()
    expect(resolveEntry('', registry)).toBeUndefined()
    expect(resolveEntry('/nope', registry)).toBeUndefined()
    expect(resolveEntry('/alpha-deck/extra', registry)).toBeUndefined()
  })
})

describe('Router and Landing', () => {
  it('renders Landing at "/" with a link for every registry entry', () => {
    const registry = seedRegistry()
    render(h(Router, { pathname: '/', registry }))
    expect(screen.getByRole('heading', { name: 'Presentations' })).toBeTruthy()
    for (const e of registry) {
      const link = screen.getByRole('link', { name: e.title })
      expect(link.getAttribute('href')).toBe(`/${e.slug}`)
    }
    expect(registry[0].load).not.toHaveBeenCalled()
  })

  it.each(['alpha-deck', 'beta-deck'])('/%s shows a loading fallback, then the intended component', async (slug) => {
    const registry = seedRegistry()
    render(h(Router, { pathname: `/${slug}`, registry }))
    expect(document.querySelector('[data-presentation-loading]')).not.toBeNull()
    const entry = registry.find((e) => e.slug === slug)!
    expect(entry.load).toHaveBeenCalledTimes(1)
    const expected = MARKER[slug]
    expect(await screen.findByTestId(expected)).toBeTruthy()
    expect(document.querySelector('[data-landing]')).toBeNull()
    expect(document.querySelector('[data-presentation-loading]')).toBeNull()
  })

  it('keeps the fallback visible until a pending lazy load resolves', async () => {
    let release!: (m: { default: ComponentType }) => void
    const pending = new Promise<{ default: ComponentType }>((r) => (release = r))
    const registry: PresentationEntry[] = [{ slug: 'gamma-deck', title: 'Gamma', load: () => pending }]
    render(h(Router, { pathname: '/gamma-deck', registry }))
    expect(screen.getByText('Loading…')).toBeTruthy()
    expect(screen.queryByTestId('gamma-page')).toBeNull()
    release({ default: Gamma })
    expect(await screen.findByTestId('gamma-page')).toBeTruthy()
    await waitFor(() => expect(document.querySelector('[data-presentation-loading]')).toBeNull())
  })

  it.each(['/no-such-deck', '/alpha-deck/extra', '/%F0%9F%98%80'])('unknown path %s falls back to Landing without throwing', (path) => {
    const registry = seedRegistry()
    expect(() => render(h(Router, { pathname: path, registry }))).not.toThrow()
    expect(document.querySelector('[data-landing]')).not.toBeNull()
  })

  it('Landing lists every entry for the real registry with working hrefs', () => {
    render(h(Landing, { registry: presentations }))
    for (const e of presentations) {
      expect(screen.getByRole('link', { name: e.title }).getAttribute('href')).toBe(`/${e.slug}`)
    }
  })
})

describe('appending to a registry', () => {
  it('keeps old entries (metadata and loader identity) and every old and new route renders', async () => {
    const seed = seedRegistry()
    const snapshot = seed.map((e) => ({ slug: e.slug, title: e.title, load: e.load }))
    const delta: PresentationEntry = {
      slug: 'delta-deck',
      title: 'Delta Deck',
      load: vi.fn(() => Promise.resolve({ default: (() => h('p', { 'data-testid': 'delta-page' }, 'DELTA')) as ComponentType })),
    }
    const next = [...seed, delta]

    expect(next).toHaveLength(seed.length + 1)
    snapshot.forEach((old, i) => {
      expect(next[i]).toBe(seed[i])
      expect(next[i].slug).toBe(old.slug)
      expect(next[i].title).toBe(old.title)
      expect(next[i].load).toBe(old.load)
    })

    for (const e of next) {
      cleanup()
      render(h(Router, { pathname: `/${e.slug}`, registry: next }))
      expect(await screen.findByTestId(MARKER[e.slug])).toBeTruthy()
    }
    // The new loader is selected only for its own route.
    expect(delta.load).toHaveBeenCalledTimes(1)
    expect(seed[0].load).toHaveBeenCalledTimes(1)
    expect(seed[1].load).toHaveBeenCalledTimes(1)
  })
})
