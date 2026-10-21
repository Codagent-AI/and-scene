// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../src/presentation-kit/constants'
import { DEFAULT_RENDER_SETTLE_MS, parseArgs, parsePositiveInt, parseViewport } from '../../scripts/lib/args.mjs'
import { DEFAULT_SETTLE_MS, DEFAULT_VIEWPORT, CaptureError, captureSteps, parseStepCount, stepFile } from '../../scripts/lib/capture.mjs'
import { attributionProblems, diagnoseStep, findOverlaps, indistinctActive, rectsOverlap } from '../../scripts/lib/diagnostics.mjs'
import { SAMPLE_OUTLINE, validateOutline } from '../../scripts/lib/outline.mjs'
import { parseRegistrySlugs, selectRoutes } from '../../scripts/lib/registry.mjs'

const SCRIPTS = join(__dirname, '../../scripts')

describe('arguments', () => {
  it('parses values, flags, and positionals', () => {
    const a = parseArgs(['talk', '--viewport', '390x844', '--settle-ms=250', '--skip-build'], {
      values: ['viewport', 'settle-ms'],
      flags: ['skip-build'],
    })
    expect(a).toEqual({ positional: ['talk'], values: { viewport: '390x844', 'settle-ms': '250' }, flags: { 'skip-build': true } })
  })
  it('rejects unknown options and missing values', () => {
    expect(() => parseArgs(['--nope'], {})).toThrow(/unknown option/)
    expect(() => parseArgs(['--viewport'], { values: ['viewport'] })).toThrow(/needs a value/)
  })
  it('validates numbers and viewports', () => {
    expect(parsePositiveInt('250', 'x')).toBe(250)
    expect(() => parsePositiveInt('-1', '--settle-ms')).toThrow(/--settle-ms/)
    expect(() => parsePositiveInt('abc', 'x')).toThrow()
    expect(parseViewport('390x844')).toEqual({ width: 390, height: 844 })
    expect(() => parseViewport('big')).toThrow(/--viewport/)
    expect(() => parseViewport('0x10')).toThrow()
  })
  it('the default settle interval outlasts the kit\'s layout morph and newcomer entrance', () => {
    expect(DEFAULT_SETTLE_MS / 1000).toBeGreaterThan(Math.max(LAYOUT_T, ENTER_DELAY + ENTER_T))
  })
  it('the render check waits longer per step than the kit\'s slowest animation', () => {
    expect(DEFAULT_RENDER_SETTLE_MS / 1000).toBeGreaterThan(ENTER_DELAY + ENTER_T)
    expect(DEFAULT_RENDER_SETTLE_MS / 1000).toBeGreaterThan(LAYOUT_T)
  })
  it('defaults to a 1440x900 viewport and a 1000ms settle interval', () => {
    expect(parseViewport(DEFAULT_VIEWPORT)).toEqual({ width: 1440, height: 900 })
    expect(DEFAULT_SETTLE_MS).toBe(1000)
  })
})

describe('registry selection', () => {
  const source = `export const presentations = [
    { slug: 'one', title: 'One', load: () => import('./one/Talk') },
    { slug: "two", title: 'Two', load: () => import('./two/Talk') },
  ]`
  it('enumerates every registered slug in order', () => {
    expect(parseRegistrySlugs(source)).toEqual(['one', 'two'])
    expect(selectRoutes(['one', 'two'], undefined)).toEqual(['one', 'two'])
  })
  it('enforces a required sample only when asked', () => {
    expect(selectRoutes(['one'], 'one')).toEqual(['one'])
    expect(() => selectRoutes(['one'], 'sample')).toThrow(/sample.*not registered/)
    expect(() => selectRoutes([], undefined)).toThrow(/no presentations/)
  })
})

describe('sample outline validation', () => {
  const rendered = () => SAMPLE_OUTLINE.map(({ title, caption }) => ({ title, caption }))
  it('has the nine normative steps', () => {
    expect(SAMPLE_OUTLINE).toHaveLength(9)
    expect(SAMPLE_OUTLINE.map((s) => s.title)).toEqual([
      'You have a topic',
      'The skill interviews you',
      'Answers become steps',
      'The deck grows',
      'You set the depth',
      'It assembles the scene',
      'It checks its own work',
      'Changed your mind? Loop it.',
      "You're looking at one",
    ])
  })
  it('accepts the exact outline', () => {
    expect(validateOutline(rendered())).toEqual([])
  })
  it('rejects a wrong count, a changed title or caption, and reordering', () => {
    expect(validateOutline(rendered().slice(0, 8))[0].message).toMatch(/expected 9 steps, found 8/)
    expect(validateOutline([...rendered(), { title: 'x', caption: 'y' }])[0].message).toMatch(/found 10/)
    const edited = rendered()
    edited[3].title = 'The deck shrinks'
    expect(validateOutline(edited)).toEqual([expect.objectContaining({ index: 3, message: expect.stringContaining('title') })])
    const captioned = rendered()
    captioned[5].caption = ''
    expect(validateOutline(captioned)[0]).toMatchObject({ index: 5 })
    const swapped = rendered()
    ;[swapped[1], swapped[2]] = [swapped[2], swapped[1]]
    expect(validateOutline(swapped).map((p: { index: number }) => p.index)).toEqual([1, 1, 2, 2])
    expect(validateOutline([])[0].message).toMatch(/found 0/)
    expect(validateOutline([{ title: null, caption: null }, ...rendered().slice(1)])[0].index).toBe(0)
  })
})

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })
const item = (id: number, label: string, rect: ReturnType<typeof box>, extra = {}) => ({
  id, label, rect, allowOverlap: false, ancestors: [] as number[], ...extra,
})

