#!/usr/bin/env node
/**
 * Build + render verification for a scaffolded presentation app.
 *
 * 1. `npm run build` over the whole app.
 * 2. Reads the presentation registry and, for each registered presentation,
 *    starts a production preview it owns exclusively (an OS-assigned port on
 *    127.0.0.1, via Vite's programmatic `preview()` API rather than a spawned
 *    CLI process) and steps through every step with Playwright/Chromium,
 *    failing on console errors, page errors, or a step index that does not
 *    advance.
 * 3. If no presentations are registered yet, opens the landing route instead
 *    so a freshly scaffolded (pre-content) app still gets a real render check.
 *
 * Exits non-zero on any failure and names the failing phase/step.
 */
import process from 'node:process'
import { chromium } from 'playwright'
import { HOST, closePreviewServer, readRegisteredSlugs, run, startOwnedPreview } from './preview-utils.mjs'

const SETTLE_MS = 400

function fail(message) {
  console.error(`\n[verify] FAIL: ${message}`)
  process.exitCode = 1
}

async function checkRoute(page, baseUrl, routePath, { requireSteps }) {
  const consoleErrors = []
  const pageErrors = []
  const onConsole = (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  }
  const onPageError = (error) => pageErrors.push(error.message)
  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  const url = `${baseUrl}${routePath}`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(SETTLE_MS)

  if (requireSteps) {
    const stepCount = await page
      .locator('[data-step-count]')
      .first()
      .getAttribute('data-step-count')
      .catch(() => null)
    const count = Number(stepCount)
    if (!Number.isFinite(count) || count < 1) {
      throw new Error(`route ${routePath} has no readable data-step-count hook`)
    }

    for (let step = 0; step < count; step += 1) {
      const indexAttr = await page.locator('[data-step-index]').first().getAttribute('data-step-index')
      const currentIndex = Number(indexAttr)
      if (!Number.isFinite(currentIndex) || currentIndex !== step) {
        throw new Error(`route ${routePath} step ${step} did not report the expected data-step-index`)
      }
      if (step < count - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(SETTLE_MS)
      }
    }
  }

  page.off('console', onConsole)
  page.off('pageerror', onPageError)

  if (consoleErrors.length > 0) {
    throw new Error(`route ${routePath} logged console errors: ${consoleErrors.join(' | ')}`)
  }
  if (pageErrors.length > 0) {
    throw new Error(`route ${routePath} threw uncaught page errors: ${pageErrors.join(' | ')}`)
  }
}

async function main() {
  console.log('[verify] building application...')
  await run('npm', ['run', 'build'])

  const slugs = await readRegisteredSlugs()
  console.log(
    slugs.length > 0
      ? `[verify] found ${slugs.length} registered presentation(s): ${slugs.join(', ')}`
      : '[verify] no presentations registered yet; checking the landing route only',
  )

  console.log(`[verify] starting an owned preview on ${HOST}...`)
  const { server, baseUrl } = await startOwnedPreview()
  console.log(`[verify] preview listening at ${baseUrl}`)

  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage()

    if (slugs.length === 0) {
      await checkRoute(page, baseUrl, '/', { requireSteps: false })
    } else {
      for (const slug of slugs) {
        await checkRoute(page, baseUrl, `/${slug}`, { requireSteps: true })
      }
    }

    console.log('[verify] PASS: build succeeded and every checked route rendered cleanly')
  } catch (error) {
    fail(error.message)
  } finally {
    try {
      if (browser) await browser.close()
    } finally {
      await closePreviewServer(server)
    }
  }
}

main().catch((error) => {
  fail(error.stack ?? String(error))
})
