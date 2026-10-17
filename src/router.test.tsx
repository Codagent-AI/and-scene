import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Landing } from './Landing.tsx'
import { PRESENTATIONS } from './presentations/index.ts'
import { resolveRoute } from './router.ts'

afterEach(cleanup)

const slug = PRESENTATIONS[0].slug

describe('registry', () => {
  it('is an explicit list of unique slugs with titles and loaders', () => {
    expect(PRESENTATIONS.length).toBeGreaterThan(0)
    expect(new Set(PRESENTATIONS.map((e) => e.slug)).size).toBe(PRESENTATIONS.length)
    for (const entry of PRESENTATIONS) {
      expect(entry.slug).toMatch(/^[a-z0-9-]+$/)
      expect(entry.title).not.toBe('')
      expect(typeof entry.load).toBe('function')
    }
  })

  it('loads every entry to a component', async () => {
    for (const entry of PRESENTATIONS) {
      expect(typeof (await entry.load()).default).toBe('function')
    }
  })
})

describe('resolveRoute', () => {
  it('shows the landing page at the root', () => {
    expect(resolveRoute('/', PRESENTATIONS)).toEqual({ kind: 'landing' })
  })

  it('opens a registered slug, with or without a trailing slash', () => {
    const entry = PRESENTATIONS[0]
    expect(resolveRoute(`/${slug}`, PRESENTATIONS)).toEqual({ kind: 'presentation', entry })
    expect(resolveRoute(`/${slug}/`, PRESENTATIONS)).toEqual({ kind: 'presentation', entry })
  })

  it('shows the landing page for unknown paths', () => {
    expect(resolveRoute('/nope', PRESENTATIONS)).toEqual({ kind: 'landing' })
    expect(resolveRoute(`/${slug}/extra`, PRESENTATIONS)).toEqual({ kind: 'landing' })
  })
})

describe('Landing', () => {
  it('lists every registered presentation with a link to its route', () => {
    render(<Landing registry={PRESENTATIONS} />)
    for (const entry of PRESENTATIONS) {
      expect(screen.getByRole('link', { name: entry.title }).getAttribute('href')).toBe(`/${entry.slug}`)
    }
  })
})
