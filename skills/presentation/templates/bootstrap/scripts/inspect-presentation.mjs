import { readFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const packageUrl = new URL('../package.json', import.meta.url)
const packageJson = JSON.parse(await readFile(packageUrl, 'utf8'))
const root = join(here, '..')
const requestedSlug = process.argv[2]
const slugs = requestedSlug ? [validateSlug(requestedSlug)] : await registeredSlugs()
if (slugs.length === 0) throw new Error('inspect: no registered presentations found')
const output = join(root, 'artifacts/inspection')
const browser = await chromium.launch({ headless: true })
try {
  for (const slug of slugs) await inspectRoute(browser, slug)
} finally {
  await browser.close()
}
console.log(`inspect: captured settled steps for ${packageJson.name}: ${slugs.join(', ')}`)

function validateSlug(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`inspect: invalid presentation slug "${slug}"`)
  return slug
}

async function registeredSlugs() {
  const source = await readFile(join(root, 'src/presentations/index.ts'), 'utf8')
  return [...source.matchAll(/slug:\s*['"]([a-z0-9-]+)['"]/g)].map((match) => validateSlug(match[1]))
}

async function inspectRoute(browser, slug) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const warnings = []
  page.on('console', (message) => { if (message.type() === 'error') warnings.push(`console error: ${message.text()}`) })
  try {
    await page.goto(`http://127.0.0.1:4173/${slug}`, { waitUntil: 'networkidle' })
    await page.locator('[data-presentation]').waitFor()
    await page.waitForTimeout(800)
    await mkdir(output, { recursive: true })
    await page.screenshot({ path: join(output, `${slug}-0.png`), fullPage: true })
    if (!(await page.locator('[data-presentation-attribution]').isVisible())) warnings.push('attribution is missing or hidden')
    if (!(await page.locator('[data-presentation-progress-item][aria-current="step"]').isVisible())) warnings.push('active progress state is indistinct or missing')
  } finally {
    await page.close()
  }
  for (const warning of warnings) console.warn(`inspect warning [${slug}]: ${warning}`)
}
