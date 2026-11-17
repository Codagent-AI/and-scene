import { EventEmitter } from 'node:events'
import { expect, it, vi } from 'vitest'
import { openPresentation } from '../scripts/browser.mjs'
function fixture() {
  const waitFor = vi.fn().mockResolvedValue(undefined)
  const getAttribute = vi.fn().mockResolvedValue('9')
  const page = Object.assign(new EventEmitter(), {
    goto: vi.fn().mockResolvedValue(undefined),
    locator: vi.fn(() => ({ waitFor, getAttribute })),
    close: vi.fn().mockResolvedValue(undefined),
  })
  const browser = { newPage: vi.fn().mockResolvedValue(page) }
  return { browser, page, waitFor, getAttribute }
}
it('R2 missing step hook retains page and console error causes and closes the page', async () => {
  const { browser, page, waitFor } = fixture()
  const timeout = new Error('step hook wait timed out')
  page.goto.mockImplementation(async () => {
    page.emit('pageerror', new Error('render exploded'))
    page.emit('console', { type: () => 'error', text: () => 'chunk load failed' })
    page.emit('console', { type: () => 'warning', text: () => 'unrelated warning' })
  })
  waitFor.mockRejectedValue(timeout)
  await expect(openPresentation(browser, 'http://127.0.0.1:1234', 'example')).rejects.toMatchObject({
    message: 'render phase step 0: step hook wait timed out; page errors: render exploded; chunk load failed',
    cause: timeout, pageErrors: ['render exploded', 'chunk load failed'],
  })
  expect(page.close).toHaveBeenCalledOnce()
})
it('R2 navigation failure closes its page and preserves the original cause', async () => {
  const { browser, page } = fixture()
  const cause = new Error('navigation connection refused')
  page.goto.mockRejectedValue(cause)
  await expect(openPresentation(browser, 'http://127.0.0.1:1234', 'example')).rejects.toMatchObject({ cause, message: 'render phase step 0: navigation connection refused' })
  expect(page.close).toHaveBeenCalledOnce()
})
it.each(['0', '-1', 'NaN', null])('R2 invalid step count %s closes the page', async value => {
  const { browser, page, getAttribute } = fixture()
  getAttribute.mockResolvedValue(value)
  await expect(openPresentation(browser, 'http://127.0.0.1:1234', 'example')).rejects.toThrow('render phase step 0: invalid step count')
  expect(page.close).toHaveBeenCalledOnce()
})
it('R2 cleanup failure is included without masking the initial render failure', async () => {
  const { browser, page, waitFor } = fixture()
  const cause = new Error('render never mounted')
  waitFor.mockRejectedValue(cause)
  page.close.mockRejectedValue(new Error('page already disconnected'))
  await expect(openPresentation(browser, 'http://127.0.0.1:1234', 'example')).rejects.toMatchObject({ cause, message: 'render phase step 0: render never mounted; page cleanup failed: page already disconnected' })
})
it('R2 valid presentation transfers the open page and collected errors to the caller', async () => {
  const { browser, page } = fixture()
  page.goto.mockImplementation(async () => { page.emit('console', { type: () => 'error', text: () => 'deferred scene error' }) })
  const result = await openPresentation(browser, 'http://127.0.0.1:1234', 'example')
  expect(result).toEqual({ page, count: 9, errors: ['deferred scene error'] })
  expect(page.close).not.toHaveBeenCalled()
})
