import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium } from 'playwright'
import type { Browser } from 'playwright'
import { createServer } from 'vite'
import type { ViteDevServer } from 'vite'
import { collectVisualDiagnostics } from '../scripts/inspection-diagnostics.mjs'
import { ensureChromiumInstalled } from '../scripts/chromium.mjs'

const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet portrait', width: 768, height: 900 },
  { name: 'desktop', width: 1440, height: 900 },
]

describe('reference presentation across viewport widths', () => {
  let server: ViteDevServer | undefined
  let browser: Browser | undefined
  let baseUrl = ''

  beforeAll(async () => {
    await ensureChromiumInstalled()
    server = await createServer({ logLevel: 'silent', server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const address = server.httpServer?.address()
    if (!address || typeof address === 'string') throw new Error('dev server did not expose a TCP address')
    baseUrl = `http://127.0.0.1:${address.port}`
    browser = await chromium.launch({ headless: true })
  }, 60_000)

  afterAll(async () => {
    try {
      await browser?.close()
    } finally {
      await server?.close()
    }
  })

  it.each(viewports)('keeps chrome and scene content free of accidental collisions on every step at $name width', async ({ width, height }) => {
    const page = await browser!.newPage({ viewport: { width, height } })
    try {
      await page.goto(`${baseUrl}/how-to-make-a-presentation`, { waitUntil: 'networkidle' })
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
      await page.close()
    }
  }, 60_000)
})
