import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium } from 'playwright'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inspectVisiblePresentation } from './inspection-diagnostics.mjs'

describe('INT-002 presentation inspection diagnostics', () => {
  let browser
  let page
  let temp
  beforeAll(async () => {
    temp = await mkdtemp(join(tmpdir(), 'and-scene-inspect-'))
    browser = await chromium.launch({ headless: true })
    page = await browser.newPage({ viewport: { width: 800, height: 600 } })
  })
  afterAll(async () => {
    await browser?.close()
    if (temp) await rm(temp, { recursive: true, force: true })
  })

  it('captures after motion settles and warns on collisions, indistinct active chrome, and default attribution while honoring overlap markers', async () => {
    await page.setContent(`<!doctype html><style>
      #collision-a,#collision-b { position:absolute; left:20px; top:20px; width:120px; height:40px; background:#eee }
      #collision-a { opacity:0; transition:opacity 120ms linear }
      #allowed { position:absolute; left:200px; top:20px; width:130px; height:50px }
      #allowed p { position:absolute; inset:0; margin:0 }
      .same { color:#333; background:#fff; border:0; width:20px; height:10px }
    </style>
      <main data-presentation-root data-step-index="0">
        <div id="collision-a" data-presentation-node="box">collision alpha</div>
        <div id="collision-b" data-presentation-node="box">collision beta</div>
        <div id="allowed" data-presentation-allow-overlap><p>intentional readable text</p><p>intentionally layered words</p></div>
        <button class="same" data-presentation-progress-item data-presentation-active="true" aria-label="Active one"></button>
        <button class="same" data-presentation-progress-item data-presentation-active="false" aria-label="Inactive two"></button>
        <a data-presentation-attribution href="#">unstyled attribution</a>
      </main>`)
    await page.evaluate(() => { requestAnimationFrame(() => { document.querySelector('#collision-a').style.opacity = '1' }) })
    await page.waitForTimeout(180)
    const settledOpacity = await page.locator('#collision-a').evaluate((element) => getComputedStyle(element).opacity)
    const screenshot = join(temp, 'step-01.png')
    await page.screenshot({ path: screenshot })
    expect(settledOpacity).toBe('1')
    expect((await stat(screenshot)).size).toBeGreaterThan(0)

    const warnings = await page.evaluate(inspectVisiblePresentation)
    expect(warnings.some((warning) => warning.includes('collision alpha') && warning.includes('collision beta'))).toBe(true)
    expect(warnings.some((warning) => warning.includes('intentional readable text') || warning.includes('intentionally layered words'))).toBe(false)
    expect(warnings.some((warning) => warning.includes('active navigation is visually indistinct'))).toBe(true)
    expect(warnings.some((warning) => warning.includes('attribution is undersized or browser-default'))).toBe(true)
  }, 30000)
})
