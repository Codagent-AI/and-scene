import { execFileSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { request } from 'node:http'
import { chromium } from 'playwright'

const host = '127.0.0.1'
const port = 4173
const registry = readFileSync('src/presentations/index.ts', 'utf8')
const routes = [...registry.matchAll(/slug\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])

function waitForServer(url, timeout = 15_000) {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const probe = () => request(url, { method: 'HEAD' }, (response) => {
      response.resume()
      if (response.statusCode && response.statusCode < 500) return resolve()
      retry()
    }).on('error', retry).end()
    const retry = () => Date.now() - started > timeout ? reject(new Error(`preview did not become ready at ${url}`)) : setTimeout(probe, 100)
    probe()
  })
}

execFileSync('npm', ['run', 'build'], { stdio: 'inherit' })
if (routes.length === 0) {
  console.log('SKIPPED: build passed but no registered presentations exist for browser verification.')
  process.exit(0)
}

const server = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] })
const browser = await chromium.launch()
try {
  await waitForServer(`http://${host}:${port}/`)
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
  await browser.close()
  server.kill('SIGTERM')
}
