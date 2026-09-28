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
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer, preview } from 'vite'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const HOST = '127.0.0.1'
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

/**
 * Starts a preview server this process exclusively owns, on an OS-assigned
 * port (`port: 0`), so a stale server left on a fixed port by another run
 * can never be mistaken for the build just produced.
 */
async function startOwnedPreview() {
  const server = await preview({
    root: ROOT,
    logLevel: 'silent',
    preview: { host: HOST, port: 0, strictPort: false },
  })
  const address = server.httpServer.address()
  if (!address || typeof address !== 'object') {
    throw new Error('Preview server did not report a bound port')
  }
  return { server, baseUrl: `http://${HOST}:${address.port}` }
}

/** Closes the underlying HTTP server directly, not via PreviewServer.close(). */
function closePreviewServer(server) {
  return new Promise((resolve, reject) => {
    server.httpServer.close((error) => (error ? reject(error) : resolve()))
  })
}

/**
 * Reads the registered presentation slugs by loading the actual exported
 * `presentations` registry through Vite's SSR module loader, rather than
 * regex-matching the source text — a registry entry built from a variable or
 * shorthand (e.g. `const slug = 'x'; { slug, ... }`) has no `slug: '...'`
 * text for a regex to match, so it would silently go unchecked.
 */
async function readRegisteredSlugs() {
  const loader = await createServer({ root: ROOT, server: { middlewareMode: true }, logLevel: 'silent' })
  try {
    const { presentations } = await loader.ssrLoadModule('/src/presentations/index.ts')
    return presentations.map((entry) => entry.slug)
  } finally {
    await loader.close()
  }
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
