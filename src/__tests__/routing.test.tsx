import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Landing } from '../Landing.tsx'
import { Router } from '../Router.tsx'
import { PRESENTATIONS } from '../presentations/index.ts'
import { resolveRoute, validateRegistry } from '../presentations/registry.ts'
import type { PresentationEntry } from '../presentations/registry.ts'

afterEach(cleanup)

function entry(slug: string, title = slug): PresentationEntry & { load: ReturnType<typeof vi.fn> } {
  const load = vi.fn(async () => ({ default: () => <p>Loaded {slug}</p> }))
  return { slug, title, load }
}

describe('resolveRoute', () => {
  const registry = [entry('alpha'), entry('beta')]

  it('resolves the root to the landing page', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', registry)).toEqual({ kind: 'landing' })
  })

  it('resolves a registered slug, tolerating slashes', () => {
    expect(resolveRoute('/beta', registry)).toEqual({ kind: 'presentation', entry: registry[1] })
    expect(resolveRoute('/beta/', registry)).toEqual({ kind: 'presentation', entry: registry[1] })
  })

  it('falls back to landing for unknown paths, never to a not-found', () => {
    expect(resolveRoute('/nope', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/alpha/extra', registry)).toEqual({ kind: 'landing' })
  })
})

describe('Router', () => {
  it('renders Landing at / and for unknown paths without loading any presentation', () => {
    const registry = [entry('alpha', 'Alpha talk')]
    const view = render(<Router pathname="/" registry={registry} />)
    expect(screen.getByRole('link', { name: 'Alpha talk' })).toBeTruthy()
    view.unmount()
    render(<Router pathname="/missing" registry={registry} />)
    expect(screen.getByRole('link', { name: 'Alpha talk' })).toBeTruthy()
    expect(screen.queryByText(/not found/i)).toBeNull()
    expect(registry[0].load).not.toHaveBeenCalled()
  })

  it('lazy-loads only the registered slug behind a Suspense fallback, then shows it', async () => {
    const registry = [entry('alpha'), entry('beta')]
    const { container } = render(<Router pathname="/beta" registry={registry} />)
    expect(container.querySelector('[data-route-loading]')).not.toBeNull()
    await waitFor(() => expect(screen.getByText('Loaded beta')).toBeTruthy())
    expect(registry[1].load).toHaveBeenCalledTimes(1)
    expect(registry[0].load).not.toHaveBeenCalled()
  })

  it('keeps every old and new entry reachable when an entry is added', async () => {
    const before = [entry('alpha'), entry('beta')]
    const after = [...before, entry('gamma')]
    for (const e of after) {
      const view = render(<Router pathname={`/${e.slug}`} registry={after} />)
      await waitFor(() => expect(screen.getByText(`Loaded ${e.slug}`)).toBeTruthy())
      view.unmount()
    }
    expect(after.slice(0, 2)).toEqual(before)
  })
})

describe('Landing', () => {
  it('lists one correct link per registered presentation', () => {
    const registry = [entry('alpha', 'Alpha'), entry('beta', 'Beta'), entry('gamma', 'Gamma')]
    render(<Landing registry={registry} />)
    const links = screen.getAllByRole('link')
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Alpha', '/alpha'],
      ['Beta', '/beta'],
      ['Gamma', '/gamma'],
    ])
  })
})

describe('validateRegistry', () => {
  const ok = entry('alpha', 'Alpha')

  it('accepts a sound registry, including the committed one', () => {
    expect(validateRegistry([ok, entry('beta')])).toEqual([])
    expect(validateRegistry(PRESENTATIONS)).toEqual([])
  })

  it('rejects duplicate slugs', () => {
    expect(validateRegistry([ok, entry('alpha', 'Other')])).toEqual([expect.stringContaining('duplicate slug "alpha"')])
  })

  it.each([undefined, '', 'Has Space', 'UPPER', '-lead', 'a/b'])('rejects invalid slug %j', (slug) => {
    expect(validateRegistry([{ ...ok, slug }])).toEqual([expect.stringContaining('invalid slug')])
  })

  it('rejects a missing title or loader', () => {
    expect(validateRegistry([{ ...ok, title: '  ' }])).toEqual([expect.stringContaining('missing title')])
    expect(validateRegistry([{ slug: 'a', title: 'A' }])).toEqual([expect.stringContaining('missing loader')])
  })
})

describe('committed registry', () => {
  it('registers the reference sample under its own slug with a lazy loader', () => {
    const sample = PRESENTATIONS.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(sample?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(typeof sample?.load).toBe('function')
  })
})
