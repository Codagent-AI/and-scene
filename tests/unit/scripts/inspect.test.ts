import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SETTLE_MS, attributionIssues, findOverlaps, inspect, inspectSteps, isIndistinct, isRegistered,
  outputDir, parseArgs, stepFileName, warningsFor,
} from '../../../scripts/inspect-presentation.mjs'

const box = (label: string, l: number, t: number, r: number, b: number, extra: Partial<{ allowed: boolean; containers: number[] }> = {}) => ({
  label, rect: { l, t, r, b }, allowed: false, containers: [] as number[], ...extra,
})

describe('arguments and paths', () => {
  it('defaults to a 1200ms settle, a 1440x900 viewport and inspection/<slug>', () => {
    const options = parseArgs(['talk'])
    expect(options).toMatchObject({ slug: 'talk', settleMs: DEFAULT_SETTLE_MS, viewport: { width: 1440, height: 900 }, build: true })
    expect(DEFAULT_SETTLE_MS).toBe(1200)
  })

  it('accepts overrides by flag and environment variable', () => {
    expect(parseArgs(['talk', '--settle', '50', '--viewport', '390x844', '--out', 'shots', '--no-build'])).toMatchObject({
      settleMs: 50, viewport: { width: 390, height: 844 }, out: 'shots', build: false,
    })
    expect(parseArgs(['talk'], { INSPECT_SETTLE_MS: '77' }).settleMs).toBe(77)
  })

  it.each([[[]], [['talk', '--viewport', 'wide']], [['talk', '--bogus']], [['talk', '--settle', 'x']]])('rejects bad arguments %j', (argv) => {
    expect(() => parseArgs(argv)).toThrow(expect.objectContaining({ phase: 'args' }))
  })

  it.each([['--out', '../escape'], ['--out', '/tmp/abs'], ['--out', 'a/../../b']])('rejects %s %s (outside the project)', (flag, value) => {
    expect(() => parseArgs(['talk', flag, value])).toThrow(expect.objectContaining({ phase: 'args' }))
  })

  it.each(['A.b', '(x', '.*', 'a/b'])('rejects the slug %j', (slug) => {
    expect(() => parseArgs([slug])).toThrow(expect.objectContaining({ phase: 'args' }))
  })

  it('names screenshots step-NN.png (1-based) under the project root', () => {
    expect([stepFileName(0), stepFileName(8), stepFileName(11)]).toEqual(['step-01.png', 'step-09.png', 'step-12.png'])
    expect(outputDir('/p', 'inspection', 'talk', { width: 1440, height: 900 })).toBe('/p/inspection/talk')
    expect(outputDir('/p', 'inspection', 'talk', { width: 390, height: 844 })).toBe('/p/inspection/talk-390x844')
  })
})

describe('overlap detection', () => {
  it('flags overlapping boxes and ignores touching edges and separated boxes', () => {
    expect(findOverlaps([box('a', 0, 0, 10, 10), box('b', 5, 5, 20, 20)])).toEqual([['a', 'b']])
    expect(findOverlaps([box('a', 0, 0, 10, 10), box('b', 10, 0, 20, 10)])).toEqual([])
    expect(findOverlaps([box('a', 0, 0, 10, 10), box('b', 0, 10, 10, 20)])).toEqual([])
    expect(findOverlaps([box('a', 0, 0, 10, 10), box('b', 50, 50, 60, 60)])).toEqual([])
    expect(findOverlaps([box('a', 0, 0, 10, 10), box('b', 9.8, 9.8, 20, 20)])).toEqual([])
  })

  it('exempts ancestor/descendant pairs', () => {
    expect(findOverlaps([box('outer', 0, 0, 100, 100), box('inner', 10, 10, 20, 20, { containers: [0] })])).toEqual([])
  })

  it('exempts only the marked subtree, not unrelated collisions', () => {
    const found = findOverlaps([
      box('marked-1', 0, 0, 10, 10, { allowed: true }),
      box('marked-2', 5, 5, 15, 15, { allowed: true }),
      box('free-1', 100, 100, 120, 120),
      box('free-2', 110, 110, 130, 130),
      box('free-3', 0, 0, 10, 10),
    ])
    expect(found).toEqual([['free-1', 'free-2']])
  })

  it('does not exempt a collision between marked and unmarked content', () => {
    expect(findOverlaps([box('marked', 0, 0, 10, 10, { allowed: true }), box('free', 5, 5, 20, 20)])).toEqual([])
  })
})

