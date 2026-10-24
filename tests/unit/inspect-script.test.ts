import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../src/presentation-kit/constants.ts'
import {
  ACTIVE_STYLE_PROPS, DEFAULT_SETTLE_MS, MIN_ATTRIBUTION_FONT_PX, analyze, assessAttribution, captureSteps, compareActive, findOverlaps, parseArgs,
} from '../../scripts/inspect-presentation.mjs'

type Item = { id: number; label: string; rect: { x: number; y: number; w: number; h: number }; exempt: boolean; ancestors: number[] }
const item = (id: number, x: number, y: number, w: number, h: number, extra: Partial<Item> = {}): Item => ({
  id, label: `item${id}`, rect: { x, y, w, h }, exempt: false, ancestors: [], ...extra,
})

describe('findOverlaps', () => {
  it('reports intersecting rectangles by identity', () => {
    const pairs = findOverlaps([item(0, 0, 0, 100, 20), item(1, 50, 5, 100, 20)])
    expect(pairs.map(([a, b]) => [a.label, b.label])).toEqual([['item0', 'item1']])
  })

  it('ignores disjoint, merely touching, and tolerance-level contact', () => {
    expect(findOverlaps([item(0, 0, 0, 10, 10), item(1, 20, 0, 10, 10)])).toEqual([])
    expect(findOverlaps([item(0, 0, 0, 10, 10), item(1, 10, 0, 10, 10)])).toEqual([])
    expect(findOverlaps([item(0, 0, 0, 10, 10), item(1, 9.5, 0, 10, 10)])).toEqual([])
  })

  it('exempts a pair only when both elements are inside allow-overlap subtrees', () => {
    const items = [
      item(0, 0, 0, 100, 100, { exempt: true }),
      item(1, 10, 10, 20, 20, { exempt: true }), // both inside marked subtrees: exempt
      item(2, 10, 10, 20, 20), // unmarked element colliding with a marked one: still reported
      item(3, 500, 0, 50, 50),
      item(4, 520, 10, 50, 50), // unmarked external collision
    ]
    const pairs = findOverlaps(items)
    expect(pairs.map(([a, b]) => [a.id, b.id])).toEqual([[0, 2], [1, 2], [3, 4]])
  })

  it('does not pair an element with its own ancestor or descendant', () => {
    expect(findOverlaps([item(0, 0, 0, 100, 100), item(1, 10, 10, 20, 20, { ancestors: [0] })])).toEqual([])
  })
})

describe('compareActive', () => {
  const style = { color: 'rgb(1, 1, 1)', width: '10px', opacity: '1' }
  it('lists the properties that distinguish the active control', () => {
    expect(compareActive({ ...style, color: 'rgb(9, 9, 9)', width: '30px' }, style)).toEqual(['color', 'width'])
  })
  it('is empty for an indistinct active control', () => {
    expect(compareActive(style, { ...style })).toEqual([])
  })
})

describe('assessAttribution', () => {
  const good = { fontSize: 12, height: 16, color: 'rgb(180, 170, 150)', fontFamily: 'Inter, sans-serif' }
  it('accepts an intentionally styled link', () => {
    expect(assessAttribution(good)).toEqual([])
  })
  it('flags a missing attribution link', () => {
    expect(assessAttribution(null)[0]).toContain('missing')
    expect(assessAttribution(null)[0]).toContain('[data-presentation-attribution]')
  })
  it('flags undersized text and browser-default styling, pointing to the hook', () => {
    const small = assessAttribution({ ...good, fontSize: 9, height: 11 })
    expect(small).toHaveLength(1)
    expect(small[0]).toContain('too small')
    expect(small[0]).toContain('[data-presentation-attribution]')
    const blue = assessAttribution({ ...good, color: 'rgb(0, 0, 238)' })
    expect(blue[0]).toContain('browser-default')
    expect(assessAttribution({ ...good, fontFamily: '"Times New Roman"' })[0]).toContain('browser-default')
    expect(assessAttribution({ fontSize: 8, height: 9, color: 'rgb(0, 0, 238)', fontFamily: 'Times' })).toHaveLength(2)
  })
})

