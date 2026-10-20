// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import {
  ACTIVE_STYLE_PROPS,
  DEFAULTS,
  activeChromeWarnings,
  analyzeMeasurements,
  attributionWarnings,
  captureSteps,
  formatWarnings,
  inspect,
  overlapWarnings,
  parseArgs,
  stepFileName,
} from '../../scripts/inspect-presentation.mjs'

const rect = (x: number, y: number, width = 100, height = 20) => ({ x, y, width, height })
const item = (id: number, label: string, r: ReturnType<typeof rect>, extra = {}) => ({ id, label, rect: r, allowed: false, ancestors: [], ...extra })

describe('overlap diagnostics', () => {
  it('warns about intersections over 2px on both axes, naming both elements', () => {
    const warnings = overlapWarnings([item(0, 'title "A"', rect(0, 0)), item(1, 'caption "B"', rect(50, 10))])
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('title "A"')
    expect(warnings[0]).toContain('caption "B"')
  })

  it('ignores touching, sub-threshold, and non-intersecting boxes', () => {
    const a = item(0, 'a', rect(0, 0))
    expect(overlapWarnings([a, item(1, 'b', rect(100, 0))])).toEqual([])
    expect(overlapWarnings([a, item(1, 'b', rect(98, 0))])).toEqual([])
    expect(overlapWarnings([a, item(1, 'b', rect(97, 0))])).toHaveLength(1)
    expect(overlapWarnings([a, item(1, 'b', rect(0, 100))])).toEqual([])
    expect(overlapWarnings([a, item(1, 'b', rect(0, 19))])).toEqual([])
  })

  it('exempts allow-overlap subtrees but still reports unrelated collisions', () => {
    const items = [
      item(0, 'socket', rect(0, 0), { allowed: true }),
      item(1, 'card', rect(10, 5)),
      item(2, 'title', rect(500, 500)),
      item(3, 'caption', rect(510, 505)),
    ]
    const warnings = overlapWarnings(items)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('title')
  })

  it('skips pairs where one element contains the other', () => {
    expect(overlapWarnings([item(0, 'outer', rect(0, 0), {}), item(1, 'inner', rect(5, 5), { ancestors: [0] })])).toEqual([])
  })
})

const style = (over: Record<string, string> = {}) =>
  Object.fromEntries(ACTIVE_STYLE_PROPS.map((p) => [p, over[p] ?? 'same']))

describe('active chrome diagnostics', () => {
  it('warns when the active control is computed-style identical to all inactive ones', () => {
    const groups = [{ name: 'progress indicator', active: style(), inactive: [style(), style()] }]
    expect(activeChromeWarnings(groups)[0]).toContain('progress indicator')
  })

  it('is satisfied by a difference in any single compared property', () => {
    for (const prop of ACTIVE_STYLE_PROPS) {
      const groups = [{ name: 'x', active: style({ [prop]: 'other' }), inactive: [style()] }]
      expect(activeChromeWarnings(groups), prop).toEqual([])
    }
  })

  it('treats a width-only difference as distinct for controls without text', () => {
    const pill = [{ name: 'progress indicator', active: style({ width: '30px' }), inactive: [style({ width: '14px' }), style({ width: '14px' })] }]
    expect(activeChromeWarnings(pill)).toEqual([])
  })

  it('ignores width differences that only reflect different label lengths', () => {
    const labels = [{ name: 'table-of-contents entry', textDriven: true, active: style({ width: '90px' }), inactive: [style({ width: '40px' }), style({ width: '60px' })] }]
    expect(activeChromeWarnings(labels)).toHaveLength(1)
    const styled = [{ name: 'table-of-contents entry', textDriven: true, active: style({ width: '90px', color: 'red' }), inactive: [style({ width: '40px' }), style({ width: '60px' })] }]
    expect(activeChromeWarnings(styled)).toEqual([])
  })

  it('checks every chrome group, not only the first', () => {
    const groups = [
      { name: 'progress indicator', active: style({ color: 'red' }), inactive: [style()] },
      { name: 'table-of-contents entry', active: style(), inactive: [style()] },
    ]
    const warnings = activeChromeWarnings(groups)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('table-of-contents entry')
  })

  it('skips groups with no active or no inactive controls', () => {
    expect(activeChromeWarnings([{ name: 'a', active: null, inactive: [style()] }, { name: 'b', active: style(), inactive: [] }])).toEqual([])
  })
})