describe('overlap diagnostics', () => {
  it('detects intersecting boxes and ignores separate, touching, and tiny overlaps', () => {
    expect(rectsOverlap(box(0, 0, 100, 20), box(50, 10, 100, 20))).toBe(true)
    expect(rectsOverlap(box(0, 0, 100, 20), box(100, 0, 100, 20))).toBe(false)
    expect(rectsOverlap(box(0, 0, 100, 20), box(0, 21, 100, 20))).toBe(false)
    expect(rectsOverlap(box(0, 0, 100, 20), box(99, 19, 100, 20))).toBe(false)
  })
  it('names the colliding elements and skips hidden items', () => {
    const items = [
      item(0, '"alpha"', box(0, 0, 100, 20)),
      item(1, '"beta"', box(50, 5, 100, 20)),
      item(2, '"hidden"', box(0, 0, 0, 0)),
      item(3, '"far"', box(500, 500, 50, 20)),
    ]
    expect(findOverlaps(items)).toEqual([['"alpha"', '"beta"']])
  })
  it('does not report ordinary ancestor containment', () => {
    const items = [item(0, 'parent', box(0, 0, 200, 100)), item(1, 'child', box(10, 10, 50, 20), { ancestors: [0] })]
    expect(findOverlaps(items)).toEqual([])
  })
  it('exempts allow-overlap items without hiding unrelated collisions', () => {
    const items = [
      item(0, 'marked-a', box(0, 0, 100, 20), { allowOverlap: true }),
      item(1, 'marked-b', box(10, 0, 100, 20), { allowOverlap: true }),
      item(2, 'plain-a', box(300, 0, 100, 20)),
      item(3, 'plain-b', box(310, 0, 100, 20)),
      item(4, 'plain-c', box(20, 0, 100, 20)),
    ]
    const pairs = findOverlaps(items).map((p) => p.join('|'))
    expect(pairs).toContain('plain-a|plain-b')
    expect(pairs.some((p) => p.includes('marked'))).toBe(false)
  })
})

const style = (over: Record<string, string> = {}) => ({
  color: 'rgb(0, 0, 0)', backgroundColor: 'rgba(0, 0, 0, 0)', borderTopColor: 'rgb(0, 0, 0)', borderTopWidth: '1px',
  outlineStyle: 'none', outlineColor: 'rgb(0, 0, 0)', opacity: '1', fontWeight: '400', textDecorationLine: 'none',
  transform: 'none', width: '12px', height: '12px', boxShadow: 'none', ...over,
})

describe('active chrome diagnostics', () => {
  const group = (active: Record<string, string>) => ({
    name: 'progress indicator',
    controls: [{ active: false, style: style() }, { active: true, style: style(active) }, { active: false, style: style() }],
  })
  it('warns when the active control looks like an inactive one', () => {
    expect(indistinctActive(group({}))).toMatch(/progress indicator/)
  })
  it.each([
    { backgroundColor: 'rgb(224, 184, 76)' },
    { transform: 'matrix(1.35, 0, 0, 1.35, 0, 0)' },
    { fontWeight: '700' },
    { width: '16px' },
  ])('accepts a visibly distinct active style %j', (over) => {
    expect(indistinctActive(group(over))).toBeNull()
  })
  it('has nothing to compare when there is no active or no inactive control', () => {
    expect(indistinctActive({ name: 'x', controls: [{ active: true, style: style() }] })).toBeNull()
    expect(indistinctActive({ name: 'x', controls: [{ active: false, style: style() }] })).toBeNull()
    expect(indistinctActive({ name: 'x', controls: [] })).toBeNull()
  })
})

