import { describe, expect, it } from 'vitest'
import { resolvePresentation } from '../routing'
import type { PresentationEntry } from '../../presentations'

const entry: PresentationEntry = { slug: 'sample', title: 'Sample', load: async () => ({ default: () => null }) }

describe('presentation route resolver', () => {
  it('resolves the root and registered routes without a router dependency', () => {
    expect(resolvePresentation('/', [entry])).toBeUndefined()
    expect(resolvePresentation('/sample/', [entry])).toBe(entry)
    expect(resolvePresentation('/missing', [entry])).toBeUndefined()
  })
})
