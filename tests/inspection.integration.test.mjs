import { mkdtempSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { chromium } from 'playwright'
import { captureSettledStep } from '../scripts/inspection-diagnostics.mjs'

describe('presentation screenshot inspection', () => {
  it('captures settled step fixtures and reports visual warnings with explicit overlap exemptions', async () => {
    const output = mkdtempSync(join(tmpdir(), 'and-scene-inspect-'))
    let browser
    try {
      browser = await chromium.launch({ headless: true })
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
      await page.setContent(`<!doctype html><style>
        body{font:16px sans-serif}.collision{position:absolute;left:20px;top:20px}.b{left:24px;top:24px}.allow{position:absolute;left:180px;top:20px}.allow>*{position:absolute;left:0;top:0}.card{opacity:0;transition:opacity 100ms}.settled .card{opacity:1}
      </style><main data-presentation><div class="collision">UNMARKED ALPHA</div><div class="collision b">UNMARKED BETA</div><div data-allow-overlap class="allow"><span>ALLOWED ALPHA</span><span>ALLOWED BETA</span></div><div class="card">transitioning fixture</div><nav data-presentation-progress><button data-presentation-progress-item data-active="true">1</button><button data-presentation-progress-item data-active="false">2</button></nav><a data-presentation-attribution href="#">made by</a></main><footer data-step-count="2" data-step-index="0"></footer><script>setTimeout(()=>document.body.classList.add('settled'),250)</script>`)
      mkdirSync(join(output, 'inspection'), { recursive: true })
      const firstWarnings = await captureSettledStep(page, 1, join(output, 'inspection', 'step-01.png'), 750)
      expect(await page.locator('body').evaluate((body) => body.classList.contains('settled'))).toBe(true)
      await page.locator('footer').evaluate((footer) => footer.setAttribute('data-step-index', '1'))
      const secondWarnings = await captureSettledStep(page, 2, join(output, 'inspection', 'step-02.png'), 750)
      const allWarnings = [...firstWarnings, ...secondWarnings].join('\n')
      expect(firstWarnings.join('\n')).toContain('UNMARKED ALPHA / UNMARKED BETA')
      expect(firstWarnings.join('\n')).not.toContain('ALLOWED ALPHA / ALLOWED BETA')
      expect(firstWarnings.join('\n')).toContain('active progress/ToC state is not visually distinct')
      expect(firstWarnings.join('\n')).toContain('attribution is missing, browser-default, or undersized')
      expect(allWarnings).toContain('step 2')
      expect(readdirSync(join(output, 'inspection'))).toEqual(['step-01.png', 'step-02.png'])
    } finally {
      await browser?.close()
      rmSync(output, { recursive: true, force: true })
    }
  }, 30_000)
})
