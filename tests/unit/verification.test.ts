// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { traverse } from '../../scripts/browser.mjs'
it('I-38 reports offending indices for console page transition and render readiness failures', async () => {
  for (const fault of ['console', 'page', 'transition', 'count', 'ready']) {
    const handlers: Record<string, (value: unknown) => void> = {}
    let index = 0
    const page = {
      on: (name: string, callback: (value: unknown) => void) => { handlers[name] = callback },
      goto: vi.fn(async () => {}),
      locator: () => ({ waitFor: async () => { if (fault === 'ready') throw new Error('render root missing') }, getAttribute: async () => fault === 'count' ? 'invalid' : '3' }),
      keyboard: { press: async () => { if (fault !== 'transition') index++ } },
      waitForFunction: async (_callback: unknown, expected: number) => { if (index !== expected) throw new Error('timeout') },
      waitForTimeout: async () => {
        if (index === 1 && fault === 'console') handlers.console({ type: () => 'error', text: () => 'bad render' })
        if (index === 1 && fault === 'page') handlers.pageerror(new Error('bad scene'))
      },
    }
    const expected = fault === 'console' ? 'step 1: console bad render' : fault === 'page' ? 'step 1: page bad scene' : fault === 'transition' ? 'step 1: transition did not advance data-step-index' : fault === 'count' ? 'step 0: Invalid data-step-count' : 'step 0: render root missing'
    await expect(traverse(page, 'http://127.0.0.1:1', 'example', async () => {})).rejects.toThrow(expected)
  }
})
it('I-38 ignores non-error console messages and visits each public index', async () => {
  const handlers: Record<string, (value: unknown) => void> = {}, indices: number[] = []
  const page = { on: (name: string, cb: (value: unknown) => void) => { handlers[name] = cb }, goto: async () => {}, locator: () => ({ waitFor: async () => {}, getAttribute: async () => '2' }), keyboard: { press: async () => {} }, waitForFunction: async () => {}, waitForTimeout: async () => { handlers.console({ type: () => 'warning', text: () => 'advisory' }) } }
  expect(await traverse(page, 'http://127.0.0.1:1', 'example', async ({ index }: { index: number }) => { indices.push(index) })).toBe(2)
  expect(indices).toEqual([0, 1])
})
