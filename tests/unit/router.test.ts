import { describe, expect, it } from 'vitest'
import { presentations } from '../../src/presentations'
import { resolveRoute, type RegistryEntry } from '../../src/router'

const load = async () => ({ default: () => null })
const registry: RegistryEntry[] = [
  { slug: 'one', title: 'One', load },
  { slug: 'two', title: 'Two', load },
]

describe('resolveRoute', () => {
  it('shows the landing page at the root', () => {
    expect(resolveRoute('/', registry)).toEqual({ kind: 'landing' })
  })

  it('routes /<slug> to the matching entry, ignoring trailing slashes', () => {
    expect(resolveRoute('/two', registry)).toMatchObject({ kind: 'presentation', entry: { slug: 'two' } })
    expect(resolveRoute('/one/', registry)).toMatchObject({ kind: 'presentation', entry: { slug: 'one' } })
  })

  it('falls back to the landing page for unknown routes', () => {
    expect(resolveRoute('/nope', registry)).toEqual({ kind: 'landing' })
    expect(resolveRoute('/one/extra', registry)).toEqual({ kind: 'landing' })
  })

  it('keeps every registered presentation reachable', () => {
    for (const entry of registry) {
      expect(resolveRoute(`/${entry.slug}`, registry)).toMatchObject({ entry })
    }
  })
})

describe('presentation registry', () => {
  it('has unique slugs and registers the reference sample', () => {
    const slugs = presentations.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(presentations.find((p) => p.slug === 'how-to-make-a-presentation')?.title).toBe(
      'How to Use This Skill to Make a Presentation',
    )
  })

  it('loads each entry to a default-exported component', async () => {
    for (const entry of presentations) {
      expect(typeof (await entry.load()).default).toBe('function')
    }
  })
})
