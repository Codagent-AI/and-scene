import { render, screen, waitFor, act } from '@testing-library/react'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import Landing from '../../src/Landing.tsx'
import Router from '../../src/Router.tsx'
import { resolveRoute } from '../../src/route.ts'
import { presentations, type PresentationEntry } from '../../src/presentations/index.ts'

vi.mock('motion/react', async () => (await import('./motion-mock.tsx')).motionMock)

const entry = (slug: string, load?: PresentationEntry['load']): PresentationEntry => ({
  slug,
  title: `Title of ${slug}`,
  load: load ?? (async () => ({ default: () => <p>talk {slug}</p> })),
})

describe('registry', () => {
  it('has unique slugs, one folder per entry, and a lazy loader that resolves to a component', async () => {
    const slugs = presentations.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const p of presentations) {
      const dir = path.join(__dirname, '../../src/presentations', p.slug)
      for (const f of ['entities.ts', 'Talk.tsx', 'steps']) expect(existsSync(path.join(dir, f)), `${p.slug}/${f}`).toBe(true)
      const mod = await p.load()
      expect(typeof mod.default).toBe('function')
    }
  })

  it('registers the reference sample at its slug', () => {
    expect(presentations.map((p) => p.slug)).toContain('how-to-make-a-presentation')
  })

  it('appending an entry keeps every earlier entry resolving to its own loader and route', () => {
    const before = presentations.map((p) => ({ p, slug: p.slug }))
    const next = [...presentations, entry('another')]
    for (const { p, slug } of before) expect(resolveRoute(`/${slug}`, next)).toBe(p)
    expect(resolveRoute('/another', next)?.slug).toBe('another')
  })
})

describe('resolveRoute', () => {
  const entries = [entry('a'), entry('b-c')]
  it('maps pathnames to slugs, tolerating slashes', () => {
    expect(resolveRoute('/a', entries)).toBe(entries[0])
    expect(resolveRoute('/b-c/', entries)).toBe(entries[1])
    expect(resolveRoute('b-c', entries)).toBe(entries[1])
  })
  it('returns null for the root and unknown paths', () => {
    expect(resolveRoute('/', entries)).toBeNull()
    expect(resolveRoute('', entries)).toBeNull()
    expect(resolveRoute('/nope', entries)).toBeNull()
    expect(resolveRoute('/a/extra', entries)).toBeNull()
  })
})

describe('Router and Landing', () => {
  it('lists every registry presentation on the landing page at "/"', () => {
    render(<Router pathname="/" entries={[entry('a'), entry('b')]} />)
    const links = [...document.querySelectorAll('[data-presentation-link]')] as HTMLAnchorElement[]
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/a', '/b'])
    expect(links.map((l) => l.textContent)).toEqual(['Title of a', 'Title of b'])
  })

  it('falls back to the landing page for unknown slugs', () => {
    render(<Router pathname="/missing" entries={[entry('a')]} />)
    expect(document.querySelector('[data-landing]')).not.toBeNull()
  })

  it('lazy-loads the selected entry under Suspense, showing a fallback while pending', async () => {
    let resolve!: (m: { default: () => React.ReactElement }) => void
    const pending = new Promise<{ default: () => React.ReactElement }>((r) => (resolve = r))
    const other = vi.fn(async () => ({ default: () => <p>other</p> }))
    render(<Router pathname="/slow" entries={[entry('other', other), entry('slow', () => pending)]} />)
    expect(document.querySelector('[data-presentation-loading]')).not.toBeNull()
    expect(screen.queryByText('talk slow')).toBeNull()
    await act(async () => resolve({ default: () => <p>talk slow</p> }))
    await waitFor(() => expect(screen.getByText('talk slow')).toBeTruthy())
    expect(other).not.toHaveBeenCalled()
  })

  it('Landing renders an empty list for an empty registry', () => {
    render(<Landing entries={[]} />)
    expect(document.querySelectorAll('li')).toHaveLength(0)
  })
})
