import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM script without type declarations
import { run, startPreview } from '../scripts/lib.mjs'
import { REPO } from './helpers'

// Browser observation of entity continuity in the reference sample (AT-003 subset).
describe('sample scene continuity in a production preview', () => {
  it('keeps persisting entities mounted, enters newcomers after a delay, and exits departing ones', async () => {
    expect((await run('npm', ['run', 'build'], REPO)).code).toBe(0)
    const preview = await startPreview(REPO)
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
      await page.goto(`${preview.base}/how-to-make-a-presentation`)
      await page.waitForSelector('[data-step-count]')
      const entity = (id: string) => `[data-presentation-entity="htm/${id}"]`
      const settle = () => page.waitForTimeout(2000)
      const goto = async (i: number) => {
        await page.click(`[data-presentation-dot] >> nth=${i}`)
        await settle()
      }

      await goto(2) // step 3: first card only
      await page.evaluate((sel) => ((document.querySelector(sel) as HTMLElement & { marker?: number }).marker = 42), entity('you'))
      expect(await page.locator(entity('card-2')).count()).toBe(0)

      await page.keyboard.press('ArrowRight') // step 4: card-2 is a newcomer
      await page.waitForSelector(entity('card-2'), { state: 'attached' })
      const opacityRightAfter = await page.locator(entity('card-2')).evaluate((e) => Number(getComputedStyle(e.parentElement!).opacity))
      expect(opacityRightAfter).toBeLessThan(0.5)
      await settle()
      const opacitySettled = await page.locator(entity('card-2')).evaluate((e) => Number(getComputedStyle(e.parentElement!).opacity))
      expect(opacitySettled).toBe(1)
      const marker = await page.evaluate((sel) => (document.querySelector(sel) as HTMLElement & { marker?: number }).marker, entity('you'))
      expect(marker, 'persisting entity stayed mounted').toBe(42)
      expect(await page.locator('[data-presentation-scene]').count(), 'single scene instance').toBe(1)

      await page.keyboard.press('ArrowLeft') // departing entity exits
      await settle()
      expect(await page.locator(entity('card-2')).count()).toBe(0)
    } finally {
      await browser.close()
      preview.stop()
    }
  })
})
