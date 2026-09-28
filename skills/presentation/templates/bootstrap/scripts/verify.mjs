#!/usr/bin/env node
/**
 * Deterministic build + browser-render gate for a presentation-kit app.
 *
 * 1. `npm run build` — fails on any type or build error.
 * 2. Starts `vite preview` on 127.0.0.1 and, for every route registered in
 *    `src/presentations/index.ts`, drives it with Playwright/Chromium through
 *    every step (via the `data-step-count` / `data-step-index` chrome hooks),
 *    failing on console errors, page errors, or a step that does not advance.
 *
 * Exits non-zero and names the failing phase/step on any failure.
 */
import { advanceToStep, openPresentation, readRegistrySlugs, runProjectBuild, startPreviewServer } from './lib/preview-server.mjs'

function fail(message) {
  console.error(`\n[verify] FAIL: ${message}`)
  process.exitCode = 1
}

function runBuild() {
  console.log('[verify] building...')
  if (!runProjectBuild()) {
    fail('npm run build did not succeed')
    return false
  }
  console.log('[verify] build OK')
  return true
}

/** Bounded pause after a step becomes current, so delayed entrances/timers/animation-completion errors surface before it's checked. */
const STEP_SETTLE_MS = 500

async function verifyRoute(browser, baseUrl, entry) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console error: ${message.text()}`)
  })

  try {
    const { root, stepCount } = await openPresentation(page, baseUrl, entry.slug)

    for (let index = 0; index < stepCount; index += 1) {
      const current = Number(await root.getAttribute('data-step-index'))
      if (current !== index) {
        return { ok: false, reason: `"${entry.slug}" step ${index}: expected data-step-index=${index}, got ${current}` }
      }

      // Let this step's own entrances/timers/animation-completion callbacks
      // run (and any error they throw) before checking errors or advancing —
      // including the last step, which otherwise never gets this wait. Any
      // error fails immediately, so every error seen here belongs to this step.
      await page.waitForTimeout(STEP_SETTLE_MS)
      if (errors.length > 0) {
        return {
          ok: false,
          reason: `"${entry.slug}" step ${index} reported ${errors.length} browser error(s):\n  ${errors.join('\n  ')}`,
        }
      }

      if (index < stepCount - 1) {
        try {
          await advanceToStep(page, index + 1)
        } catch {
          const stalledAt = await root.getAttribute('data-step-index')
          return {
            ok: false,
            reason: `"${entry.slug}" step ${index} did not advance to step ${index + 1}: data-step-index is still ${stalledAt}`,
          }
        }
      }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, reason: `"${entry.slug}" failed to render: ${error.message}` }
  } finally {
    await context.close()
  }
}

async function runRenderChecks() {
  const registry = await readRegistrySlugs()
  if (registry.length === 0) {
    console.log('[verify] no presentations registered yet; skipping render check')
    return true
  }

  const { chromium } = await import('playwright')
  const server = await startPreviewServer()
  console.log(`[verify] preview server ready at ${server.baseUrl}`)
  let browser

  try {
    browser = await chromium.launch()
    let allOk = true
    for (const entry of registry) {
      console.log(`[verify] rendering "${entry.slug}"...`)
      const result = await verifyRoute(browser, server.baseUrl, entry)
      if (!result.ok) {
        fail(result.reason)
        allOk = false
      } else {
        console.log(`[verify] "${entry.slug}" OK (${entry.title})`)
      }
    }
    return allOk
  } finally {
    await browser?.close()
    await server.stop()
  }
}

async function main() {
  if (!runBuild()) {
    process.exit(1)
  }

  const renderOk = await runRenderChecks()
  if (!renderOk) {
    process.exit(1)
  }

  console.log('\n[verify] PASS')
}

main().catch((error) => {
  fail(error.stack ?? String(error))
  process.exit(1)
})
