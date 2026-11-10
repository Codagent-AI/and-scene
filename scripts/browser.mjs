import { spawn } from 'node:child_process'
import { preview } from 'vite'
import { chromium } from 'playwright'
/** @returns {Promise<void>} */
export async function build() {
  await new Promise(/** @param {(value?: void) => void} resolve */ (resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`build: exited ${code}`)))
  })
}
/** @param {(browser: import('playwright').Browser, url: string) => Promise<void>} run */
export async function withPreview(run) {
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } })
  /** @type {import('playwright').Browser | undefined} */
  let browser
  try {
    const url = server.resolvedUrls?.local[0]?.replace(/\/$/, '')
    if (!url) throw new Error('preview URL unavailable')
    browser = await chromium.launch()
    await run(browser, url)
    if (!server.httpServer.listening) throw new Error('preview terminated unexpectedly')
  } finally {
    await Promise.all([browser?.close(), server.close()])
  }
}
/**
 * @param {import('playwright').Page} page
 * @param {string} url
 * @param {string} slug
 * @param {(page: import('playwright').Page, index: number, count: number) => Promise<void>} inspect
 */
export async function walk(page, url, slug, inspect) {
  let index = 0
  /** @type {string[]} */
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  try {
    await page.goto(`${url}/${slug}`)
    const root = page.locator('[data-presentation-root]')
    await root.waitFor()
    const count = Number(await root.getAttribute('data-step-count'))
    if (!Number.isInteger(count) || count < 1) throw new Error('invalid step count')
    for (index = 0; index < count; index++) {
      await page.waitForFunction(i => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(i), index, { timeout: 5000 })
      await page.waitForTimeout(900)
      if (errors.length) throw new Error(errors.join('; '))
      await inspect(page, index, count)
      if (errors.length) throw new Error(errors.join('; '))
      if (index < count - 1) await page.keyboard.press('ArrowRight')
    }
  } catch (error) {
    throw new Error(`render step ${index}: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
}
