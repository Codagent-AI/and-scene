#!/usr/bin/env node
// Deterministic build + browser-render verification.
//
// 1. Builds the whole app (tsc -b && vite build); fails on any type/build error.
// 2. Starts `vite preview` bound to 127.0.0.1 and waits for it to answer.
// 3. Uses Playwright/Chromium to open every registered presentation route,
//    step through every step via the chrome's data-step-count/data-step-index
//    hooks, and fail on console errors, uncaught page errors, or a step index
//    that does not advance.
// 4. Exits non-zero with the failing check/step reported.

import { spawn, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../..')
const HOST = '127.0.0.1'
const PORT = Number(process.env.VERIFY_PORT ?? 4173)
const BASE_URL = `http://${HOST}:${PORT}`

function fail(message) {
  console.error(`\n[verify] FAIL: ${message}`)
  process.exitCode = 1
}

function readRegisteredSlugs() {
  const indexPath = path.join(projectRoot, 'src/presentations/index.ts')
  const source = readFileSync(indexPath, 'utf8')
  const slugs = [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
  return slugs
}

async function waitForServer(url, timeoutMs = 20_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok || response.status < 500) return
    } catch {
      // server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`Preview server at ${url} did not become ready within ${timeoutMs}ms`)
}

async function verifyRoute(browser, slug) {
  const page = await browser.newPage()
  const errors = []

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })
  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`)
  })

  const url = slug ? `${BASE_URL}/${slug}` : BASE_URL
  await page.goto(url, { waitUntil: 'networkidle' })

  const root = page.locator('[data-presentation-root]')
  const stepCount = Number(await root.getAttribute('data-step-count'))
  if (!Number.isFinite(stepCount) || stepCount < 1) {
    await page.close()
    return { slug, ok: false, message: `missing or invalid data-step-count on ${url}` }
  }

  for (let index = 0; index < stepCount; index += 1) {
    const current = Number(await root.getAttribute('data-step-index'))
    if (current !== index) {
      await page.close()
      return { slug, ok: false, message: `step ${index}: expected data-step-index=${index}, got ${current}` }
    }
    if (errors.length > 0) {
      await page.close()
      return { slug, ok: false, message: `step ${index}: ${errors.join('; ')}` }
    }
    if (index < stepCount - 1) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(400)
    }
  }

  if (errors.length > 0) {
    await page.close()
    return { slug, ok: false, message: errors.join('; ') }
  }

  await page.close()
  return { slug, ok: true }
}

async function main() {
  console.log('[verify] building the whole app…')
  const build = spawnSync('npm', ['run', 'build'], { cwd: projectRoot, stdio: 'inherit', shell: true })
  if (build.status !== 0) {
    fail('npm run build reported a type or build error')
    return
  }

  const slugs = readRegisteredSlugs()
  if (slugs.length === 0) {
    console.warn('[verify] no presentations registered in src/presentations/index.ts; skipping render check')
    return
  }

  console.log(`[verify] starting preview on ${BASE_URL}…`)
  // detached + killing the negative pid terminates the whole process group —
  // spawning through a shell means `preview.kill()` alone would only kill the
  // shell wrapper and leave the actual vite server running, hanging this script.
  const preview = spawn(
    'npx',
    ['vite', 'preview', '--host', HOST, '--port', String(PORT), '--strictPort'],
    { cwd: projectRoot, stdio: 'pipe', shell: true, detached: true },
  )

  try {
    await waitForServer(BASE_URL)

    const browser = await chromium.launch()
    try {
      for (const slug of slugs) {
        console.log(`[verify] rendering /${slug}…`)
        const result = await verifyRoute(browser, slug)
        if (!result.ok) {
          fail(`/${slug} — ${result.message}`)
        } else {
          console.log(`[verify] /${slug} OK (${slugs.length} route(s) checked)`)
        }
      }
    } finally {
      await browser.close()
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  } finally {
    try {
      process.kill(-preview.pid, 'SIGKILL')
    } catch {
      // process group already gone
    }
  }

  if (process.exitCode !== 1) {
    console.log('\n[verify] PASS')
  }
}

await main()
