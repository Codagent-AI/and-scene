// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import {
  CANONICAL_SAMPLE, VerifyError, checkOutline, checkRegistration, exitCodeFor, formatFailure, indexProblem, parseArgs as parseVerifyArgs,
} from '../../scripts/verify.mjs'
import {
  DEFAULT_SETTLE_MS, DISTINCT_PROPS, SLUG_PATTERN, inspect, MIN_ATTRIBUTION_FONT_PX, UA_LINK_COLOR, analyzeSnapshot, attributionIssues, captureSteps, findOverlaps,
  isIndistinct, parseArgs as parseInspectArgs, resolveSettle, screenshotName,
} from '../../scripts/inspect-presentation.mjs'
import { HOST, previewUrl } from '../../scripts/lib/preview.mjs'

const canonical = CANONICAL_SAMPLE.steps
const clone = () => canonical.map((s) => ({ ...s }))

describe('sample outline assertion (L-52, I-26)', () => {
  it('accepts the canonical outline', () => {
    expect(checkOutline(clone())).toEqual([])
  })
  it.each([
    ['missing outline', undefined, /missing/],
    ['wrong count', clone().slice(0, 8), /expected 9 steps, found 8/],
    ['extra step', [...clone(), clone()[0]], /expected 9 steps, found 10/],
  ])('rejects %s', (_n, outline, re) => {
    expect(checkOutline(outline as never).join('\n')).toMatch(re)
  })
  it.each(['era', 'title', 'caption'] as const)('rejects a wrong %s independently', (key) => {
    const o = clone()
    o[4]![key] = 'changed'
    const problems = checkOutline(o)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(new RegExp(`step 5 ${key}`))
  })
  it('rejects out-of-order steps', () => {
    const o = clone()
    ;[o[2], o[3]] = [o[3]!, o[2]!]
    expect(checkOutline(o).length).toBeGreaterThanOrEqual(2)
  })
  it('detects missing or unregistered samples in the registry source', () => {
    const ok = `export const presentations = [\n  {\n    slug: 'how-to-make-a-presentation',\n    title: 'How to Use This Skill to Make a Presentation',\n    load: () => import('./how-to-make-a-presentation/Talk'),\n  },\n]`
    expect(checkRegistration(ok, CANONICAL_SAMPLE)).toEqual([])
    expect(checkRegistration('export const presentations = []', CANONICAL_SAMPLE)[0]).toMatch(/not registered/)
    expect(checkRegistration(ok.replace('How to Use', 'Why to Use'), CANONICAL_SAMPLE)[0]).toMatch(/title/)
    expect(checkRegistration(ok.replace(/load:.*\n/, ''), CANONICAL_SAMPLE)[0]).toMatch(/lazy load/)
    expect(checkRegistration(ok, { slug: 'starter' })[0]).toMatch(/not registered/)
    const awkward = `export const presentations = [\n  {\n    slug: "odd",\n    title: "It's {x} } { \\"q\\"",\n    load: () => import('./odd/Talk'),\n  },\n  {\n    slug: "later",\n    title: "Later",\n    load: () => import('./later/Talk'),\n  },\n]`
    expect(checkRegistration(awkward, { slug: 'odd' })).toEqual([])
    expect(checkRegistration(awkward, { slug: 'later', title: 'Later' })).toEqual([])
    expect(checkRegistration(awkward.replace("import('./odd/Talk')", 'null'), { slug: 'odd' })[0]).toMatch(/no lazy load/)
    expect(checkRegistration(awkward.replace("import('./odd/Talk')", 'null'), { slug: 'later' })).toEqual([])
  })
  it('runs against the same data the built presentation derives its steps from', () => {
    expect(readFileSync('scripts/verify.mjs', 'utf8')).toMatch(/checkOutline\(mod\.OUTLINE\)/)
    expect(readFileSync('src/presentations/how-to-make-a-presentation/steps/index.ts', 'utf8')).toMatch(/OUTLINE\.map/)
  })
})

