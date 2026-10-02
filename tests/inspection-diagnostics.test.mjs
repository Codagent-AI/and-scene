import { describe, expect, it } from 'vitest'
import { chromium } from '@playwright/test'
import { inspectWarnings } from '../scripts/inspection-diagnostics.mjs'

describe('presentation inspection diagnostics', () => {
  it('captures after settling and reports overlap, active-state, and attribution defects with exemptions', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
      await page.setContent(`<style>
        [data-presentation]{position:relative;width:800px;height:600px}
        .overlap{position:absolute;left:100px;top:100px;width:100px;height:30px;background:#eee}
        [data-presentation-progress-item]{position:absolute;left:10px;top:10px;width:20px;height:10px;color:black;background:white;font-weight:400}
        [data-presentation-progress-item]:nth-of-type(2){left:40px}
        .delayed{opacity:0;transition:opacity 80ms linear}.settled .delayed{opacity:1}
      </style><main data-presentation>
        <div class="overlap" data-scene-entity="Unmarked text">Unmarked text</div><div class="overlap" data-scene-entity="Colliding label">Colliding label</div><section data-allow-overlap><div class="overlap">Intentional A</div><div class="overlap">Intentional B</div></section>
        <button data-presentation-progress-item aria-current="step">active</button><button data-presentation-progress-item>inactive</button>
        <div class="delayed">settled content</div>
      </main>`)
      await page.waitForTimeout(100)
      await page.locator('[data-presentation]').evaluate((node) => node.classList.add('settled'))
      await page.waitForTimeout(100)
      expect(await page.locator('.delayed').evaluate((node) => getComputedStyle(node).opacity)).toBe('1')
      const screenshot = await page.screenshot()
      expect(screenshot.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      let warnings = await inspectWarnings(page)
      expect(warnings.some((warning) => warning.includes('visible text/chrome overlap') && warning.includes('Unmarked text'))).toBe(true)
      expect(warnings.some((warning) => warning.includes('active progress'))).toBe(true)
      expect(warnings).toContain('missing attribution')
      await page.locator('[data-allow-overlap]').evaluate((node) => node.setAttribute('data-allow-overlap', ''))
      await page.locator('main').evaluate((node) => node.insertAdjacentHTML('beforeend', '<a data-presentation-attribution href="#" style="font-size:9px;color:rgb(0,0,238);text-decoration:underline">credit</a>'))
      warnings = await inspectWarnings(page)
      expect(warnings.some((warning) => warning.includes('Intentional A') || warning.includes('Intentional B'))).toBe(false)
      expect(warnings.some((warning) => warning.includes('attribution may be browser-default or undersized'))).toBe(true)
    } finally { await browser.close() }
  }, 30000)
})
