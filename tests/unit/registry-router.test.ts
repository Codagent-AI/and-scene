import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { presentations } from '../../src/presentations'
import { resolveRoute } from '../../src/router'
import { parseRegistry, readRegistry } from '../../scripts/lib/runtime.mjs'

describe('registry and router', () => {
  it('registers the reference sample with unique slugs and loadable presentations (I-42)', async () => {
    const slugs = presentations.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs).toContain('how-to-make-a-presentation')
    for (const p of presentations) {
      const mod = await p.load()
      expect(mod.default).toBeTypeOf('function')
    }
  }, 30_000)

  it('routes "/" and unknown paths to the landing page, slugs to presentations (I-70)', () => {
    expect(resolveRoute('/', presentations).kind).toBe('landing')
    expect(resolveRoute('', presentations).kind).toBe('landing')
    expect(resolveRoute('/does-not-exist', presentations).kind).toBe('landing')
    const route = resolveRoute('/how-to-make-a-presentation', presentations)
    expect(route.kind === 'presentation' && route.entry.slug).toBe('how-to-make-a-presentation')
    expect(resolveRoute('/how-to-make-a-presentation/', presentations).kind).toBe('presentation')
  })

  it('keeps several presentations reachable side by side (I-44)', () => {
    const extra = [...presentations, { slug: 'second', title: 'Second', load: presentations[0].load }]
    expect(resolveRoute('/second', extra).kind).toBe('presentation')
    expect(resolveRoute('/how-to-make-a-presentation', extra).kind).toBe('presentation')
  })

  it('the build-time registry parser reads the same slugs as the real registry (I-57)', () => {
    const parsed = readRegistry('.')
    expect(parsed.map((e: { slug: string }) => e.slug)).toEqual(presentations.map((p) => p.slug))
    expect(parsed[0].dir).toBe('how-to-make-a-presentation')
    expect(parseRegistry(readFileSync('src/presentations/index.ts', 'utf8'))).toEqual(parsed)
    expect(parseRegistry('export const presentations = []')).toEqual([])
  })
})
