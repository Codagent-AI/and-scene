import { describe, expect, it, vi } from 'vitest'
import { inspect, InspectionError, parseArgs, stepFile } from '../../scripts/inspect-presentation.mjs'

function fakes(overrides: Record<string, unknown> = {}) {
  const calls: string[] = []
  const snapshot = { items: [], activeChrome: [], attribution: { fontSize: 12, color: 'red', textDecorationLine: 'none' }, runningAnimations: 0, title: 't' }
  let shown = 0
  const page = {
    waitForFunction: vi.fn(async () => {}),
    goto: vi.fn(async () => {}),
    waitForSelector: vi.fn(async () => {}),
    getAttribute: vi.fn(async () => '2'),
    keyboard: { press: vi.fn(async () => {}) },
    evaluate: vi.fn(async () => ({ ...snapshot, index: shown++ })),
    screenshot: vi.fn(async ({ path }: { path: string }) => { calls.push(`shot ${path}`) }),
  }
  const browser = { newPage: vi.fn(async () => page), close: vi.fn(async () => { calls.push('browser closed') }) }
  const preview = { origin: 'http://127.0.0.1:5555', close: vi.fn(async () => { calls.push('preview closed') }) }
  const deps = {
    build: vi.fn(async () => {}),
    freePort: vi.fn(async () => 5555),
    startPreview: vi.fn(async () => preview),
    waitForReady: vi.fn(async () => {}),
    launchBrowser: vi.fn(async () => browser),
    mkdir: vi.fn(async () => {}),
    writeFile: vi.fn(async () => {}),
    settle: vi.fn(async (ms: number) => ms),
    log: vi.fn(),
    ...overrides,
  }
  return { deps, page, browser, preview, calls }
}

describe('inspect control flow', () => {
  it('writes one zero-padded 1-based screenshot per step and a report, then cleans up', async () => {
    const { deps, page, browser, preview } = fakes()
    const report = await inspect({ root: '/proj', slug: 'demo', build: false }, deps)
    expect(page.screenshot.mock.calls.map((c) => c[0].path)).toEqual(['/proj/inspection/demo/step-01.png', '/proj/inspection/demo/step-02.png'])
    expect(page.keyboard.press).toHaveBeenCalledTimes(1)
    expect(deps.settle).toHaveBeenCalledTimes(2)
    expect(deps.settle).toHaveBeenCalledWith(900)
    expect(report.steps.map((s: { index: number }) => s.index)).toEqual([0, 1])
    expect(page.goto).toHaveBeenCalledWith('http://127.0.0.1:5555/demo', expect.anything())
    expect(deps.build).not.toHaveBeenCalled()
    expect(browser.close).toHaveBeenCalled()
    expect(preview.close).toHaveBeenCalled()
  })

  it('builds first by default, honours --settle and a custom viewport directory', async () => {
    const { deps } = fakes()
    await inspect({ root: '/proj', slug: 'demo', settleMs: 120, viewport: { width: 390, height: 844 } }, deps)
    expect(deps.build).toHaveBeenCalledWith('/proj')
    expect(deps.settle).toHaveBeenCalledWith(120)
    expect(deps.mkdir).toHaveBeenCalledWith('/proj/inspection/demo-390x844')
  })

  it('does not fail on warnings: it prints them and resolves', async () => {
    const { deps } = fakes({ log: vi.fn() })
    const bad = { items: [], activeChrome: [], attribution: null, runningAnimations: 0, title: 't' }
    const { page } = fakes()
    void page
    deps.launchBrowser = vi.fn(async () => ({
      newPage: async () => ({
        goto: async () => {}, waitForSelector: async () => {}, getAttribute: async () => '1',
        keyboard: { press: async () => {} }, waitForFunction: async () => {}, evaluate: async () => ({ ...bad, index: 0 }), screenshot: async () => {},
      }),
      close: async () => {},
    }))
    const report = await inspect({ root: '/p', slug: 's', build: false }, deps)
    expect(report.warnings).toHaveLength(1)
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining('WARN [attribution] step 1'))
  })

  it('refuses to capture a repeated step when navigation stalls, and when the page shows another step', async () => {
    const a = fakes()
    a.page.waitForFunction.mockRejectedValue(new Error('timeout'))
    await expect(inspect({ root: '/p', slug: 's', build: false }, a.deps)).rejects.toThrow(/did not advance data-step-index to 1/)
    expect(a.page.screenshot).toHaveBeenCalledTimes(1) // only the first step was captured
    expect(a.browser.close).toHaveBeenCalled()

    const b = fakes()
    b.page.evaluate.mockResolvedValue({ items: [], activeChrome: [], attribution: null, runningAnimations: 0, title: 't', index: 0 })
    await expect(inspect({ root: '/p', slug: 's', build: false }, b.deps)).rejects.toThrow(/expected step index 1 at capture but the page shows 0/)
    expect(b.preview.close).toHaveBeenCalled()
  })

  it('fails and cleans up when the route does not load', async () => {
    const { deps, page, browser, preview } = fakes()
    page.waitForSelector.mockRejectedValue(new Error('timeout'))
    await expect(inspect({ root: '/p', slug: 'nope', build: false }, deps)).rejects.toThrow(InspectionError)
    expect(browser.close).toHaveBeenCalled()
    expect(preview.close).toHaveBeenCalled()
  })

  it('fails and cleans up when a screenshot cannot be written', async () => {
    const { deps, page, browser, preview } = fakes()
    page.screenshot.mockRejectedValue(new Error('disk full'))
    await expect(inspect({ root: '/p', slug: 's', build: false }, deps)).rejects.toThrow(/could not write screenshot/)
    expect(browser.close).toHaveBeenCalled()
    expect(preview.close).toHaveBeenCalled()
  })

  it('fails when the preview cannot start, and closes the preview when the browser cannot launch', async () => {
    const a = fakes({ startPreview: vi.fn(async () => { throw new Error('port in use') }) })
    await expect(inspect({ root: '/p', slug: 's', build: false }, a.deps)).rejects.toThrow(/could not start the production preview/)
    expect(a.deps.launchBrowser).not.toHaveBeenCalled()

    const b = fakes({ launchBrowser: vi.fn(async () => { throw new Error('no chromium') }) })
    await expect(inspect({ root: '/p', slug: 's', build: false }, b.deps)).rejects.toThrow(/could not launch Chromium/)
    expect(b.preview.close).toHaveBeenCalled()
  })

  it('requires a slug and propagates build failures', async () => {
    await expect(inspect({ root: '/p' }, fakes().deps)).rejects.toThrow(/usage/)
    const { deps } = fakes({ build: vi.fn(async () => { throw new InspectionError('build failed') }) })
    await expect(inspect({ root: '/p', slug: 's' }, deps)).rejects.toThrow('build failed')
    expect(deps.startPreview).not.toHaveBeenCalled()
  })
})

describe('helpers', () => {
  it('parses CLI arguments', () => {
    expect(parseArgs(['demo', '--settle', '300', '--viewport', '390x844', '--no-build', '--port', '9'])).toMatchObject({
      slug: 'demo', settleMs: 300, viewport: { width: 390, height: 844 }, build: false, port: 9,
    })
    expect(parseArgs(['x']).build).toBe(true)
  })
  it('names screenshots step-NN.png', () => {
    expect(stepFile('/o', 0)).toBe('/o/step-01.png')
    expect(stepFile('/o', 11)).toBe('/o/step-12.png')
  })
})
