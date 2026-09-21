import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4173
const registry = readFileSync('src/presentations/index.ts', 'utf8')
const routes = [...registry.matchAll(/slug\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])

execFileSync('npm', ['run', 'build'], { stdio: 'inherit' })
if (routes.length === 0) {
  console.log('SKIPPED: build passed but no registered presentations exist for browser verification.')
  process.exit(0)
}

const { preview } = await import('vite')
let server
let browser
try {
  server = await preview({ preview: { host, port, strictPort: true } })
  browser = await chromium.launch()
  const page = await browser.newPage()
  for (const slug of routes) {
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`console.error: ${message.text()}`) })
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
    await page.goto(`http://${host}:${port}/${slug}`, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation-scene]').waitFor({ state: 'visible' })
    const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
    const index = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-index'))
    if (!count || index !== 0) throw new Error(`${slug}: first step did not render (count=${count}, index=${index})`)
    if (errors.length) throw new Error(`${slug}: ${errors.join('; ')}`)
    console.log(`PASS: ${slug} rendered step 1/${count} on http://${host}:${port}/${slug}`)
  }
} finally {
  try { await browser?.close() } finally {
    if (server?.httpServer.listening) await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
  }
}
