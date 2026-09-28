#!/usr/bin/env node
/**
 * Project-local screenshot + visual-diagnostics helper.
 *
 * Usage: npm run inspect -- <slug>
 *
 * Builds the app, serves it via `vite preview` on 127.0.0.1, opens the given
 * presentation route in Playwright Chromium at a wide desktop viewport, and
 * captures one settled screenshot per step into ./screenshots/<slug>/.
 *
 * Also emits advisory (non-fatal) warnings for:
 *  - unmarked visible text/chrome overlap
 *  - indistinct active navigation (progress dots / table of contents)
 *  - missing, undersized, or browser-default attribution styling
 *
 * This is a template script meant to be simple and reliable, not exhaustive.
 * It exits 0 whenever screenshots were captured, even if warnings were
 * emitted; it exits non-zero only on a hard failure (could not build, start
 * the preview server, or navigate to the route).
 */
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const isWindows = process.platform === 'win32'
// Covers the kit's ENTER_DELAY (500ms) + ENTER_T (350ms) newcomer-entry
// animation plus a margin, so Appear-wrapped content has fully settled
// before diagnostics run and screenshots are captured.
const SETTLE_MS = 1000
const VIEWPORT = { width: 1280, height: 800 }

function usage() {
  console.error('Usage: npm run inspect -- <slug>')
}

function runBuild() {
  console.log('[inspect] building app (`npm run build`)...')
  const result = spawnSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit', shell: isWindows })
  if (result.status !== 0) {
    throw new Error('build failed; cannot inspect an app that does not build')
  }
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : null
      server.close(() => (port ? resolve(port) : reject(new Error('could not allocate a free port'))))
    })
  })
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return
    } catch {
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`preview server at ${url} did not become ready within ${timeoutMs}ms`)
}

/** Kills a spawned process and waits for it to actually exit, so the port is released before this script exits. */
function terminate(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve()
      return
    }
    child.once('exit', () => resolve())
    child.kill()
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    }, 3000).unref()
  })
}

/** Fails loudly (rejects) if the root's data-step-index never reaches `expected`, instead of silently capturing a stale/repeated step. */
async function waitForStepIndex(page, expected, timeoutMs = 10000) {
  await page.waitForFunction(
    (index) => document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') === String(index),
    expected,
    { timeout: timeoutMs },
  )
}

/** Advisory: does individual step content visually collide with header/footer/toc chrome? */
async function checkOverlap(page) {
  // Measured in one in-page pass so each step costs a single round trip
  // regardless of how many scene nodes are on stage.
  const collisions = await page.evaluate(() => {
    const intersects = (a, b) =>
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
    const chrome = ['[data-presentation-header]', '[data-presentation-footer]', '[data-presentation-toc]']
      .map((selector) => ({ selector, el: document.querySelector(selector) }))
      .filter(({ el }) => el && el.getClientRects().length > 0)
      .map(({ selector, el }) => ({ selector, rect: el.getBoundingClientRect() }))
    if (chrome.length === 0) return []

    const found = []
    for (const el of document.querySelectorAll('[data-presentation-stage] [data-presentation-node]')) {
      if (el.closest('[data-presentation-allow-overlap="true"]')) continue
      if (el.getClientRects().length === 0) continue
      const rect = el.getBoundingClientRect()
      const hit = chrome.find((c) => intersects(rect, c.rect))
      if (hit) {
        found.push({
          description: el.getAttribute('data-presentation-node') ?? el.tagName.toLowerCase(),
          selector: hit.selector,
        })
      }
    }
    return found
  })

  return collisions.map(
    ({ description, selector }) =>
      `stage content (${description}) overlaps ${selector}; mark it with data-presentation-allow-overlap="true" if intentional`,
  )
}

/** Advisory: is the active nav item visually indistinct from an inactive sibling? */
async function checkActiveDistinctness(page, itemSelector) {
  const activeHandle = page.locator(`${itemSelector}[data-presentation-active="true"]`).first()
  const inactiveHandle = page.locator(`${itemSelector}:not([data-presentation-active="true"])`).first()
  const activeCount = await activeHandle.count()
  const inactiveCount = await inactiveHandle.count()
  if (activeCount === 0 || inactiveCount === 0) return null

  // Compares the item and its descendants (e.g. the progress-dot hook) across
  // the properties presentations commonly use to mark the active state.
  const visualSignature = (el) => {
    const properties = [
      'color',
      'backgroundColor',
      'fontWeight',
      'opacity',
      'borderColor',
      'borderWidth',
      'boxShadow',
      'outlineColor',
      'outlineStyle',
      'outlineWidth',
      'textDecorationLine',
      'transform',
      'filter',
    ]
    return [el, ...el.querySelectorAll('*')]
      .map((node) => {
        const s = window.getComputedStyle(node)
        return properties.map((property) => s[property]).join('|')
      })
      .join('\n')
  }
  const [activeSignature, inactiveSignature] = await Promise.all([
    activeHandle.evaluate(visualSignature),
    inactiveHandle.evaluate(visualSignature),
  ])

  if (activeSignature === inactiveSignature) {
    return `${itemSelector}[data-presentation-active="true"] is visually identical to an inactive sibling (same computed color, background, weight, opacity, border, shadow, outline, decoration, transform, and filter, including descendants)`
  }
  return null
}

