import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Router } from './Router'
import { presentations } from './presentations'
import type { PresentationEntry } from './presentations'
import { resolveRoute } from './route'

const registry: PresentationEntry[] = [
  { slug: 'demo', title: 'Demo', load: async () => ({ default: () => <p>demo talk</p> }) },
]

afterEach(cleanup)

describe('routing', () => {
  it('resolves slugs and falls back for unknown paths', () => {
    expect(resolveRoute('/', registry)).toBeNull()
    expect(resolveRoute('/demo', registry)?.slug).toBe('demo')
    expect(resolveRoute('/demo/', registry)?.slug).toBe('demo')
    expect(resolveRoute('/nope', registry)).toBeNull()
  })

  it('renders Landing at / with links', () => {
    render(<Router pathname="/" registry={registry} />)
    expect(screen.getByRole('link', { name: 'Demo' }).getAttribute('href')).toBe('/demo')
  })

  it('lazy-loads a registered presentation', async () => {
    render(<Router pathname="/demo" registry={registry} />)
    expect(await screen.findByText('demo talk')).toBeTruthy()
  })

  it('shows Landing for unknown slugs', () => {
    render(<Router pathname="/missing" registry={registry} />)
    expect(screen.getByRole('heading', { name: 'And Scene' })).toBeTruthy()
  })
})

describe('registry shape', () => {
  it('has slug, title and load on each entry', () => {
    for (const p of presentations) {
      expect(typeof p.slug).toBe('string')
      expect(typeof p.title).toBe('string')
      expect(typeof p.load).toBe('function')
    }
  })
})
