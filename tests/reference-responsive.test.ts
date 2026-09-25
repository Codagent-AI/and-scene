import { describe, expect, it } from 'vitest'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { collectVisualDiagnostics } from '../scripts/inspection-diagnostics.mjs'
import { ensureChromiumInstalled } from '../scripts/chromium.mjs'

describe('reference presentation at a phone-width viewport', () => {
  it('keeps chrome and scene content free of accidental collisions on every step', async () => {
    await ensureChromiumInstalled()
    const server = await createServer({ logLevel: 'silent', server: { host: '127.0.0.1', port: 0 } })
    try {
      await server.listen()
      const browser = await chromium.launch({ headless: true })
      try {
        const address = server.httpServer?.address()
        if (!address || typeof address === 'string') throw new Error('dev server did not expose a TCP address')
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
        await page.goto(`http://127.0.0.1:${address.port}/how-to-make-a-presentation`, { waitUntil: 'networkidle' })
        const count = Number(await page.locator('[data-presentation]').getAttribute('data-step-count'))
        const overlaps: string[] = []
        for (let index = 0; index < count; index++) {
          if (index > 0) await page.keyboard.press('ArrowRight')
          await page.waitForFunction((expected) => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === String(expected), index)
          await page.waitForTimeout(1200)
          const diagnostics = await page.evaluate(collectVisualDiagnostics)
          overlaps.push(...diagnostics.overlaps.map((overlap) => `step ${index + 1}: ${overlap}`))
        }
        expect(count).toBe(9)
        expect(overlaps).toEqual([])
      } finally {
        await browser.close()
      }
    } finally {
      await server.close()
    }
  }, 60_000)
})
