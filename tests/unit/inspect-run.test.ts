import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULTS, parseArgs, screenshotPath } from '../../scripts/lib/inspect-args.mjs'
import { runInspect } from '../../scripts/lib/inspect-run.mjs'

const root = path.resolve('.')

describe('inspect argument parsing', () => {
  it('defaults to a 1440x900 viewport, 900 ms settle and artifacts/inspection', () => {
    expect(DEFAULTS).toEqual({ viewport: { width: 1440, height: 900 }, settleMs: 900, outDir: 'artifacts/inspection' })
    const options = parseArgs(['demo'], root)
    expect(options).toMatchObject({ slug: 'demo', viewport: { width: 1440, height: 900 }, settleMs: 900, build: true })
    expect(options.outDir).toBe(path.join(root, 'artifacts/inspection'))
  })

  it('parses viewport, settle interval, output and build options', () => {
    const options = parseArgs(['demo', '--viewport', '390x844', '--settle-ms', '1500', '--out', 'artifacts/x', '--no-build'], root)
    expect(options).toMatchObject({ viewport: { width: 390, height: 844 }, settleMs: 1500, build: false })
    expect(options.outDir).toBe(path.join(root, 'artifacts/x'))
  })

  it.each([
    [[], /usage/],
    [['demo', '--viewport', '390'], /WIDTHxHEIGHT/],
    [['demo', '--settle-ms', '-1'], /non-negative/],
    [['demo', '--settle-ms'], /needs a value/],
    [['demo', '--wat'], /unknown option/],
    [['demo', 'two'], /unexpected argument/],
    [['../etc'], /invalid presentation slug/],
    [['demo', '--out', '../elsewhere'], /inside the project/],
    [['demo', '--out', '/tmp/elsewhere'], /inside the project/],
  ])('rejects %j', (argv, message) => {
    expect(() => parseArgs(argv, root)).toThrow(message)
  })

  it('writes one predictable zero-padded screenshot path per step', () => {
    expect(screenshotPath('/out', 'demo', 0)).toBe('/out/demo/step-01.png')
    expect(screenshotPath('/out', 'demo', 11)).toBe('/out/demo/step-12.png')
  })
})

describe('runInspect control flow', () => {
  const dirs: string[] = []
  afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })))

  function harness(over: Record<string, unknown> = {}, pageOver: Record<string, unknown> = {}) {
    const out = mkdtempSync(path.join(os.tmpdir(), 'inspect-'))
    dirs.push(out)
    const events: string[] = []
    let index = 0
    const page = {
      goto: vi.fn(async () => {}),
      waitForSelector: vi.fn(async () => {}),
      locator: () => ({ getAttribute: async () => '3' }),
      waitForFunction: vi.fn(async () => {}),
      waitForTimeout: vi.fn(async (ms: number) => void events.push(`settle:${ms}`)),
      screenshot: vi.fn(async ({ path: file }: { path: string }) => void events.push(`shot:${path.basename(file)}`)),
      evaluate: vi.fn(async () => ({ elements: [], progress: null, toc: null, attribution: null })),
      keyboard: { press: vi.fn(async () => void index++) },
      ...pageOver,
    }
    const browser = { newPage: vi.fn(async () => page), close: vi.fn(async () => {}) }
    const preview = { base: 'http://127.0.0.1:4999', stop: vi.fn(async () => {}) }
    const logs: string[] = []
    const warnings: string[] = []
    const errors: string[] = []
    const deps = {
      root,
      log: (m: string) => logs.push(m),
      warn: (m: string) => warnings.push(m),
      error: (m: string) => errors.push(m),
      build: vi.fn(async () => ({ code: 0, output: '' })),
      startPreview: vi.fn(async () => preview),
      launchBrowser: vi.fn(async () => browser),
      readRegistry: () => [{ slug: 'demo', title: 'Demo' }],
      ...over,
    }
    return { deps, page, browser, preview, logs, warnings, errors, events, out }
  }
  it('waits the settle interval before each capture and reports warnings with exit 0', async () => {
    const h = harness()
    // --out must stay inside the project
    const out = path.join(root, 'artifacts', 'unit-inspect')
    const code = await runInspect(['demo', '--out', path.relative(root, out), '--settle-ms', '25', '--no-build'], h.deps)
    rmSync(out, { recursive: true, force: true })
    expect(code).toBe(0)
    expect(h.events).toEqual([
      'settle:25', 'shot:step-01.png', 'settle:25', 'shot:step-02.png', 'settle:25', 'shot:step-03.png',
    ])
    expect(h.warnings.some((w) => /\[attribution\]/.test(w))).toBe(true) // advisory only
    expect(h.deps.build).not.toHaveBeenCalled()
    expect(h.browser.close).toHaveBeenCalled()
    expect(h.preview.stop).toHaveBeenCalled()
  })

  it.each([
    ['unregistered slug', { readRegistry: () => [] }, {}, /not registered/, false],
    ['build failure', { build: async () => ({ code: 2, output: 'boom' }) }, {}, /npm run build failed/, false],
    ['preview failure', { startPreview: async () => { throw new Error('port busy') } }, {}, /port busy/, false],
    ['navigation failure', {}, { goto: async () => { throw new Error('net::ERR') } }, /net::ERR/, true],
    ['screenshot failure', {}, { screenshot: async () => { throw new Error('disk full') } }, /disk full/, true],
  ])('exits nonzero with a clear error on %s and cleans up', async (_name, depOver, pageOver, message, started) => {
    const h = harness(depOver, pageOver)
    const out = path.join(root, 'artifacts', 'unit-inspect-fail')
    const code = await runInspect(['demo', '--out', path.relative(root, out)], h.deps)
    rmSync(out, { recursive: true, force: true })
    expect(code).toBe(1)
    expect(h.errors.join('\n')).toMatch(message)
    expect(h.errors[0]).toMatch(/^inspect failed:/)
    expect(h.preview.stop).toHaveBeenCalledTimes(started ? 1 : 0)
    expect(h.browser.close).toHaveBeenCalledTimes(started ? 1 : 0)
  })

  it('rejects bad arguments before doing any work', async () => {
    const h = harness()
    expect(await runInspect(['--viewport', 'x'], h.deps)).toBe(1)
    expect(h.deps.startPreview).not.toHaveBeenCalled()
  })
})
