#!/usr/bin/env node
// Deterministic build + browser-render verification.
//
// 1. Builds the whole app (tsc -b && vite build); fails on any type/build error.
// 2. Confirms the committed nine-step reference sample is registered and
//    implements the canonical outline in order.
// 3. Starts `vite preview` bound to 127.0.0.1 and waits for it to answer.
// 4. Uses Playwright/Chromium to open every registered presentation route,
//    step through every step via the chrome's data-step-count/data-step-index
//    hooks, and fail on console errors, uncaught page errors, or a step index
//    that does not advance.
// 5. Re-opens each route at a phone-width viewport and fails if the browse-mode
//    table of contents is still visible (it is scoped to wide viewports).
// 6. Exits non-zero with the failing check/step reported.

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'
import { extractStepMeta, validateCanonicalOrder } from './canonical-steps.mjs'

const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../..')
const HOST = '127.0.0.1'
const PORT = Number(process.env.VERIFY_PORT ?? 4173)
const BASE_URL = `http://${HOST}:${PORT}`

// Appear nodes mount after ENTER_DELAY (0.5s) and fade in over ENTER_T (0.35s)
// — see src/presentation-kit/constants.ts. Wait past both, plus a buffer, so
// every step is inspected in its settled state.
const STEP_SETTLE_MS = 900

// Short on purpose: by the time this is read the step has already settled, so a
// missing root means the tree unmounted rather than that it is still rendering.
const ROOT_ATTR_TIMEOUT_MS = 5_000

const NARROW_VIEWPORT = { width: 390, height: 800 }

const REFERENCE_SAMPLE_SLUG = 'how-to-make-a-presentation'
const REFERENCE_SAMPLE_DIR = path.join(projectRoot, 'src/presentations/how-to-make-a-presentation')

function fail(message) {
  console.error(`\n[verify] FAIL: ${message}`)
  process.exitCode = 1
}

function readRegisteredSlugs() {
  const indexPath = path.join(projectRoot, 'src/presentations/index.ts')
  const source = readFileSync(indexPath, 'utf8')
  return [...source.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
}

// Reads src/presentations/how-to-make-a-presentation/steps/index.ts to learn
// the step import order, then extracts era/title/caption from each imported
// step file, in that order — the same order the chrome renders them in.
function readSampleStepMetas() {
  const stepsIndexPath = path.join(REFERENCE_SAMPLE_DIR, 'steps/index.ts')
  if (!existsSync(stepsIndexPath)) {
    throw new Error(`missing ${path.relative(projectRoot, stepsIndexPath)}`)
  }
  const indexSource = readFileSync(stepsIndexPath, 'utf8')

  const fileByName = new Map()
  for (const match of indexSource.matchAll(/import\s*\{\s*(\w+)\s*\}\s*from\s*'\.\/(\w+)'/g)) {
    fileByName.set(match[1], match[2])
  }

  const arrayMatch = indexSource.match(/STEPS[^=]*=\s*\[([^\]]*)\]/)
  if (!arrayMatch) {
    throw new Error(`could not find a STEPS array in ${path.relative(projectRoot, stepsIndexPath)}`)
  }
  const names = arrayMatch[1]
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  return names.map((name) => {
    const file = fileByName.get(name)
    if (!file) throw new Error(`step "${name}" is not imported in ${path.relative(projectRoot, stepsIndexPath)}`)
    const stepFilePath = path.join(REFERENCE_SAMPLE_DIR, 'steps', `${file}.tsx`)
    const source = readFileSync(stepFilePath, 'utf8')
    const meta = extractStepMeta(source)
    if (!meta) throw new Error(`could not parse era/title/caption from ${path.relative(projectRoot, stepFilePath)}`)
    return meta
  })
}

