import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'
import { inspectVisualComposition } from '../scripts/visual-diagnostics.mjs'

describe('visual inspection diagnostics', () => {
  it('warns on unmarked overlap, indistinct active controls, and unpolished attribution but honors overlap markers', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.setContent(`
        <style>
          [data-presentation-stage] { position: relative; height: 100px; }
          [data-presentation-scene] { position: absolute; inset: 0; }
          [data-presentation-footer] { position: absolute; inset: 0; }
        </style>
        <div data-presentation-stage><div data-presentation-scene><span id="scene-copy" style="position:absolute;left:5px;top:5px">Scene text</span></div></div>
        <footer data-presentation-footer>
          <nav data-presentation-progress><button data-presentation-active="true">•</button><button data-presentation-active="false">•</button></nav>
          <a data-presentation-attribution href="#">made by and-scene</a>
        </footer>
      `)
      const first = await page.evaluate(inspectVisualComposition)
      expect(first.overlaps.some((warning: string) => warning.includes('scene-copy'))).toBe(true)
      expect(first.indistinct).toContain('button')
      expect(first.polishedAttribution).toBe(false)

      await page.locator('#scene-copy').evaluate((element) => element.setAttribute('data-presentation-allow-overlap', ''))
      const exempt = await page.evaluate(inspectVisualComposition)
      expect(exempt.overlaps).toEqual([])
    } finally {
      await browser.close()
    }
  }, 30_000)
})
