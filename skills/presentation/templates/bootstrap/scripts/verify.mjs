import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { preview } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const run = (args) => new Promise((resolve, reject) => {
  const child = spawn('npm', args, { cwd: root, stdio: 'inherit' })
  child.on('error', reject)
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`npm ${args.join(' ')} failed (${code})`)))
})
let server
let browser
try {
  await run(['run', 'build'])
  server = await preview({ root, preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const baseUrl = server.resolvedUrls?.local?.[0]
  if (!baseUrl) throw new Error('Vite preview did not expose a local URL')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const routeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') routeErrors.push(message.text()) })
  page.on('pageerror', (error) => routeErrors.push(error.message))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const routes = await page.locator('[data-presentation-landing] li a').evaluateAll((links) => links.map((link) => link.href))
  if (!routes.length) throw new Error('landing page has no registered presentations to verify')
  for (const route of routes) {
    routeErrors.length = 0
    const pathname = new URL(route).pathname
    await page.goto(route, { waitUntil: 'networkidle' })
    try {
      await page.locator('[data-step-count][data-step-index="0"]').waitFor({ state: 'visible', timeout: 5000 })
    } catch (error) {
      throw new Error(`${pathname} failed to render its first step: ${error.message}${routeErrors.length ? `; browser errors: ${routeErrors.join('; ')}` : ''}`)
    }
    if (routeErrors.length) throw new Error(`${pathname} browser errors: ${routeErrors.join('; ')}`)
    console.log(`PASS: ${pathname} first step renders`)
  }
  console.log(`PASS: bootstrap build and ${routes.length} registered presentation route(s) render`)
} catch (error) {
  console.error(`FAIL: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await server?.close()
}
