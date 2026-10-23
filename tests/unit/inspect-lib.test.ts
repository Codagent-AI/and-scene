// @vitest-environment node
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTLE_MS,
  DESKTOP_VIEWPORT,
  MIN_ATTRIBUTION_PX,
  artifactDir,
  captureSteps,
  classifyAttribution,
  describeWarnings,
  findOverlaps,
  isIndistinctActive,
  screenshotPath,
} from '../../scripts/inspect-presentation.mjs'

const item = (id: number, label: string, x: number, y: number, w = 100, h = 20, extra = {}) => ({
  id,
  label,
  rect: { x, y, w, h },
  allowed: false,
  contains: [] as number[],
  ...extra,
})

const clean = {
  items: [],
  progress: { active: { backgroundColor: 'gold' }, inactive: [{ backgroundColor: 'gray' }] },
  toc: { active: { backgroundColor: 'gold' }, inactive: [{ backgroundColor: 'gray' }] },
  attribution: { fontSize: 13, color: 'rgb(1, 2, 3)', fontFamily: 'Inter' },
}

describe('artifact paths and viewport', () => {
  it('writes predictable project-local paths, one per step', () => {
    expect(artifactDir('/p', 'talk')).toBe(path.join('/p', 'inspection', 'talk'))
    expect(screenshotPath('/p', 'talk', 0)).toBe(path.join('/p', 'inspection', 'talk', 'step-01.png'))
    expect(screenshotPath('/p', 'talk', 11)).toBe(path.join('/p', 'inspection', 'talk', 'step-12.png'))
    expect(screenshotPath('/p', 'talk', 2, 'narrow')).toBe(path.join('/p', 'inspection', 'talk', 'step-03-narrow.png'))
  })
  it('captures at a standard desktop viewport', () => {
    expect(DESKTOP_VIEWPORT).toEqual({ width: 1280, height: 720 })
    expect(DEFAULT_SETTLE_MS).toBeGreaterThan(0)
  })
})

describe('findOverlaps', () => {
  it('reports text/text and text/chrome collisions with both identities', () => {
    const pairs = findOverlaps([item(0, 'text "A"', 0, 0), item(1, 'text "B"', 50, 5), item(2, 'chrome <footer>', 60, 10), item(3, 'text "far"', 500, 500)])
    expect(pairs).toEqual([
      ['text "A"', 'text "B"'],
      ['text "A"', 'chrome <footer>'],
      ['text "B"', 'chrome <footer>'],
    ])
  })
  it('ignores touching, non-overlapping, and sliver overlaps', () => {
    expect(findOverlaps([item(0, 'a', 0, 0), item(1, 'b', 100, 0)])).toEqual([])
    expect(findOverlaps([item(0, 'a', 0, 0), item(1, 'b', 0, 20)])).toEqual([])
    expect(findOverlaps([item(0, 'a', 0, 0), item(1, 'b', 99.5, 0)])).toEqual([])
    expect(findOverlaps([item(0, 'a', 0, 0, 100, 100), item(1, 'b', 99, 99, 100, 100)])).toEqual([])
  })
  it('ignores ancestor/descendant pairs', () => {
    expect(findOverlaps([item(0, 'outer', 0, 0, 200, 100, { contains: [1] }), item(1, 'inner', 10, 10)])).toEqual([])
  })
  it('exempts pairs touching an allow-overlap subtree but still reports unrelated collisions', () => {
    const pairs = findOverlaps([
      item(0, 'allowed-1', 0, 0, 100, 20, { allowed: true }),
      item(1, 'allowed-2', 10, 5, 100, 20, { allowed: true }),
      item(2, 'plain', 20, 5),
      item(3, 'other', 30, 8),
    ])
    expect(pairs).toEqual([['plain', 'other']])
  })
})

describe('active chrome and attribution classification', () => {
  const style = { backgroundColor: 'red', color: 'white', width: '10px', opacity: '1' }
  it('flags an active control identical to every inactive one', () => {
    expect(isIndistinctActive(style, [{ ...style }, { ...style }])).toBe(true)
  })
  it('accepts an active control that differs in any signature property', () => {
    for (const key of ['backgroundColor', 'color', 'width', 'opacity']) {
      expect(isIndistinctActive({ ...style, [key]: 'other' }, [{ ...style }, { ...style }]), key).toBe(false)
    }
  })
  it('does not flag when there is no active control or nothing to compare against', () => {
    expect(isIndistinctActive(null, [style])).toBe(false)
    expect(isIndistinctActive(style, [])).toBe(false)
  })
  it('classifies attribution: missing, undersized, browser-default, polished', () => {
    const ok = { fontSize: 13, color: 'rgb(180, 170, 140)', fontFamily: 'Inter, sans-serif' }
    expect(classifyAttribution(null)).toMatch(/missing/)
    expect(classifyAttribution({ ...ok, fontSize: MIN_ATTRIBUTION_PX - 1 })).toMatch(/undersized \(10px\)/)
    expect(classifyAttribution({ ...ok, color: 'rgb(0, 0, 238)' })).toMatch(/browser-default/)
    expect(classifyAttribution({ ...ok, fontFamily: '"Times New Roman"' })).toMatch(/browser-default/)
    expect(classifyAttribution(ok)).toBeNull()
  })
})

describe('describeWarnings', () => {
  it('is silent for a polished step', () => {
    expect(describeWarnings(0, clean)).toEqual([])
  })
  it('names the step, the elements, and the hook to fix for each defect', () => {
    const w = describeWarnings(2, {
      items: [item(0, 'text "A"', 0, 0), item(1, 'text "B"', 5, 0)],
      progress: { active: { backgroundColor: 'gray' }, inactive: [{ backgroundColor: 'gray' }] },
      toc: { active: { backgroundColor: 'gray' }, inactive: [{ backgroundColor: 'gray' }] },
      attribution: { fontSize: 8, color: 'rgb(1, 2, 3)', fontFamily: 'Inter' },
    })
    expect(w).toHaveLength(4)
    expect(w.every((x) => x.includes('step 3 (index 2)'))).toBe(true)
    expect(w[0]).toMatch(/\[overlap\].*text "A".*text "B".*data-presentation-allow-overlap/)
    expect(w[1]).toMatch(/\[active-progress\].*data-presentation-active/)
    expect(w[2]).toMatch(/\[active-toc\].*data-presentation-toc-item/)
    expect(w[3]).toMatch(/\[attribution\].*data-presentation-attribution/)
  })
})

describe('captureSteps sequencing', () => {
  it('settles before every capture, including the first, and only after the step index advanced', async () => {
    const log: string[] = []
    const page = {
      keyboard: { press: async (k: string) => void log.push(`press ${k}`) },
      waitForFunction: async (_f: unknown, n: number) => void log.push(`index ${n}`),
      waitForTimeout: async (ms: number) => void log.push(`settle ${ms}`),
      screenshot: async ({ path: p }: { path: string }) => void log.push(`shot ${p}`),
    }
    const steps = await captureSteps({
      page,
      count: 3,
      settleMs: 7,
      shotPath: (i: number) => `s${i}.png`,
      analyze: async () => clean,
    })
    expect(log).toEqual([
      'settle 7',
      'shot s0.png',
      'press ArrowRight',
      'index 1',
      'settle 7',
      'shot s1.png',
      'press ArrowRight',
      'index 2',
      'settle 7',
      'shot s2.png',
    ])
    expect(steps.map((s: { file: string }) => s.file)).toEqual(['s0.png', 's1.png', 's2.png'])
    expect(steps.every((s: { warnings: string[] }) => s.warnings.length === 0)).toBe(true)
  })
})
