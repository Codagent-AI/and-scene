import { expect, test } from 'vitest'
import { resolvePresentation } from './index'

test('resolves only registered single-segment presentation routes', () => {
  const registry = [{
    slug: 'example',
    title: 'Example',
    load: async () => ({ default: () => null }),
  }]

  expect(resolvePresentation('/example/', registry)?.title).toBe('Example')
  expect(resolvePresentation('/missing', registry)).toBeUndefined()
  expect(resolvePresentation('/', registry)).toBeUndefined()
})
