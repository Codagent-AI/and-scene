// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { withPreview } from '../scripts/browser.mjs'
import { verify } from '../scripts/verify.mjs'
vi.mock('../scripts/browser.mjs', async importOriginal => ({
  ...await importOriginal<typeof import('../scripts/browser.mjs')>(),
  withPreview: vi.fn(), settle: vi.fn(),
}))
afterEach(() => vi.restoreAllMocks())
for (const kind of ['console', 'pageerror']) for (const target of [1, 2]) {
  it(`I-39 ${kind} during metadata at step ${target} fails with the originating index`, async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const output = vi.spyOn(console, 'log').mockImplementation(() => {})
    let step = 0
    const handlers = new Map<string, (event: { type: () => string; text: () => string; message: string }) => void>()
    const emit = () => handlers.get(kind)!({ type: () => 'error', text: () => 'metadata fault', message: 'metadata fault' })
    const page = {
      on: (name: string, handler: (event: { type: () => string; text: () => string; message: string }) => void) => handlers.set(name, handler),
      goto: vi.fn(), keyboard: { press: async () => { step++ } },
      locator: (selector: string) => ({
        waitFor: vi.fn(), getAttribute: async (name: string) => name === 'data-presentation-mode' ? 'browse' : '3',
        textContent: async () => {
          await Promise.resolve()
          if (selector.includes('marker') && step === target) emit()
          return selector.includes('marker') ? 'marker · era' : 'text'
        },
      }),
    }
    vi.mocked(withPreview).mockImplementation(async run => run(page, 'http://127.0.0.1:1234'))
    expect(await verify({ route: 'edge-case', build: false })).toBe(false)
    expect(errors.mock.calls.flat().join()).toContain(`FAIL render step ${target}: metadata fault`)
    expect(output.mock.calls.flat().join()).not.toContain('PASS verification')
  })
}
for (const kind of ['console', 'pageerror']) {
  it(`I-39 ${kind} observed during shutdown cannot produce a final pass`, async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const output = vi.spyOn(console, 'log').mockImplementation(() => {})
    const handlers = new Map<string, (event: { type: () => string; text: () => string; message: string }) => void>()
    const page = {
      on: (name: string, handler: (event: { type: () => string; text: () => string; message: string }) => void) => handlers.set(name, handler),
      goto: vi.fn(), keyboard: { press: vi.fn() },
      locator: (selector: string) => ({ waitFor: vi.fn(), getAttribute: async (name: string) => name === 'data-presentation-mode' ? 'browse' : '1', textContent: async () => selector.includes('marker') ? 'marker · era' : 'text' }),
    }
    vi.mocked(withPreview).mockImplementation(async run => {
      const result = await run(page, 'http://127.0.0.1:1234')
      handlers.get(kind)!({ type: () => 'error', text: () => 'shutdown fault', message: 'shutdown fault' })
      return result
    })
    expect(await verify({ route: 'edge-case', build: false })).toBe(false)
    expect(errors.mock.calls.flat().join()).toContain('FAIL render step 0: shutdown fault')
    expect(output.mock.calls.flat().join()).not.toContain('PASS verification')
  })
}
