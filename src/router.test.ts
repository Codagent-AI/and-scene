import { describe, expect, it } from 'vitest'
import { resolveRoute } from './router'
import type { PresentationRegistryEntry } from './presentations'

const registry: PresentationRegistryEntry[] = [
  { slug: 'how-to-make-a-presentation', title: 'How to Make a Presentation', load: async () => ({ default: () => null }) },
]

describe('resolveRoute', () => {
  it('resolves "/" to the landing page', () => {
    expect(resolveRoute('/', registry)).toEqual({ type: 'landing' })
  })

  it('resolves a registered slug to its presentation route', () => {
    expect(resolveRoute('/how-to-make-a-presentation', registry)).toEqual({
      type: 'presentation',
      slug: 'how-to-make-a-presentation',
    })
  })

  it('resolves an unregistered slug to not-found', () => {
    expect(resolveRoute('/does-not-exist', registry)).toEqual({ type: 'not-found' })
  })

  it('tolerates a trailing slash', () => {
    expect(resolveRoute('/how-to-make-a-presentation/', registry)).toEqual({
      type: 'presentation',
      slug: 'how-to-make-a-presentation',
    })
  })
})
