import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Landing } from '../../src/Landing'
import { presentations, type PresentationEntry } from '../../src/presentations'
import { Router } from '../../src/router'
import { resolveEntry, slugFromPathname } from '../../src/routing'

const entry = (slug: string, text: string): PresentationEntry => ({
  slug,
  title: `Title ${slug}`,
  load: async () => ({ default: () => <p data-testid="talk">{text}</p> }),
})

const registry = [entry('alpha', 'ALPHA'), entry('beta', 'BETA'), entry('gamma', 'GAMMA')]

describe('pathname resolution', () => {
  it.each([
    ['/', null],
    ['', null],
    ['/alpha', 'alpha'],
    ['/alpha/', 'alpha'],
    ['/a/b', null],
    ['/%', null],
    ['/%E0%A4%A', null],
    ['/%zz/', null],
    ['/caf%C3%A9', 'café'],
  ])('%j -> %j', (path, slug) => expect(slugFromPathname(path)).toBe(slug))

  it('finds registered entries only', () => {
    expect(resolveEntry('/beta', registry)?.slug).toBe('beta')
    expect(resolveEntry('/missing', registry)).toBeNull()
    expect(resolveEntry('/', registry)).toBeNull()
  })
})

describe('Router', () => {
  it('shows Landing for / and for unknown paths, including malformed escapes', () => {
    for (const path of ['/', '/nope', '/%', '/%E0%A4%A']) {
      const { unmount } = render(<Router pathname={path} registry={registry} />)
      expect(screen.getAllByRole('link')).toHaveLength(3)
      unmount()
    }
  })

  it('lazy-loads each registered presentation inside Suspense, each to its own component', async () => {
    for (const [slug, text] of [['alpha', 'ALPHA'], ['beta', 'BETA'], ['gamma', 'GAMMA']]) {
      const { unmount } = render(<Router pathname={`/${slug}`} registry={registry} />)
      expect(screen.queryByTestId('talk')).toBeNull() // still suspended
      expect((await screen.findByTestId('talk')).textContent).toBe(text)
      unmount()
    }
  })

  it('keeps every original entry resolving to its own component after another is appended', async () => {
    const extended = [...registry, entry('delta', 'DELTA')]
    for (const [slug, text] of [['alpha', 'ALPHA'], ['beta', 'BETA'], ['gamma', 'GAMMA'], ['delta', 'DELTA']]) {
      const { unmount } = render(<Router pathname={`/${slug}`} registry={extended} />)
      expect((await screen.findByTestId('talk')).textContent).toBe(text)
      unmount()
    }
  })
})

describe('Landing and registry', () => {
  it('lists every registry entry with a link to its slug', () => {
    render(<Landing registry={registry} />)
    for (const e of registry) expect(screen.getByRole('link', { name: e.title }).getAttribute('href')).toBe(`/${e.slug}`)
  })

  it('the real registry is an explicit list with unique slugs and working loaders', async () => {
    expect(presentations.length).toBeGreaterThan(0)
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    for (const p of presentations) {
      expect(p.title).not.toBe('')
      expect((await p.load()).default).toBeTypeOf('function')
    }
  })
})
