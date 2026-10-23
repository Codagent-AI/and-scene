import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Router from '../../src/Router'
import { presentations } from '../../src/presentations'
import type { PresentationEntry } from '../../src/presentations/types'
import { resolveRoute } from '../../src/router'

const entry = (slug: string, title: string, text = slug) => {
  const load = vi.fn(async () => ({ default: () => <div data-testid="talk">{text}</div> }))
  return { slug, title, load } satisfies PresentationEntry
}

describe('registry', () => {
  it('has unique slugs and titles, explicit entries, and loaders resolving to components', async () => {
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    expect(new Set(presentations.map((p) => p.title)).size).toBe(presentations.length)
    for (const p of presentations) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title).not.toBe('')
      const mod = await p.load()
      expect(typeof mod.default).toBe('function')
    }
  })
})

describe('resolveRoute', () => {
  const registry = [entry('alpha', 'Alpha'), entry('beta', 'Beta')]

  it('maps "/" to the landing page and "/<slug>" to the entry (trailing slashes tolerated)', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/beta', registry)).toEqual({ kind: 'presentation', entry: registry[1] })
    expect(resolveRoute('/beta/', registry)).toEqual({ kind: 'presentation', entry: registry[1] })
  })

  it('falls back to the landing page for unknown paths', () => {
    expect(resolveRoute('/nope', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/alpha/extra', registry)).toEqual({ kind: 'landing' })
  })
})

describe('Router and Landing', () => {
  it('lists every registry entry with a link on the root route without running any loader', () => {
    const registry = [entry('alpha', 'Alpha'), entry('beta', 'Beta')]
    render(<Router pathname="/" registry={registry} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([['Alpha', '/alpha'], ['Beta', '/beta']])
    expect(registry[0].load).not.toHaveBeenCalled()
    expect(registry[1].load).not.toHaveBeenCalled()
  })

  it('lazy-loads only the selected presentation under Suspense', async () => {
    const registry = [entry('gamma', 'Gamma', 'gamma talk'), entry('delta', 'Delta', 'delta talk')]
    render(<Router pathname="/delta" registry={registry} />)
    await waitFor(() => expect(screen.getByTestId('talk').textContent).toBe('delta talk'))
    expect(registry[1].load).toHaveBeenCalledTimes(1)
    expect(registry[0].load).not.toHaveBeenCalled()
  })

  it('shows the landing page for unknown paths and an empty registry message', () => {
    const { unmount } = render(<Router pathname="/missing" registry={[entry('x', 'X')]} />)
    expect(screen.getByRole('heading').textContent).toBe('Presentations')
    unmount()
    render(<Router pathname="/" registry={[]} />)
    expect(screen.getByText('No presentations registered yet.')).toBeTruthy()
  })
})
