import { describe, expect, it } from 'vitest'
import { PRESENTATIONS } from './presentations'
import { resolveRoute } from './route'

describe('registry and routing', () => {
  it('registers unique slugs that each lazy-load a presentation component', async () => {
    const slugs = PRESENTATIONS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const entry of PRESENTATIONS) {
      expect(typeof (await entry.load()).default).toBe('function')
    }
  })

  it('resolves registered paths and falls back to the landing page', () => {
    const entry = PRESENTATIONS[0]
    expect(resolveRoute(`/${entry.slug}`, PRESENTATIONS)).toBe(entry)
    expect(resolveRoute(`/${entry.slug}/`, PRESENTATIONS)).toBe(entry)
    expect(resolveRoute('/', PRESENTATIONS)).toBeNull()
    expect(resolveRoute('/nope', PRESENTATIONS)).toBeNull()
  })
})
