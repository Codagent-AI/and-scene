import { describe, expect, it } from 'vitest'
import { PRESENTATIONS } from '..'

describe('presentation registry', () => {
  it('has unique non-empty slugs and titles', () => {
    expect(PRESENTATIONS.length).toBeGreaterThan(0)
    const slugs = PRESENTATIONS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const p of PRESENTATIONS) {
      expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.title.trim()).not.toBe('')
      expect(typeof p.load).toBe('function')
    }
  })

  it('loads a component for every entry', async () => {
    for (const p of PRESENTATIONS) {
      const module = await p.load()
      expect(typeof module.default).toBe('function')
    }
  })
})
