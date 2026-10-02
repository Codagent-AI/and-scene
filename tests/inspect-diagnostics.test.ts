import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { inspectDiagnostics } from '../scripts/inspect-diagnostics.mjs'

let browser: Awaited<ReturnType<typeof chromium.launch>>

beforeAll(async () => { browser = await chromium.launch({ headless: true }) })
afterAll(async () => { await browser.close() })

describe('screenshot inspection diagnostics', () => {
  it('reports collisions, indistinct active chrome, and unpolished attribution while exempting marked overlap', async () => {
    const page = await browser.newPage()
    await page.setContent(`<main data-presentation>
      <div style="position:absolute;left:20px;top:20px;width:120px;height:32px"><p style="margin:0">collision</p></div>
      <div data-allow-overlap style="position:absolute;left:20px;top:20px;width:120px;height:32px"><p style="margin:0">intentional</p></div>
      <nav><button data-presentation-active="true" style="color:rgb(1,2,3);background:rgb(4,5,6);font-weight:400">active</button><button data-presentation-active="false" style="color:rgb(1,2,3);background:rgb(4,5,6);font-weight:400">inactive</button></nav>
      <div data-presentation-attribution><a href="#">credit</a></div>
    </main>`)
    const warnings = await page.evaluate(inspectDiagnostics)
    expect(warnings.some((warning) => warning.includes('possible visible text/chrome overlap'))).toBe(true)
    expect(warnings).toContain('active navigation may look like inactive controls')
    expect(warnings).toContain('attribution may be browser-default or too small')
    expect(warnings.filter((warning) => warning.includes('intentional'))).toHaveLength(0)
    await page.close()
  })

  it('reports missing attribution and allows a settled screenshot to be captured', async () => {
    const page = await browser.newPage()
    await page.setContent('<main data-presentation><p>settled fixture</p></main>')
    await page.waitForTimeout(40)
    expect(await page.evaluate(inspectDiagnostics)).toContain('missing attribution')
    expect(await page.screenshot()).toBeInstanceOf(Buffer)
    await page.close()
  })
})
