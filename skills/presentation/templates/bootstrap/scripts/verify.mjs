import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'
import { preview } from 'vite'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run verify -- <presentation-slug>')

const run = (args) => new Promise((resolve, reject) => {
  const child = spawn(args[0], args.slice(1), { stdio: 'inherit' })
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${args.join(' ')} exited ${code}`)))
})
let server
let browser
try {
  await run(['npm', 'run', 'build'])
  if (!existsSync(chromium.executablePath())) await run(['npx', 'playwright', 'install', 'chromium'])
  server = await preview({ preview: { host: '127.0.0.1', port: 0 } })
  const address = server.httpServer.address()
  if (!address || typeof address === 'string') throw new Error('Preview server did not expose a TCP address')
  const baseUrl = `http://127.0.0.1:${address.port}`
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`${baseUrl}/${encodeURIComponent(slug)}`, { waitUntil: 'networkidle' })
  if (!(await page.locator('[data-presentation]').count())) {
    const body = await page.locator('body').innerText()
    throw new Error(`Presentation route did not render: ${body || '(empty page)'}. ${errors.join('; ')}`)
  }
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log('Presentation build and first-step render passed.')
} catch (error) {
  console.error(`Verification failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server) {
    server.httpServer.closeAllConnections()
    await new Promise((resolve) => server.httpServer.close(resolve))
  }
}
