// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdir, rm } from 'node:fs/promises'
import { command } from '../scripts/lib/browser.mjs'
import { inspectPresentation, inspectionOptions } from '../scripts/inspect-presentation.mjs'

const state = vi.hoisted(() => ({ files: new Map<string, string>(), steps: 3 }))
vi.mock('node:fs/promises', () => ({
  rm: vi.fn(async (path: string) => { for (const name of state.files.keys()) if (name.startsWith(path + '/')) state.files.delete(name) }),
  mkdir: vi.fn(async () => undefined),
  writeFile: vi.fn(async (path: string, value: string) => { state.files.set(path, value) }),
}))
vi.mock('../scripts/lib/browser.mjs', () => ({
  SETTLE_MS: 800,
  command: vi.fn(async () => undefined),
  withBrowser: vi.fn(async (_root: string, visit: (page: unknown, url: string) => Promise<void>) => visit({ evaluate: async () => ({ elements: [], attribution: null }) }, 'http://127.0.0.1:12345')),
  walkSteps: vi.fn(async (page: unknown, _url: string, visit: (page: unknown, index: number) => Promise<void>) => { for (let i = 0; i < state.steps; i++) await visit(page, i) }),
}))
vi.mock('../scripts/lib/diagnostics.mjs', () => ({
  collectVisualState: vi.fn(), diagnose: vi.fn(() => []),
  captureSettled: vi.fn(async (_page: unknown, path: string) => { state.files.set(path, 'png'); return { sceneText: 'settled', capturedAt: 800 } }),
}))
beforeEach(() => { vi.clearAllMocks(); state.files.clear(); state.steps = 3 })
describe('R3 inspection inputs and artifact replacement', () => {
  it.each([['probe', '--width'], ['probe', '--width', 'abc'], ['probe', '--width', 'NaN'], ['probe', '--width', '0'], ['probe', '--width', '-10'], ['probe', '--width', '390.5']])('rejects invalid CLI width before build or filesystem work: %j', async (...args) => {
    await expect(inspectPresentation({ root: '/app', ...inspectionOptions(args) })).rejects.toThrow('(--width) must be a positive integer')
    expect(command).not.toHaveBeenCalled(); expect(mkdir).not.toHaveBeenCalled(); expect(rm).not.toHaveBeenCalled()
    expect(state.files.size).toBe(0)
  })
  it.each([NaN, 0, -1, 900.5])('validates an API viewport height before side effects: %s', async height => {
    await expect(inspectPresentation({ root: '/app', slug: 'probe', viewport: { width: 390, height } })).rejects.toThrow('height must be a positive integer')
    expect(command).not.toHaveBeenCalled(); expect(rm).not.toHaveBeenCalled()
  })
  it('preserves defaults and valid narrow viewport parsing', () => {
    expect(inspectionOptions(['probe']).viewport).toEqual({ width: 1440, height: 900 })
    expect(inspectionOptions(['probe', '--width', '390', '--no-build'])).toEqual({ slug: 'probe', viewport: { width: 390, height: 900 }, build: false })
  })
  it('removes stale screenshots and report before a shorter capture run, only within its viewport directory', async () => {
    const first = await inspectPresentation({ root: '/app', slug: 'probe', build: false })
    expect(first.captures).toHaveLength(3)
    const outside = '/app/.artifacts/inspection/other/1440x900/step-01.png'
    state.files.set(outside, 'keep')
    state.steps = 1
    const second = await inspectPresentation({ root: '/app', slug: 'probe', build: false })
    expect(second.captures).toHaveLength(1)
    expect(state.files.has(first.output + '/step-01.png')).toBe(true)
    expect(state.files.has(first.output + '/step-02.png')).toBe(false)
    expect(state.files.has(first.output + '/step-03.png')).toBe(false)
    expect(JSON.parse(state.files.get(first.output + '/report.json')!).captures).toHaveLength(1)
    expect(state.files.get(outside)).toBe('keep')
    expect(rm).toHaveBeenLastCalledWith(first.output, { recursive: true, force: true })
    expect(vi.mocked(rm).mock.invocationCallOrder[1]).toBeLessThan(vi.mocked(mkdir).mock.invocationCallOrder[1])
  })
})
