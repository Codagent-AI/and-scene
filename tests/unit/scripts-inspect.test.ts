import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ANIMATION_TIMEOUT_MS,
  DEFAULT_SETTLE_MS,
  assertSettled,
  analyzeStep,
  attributionIssue,
  detectOverlaps,
  isDistinct,
  outputDir,
  parseArgs,
  stepFileName,
} from '../../scripts/inspect-presentation.mjs'
import { read, ROOT } from './helpers'

const rect = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom })
const item = (label: string, r: ReturnType<typeof rect>, extra = {}) => ({ label, rect: r, allowed: false, nested: [], ...extra })

describe('arguments and output paths', () => {
  it('defaults to desktop, 1200ms settle, building first', () => {
    expect(parseArgs(['demo'])).toEqual({ slug: 'demo', viewport: 'desktop', settleMs: DEFAULT_SETTLE_MS, animationTimeoutMs: DEFAULT_ANIMATION_TIMEOUT_MS, build: true })
    expect(DEFAULT_SETTLE_MS).toBe(1200)
  })

  it('reads flags and the env override', () => {
    expect(parseArgs(['demo', '--narrow', '--settle', '300', '--no-build'])).toMatchObject({ viewport: 'narrow', settleMs: 300, build: false })
    expect(parseArgs(['demo', '--settle=50']).settleMs).toBe(50)
    expect(parseArgs(['demo'], { INSPECT_SETTLE_MS: '700' }).settleMs).toBe(700)
    expect(parseArgs(['demo', '--settle', '5'], { INSPECT_SETTLE_MS: '700' }).settleMs).toBe(5)
  })

  it('rejects a missing slug, bad settle values and unknown flags', () => {
    expect(() => parseArgs([])).toThrow(/usage/)
    expect(() => parseArgs(['x', '--settle', 'abc'])).toThrow()
    expect(() => parseArgs(['x', '--bogus'])).toThrow(/unknown argument/)
  })

  it('rejects slugs that could escape the artifact directory', () => {
    for (const slug of ['..', '../x', 'a/b', '.', '/tmp', 'Bad Slug', 'a\\b'])
      expect(() => parseArgs([slug || '']), slug).toThrow()
    expect(() => outputDir('/p', '..', 'desktop')).toThrow(/outside/)
    expect(() => outputDir('/p', '../..', 'narrow')).toThrow(/outside/)
    expect(() => outputDir('/p', '', 'desktop')).toThrow(/outside/)
    expect(() => outputDir('/p', 'a/../..', 'desktop')).toThrow(/outside/)
  })

  it('reads the animation timeout flag', () => {
    expect(parseArgs(['demo', '--animation-timeout', '250']).animationTimeoutMs).toBe(250)
    expect(() => parseArgs(['demo', '--animation-timeout', 'x'])).toThrow()
  })

  it('writes zero-padded 1-based names under a predictable project-local directory', () => {
    expect(stepFileName(1)).toBe('step-01.png')
    expect(stepFileName(12)).toBe('step-12.png')
    expect(outputDir('/p', 'demo', 'desktop')).toBe(path.join('/p', '.presentation-inspection', 'demo'))
    expect(outputDir('/p', 'demo', 'narrow')).toBe(path.join('/p', '.presentation-inspection', 'demo', 'narrow'))
  })
})

describe('assertSettled', () => {
  it('accepts a settled step and refuses to capture while finite animations still run', () => {
    expect(() => assertSettled(2, 0, 8000)).not.toThrow()
    expect(() => assertSettled(2, 3, 500)).toThrow(/step 2: 3 animation\(s\) still running after 500ms/)
  })
})

describe('detectOverlaps', () => {
  it('reports intersecting visible text/chrome boxes', () => {
    expect(detectOverlaps([item('A', rect(0, 0, 100, 20)), item('B', rect(50, 10, 150, 30))])).toEqual([['A', 'B']])
  })

  it('ignores disjoint and merely touching boxes', () => {
    expect(detectOverlaps([item('A', rect(0, 0, 100, 20)), item('B', rect(100, 0, 200, 20)), item('C', rect(0, 20, 100, 40))])).toEqual([])
  })

  it('ignores an ancestor and its descendant', () => {
    expect(detectOverlaps([item('P', rect(0, 0, 100, 100), { nested: [1] }), item('C', rect(10, 10, 50, 30))])).toEqual([])
  })

  it('exempts elements inside an allow-overlap subtree but still reports unrelated collisions', () => {
    const items = [
      item('inside', rect(0, 0, 100, 20), { allowed: true }),
      item('peer', rect(10, 0, 90, 20)),
      item('x', rect(300, 0, 400, 20)),
      item('y', rect(350, 5, 450, 25)),
    ]
    expect(detectOverlaps(items)).toEqual([['x', 'y']])
  })
})

