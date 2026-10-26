import { describe, expect, it } from 'vitest'
import { resolveRoute } from './router'

const registry = [
  { slug: 'how-to-make-a-presentation', title: 'How To', load: async () => ({ default: () => null }) },
]

describe('resolveRoute', () => {
  it('resolves "/" to the landing route', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
  })

  it('resolves a registered slug to that presentation entry', () => {
    expect(resolveRoute('/how-to-make-a-presentation', registry)).toEqual({
      kind: 'presentation',
      entry: registry[0],
    })
  })

  it('resolves an unregistered slug to the landing route', () => {
    expect(resolveRoute('/nope', registry)).toEqual({ kind: 'landing' })
  })

  it('tolerates a trailing slash on a registered slug', () => {
    expect(resolveRoute('/how-to-make-a-presentation/', registry)).toEqual({
      kind: 'presentation',
      entry: registry[0],
    })
  })
})
