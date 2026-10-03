import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type Page } from 'playwright'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let server: ViteDevServer
let browser: Browser
let page: Page
let url = ''

beforeAll(async () => {
  server = await createServer({ root, logLevel: 'silent', server: { host: '127.0.0.1', port: 0, strictPort: false } })
  await server.listen()
  const address = server.httpServer?.address()
  url = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/how-to-make-a-presentation`
  browser = await chromium.launch({ headless: true })
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(url)
  await page.waitForSelector('[data-presentation-footer]')
  await page.waitForTimeout(1500)
}, 60_000)

afterAll(async () => {
  await browser?.close()
  await server?.close()
})

const opacities = (selector: string) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((el) => Number(getComputedStyle(el).opacity)), selector)
const go = (key: string) => page.keyboard.press(key)

describe('reference scene transitions in a real browser', () => {
  it('enters newcomers after the continuing entities have moved, then settles fully visible', async () => {
    await go('ArrowRight')
    await page.waitForTimeout(100)
    expect(await opacities('[data-entity-id="sample-skill"]')).toEqual([0])
    expect(await opacities('[data-entity-id="sample-you"]')).toEqual([1])
    await page.waitForTimeout(1500)
    expect(await opacities('[data-entity-id="sample-skill"]')).toEqual([1])
  }, 30_000)

  it('keeps departing entities mounted while they exit, then removes them', async () => {
    await go('ArrowRight')
    await page.waitForTimeout(1500)
    await go('ArrowRight')
    await page.waitForTimeout(1500)
    expect((await opacities('.step-card')).length).toBe(4)
    await go('ArrowLeft')
    await page.waitForTimeout(150)
    expect((await opacities('.step-card')).length).toBe(4)
    await page.waitForTimeout(1500)
    expect((await opacities('.step-card')).length).toBe(1)
  }, 30_000)
})
