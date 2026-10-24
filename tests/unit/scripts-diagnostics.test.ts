// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findAttributionIssues, findClippedChrome, findIndistinctActive, findOverlaps } from '../../scripts/lib/diagnostics.mjs'
import { parseSlugs } from '../../scripts/lib/registry.mjs'
import { settleThenCapture } from '../../scripts/lib/settle.mjs'

const el = (id: number, label: string, x: number, y: number, w = 100, h = 20, extra = {}) => ({
  id,
  label,
  rect: { x, y, w, h },
  ancestors: [] as number[],
  allowed: false,
  ...extra,
})

describe('findOverlaps', () => {
  it('reports colliding text/chrome elements', () => {
    const w = findOverlaps([el(1, 'title', 0, 0), el(2, 'caption', 50, 10)])
    expect(w).toEqual([{ a: 'title', b: 'caption' }])
  })

  it('ignores separated and merely touching elements', () => {
    expect(findOverlaps([el(1, 'a', 0, 0), el(2, 'b', 0, 40), el(3, 'c', 100, 0)])).toEqual([])
  })

  it('ignores elements inside an allow-overlap subtree', () => {
    const w = findOverlaps([el(1, 'a', 0, 0, 100, 20, { allowed: true }), el(2, 'b', 10, 5)])
    expect(w).toEqual([])
  })

  it('reports text colliding with a control\'s box even outside its own text', () => {
    // A button\'s full rect (padding included) is its own entry besides its text.
    const button = el(1, 'button', 0, 0, 200, 60)
    const buttonText = el(1, 'button text', 80, 20, 40, 18)
    const intruder = el(2, 'intruder', 185, 8, 10, 14)
    expect(findOverlaps([button, buttonText, intruder])).toEqual([{ a: 'button', b: 'intruder' }])
  })

  it('never reports an element\'s text against its own box', () => {
    expect(findOverlaps([el(1, 'button', 0, 0, 200, 60), el(1, 'button text', 80, 20, 40, 18)])).toEqual([])
  })

  it('ignores ancestor/descendant pairs', () => {
    expect(findOverlaps([el(1, 'outer', 0, 0), el(2, 'inner', 5, 5, 20, 10, { ancestors: [1] })])).toEqual([])
  })
})

describe('findIndistinctActive', () => {
  const item = (active: boolean, style: object) => ({ active, style })
  it('flags a group whose active item looks like the inactive ones', () => {
    const s = { color: 'red' }
    expect(findIndistinctActive([{ name: 'progress indicator', items: [item(true, s), item(false, s)] }])).toEqual([
      { chrome: 'progress indicator' },
    ])
  })

  it('accepts a visibly different active item', () => {
    expect(
      findIndistinctActive([
        { name: 'table of contents', items: [item(true, { color: 'gold' }), item(false, { color: 'grey' })] },
      ]),
    ).toEqual([])
  })

  it('skips groups with no active or no inactive items', () => {
    expect(findIndistinctActive([{ name: 'x', items: [item(false, {})] }, { name: 'y', items: [item(true, {})] }])).toEqual([])
  })
})

describe('findAttributionIssues', () => {
  it('reports a missing attribution', () => {
    expect(findAttributionIssues(null)).toHaveLength(1)
  })

  it('reports a too-small attribution', () => {
    const issues = findAttributionIssues({ fontSize: 9, color: 'rgb(1, 2, 3)', height: 11 })
    expect(issues.join()).toMatch(/too small/)
  })

  it('reports a browser-default link colour', () => {
    const issues = findAttributionIssues({ fontSize: 16, color: 'rgb(0, 0, 238)', height: 20 })
    expect(issues.join()).toMatch(/browser-default/)
  })

  it('accepts a polished attribution', () => {
    expect(findAttributionIssues({ fontSize: 13, color: 'rgb(185, 176, 155)', height: 24 })).toEqual([])
  })
})

describe('findClippedChrome', () => {
  it('lists each clipped container once', () => {
    expect(findClippedChrome(['data-presentation-footer', 'data-presentation-footer'])).toEqual(['data-presentation-footer'])
    expect(findClippedChrome([])).toEqual([])
  })
})

describe('settleThenCapture', () => {
  it('captures only after the settle interval has elapsed', async () => {
    let clock = 0
    const events: string[] = []
    const elapsed = await settleThenCapture({
      settleMs: 750,
      now: () => clock,
      sleep: async (ms: number) => {
        events.push(`sleep ${ms}`)
        clock += ms
      },
      capture: async () => {
        events.push(`capture at ${clock}`)
      },
    })
    expect(events).toEqual(['sleep 750', 'capture at 750'])
    expect(elapsed).toBe(750)
  })
})

describe('registry parsing', () => {
  it('reads slugs in order from the registry source', () => {
    const src = `[{ slug: 'a', title: 'A' }, { slug: "b-c", title: 'B' }]`
    expect(parseSlugs(src)).toEqual(['a', 'b-c'])
  })
})

describe('loopback addressing', () => {
  it('never uses "localhost" in verification or inspection scripts', () => {
    const dir = path.resolve(import.meta.dirname, '../../scripts')
    const files = [
      path.join(dir, 'verify.mjs'),
      path.join(dir, 'inspect-presentation.mjs'),
      ...fs.readdirSync(path.join(dir, 'lib')).map((f) => path.join(dir, 'lib', f)),
    ]
    for (const f of files) expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(/localhost/)
  })
})
