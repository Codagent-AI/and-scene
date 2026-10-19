// @vitest-environment node
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants.ts'
import {
  DESKTOP_VIEWPORT,
  InspectError,
  SETTLE_MS,
  analyzeStep,
  artifactDir,
  attributionIssues,
  captureSteps,
  findIndistinctActive,
  findOverlaps,
  main,
  parseArgs,
  stepFileName,
  viewportFor,
} from './inspect-presentation.mjs'

const VIEW = { width: 1440, height: 900 }
const GOOD_ATTR = {
  fontSizePx: 12,
  color: 'rgb(85, 85, 85)',
  fontFamily: 'sans-serif',
  rect: { x: 1300, y: 860, w: 130, h: 30 },
}
const rec = (id, rects, extra = {}) => ({ id, label: `span#${id}`, text: `t${id}`, rects, allowed: false, ancestors: [], ...extra })
const box = (x, y, w = 50, h = 20) => ({ x, y, w, h })
const chrome = (label, active, style = {}, width = 64, height = 28) => ({
  label,
  text: label,
  active,
  style: { color: 'rgb(0, 0, 0)', backgroundColor: 'rgba(0, 0, 0, 0)', border: 'none', boxShadow: 'none', opacity: '1', fontWeight: '400', textDecorationLine: 'none', transform: 'none', ...style },
  width,
  height,
})
const cleanSnapshot = (stepIndex = 0) => ({
  hasRoot: true,
  stepIndex,
  stepCount: 3,
  viewport: VIEW,
  textRecords: [],
  chrome: { progress: [], toc: [] },
  attribution: GOOD_ATTR,
})

describe('settle interval', () => {
  it('covers the longest kit transition (ENTER_DELAY + max(LAYOUT_T, ENTER_T))', () => {
    const longestMs = Math.ceil((ENTER_DELAY + Math.max(LAYOUT_T, ENTER_T)) * 1000)
    expect(SETTLE_MS).toBeGreaterThanOrEqual(longestMs)
  })
})

describe('parseArgs and paths', () => {
  it('uses desktop defaults and the default settle interval', () => {
    expect(parseArgs(['deck'])).toEqual({ slug: 'deck', narrow: false, settleMs: SETTLE_MS, build: true })
  })

  it('accepts --narrow, --settle and --no-build', () => {
    expect(parseArgs(['deck', '--narrow', '--settle', '0', '--no-build'])).toEqual({
      slug: 'deck',
      narrow: true,
      settleMs: 0,
      build: false,
    })
  })

  it('rejects missing slugs, bad slugs, bad settle values and unknown options', () => {
    expect(() => parseArgs([])).toThrow(InspectError)
    expect(() => parseArgs(['Bad Slug'])).toThrow(/invalid slug/)
    expect(() => parseArgs(['deck', '--settle', '-5'])).toThrow(/--settle/)
    expect(() => parseArgs(['deck', '--settle'])).toThrow(/--settle/)
    expect(() => parseArgs(['deck', '--wide'])).toThrow(/unknown option/)
    expect(() => parseArgs(['a', 'b'])).toThrow(/unexpected argument/)
  })

  it('uses 1440x900 by default and 390x844 for narrow runs', () => {
    expect(viewportFor(false)).toEqual(DESKTOP_VIEWPORT)
    expect(viewportFor(false)).toEqual({ width: 1440, height: 900 })
    expect(viewportFor(true)).toEqual({ width: 390, height: 844 })
  })

  it('names screenshots step-NN with 1-based zero padding under .inspection/<slug>', () => {
    expect(stepFileName(0)).toBe('step-01.png')
    expect(stepFileName(9)).toBe('step-10.png')
    expect(artifactDir('/root', 'deck', false)).toBe('/root/.inspection/deck')
    expect(artifactDir('/root', 'deck', true)).toBe('/root/.inspection/deck/narrow')
  })

  it('keeps the 127.0.0.1 host and never mentions localhost', async () => {
    const source = await readFile(new URL('./inspect-presentation.mjs', import.meta.url), 'utf8')
    expect(source).not.toContain('localhost')
    expect(source).toContain("const HOST = '127.0.0.1'")
  })
})