describe('chrome diagnostics', () => {
  const sig = (over: Record<string, string> = {}) => ({ color: 'rgb(1, 1, 1)', backgroundColor: 'rgba(0, 0, 0, 0)', width: '10px', ...over })

  it('flags an active control that looks like its inactive siblings', () => {
    expect(isIndistinct(sig(), [sig(), sig(), sig()])).toBe(true)
  })

  it('accepts a visibly different active control', () => {
    expect(isIndistinct(sig({ backgroundColor: 'rgb(214, 178, 94)' }), [sig(), sig()])).toBe(false)
    expect(isIndistinct(sig({ width: '26px' }), [sig(), sig()])).toBe(false)
  })

  it('has nothing to compare without an active or inactive control', () => {
    expect(isIndistinct(null, [sig()])).toBe(false)
    expect(isIndistinct(sig(), [])).toBe(false)
  })

  const link = (over = {}) => ({ fontSize: 13, color: 'rgb(214, 178, 94)', textDecorationLine: 'none', fontFamily: 'Inter, sans-serif', ...over })

  it.each([
    ['missing', null, 'missing'],
    ['undersized', link({ fontSize: 8 }), 'too small (8px)'],
    ['browser-default color', link({ color: 'rgb(0, 0, 238)' }), 'browser-default'],
    ['browser-default serif underline', link({ textDecorationLine: 'underline', fontFamily: '"Times New Roman"' }), 'browser-default'],
  ])('reports %s attribution', (_name, attribution, message) => {
    expect(attributionIssues(attribution).join(' ')).toContain(message)
  })

  it('accepts a legible styled attribution', () => {
    expect(attributionIssues(link())).toEqual([])
    expect(attributionIssues(link({ textDecorationLine: 'underline' }))).toEqual([])
  })
})

