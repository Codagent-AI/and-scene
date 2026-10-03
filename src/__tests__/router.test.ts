import { describe, expect, it } from 'vitest'
import { resolveRoute } from '../router'
import type { PresentationRegistryEntry } from '../presentations'

const registry: PresentationRegistryEntry[] = [
  { slug: 'demo', title: 'Demo', load: async () => ({ default: () => null }) },
]

describe('resolveRoute', () => {
  it('resolves the landing page at the root path', () => {
    expect(resolveRoute('/', registry)).toEqual({ type: 'landing' })
  })

  it('resolves a registered presentation by slug', () => {
    expect(resolveRoute('/demo', registry)).toEqual({ type: 'presentation', entry: registry[0] })
  })

  it('falls back to not-found for an unregistered slug', () => {
    expect(resolveRoute('/missing', registry)).toEqual({ type: 'not-found', pathname: '/missing' })
  })

  it('normalizes a trailing slash', () => {
    expect(resolveRoute('/demo/', registry)).toEqual({ type: 'presentation', entry: registry[0] })
  })
})