describe('verify reporting (L-56, L-57, I-30)', () => {
  it('compares the expected step index, rejecting skipped, stalled and missing indices', () => {
    expect(indexProblem(3, 3)).toBeNull()
    expect(indexProblem(3, 2)).toMatch(/expected 3 but was 2/)
    expect(indexProblem(3, 5)).toMatch(/expected 3 but was 5/)
    expect(indexProblem(3, null)).toMatch(/hook missing/)
    expect(indexProblem(0, Number.NaN)).toMatch(/hook missing/)
  })
  it('names the phase and step and maps failure to a non-zero exit', () => {
    expect(formatFailure(new VerifyError('render', 'boom', 3))).toBe('VERIFY FAIL phase=render step=4: boom')
    expect(formatFailure(new VerifyError('build', 'nope'))).toBe('VERIFY FAIL phase=build: nope')
    expect(formatFailure(new Error('x'))).toMatch(/phase=verify/)
    expect(exitCodeFor(undefined)).toBe(0)
    expect(exitCodeFor(new VerifyError('sample', 'x'))).toBe(1)
  })
  it('parses the route option', () => {
    expect(parseVerifyArgs([])).toEqual({ route: null })
    expect(parseVerifyArgs(['--route', 'starter'])).toEqual({ route: 'starter' })
  })
})

