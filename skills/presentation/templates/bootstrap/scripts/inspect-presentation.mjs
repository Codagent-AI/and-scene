import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
const here = dirname(fileURLToPath(import.meta.url))
const packageUrl = new URL('../package.json', import.meta.url)
const packageJson = JSON.parse(await readFile(packageUrl, 'utf8'))
const root = join(here, '..')
const output = join(root, 'artifacts/inspection')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const warnings = []
page.on('console', (message) => { if (message.type() === 'error') warnings.push(`console error: ${message.text()}`) })
await page.goto('http://127.0.0.1:4173/starter', { waitUntil: 'networkidle' })
await page.locator('[data-presentation]').waitFor()
await page.waitForTimeout(800)
await mkdir(output, { recursive: true })
await page.screenshot({ path: join(output, 'starter-0.png'), fullPage: true })
if (!(await page.locator('[data-presentation-attribution]').isVisible())) warnings.push('attribution is missing or hidden')
if (!(await page.locator('[data-presentation-progress-item][aria-current="step"]').isVisible())) warnings.push('active progress state is indistinct or missing')
await browser.close()
console.log(`inspect: captured settled starter step for ${packageJson.name}`)
for (const warning of warnings) console.warn(`inspect warning: ${warning}`)
