import { describe, expect, it } from 'vitest'
import { resolveRoute } from '../../src/routing'
import { presentations } from '../../src/presentations'

describe('routing and registry', () => {
  it('registers the sample with a unique slug and a loader', () => {
    const slugs = presentations.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs).toContain('how-to-make-a-presentation')
    expect(presentations.every((p) => typeof p.load === 'function')).toBe(true)
  })
  it('routes "/" to the landing page', () => {
    expect(resolveRoute('/', presentations).kind).toBe('landing')
  })
  it('routes a registered slug to its presentation, tolerating a trailing slash', () => {
    const route = resolveRoute('/how-to-make-a-presentation/', presentations)
    expect(route.kind === 'presentation' && route.entry.slug).toBe('how-to-make-a-presentation')
  })
  it('falls back to landing for an unknown slug', () => {
    expect(resolveRoute('/nope', presentations).kind).toBe('landing')
  })
  it('keeps other registered presentations reachable', () => {
    const extra = { slug: 'second', title: 'Second', load: () => Promise.resolve({ default: () => null }) }
    const registry = [...presentations, extra]
    expect(resolveRoute('/second', registry).kind).toBe('presentation')
    expect(resolveRoute('/how-to-make-a-presentation', registry).kind).toBe('presentation')
  })
})
