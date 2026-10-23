import { describe, expect, it, vi } from 'vitest'
import { PhaseFailure, renderPresentation, verify } from '../../scripts/verify.mjs'

function deps(overrides: Record<string, unknown> = {}) {
  const browser = { close: vi.fn(async () => {}) }
  const preview = { origin: 'http://127.0.0.1:4000', close: vi.fn(async () => {}) }
  const d = {
    build: vi.fn(async () => {}),
    checkSample: vi.fn(async () => ({ slugs: ['a', 'b'], reference: undefined })),
    freePort: vi.fn(async () => 4000),
    startPreview: vi.fn(async () => preview),
    waitForReady: vi.fn(async () => {}),
    launchBrowser: vi.fn(async () => browser),
    renderPresentation: vi.fn(async () => 3),
    ...overrides,
  }
  return { d, browser, preview }
}
const run = (d: object) => verify({ root: '/p', log: () => {} }, d as never)

describe('verify control flow', () => {
  it('renders every registered presentation and closes the browser and preview', async () => {
    const { d, browser, preview } = deps()
    expect(await run(d)).toEqual({ presentations: 2, steps: 6 })
    expect(d.renderPresentation).toHaveBeenCalledTimes(2)
    expect(browser.close).toHaveBeenCalled()
    expect(preview.close).toHaveBeenCalled()
  })

  it('fails the render phase and launches no browser when the preview cannot start', async () => {
    const { d } = deps({ startPreview: vi.fn(async () => { throw new Error('port in use') }) })
    await expect(run(d)).rejects.toMatchObject({ phase: 'render', message: expect.stringContaining('could not start the production preview') })
    expect(d.launchBrowser).not.toHaveBeenCalled()
  })

  it('fails the render phase and closes the preview when the readiness probe fails', async () => {
    const { d, preview } = deps({ waitForReady: vi.fn(async () => { throw new Error('never ready') }) })
    await expect(run(d)).rejects.toBeInstanceOf(PhaseFailure)
    expect(preview.close).toHaveBeenCalled()
    expect(d.launchBrowser).not.toHaveBeenCalled()
  })

  it('fails the render phase and closes the preview when Chromium cannot launch', async () => {
    const { d, preview } = deps({ launchBrowser: vi.fn(async () => { throw new Error('no chromium') }) })
    await expect(run(d)).rejects.toMatchObject({ phase: 'render', message: expect.stringContaining('could not launch Chromium') })
    expect(preview.close).toHaveBeenCalled()
    expect(d.renderPresentation).not.toHaveBeenCalled()
  })

  it('closes both when a presentation fails to render, and stops at the first failure', async () => {
    const { d, browser, preview } = deps({ renderPresentation: vi.fn(async () => { throw new PhaseFailure('render', 'step index 3') }) })
    await expect(run(d)).rejects.toMatchObject({ phase: 'render' })
    expect(d.renderPresentation).toHaveBeenCalledTimes(1)
    expect(browser.close).toHaveBeenCalled()
    expect(preview.close).toHaveBeenCalled()
  })

  it('does not start a preview when the build or sample phase fails', async () => {
    const a = deps({ build: vi.fn(async () => { throw new PhaseFailure('build', 'tsc failed') }) })
    await expect(run(a.d)).rejects.toMatchObject({ phase: 'build' })
    expect(a.d.checkSample).not.toHaveBeenCalled()
    const b = deps({ checkSample: vi.fn(async () => { throw new PhaseFailure('sample', 'missing') }) })
    await expect(run(b.d)).rejects.toMatchObject({ phase: 'sample' })
    expect(b.d.startPreview).not.toHaveBeenCalled()
  })
})

describe('renderPresentation step count', () => {
  const reference = { slug: 'ref', steps: Array.from({ length: 9 }, (_, i) => ({ era: 'e', title: `t${i}`, caption: `c${i}` })) }
  const browserWith = (count: number) => {
    const page = {
      on: vi.fn(),
      goto: vi.fn(async () => {}),
      waitForSelector: vi.fn(async () => {}),
      getAttribute: vi.fn(async () => String(count)),
      close: vi.fn(async () => {}),
    }
    return { browser: { newPage: async () => page }, page }
  }

  it('fails when the page reports a different number of steps than the reference outline', async () => {
    const { browser, page } = browserWith(8)
    await expect(renderPresentation(browser, 'http://127.0.0.1:1', 'ref', reference, { settleMs: 0, log: () => {} })).rejects.toThrow(
      /step index 0.*data-step-count is 8 but the reference outline has 9 steps/,
    )
    expect(page.close).toHaveBeenCalled()
  })
})
