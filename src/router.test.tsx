// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { resolveRoute } from './route-utils'
import type { PresentationEntry } from './presentations'

const sample: PresentationEntry = { slug: 'a-story', title: 'A Story', load: async () => ({ default: () => null }) }

describe('pathname router', () => {
  it('resolves the landing route and a registered presentation route', () => {
    expect(resolveRoute('/', [sample])).toEqual({ kind: 'landing' })
    expect(resolveRoute('/a-story', [sample])).toEqual({ kind: 'presentation', entry: sample })
  })

  it('respects a deployment base path and reports unknown slugs', () => {
    expect(resolveRoute('/demo/', [sample], '/demo/')).toEqual({ kind: 'landing' })
    expect(resolveRoute('/demo/a-story', [sample], '/demo/')).toEqual({ kind: 'presentation', entry: sample })
    expect(resolveRoute('/demo/missing', [sample], '/demo/')).toEqual({ kind: 'not-found', slug: 'missing' })
    expect(resolveRoute('/wrong/a-story', [sample], '/demo/').kind).toBe('not-found')
  })
})