describe('driver structure (L-53, L-55, I-27, I-28)', () => {
  const src = readFileSync('scripts/verify.mjs', 'utf8')
  it('reads the step count from the hook and checks every index', () => {
    expect(src).toMatch(/data-step-count/)
    expect(src).toMatch(/for \(let i = 0; i < count; i\+\+\)/)
    expect(src).toMatch(/waitForIndex\(page, i\)/)
  })
  it('attaches error handlers before the first navigation and checks after each settled step', () => {
    expect(src.indexOf("page.on('console'")).toBeGreaterThan(-1)
    expect(src.indexOf("page.on('console'")).toBeLessThan(src.indexOf('await page.goto('))
    expect(src.indexOf("page.on('pageerror'")).toBeLessThan(src.indexOf('await page.goto('))
    expect(src).toMatch(/waitForTimeout\(SETTLE_MS\)\s+check\(\)/)
  })
  it('closes the browser and stops the preview in a finally block', () => {
    expect(src).toMatch(/finally \{\s+await browser\?\.close\(\)\s+await preview\.stop\(\)/)
  })
})

describe('IPv4 loopback (L-54, I-27)', () => {
  it('builds every URL on 127.0.0.1', () => {
    expect(HOST).toBe('127.0.0.1')
    expect(previewUrl(4173)).toBe('http://127.0.0.1:4173/')
    expect(previewUrl(4173, '/x')).toBe('http://127.0.0.1:4173/x')
  })
  it.each(['scripts/verify.mjs', 'scripts/inspect-presentation.mjs', 'scripts/lib/preview.mjs', 'skills/presentation/templates/bootstrap/scripts/verify.mjs'])('%s never uses localhost', (f) => {
    expect(readFileSync(f, 'utf8')).not.toMatch(/localhost|\[::1\]/)
  })
  it('binds the preview, the port probe and the readiness check to the same host', () => {
    const src = readFileSync('scripts/lib/preview.mjs', 'utf8')
    expect(src).toMatch(/'--host', HOST/)
    expect(src).toMatch(/server\.listen\(0, HOST/)
    expect(src).toMatch(/waitReady\(previewUrl\(port\)/)
  })
})

describe('inspect settle interval (L-60)', () => {
  it('prefers the CLI flag, then the environment, then the named default', () => {
    expect(resolveSettle([], {})).toBe(DEFAULT_SETTLE_MS)
    expect(resolveSettle([], { INSPECT_SETTLE_MS: '250' })).toBe(250)
    expect(resolveSettle(['--settle', '90'], { INSPECT_SETTLE_MS: '250' })).toBe(90)
    expect(resolveSettle(['--settle', 'x'], { INSPECT_SETTLE_MS: 'y' })).toBe(DEFAULT_SETTLE_MS)
  })
  it('parses slug, flags and output directory', () => {
    expect(parseInspectArgs(['demo', '--narrow', '--settle', '5', '--no-build'], {})).toMatchObject({ slug: 'demo', narrow: true, noBuild: true, settleMs: 5, outDir: 'inspection' })
    expect(parseInspectArgs(['--out', 'x', 'demo'], {}).slug).toBe('demo')
  })
  it('rejects --out without a value and slugs that could escape the project', async () => {
    expect(() => parseInspectArgs(['demo', '--out'], {})).toThrow(/--out requires a directory/)
    expect(() => parseInspectArgs(['demo', '--out', '--narrow'], {})).toThrow(/--out requires/)
    for (const slug of ['../../x', 'a/b', 'A', '-a', 'a--b', '']) {
      await expect(inspect({ slug, noBuild: true, root: '/nonexistent' })).rejects.toThrow(slug ? /invalid slug/ : /usage/)
    }
    expect(SLUG_PATTERN.test('how-to-make-a-presentation')).toBe(true)
  })
  it('names screenshots predictably', () => {
    expect(screenshotName(0)).toBe('step-01.png')
    expect(screenshotName(11)).toBe('step-12.png')
  })
  it('confirms the index, then waits the settle interval, then captures, for every step', async () => {
    const events: string[] = []
    let index = 0
    const page = {
      keyboard: { press: async () => void (events.push('press'), index++) },
      getAttribute: async () => String(index),
      waitForTimeout: async (ms: number) => void events.push(`wait:${ms}`),
      screenshot: async ({ path }: { path: string }) => void events.push(`shot:${path.split('/').pop()}`),
      evaluate: async () => ({ items: [], activeChrome: [], attribution: { fontSizePx: 14, color: 'rgb(0, 0, 0)', textDecorationLine: 'none' } }),
    }
    const log: unknown[] = []
    await captureSteps(page, { count: 3, settleMs: 321, dir: '/tmp/x', onWarning: vi.fn(), log })
    expect(events.filter((e) => e !== 'wait:50')).toEqual(['wait:321', 'shot:step-01.png', 'press', 'wait:321', 'shot:step-02.png', 'press', 'wait:321', 'shot:step-03.png'])
    expect(log).toHaveLength(3)
  })
  it('fails when a step never becomes active', async () => {
    const page = { keyboard: { press: async () => {} }, getAttribute: async () => '0', waitForTimeout: async () => {}, screenshot: async () => {}, evaluate: async () => ({ items: [], activeChrome: [], attribution: null }) }
    await expect(captureSteps(page, { count: 2, settleMs: 0, dir: '/tmp/x', onWarning: vi.fn(), log: [], stepTimeoutMs: 120 })).rejects.toThrow(/step 2 did not become active/)
  })
})

const r = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom })
const item = (name: string, rect: ReturnType<typeof r>, extra: object = {}) => ({ name, rect, visible: true, allowed: false, ancestors: [], ...extra })

describe('overlap diagnostics (L-61, L-62, I-33)', () => {
  it('reports intersecting or nested visible text/chrome of unrelated elements and ignores disjoint and hidden ones', () => {
    const pairs = findOverlaps([
      item('a', r(0, 0, 100, 20)),
      item('b', r(50, 10, 150, 30)),
      item('far', r(300, 300, 400, 320)),
      item('hidden', r(0, 0, 100, 20), { visible: false }),
      item('inner', r(10, 2, 30, 8)),
      item('touch', r(100, 0, 140, 5)),
    ])
    expect(pairs).toEqual([['a', 'b'], ['a', 'inner']])
  })
  it('still reports unrelated elements whose boxes nest, unless marked', () => {
    const nested = [item('outer', r(0, 0, 100, 100)), item('inner', r(10, 10, 50, 30))]
    expect(findOverlaps(nested)).toEqual([['outer', 'inner']])
    expect(findOverlaps([item('outer', r(0, 0, 100, 100), { allowed: true }), item('inner', r(10, 10, 50, 30), { allowed: true })])).toEqual([])
  })
  it('skips ancestor containment, even when only partly inside', () => {
    expect(findOverlaps([item('outer', r(0, 0, 100, 100)), item('inner', r(50, 50, 150, 150), { ancestors: ['outer'] })])).toEqual([])
  })
  it('exempts elements inside an allow-overlap subtree but still reports other collisions', () => {
    const items = [
      item('ok1', r(0, 0, 100, 20), { allowed: true }),
      item('ok2', r(10, 5, 90, 15), { allowed: true }),
      item('x', r(0, 100, 100, 120)),
      item('y', r(20, 105, 120, 125)),
    ]
    expect(findOverlaps(items)).toEqual([['x', 'y']])
  })
  it('names the step and both elements in the warning', () => {
    const w = analyzeSnapshot(4, { items: [item('[data-sample="a"]', r(0, 0, 10, 10)), item('[data-presentation-caption]', r(5, 5, 20, 20))], activeChrome: [], attribution: { fontSizePx: 14, color: 'x', textDecorationLine: 'none' } })
    expect(w).toHaveLength(1)
    expect(w[0]).toMatch(/step 4: overlap between \[data-sample="a"\] and \[data-presentation-caption\]/)
  })
})

describe('active-chrome and attribution diagnostics (L-63, L-64, C-1, I-34)', () => {
  const base = Object.fromEntries(DISTINCT_PROPS.map((p) => [p, 'same']))
  // The property set the lead ruled on, written out independently of the implementation.
  const RULED = ['color', 'backgroundColor', 'borderColor', 'opacity', 'fontWeight', 'textDecorationLine', 'boxShadow', 'outlineStyle', 'outlineColor', 'outlineWidth', 'width', 'height']
  it('compares exactly the ruled properties, including outline width', () => {
    expect([...DISTINCT_PROPS].sort()).toEqual([...RULED].sort())
  })
  it('is indistinct only when every compared property is equal', () => {
    const same = Object.fromEntries(RULED.map((p) => [p, 'same']))
    expect(isIndistinct(same, { ...same })).toBe(true)
    for (const p of RULED) expect(isIndistinct({ ...same, [p]: 'different' }, same), p).toBe(false)
  })
  it('warns with the step and affected hook', () => {
    const w = analyzeSnapshot(2, { items: [], activeChrome: [{ hook: 'data-presentation-progress', active: base, inactive: { ...base } }], attribution: { fontSizePx: 14, color: 'rgb(0, 0, 0)', textDecorationLine: 'none' } })
    expect(w).toEqual([expect.stringMatching(/step 2: active data-presentation-progress is visually indistinct/)])
    expect(analyzeSnapshot(2, { items: [], activeChrome: [{ hook: 'data-presentation-progress', active: { ...base, width: '9px' }, inactive: base }], attribution: { fontSizePx: 14, color: 'x', textDecorationLine: '' } })).toEqual([])
  })
  it('flags undersized, browser-default and missing attribution, pointing at its hook', () => {
    expect(attributionIssues({ fontSizePx: MIN_ATTRIBUTION_FONT_PX - 1, color: 'rgb(0, 0, 0)', textDecorationLine: 'none' })).toHaveLength(1)
    expect(attributionIssues({ fontSizePx: MIN_ATTRIBUTION_FONT_PX, color: 'rgb(0, 0, 0)', textDecorationLine: 'none' })).toEqual([])
    expect(attributionIssues({ fontSizePx: 16, color: UA_LINK_COLOR, textDecorationLine: 'underline' })[0]).toMatch(/browser-default/)
    expect(attributionIssues({ fontSizePx: 16, color: UA_LINK_COLOR, textDecorationLine: 'none' })).toEqual([])
    expect(attributionIssues({ fontSizePx: 9, color: UA_LINK_COLOR, textDecorationLine: 'underline' })).toHaveLength(2)
    expect(attributionIssues(null)).toEqual(['attribution link is missing'])
    const w = analyzeSnapshot(1, { items: [], activeChrome: [], attribution: null })
    expect(w[0]).toMatch(/step 1: attribution link is missing; style \[data-presentation-attribution\]/)
  })
})
