import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import { copyApp, removeApp, run } from './helpers.ts'
import { startPreviewFor } from './preview.ts'

let app: string
let stop: () => void
let url: string
let browser: Browser

beforeAll(async () => {
  app = await copyApp()
  // A development React bundle runs StrictMode's double-invoked effects.
  const build = await run('npx', ['vite', 'build', '--minify', 'false'], app, { NODE_ENV: 'development' })
  expect(build.code, build.output).toBe(0)
  ;({ url, stop } = await startPreviewFor(app))
  browser = await chromium.launch()
})

afterAll(async () => {
  await browser?.close()
  stop?.()
  await removeApp(app)
})

describe('React StrictMode (development bundle)', () => {
  it('advances exactly one step per key press and toggles the mode once per P', async () => {
    const page = await browser.newPage()
    const errors: string[] = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`${url}/how-to-make-a-presentation`, { waitUntil: 'networkidle' })
    const state = () =>
      page.evaluate(() => {
        const root = document.querySelector('[data-presentation-root]')!
        return [root.getAttribute('data-presentation-step-index'), root.getAttribute('data-presentation-mode')]
      })
    expect(await state()).toEqual(['0', 'browse'])
    for (let i = 1; i <= 3; i++) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200)
      expect((await state())[0]).toBe(String(i))
    }
    await page.keyboard.press('p')
    expect(await state()).toEqual(['3', 'present'])
    await page.keyboard.press('p')
    expect(await state()).toEqual(['3', 'browse'])
    await page.waitForTimeout(1500)
    expect(errors).toEqual([])
  })
})