function assertReferenceSample() {
  const slugs = readRegisteredSlugs()
  if (!slugs.includes(REFERENCE_SAMPLE_SLUG)) {
    throw new Error(`reference sample "${REFERENCE_SAMPLE_SLUG}" is not registered in src/presentations/index.ts`)
  }
  if (!existsSync(REFERENCE_SAMPLE_DIR)) {
    throw new Error(`reference sample directory is missing: ${path.relative(projectRoot, REFERENCE_SAMPLE_DIR)}`)
  }

  const metas = readSampleStepMetas()
  const result = validateCanonicalOrder(metas)
  if (!result.ok) {
    throw new Error(`reference sample does not match the canonical nine-step outline: ${result.message}`)
  }
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
    // Let the step settle before inspecting it. Appear nodes mount only after
    // ENTER_DELAY and then fade in over ENTER_T, so checking sooner inspects a
    // half-mounted step and misses errors thrown by the delayed content —
    // including on the final step, where nothing re-checks afterwards.
    await page.waitForTimeout(STEP_SETTLE_MS)

    // Consult captured errors before touching the DOM. An uncaught render error
    // unmounts the tree, taking [data-presentation-root] with it, so reading
    // data-step-index first stalls for the full locator timeout and then reports
    // that timeout instead of the page error we already hold.
    if (errors.length > 0) {
      await page.close()
      return { slug, ok: false, message: `step ${index}: ${errors.join('; ')}` }
    }

    let raw
    try {
      raw = await root.getAttribute('data-step-index', { timeout: ROOT_ATTR_TIMEOUT_MS })
    } catch {
      // The root went away without a captured error — still identify the step.
      const detail = errors.length > 0 ? errors.join('; ') : 'the presentation root disappeared'
      await page.close()
      return { slug, ok: false, message: `step ${index}: ${detail}` }
    }

    // Check for the attribute before converting: `Number(null)` is 0, so a root
    // that never renders the hook at all would otherwise satisfy step 0 — and on
    // a single-step presentation nothing later would catch it.
    if (raw === null || !Number.isInteger(Number(raw))) {
      await page.close()
      return {
        slug,
        ok: false,
        message: `step ${index}: [data-presentation-root] has no integer data-step-index (got ${JSON.stringify(raw)})`,
      }
    }
    const current = Number(raw)
    if (current !== index) {
      await page.close()
      return { slug, ok: false, message: `step ${index}: expected data-step-index=${index}, got ${current}` }
    }
    if (index < stepCount - 1) {
      await page.keyboard.press('ArrowRight')
    }
  }

  if (errors.length > 0) {
    await page.close()
    return { slug, ok: false, message: errors.join('; ') }
  }

  await page.close()
  return { slug, ok: true }
}

// The browse-mode table of contents is scoped to wide viewports. The kit
// renders it unconditionally in browse mode (visibility is a style decision the
// presentation owns), so this asserts each presentation actually collapses it
// at a phone-width viewport instead of leaving it floating over the scene.
async function verifyNarrowViewport(browser, slug) {
  const page = await browser.newPage({ viewport: NARROW_VIEWPORT })
  try {
    await page.goto(`${BASE_URL}/${slug}`, { waitUntil: 'networkidle' })

    // isVisible() is false for an element that does not exist, so this also
    // covers a presentation that renders no table of contents at all.
    const toc = page.locator('[data-presentation-chrome="toc"]')
    if (await toc.first().isVisible()) {
      return {
        ok: false,
        message: `table of contents is still visible at ${NARROW_VIEWPORT.width}px; scope it to wide viewports in this presentation's CSS`,
      }
    }
    return { ok: true }
  } finally {
    await page.close()
  }
}

async function main() {
  console.log('[verify] building the whole app…')
  const build = spawnSync('npm', ['run', 'build'], { cwd: projectRoot, stdio: 'inherit', shell: true })
  if (build.status !== 0) {
    fail('npm run build reported a type or build error')
    return
  }

  console.log('[verify] checking the reference sample against the canonical outline…')
  try {
    assertReferenceSample()
    console.log(`[verify] reference sample "${REFERENCE_SAMPLE_SLUG}" matches the canonical nine-step outline`)
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
    return
  }

  const slugs = readRegisteredSlugs()

  console.log(`[verify] starting preview on ${BASE_URL}…`)
  // detached + killing the negative pid terminates the whole process group —
  // spawning through a shell means `preview.kill()` alone would only kill the
  // shell wrapper and leave the actual vite server running.
  const preview = spawn('npx', ['vite', 'preview', '--host', HOST, '--port', String(PORT), '--strictPort'], {
    cwd: projectRoot,
    stdio: 'ignore',
    shell: true,
    detached: true,
  })

  try {
    await waitForServer(BASE_URL)

    const browser = await chromium.launch()
    try {
      for (const slug of slugs) {
        console.log(`[verify] rendering /${slug}…`)
        const result = await verifyRoute(browser, slug)
        if (!result.ok) fail(`/${slug} — ${result.message}`)

        const narrow = await verifyNarrowViewport(browser, slug)
        if (!narrow.ok) fail(`/${slug} — ${narrow.message}`)

        if (result.ok && narrow.ok) {
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
