import { describe, expect, it } from 'vitest'
import { presentations, validateRegistry, type PresentationEntry } from '.'
import { resolveRoute } from '../router'

const e = (slug: string, title = 'T'): PresentationEntry => ({ slug, title, load: async () => ({ default: () => null }) })

describe('registry validation', () => {
  it('accepts the real registry', () => {
    expect(() => validateRegistry(presentations)).not.toThrow()
  })
  it('rejects duplicate slugs, empty titles, bad slugs', () => {
    expect(() => validateRegistry([e('a'), e('a')])).toThrow(/Duplicate/)
    expect(() => validateRegistry([e('a', '  ')])).toThrow(/empty title/)
    expect(() => validateRegistry([e('Bad Slug')])).toThrow(/Invalid/)
  })
})

describe('router', () => {
  const reg = [e('talk')]
  it('resolves root to landing', () => {
    expect(resolveRoute('/', reg)).toEqual({ kind: 'landing' })
  })
  it('resolves a known slug', () => {
    expect(resolveRoute('/talk', reg)).toEqual({ kind: 'presentation', entry: reg[0] })
    expect(resolveRoute('/talk/', reg).kind).toBe('presentation')
  })
  it('falls back to landing for unknown paths', () => {
    expect(resolveRoute('/nope', reg)).toEqual({ kind: 'landing' })
  })
})
