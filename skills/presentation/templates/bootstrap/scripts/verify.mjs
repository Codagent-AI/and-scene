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
import { spawnSync } from 'node:child_process'
import { readRegistrySlugs, startPreviewServer, PROJECT_ROOT } from './lib/preview-server.mjs'

function fail(message) {
  console.error(`\n[verify] FAIL: ${message}`)
  process.exitCode = 1
}

function runBuild() {
  console.log('[verify] building...')
  const result = spawnSync('npm', ['run', 'build'], { cwd: PROJECT_ROOT, stdio: 'inherit' })
  if (result.status !== 0) {
    fail('npm run build did not succeed')
    return false
  }
  console.log('[verify] build OK')
  return true
}

async function verifyRoute(chromium, baseUrl, entry) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console error: ${message.text()}`)
  })

  try {
    await page.goto(`${baseUrl}/${entry.slug}`, { waitUntil: 'networkidle' })
    const root = page.locator('[data-presentation-root]')
    await root.waitFor({ state: 'visible', timeout: 10_000 })

    const stepCount = Number(await root.getAttribute('data-step-count'))
    if (!Number.isFinite(stepCount) || stepCount < 1) {
      return { ok: false, reason: `missing or invalid data-step-count for "${entry.slug}"` }
    }

    for (let index = 0; index < stepCount; index += 1) {
      const current = Number(await root.getAttribute('data-step-index'))
      if (current !== index) {
        return { ok: false, reason: `"${entry.slug}" step ${index}: expected data-step-index=${index}, got ${current}` }
      }
      if (index < stepCount - 1) {
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          (expected) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(expected),
          index + 1,
          { timeout: 5_000 },
        )
      }
    }

    if (errors.length > 0) {
      return { ok: false, reason: `"${entry.slug}" reported ${errors.length} browser error(s):\n  ${errors.join('\n  ')}` }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, reason: `"${entry.slug}" failed to render: ${error.message}` }
  } finally {
    await browser.close()
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

  try {
    let allOk = true
    for (const entry of registry) {
      console.log(`[verify] rendering "${entry.slug}"...`)
      const result = await verifyRoute(chromium, server.baseUrl, entry)
      if (!result.ok) {
        fail(result.reason)
        allOk = false
      } else {
        console.log(`[verify] "${entry.slug}" OK (${entry.title})`)
      }
    }
    return allOk
  } finally {
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
