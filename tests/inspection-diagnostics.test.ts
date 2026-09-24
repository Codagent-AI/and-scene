import { readFile, rm } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { chromium } from 'playwright'
import { collectVisualDiagnostics } from '../scripts/inspection-diagnostics.mjs'
import { ensureChromiumInstalled } from '../scripts/chromium.mjs'

describe('inspection diagnostics against a controlled browser composition', () => {
  it('captures after a step settles and warns on collisions, weak chrome, and attribution while exempting allowed overlap', async () => {
    await ensureChromiumInstalled()
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
      await page.setContent(`<style>
        body { margin: 0 } [data-presentation-node] { position: absolute; left: 20px; top: 20px; width: 100px; height: 40px; }
        #plain-a { background: #eee } #plain-b { background: #ddd }
        [data-presentation-allow-overlap] { z-index: 1 }
      </style>
      <main data-presentation data-step-index="0"><div id="plain-a" data-presentation-node>collision one</div><div id="plain-b" data-presentation-node>collision two</div>
      <div data-presentation-allow-overlap><div id="allowed" data-presentation-node style="top:20px">intentional</div></div>
      <nav data-presentation-progress><button data-presentation-progress-item data-presentation-active="true">1</button><button data-presentation-progress-item data-presentation-active="false">2</button></nav>
      <nav data-presentation-toc><button data-presentation-toc-item data-presentation-active="true">section</button><button data-presentation-toc-item data-presentation-active="false">other</button></nav>
      <span data-presentation-attribution><a>made by and-scene</a></span></main>
      <script>setTimeout(() => document.querySelector('[data-presentation]').setAttribute('data-step-index', '1'), 80)</script>`)
      await page.waitForFunction(() => document.querySelector('[data-presentation]')?.getAttribute('data-step-index') === '1')
      const settledIndex = await page.locator('[data-presentation]').getAttribute('data-step-index')
      expect(settledIndex).toBe('1')
      const screenshot = '/tmp/and-scene-inspection-fixture.png'
      await page.screenshot({ path: screenshot })
      expect((await readFile(screenshot)).byteLength).toBeGreaterThan(0)
      await rm(screenshot)
      const diagnostics = await page.evaluate(collectVisualDiagnostics)
      expect(diagnostics.overlaps.some((warning) => warning.includes('collision one') && warning.includes('collision two'))).toBe(true)
      expect(diagnostics.overlaps.some((warning) => warning.includes('intentional'))).toBe(false)
      expect(diagnostics.weakProgress).toBe(true)
      expect(diagnostics.weakToc).toBe(true)
      expect(diagnostics.weakAttribution).toBe(true)
    } finally {
      await browser.close()
    }
  }, 15_000)
})
