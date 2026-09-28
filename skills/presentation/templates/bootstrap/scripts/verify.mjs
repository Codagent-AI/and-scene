#!/usr/bin/env node
/**
 * Build + render verification for a scaffolded presentation app.
 *
 * 1. `npm run build` over the whole app.
 * 2. Reads the presentation registry and, for each registered presentation,
 *    starts a production preview on 127.0.0.1 and steps through every step
 *    with Playwright/Chromium, failing on console errors, page errors, or a
 *    step index that does not advance.
 * 3. If no presentations are registered yet, opens the landing route instead
 *    so a freshly scaffolded (pre-content) app still gets a real render check.
 *
 * Exits non-zero on any failure and names the failing phase/step.
 */
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

/** Kills a spawned process (and its group) without hanging if it ignores the signal. */
async function killProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    child.kill('SIGTERM')
  }
  const exited = await Promise.race([
    once(child, 'exit').then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 3000)),
  ])
  if (!exited) {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch {
      child.kill('SIGKILL')
    }
    await once(child, 'exit').catch(() => {})
  }
}

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const HOST = '127.0.0.1'
const PORT = 4735
const BASE_URL = `http://${HOST}:${PORT}`
const SETTLE_MS = 400

function fail(message) {
  console.error(`\n[verify] FAIL: ${message}`)
  process.exitCode = 1
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', cwd: ROOT, ...options })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
    child.on('error', reject)
  })
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status < 500) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Preview server did not become ready at ${url} within ${timeoutMs}ms`)
}

/** Reads the registered presentation slugs without executing app code. */
function readRegisteredSlugs() {
  const indexPath = path.join(ROOT, 'src', 'presentations', 'index.ts')
  const source = readFileSync(indexPath, 'utf8')
  const slugs = [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
  return slugs
}

async function checkRoute(page, routePath, { requireSteps }) {
  const consoleErrors = []
  const pageErrors = []
  const onConsole = (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  }
  const onPageError = (error) => pageErrors.push(error.message)
  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  const url = `${BASE_URL}${routePath}`
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

    let previousIndex = -1
    for (let step = 0; step < count; step += 1) {
      const indexAttr = await page.locator('[data-step-index]').first().getAttribute('data-step-index')
      const currentIndex = Number(indexAttr)
      if (!Number.isFinite(currentIndex) || currentIndex !== step) {
        throw new Error(`route ${routePath} step ${step} did not report the expected data-step-index`)
      }
      if (currentIndex <= previousIndex && step > 0) {
        throw new Error(`route ${routePath} step index did not advance past ${previousIndex}`)
      }
      previousIndex = currentIndex
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

  const slugs = readRegisteredSlugs()
  console.log(
    slugs.length > 0
      ? `[verify] found ${slugs.length} registered presentation(s): ${slugs.join(', ')}`
      : '[verify] no presentations registered yet; checking the landing route only',
  )

  console.log(`[verify] starting preview on ${BASE_URL}...`)
  const viteBin = path.join(ROOT, 'node_modules', '.bin', 'vite')
  const preview = spawn(
    viteBin,
    ['preview', '--host', HOST, '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: 'pipe', detached: true },
  )
  preview.stdout.on('data', () => {})
  preview.stderr.on('data', () => {})

  let browser
  try {
    await waitForServer(`${BASE_URL}/`)
    browser = await chromium.launch()
    const page = await browser.newPage()

    if (slugs.length === 0) {
      await checkRoute(page, '/', { requireSteps: false })
    } else {
      for (const slug of slugs) {
        await checkRoute(page, `/${slug}`, { requireSteps: true })
      }
    }

    console.log('[verify] PASS: build succeeded and every checked route rendered cleanly')
  } catch (error) {
    fail(error.message)
  } finally {
    if (browser) await browser.close()
    await killProcess(preview)
  }
}

main().catch((error) => {
  fail(error.stack ?? String(error))
})
