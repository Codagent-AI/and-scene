import { mkdirSync, readFileSync } from 'node:fs'
import { request } from 'node:http'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const slug = process.argv[2]
if (!slug) throw new Error('Usage: npm run inspect -- <presentation-slug>')
const registry = readFileSync('src/presentations/index.ts', 'utf8')
const routes = [...registry.matchAll(/slug\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
if (!routes.includes(slug)) throw new Error(`Unknown presentation slug: ${slug}`)

const host = '127.0.0.1'
const port = 4174
const outputDir = 'artifacts/inspection'
mkdirSync(outputDir, { recursive: true })
const waitForServer = (url) => new Promise((resolve, reject) => {
  const started = Date.now()
  const probe = () => request(url, { method: 'HEAD' }, (response) => { response.resume(); response.statusCode < 500 ? resolve() : retry() }).on('error', retry).end()
  const retry = () => Date.now() - started > 15_000 ? reject(new Error(`preview did not become ready at ${url}`)) : setTimeout(probe, 100)
  probe()
})

const server = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] })
const browser = await chromium.launch()
try {
  await waitForServer(`http://${host}:${port}/`)
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console.error: ${message.text()}`) })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  await page.goto(`http://${host}:${port}/${slug}`, { waitUntil: 'networkidle' })
  await page.locator('[data-presentation-scene]').waitFor({ state: 'visible' })
  const count = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-count'))
  if (!count) throw new Error(`${slug}: no step count was exposed`)
  const indices = [...new Set([0, Math.floor((count - 1) / 2), count - 1])]
  for (const index of indices) {
    await page.locator('[data-presentation-progress-item]').nth(index).click()
    await page.waitForTimeout(800)
    const actual = Number(await page.locator('[data-presentation-root]').getAttribute('data-step-index'))
    if (actual !== index) throw new Error(`${slug}: failed to settle on step ${index + 1}`)
    await page.screenshot({ path: `${outputDir}/${slug}-step-${index + 1}.png`, fullPage: true })
  }
  const attribution = page.locator('[data-presentation-attribution]').first()
  const warnings = []
  if (!(await attribution.isVisible())) warnings.push('attribution is missing or hidden')
  if (!(await page.locator('[data-presentation-progress-item="active"]').count())) warnings.push('active progress state is not exposed')
  if (errors.length) throw new Error(errors.join('; '))
  for (const warning of warnings) console.warn(`ADVISORY: ${warning}`)
  console.log(`PASS: captured ${indices.length} settled screenshots in ${outputDir}`)
} finally {
  await browser.close()
  server.kill('SIGTERM')
}