describe('attribution diagnostics', () => {
  const ok = { fontSize: 13, color: 'rgb(185, 176, 154)', width: 120, height: 20 }
  it('accepts a legible, locally styled link', () => {
    expect(attributionProblems(ok)).toEqual([])
  })
  it('reports a missing attribution separately', () => {
    expect(attributionProblems(null)).toEqual(['attribution link is missing'])
  })
  it('reports small and browser-default attributions independently', () => {
    expect(attributionProblems({ ...ok, fontSize: 9 })).toEqual([expect.stringContaining('too small')])
    expect(attributionProblems({ ...ok, width: 30 })).toEqual([expect.stringContaining('too small')])
    expect(attributionProblems({ ...ok, color: 'rgb(0, 0, 238)' })).toEqual([expect.stringContaining('browser-default')])
    expect(attributionProblems({ ...ok, fontSize: 9, color: 'rgb(0, 0, 238)' })).toHaveLength(2)
  })
  it('points at the styling hook and names the step', () => {
    const data = { items: [], activeGroups: [], attribution: null }
    const [w] = diagnoseStep(4, data)
    expect(w).toMatchObject({ step: 4, kind: 'attribution' })
    expect(w.message).toContain('[data-presentation-attribution]')
    const missingVsCapture = diagnoseStep(1, { ...data, attribution: { ...{ fontSize: 13, color: 'rgb(1,1,1)', width: 100, height: 20 } } })
    expect(missingVsCapture).toEqual([])
  })
})

describe('capture loop', () => {
  function driver(settle: number) {
    const events: string[] = []
    let clock = 0
    let shown = 0
    return {
      events,
      d: {
        now: () => clock,
        wait: async (ms: number) => {
          events.push(`wait:${ms}`)
          clock += ms
        },
        advance: async (i: number) => {
          events.push(`advance:${i}`)
          shown = i
        },
        collect: async () => {
          events.push('collect')
          return { items: [], activeGroups: [], attribution: { fontSize: 13, color: 'rgb(1,1,1)', width: 100, height: 20 }, index: String(shown), title: `T${shown}` }
        },
        screenshot: async (file: string) => void events.push(`shot:${file}:${clock}`),
        log: () => {},
      },
      settle,
    }
  }

  it('waits the configured interval after every advance, before capturing', async () => {
    const { events, d } = driver(750)
    const result = await captureSteps({ count: 3, settleMs: 750, driver: d })
    expect(events).toEqual([
      'wait:750', 'collect', 'shot:step-01.png:750',
      'advance:1', 'wait:750', 'collect', 'shot:step-02.png:1500',
      'advance:2', 'wait:750', 'collect', 'shot:step-03.png:2250',
    ])
    expect(result.steps.map((s: { file: string }) => s.file)).toEqual(['step-01.png', 'step-02.png', 'step-03.png'])
    expect(result.steps.every((s: { capturedAt: number; navigatedAt: number }) => s.capturedAt - s.navigatedAt >= 750)).toBe(true)
  })

  it('refuses to capture when the shown step does not match', async () => {
    const { d } = driver(1)
    d.advance = async () => {}
    await expect(captureSteps({ count: 2, settleMs: 1, driver: d })).rejects.toBeInstanceOf(CaptureError)
  })

  it.each([null, '', '0', '-2', 'abc', '1.5'])('rejects the step count %j instead of capturing nothing', (raw) => {
    expect(() => parseStepCount(raw)).toThrow(CaptureError)
  })
  it('accepts a positive integer step count', () => {
    expect(parseStepCount('9')).toBe(9)
  })

  it('numbers files 1-based and zero-padded', () => {
    expect([stepFile(1), stepFile(9), stepFile(10)]).toEqual(['step-01.png', 'step-09.png', 'step-10.png'])
  })
})

describe('loopback only', () => {
  const files = [
    ...['verify.mjs', 'inspect-presentation.mjs'].map((f) => join(SCRIPTS, f)),
    ...readdirSync(join(SCRIPTS, 'lib')).map((f) => join(SCRIPTS, 'lib', f)),
  ]
  it('never refers to localhost or ::1', () => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      expect(text, file).not.toMatch(/localhost|::1|\[::\]|0\.0\.0\.0/)
    }
  })
  it('builds every URL from the shared 127.0.0.1 host constant', () => {
    expect(readFileSync(join(SCRIPTS, 'lib/preview.mjs'), 'utf8')).toMatch(/export const HOST = '127\.0\.0\.1'/)
    const preview = readFileSync(join(SCRIPTS, 'lib/preview.mjs'), 'utf8')
    expect(preview).toMatch(/`http:\/\/\$\{HOST\}:\$\{chosen\}`/)
    expect(preview).toMatch(/'--host', HOST/)
    expect(preview).toMatch(/server\.listen\(0, HOST/)
  })
  it('opens routes relative to the preview URL', () => {
    expect(readFileSync(join(SCRIPTS, 'verify.mjs'), 'utf8')).toMatch(/`\$\{base\}\/\$\{slug\}`/)
    expect(readFileSync(join(SCRIPTS, 'inspect-presentation.mjs'), 'utf8')).toMatch(/`\$\{preview\.url\}\/\$\{slug\}`/)
  })
})
