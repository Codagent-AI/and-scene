import { describe, expect, it, vi } from 'vitest'
import { closeAll } from '../../scripts/lib/preview.mjs'

describe('closeAll', () => {
  it('closes the browser, then stops the preview', async () => {
    const order: string[] = []
    await closeAll({ close: async () => void order.push('browser') }, { stop: async () => void order.push('preview') })
    expect(order).toEqual(['browser', 'preview'])
  })

  it('still stops the preview when closing the browser rejects, and surfaces that error', async () => {
    const stop = vi.fn(async () => undefined)
    await expect(closeAll({ close: async () => { throw new Error('close failed') } }, { stop })).rejects.toThrow('close failed')
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('stops the preview when no browser was ever launched', async () => {
    const stop = vi.fn(async () => undefined)
    await closeAll(undefined, { stop })
    expect(stop).toHaveBeenCalledTimes(1)
  })
})
