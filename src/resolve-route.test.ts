import { describe, expect, it } from 'vitest'
import { resolvePresentationRoute } from './resolve-route'
import type { PresentationRegistration } from './presentations'

const entry: PresentationRegistration = { slug: 'how-to%20scene', title: 'A scene', load: async () => ({ default: () => null }) }

describe('presentation route resolution', () => {
  it('leaves the root and unknown paths for the landing route', () => {
    expect(resolvePresentationRoute('/', [entry])).toBeUndefined()
    expect(resolvePresentationRoute('/missing', [entry])).toBeUndefined()
  })

  it('matches a registered pathname after decoding its slug', () => {
    expect(resolvePresentationRoute('/how-to%2520scene/', [entry])).toBe(entry)
  })
})
