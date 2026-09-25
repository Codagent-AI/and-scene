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
          <nav data-presentation-toc class="presentation-toc"><button data-presentation-active="false">Section</button></nav>
          <a data-presentation-attribution href="#">made by and-scene</a>
        </footer>
      `)
      const first = await page.evaluate(inspectVisualComposition)
      expect(first.overlaps.some((warning: string) => warning.includes('scene-copy'))).toBe(true)
      expect(first.indistinct).toContain('button')
      expect(first.indistinct).toContain('nav.presentation-toc: missing active control')
      expect(first.polishedAttribution).toBe(false)

      await page.locator('#scene-copy').evaluate((element) => element.setAttribute('data-presentation-allow-overlap', ''))
      const exempt = await page.evaluate(inspectVisualComposition)
      expect(exempt.overlaps).toEqual([])
    } finally {
      await browser.close()
    }
  }, 30_000)

  it('compares active and inactive controls across the whole navigation when each control is wrapped', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.setContent(`
        <footer data-presentation-footer>
          <nav data-presentation-progress><ul><li><button data-presentation-active="true">•</button></li><li><button data-presentation-active="false">•</button></li></ul></nav>
        </footer>
      `)
      const diagnostics = await page.evaluate(inspectVisualComposition)
      expect(diagnostics.indistinct).toEqual(['button'])
    } finally {
      await browser.close()
    }
  }, 30_000)

  it('does not flag a styled single-control navigation that has no inactive control to compare', async () => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.setContent(`
        <style>[data-presentation-active="true"] { color: rgb(161, 62, 38); }</style>
        <footer data-presentation-footer>
          <nav data-presentation-progress><button data-presentation-active="true">•</button></nav>
          <nav data-presentation-toc><button data-presentation-active="true">Start</button></nav>
        </footer>
      `)
      const diagnostics = await page.evaluate(inspectVisualComposition)
      expect(diagnostics.indistinct).toEqual([])
    } finally {
      await browser.close()
    }
  }, 30_000)
})