describe('overlap detection', () => {
  it('ignores separated and edge-touching boxes', () => {
    const pairs = findOverlaps([rec(0, [box(0, 0)]), rec(1, [box(100, 0)]), rec(2, [box(50, 0)])])
    expect(pairs).toEqual([])
  })

  it('reports intersecting text, including text overlapping chrome', () => {
    const pairs = findOverlaps([rec(0, [box(0, 0)]), rec(1, [box(10, 5)], { label: 'a[data-presentation-attribution]' })])
    expect(pairs).toHaveLength(1)
    expect(pairs[0].map((r) => r.id)).toEqual([0, 1])
  })

  it('exempts pairs where either element is inside an allow-overlap subtree', () => {
    expect(findOverlaps([rec(0, [box(0, 0)], { allowed: true }), rec(1, [box(0, 0)])])).toEqual([])
    expect(findOverlaps([rec(0, [box(0, 0)]), rec(1, [box(0, 0)], { allowed: true })])).toEqual([])
  })

  it('still reports unrelated unmarked collisions beside an allowed pair', () => {
    const pairs = findOverlaps([
      rec(0, [box(0, 0)], { allowed: true }),
      rec(1, [box(0, 0)], { allowed: true }),
      rec(2, [box(300, 300)]),
      rec(3, [box(300, 300)]),
    ])
    expect(pairs.map(([a, b]) => [a.id, b.id])).toEqual([[2, 3]])
  })

  it('does not treat nested text as a collision', () => {
    const pairs = findOverlaps([rec(0, [box(0, 0, 200, 200)]), rec(1, [box(10, 10)], { ancestors: [0] })])
    expect(pairs).toEqual([])
  })
})

describe('indistinct active chrome', () => {
  it('warns when the active item matches an inactive sibling in every compared property', () => {
    const issues = findIndistinctActive({ progress: [chrome('1', true), chrome('2', false)], toc: [] })
    expect(issues).toHaveLength(1)
    expect(issues[0].kind).toBe('progress')
    expect(issues[0].label.label).toBe('1')
  })

  it.each([
    ['color', { color: 'rgb(200, 0, 0)' }, 64, 28],
    ['background-color', { backgroundColor: 'rgb(255, 255, 0)' }, 64, 28],
    ['border', { border: '2px solid red' }, 64, 28],
    ['box-shadow', { boxShadow: '0 0 4px black' }, 64, 28],
    ['opacity', { opacity: '0.5' }, 64, 28],
    ['font-weight', { fontWeight: '700' }, 64, 28],
    ['text-decoration', { textDecorationLine: 'underline' }, 64, 28],
    ['transform', { transform: 'scale(1.1)' }, 64, 28],
    ['size', {}, 80, 28],
  ])('a distinct %s clears the warning', (_name, style, width, height) => {
    const issues = findIndistinctActive({
      progress: [chrome('1', true, style, width, height), chrome('2', false)],
      toc: [],
    })
    expect(issues).toEqual([])
  })

  it('does nothing without an inactive sibling', () => {
    expect(findIndistinctActive({ progress: [chrome('1', true)], toc: [] })).toEqual([])
  })
})

describe('attribution diagnostics', () => {
  it('reports a missing attribution element', () => {
    expect(attributionIssues(null, VIEW)).toEqual(['no attribution element rendered'])
  })

  it('accepts a polished attribution in the bottom-right quadrant', () => {
    expect(attributionIssues(GOOD_ATTR, VIEW)).toEqual([])
  })

  it('reports undersized, browser-default color, default serif and misplaced attribution', () => {
    expect(attributionIssues({ ...GOOD_ATTR, fontSizePx: 10 }, VIEW)[0]).toMatch(/below 11px/)
    expect(attributionIssues({ ...GOOD_ATTR, color: 'rgb(0, 0, 238)' }, VIEW)).toEqual(['browser-default link color'])
    expect(attributionIssues({ ...GOOD_ATTR, fontFamily: 'Times New Roman' }, VIEW)).toEqual(['browser-default serif font-family'])
    expect(attributionIssues({ ...GOOD_ATTR, fontFamily: '"Georgia", serif' }, VIEW)).toEqual([])
    expect(attributionIssues({ ...GOOD_ATTR, rect: { x: 0, y: 0, w: 130, h: 30 } }, VIEW)).toEqual([
      'not at least partly in the bottom-right quadrant',
    ])
  })
})