describe('isDistinct', () => {
  const base = { color: 'a', backgroundColor: 'b', borderColor: 'c', borderWidth: '1px', fontWeight: '400', opacity: '1', width: 10, height: 10 }
  it('is false when the active control looks like an inactive one', () => {
    expect(isDistinct({ ...base }, [{ ...base }, { ...base }])).toBe(false)
  })
  it('can ignore content-sized properties such as the width of a text entry', () => {
    expect(isDistinct({ ...base, width: 60 }, [{ ...base }])).toBe(true)
    expect(isDistinct({ ...base, width: 60 }, [{ ...base }], ['width'])).toBe(false)
  })
  it.each([
    ['color', 'x'], ['backgroundColor', 'x'], ['borderColor', 'x'], ['borderWidth', '2px'],
    ['fontWeight', '700'], ['opacity', '0.5'], ['width', 26], ['height', 3],
  ])('is true when %s differs', (key, value) => {
    expect(isDistinct({ ...base, [key]: value }, [{ ...base }, { ...base }])).toBe(true)
  })
})

describe('attributionIssue', () => {
  const ok = { fontSize: 13, color: 'rgb(230, 199, 107)', underline: false }
  it('flags a missing attribution', () => {
    expect(attributionIssue(null)).toMatch(/no attribution/)
  })
  it('flags text under 12px and accepts exactly 12px', () => {
    expect(attributionIssue({ ...ok, fontSize: 11.9 })).toMatch(/under 12px/)
    expect(attributionIssue({ ...ok, fontSize: 12 })).toBeNull()
  })
  it('flags the browser-default blue underlined link', () => {
    expect(attributionIssue({ fontSize: 16, color: 'rgb(0, 0, 238)', underline: true })).toMatch(/browser-default/)
    expect(attributionIssue({ fontSize: 16, color: 'rgb(0, 0, 238)', underline: false })).toBeNull()
    expect(attributionIssue(ok)).toBeNull()
  })
})

describe('analyzeStep', () => {
  const style = { color: 'a', backgroundColor: 'b', borderColor: 'c', borderWidth: '1px', fontWeight: '400', opacity: '1', width: 10, height: 10 }
  const clean = { items: [], chrome: [], attribution: { fontSize: 13, color: 'red', underline: false } }

  it('produces no warning for a clean step', () => {
    expect(analyzeStep(1, clean)).toEqual([])
  })

  it('names the step, the elements, the chrome and the styling hook', () => {
    const warnings = analyzeStep(4, {
      items: [item('[data-presentation-title] "T"', rect(0, 0, 50, 20)), item('p "x"', rect(10, 5, 60, 25))],
      chrome: [
        { name: 'progress item', active: style, inactives: [style] },
        { name: 'table-of-contents entry', active: { ...style, color: 'z' }, inactives: [style] },
      ],
      attribution: null,
    })
    expect(warnings).toEqual([
      'WARN [overlap] step 4: [data-presentation-title] "T" overlaps p "x"',
      'WARN [active-chrome] step 4: active progress item looks the same as inactive ones; style [data-presentation-active="true"]',
      'WARN [attribution] step 4: no attribution link found; style [data-presentation-attribution]',
    ])
  })
})

describe('advisory contract', () => {
  const src = read(ROOT, 'scripts/inspect-presentation.mjs')
  it('treats warnings as output only and fails solely on capture/launch errors', () => {
    expect(src).toMatch(/warnings\.forEach\(\(w\) => log\(w\)\)/)
    expect(src).toMatch(/process\.exitCode = 1/)
    expect(src.match(/process\.exitCode/g)).toHaveLength(1)
  })
  it('waits for the settle interval before capturing each step', () => {
    const settle = src.indexOf('await waitForSettle(page, step, args.settleMs, args.animationTimeoutMs)')
    const shot = src.indexOf('await page.screenshot')
    expect(settle).toBeGreaterThan(-1)
    expect(shot).toBeGreaterThan(settle)
    expect(src).toMatch(/page\.waitForTimeout\(settleMs\)/)
    expect(src).toMatch(/getAnimations\(\)/)
  })
})
