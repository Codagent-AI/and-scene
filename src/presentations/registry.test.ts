import { describe, expect, it } from 'vitest'
import { PRESENTATIONS } from './index'

describe('presentation registry', () => {
  it('has unique kebab-case slugs and non-empty titles', () => {
    const slugs = PRESENTATIONS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const entry of PRESENTATIONS) {
      expect(entry.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(entry.title.trim()).not.toBe('')
    }
  })

  it('loads a default-exported component for every entry', async () => {
    for (const entry of PRESENTATIONS) {
      const loaded = await entry.load()
      expect(typeof loaded.default, entry.slug).toBe('function')
    }
  })
})
