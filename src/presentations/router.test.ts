import { describe, expect, test } from 'vitest'
import { resolvePresentationRoute } from '../router'

describe('resolvePresentationRoute', () => {
  test('resolves the landing page and explicit registered presentation routes', () => {
    const entries = [{ slug: 'demo', title: 'Demo', load: async () => ({ default: () => null }) }]

    expect(resolvePresentationRoute('/', entries)).toEqual({ kind: 'landing' })
    expect(resolvePresentationRoute('/demo/', entries)).toMatchObject({ kind: 'presentation', entry: entries[0] })
  })

  test('falls back to the landing page for an unregistered pathname', () => {
    expect(resolvePresentationRoute('/missing', [])).toEqual({ kind: 'landing' })
  })
})
