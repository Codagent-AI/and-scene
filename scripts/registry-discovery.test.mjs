import { describe, expect, it } from 'vitest'
import {
  countRegisteredSlugs,
  findDiscoveryFailures,
  readRegistrySource,
} from './registry-discovery.mjs'

const REGISTRY_WITH_TWO = `import type { PresentationRegistryEntry } from '../router'

export const presentations: PresentationRegistryEntry[] = [
  {
    slug: 'how-to-make-a-presentation',
    title: 'How to Use This Skill to Make a Presentation',
    load: () => import('./how-to-make-a-presentation/Talk'),
  },
  {
    slug: "second-talk",
    title: 'Second',
    load: () => import('./second-talk/Talk'),
  },
]
`

const EMPTY_REGISTRY = `import type { PresentationRegistryEntry } from '../router'

export const presentations: PresentationRegistryEntry[] = []
`

describe('countRegisteredSlugs', () => {
  it('counts every declared slug entry', () => {
    expect(countRegisteredSlugs(REGISTRY_WITH_TWO)).toBe(2)
  })

  it('returns 0 for an empty registry', () => {
    expect(countRegisteredSlugs(EMPTY_REGISTRY)).toBe(0)
  })

  it('ignores commented-out entries', () => {
    expect(countRegisteredSlugs(`  // slug: 'not-registered',\n`)).toBe(0)
  })
})

describe('readRegistrySource', () => {
  it('reads a real registry module', async () => {
    const source = await readRegistrySource('src/presentations/index.ts')
    expect(countRegisteredSlugs(source)).toBeGreaterThan(0)
  })

  it('treats an unreadable registry as empty rather than throwing', async () => {
    expect(await readRegistrySource('src/presentations/does-not-exist.ts')).toBe('')
  })
})

describe('findDiscoveryFailures', () => {
  it('fails loudly when the registry is non-empty but nothing was discovered', () => {
    const failures = findDiscoveryFailures(2, [])
    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('declares 2 presentation(s)')
  })

  it('passes when an empty registry discovers nothing', () => {
    expect(findDiscoveryFailures(0, [])).toEqual([])
  })

  it('passes when every registered presentation was discovered', () => {
    expect(findDiscoveryFailures(2, ['a', 'b'])).toEqual([])
  })
})
