// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
// @ts-expect-error Portable Node script has no declaration file.
import { renderSteps } from '../scripts/verify.mjs'

describe('I-43 configured capture settling', () => {
  it('awaits the full requested interval after each active-index confirmation and before capture', async () => {
    const releases: (() => void)[] = []
    const order: string[] = []
    let active = 0
    const page = Object.assign(new EventEmitter(), {
      goto: vi.fn(async () => {}),
      locator: () => ({ first: () => ({ waitFor: async () => {}, getAttribute: async () => '2' }) }),
      waitForFunction: vi.fn(async (_: unknown, index: number) => { expect(index).toBe(active); order.push(`active ${index}`) }),
      waitForTimeout: vi.fn((ms: number) => { order.push(`wait ${ms}`); return new Promise<void>(resolve => releases.push(resolve)) }),
      keyboard: { press: vi.fn(async () => { active++; order.push('advance') }) },
    })
    const capture = vi.fn(async (_: unknown, index: number) => { order.push(`capture ${index}`) })
    const render = renderSteps(page, 'http://127.0.0.1:1234', 'fixture', {settle: 375,onStep:capture})
    await vi.waitFor(() => expect(releases).toHaveLength(1))
    expect(capture).not.toHaveBeenCalled()
    releases[0]()
    await vi.waitFor(() => expect(releases).toHaveLength(2))
    expect(capture).toHaveBeenCalledTimes(1)
    releases[1]()
    await render
    expect(capture).toHaveBeenCalledTimes(2)
    expect(page.waitForTimeout.mock.calls).toEqual([[375],[375]])
    expect(order).toEqual(['active 0','wait 375','capture 0','advance','active 1','wait 375','capture 1'])
  })
})
