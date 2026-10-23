import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { HOST, previewUrl } from '../../scripts/lib/preview.mjs'
import { checkAdvance, compareSample, describeErrors, findRegistryFile, formatFailure, isBottomRight, parseRegistry, VerifyError } from '../../scripts/lib/verify-core.mjs'
import reference from '../fixtures/reference-sample.json'

const root = path.resolve(import.meta.dirname, '../..')
const registry = [{ slug: reference.slug, title: reference.title }]
const good = () => ({ registry, steps: reference.steps.map((s) => ({ ...s })) })

describe('parseRegistry', () => {
  it('reads slug and title from explicit registry lines with either quote style', () => {
    const text = `[\n  { slug: 'a', title: 'A one', load: () => import('./a/Talk.tsx') },\n  { slug: "b", title: "B", load: () => import('./b/Talk.tsx') },\n  { slug: 'c', title: 'It\\'s C', load: () => import('./c/Talk.tsx') },\n]`
    expect(parseRegistry(text)).toEqual([{ slug: 'a', title: 'A one' }, { slug: 'b', title: 'B' }, { slug: 'c', title: "It's C" }])
  })
  it('ignores entries that are commented out and keeps comment markers inside strings', () => {
    const text = `[\n  // { slug: 'gone', title: 'Gone', load: () => import('./gone/Talk.tsx') },\n  /* { slug: 'old', title: 'Old', load: () => import('./old/Talk.tsx') }, */\n  { slug: 'kept', title: 'See http://example.com // now', load: () => import('./kept/Talk.tsx') }, // trailing\n]`
    expect(parseRegistry(text)).toEqual([{ slug: 'kept', title: 'See http://example.com // now' }])
  })
  it('is not thrown off by regex literals that contain comment or quote characters', () => {
    const live = "{ slug: 'live', title: 'Live', load: () => import('./live/Talk.tsx') },"
    const star = `/** doc */\nexport const SRC_GLOB = /src\\/*.ts/\nexport const PRESENTATIONS = [\n  ${live}\n]`
    expect(parseRegistry(star)).toEqual([{ slug: 'live', title: 'Live' }])
    const quote = `export const Q = /'/\nexport const P = [\n  // { slug: 'old', title: 'Old', load: () => import('./old/Talk.tsx') },\n  ${live}\n]`
    expect(parseRegistry(quote)).toEqual([{ slug: 'live', title: 'Live' }])
    const division = `const half = total / 2 // note\nconst P = [\n  ${live}\n]`
    expect(parseRegistry(division)).toEqual([{ slug: 'live', title: 'Live' }])
    const classSlash = `const R = /[/*]x/g\nconst P = [\n  ${live}\n]`
    expect(parseRegistry(classSlash)).toEqual([{ slug: 'live', title: 'Live' }])
  })
  it('finds nothing in an empty registry', () => {
    expect(parseRegistry('export const PRESENTATIONS = []')).toEqual([])
  })
})

describe('findRegistryFile', () => {
  const files: Record<string, string> = { 'helpers.ts': 'export const x = 1', 'registry.ts': "{ slug: 'a', title: 'A', load: () => import('./a') }", 'notes.md': 'slug load' }
  it('finds the registry by content, whatever its name', () => {
    expect(findRegistryFile(Object.keys(files), (f: string) => files[f])).toBe('registry.ts')
    expect(findRegistryFile(['helpers.ts'], (f: string) => files[f])).toBeNull()
  })
  it('prefers index.* when several qualify', () => {
    const both: Record<string, string> = { ...files, 'index.ts': files['registry.ts'] }
    expect(findRegistryFile(Object.keys(both), (f: string) => both[f])).toBe('index.ts')
  })
})

