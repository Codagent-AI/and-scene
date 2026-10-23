// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { resolveRoute } from '../../src/route'
import { presentations } from '../../src/presentations'

describe('routing and registry', () => {
  it('"/" and unknown paths render the landing page, which links every registered presentation', () => {
    for (const path of ['/', '/no-such-deck']) {
      const { container, unmount } = render(resolveRoute(path))
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('And Scene')
      for (const entry of presentations) {
        expect(container.querySelector(`a[href="/${entry.slug}"]`)?.textContent).toBe(entry.title)
      }
      unmount()
    }
  })

  it('a registered slug lazy-loads its presentation through Suspense', async () => {
    render(resolveRoute('/how-to-make-a-presentation'))
    expect(await screen.findByText('How to Use This Skill to Make a Presentation', { selector: '[data-presentation-deck-title]' })).toBeTruthy()
  })

  it('every registry entry loads its folder entry module, which default-exports a component', async () => {
    for (const entry of presentations) {
      const module = await entry.load()
      expect(typeof module.default, entry.slug).toBe('function')
    }
  })

  it('registry slugs are unique and every entry has a non-empty title and a loader', () => {
    const slugs = presentations.map((entry) => entry.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const entry of presentations) {
      expect(entry.title.length).toBeGreaterThan(0)
      expect(typeof entry.load).toBe('function')
    }
  })
})
