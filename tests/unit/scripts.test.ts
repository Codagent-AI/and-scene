import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error plain ES modules without type declarations
import * as verify from '../../scripts/verify.mjs'
// @ts-expect-error plain ES modules without type declarations
import * as inspect from '../../scripts/inspect-presentation.mjs'
// @ts-expect-error plain ES modules without type declarations
import * as preview from '../../scripts/lib/preview.mjs'

const outline = () => verify.NORMATIVE_OUTLINE.map((s: object) => ({ ...s }))

describe('verify: reference sample checks', () => {
  it('accepts the normative outline', () => {
    expect(() => verify.validateOutline(outline())).not.toThrow()
    expect(verify.NORMATIVE_OUTLINE).toHaveLength(9)
  })

  const fail = (mutate: (o: Array<Record<string, string>>) => Array<Record<string, string>>, message: RegExp) => {
    let error: unknown
    try {
      verify.validateOutline(mutate(outline()))
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(verify.VerifyFailure)
    expect((error as { phase: string }).phase).toBe('sample')
    expect((error as Error).message).toMatch(message)
  }

  it('rejects a wrong count, changed title/caption/era, and reordered steps', () => {
    fail((o) => o.slice(0, 8), /8 steps, expected 9/)
    fail((o) => [...o, { ...o[0] }], /10 steps/)
    fail((o) => o.map((x, i) => (i === 3 ? { ...x, title: 'The deck shrinks' } : x)), /step 4 title/)
    fail((o) => o.map((x, i) => (i === 6 ? { ...x, caption: x.caption + '!' } : x)), /step 7 caption/)
    fail((o) => o.map((x, i) => (i === 8 ? { ...x, era: 'the end' } : x)), /step 9 era/)
    fail((o) => [o[1], o[0], ...o.slice(2)], /step 1 title/)
  })

  const REGISTRY = `export const presentations = [
  { slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./x') },
  { slug: 'other', title: "Other's \\"deck\\"", load: () => import('./y') },
]`

  it('parses the explicit registry and checks the sample is registered', () => {
    expect(verify.parseRegistry(REGISTRY).map((e: { slug: string }) => e.slug)).toEqual(['how-to-make-a-presentation', 'other'])
    expect(() => verify.checkSampleRegistered(REGISTRY)).not.toThrow()
  })

  it('fails when the sample is missing or retitled', () => {
    expect(() => verify.checkSampleRegistered("export const presentations = [{ slug: 'other', title: 'Other', load: () => import('./y') }]")).toThrow(/not registered/)
    expect(() => verify.checkSampleRegistered(REGISTRY.replace('How to Use This Skill to Make a Presentation', 'Nope'))).toThrow(/expected "How to Use/)
    expect(() => verify.checkSampleRegistered('')).toThrow(verify.VerifyFailure)
  })

  const entries = (source: string) => verify.parseRegistry(source).map((e: { slug: string; title: string }) => [e.slug, e.title])

  it('reads registry entries whatever the quote style, property order, or layout', () => {
    expect(entries(`export const presentations = [{ title: "Double", slug: "dq", load: () => import("./a") }]`)).toEqual([['dq', 'Double']])
    expect(entries('export const presentations = [{\n  load: () => import(`./a`),\n  title: `Tick`,\n  slug: `tk`,\n}]')).toEqual([['tk', 'Tick']])
    expect(entries(REGISTRY + "\nconst more = [{ slug : 'extra' , title : 'Extra', load: () => import('./z') }]").map(([s]: string[]) => s)).toEqual(['how-to-make-a-presentation', 'other', 'extra'])
    expect(() => verify.checkSampleRegistered(`export const p = [{ load: () => import("./x"), title: "How to Use This Skill to Make a Presentation", slug: "how-to-make-a-presentation" }]`)).not.toThrow()
  })

  it('ignores the entry interface but fails loudly instead of silently skipping an unreadable entry', () => {
    expect(entries("export interface PresentationEntry { slug: string; title: string }\nexport const p = [{ slug: 'a', title: 'A', load: () => import('./a') }]")).toEqual([['a', 'A']])
    expect(() => verify.parseRegistry("const slugs = ['a']\nexport const p = [{ slug: slugs[0], title: 'A', load: () => import('./a') }]")).toThrow(verify.VerifyFailure)
    expect(() => verify.parseRegistry("export const p = [{ slug: 'a', title: makeTitle(), load: () => import('./a') }]")).toThrow(/cannot read a registry entry/)
    expect(() => verify.parseRegistry("export const p = [{ slug: 'a', title: 'A', load: () => import('./a') }, { slug: dyn }]")).toThrow(verify.VerifyFailure)
  })

  it('is wired to the real registry source', () => {
    const real = readFileSync('src/presentations/index.ts', 'utf8')
    expect(() => verify.checkSampleRegistered(real)).not.toThrow()
  })
})


function fakePage() {
  const page = new EventEmitter() as EventEmitter & { on: EventEmitter['on'] }
  return page
}
const consoleMsg = (type: string, text: string) => ({ type: () => type, text: () => text })

describe('verify: browser error collection', () => {
  it.each([0, 4, 8])('a console.error surfacing on step %i fails the render phase naming that step', (step) => {
    const page = fakePage()
    const collector = verify.createErrorCollector(page)
    page.emit('console', consoleMsg('error', 'boom'))
    let error: { phase: string; step: number; message: string } | undefined
    try {
      collector.assertClean(step)
    } catch (e) {
      error = e as typeof error
    }
    expect(error).toBeInstanceOf(verify.VerifyFailure)
    expect(error).toMatchObject({ phase: 'render', step })
    expect(error!.message).toContain('console.error')
    expect(error!.message).toContain('boom')
  })

  it.each([0, 3, 8])('an uncaught page error surfacing on step %i fails the render phase naming that step', (step) => {
    const page = fakePage()
    const collector = verify.createErrorCollector(page)
    page.emit('pageerror', new Error('uncaught'))
    let error: { phase: string; step: number; message: string } | undefined
    try {
      collector.assertClean(step)
    } catch (e) {
      error = e as typeof error
    }
    expect(error).toMatchObject({ phase: 'render', step })
    expect(error!.message).toMatch(/pageerror on step index .*uncaught/)
  })

  it('stays clean until an error arrives, then fails every later check', () => {
    const page = fakePage()
    const collector = verify.createErrorCollector(page)
    expect(() => collector.assertClean(0)).not.toThrow()
    page.emit('pageerror', new Error('late'))
    expect(() => collector.assertClean(1)).toThrow(/step index 1/)
    expect(() => collector.assertClean(2)).toThrow(/step index 2/)
  })

  it('ignores non-error console output and passes when nothing was recorded', () => {
    const page = fakePage()
    const collector = verify.createErrorCollector(page)
    page.emit('console', consoleMsg('log', 'hello'))
    page.emit('console', consoleMsg('warning', 'careful'))
    expect(() => collector.assertClean(0)).not.toThrow()
  })
})

describe('loopback and provisioning', () => {
  it('builds IPv4 loopback URLs and never uses localhost in automation scripts', () => {
    expect(preview.LOOPBACK).toBe('127.0.0.1')
    expect(preview.loopbackUrl(4173, '/x')).toBe('http://127.0.0.1:4173/x')
    for (const file of ['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs']) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/localhost|\[::1\]/)
    }
    expect(readFileSync('scripts/lib/preview.mjs', 'utf8')).toMatch(/'--host', LOOPBACK/)
  })

  it('plans a Chromium install only when the executable is missing', () => {
    expect(preview.chromiumInstallPlan('/cache/chrome', () => true)).toEqual({ install: false })
    expect(preview.chromiumInstallPlan('/cache/chrome', () => false)).toEqual({ install: true, command: ['npx', 'playwright', 'install', 'chromium'] })
    expect(preview.chromiumInstallPlan('', () => true).install).toBe(true)
    expect(preview.chromiumInstallPlan(undefined, () => true).install).toBe(true)
  })
})

