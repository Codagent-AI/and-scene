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
  const retry = () => serverExited ? reject(new Error(`preview exited before becoming ready at ${url}`)) : Date.now() - started > 15_000 ? reject(new Error(`preview did not become ready at ${url}`)) : setTimeout(probe, 100)
  probe()
})

const server = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
let serverExited = false
server.once('exit', () => { serverExited = true })
let browser
try {
  browser = await chromium.launch()
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
    const diagnostics = await page.evaluate(() => {
      const canvas = document.querySelector('[data-presentation-canvas]')?.getBoundingClientRect()
      if (!canvas) return ['scene canvas is missing']
      const selectors = '[data-presentation-box],[data-presentation-label],[data-presentation-arrow],[data-presentation-frame],[data-presentation-emphasis],[data-presentation-symbol-chip]'
      const items = [...document.querySelectorAll(selectors)].filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
      const issues = []
      for (const element of items) {
        const rect = element.getBoundingClientRect()
        const label = element.getAttribute('data-entity-id') || element.textContent?.trim().slice(0, 40) || element.tagName
        const clipped = rect.left < canvas.left - 1 || rect.top < canvas.top - 1 || rect.right > canvas.right + 1 || rect.bottom > canvas.bottom + 1
        if (clipped) issues.push(`content outside fixed canvas: ${label}`)
        if (element instanceof HTMLElement && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)) issues.push(`clipped text: ${label}`)
      }
      for (let left = 0; left < items.length; left += 1) for (let right = left + 1; right < items.length; right += 1) {
        if (items[left].contains(items[right]) || items[right].contains(items[left])) continue
        const a = items[left].getBoundingClientRect(); const b = items[right].getBoundingClientRect()
        const intersects = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
        const allowed = items[left].closest('[data-allow-overlap]') || items[right].closest('[data-allow-overlap]')
        if (intersects && !allowed) {
          const aLabel = items[left].getAttribute('data-entity-id') || items[left].textContent?.trim().slice(0, 24) || 'element'
          const bLabel = items[right].getAttribute('data-entity-id') || items[right].textContent?.trim().slice(0, 24) || 'element'
          issues.push(`unmarked overlap: ${aLabel} / ${bLabel}`)
        }
      }
      return issues
    })
    if (diagnostics.length) throw new Error(`${slug} step ${index + 1}: ${diagnostics.join('; ')}`)
    if (!(await page.locator('[data-presentation-progress-item="active"]').count())) throw new Error(`${slug} step ${index + 1}: active progress state is not exposed`)
    const attribution = page.locator('[data-presentation-attribution]').first()
    if (!(await attribution.isVisible())) throw new Error(`${slug} step ${index + 1}: attribution is missing or hidden`)
    await page.screenshot({ path: `${outputDir}/${slug}-step-${index + 1}.png`, fullPage: true })
  }
  if (errors.length) throw new Error(errors.join('; '))
  console.log(`PASS: captured ${indices.length} settled screenshots in ${outputDir}`)
} finally {
  try { await browser?.close() } finally {
    if (!serverExited && server.pid) {
      try { process.kill(-server.pid, 'SIGTERM') } catch { server.kill('SIGTERM') }
    }
  }
}
