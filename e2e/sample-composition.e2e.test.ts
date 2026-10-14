import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'playwright'
import { repoRoot, run } from './helpers'

type Preview = { url: string; stop: () => Promise<void> }

describe('Reference sample composition', () => {
  let preview: Preview
  let browser: Browser

  beforeAll(async () => {
    expect((await run('npm', ['run', 'build'], repoRoot)).code).toBe(0)
    const lib = await import(/* @vite-ignore */ '../scripts/lib/preview.mjs')
    preview = await lib.startPreview(repoRoot)
    browser = await lib.launchChromium()
  })

  afterAll(async () => {
    await browser?.close()
    await preview?.stop()
  })

  it('leaves the step-card tray unframed from step 3 through step 8', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${preview.url}/how-to-make-a-presentation`, { waitUntil: 'networkidle' })
    for (let step = 1; step <= 8; step++) {
      if (step >= 3) {
        const borders = await page.evaluate(() => {
          const tray = document.querySelector('[data-presentation-id="htp-tray"]')
          if (!tray) return null
          const cs = getComputedStyle(tray)
          return [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth, cs.outlineStyle]
        })
        expect(borders, `tray at step ${step}`).toEqual(['0px', '0px', '0px', '0px', 'none'])
      }
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(150)
    }
    await page.close()
  })
})
