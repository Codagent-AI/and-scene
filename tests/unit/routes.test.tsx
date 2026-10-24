import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Landing } from '../../src/Landing'
import { presentations, type PresentationEntry } from '../../src/presentations'
import { Router } from '../../src/router'
import { resolveRoute } from '../../src/routes'

const entry = (slug: string, text = slug): PresentationEntry & { load: ReturnType<typeof vi.fn> } => ({
  slug,
  title: `Title of ${slug}`,
  load: vi.fn(() => Promise.resolve({ default: () => <p>talk:{text}</p> })),
})

describe('registry', () => {
  it('has unique slugs, titles, and loaders', () => {
    expect(presentations.length).toBeGreaterThan(0)
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    for (const p of presentations) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title).not.toBe('')
      expect(typeof p.load).toBe('function')
    }
  })
})

describe('resolveRoute', () => {
  const a = entry('alpha')
  const b = entry('beta')
  const registry = [a, b]

  it('maps "/" to the landing page', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', registry)).toEqual({ kind: 'landing' })
  })

  it('maps "/<slug>" to that entry, tolerating a trailing slash', () => {
    expect(resolveRoute('/alpha', registry)).toEqual({ kind: 'presentation', entry: a })
    expect(resolveRoute('/beta/', registry)).toEqual({ kind: 'presentation', entry: b })
  })

  it('falls back to the landing page for unknown or nested paths', () => {
    expect(resolveRoute('/nope', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/alpha/extra', registry)).toEqual({ kind: 'landing' })
  })

  it('keeps earlier entries reachable when another is added', () => {
    expect(resolveRoute('/alpha', [a])).toEqual({ kind: 'presentation', entry: a })
    expect(resolveRoute('/alpha', registry)).toEqual({ kind: 'presentation', entry: a })
    expect(resolveRoute('/beta', registry)).toEqual({ kind: 'presentation', entry: b })
  })
})

describe('Landing', () => {
  it('links every registry entry to its route', () => {
    render(<Landing registry={[entry('alpha'), entry('beta')]} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => [l.textContent, l.getAttribute('href'), l.getAttribute('data-presentation-slug')])).toEqual([
      ['Title of alpha', '/alpha', 'alpha'],
      ['Title of beta', '/beta', 'beta'],
    ])
  })
})

describe('Router', () => {
  it('lazy-loads only the matching presentation inside Suspense', async () => {
    const a = entry('alpha')
    const b = entry('beta')
    render(<Router pathname="/beta" registry={[a, b]} />)
    expect(await screen.findByText('talk:beta')).toBeTruthy()
    expect(b.load).toHaveBeenCalledTimes(1)
    expect(a.load).not.toHaveBeenCalled()
  })

  it('does not reload or remount the presentation on re-render', async () => {
    const a = entry('alpha')
    const { rerender } = render(<Router pathname="/alpha" registry={[a]} />)
    await screen.findByText('talk:alpha')
    rerender(<Router pathname="/alpha" registry={[a]} />)
    expect(a.load).toHaveBeenCalledTimes(1)
  })

  it('shows the landing page for "/" and for unknown paths without loading anything', () => {
    const a = entry('alpha')
    const { unmount } = render(<Router pathname="/" registry={[a]} />)
    expect(screen.getByRole('link').getAttribute('href')).toBe('/alpha')
    unmount()
    render(<Router pathname="/missing" registry={[a]} />)
    expect(screen.getByRole('link').getAttribute('href')).toBe('/alpha')
    expect(a.load).not.toHaveBeenCalled()
  })

  it('is wired from main.tsx with the real registry, the browser pathname, and StrictMode', () => {
    const main = readFileSync('src/main.tsx', 'utf8')
    expect(main).toMatch(/<StrictMode>[\s\S]*<Router pathname=\{window\.location\.pathname\} registry=\{presentations\} \/>[\s\S]*<\/StrictMode>/)
    expect(main).toContain("from './presentations'")
    expect(main).toContain("from './router'")
  })
})
