import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
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
  const port = await new Promise((resolve, reject) => {
    const server = createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => { const address = server.address(); if (!address || typeof address === 'string') return reject(new Error('preview port unavailable')); server.close(() => resolve(address.port)) })
  })
  const url = `http://127.0.0.1:${port}`
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe' })
  /** @type {import('playwright').Browser | undefined} */
  let browser
  let shutdownRequested = false
  /** @type {Error | undefined} */
  let serverError
  server.on('error', error => { serverError = error })
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      if (serverError) throw serverError
      if (server.exitCode !== null || server.signalCode !== null) throw new Error('preview exited before ready')
      try { ready = (await fetch(url)).ok } catch { /* Preview may still be starting. */ }
      if (ready) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (!ready) throw new Error('preview readiness timed out')
    browser = await chromium.launch()
    await run(browser, url)
  } finally {
    await browser?.close()
    if (server.exitCode === null && server.signalCode === null) {
      const exited = new Promise(resolve => server.once('exit', resolve))
      shutdownRequested = true
      server.kill('SIGTERM')
      await exited
    }
  }
  if (!shutdownRequested || (server.signalCode !== 'SIGTERM' && server.exitCode !== 0 && server.exitCode !== 143)) throw new Error(`preview terminated unexpectedly (code ${server.exitCode}, signal ${server.signalCode}, shutdown ${shutdownRequested})`)
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
