// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AppRouter from './AppRouter.tsx'
import { PRESENTATIONS, type PresentationEntry } from './presentations/index.ts'
import { resolveRoute } from './router.ts'

function deferred() {
  let resolve!: (value: { default: () => React.ReactElement }) => void
  const promise = new Promise<{ default: () => React.ReactElement }>((r) => (resolve = r))
  return { promise, resolve }
}

const entries = (loads: Record<string, () => Promise<{ default: () => React.ReactElement }>>): PresentationEntry[] =>
  Object.entries(loads).map(([slug, load]) => ({ slug, title: `Title of ${slug}`, load }))

describe('resolveRoute', () => {
  const list = entries({ one: async () => ({ default: () => <p>1</p> }), two: async () => ({ default: () => <p>2</p> }) })

  it('maps /<slug> to its entry, ignoring slashes', () => {
    expect(resolveRoute('/two', list)?.slug).toBe('two')
    expect(resolveRoute('/one/', list)?.slug).toBe('one')
  })

  it('maps the root and unknown paths to no entry (Landing)', () => {
    expect(resolveRoute('/', list)).toBeNull()
    expect(resolveRoute('/nope', list)).toBeNull()
    expect(resolveRoute('/one/extra', list)).toBeNull()
  })
})

describe('AppRouter', () => {
  const list = entries({ one: async () => ({ default: () => <p>talk one</p> }), two: async () => ({ default: () => <p>talk two</p> }) })

  it.each(['/', '/unknown'])('renders Landing linking every entry at %s', (path) => {
    render(<AppRouter pathname={path} entries={list} />)
    const links = [...document.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.textContent])
    expect(links).toEqual([['/one', 'Title of one'], ['/two', 'Title of two']])
  })

  it('shows the Suspense fallback while the loader is pending, then the presentation', async () => {
    const gate = deferred()
    render(<AppRouter pathname="/slow" entries={entries({ slow: () => gate.promise })} />)
    expect(document.querySelector('[data-route-loading]')).not.toBeNull()
    gate.resolve({ default: () => <p>loaded talk</p> })
    expect(await screen.findByText('loaded talk')).not.toBeNull()
    expect(document.querySelector('[data-route-loading]')).toBeNull()
  })

  it.each([['/one', 'talk one'], ['/two', 'talk two']])('resolves %s to its own component', async (path, text) => {
    render(<AppRouter pathname={path} entries={list} />)
    expect(await screen.findByText(text)).not.toBeNull()
  })

  it('uses the real registry by default and has no landing links to unregistered pages', () => {
    render(<AppRouter pathname="/" />)
    expect([...document.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(PRESENTATIONS.map((p) => `/${p.slug}`))
  })
})