describe('inspect: settle scheduling', () => {
  it('does not capture before the deadline and does afterwards', async () => {
    let now = 1000
    const slept: number[] = []
    const clock = { now: () => now, sleep: vi.fn(async (ms: number) => { slept.push(ms); now += Math.min(ms, 300) }) }
    await inspect.waitUntilSettled(clock, 1000, 1000)
    expect(now).toBeGreaterThanOrEqual(2000)
    expect(slept[0]).toBe(1000)
    expect(slept.length).toBeGreaterThan(1)
  })

  it('does not wait when the interval already passed or is zero', async () => {
    const clock = { now: () => 5000, sleep: vi.fn(async () => {}) }
    await inspect.waitUntilSettled(clock, 1000, 1000)
    await inspect.waitUntilSettled(clock, 5000, 0)
    expect(clock.sleep).not.toHaveBeenCalled()
  })

  it('names screenshots predictably and parses options', () => {
    expect(inspect.screenshotName(0)).toBe('step-01.png')
    expect(inspect.screenshotName(11)).toBe('step-12.png')
    expect(inspect.parseArgs(['demo'])).toMatchObject({ slug: 'demo', viewport: { width: 1440, height: 900 }, settleMs: 1000, outDir: '.inspection', skipBuild: false })
    expect(inspect.parseArgs(['demo', '--viewport', '390x844', '--settle', '50', '--out', 'o', '--skip-build'])).toMatchObject({ viewport: { width: 390, height: 844 }, settleMs: 50, outDir: 'o', skipBuild: true })
    expect(() => inspect.parseArgs([])).toThrow(/usage/)
    expect(() => inspect.parseArgs(['x', '--viewport', 'wide'])).toThrow(/invalid --viewport/)
    expect(() => inspect.parseArgs(['x', '--nope'])).toThrow(/unknown option/)
    expect(() => inspect.parseArgs(['x', '--settle', '-1'])).toThrow(/--settle/)
  })
})

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })
const item = (label: string, r: ReturnType<typeof rect>, extra: object = {}) => ({ label, rect: r, visible: true, allowed: false, ...extra })

