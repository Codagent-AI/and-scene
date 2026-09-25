import { describe, expect, it } from 'vitest'
import { resolvePresentation } from './registry'
import type { PresentationEntry } from './index'

describe('presentation routing', () => {
  it('resolves registered pathnames and sends root or unknown paths to the landing page', () => {
    const load = async () => ({ default: () => null })
    const entries: PresentationEntry[] = [{ slug: 'sample', title: 'Sample', load }]
    expect(resolvePresentation('/', entries)).toBeUndefined()
    expect(resolvePresentation('/missing', entries)).toBeUndefined()
    expect(resolvePresentation('/sample', entries)).toBe(entries[0])
    expect(resolvePresentation('/sample/nested', entries)).toBe(entries[0])
  })
})
