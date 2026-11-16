import { describe, expect, it, vi } from 'vitest'
import { visitSteps } from '../scripts/browser.mjs'

function fixture(count = 2) {
  const handlers = new Map<string, (value: unknown) => void>()
  const root = { waitFor: vi.fn(async () => {}), getAttribute: vi.fn(async () => String(count)) }
  const page = {
    on: vi.fn((name: string, handler: (value: unknown) => void) => handlers.set(name, handler)),
    goto: vi.fn(async () => {}),
    locator: vi.fn(() => root),
    waitForFunction: vi.fn(async () => {}),
    waitForTimeout: vi.fn(async () => {}),
    keyboard: { press: vi.fn(async () => {}) },
  }
  return { page, handlers }
}
describe('R1 verification error context', () => {
  it.each(['console', 'pageerror'])('R1 retains a stalled transition and its cause alongside %s errors', async kind => {
    const { page, handlers } = fixture()
    const timeout = new Error('transition wait timed out')
    page.keyboard.press.mockImplementation(async () => {
      if (kind === 'console') handlers.get(kind)!({ type: () => 'error', text: () => 'secondary diagnostic' })
      else handlers.get(kind)!(new Error('secondary diagnostic'))
    })
    page.waitForFunction.mockResolvedValueOnce(undefined).mockRejectedValueOnce(timeout)
    const error = await visitSteps(page, 'http://127.0.0.1:4173', 'example', { settle: 0 }).catch((error: Error) => error)
    expect(error.message).toContain('step 1')
    expect(error.message).toContain('secondary diagnostic')
    expect(error.message).toContain('transition wait timed out')
    expect(error.cause).toBe(timeout)
  })
  it('R1 retains invalid step-count failure when navigation also logs an error', async () => {
    const { page, handlers } = fixture(0)
    page.goto.mockImplementation(async () => { handlers.get('console')!({ type: () => 'error', text: () => 'load diagnostic' }) })
    const error = await visitSteps(page, 'http://127.0.0.1:4173', 'example').catch((error: Error) => error)
    expect(error.message).toContain('invalid data-step-count')
    expect(error.message).toContain('load diagnostic')
    expect(error.cause.message).toBe('invalid data-step-count')
  })
  it('R1 preserves the original failure without accompanying browser errors', async () => {
    const { page } = fixture()
    const original = new Error('navigation failed')
    page.goto.mockRejectedValueOnce(original)
    await expect(visitSteps(page, 'http://127.0.0.1:4173', 'example')).rejects.toMatchObject({ message: 'step 0: navigation failed', cause: original })
  })
})
