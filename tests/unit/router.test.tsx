// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import Router from '../../src/Router.tsx'
import { presentations, type PresentationEntry } from '../../src/presentations/index.ts'
import { resolveRoute } from '../../src/route.ts'

/** Suspended lazy routes need the initial render inside an awaited act. */
async function renderAsync(ui: ReactElement) {
  let view!: ReturnType<typeof render>
  await act(async () => {
    view = render(ui)
  })
  return view
}

const entry = (slug: string, title = `Title ${slug}`): PresentationEntry => ({
  slug,
  title,
  load: vi.fn(async () => ({ default: () => <div data-testid="loaded">{`deck:${slug}`}</div> })),
})

describe('registry (M-58, M-42, M-75)', () => {
  it('has unique slugs and a loader that resolves a default component for each entry', async () => {
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    for (const p of presentations) {
      const mod = await p.load()
      expect(mod.default, p.slug).toBeTypeOf('function')
    }
  })

  it('registers the canonical sample', () => {
    const sample = presentations.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(sample?.title).toBe('How to Use This Skill to Make a Presentation')
  })
})

describe('resolveRoute', () => {
  const registry = [entry('alpha'), entry('beta')]

  it('maps / to the landing page and registered slugs (with or without slashes) to their entry', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/beta', registry)).toEqual({ kind: 'presentation', entry: registry[1] })
    expect(resolveRoute('/beta/', registry)).toEqual({ kind: 'presentation', entry: registry[1] })
  })

  it('falls back to the landing page for unknown or nested paths, never to a presentation', () => {
    for (const path of ['/nope', '/alpha/extra', '/ALPHA', '/..%2f', '/alpha.html']) {
      expect(resolveRoute(path, registry), path).toEqual({ kind: 'landing' })
    }
  })
})

describe('Router (M-75, M-43)', () => {
  it('shows the landing page at / listing every entry with its link, without loading any presentation', () => {
    const registry = [entry('alpha'), entry('beta')]
    render(<Router pathname="/" registry={registry} />)
    expect(screen.getByRole('link', { name: 'Title alpha' }).getAttribute('href')).toBe('/alpha')
    expect(screen.getByRole('link', { name: 'Title beta' }).getAttribute('href')).toBe('/beta')
    expect(registry[0].load).not.toHaveBeenCalled()
    expect(registry[1].load).not.toHaveBeenCalled()
  })

  it('lazy-loads only the matching presentation', async () => {
    const registry = [entry('alpha'), entry('beta')]
    await renderAsync(<Router pathname="/beta" registry={registry} />)
    expect(await screen.findByText('deck:beta')).toBeTruthy()
    expect(registry[1].load).toHaveBeenCalledTimes(1)
    expect(registry[0].load).not.toHaveBeenCalled()
  })

  it('shows an intentional fallback for an unknown path with no presentation, no throw and no console error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const registry = [entry('alpha')]
    render(<Router pathname="/missing" registry={registry} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).not.toBe('')
    expect(screen.getByRole('link', { name: 'Title alpha' })).toBeTruthy()
    expect(screen.queryByTestId('loaded')).toBeNull()
    expect(registry[0].load).not.toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
  })

  it('shows a host fallback instead of the landing page for unmatched paths, but still loads presentations', async () => {
    const registry = [entry('alpha')]
    const view = render(<Router pathname="/" registry={registry} fallback={<p>host app</p>} />)
    expect(screen.getByText('host app')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Title alpha' })).toBeNull()
    view.unmount()
    await renderAsync(<Router pathname="/alpha" registry={registry} fallback={<p>host app</p>} />)
    expect(await screen.findByText('deck:alpha')).toBeTruthy()
  })

  it('keeps earlier routes reachable and unchanged when an entry is appended', async () => {
    const before = [entry('alpha'), entry('beta')]
    const after = [...before, entry('gamma')]
    for (const [i, slug] of ['alpha', 'beta'].entries()) {
      const route = resolveRoute(`/${slug}`, after)
      expect(route.kind === 'presentation' && route.entry).toBe(before[i]) // same entry object and loader
    }
    const view = await renderAsync(<Router pathname="/alpha" registry={after} />)
    expect(await screen.findByText('deck:alpha')).toBeTruthy()
    view.unmount()
    await renderAsync(<Router pathname="/gamma" registry={after} />)
    expect(await screen.findByText('deck:gamma')).toBeTruthy()
  })
})