describe('warnings', () => {
  const clean = { candidates: [], progress: { active: null, inactive: [] }, toc: { active: null, inactive: [] }, attribution: { fontSize: 13, color: 'red', textDecorationLine: 'none', fontFamily: 'Inter' } }

  it('stays silent for a clean page', () => {
    expect(warningsFor(2, clean)).toEqual([])
  })

  it('prints step-specific advisory lines for each defect class', () => {
    const same = { color: 'a' }
    const lines = warningsFor(4, {
      candidates: [box('<p> "one"', 0, 0, 10, 10), box('<p> "two"', 5, 5, 15, 15)],
      progress: { active: same, inactive: [same] },
      toc: { active: same, inactive: [same] },
      attribution: { fontSize: 9, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline', fontFamily: 'serif' },
    })
    expect(lines.every((line) => line.startsWith('WARN [') && line.includes('step 4'))).toBe(true)
    expect(lines.join('\n')).toMatch(/\[overlap\].*"one".*"two"/)
    expect(lines.join('\n')).toMatch(/\[active-nav\].*progress/)
    expect(lines.join('\n')).toMatch(/\[active-nav\].*table-of-contents/)
    expect(lines.join('\n')).toMatch(/\[attribution\].*data-presentation-attribution/)
  })
})

describe('inspectSteps', () => {
  it('waits the settle interval before every capture, including the first, and after each advance', async () => {
    const calls: string[] = []
    const page = {
      keyboard: { press: async (k: string) => void calls.push(`press:${k}`) },
      waitForFunction: async (_fn: unknown, i: number) => void calls.push(`at:${i}`),
      screenshot: async ({ path }: { path: string }) => void calls.push(`shot:${path.split('/').pop()}`),
      evaluate: async () => ({ candidates: [], progress: { active: null, inactive: [] }, toc: { active: null, inactive: [] }, attribution: { fontSize: 13, color: 'x', textDecorationLine: 'none', fontFamily: 'x' } }),
    }
    const sleep = vi.fn(async (ms: number) => void calls.push(`sleep:${ms}`))
    const warnings = await inspectSteps(page as never, { count: 3, settleMs: 321, sleep, dir: '/out', log: () => undefined })
    expect(warnings).toBe(0)
    expect(calls).toEqual([
      'sleep:321', 'shot:step-01.png',
      'press:ArrowRight', 'at:1', 'sleep:321', 'shot:step-02.png',
      'press:ArrowRight', 'at:2', 'sleep:321', 'shot:step-03.png',
    ])
  })

  it('counts and prints warnings without throwing', async () => {
    const page = {
      keyboard: { press: async () => undefined },
      waitForFunction: async () => undefined,
      screenshot: async () => undefined,
      evaluate: async () => ({ candidates: [], progress: { active: null, inactive: [] }, toc: { active: null, inactive: [] }, attribution: null }),
    }
    const log = vi.fn()
    expect(await inspectSteps(page as never, { count: 2, settleMs: 0, sleep: async () => undefined, dir: '/out', log })).toBe(2)
    expect(log).toHaveBeenCalledTimes(2)
  })
})

describe('inspect command', () => {
  const project = () => {
    const root = mkdtempSync(join(tmpdir(), 'inspect-unit-'))
    mkdirSync(join(root, 'src', 'presentations'), { recursive: true })
    writeFileSync(join(root, 'src', 'presentations', 'index.ts'), "export const P = [{ slug: 'demo', load: () => import('./demo/Talk.tsx') }]")
    return root
  }
  const deps = (over = {}) => {
    const stop = vi.fn(async () => undefined)
    return {
      stop,
      deps: { runBuild: vi.fn(async () => ''), startPreview: vi.fn(async () => ({ port: 1, stop })), launchBrowser: vi.fn(), ...over },
    }
  }

  it('matches slugs literally, never as patterns', () => {
    const root = project()
    for (const slug of ['.*', 'de.o', '(']) expect(isRegistered(root, slug)).toBe(false)
  })

  it('recognizes registered slugs from the project root it is given', () => {
    const root = project()
    expect(isRegistered(root, 'demo')).toBe(true)
    expect(isRegistered(root, 'nope')).toBe(false)
    expect(isRegistered(tmpdir(), 'demo')).toBe(false)
  })

  it('exits nonzero (rejects) for an unknown slug before building or launching anything', async () => {
    const { deps: d } = deps()
    await expect(inspect(['nope'], { root: project(), deps: d as never, log: () => undefined })).rejects.toMatchObject({ phase: 'args' })
    expect(d.runBuild).not.toHaveBeenCalled()
    expect(d.startPreview).not.toHaveBeenCalled()
  })

  it('requires a build when --no-build finds no dist', async () => {
    const { deps: d } = deps()
    await expect(inspect(['demo', '--no-build'], { root: project(), deps: d as never })).rejects.toMatchObject({ phase: 'build' })
  })

  it('propagates a build failure', async () => {
    const { deps: d } = deps({ runBuild: vi.fn(async () => { throw new Error('tsc') }) })
    await expect(inspect(['demo'], { root: project(), deps: d as never })).rejects.toThrow('tsc')
    expect(d.startPreview).not.toHaveBeenCalled()
  })

  it('stops the preview when the browser fails to launch or the page never renders', async () => {
    const launchFail = deps({ launchBrowser: vi.fn(async () => { throw new Error('no chromium') }) })
    await expect(inspect(['demo'], { root: project(), deps: launchFail.deps as never })).rejects.toThrow('no chromium')
    expect(launchFail.stop).toHaveBeenCalledOnce()

    const close = vi.fn(async () => undefined)
    const renderFail = deps({
      launchBrowser: vi.fn(async () => ({
        close,
        newPage: async () => ({ goto: async () => undefined, waitForSelector: async () => { throw new Error('timeout') } }),
      })),
    })
    await expect(inspect(['demo'], { root: project(), deps: renderFail.deps as never })).rejects.toMatchObject({ phase: 'render' })
    expect(close).toHaveBeenCalledOnce()
    expect(renderFail.stop).toHaveBeenCalledOnce()
  })

  it('still stops the preview when closing the browser fails', async () => {
    const close = vi.fn(async () => { throw new Error('close failed') })
    const failing = deps({
      launchBrowser: vi.fn(async () => ({
        close,
        newPage: async () => ({ goto: async () => undefined, waitForSelector: async () => { throw new Error('timeout') } }),
      })),
    })
    await expect(inspect(['demo'], { root: project(), deps: failing.deps as never })).rejects.toThrow()
    expect(close).toHaveBeenCalledOnce()
    expect(failing.stop).toHaveBeenCalledOnce()
  })
})
