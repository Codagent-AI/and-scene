import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Landing } from './Landing'
import type { PresentationEntry } from './presentations/types'
import { resolveRoute } from './router'

const loads = vi.hoisted(() => ({ alpha: vi.fn(), beta: vi.fn() }))

vi.mock('./presentations', async () => {
  const React = await import('react')
  const entry = (slug: string, title: string, fn: () => void): PresentationEntry => ({
    slug,
    title,
    load: async () => {
      fn()
      return { default: () => React.createElement('p', null, `loaded ${slug}`) }
    },
  })
  return { presentations: [entry('alpha', 'Alpha talk', loads.alpha), entry('beta', 'Beta talk', loads.beta)] }
})

import { presentations } from './presentations'
import { Router } from './Router'

describe('resolveRoute', () => {
  it('maps / and unknown paths to the landing page', () => {
    for (const p of ['/', '', '/nope', '/alpha/extra', '/Alpha']) expect(resolveRoute(p, presentations).kind, p).toBe('landing')
  })

  it('maps every registered slug to its entry, ignoring slashes', () => {
    for (const e of presentations) {
      for (const p of [`/${e.slug}`, `/${e.slug}/`, e.slug]) {
        const r = resolveRoute(p, presentations)
        expect(r.kind === 'presentation' && r.entry.slug).toBe(e.slug)
      }
    }
  })
})

describe('Router', () => {
  it('shows the landing page at / with every presentation linked', () => {
    render(<Router pathname="/" />)
    expect(screen.getByRole('link', { name: 'Alpha talk' }).getAttribute('href')).toBe('/alpha')
    expect(screen.getByRole('link', { name: 'Beta talk' }).getAttribute('href')).toBe('/beta')
  })

  it('shows the landing page for unknown paths', () => {
    render(<Router pathname="/missing" />)
    expect(screen.getByRole('heading', { name: 'and-scene' })).toBeDefined()
  })

  it('lazy-loads only the selected presentation under Suspense', async () => {
    render(<Router pathname="/beta" />)
    expect(await screen.findByText('loaded beta')).toBeDefined()
    expect(loads.beta).toHaveBeenCalledTimes(1)
    expect(loads.alpha).not.toHaveBeenCalled()
  })
})

describe('Landing', () => {
  it('lists each entry title linked to its slug', () => {
    const entries = [
      { slug: 'one', title: 'First', load: async () => ({ default: () => null }) },
      { slug: 'two', title: 'Second', load: async () => ({ default: () => null }) },
    ]
    render(<Landing presentations={entries} />)
    expect(screen.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['First', '/one'],
      ['Second', '/two'],
    ])
  })
})
