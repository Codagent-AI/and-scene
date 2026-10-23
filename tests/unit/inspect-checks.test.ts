import { describe, expect, it, vi } from 'vitest'
import {
  attributionIssues, captureSteps, diagnose, findOverlaps, isDistinct, parseInspectArgs, stepFileName,
} from '../../scripts/lib/inspect-checks.mjs'

const item = (label: string, x: number, y: number, w: number, h: number, extra: Record<string, unknown> = {}) => ({
  label, rect: { x, y, w, h }, chrome: false, allowed: false, ancestors: [] as number[], ...extra,
})

describe('findOverlaps', () => {
  it('reports colliding text/chrome and not separated or hidden-sized items', () => {
    const items = [item('a', 0, 0, 100, 20), item('b', 50, 5, 100, 20), item('far', 500, 500, 50, 20), item('edge', 150, 0, 10, 20)]
    expect(findOverlaps(items)).toEqual([['a', 'b']])
  })

  it('catches text against chrome', () => {
    const items = [item('diagram text', 10, 10, 80, 14), item('prev button', 0, 0, 120, 40, { chrome: true })]
    expect(findOverlaps(items)).toEqual([['diagram text', 'prev button']])
  })

  it('never warns for nested items and ignores trivial slivers', () => {
    const items = [item('outer', 0, 0, 100, 100), item('inner', 10, 10, 20, 20, { ancestors: [0] })]
    expect(findOverlaps(items)).toEqual([])
    expect(findOverlaps([item('a', 0, 0, 100, 100), item('b', 99, 99, 100, 100)])).toEqual([])
  })

  it('exempts allow-overlap subtrees only', () => {
    const colliding = (allowed: boolean) => [item('a', 0, 0, 100, 20, { allowed }), item('b', 50, 5, 100, 20)]
    expect(findOverlaps(colliding(false))).toHaveLength(1)
    expect(findOverlaps(colliding(true))).toEqual([])
    const withUnmarked = [
      item('m1', 0, 0, 100, 20, { allowed: true }), item('m2', 20, 5, 100, 20, { allowed: true }),
      item('x', 0, 100, 100, 20), item('y', 10, 105, 100, 20),
    ]
    expect(findOverlaps(withUnmarked)).toEqual([['x', 'y']]) // an unmarked collision still warns
  })
})

describe('active chrome distinctness', () => {
  const base = { color: 'rgb(1, 1, 1)', backgroundColor: 'rgb(2, 2, 2)', width: '10px', opacity: '1' }
  it('is false for identical styles and true for any visible difference', () => {
    expect(isDistinct(base, { ...base })).toBe(false)
    for (const k of Object.keys(base)) expect(isDistinct({ ...base, [k]: 'changed' }, base)).toBe(true)
  })
})

describe('attributionIssues', () => {
  const good = { fontSize: 12, color: 'rgb(185, 176, 156)', textDecorationLine: 'none' }
  it('flags missing, too small and browser-default attributions independently', () => {
    expect(attributionIssues(null)).toEqual(['is missing'])
    expect(attributionIssues(good)).toEqual([])
    expect(attributionIssues({ ...good, fontSize: 9 })).toEqual(['is too small (9px)'])
    expect(attributionIssues({ ...good, color: 'rgb(0, 0, 238)' })).toEqual(['uses the browser-default link color'])
    expect(attributionIssues({ fontSize: 9, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline' })).toHaveLength(2)
    expect(attributionIssues({ ...good, fontSize: 11 })).toEqual([])
  })
})

describe('diagnose', () => {
  const clean = { overlapItems: [], progress: null, toc: null, attribution: { fontSize: 12, color: 'rgb(9, 9, 9)', textDecorationLine: 'none' } }
  const style = { color: 'a', width: '1px' }

  it('is silent for a clean step', () => {
    expect(diagnose(clean, 3)).toEqual([])
  })

  it('prefixes step-specific advisory warnings for each defect', () => {
    const snap = {
      overlapItems: [item('<p> "caption"', 0, 0, 100, 20), item('<span> "label"', 10, 5, 100, 20)],
      progress: { active: style, inactive: style },
      toc: { active: style, inactive: style },
      attribution: { fontSize: 8, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline' },
    }
    const out = diagnose(snap, 4)
    expect(out.every((w) => w.startsWith('WARN step 4: '))).toBe(true)
    expect(out.some((w) => w.includes('<p> "caption"') && w.includes('<span> "label"') && w.includes('data-presentation-allow-overlap'))).toBe(true)
    expect(out.some((w) => /progress indicator is visually indistinct/.test(w))).toBe(true)
    expect(out.some((w) => /table-of-contents entry is visually indistinct/.test(w))).toBe(true)
    expect(out.some((w) => /attribution.*too small.*browser-default.*data-presentation-attribution/.test(w))).toBe(true)
  })

  it('does not warn for distinct chrome', () => {
    const pair = { active: style, inactive: { ...style, width: '2px' } }
    expect(diagnose({ ...clean, progress: pair, toc: pair }, 1)).toEqual([])
  })
})

describe('arguments', () => {
  it('applies defaults and overrides', () => {
    expect(parseInspectArgs(['deck'])).toMatchObject({ slug: 'deck', width: 1440, height: 900, settleMs: 1200 })
    expect(parseInspectArgs(['deck', '--viewport', '390x844', '--settle-ms', '300'])).toMatchObject({
      width: 390, height: 844, settleMs: 300,
    })
  })

  it.each([[[]], [['deck', '--viewport', 'wide']], [['deck', '--settle-ms', 'x']], [['deck', '--wat']], [['a', 'b']]])(
    'rejects %j',
    (argv) => expect(() => parseInspectArgs(argv)).toThrow(),
  )

  it('names screenshots with one-based two-digit numbers', () => {
    expect([stepFileName(1), stepFileName(9), stepFileName(12)]).toEqual(['step-01.png', 'step-09.png', 'step-12.png'])
  })
})

describe('captureSteps', () => {
  function run(opts: { warnAt?: number } = {}) {
    const events: string[] = []
    const page = {
      keyboard: { press: async (k: string) => void events.push(`press ${k}`) },
      waitForTimeout: async (ms: number) => void events.push(`settle ${ms}`),
      screenshot: async ({ path }: { path: string }) => void events.push(`shot ${path}`),
      evaluate: async () => ({ overlapItems: [], progress: null, toc: null, attribution: { fontSize: opts.warnAt ? 8 : 12, color: 'x', textDecorationLine: 'none' } }),
    }
    const log = vi.fn()
    const done = captureSteps(page, {
      count: 3, settleMs: 700, shotPath: (n: number) => `s${n}.png`, snapshot: () => ({}),
      waitForStep: async (i: number) => void events.push(`step ${i}`), log,
    })
    return { events, done, log }
  }

  it('settles before every capture, including the first, and only after navigation completes', async () => {
    const { events, done } = run()
    await done
    expect(events).toEqual([
      'settle 700', 'shot s1.png',
      'press ArrowRight', 'step 1', 'settle 700', 'shot s2.png',
      'press ArrowRight', 'step 2', 'settle 700', 'shot s3.png',
    ])
  })

  it('collects warnings without failing and keeps capturing', async () => {
    const { events, done, log } = run({ warnAt: 1 })
    const warnings = await done
    expect(warnings).toHaveLength(3)
    expect(log).toHaveBeenCalledTimes(3)
    expect(warnings[2]).toMatch(/^WARN step 3:/)
    expect(events.filter((e) => e.startsWith('shot'))).toHaveLength(3)
  })
})
