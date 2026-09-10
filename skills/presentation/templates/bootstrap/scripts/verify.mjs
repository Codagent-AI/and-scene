import { chromium } from 'playwright'
import { buildApplication, projectRoot, withPreview } from './preview-server.mjs'
import { verifyPresentation } from './render-verification.mjs'

async function main() {
  await buildApplication(projectRoot)
  await withPreview(projectRoot, verifyRoutes)
}

async function verifyRoutes(origin) {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(origin, { waitUntil: 'networkidle' })
    if (errors.length) throw new Error(`render failed: ${errors.join('; ')}`)
    const routes = await page.locator('[data-presentation-landing] nav a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    for (const route of routes) {
      await verifyPresentation(page, new URL(route, origin).href)
    }
    console.log(`verify: PASS (${routes.length} presentation routes rendered)`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(`verify: FAIL ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
