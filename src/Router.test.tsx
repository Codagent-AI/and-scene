import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Landing } from './Landing'
import { Router } from './Router'
import { PRESENTATIONS } from './presentations'
import type { PresentationEntry } from './presentations'
import { resolveEntry } from './routes'

function deferred() {
  let resolve!: (value: { default: () => React.ReactElement }) => void
  const promise = new Promise<{ default: () => React.ReactElement }>((r) => (resolve = r))
  return { promise, resolve }
}

function entries() {
  const gate = deferred()
  const list: PresentationEntry[] = [
    { slug: 'alpha', title: 'Alpha Talk', load: () => gate.promise },
    { slug: 'beta', title: 'Beta Talk', load: async () => ({ default: () => <p>beta body</p> }) },
  ]
  return { list, gate }
}

describe('resolveEntry', () => {
  it('maps pathnames to registry entries and ignores slashes', () => {
    const { list } = entries()
    expect(resolveEntry('/alpha', list)?.slug).toBe('alpha')
    expect(resolveEntry('/beta/', list)?.slug).toBe('beta')
    expect(resolveEntry('/', list)).toBeUndefined()
    expect(resolveEntry('/nope', list)).toBeUndefined()
    expect(resolveEntry('/alpha/extra', list)).toBeUndefined()
  })
})

describe('Router', () => {
  it('shows the landing listing at the root', () => {
    const { list } = entries()
    render(<Router pathname="/" entries={list} />)
    expect(screen.getByRole('heading', { name: 'and-scene' })).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Alpha Talk' }).getAttribute('href')).toBe('/alpha')
  })

  it('lazy-loads the presentation for a registered slug under Suspense', async () => {
    const { list, gate } = entries()
    await act(async () => void render(<Router pathname="/alpha" entries={list} />))
    expect(screen.queryByRole('link', { name: 'Alpha Talk' })).toBeNull() // pending, no landing
    expect(screen.queryByText('alpha body')).toBeNull()
    await act(async () => gate.resolve({ default: () => <p>alpha body</p> }))
    expect(screen.getByText('alpha body')).not.toBeNull()
    expect(screen.queryByText('beta body')).toBeNull()
  })

  it('falls back to the listing for an unknown path without mounting a presentation', () => {
    const { list } = entries()
    render(<Router pathname="/missing" entries={list} />)
    expect(screen.getByRole('link', { name: 'Beta Talk' })).not.toBeNull()
    expect(document.querySelector('[data-presentation-root]')).toBeNull()
  })

  it('defaults to the window location and the real registry', () => {
    render(<Router />)
    expect(screen.getAllByRole('link')).toHaveLength(PRESENTATIONS.length)
  })
})

describe('Landing', () => {
  it('lists every registered presentation with its route', () => {
    render(<Landing />)
    const links = screen.getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(PRESENTATIONS.map((p) => `/${p.slug}`))
    expect(links.map((a) => a.textContent)).toEqual(PRESENTATIONS.map((p) => p.title))
  })
})
