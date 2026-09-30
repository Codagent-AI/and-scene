import { describe, expect, it } from 'vitest'
import {
  findDiscoveryFailures,
  parseRegisteredSlugs,
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

describe('parseRegisteredSlugs', () => {
  it('extracts every declared slug, in order, across quote styles', () => {
    expect(parseRegisteredSlugs(REGISTRY_WITH_TWO)).toEqual([
      'how-to-make-a-presentation',
      'second-talk',
    ])
  })

  it('returns an empty list for an empty registry', () => {
    expect(parseRegisteredSlugs(EMPTY_REGISTRY)).toEqual([])
  })

  it('ignores commented-out entries', () => {
    expect(parseRegisteredSlugs(`  // slug: 'not-registered',\n`)).toEqual([])
  })
})

describe('readRegistrySource', () => {
  it('reads a real registry module', async () => {
    const source = await readRegistrySource('src/presentations/index.ts')
    expect(parseRegisteredSlugs(source)).toContain('how-to-make-a-presentation')
  })

  it('treats an unreadable registry as empty rather than throwing', async () => {
    expect(await readRegistrySource('src/presentations/does-not-exist.ts')).toBe('')
  })
})

describe('findDiscoveryFailures', () => {
  it('fails loudly when the registry is non-empty but nothing was discovered', () => {
    const failures = findDiscoveryFailures(['a', 'b'], [])
    expect(failures).toHaveLength(2)
    expect(failures[0]).toContain('"a"')
    expect(failures[1]).toContain('"b"')
  })

  it('reports each registered presentation that discovery missed, not just total loss', () => {
    const failures = findDiscoveryFailures(['a', 'b', 'c'], ['b'])
    expect(failures).toHaveLength(2)
    expect(failures.join(' ')).toContain('"a"')
    expect(failures.join(' ')).toContain('"c"')
    expect(failures.join(' ')).not.toContain('"b"')
  })

  it('passes when an empty registry discovers nothing', () => {
    expect(findDiscoveryFailures([], [])).toEqual([])
  })

  it('passes when every registered presentation was discovered', () => {
    expect(findDiscoveryFailures(['a', 'b'], ['a', 'b'])).toEqual([])
  })

  it('ignores extra discovered slugs that are not in the registry', () => {
    expect(findDiscoveryFailures(['a'], ['a', 'stray'])).toEqual([])
  })
})
