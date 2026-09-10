import { chromium } from 'playwright'
import { buildApplication, projectRoot, withPreview } from './preview-server.mjs'

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
      await page.goto(new URL(route, origin).href, { waitUntil: 'networkidle' })
      if (errors.length) throw new Error(`render failed at ${route} step 1: ${errors.join('; ')}`)
      const chrome = page.locator('[data-presentation-chrome]')
      await chrome.waitFor()
      const count = Number(await chrome.getAttribute('data-step-count'))
      if (!Number.isInteger(count) || count < 1 || await chrome.getAttribute('data-step-index') !== '0') {
        throw new Error(`render failed at ${route} step 1: missing initial presentation state`)
      }
      if (errors.length) throw new Error(`render failed at ${route} step 1: ${errors.join('; ')}`)
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
