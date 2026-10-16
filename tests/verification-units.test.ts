import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadInspect, loadVerify } from './helpers/scripts'

const box = (x: number, y: number, w = 100, h = 20) => ({ x, y, width: w, height: h })
const item = (id: number, label: string, rect: ReturnType<typeof box>, extra = {}) => ({ id, label, rect, allowOverlap: false, ancestors: [], ...extra })

describe('overlap detector', () => {
  it('flags colliding text and ignores disjoint text', async () => {
    const { findOverlaps } = await loadInspect()
    expect(findOverlaps([item(1, 'a', box(0, 0)), item(2, 'b', box(10, 5))])).toEqual([{ a: 'a', b: 'b' }])
    expect(findOverlaps([item(1, 'a', box(0, 0)), item(2, 'b', box(0, 40))])).toEqual([])
  })
  it('skips allow-overlap items and ancestor/descendant pairs', async () => {
    const { findOverlaps } = await loadInspect()
    expect(findOverlaps([item(1, 'a', box(0, 0), { allowOverlap: true }), item(2, 'b', box(10, 5), { allowOverlap: true })])).toEqual([])
    expect(findOverlaps([item(1, 'a', box(0, 0)), item(2, 'b', box(10, 5), { ancestors: [1] })])).toEqual([])
  })
})

describe('active chrome detector', () => {
  it('flags identical styles and passes distinct ones', async () => {
    const { indistinctActive } = await loadInspect()
    const s = { color: 'red', opacity: '1' }
    expect(indistinctActive([{ label: 'x', active: s, inactive: [s, { ...s }] }])).toEqual(['x'])
    expect(indistinctActive([{ label: 'x', active: s, inactive: [{ ...s, opacity: '0.4' }] }])).toEqual([])
    expect(indistinctActive([{ label: 'x', active: s, inactive: [] }])).toEqual([])
  })
})

describe('attribution detector', () => {
  it('reports missing, small, and browser-default attribution', async () => {
    const { attributionIssues } = await loadInspect()
    expect(attributionIssues(null)[0]).toMatch(/missing/)
    expect(attributionIssues({ fontSize: 9, color: 'rgb(1, 2, 3)', textDecorationLine: 'none', height: 12 })[0]).toMatch(/too small/)
    expect(attributionIssues({ fontSize: 16, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline', height: 18 })[0]).toMatch(/browser-default/)
    expect(attributionIssues({ fontSize: 12, color: 'rgb(1, 2, 3)', textDecorationLine: 'none', height: 14 })).toEqual([])
  })
})

describe('argument and config parsing', () => {
  it('parses inspect options', async () => {
    const { parseInspectArgs, parseViewport } = await loadInspect()
    expect(parseViewport('390x844')).toEqual({ width: 390, height: 844 })
    expect(() => parseViewport('wide')).toThrow()
    expect(parseInspectArgs(['talk', '--settle', '50', '--no-build', '--viewport', '390x844'])).toMatchObject({ slug: 'talk', settle: 50, build: false, viewport: { width: 390, height: 844 } })
    expect(() => parseInspectArgs(['talk', '--bogus'])).toThrow()
  })
  it('validates config and selects slugs', async () => {
    const { parseConfig, selectEntries, parseArgs } = await loadVerify()
    const list = parseConfig({ presentations: [{ slug: 'a' }, { slug: 'b', expectedSteps: [{ title: 't', caption: 'c' }] }] })
    expect(selectEntries(list, 'b')).toHaveLength(1)
    expect(selectEntries(list)).toHaveLength(2)
    expect(() => selectEntries(list, 'nope')).toThrow(/not in scripts\/verification.config.json/)
    expect(() => parseConfig({ presentations: [] })).toThrow()
    expect(() => parseConfig({ presentations: [{ slug: 'a', expectedSteps: [{ title: 1 }] }] })).toThrow()
    expect(parseArgs(['--slug', 'a'])).toEqual({ slug: 'a' })
  })
  it('checks steps in source order', async () => {
    const { checkStepsInSource } = await loadVerify()
    const steps = [{ title: 'One', caption: "It's one" }, { title: 'Two', caption: 'two' }]
    expect(checkStepsInSource(`title: 'One', caption: 'It\\'s one', title: "Two", caption: 'two'`, steps)).toBeNull()
    expect(checkStepsInSource(`title: 'Two', caption: 'two', title: 'One', caption: 'It\\'s one'`, steps)).toMatch(/out of order/)
    expect(checkStepsInSource(`title: 'One'`, steps)).toMatch(/not found/)
  })
})

describe('registry slug detection', () => {
  it('ignores slugs that only appear in comments', async () => {
    const { registeredSlugs } = await loadVerify()
    const root = mkdtempSync(join(tmpdir(), 'slugs-'))
    try {
      mkdirSync(join(root, 'src', 'presentations'), { recursive: true })
      writeFileSync(
        join(root, 'src', 'presentations', 'index.ts'),
        [
          '/** e.g.',
          " *  { slug: 'doc-block', title: 'X' } */",
          "// { slug: 'doc-line', title: 'Y' }",
          'export const presentations = [',
          "  { slug: 'real', title: 'Real' }, // { slug: 'trailing', title: 'Z' }",
          "  { slug: 'globbed', title: 'src/*/deck.tsx', loader: () => import('./a//b') },",
          "  { slug: 'after-glob', title: 'After' },",
          ']',
        ].join('\n'),
      )
      expect(registeredSlugs(root)).toEqual(['real', 'globbed', 'after-glob'])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
