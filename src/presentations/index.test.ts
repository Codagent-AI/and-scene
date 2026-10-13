import { describe, expect, it } from 'vitest'
import { presentationForPath, type PresentationEntry } from './index'

const fixture: PresentationEntry[] = [
  { slug: 'demo', title: 'Demo', load: async () => ({ default: () => null }) },
]

describe('presentation registry resolution', () => {
  it('matches one pathname slug and rejects root, nested, and unknown routes', () => {
    expect(presentationForPath('/demo', fixture)?.title).toBe('Demo')
    expect(presentationForPath('/', fixture)).toBeUndefined()
    expect(presentationForPath('/demo/extra', fixture)).toBeUndefined()
    expect(presentationForPath('/missing', fixture)).toBeUndefined()
  })
})
