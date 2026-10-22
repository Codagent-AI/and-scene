// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SAMPLE_OUTLINE, SAMPLE_SLUG, checkSampleRegistration, compareOutline, registeredSlugs } from '../../scripts/lib/outline.mjs'

const root = path.resolve(import.meta.dirname, '..', '..')
const registry = (slug = SAMPLE_SLUG, load = `() => import('./${slug}/Talk.tsx')`) => `
export const PRESENTATIONS = [
  {
    slug: '${slug}',
    title: 'T',
    load: ${load},
  },
]
`
const observed = () => SAMPLE_OUTLINE.map((s) => ({ ...s }))

describe('checkSampleRegistration', () => {
  it('accepts the committed registry and folder', () => {
    const source = fs.readFileSync(path.join(root, 'src/presentations/index.ts'), 'utf8')
    expect(checkSampleRegistration(source, { folderExists: true })).toEqual([])
  })

  it('fails when the sample is absent from the registry', () => {
    expect(checkSampleRegistration(registry('other'), { folderExists: true })).toEqual([expect.stringContaining('not registered')])
    expect(checkSampleRegistration('export const PRESENTATIONS = []', { folderExists: true })).toEqual([expect.stringContaining('not registered')])
  })

  it('fails when the sample folder is missing', () => {
    expect(checkSampleRegistration(registry(), { folderExists: false })).toEqual([expect.stringContaining('folder')])
  })

  it('fails when the registration has no loader for the sample folder', () => {
    expect(checkSampleRegistration(registry(SAMPLE_SLUG, '() => import(\'./elsewhere/Talk.tsx\')'), { folderExists: true })).toEqual([
      expect.stringContaining('no loader'),
    ])
    expect(checkSampleRegistration(registry(SAMPLE_SLUG, 'undefined'), { folderExists: true })).toEqual([expect.stringContaining('no loader')])
  })

  it('finds the sample entry even when other presentations are registered first', () => {
    const two = `export const PRESENTATIONS = [\n  {\n    slug: 'a',\n    title: 'A',\n    load: () => import('./a/Talk.tsx'),\n  },\n  {\n    slug: '${SAMPLE_SLUG}',\n    title: 'S',\n    load: () => import('./${SAMPLE_SLUG}/Talk.tsx'),\n  },\n]`
    expect(checkSampleRegistration(two, { folderExists: true })).toEqual([])
  })
})

describe('registeredSlugs', () => {
  it('lists every registered slug and ignores comments that merely mention slug', () => {
    const source = `// { slug, title }\nexport const P = [\n  { slug: 'a', title: 'A', load: x },\n  { slug: "b", title: 'B', load: y },\n]`
    expect(registeredSlugs(source)).toEqual(['a', 'b'])
  })
})

describe('compareOutline', () => {
  it('accepts the exact outline', () => {
    expect(compareOutline(observed())).toEqual([])
  })

  it('has nine entries across the five eras', () => {
    expect(SAMPLE_OUTLINE).toHaveLength(9)
    expect([...new Set(SAMPLE_OUTLINE.map((s) => s.era))]).toEqual(['the ask', 'the gathering', 'the build', 'the loop', 'the reveal'])
  })

  it('reports a count mismatch', () => {
    expect(compareOutline(observed().slice(0, 8))).toEqual([expect.stringContaining('expected 9 steps, found 8')])
    expect(compareOutline([...observed(), { era: 'x', title: 'x', caption: 'x' }])[0]).toMatch(/found 10/)
  })

  it('reports reordered steps by position', () => {
    const swapped = observed()
    ;[swapped[2], swapped[3]] = [swapped[3], swapped[2]]
    const problems = compareOutline(swapped)
    expect(problems.some((p) => p.startsWith('step 2: title'))).toBe(true)
    expect(problems.some((p) => p.startsWith('step 3: title'))).toBe(true)
  })

  it.each(['era', 'title', 'caption'])('reports a wrong %s', (field) => {
    const wrong = observed()
    wrong[4][field] = 'changed'
    expect(compareOutline(wrong)).toEqual([expect.stringContaining(`step 4: ${field}`)])
  })
})