describe('analyzeStep', () => {
  it('names the step and the colliding elements, and points attribution at its hook', () => {
    const lines = analyzeStep(
      {
        ...cleanSnapshot(1),
        textRecords: [rec(0, [box(0, 0)], { label: 'span', text: 'Alpha' }), rec(1, [box(0, 0)], { label: 'span', text: 'Beta' })],
        chrome: { progress: [chrome('1', true), chrome('2', false)], toc: [] },
        attribution: { ...GOOD_ATTR, color: 'rgb(0, 0, 238)' },
      },
      2,
    )
    expect(lines.some((l) => l.startsWith('WARN step 2 [overlap]') && l.includes('Alpha') && l.includes('Beta'))).toBe(true)
    expect(lines.some((l) => l.startsWith('WARN step 2 [active-chrome]'))).toBe(true)
    expect(lines.some((l) => l.startsWith('WARN step 2 [attribution]') && l.includes('data-presentation-attribution'))).toBe(true)
  })

  it('is silent for a clean step', () => {
    expect(analyzeStep(cleanSnapshot(0), 1)).toEqual([])
  })
})

/** Fake Playwright page: keyboard presses advance the step index and every event is recorded. */
function fakeSession({ stepCount = 2, hasRoot = true, screenshotError = null, snapshot = (i) => cleanSnapshot(i) } = {}) {
  const events = []
  let index = 0
  const page = {
    goto: async () => events.push('goto'),
    keyboard: {
      press: async (key) => {
        events.push(`press ${key}`)
        index++
      },
    },
    evaluate: async () => (hasRoot ? { ...snapshot(index), stepCount } : { hasRoot: false }),
    screenshot: async ({ path }) => {
      events.push(`shot ${path.split('/').pop()}`)
      if (screenshotError) throw new Error(screenshotError)
      await import('node:fs/promises').then((fs) => fs.writeFile(path, Buffer.from('png')))
    },
  }
  const browser = { newContext: async () => ({ newPage: async () => page }), close: async () => events.push('close browser') }
  return { events, page, browser }
}

describe('captureSteps scheduling and fatal paths', () => {
  let dir
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'inspect-unit-'))
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('waits the settle interval before the first and every later capture', async () => {
    const session = fakeSession({ stepCount: 2 })
    const sleeps = []
    const sleep = async (ms) => {
      sleeps.push(ms)
      session.events.push(`sleep ${ms}`)
    }
    const logs = []
    const result = await captureSteps({
      page: session.page,
      url: 'http://127.0.0.1:1/deck',
      settleMs: 1234,
      outDir: join(dir, 'out'),
      sleep,
      log: (l) => logs.push(l),
    })
    expect(result.files).toHaveLength(2)
    expect(session.events.filter((e) => e.startsWith('sleep') || e.startsWith('shot') || e === 'press ArrowRight')).toEqual([
      'sleep 1234',
      'shot step-01.png',
      'press ArrowRight',
      'sleep 1234',
      'shot step-02.png',
    ])
    expect(sleeps.every((ms) => ms === 1234)).toBe(true)
    expect(await readdir(join(dir, 'out'))).toEqual(['step-01.png', 'step-02.png'])
  })

  it('defaults to SETTLE_MS', async () => {
    const session = fakeSession({ stepCount: 1 })
    const sleeps = []
    await captureSteps({ page: session.page, url: 'x', settleMs: SETTLE_MS, outDir: join(dir, 'o'), sleep: async (ms) => sleeps.push(ms), log() {} })
    expect(sleeps).toEqual([SETTLE_MS])
  })

  it('throws a fatal error for a missing route', async () => {
    const session = fakeSession({ hasRoot: false })
    await expect(
      captureSteps({ page: session.page, url: 'http://127.0.0.1:1/nope', settleMs: 0, outDir: join(dir, 'o'), sleep: async () => {}, log() {} }),
    ).rejects.toThrow(/route not found/)
  })

  it('throws when the step-count hook is missing', async () => {
    const session = fakeSession({ stepCount: Number.NaN })
    await expect(
      captureSteps({ page: session.page, url: 'x', settleMs: 0, outDir: join(dir, 'o'), sleep: async () => {}, log() {} }),
    ).rejects.toThrow(/data-step-count/)
  })

  it('throws when a screenshot fails', async () => {
    const session = fakeSession({ screenshotError: 'disk full' })
    await expect(
      captureSteps({ page: session.page, url: 'x', settleMs: 0, outDir: join(dir, 'o'), sleep: async () => {}, log() {} }),
    ).rejects.toThrow(/capture failed for step 1: disk full/)
  })
})

