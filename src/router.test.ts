import { describe, expect, it } from 'vitest'
import { presentations } from './presentations/index.ts'
import { resolveRoute } from './router.ts'
import type { PresentationEntry } from './presentations/types.ts'

const registry: PresentationEntry[] = [
  { slug: 'one', title: 'One', load: async () => ({ default: () => null }) },
  { slug: 'two', title: 'Two', load: async () => ({ default: () => null }) },
]

describe('resolveRoute', () => {
  it('maps "/" to the landing page', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('', registry)).toEqual({ kind: 'landing' })
  })

  it('maps "/<slug>" (with or without a trailing slash) to its registry entry', () => {
    expect(resolveRoute('/two', registry)).toEqual({ kind: 'presentation', entry: registry[1] })
    expect(resolveRoute('/one/', registry)).toEqual({ kind: 'presentation', entry: registry[0] })
  })

  it('reports malformed percent-encoding as not found instead of throwing', () => {
    expect(resolveRoute('/%FF', registry)).toEqual({ kind: 'not-found', path: '/%FF' })
    expect(resolveRoute('/%E0%A4%A', registry).kind).toBe('not-found')
  })

  it('reports unknown paths as not found', () => {
    expect(resolveRoute('/nope', registry)).toEqual({ kind: 'not-found', path: '/nope' })
    expect(resolveRoute('/one/extra', registry).kind).toBe('not-found')
  })
})

describe('presentation registry', () => {
  it('has unique slugs and a loader for every entry', () => {
    const slugs = presentations.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const p of presentations) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title.length).toBeGreaterThan(0)
      expect(typeof p.load).toBe('function')
    }
  })
})
