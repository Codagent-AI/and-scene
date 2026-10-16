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

  it('keeps the canvas scale constant while navigating within a mode', async () => {
    const preview = await startPreview(REPO)
    const browser = await chromium.launch()
    try {
      for (const [width, height] of [[1000, 500], [390, 844]]) {
        const page = await browser.newPage({ viewport: { width, height } })
        await page.goto(`${preview.base}/how-to-make-a-presentation`)
        await page.waitForSelector('[data-step-count]')
        for (const mode of ['browse', 'present']) {
          if ((await page.getAttribute('[data-presentation-root]', 'data-presentation-mode')) !== mode) await page.keyboard.press('p')
          const scales = new Set<string>()
          for (let i = 0; i < 9; i++) await page.keyboard.press('ArrowLeft')
          for (let i = 0; i < 9; i++) {
            if (i > 0) await page.keyboard.press('ArrowRight')
            await page.waitForTimeout(150)
            scales.add((await page.getAttribute('[data-presentation-stage]', 'data-presentation-scale'))!)
          }
          expect([...scales], `${width}x${height} ${mode}`).toHaveLength(1)
        }
        await page.close()
      }
    } finally {
      await browser.close()
      preview.stop()
    }
  })

  it('keeps the header title inside the viewport on every step at narrow widths, and draws the tray without an outline', async () => {
    const preview = await startPreview(REPO)
    const browser = await chromium.launch()
    try {
      for (const [width, height] of [[390, 844], [360, 740], [320, 640]]) {
        const page = await browser.newPage({ viewport: { width, height } })
        await page.goto(`${preview.base}/how-to-make-a-presentation`)
        await page.waitForSelector('[data-step-count]')
        for (let i = 0; i < 9; i++) {
          if (i > 0) await page.keyboard.press('ArrowRight')
          await page.waitForTimeout(150)
          const title = await page.locator('[data-presentation-title]').evaluate((e) => {
            const r = e.getBoundingClientRect()
            return { text: e.textContent, left: r.left, right: r.right, scrollWidth: e.scrollWidth, clientWidth: e.clientWidth }
          })
          expect(title.left, `${width}px step ${i + 1} left`).toBeGreaterThanOrEqual(0)
          expect(title.right, `${width}px step ${i + 1} "${title.text}"`).toBeLessThanOrEqual(width)
          expect(title.scrollWidth, `${width}px step ${i + 1} text not clipped`).toBeLessThanOrEqual(title.clientWidth)
          if (i === 5) {
            const tray = await page.locator('[data-presentation-entity="htm/tray"]').evaluate((e) => {
              const c = getComputedStyle(e)
              return { border: c.borderTopWidth, outline: c.outlineStyle }
            })
            expect(tray, 'tray is not framed').toEqual({ border: '0px', outline: 'none' })
          }
        }
        await page.close()
      }
    } finally {
      await browser.close()
      preview.stop()
    }
  })
})