describe('main exit codes', () => {
  let root
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'inspect-root-'))
  })
  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  const deps = (session, overrides = {}) => ({
    root,
    log: () => {},
    error: () => {},
    runBuild: async () => session.events.push('build'),
    startPreview: async () => ({ port: 4321, close: async () => session.events.push('close preview') }),
    launchBrowser: async () => session.browser,
    sleep: async () => {},
    ...overrides,
  })

  it('exits 0 when only warnings are raised, and builds first by default', async () => {
    const session = fakeSession({
      stepCount: 1,
      snapshot: () => ({ ...cleanSnapshot(0), attribution: null }),
    })
    const logs = []
    const code = await main(['deck'], deps(session, { log: (l) => logs.push(l) }))
    expect(code).toBe(0)
    expect(session.events[0]).toBe('build')
    expect(session.events).toContain('close preview')
    expect(logs.some((l) => l.startsWith('WARN step 1 [attribution]'))).toBe(true)
    expect(logs.at(-1)).toMatch(/^summary: deck captured 1 step/)
  })

  it('skips the build with --no-build', async () => {
    const session = fakeSession({ stepCount: 1 })
    expect(await main(['deck', '--no-build'], deps(session))).toBe(0)
    expect(session.events).not.toContain('build')
  })

  it('exits 1 when the build fails', async () => {
    const session = fakeSession()
    const code = await main(['deck'], deps(session, { runBuild: async () => { throw new InspectError('build failed') } }))
    expect(code).toBe(1)
    expect(session.events).not.toContain('goto')
  })

  it('exits 1 when the preview server cannot start', async () => {
    const session = fakeSession()
    expect(await main(['deck', '--no-build'], deps(session, { startPreview: async () => { throw new InspectError('no preview') } }))).toBe(1)
  })

  it('exits 1 for a missing route and still closes the browser', async () => {
    const session = fakeSession({ hasRoot: false })
    expect(await main(['nope', '--no-build'], deps(session))).toBe(1)
    expect(session.events).toContain('close browser')
    expect(session.events).toContain('close preview')
  })

  it('exits 1 when a capture crashes', async () => {
    const session = fakeSession({ screenshotError: 'crash' })
    expect(await main(['deck', '--no-build'], deps(session))).toBe(1)
  })

  it('exits 2 for usage errors', async () => {
    const session = fakeSession()
    expect(await main([], deps(session, { error: () => {} }))).toBe(2)
  })

  it('writes narrow runs under the narrow subdirectory and uses the narrow viewport', async () => {
    const session = fakeSession({ stepCount: 1 })
    let viewport = null
    const browser = {
      newContext: async (opts) => {
        viewport = opts.viewport
        return { newPage: async () => session.page }
      },
      close: async () => {},
    }
    expect(await main(['deck', '--narrow', '--no-build'], deps(session, { launchBrowser: async () => browser }))).toBe(0)
    expect(viewport).toEqual({ width: 390, height: 844 })
    expect(await readdir(join(root, '.inspection', 'deck', 'narrow'))).toEqual(['step-01.png'])
  })
})