describe('analyze', () => {
  const styles = { color: 'a', width: '1px' }
  const diag = (over = {}) => ({
    mode: 'browse',
    items: [],
    active: { progress: { active: { ...styles, color: 'b' }, inactive: styles }, toc: { active: { ...styles, color: 'b' }, inactive: styles } },
    attribution: { fontSize: 12, height: 16, color: 'rgb(1, 2, 3)', fontFamily: 'Inter' },
    ...over,
  })
  it('is quiet for a polished step', () => {
    expect(analyze(diag())).toEqual([])
  })
  it('names each indistinct chrome control and an overlap', () => {
    const warnings = analyze(
      diag({
        items: [item(0, 0, 0, 50, 50), item(1, 10, 10, 50, 50)],
        active: { progress: { active: styles, inactive: styles }, toc: { active: styles, inactive: styles } },
      }),
    )
    expect(warnings.some((w) => w.startsWith('overlap: item0 overlaps item1'))).toBe(true)
    expect(warnings.some((w) => w.includes('progress indicator is visually indistinct'))).toBe(true)
    expect(warnings.some((w) => w.includes('table-of-contents entry is visually indistinct'))).toBe(true)
  })
  it('judges indistinctness by colour, background, border, opacity, and weight only', () => {
    expect(ACTIVE_STYLE_PROPS).toEqual(expect.arrayContaining(['color', 'backgroundColor', 'opacity', 'fontWeight', 'borderTopColor']))
    expect(ACTIVE_STYLE_PROPS).not.toContain('width')
  })
  it('skips controls that are not on screen (e.g. ToC at narrow widths)', () => {
    expect(analyze(diag({ active: { progress: null, toc: null } }))).toEqual([])
  })
  it('reports a missing attribution link', () => {
    expect(analyze(diag({ attribution: null }))[0]).toContain('missing')
  })
})

describe('captureSteps', () => {
  function fakePage(calls: string[]) {
    return {
      keyboard: { press: async (k: string) => void calls.push(`press ${k}`) },
      waitForFunction: async (_fn: unknown, want: number) => void calls.push(`index ${want}`),
      waitForTimeout: async (ms: number) => void calls.push(`wait ${ms}`),
      screenshot: async ({ path: p }: { path: string }) => void calls.push(`shot ${path.basename(p)}`),
      evaluate: async () => ({ mode: 'browse', items: [], active: { progress: null, toc: null }, attribution: null }),
    }
  }

  it('waits the settle interval before every screenshot, including the first', async () => {
    const calls: string[] = []
    const dir = await mkdtemp(path.join(tmpdir(), 'inspect-'))
    const { manifest, warnings } = await captureSteps({ page: fakePage(calls), count: 3, outDir: dir, settleMs: 7, log: () => {} })
    expect(calls).toEqual([
      'wait 7', 'shot step-01.png',
      'press ArrowRight', 'index 1', 'wait 7', 'shot step-02.png',
      'press ArrowRight', 'index 2', 'wait 7', 'shot step-03.png',
    ])
    expect(manifest.map((m) => m.file.endsWith(`step-0${m.step + 1}.png`))).toEqual([true, true, true])
    expect(manifest.every((m) => m.waitedMs >= 0 && m.settleMs === 7)).toBe(true)
    expect(warnings.every((w) => w.message.includes('missing'))).toBe(true)
    expect(JSON.parse(await readFile(path.join(dir, 'captures.json'), 'utf8')).captures).toHaveLength(3)
  })
})

describe('settle interval and arguments', () => {
  it('covers the kit layout morph, entry delay, and fade', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(DEFAULT_SETTLE_MS).toBeGreaterThan((ENTER_DELAY + ENTER_T) * 1000)
    expect(DEFAULT_SETTLE_MS).toBeLessThanOrEqual(1500)
    expect(MIN_ATTRIBUTION_FONT_PX).toBe(11)
  })

  it('parses options and rejects bad input', () => {
    expect(parseArgs(['talk'])).toMatchObject({ slug: 'talk', build: true, settleMs: DEFAULT_SETTLE_MS })
    expect(parseArgs(['talk', '--no-build', '--settle', '50', '--viewport', '390x844'])).toMatchObject({
      build: false, settleMs: 50, viewport: { width: 390, height: 844 },
    })
    expect(() => parseArgs([])).toThrow(/usage/)
    expect(() => parseArgs(['a', '--bogus'])).toThrow(/unknown argument/)
    expect(() => parseArgs(['a', '--settle', 'x'])).toThrow(/settle/)
    expect(() => parseArgs(['a', '--viewport', '0x0'])).toThrow(/viewport/)
  })
})