describe('compareSample', () => {
  it('accepts the normative outline', () => {
    expect(compareSample(reference, good())).toEqual([])
  })

  it('rejects an unregistered sample', () => {
    expect(compareSample(reference, { registry: [], steps: [] })).toEqual([`reference sample "${reference.slug}" is not registered`])
  })

  it('rejects a wrong title and a duplicated registration', () => {
    expect(compareSample(reference, { ...good(), registry: [{ slug: reference.slug, title: 'Other' }] }).join()).toMatch(/registered title/)
    expect(compareSample(reference, { ...good(), registry: [...registry, ...registry] }).join()).toMatch(/more than once/)
  })

  it('rejects the wrong step count, naming it', () => {
    const fewer = good()
    fewer.steps.pop()
    expect(compareSample(reference, fewer).join()).toMatch(/8 steps, expected 9/)
    const more = good()
    more.steps.push({ era: 'x', title: 'extra', caption: 'extra' })
    expect(compareSample(reference, more).join()).toMatch(/10 steps, expected 9/)
  })

  it.each(['era', 'title', 'caption'] as const)('rejects a wrong %s and names the step', (field) => {
    const actual = good()
    actual.steps[4] = { ...actual.steps[4], [field]: 'changed' }
    const problems = compareSample(reference, actual)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(new RegExp(`^step 5 ${field} is "changed"`))
  })

  it('rejects out-of-order steps', () => {
    const actual = good()
    ;[actual.steps[1], actual.steps[2]] = [actual.steps[2], actual.steps[1]]
    const problems = compareSample(reference, actual)
    expect(problems.some((p) => p.startsWith('step 2 '))).toBe(true)
    expect(problems.some((p) => p.startsWith('step 3 '))).toBe(true)
  })

  it('rejects duplicate step titles', () => {
    const actual = good()
    actual.steps[1] = { ...actual.steps[1], title: actual.steps[0].title }
    expect(compareSample(reference, actual).join()).toMatch(/duplicate step titles/)
  })
})

describe('transitions and errors', () => {
  it('accepts exactly one step forward and describes unchanged or skipped indices', () => {
    expect(checkAdvance(2, 3)).toBeNull()
    expect(checkAdvance(2, 2)).toMatch(/stayed at 2/)
    expect(checkAdvance(2, 4)).toMatch(/went from 2 to 4/)
    expect(checkAdvance(2, 1)).toMatch(/went from 2 to 1/)
  })

  it('names the offending step for console errors, page errors and render exceptions, including the first step', () => {
    expect(describeErrors([])).toBeNull()
    expect(describeErrors([{ step: 3, kind: 'console.error', text: 'boom' }])).toEqual({ step: 3, message: 'console.error: boom' })
    expect(describeErrors([{ step: 0, kind: 'pageerror', text: 'Error: first step crashed' }, { step: 2, kind: 'console.error', text: 'x' }])).toEqual({ step: 0, message: 'pageerror: Error: first step crashed (+1 more)' })
    expect(describeErrors([{ step: 5, kind: 'pageerror', text: 'TypeError: render exception' }])?.step).toBe(5)
  })

  it('formats failures with the phase and the one-based step', () => {
    expect(formatFailure(new VerifyError('render', 'a: boom', 3))).toBe('VERIFY FAIL [render] at step 4 (index 3): a: boom')
    expect(formatFailure(new VerifyError('build', 'broken'))).toBe('VERIFY FAIL [build]: broken')
    expect(formatFailure(new VerifyError('sample', 'x', 0))).toContain('step 1 (index 0)')
  })
})

describe('IPv4 loopback', () => {
  it('builds every preview URL on 127.0.0.1', () => {
    expect(HOST).toBe('127.0.0.1')
    expect(previewUrl(4173)).toBe('http://127.0.0.1:4173/')
    expect(previewUrl(4173, '/talk')).toBe('http://127.0.0.1:4173/talk')
  })

  it('never mentions localhost in the verification or inspection scripts', () => {
    const dir = path.join(root, 'scripts')
    for (const rel of fs.readdirSync(dir, { recursive: true, encoding: 'utf8' })) {
      const file = path.join(dir, rel)
      if (fs.statSync(file).isFile() && /\.mjs$/.test(file)) expect(fs.readFileSync(file, 'utf8'), rel).not.toMatch(/localhost|\[::1\]/)
    }
  })

  it('locates the attribution in the bottom-right quadrant', () => {
    const viewport = { width: 1000, height: 800 }
    expect(isBottomRight({ x: 800, y: 760, width: 150, height: 20 }, viewport)).toBe(true)
    expect(isBottomRight({ x: 10, y: 760, width: 150, height: 20 }, viewport)).toBe(false)
    expect(isBottomRight({ x: 800, y: 10, width: 150, height: 20 }, viewport)).toBe(false)
  })
})
