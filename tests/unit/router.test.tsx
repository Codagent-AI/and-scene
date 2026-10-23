import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Landing from '../../src/Landing'
import { presentations } from '../../src/presentations'
import type { PresentationEntry } from '../../src/presentations'
import { resolveRoute } from '../../src/router'

const entries: PresentationEntry[] = [
  { slug: 'a', title: 'Alpha', load: async () => ({ default: () => null }) },
  { slug: 'b-c', title: 'Beta', load: async () => ({ default: () => null }) },
]

describe('routing and registry', () => {
  it('routes "/" to the landing page and "/<slug>" to its presentation', () => {
    expect(resolveRoute('/', entries)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/b-c', entries)).toEqual({ kind: 'presentation', entry: entries[1] })
    expect(resolveRoute('/a/', entries)).toEqual({ kind: 'presentation', entry: entries[0] })
  })

  it('falls back to the landing page for an unknown route', () => {
    expect(resolveRoute('/nope', entries)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/a/unknown', entries)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/a/b-c', entries)).toEqual({ kind: 'landing' })
  })

  it('lists every registered presentation on the landing page', () => {
    render(<Landing entries={entries} />)
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/a', '/b-c'])
  })

  it('has a well-formed registry with unique slugs that includes the sample', () => {
    const slugs = presentations.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const p of presentations) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title).not.toBe('')
      expect(typeof p.load).toBe('function')
    }
    expect(slugs).toContain('how-to-make-a-presentation')
  })
})
