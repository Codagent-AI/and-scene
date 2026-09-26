import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium } from 'playwright'
import { watchBrowserErrors } from './browser-errors.mjs'

describe('inspection browser error reporting', () => {
  let browser
  let page
  beforeAll(async () => {
    browser = await chromium.launch({ headless: true })
    page = await browser.newPage()
  })
  afterAll(async () => { await browser?.close() })

  it('collects console and uncaught page errors and reports them after inspection settles', async () => {
    const assertNoBrowserErrors = watchBrowserErrors(page)
    await page.setContent('<main>fixture</main>')
    await page.evaluate(() => {
      console.error('fixture console failure')
      setTimeout(() => { throw new Error('fixture page failure') }, 0)
    })
    await page.waitForTimeout(20)
    expect(assertNoBrowserErrors).toThrow('Browser errors: fixture console failure; fixture page failure')
  })
})