describe('attribution diagnostics', () => {
  const good = { fontSizePx: 13, color: 'rgb(167, 176, 184)', hasAuthorRule: true }

  it('accepts a styled, legible attribution', () => {
    expect(attributionWarnings(good)).toEqual([])
  })

  it('warns about undersized text', () => {
    expect(attributionWarnings({ ...good, fontSizePx: 11.9 })[0]).toContain('too small')
    expect(attributionWarnings({ ...good, fontSizePx: 12 })).toEqual([])
  })

  it('warns about browser-default link colors, visited or not', () => {
    expect(attributionWarnings({ ...good, color: 'rgb(0, 0, 238)' })[0]).toContain('browser-default')
    expect(attributionWarnings({ ...good, color: 'rgb(85, 26, 139)' })[0]).toContain('browser-default')
  })

  it('warns when no author rule targets it, pointing at the styling hook', () => {
    const [warning] = attributionWarnings({ ...good, hasAuthorRule: false })
    expect(warning).toContain('data-presentation-attribution')
  })

  it('warns when the attribution is missing instead of skipping the check', () => {
    const [warning] = attributionWarnings(null)
    expect(warning).toContain('missing')
    expect(warning).toContain('data-presentation-attribution')
  })

  it('combines all diagnostics for a page', () => {
    const warnings = analyzeMeasurements({
      items: [item(0, 'a', rect(0, 0)), item(1, 'b', rect(10, 5))],
      groups: [{ name: 'progress indicator', active: style(), inactive: [style()] }],
      attribution: null,
    })
    expect(warnings).toHaveLength(3)
  })
})

describe('warning output', () => {
  it('merges repeated warnings into the first step plus the others', () => {
    const lines = formatWarnings([
      { step: 2, message: 'm' },
      { step: 3, message: 'm' },
      { step: 3, message: 'other' },
    ])
    expect(lines).toEqual(['WARN step 2: m (also steps 3)', 'WARN step 3: other'])
  })

  it('numbers screenshots predictably', () => {
    expect(stepFileName(1)).toBe('step-01.png')
    expect(stepFileName(12)).toBe('step-12.png')
  })
})

describe('captureSteps settling', () => {
  it('waits the settle interval after each step change and before analysis and capture', async () => {
    let clock = 0
    const events: string[] = []
    const result = await captureSteps({
      count: 3,
      settleMs: 700,
      now: () => clock,
      sleep: async (ms: number) => {
        events.push(`sleep ${ms}`)
        clock += ms
      },
      advance: async () => void events.push('advance'),
      waitForIndex: async (i: number) => void events.push(`index ${i}`),
      analyze: async (i: number) => {
        events.push(`analyze ${i}`)
        return i === 1 ? ['careful'] : []
      },
      shoot: async (step: number) => void events.push(`shoot ${step}`),
    })
    expect(events).toEqual([
      'sleep 700', 'analyze 0', 'shoot 1',
      'advance', 'index 1', 'sleep 700', 'analyze 1', 'shoot 2',
      'advance', 'index 2', 'sleep 700', 'analyze 2', 'shoot 3',
    ])
    expect(result.captures.map((c) => c.settledMs)).toEqual([700, 700, 700])
    expect(result.warnings).toEqual([{ step: 2, message: 'careful' }])
  })

  it('propagates a capture failure instead of swallowing it', async () => {
    await expect(
      captureSteps({
        count: 2, settleMs: 0, now: () => 0, sleep: async () => {}, advance: async () => {}, waitForIndex: async () => {},
        analyze: async () => [],
        shoot: async (step: number) => {
          if (step === 2) throw new Error('disk full')
        },
      }),
    ).rejects.toThrow('disk full')
  })
})

describe('arguments and failure outcome', () => {
  it('parses the documented options and defaults', () => {
    expect(parseArgs(['talk'])).toMatchObject({ slug: 'talk', narrow: false, build: true, settleMs: DEFAULTS.settleMs })
    expect(parseArgs(['talk', '--narrow', '--no-build', '--settle-ms', '250'])).toMatchObject({ narrow: true, build: false, settleMs: 250 })
    expect(DEFAULTS.desktop).toEqual({ width: 1440, height: 900 })
    expect(DEFAULTS.narrow).toEqual({ width: 390, height: 844 })
    expect(DEFAULTS.settleMs).toBe(1000)
  })

  it('rejects unknown flags and bad settle values', () => {
    expect(() => parseArgs(['talk', '--bogus'])).toThrow('unknown argument')
    expect(() => parseArgs(['talk', '--settle-ms', 'x'])).toThrow('--settle-ms')
  })

  it('exits non-zero with a capture failure for an unregistered slug', async () => {
    const log = vi.fn()
    expect(await inspect(['not-a-slug', '--no-build'], { log })).toBe(1)
    expect(log.mock.calls.flat().join('\n')).toMatch(/FAIL capture: .*how-to-make-a-presentation/)
  })
})