describe('inspect: overlap geometry', () => {
  it('reports intersecting boxes, not touching or distant ones', () => {
    expect(inspect.intersectionArea(rect(0, 0, 10, 10), rect(5, 5, 10, 10))).toBe(25)
    expect(inspect.intersectionArea(rect(0, 0, 10, 10), rect(10, 0, 10, 10))).toBe(0)
    expect(inspect.intersectionArea(rect(0, 0, 10, 10), rect(50, 50, 5, 5))).toBe(0)
    const found = inspect.findOverlaps([item('A', rect(0, 0, 10, 10)), item('B', rect(5, 5, 10, 10)), item('C', rect(15, 0, 10, 10)), item('D', rect(100, 100, 5, 5))])
    expect(found).toEqual([['A', 'B']])
  })

  it('skips hidden and zero-area items', () => {
    expect(inspect.findOverlaps([item('A', rect(0, 0, 10, 10)), item('B', rect(0, 0, 10, 10), { visible: false })])).toEqual([])
    expect(inspect.findOverlaps([item('A', rect(0, 0, 10, 10)), item('B', rect(2, 2, 0, 5))])).toEqual([])
  })

  it('exempts items inside an allow-overlap subtree without hiding unrelated collisions', () => {
    const items = [
      item('P', rect(0, 0, 50, 20), { allowed: true }),
      item('Q', rect(10, 5, 50, 20), { allowed: true }),
      item('X', rect(200, 0, 50, 20)),
      item('Y', rect(210, 5, 50, 20)),
    ]
    expect(inspect.findOverlaps(items)).toEqual([['X', 'Y']])
  })

  it('does not treat a control and its own text, or any nested pair, as a collision', () => {
    const button = item('<button> "Next"', rect(0, 0, 80, 30), { id: 0, containedBy: [] })
    const text = item('<button> "Next" text', rect(10, 5, 40, 18), { id: 1, containedBy: [0] })
    expect(inspect.findOverlaps([button, text])).toEqual([])
    const other = item('Scene label', rect(60, 10, 60, 18), { id: 2, containedBy: [] })
    expect(inspect.findOverlaps([button, text, other])).toEqual([['<button> "Next"', 'Scene label']])
  })

  it('reports a scene item colliding with the full box of an icon-only control', () => {
    const icon = item('<button>', rect(100, 100, 40, 40), { id: 0, containedBy: [] })
    const label = item('Scene label', rect(120, 110, 80, 16), { id: 1, containedBy: [] })
    expect(inspect.findOverlaps([icon, label])).toHaveLength(1)
  })

  it('considers scene text and chrome in the same pass', () => {
    const scene = item('<span id=e> "text"', rect(0, 0, 100, 20))
    const chrome = item('<footer data-presentation-footer> "caption"', rect(50, 10, 100, 20))
    expect(inspect.findOverlaps([scene, chrome])).toHaveLength(1)
  })
})

