import { describe, expect, it } from 'vitest'
import { resolveRoute } from './router'
import type { PresentationRegistryEntry } from './presentations'

const entries: PresentationRegistryEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Make a Presentation', load: () => Promise.reject() },
]

describe('resolveRoute', () => {
  it('resolves "/" to the landing route', () => {
    expect(resolveRoute('/', entries)).toEqual({ type: 'landing' })
  })

  it('resolves a registered slug to its presentation entry', () => {
    expect(resolveRoute('/how-to-make-a-presentation', entries)).toEqual({
      type: 'presentation',
      entry: entries[0],
    })
  })

  it('resolves an unregistered slug to not-found', () => {
    expect(resolveRoute('/does-not-exist', entries)).toEqual({ type: 'not-found', pathname: '/does-not-exist' })
  })

  it('tolerates a trailing slash on a registered slug', () => {
    expect(resolveRoute('/how-to-make-a-presentation/', entries)).toEqual({
      type: 'presentation',
      entry: entries[0],
    })
  })
})
