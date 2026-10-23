// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Router } from '../../src/Router'
import { PRESENTATIONS } from '../../src/presentations'
import type { PresentationEntry } from '../../src/presentations/types'

afterEach(() => cleanup())

const entries: PresentationEntry[] = [
  { slug: 'alpha', title: 'Alpha Talk', load: async () => ({ default: () => <p>alpha view</p> }) },
  {
    slug: 'beta',
    title: 'Beta Talk',
    load: () =>
      new Promise((resolve) => {
        setTimeout(() => resolve({ default: () => <p>beta view</p> }), 30)
      }),
  },
]

describe('routing and registry', () => {
  it('shows the landing page at the root with a link and title for every registry entry', () => {
    render(<Router entries={entries} pathname="/" />)
    const list = screen.getByRole('list')
    const links = within(list).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/alpha', '/beta'])
    expect(links.map((link) => link.textContent)).toEqual(['Alpha Talk', 'Beta Talk'])
  })

  it('falls back to the landing page for unknown paths', () => {
    render(<Router entries={entries} pathname="/not-a-presentation" />)
    expect(screen.getByRole('heading', { name: 'and-scene' })).toBeTruthy()
  })

  it('shows a loading fallback while a delayed presentation loads, then its own component', async () => {
    render(<Router entries={entries} pathname="/beta" />)
    expect(document.querySelector('[data-presentation-loading]')).not.toBeNull()
    expect(await screen.findByText('beta view')).toBeTruthy()
    expect(screen.queryByText('alpha view')).toBeNull()
  })

  it('resolves each slug to its own module when several presentations coexist', async () => {
    const { unmount } = render(<Router entries={entries} pathname="/alpha" />)
    expect(await screen.findByText('alpha view')).toBeTruthy()
    unmount()
    render(<Router entries={entries} pathname="/beta" />)
    expect(await screen.findByText('beta view')).toBeTruthy()
  })

  it('registers the reference sample at its own slug with a lazy loader', async () => {
    const sample = PRESENTATIONS.find((entry) => entry.slug === 'how-to-make-a-presentation')
    expect(sample?.title).toBe('How to Use This Skill to Make a Presentation')
    const module = await sample!.load()
    expect(typeof module.default).toBe('function')
  })
})