const style = (over: object = {}) => ({ color: 'rgb(1, 1, 1)', backgroundColor: 'rgba(0, 0, 0, 0)', borderColor: 'rgb(1, 1, 1)', outline: 'none', fontWeight: '400', opacity: '1', width: '10px', height: '10px', boxShadow: 'none', ...over })

describe('inspect: active chrome distinctness', () => {
  it('flags an active item identical to its inactive siblings', () => {
    expect(inspect.activeIsDistinct(style(), [style(), style()])).toBe(false)
  })

  it.each([
    ['color', { color: 'rgb(9, 9, 9)' }],
    ['background', { backgroundColor: 'rgb(9, 9, 9)' }],
    ['border', { borderColor: 'rgb(9, 9, 9)' }],
    ['outline', { outline: '2px solid red' }],
    ['weight', { fontWeight: '700' }],
    ['opacity', { opacity: '0.4' }],
    ['size', { width: '24px' }],
    ['shadow', { boxShadow: '0 0 4px red' }],
  ])('treats a difference in %s as distinct', (_name, over) => {
    expect(inspect.activeIsDistinct(style(over), [style(), style()])).toBe(true)
  })

  it('requires a difference from every inactive sibling', () => {
    expect(inspect.activeIsDistinct(style({ color: 'red' }), [style(), style({ color: 'red' })])).toBe(false)
  })
})

describe('inspect: attribution diagnostics', () => {
  const browserDefault = { color: 'rgb(0, 0, 238)', fontSize: '16px', fontFamily: 'serif', textDecorationLine: 'underline', padding: '0px', fontWeight: '400' }

  it('reports a missing attribution', () => {
    expect(inspect.attributionIssues(null, browserDefault)).toEqual(['is missing'])
  })

  it('reports undersized and browser-default attributions independently', () => {
    expect(inspect.attributionIssues({ ...browserDefault, color: 'rgb(200, 200, 200)', fontSize: '9px' }, browserDefault)).toEqual([expect.stringMatching(/undersized \(9px/)])
    expect(inspect.attributionIssues(browserDefault, browserDefault)).toEqual([expect.stringMatching(/browser-default/)])
    const tiny = { ...browserDefault, fontSize: '10px' }
    expect(inspect.attributionIssues(tiny, tiny)).toHaveLength(2)
  })

  it('still warns when only non-color properties were restyled and the default link color remains', () => {
    for (const changed of [{ padding: '8px 14px' }, { fontWeight: '700' }, { fontFamily: 'monospace' }, { textDecorationLine: 'none' }, { fontSize: '14px' }]) {
      expect(inspect.attributionIssues({ ...browserDefault, ...changed }, browserDefault), JSON.stringify(changed)).toEqual([expect.stringMatching(/browser-default link color/)])
    }
  })

  it('passes a legible locally styled attribution', () => {
    expect(inspect.attributionIssues({ ...browserDefault, color: 'rgb(170, 160, 140)', fontSize: '13px', textDecorationLine: 'none', padding: '8px 14px' }, browserDefault)).toEqual([])
  })

  it('diagnose attaches the step number and styling hooks to each warning kind', () => {
    const data = {
      items: [item('A', rect(0, 0, 10, 10)), item('B', rect(1, 1, 10, 10))],
      chrome: [{ name: 'progress indicator', active: style(), inactive: [style()] }],
      attribution: null,
      browserDefault: {},
    }
    const warnings: string[] = inspect.diagnose(2, data)
    expect(warnings).toHaveLength(3)
    expect(warnings[0]).toMatch(/^step 3: overlap between A and B.*data-presentation-allow-overlap/)
    expect(warnings[1]).toMatch(/^step 3: active progress indicator.*data-presentation-active/)
    expect(warnings[2]).toMatch(/^step 3: attribution is missing.*\[data-presentation-attribution\]/)
  })
})
