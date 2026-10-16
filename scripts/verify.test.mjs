import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { compareOutline, formatReport, parseArgs, parseRegistry, selectSlugs } from './verify.mjs'

const outline = [
  { title: 'A', caption: 'ca' },
  { title: 'B', caption: 'cb' },
  { title: 'C', caption: 'cc' },
]

describe('compareOutline', () => {
  it('accepts an exact match', () => {
    expect(compareOutline(outline, outline)).toEqual([])
  })
  it('reports missing steps', () => {
    expect(compareOutline(outline, outline.slice(0, 2)).join('\n')).toMatch(/missing step 3.*"C"/)
  })
  it('reports extra steps', () => {
    expect(compareOutline(outline, [...outline, { title: 'D', caption: 'cd' }]).join('\n')).toMatch(/extra step 4/)
  })
  it('reports out-of-order titles', () => {
    const swapped = [outline[1], outline[0], outline[2]]
    const out = compareOutline(outline, swapped).join('\n')
    expect(out).toMatch(/step 1 title is "B", expected "A".*out of order.*step 2/)
  })
  it('reports caption mismatches', () => {
    const bad = [outline[0], { title: 'B', caption: 'nope' }, outline[2]]
    expect(compareOutline(outline, bad)).toEqual([expect.stringMatching(/step 2 caption is "nope"/)])
  })
})

describe('parseRegistry', () => {
  it('parses entries and ignores commented-out ones', () => {
    const src = `export const presentations = [
      { slug: 'one', title: 'One Talk', load: () => import('./one/Talk') },
      // { slug: 'ghost', title: 'Ghost', load: () => import('./ghost/Talk') },
      {
        slug: "two-talk",
        title: "Two's Talk",
        load: () => import("./two/Talk"),
      },
    ]`
    expect(parseRegistry(src)).toEqual([
      { slug: 'one', title: 'One Talk', loadPath: './one/Talk' },
      { slug: 'two-talk', title: "Two's Talk", loadPath: './two/Talk' },
    ])
  })
  it('returns nothing for an empty registry', () => {
    expect(parseRegistry('export const presentations = [\n  // { slug: "x" }\n]')).toEqual([])
  })
  it('reads the real registry', () => {
    const real = parseRegistry(readFileSync('src/presentations/index.ts', 'utf8'))
    expect(real.map((e) => e.slug)).toContain('how-to-make-a-presentation')
  })
})

describe('selectSlugs', () => {
  const registry = [{ slug: 'a' }, { slug: 'b' }]
  it('renders the reference plus requested slugs when a reference is configured', () => {
    expect(selectSlugs({ reference: { slug: 'a' }, registry, slugs: [] })).toEqual(['a'])
    expect(selectSlugs({ reference: { slug: 'a' }, registry, slugs: ['b', 'a'] })).toEqual(['a', 'b'])
  })
  it('renders every registered presentation when no reference is configured', () => {
    expect(selectSlugs({ reference: undefined, registry, slugs: [] })).toEqual(['a', 'b'])
  })
})

describe('formatReport', () => {
  it('prints PASS and exit 0 when every phase is ok', () => {
    const r = formatReport([{ phase: 'build', ok: true }, { phase: 'render', ok: true, detail: 'fine' }])
    expect(r.exitCode).toBe(0)
    expect(r.lines.at(-1)).toBe('PASS')
  })
  it('names the failed phase, slug, and step and exits non-zero', () => {
    const r = formatReport([
      { phase: 'build', ok: true },
      { phase: 'render', ok: false, failures: [{ slug: 'talk', step: 3, message: 'console.error: boom' }] },
    ])
    expect(r.exitCode).toBe(1)
    expect(r.lines.at(-1)).toBe('FAIL: render (slug "talk", step index 3)')
    expect(r.lines.join('\n')).toMatch(/\[slug "talk", step index 3\] console.error: boom/)
    expect(r.lines).not.toContain('PASS')
  })
})

describe('parseArgs', () => {
  it('collects repeatable --slug and --root', () => {
    expect(parseArgs(['--slug', 'a', '--slug=b', '--root', '/x'])).toEqual({ root: '/x', slugs: ['a', 'b'] })
  })
})
