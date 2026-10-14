import { describe, expect, it } from 'vitest'
import { presentations } from './presentations'
import { resolveRoute } from './route'

describe('resolveRoute', () => {
  it('shows the landing page at the root', () => {
    expect(resolveRoute('/', presentations)).toBeNull()
  })

  it('resolves every registered slug', () => {
    for (const p of presentations) expect(resolveRoute(`/${p.slug}/`, presentations)).toBe(p)
  })

  it('returns null for unknown paths', () => {
    expect(resolveRoute('/nope', presentations)).toBeNull()
  })
})
