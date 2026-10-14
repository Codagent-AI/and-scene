import { describe, expect, it } from 'vitest'
import { resolveRoute } from '../../../src/router'
import type { PresentationEntry } from '../../../src/presentations/types'

const entries: PresentationEntry[] = [
  { slug: 'alpha', title: 'Alpha', load: () => Promise.resolve({ default: () => null }) },
]

describe('resolveRoute', () => {
  it('maps the root path to the landing page', () => {
    expect(resolveRoute('/', entries)).toEqual({ kind: 'landing' })
  })

  it('maps a registered slug to its presentation entry', () => {
    const route = resolveRoute('/alpha', entries)
    expect(route).toEqual({ kind: 'presentation', entry: entries[0] })
  })

  it('tolerates a trailing slash on a slug', () => {
    expect(resolveRoute('/alpha/', entries)).toEqual({ kind: 'presentation', entry: entries[0] })
  })

  it('reports unknown paths as not-found', () => {
    expect(resolveRoute('/missing', entries)).toEqual({ kind: 'not-found', pathname: '/missing' })
  })
})
