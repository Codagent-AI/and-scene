import { describe, expect, it } from 'vitest'
import { resolveRoute } from './router'

describe('resolveRoute', () => {
  const slugs = new Set(['demo-talk'])

  it('routes "/" to landing', () => {
    expect(resolveRoute('/', slugs)).toEqual({ kind: 'landing' })
  })

  it('routes unknown paths to landing', () => {
    expect(resolveRoute('/missing', slugs)).toEqual({ kind: 'landing' })
  })

  it('routes registered slugs to a lazy presentation', () => {
    expect(resolveRoute('/demo-talk', slugs)).toEqual({
      kind: 'presentation',
      slug: 'demo-talk',
    })
  })
})
