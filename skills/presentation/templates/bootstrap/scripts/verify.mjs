import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { preview } from 'vite'

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  child.once('error', reject)
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)))
})
let server
let browser
try {
  await run('npm', ['run', 'build'])
  server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const address = server.httpServer.address()
  if (!address || typeof address === 'string') throw new Error('preview did not bind a TCP port')
  const url = `http://127.0.0.1:${address.port}/`
  const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  const bundledChromium = existsSync('/ms-playwright') ? readdirSync('/ms-playwright').filter((name) => name.startsWith('chromium-')).map((name) => `/ms-playwright/${name}/chrome-linux64/chrome`).find(existsSync) : undefined
  browser = await chromium.launch({ headless: true, ...((systemChromium || bundledChromium) ? { executablePath: systemChromium || bundledChromium } : {}) })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(url, { waitUntil: 'networkidle' })
  const routes = await page.locator('[data-app-landing] section a').evaluateAll((links) => links.map((link) => link.href))
  if (errors.length) throw new Error(`landing route: ${errors.join('; ')}`)
  if (routes.length === 0) throw new Error('landing page has no registered presentation routes')
  for (const route of routes) {
    errors.length = 0
    await page.goto(route, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    await root.waitFor()
    const count = Number(await root.getAttribute('data-step-count'))
    if (!count) throw new Error(`${route}: presentation has no steps`)
    for (let index = 0; index < count; index++) {
      if (index) await page.keyboard.press('ArrowRight')
      try {
        await page.waitForFunction((expected) => Number(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')) === expected, index, { timeout: 3000 })
      } catch {
        throw new Error(`${route}, step ${index + 1}: step index did not advance`)
      }
      await page.waitForTimeout(900)
      if (errors.length) throw new Error(`${route}, step ${index + 1}: ${errors.join('; ')}`)
    }
    console.log(`PASS: ${route} (${count} steps)`)
  }
  console.log(`PASS: build and render verification for ${routes.length} registered presentation(s)`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await server?.close()
}