/** Advisory: attribution missing, undersized, or left at browser-default link styling. */
async function checkAttribution(page) {
  const attribution = page.locator('[data-presentation-attribution]').first()
  const count = await attribution.count()
  if (count === 0) return 'no [data-presentation-attribution] element found'

  const style = await attribution.evaluate((el) => {
    const s = window.getComputedStyle(el)
    return { fontSize: parseFloat(s.fontSize), color: s.color }
  })

  if (Number.isFinite(style.fontSize) && style.fontSize < 10) {
    return `attribution font-size (${style.fontSize}px) is below the 10px legibility threshold`
  }
  if (style.color === 'rgb(0, 0, 238)') {
    return 'attribution appears to use untouched browser-default link styling (rgb(0, 0, 238))'
  }
  return null
}

async function main() {
  const slug = process.argv[2]
  if (!slug) {
    usage()
    process.exit(1)
  }

  runBuild()

  const outDir = path.join(ROOT, 'screenshots', slug)
  mkdirSync(outDir, { recursive: true })

  const port = await getFreePort()
  const host = '127.0.0.1'
  const baseUrl = `http://${host}:${port}`

  console.log(`[inspect] starting \`vite preview\` on ${baseUrl} ...`)
  const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  const preview = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  )

  const summary = []
  const consoleErrors = []
  try {
    await waitForServer(baseUrl)

    const { chromium } = await import('playwright')
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: VIEWPORT })
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })
      page.on('pageerror', (err) => consoleErrors.push(err.message))

      await page.goto(`${baseUrl}/${slug}`, { waitUntil: 'networkidle' })
      const root = page.locator('[data-presentation-root]')
      await root.waitFor({ state: 'attached', timeout: 10000 })

      const stepCount = Number(await root.getAttribute('data-step-count'))
      if (!Number.isFinite(stepCount) || stepCount < 1) {
        throw new Error(`invalid data-step-count on route /${slug}`)
      }

      for (let step = 0; step < stepCount; step += 1) {
        await waitForStepIndex(page, step)
        await page.waitForTimeout(SETTLE_MS)

        const warnings = []
        const overlapWarnings = await checkOverlap(page)
        warnings.push(...overlapWarnings)

        const progressWarning = await checkActiveDistinctness(page, '[data-presentation-progress-item]')
        if (progressWarning) warnings.push(progressWarning)

        const tocWarning = await checkActiveDistinctness(page, '[data-presentation-toc-item]')
        if (tocWarning) warnings.push(tocWarning)

        const attributionWarning = await checkAttribution(page)
        if (attributionWarning) warnings.push(attributionWarning)

        // Full-viewport screenshot is the primary capture: it's the only one
        // that shows chrome (header, caption, nav, ToC, attribution)
        // alongside the stage, so clipped captions, unreadable attribution,
        // and navigation layout defects are actually visible in review.
        const fileName = `step-${String(step).padStart(2, '0')}.png`
        const filePath = path.join(outDir, fileName)
        await page.screenshot({ path: filePath })

        // Supplementary stage-only crop, useful for close inspection of the
        // diagram itself.
        const stage = page.locator('[data-presentation-stage]')
        if ((await stage.count()) > 0) {
          const stageFileName = `step-${String(step).padStart(2, '0')}-stage.png`
          await stage.screenshot({ path: path.join(outDir, stageFileName) }).catch(() => {})
        }

        summary.push({ filePath, warnings })

        if (step < stepCount - 1) {
          await page.keyboard.press('ArrowRight')
        }
      }
    } finally {
      await browser.close()
    }
  } finally {
    await terminate(preview)
  }

  console.log(`\n[inspect] Captured ${summary.length} screenshot(s) for "${slug}":\n`)
  for (const { filePath, warnings } of summary) {
    console.log(`  ${filePath}`)
    for (const warning of warnings) {
      console.log(`    - WARNING: ${warning}`)
    }
  }
  if (consoleErrors.length > 0) {
    console.log('  (console)')
    for (const error of consoleErrors) {
      console.log(`    - WARNING: console/page error: ${error}`)
    }
  }
  console.log('')

  process.exit(0)
}

main().catch((err) => {
  console.error(`[inspect] FAILED: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`)
  process.exit(1)
})
